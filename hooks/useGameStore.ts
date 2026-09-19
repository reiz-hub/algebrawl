// hooks/useGameStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { IS_DEV_BUILD } from '../constants/devMode';
import { SHOP_ITEMS } from '../constants/shopItems';
import { STARTING_MMR } from '../services/mmrService';
import { supabase } from '../services/supabase';
import {
  fetchFromFirestore,
  syncToFirestore,
  UserData,
} from '../services/supabaseSync';
import { PurchaseResult } from '../types/shop';
import { isTitleBannerUnlocked } from '../constants/titleBanners';

const STORAGE_KEY_USER_ID = '@algebrawl_userId';
const STORAGE_KEY_USERNAME = '@algebrawl_username';
const STORAGE_KEY_INGAMENAME = '@algebrawl_ingamename';
const STORAGE_KEY_EMAIL = '@algebrawl_email';
const STORAGE_KEY_GAME_STATE = '@algebrawl_gameState';

export const BASE_INVENTORY = ['g1', 's1', 'c0', 'char_algebro', 'c5', 'char_algegal'];

interface GameState {
  // Auth
  userId: string | null;
  username: string | null;
  ingameName: string | null;
  email: string | null;
  isLoaded: boolean;
  isLoggedIn: boolean;

  // Game progress
  unlockedLevel: number;
  totalXP: number;
  totalBattlesWon: number;
  totalBattles: number;
  currentStreak: number;
  maxStreak: number;
  levelStars: Record<number, number>;

  // Economy & Inventory
  coins: number;
  inventory: string[];
  equippedCharacter: string;
  equippedGear: string | null;
  equippedTitle: string;
  skillStocks: Record<string, number>;

  // Multiplayer MMR
  mmr: number;
  onlineWins: number;
  onlineLosses: number;

  // Actions
  loadLocalData: () => Promise<void>;
  recordLevelProgress: (levelId: number, score: number, didWin: boolean) => void;
  updateStats: (xpToAdd: number, isWin: boolean, coinsEarned?: number) => void;
  setUsername: (username: string) => void;
  setIngameName: (ingameName: string) => void;
  setEmail: (email: string | null) => void;
  loginWithData: (userId: string, data: UserData) => void;
  logout: () => Promise<void>;
  getUserId: () => string | null;

  // Multiplayer Actions
  updateMmr: (mmrChange: number, isWin: boolean) => void;

  // Shop & Inventory Actions
  buyItem: (itemId: string) => PurchaseResult;
  equipItem: (itemId: string) => void;
  equipTitle: (titleId: string) => void;
  addCoins: (amount: number) => void;
  unlockAllDev: () => void;

  // Dev Mode
  devModeEnabled: boolean;
  toggleDevMode: () => void;

  // Consumable Skill Actions
  consumeSkill: (skillId: string) => boolean;
  getSkillStock: (skillId: string) => number;
}

/**
 * Snapshot of real game state saved before dev mode is enabled.
 * Used to restore the real progress when dev mode is turned off.
 */
let devModeSnapshot: Record<string, any> | null = null;

/**
 * Persist game state to AsyncStorage.
 * Skipped when dev mode is active to protect real save data.
 */
const persistLocally = async (state: Partial<GameState>) => {
  // Don't save dev-inflated state to storage
  if (state.devModeEnabled) return;

  try {
    const saveable = {
      unlockedLevel: state.unlockedLevel,
      totalXP: state.totalXP,
      totalBattlesWon: state.totalBattlesWon,
      totalBattles: state.totalBattles,
      currentStreak: state.currentStreak,
      maxStreak: state.maxStreak,
      levelStars: state.levelStars,
      coins: state.coins,
      inventory: state.inventory,
      equippedCharacter: state.equippedCharacter,
      equippedGear: state.equippedGear,
      equippedTitle: state.equippedTitle,
      skillStocks: state.skillStocks,
      mmr: state.mmr,
      onlineWins: state.onlineWins,
      onlineLosses: state.onlineLosses,
    };
    await AsyncStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(saveable));
  } catch (error) {
    console.warn('[AsyncStorage] Save failed:', error);
  }
};

