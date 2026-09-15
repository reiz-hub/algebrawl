// services/supabaseSync.ts
import { supabase } from './supabase';

export interface UserData {
  email?: string;
  username?: string;
  ingameName?: string;
  isGuest?: boolean;
  isActive?: boolean;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  xp: number;
  totalBattles: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  coins?: number;
  inventory?: string[];
  equippedCharacter?: string;
  equippedGear?: string | null;
  mmr?: number;
  onlineWins?: number;
  onlineLosses?: number;
  skillStocks?: Record<string, number>;
  createdAt?: any;
}

/* ── Internal mapping helpers ──────────────────────────── */

/** Convert camelCase UserData fields to snake_case DB columns. */
const toDbRow = (data: Partial<UserData>): Record<string, any> => {
  const row: Record<string, any> = {};
  if (data.email !== undefined) row.email = data.email;
  if (data.username !== undefined) row.username = data.username;
  if (data.ingameName !== undefined) row.ingame_name = data.ingameName;
  if (data.isGuest !== undefined) row.is_guest = data.isGuest;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  if (data.unlockedLevel !== undefined) row.unlocked_level = data.unlockedLevel;
  if (data.levelStars !== undefined) row.level_stars = data.levelStars;
  if (data.xp !== undefined) row.xp = data.xp;
  if (data.totalBattles !== undefined) row.total_battles = data.totalBattles;
  if (data.wins !== undefined) row.wins = data.wins;
  if (data.currentStreak !== undefined) row.current_streak = data.currentStreak;
  if (data.maxStreak !== undefined) row.max_streak = data.maxStreak;
  if (data.coins !== undefined) row.coins = data.coins;
  if (data.inventory !== undefined) row.inventory = data.inventory;
  if (data.equippedCharacter !== undefined) row.equipped_character = data.equippedCharacter;
  if (data.equippedGear !== undefined) row.equipped_gear = data.equippedGear;
  if (data.mmr !== undefined) row.mmr = data.mmr;
  if (data.onlineWins !== undefined) row.online_wins = data.onlineWins;
  if (data.onlineLosses !== undefined) row.online_losses = data.onlineLosses;
  if (data.skillStocks !== undefined) row.skill_stocks = data.skillStocks;
  return row;
};

/** Convert snake_case DB row to camelCase UserData. */
const fromDbRow = (row: any): UserData => ({
  email: row.email ?? undefined,
  username: row.username ?? undefined,
  ingameName: row.ingame_name ?? row.username ?? undefined,
  isGuest: row.is_guest ?? undefined,
  isActive: row.is_active ?? undefined,
  unlockedLevel: row.unlocked_level ?? 1,
  levelStars: row.level_stars ?? {},
  xp: row.xp ?? 0,
  totalBattles: row.total_battles ?? 0,
  wins: row.wins ?? 0,
  currentStreak: row.current_streak ?? 0,
  maxStreak: row.max_streak ?? 0,
  coins: row.coins ?? 100,
  inventory: row.inventory ?? ['char_algebro'],
  equippedCharacter: row.equipped_character ?? 'char_algebro',
  equippedGear: row.equipped_gear ?? null,
  mmr: row.mmr ?? 1000,
  onlineWins: row.online_wins ?? 0,
  onlineLosses: row.online_losses ?? 0,
  skillStocks: row.skill_stocks ?? {},
  createdAt: row.created_at ?? undefined,
});

/* ── Public API (same signatures as the old firestoreSync) ── */

/**
 * Check whether a user account is active.
 * Returns false if the account has been deactivated by an admin.
 * Returns true if the row doesn't exist or is_active is not explicitly false.
 */
export const checkAccountStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (error || !data) return true; // No row = no restriction
    return data.is_active !== false;
  } catch (error) {
    console.warn('[Supabase] Account status check failed:', error);
    return true; // Fail open so offline users aren't locked out
  }
};

/**
 * Write user data to Supabase.
 * Uses upsert with merge semantics — only provided fields are updated.
 * Silently catches errors.
 */
export const syncToSupabase = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    const row = toDbRow(data);
    row.id = userId;
    await supabase.from('users').upsert(row, { onConflict: 'id' });
  } catch (error) {
    console.warn('[Supabase] Write failed:', error);
  }
};

// Keep old name as alias for compatibility with useGameStore
export const syncToFirestore = syncToSupabase;