/**
 * Sync current game state to Firestore / Supabase.
 * Skipped when dev mode is active to protect real cloud data.
 */
const syncToCloud = async (userId: string | null, state: Partial<GameState>) => {
  // Don't sync dev-inflated state to cloud
  if (state.devModeEnabled) return;

  if (!userId) return;
  await syncToFirestore(userId, {
    isGuest: !state.isLoggedIn,
    ...(state.email ? { email: state.email } : {}),
    ...(state.username ? { username: state.username } : {}),
    ...(state.ingameName ? { ingameName: state.ingameName } : {}),
    unlockedLevel: state.unlockedLevel ?? 1,
    levelStars: state.levelStars ?? {},
    xp: state.totalXP ?? 0,
    totalBattles: state.totalBattles ?? 0,
    wins: state.totalBattlesWon ?? 0,
    currentStreak: state.currentStreak ?? 0,
    maxStreak: state.maxStreak ?? 0,
    coins: state.coins ?? 100,
    inventory: state.inventory ?? ['char_algebro'],
    equippedCharacter: state.equippedCharacter ?? 'char_algebro',
    equippedGear: state.equippedGear ?? null,
    equippedTitle: state.equippedTitle ?? 'novice',
    skillStocks: state.skillStocks ?? {},
    mmr: state.mmr ?? STARTING_MMR,
    onlineWins: state.onlineWins ?? 0,
    onlineLosses: state.onlineLosses ?? 0,
  });
};