/**
 * Read user data from Supabase.
 * Returns null if the row doesn't exist or on error.
 */
export const fetchFromSupabase = async (userId: string): Promise<UserData | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return fromDbRow(data);
  } catch (error) {
    console.warn('[Supabase] Read failed:', error);
    return null;
  }
};

// Keep old name as alias for compatibility with useGameStore
export const fetchFromFirestore = fetchFromSupabase;

/**
 * Create a new user row (first launch with a new guestId).
 * Uses upsert with onConflict ignore to prevent overwriting existing rows.
 */
export const createUserDoc = async (userId: string): Promise<void> => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existing) {
      await supabase.from('users').insert({
        id: userId,
        is_guest: true,
        unlocked_level: 1,
        level_stars: {},
        xp: 0,
        total_battles: 0,
        wins: 0,
        current_streak: 0,
        max_streak: 0,
        coins: 100,
        inventory: ['char_algebro'],
        equipped_character: 'char_algebro',
        equipped_gear: null,
      });
    }
  } catch (error) {
    console.warn('[Supabase] Create user doc failed:', error);
  }
};

/**
 * Claim a username for a guest account.
 */
export const claimUsername = async (userId: string, username: string): Promise<void> => {
  try {
    await supabase
      .from('users')
      .update({ username })
      .eq('id', userId);
  } catch (error) {
    console.warn('[Supabase] Claim username failed:', error);
  }
};

/**
 * Look up a userId by username (case-insensitive).
 */
export const lookupByUsername = async (
  username: string
): Promise<{ userId: string; data: UserData } | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      userId: data.id,
      data: fromDbRow(data),
    };
  } catch (error) {
    console.warn('[Supabase] Username lookup failed:', error);
    return null;
  }
};

/**
 * Look up a userId by ingameName.
 */
export const lookupByIngameName = async (
  ingameName: string
): Promise<{ userId: string; data: UserData } | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('ingame_name', ingameName)
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      userId: data.id,
      data: fromDbRow(data),
    };
  } catch (error) {
    console.warn('[Supabase] Ingame name lookup failed:', error);
    return null;
  }
};

/**
 * Look up a userId by email (case-insensitive).
 */
export const lookupByEmail = async (
  email: string
): Promise<{ userId: string; data: UserData } | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.trim())
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      userId: data.id,
      data: fromDbRow(data),
    };
  } catch (error) {
    console.warn('[Supabase] Email lookup failed:', error);
    return null;
  }
};

/**
 * Resolves all candidate auth emails for a given username or email input.
 * Queries `users` table and the `get_auth_email` RPC to determine the exact
 * Supabase auth email, ensuring players can seamlessly log in with either
 * their username or linked Gmail under any circumstance.
 */
export const resolveLoginEmails = async (
  input: string
): Promise<{
  candidates: string[];
  userRecord: UserData | null;
  userId: string | null;
}> => {
  const trimmed = input.trim();
  const isEmail = trimmed.includes('@');
  const candidates: string[] = [];
  const add = (email?: string | null) => {
    if (!email) return;
    const clean = email.trim().toLowerCase();
    if (clean && !candidates.includes(clean)) {
      candidates.push(clean);
    }
  };

  let userRecord: UserData | null = null;
  let userId: string | null = null;

  if (isEmail) {
    const found = await lookupByEmail(trimmed);
    if (found) {
      userRecord = found.data;
      userId = found.userId;
    }
  } else {
    const found = await lookupByUsername(trimmed);
    if (found) {
      userRecord = found.data;
      userId = found.userId;
    }
  }

  // 1. Primary: Exact email in Supabase auth.users from database function
  if (userId) {
    try {
      const { data: authEmail } = await supabase.rpc('get_auth_email', {
        target_user_id: userId,
      });
      if (authEmail) {
        add(authEmail);
      }
    } catch (err) {
      console.warn('[Supabase] get_auth_email failed:', err);
    }
  }

  // 2. If typed input is an email, try it directly
  if (isEmail) {
    add(trimmed);
  }

  // 3. The linked email stored in the users table
  if (userRecord?.email) {
    add(userRecord.email);
  }

  // 4. The internal @algebrawls.local fallback
  const username = userRecord?.username || (!isEmail ? trimmed : null);
  if (username) {
    add(`${username.toLowerCase()}@algebrawls.local`);
  }

  return { candidates, userRecord, userId };
};