export const useGameStore = create<GameState>((set, get) => ({
  // Auth state
  userId: null,
  username: null,
  ingameName: null,
  email: null,
  isLoaded: false,
  isLoggedIn: false,

  // Game progress defaults
  unlockedLevel: 1,
  totalXP: 0,
  totalBattlesWon: 0,
  totalBattles: 0,
  currentStreak: 0,
  maxStreak: 0,
  levelStars: {},

  // Economy & Inventory defaults
  coins: 100,
  inventory: ['g1', 's1', 'c0', 'char_algebro', 'c5', 'char_algegal'],
  equippedCharacter: 'c0',
  equippedGear: 'g1',
  equippedTitle: 'novice',
  skillStocks: {},

  // Multiplayer MMR defaults
  mmr: STARTING_MMR,
  onlineWins: 0,
  onlineLosses: 0,

  // Dev mode (off by default, must be manually enabled)
  devModeEnabled: false,

  /**
   * Initialize: load userId from Supabase Auth session (or anonymous sign-in),
   * load local game state, then attempt to sync with Firestore/Supabase.
   */
  loadLocalData: async () => {
    try {
      // 1. Resolve auth session / userId
      let userId = await AsyncStorage.getItem(STORAGE_KEY_USER_ID);
      let sessionUser: any = null;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          sessionUser = sessionData.session.user;
          userId = sessionUser.id;
          await AsyncStorage.setItem(STORAGE_KEY_USER_ID, sessionUser.id);
        } else {
          // No active session — try anonymous sign in
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (anonData?.user) {
            sessionUser = anonData.user;
            userId = anonData.user.id;
            await AsyncStorage.setItem(STORAGE_KEY_USER_ID, anonData.user.id);
          } else {
            console.warn('[useGameStore] Anonymous sign-in failed:', anonError);
            if (!userId) {
              const fallbackId = Crypto.randomUUID();
              userId = fallbackId;
              await AsyncStorage.setItem(STORAGE_KEY_USER_ID, fallbackId);
            }
          }
        }
      } catch (authErr) {
        console.warn('[useGameStore] Auth init error, using fallback:', authErr);
        if (!userId) {
          const fallbackId = Crypto.randomUUID();
          userId = fallbackId;
          await AsyncStorage.setItem(STORAGE_KEY_USER_ID, fallbackId);
        }
      }

      // 2. Load username, ingameName, email if set
      const username = await AsyncStorage.getItem(STORAGE_KEY_USERNAME);
      const ingameName = await AsyncStorage.getItem(STORAGE_KEY_INGAMENAME);
      const email = await AsyncStorage.getItem(STORAGE_KEY_EMAIL);

      // 3. Load local game state
      const savedJson = await AsyncStorage.getItem(STORAGE_KEY_GAME_STATE);
      let localState = savedJson ? JSON.parse(savedJson) : null;

      // 4. Try to fetch from Supabase (may have newer data from another device)
      const cloudData = userId ? await fetchFromFirestore(userId) : null;

      if (cloudData) {
        // Merge inventory lists (union)
        const combinedInventory = Array.from(
          new Set([
            ...BASE_INVENTORY,
            ...(localState?.inventory ?? []),
            ...(cloudData.inventory ?? []),
          ])
        );

        // Merge: take the best of local vs cloud
        const merged = {
          unlockedLevel: Math.max(
            localState?.unlockedLevel ?? 1,
            cloudData.unlockedLevel ?? 1
          ),
          totalXP: Math.max(
            localState?.totalXP ?? 0,
            cloudData.xp ?? 0
          ),
          totalBattlesWon: Math.max(
            localState?.totalBattlesWon ?? 0,
            cloudData.wins ?? 0
          ),
          totalBattles: Math.max(
            localState?.totalBattles ?? 0,
            cloudData.totalBattles ?? 0
          ),
          currentStreak: Math.max(
            localState?.currentStreak ?? 0,
            cloudData.currentStreak ?? 0
          ),
          maxStreak: Math.max(
            localState?.maxStreak ?? 0,
            cloudData.maxStreak ?? 0
          ),
          levelStars: {} as Record<number, number>,
          coins: Math.max(
            localState?.coins ?? 100,
            cloudData.coins ?? 100
          ),
          inventory: combinedInventory,
          equippedCharacter:
            cloudData.equippedCharacter ||
            localState?.equippedCharacter ||
            'char_algebro',
          equippedGear:
            cloudData.equippedGear !== undefined
              ? cloudData.equippedGear
              : localState?.equippedGear ?? null,
          equippedTitle:
            cloudData.equippedTitle ||
            localState?.equippedTitle ||
            'novice',
          skillStocks: {} as Record<string, number>,
          mmr: cloudData.mmr ?? localState?.mmr ?? STARTING_MMR,
          onlineWins: Math.max(
            localState?.onlineWins ?? 0,
            cloudData.onlineWins ?? 0
          ),
          onlineLosses: Math.max(
            localState?.onlineLosses ?? 0,
            cloudData.onlineLosses ?? 0
          ),
        };

        // Merge levelStars — take best per level
        const allLevels = new Set([
          ...Object.keys(localState?.levelStars ?? {}),
          ...Object.keys(cloudData.levelStars ?? {}),
        ]);
        for (const key of allLevels) {
          const numKey = Number(key);
          merged.levelStars[numKey] = Math.max(
            localState?.levelStars?.[numKey] ?? 0,
            cloudData.levelStars?.[numKey] ?? 0
          );
        }

        // Merge skillStocks — take max per skill
        const allSkillKeys = new Set([
          ...Object.keys(localState?.skillStocks ?? {}),
          ...Object.keys(cloudData.skillStocks ?? {}),
        ]);
        for (const key of allSkillKeys) {
          merged.skillStocks[key] = Math.max(
            localState?.skillStocks?.[key] ?? 0,
            cloudData.skillStocks?.[key] ?? 0
          );
        }

        localState = merged;
      }

      const finalUsername = username || cloudData?.username || null;
      const finalIngameName = ingameName || cloudData?.ingameName || null;
      const finalEmail = email || cloudData?.email || sessionUser?.email || null;
      const isUserLoggedIn = !!finalUsername && (!sessionUser || !sessionUser.is_anonymous);

      set({
        userId,
        username: finalUsername,
        ingameName: finalIngameName,
        email: finalEmail,
        isLoaded: true,
        isLoggedIn: isUserLoggedIn,
        unlockedLevel: localState?.unlockedLevel ?? 1,
        totalXP: localState?.totalXP ?? 0,
        totalBattlesWon: localState?.totalBattlesWon ?? 0,
        totalBattles: localState?.totalBattles ?? 0,
        currentStreak: localState?.currentStreak ?? 0,
        maxStreak: localState?.maxStreak ?? 0,
        levelStars: localState?.levelStars ?? {},
        coins: localState?.coins ?? 100,
        inventory: Array.from(new Set([...(localState?.inventory ?? BASE_INVENTORY), ...BASE_INVENTORY])),
        equippedCharacter: localState?.equippedCharacter ?? 'char_algebro',
        equippedGear: localState?.equippedGear ?? null,
        equippedTitle: localState?.equippedTitle ?? 'novice',
        skillStocks: localState?.skillStocks ?? {},
        mmr: localState?.mmr ?? STARTING_MMR,
        onlineWins: localState?.onlineWins ?? 0,
        onlineLosses: localState?.onlineLosses ?? 0,
      });

      // Persist the merged state back
      await persistLocally(localState ?? {});



      // Save username/ingameName/email locally if we got it from cloud
      if (cloudData?.username && !username) {
        await AsyncStorage.setItem(STORAGE_KEY_USERNAME, cloudData.username);
      }
      if (cloudData?.ingameName && !ingameName) {
        await AsyncStorage.setItem(STORAGE_KEY_INGAMENAME, cloudData.ingameName);
      }
      if (finalEmail && !email) {
        await AsyncStorage.setItem(STORAGE_KEY_EMAIL, finalEmail);
      }
    } catch (error) {
      console.warn('[useGameStore] loadLocalData failed:', error);
      set({ isLoaded: true });
    }
  },

  recordLevelProgress: (levelId, score, didWin) =>
    set((state) => {
      const newState = {
        ...state,
        unlockedLevel: didWin ? Math.max(state.unlockedLevel, levelId + 1) : state.unlockedLevel,
        levelStars: {
          ...state.levelStars,
          [levelId]: Math.max(state.levelStars[levelId] || 0, score),
        },
      };

      // Persist async (fire-and-forget)
      persistLocally(newState);
      syncToCloud(state.userId, newState);

      return {
        unlockedLevel: newState.unlockedLevel,
        levelStars: newState.levelStars,
      };
    }),

  updateStats: (xpToAdd, isWin, coinsEarned) =>
    set((state) => {
      const newCurrentStreak = isWin ? state.currentStreak + 1 : 0;
      const coinReward = coinsEarned !== undefined ? coinsEarned : (isWin ? 50 : 10); // Bonus coins on battle win/completion
      const newState = {
        ...state,
        totalXP: state.totalXP + xpToAdd,
        coins: state.coins + coinReward,
        totalBattles: state.totalBattles + 1,
        totalBattlesWon: isWin
          ? state.totalBattlesWon + 1
          : state.totalBattlesWon,
        currentStreak: newCurrentStreak,
        maxStreak: Math.max(state.maxStreak, newCurrentStreak),
      };

      // Persist async (fire-and-forget)
      persistLocally(newState);
      syncToCloud(state.userId, newState);

      return {
        totalXP: newState.totalXP,
        coins: newState.coins,
        totalBattles: newState.totalBattles,
        totalBattlesWon: newState.totalBattlesWon,
        currentStreak: newState.currentStreak,
        maxStreak: newState.maxStreak,
      };
    }),

  setUsername: (username: string) => {
    const state = get();
    set({ username });

    // Persist locally and to Firestore
    AsyncStorage.setItem(STORAGE_KEY_USERNAME, username).catch(() => { });
    if (state.userId) {
      syncToFirestore(state.userId, { username }).catch(() => { });
    }
  },

  setIngameName: (ingameName: string) => {
    const state = get();
    set({ ingameName });

    AsyncStorage.setItem(STORAGE_KEY_INGAMENAME, ingameName).catch(() => { });
    if (state.userId) {
      syncToFirestore(state.userId, { ingameName }).catch(() => { });
    }
  },

  setEmail: (email: string | null) => {
    set({ email });
    if (email) {
      AsyncStorage.setItem(STORAGE_KEY_EMAIL, email).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_EMAIL).catch(() => {});
    }
  },

  loginWithData: (userId: string, data: UserData) => {
    const state = get();
    const combinedInventory = Array.from(
      new Set([
        ...BASE_INVENTORY,
        ...(state.inventory ?? []),
        ...(data.inventory ?? []),
      ])
    );

    const newState: Partial<GameState> = {
      userId,
      username: data.username ?? state.username,
      ingameName: data.ingameName ?? state.ingameName,
      email: data.email ?? state.email,
      isLoggedIn: true,
      isLoaded: true,
      unlockedLevel: Math.max(state.unlockedLevel, data.unlockedLevel ?? 1),
      totalXP: Math.max(state.totalXP, data.xp ?? 0),
      totalBattlesWon: Math.max(state.totalBattlesWon, data.wins ?? 0),
      totalBattles: Math.max(state.totalBattles, data.totalBattles ?? 0),
      currentStreak: Math.max(state.currentStreak, data.currentStreak ?? 0),
      maxStreak: Math.max(state.maxStreak, data.maxStreak ?? 0),
      levelStars: { ...state.levelStars, ...(data.levelStars ?? {}) },
      coins: Math.max(state.coins, data.coins ?? 100),
      inventory: combinedInventory,
      equippedCharacter:
        data.equippedCharacter || state.equippedCharacter || 'char_algebro',
      equippedGear:
        data.equippedGear !== undefined
          ? data.equippedGear
          : state.equippedGear,
      // Merge skillStocks — take max per skill
      skillStocks: (() => {
        const localStocks = state.skillStocks ?? {};
        const cloudStocks = data.skillStocks ?? {};
        const merged: Record<string, number> = {};
        const allKeys = new Set([...Object.keys(localStocks), ...Object.keys(cloudStocks)]);
        for (const key of allKeys) {
          merged[key] = Math.max(localStocks[key] ?? 0, cloudStocks[key] ?? 0);
        }
        return merged;
      })(),
      mmr: data.mmr ?? state.mmr ?? STARTING_MMR,
      onlineWins: data.onlineWins ?? 0,
      onlineLosses: data.onlineLosses ?? 0,
    };

    set(newState);

    // Overwrite local storage with the logged-in user's data
    AsyncStorage.setItem(STORAGE_KEY_USER_ID, userId).catch(() => { });
    if (data.username) {
      AsyncStorage.setItem(STORAGE_KEY_USERNAME, data.username).catch(() => { });
    }
    if (data.ingameName) {
      AsyncStorage.setItem(STORAGE_KEY_INGAMENAME, data.ingameName).catch(() => { });
    }
    if (data.email) {
      AsyncStorage.setItem(STORAGE_KEY_EMAIL, data.email).catch(() => { });
    }
    persistLocally(newState);

    // Also push to Firestore/Supabase with isGuest: false since user is now authenticated
    syncToFirestore(userId, {
      isGuest: false,
      email: data.email,
      username: data.username,
      ingameName: data.ingameName,
      unlockedLevel: data.unlockedLevel ?? 1,
      levelStars: data.levelStars ?? {},
      xp: data.xp ?? 0,
      totalBattles: data.totalBattles ?? 0,
      wins: data.wins ?? 0,
      currentStreak: data.currentStreak ?? 0,
      maxStreak: data.maxStreak ?? 0,
      coins: data.coins ?? 100,
      inventory: data.inventory ?? ['char_algebro'],
      equippedCharacter: data.equippedCharacter ?? 'char_algebro',
      equippedGear: data.equippedGear ?? null,
      equippedTitle: data.equippedTitle ?? 'novice',
      skillStocks: data.skillStocks ?? {},
      mmr: data.mmr ?? STARTING_MMR,
      onlineWins: data.onlineWins ?? 0,
      onlineLosses: data.onlineLosses ?? 0,
    }).catch(() => { });
  },

  logout: async () => {
    try {
      // 1. Generate guest UUID immediately
      const newGuestId = Crypto.randomUUID();

      // 2. Clear stored credentials and persist new guest ID
      await AsyncStorage.multiRemove([
        STORAGE_KEY_USERNAME,
        STORAGE_KEY_INGAMENAME,
        STORAGE_KEY_EMAIL,
      ]);
      await AsyncStorage.setItem(STORAGE_KEY_USER_ID, newGuestId);

      // 3. Reset store to fresh guest state immediately for instant UI response
      const freshState = {
        userId: newGuestId,
        username: null,
        ingameName: null,
        email: null,
        isLoggedIn: false,
        isLoaded: true,
        unlockedLevel: 1,
        totalXP: 0,
        totalBattlesWon: 0,
        totalBattles: 0,
        currentStreak: 0,
        maxStreak: 0,
        levelStars: {} as Record<number, number>,
        coins: 100,
        inventory: BASE_INVENTORY,
        equippedCharacter: 'char_algebro',
        equippedGear: null,
        equippedTitle: 'novice',
        skillStocks: {} as Record<string, number>,
        mmr: STARTING_MMR,
        onlineWins: 0,
        onlineLosses: 0,
      };

      set(freshState);
      await persistLocally(freshState);

      // 4. Perform Supabase signOut & optional anonymous sign-in in background
      (async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('[useGameStore] signOut error:', err);
        }
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          if (anonData?.user) {
            const anonUid = anonData.user.id;
            set({ userId: anonUid });
            await AsyncStorage.setItem(STORAGE_KEY_USER_ID, anonUid);
          }
        } catch (_) {}
      })();
    } catch (error) {
      console.warn('[useGameStore] logout failed:', error);
    }
  },

  getUserId: () => get().userId,

  // ── Multiplayer MMR Actions ───────────────────────────────

  updateMmr: (mmrChange: number, isWin: boolean) => {
    const state = get();
    const newMmr = Math.max(0, state.mmr + mmrChange);
    const newOnlineWins = isWin ? state.onlineWins + 1 : state.onlineWins;
    const newOnlineLosses = isWin ? state.onlineLosses : state.onlineLosses + 1;

    const newState = {
      ...state,
      mmr: newMmr,
      onlineWins: newOnlineWins,
      onlineLosses: newOnlineLosses,
    };

    set({
      mmr: newMmr,
      onlineWins: newOnlineWins,
      onlineLosses: newOnlineLosses,
    });

    persistLocally(newState);
    syncToCloud(state.userId, newState);
  },

  // ── Purchase & Inventory Actions ──────────────────────────

  buyItem: (itemId: string): PurchaseResult => {
    const state = get();
    const item = SHOP_ITEMS.find((i) => i.id === itemId);

    if (!item) {
      return { success: false, message: 'Item not found in catalog.' };
    }

    // ── Level requirement check (enforced across all shop items) ──
    const reqLevel = item.unlockLevel ?? 1;
    if (state.unlockedLevel < reqLevel) {
      return {
        success: false,
        message: `Requires Level ${reqLevel}! Reach Level ${reqLevel} in Adventure Mode to unlock.`,
        item,
      };
    }

    // ── Consumable skill handling ──
    const isConsumableSkill = item.category === 'skill' && item.isConsumable;
    if (isConsumableSkill) {
      const currentStock = state.skillStocks[itemId] ?? 0;

      // Allow repurchase even if owned — adds 1 stock (no stock limit)
      if (state.coins < item.cost) {
        const deficit = item.cost - state.coins;
        return {
          success: false,
          message: `Insufficient coins! You need ${deficit} more 🪙.`,
          item,
        };
      }

      const newCoins = state.coins - item.cost;
      const newSkillStocks = {
        ...state.skillStocks,
        [itemId]: currentStock + 1,
      };
      const newInventory = state.inventory.includes(itemId)
        ? state.inventory
        : [...state.inventory, itemId];

      const newState = {
        ...state,
        coins: newCoins,
        inventory: newInventory,
        skillStocks: newSkillStocks,
      };

      set({
        coins: newCoins,
        inventory: newInventory,
        skillStocks: newSkillStocks,
      });

      persistLocally(newState);
      syncToCloud(state.userId, newState);

      const stockLabel = currentStock > 0 ? 'Bought +1' : 'Unlocked';
      return {
        success: true,
        message: `${stockLabel} ${item.name}! Stock: ${currentStock + 1} 🎯`,
        item,
      };
    }

    // ── Standard (non-consumable) item handling (Gear & Characters) ──
    if (state.inventory.includes(itemId)) {
      return { success: false, message: `You already permanently own ${item.name}!`, item };
    }

    // Must meet coin requirement as well
    if (state.coins < item.cost) {
      const deficit = item.cost - state.coins;
      return {
        success: false,
        message: `Insufficient coins! You need ${deficit} more 🪙.`,
        item,
      };
    }

    const newCoins = state.coins - item.cost;
    const newInventory = [...state.inventory, itemId];

    let newEquippedChar = state.equippedCharacter;
    let newEquippedGear = state.equippedGear;

    if (item.category === 'character' && !newEquippedChar) {
      newEquippedChar = item.id;
    } else if (item.category === 'gear' && !newEquippedGear) {
      newEquippedGear = item.id;
    }

    const newState = {
      ...state,
      coins: newCoins,
      inventory: newInventory,
      equippedCharacter: newEquippedChar,
      equippedGear: newEquippedGear,
    };

    set({
      coins: newCoins,
      inventory: newInventory,
      equippedCharacter: newEquippedChar,
      equippedGear: newEquippedGear,
    });

    persistLocally(newState);
    syncToCloud(state.userId, newState);

    const isGear = item.category === 'gear';
    return {
      success: true,
      message: isGear
        ? `Permanently unlocked ${item.name}! You can equip it anytime.`
        : `Permanently unlocked ${item.name}!`,
      item,
    };
  },

  equipItem: (itemId: string) => {
    const state = get();
    if (!state.inventory.includes(itemId)) return;

    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    let updates: Partial<GameState> = {};
    if (item.category === 'character') {
      updates.equippedCharacter = itemId;
    } else if (item.category === 'gear') {
      updates.equippedGear = state.equippedGear === itemId ? null : itemId;
    }

    const newState = { ...state, ...updates };
    set(updates);

    persistLocally(newState);
    syncToCloud(state.userId, newState);
  },

  equipTitle: (titleId: string) => {
    const state = get();
    const isUnlocked = isTitleBannerUnlocked(titleId, {
      unlockedLevel: state.unlockedLevel,
      levelStars: state.levelStars,
      totalBattlesWon: state.totalBattlesWon,
      onlineWins: state.onlineWins,
      mmr: state.mmr,
    });
    if (!isUnlocked) return;

    const updates: Partial<GameState> = { equippedTitle: titleId };
    const newState = { ...state, ...updates };
    set(updates);

    persistLocally(newState);
    syncToCloud(state.userId, newState);
  },

  addCoins: (amount: number) => {
    const state = get();
    const newCoins = Math.max(0, state.coins + amount);
    const newState = { ...state, coins: newCoins };
    set({ coins: newCoins });

    persistLocally(newState);
    syncToCloud(state.userId, newState);
  },

  unlockAllDev: () => {
    const state = get();
    const allItems = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'char_algebro', 'char_algegal'];
    const newInventory = Array.from(new Set([...state.inventory, ...allItems]));
    const newState = {
      ...state,
      unlockedLevel: 7,
      coins: Math.max(state.coins, 9999),
      inventory: newInventory,
      skillStocks: { s2: 99, s3: 99, s4: 99 },
      levelStars: {
        ...state.levelStars,
        1: 10,
        2: 20,
        3: 20,
        4: 30,
        5: 30,
        6: 50,
        7: 105,
      },
    };
    set(newState);

    persistLocally(newState);
    syncToCloud(state.userId, newState);
  },

  toggleDevMode: () => {
    const state = get();

    if (!IS_DEV_BUILD) return; // Safety: only works in dev builds

    if (!state.devModeEnabled) {
      // ── Enabling dev mode: snapshot real state, then apply maxed values ──
      console.log('[DEV MODE] Enabled — saving real progress snapshot and maxing everything');

      // Save snapshot of real state before overwriting
      devModeSnapshot = {
        unlockedLevel: state.unlockedLevel,
        totalXP: state.totalXP,
        totalBattlesWon: state.totalBattlesWon,
        totalBattles: state.totalBattles,
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
        levelStars: { ...state.levelStars },
        coins: state.coins,
        inventory: [...state.inventory],
        equippedCharacter: state.equippedCharacter,
        equippedGear: state.equippedGear,
        equippedTitle: state.equippedTitle,
        skillStocks: { ...state.skillStocks },
        mmr: state.mmr,
        onlineWins: state.onlineWins,
        onlineLosses: state.onlineLosses,
      };

      const allItems = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'char_algebro', 'char_algegal'];
      const newInventory = Array.from(new Set([...state.inventory, ...allItems]));
      set({
        devModeEnabled: true,
        unlockedLevel: 7,
        coins: 99999,
        inventory: newInventory,
        skillStocks: { s2: 99, s3: 99, s4: 99 },
        levelStars: { 1: 10, 2: 20, 3: 20, 4: 30, 5: 30, 6: 50, 7: 105 },
      });
    } else {
      // ── Disabling dev mode: restore from snapshot ──
      console.log('[DEV MODE] Disabled — restoring real saved progress from snapshot');

      if (devModeSnapshot) {
        set({
          devModeEnabled: false,
          unlockedLevel: devModeSnapshot.unlockedLevel,
          totalXP: devModeSnapshot.totalXP,
          totalBattlesWon: devModeSnapshot.totalBattlesWon,
          totalBattles: devModeSnapshot.totalBattles,
          currentStreak: devModeSnapshot.currentStreak,
          maxStreak: devModeSnapshot.maxStreak,
          levelStars: devModeSnapshot.levelStars,
          coins: devModeSnapshot.coins,
          inventory: devModeSnapshot.inventory,
          equippedCharacter: devModeSnapshot.equippedCharacter,
          equippedGear: devModeSnapshot.equippedGear,
          equippedTitle: devModeSnapshot.equippedTitle,
          skillStocks: devModeSnapshot.skillStocks,
          mmr: devModeSnapshot.mmr,
          onlineWins: devModeSnapshot.onlineWins,
          onlineLosses: devModeSnapshot.onlineLosses,
        });
        devModeSnapshot = null;
      } else {
        // Fallback: reload from AsyncStorage if snapshot is missing
        set({ devModeEnabled: false });
        (async () => {
          try {
            const savedJson = await AsyncStorage.getItem(STORAGE_KEY_GAME_STATE);
            if (savedJson) {
              const saved = JSON.parse(savedJson);
              set({
                unlockedLevel: saved.unlockedLevel ?? 1,
                totalXP: saved.totalXP ?? 0,
                totalBattlesWon: saved.totalBattlesWon ?? 0,
                totalBattles: saved.totalBattles ?? 0,
                currentStreak: saved.currentStreak ?? 0,
                maxStreak: saved.maxStreak ?? 0,
                levelStars: saved.levelStars ?? {},
                coins: saved.coins ?? 100,
                inventory: saved.inventory ?? BASE_INVENTORY,
                equippedCharacter: saved.equippedCharacter ?? 'char_algebro',
                equippedGear: saved.equippedGear ?? null,
                equippedTitle: saved.equippedTitle ?? 'novice',
                skillStocks: saved.skillStocks ?? {},
                mmr: saved.mmr ?? STARTING_MMR,
                onlineWins: saved.onlineWins ?? 0,
                onlineLosses: saved.onlineLosses ?? 0,
              });
            }
          } catch (err) {
            console.warn('[DEV MODE] Failed to restore saved state:', err);
          }
        })();
      }
    }
  },

  // ── Consumable Skill Actions ──────────────────────────────

  consumeSkill: (skillId: string): boolean => {
    const state = get();
    // s1 (Basic Attack) is unlimited — never consumed
    const item = SHOP_ITEMS.find((i) => i.id === skillId);
    if (!item || !item.isConsumable) return true; // Not consumable, always allow

    const currentStock = state.skillStocks[skillId] ?? 0;
    if (currentStock <= 0) return false; // Out of stock

    const newSkillStocks = {
      ...state.skillStocks,
      [skillId]: currentStock - 1,
    };

    const newState = { ...state, skillStocks: newSkillStocks };
    set({ skillStocks: newSkillStocks });

    persistLocally(newState);
    syncToCloud(state.userId, newState);

    return true;
  },

  getSkillStock: (skillId: string): number => {
    const state = get();
    const item = SHOP_ITEMS.find((i) => i.id === skillId);
    if (!item || !item.isConsumable) return Infinity; // Non-consumable = unlimited
    return state.skillStocks[skillId] ?? 0;
  },
}));