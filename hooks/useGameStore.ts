// hooks/useGameStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { SHOP_ITEMS } from '../constants/shopItems';
import {
  fetchFromFirestore,
  syncToFirestore,
  UserData,
} from '../services/supabaseSync';
import { PurchaseResult } from '../types/shop';

const STORAGE_KEY_USER_ID = '@algebrawl_userId';
const STORAGE_KEY_USERNAME = '@algebrawl_username';
const STORAGE_KEY_INGAMENAME = '@algebrawl_ingamename';
const STORAGE_KEY_GAME_STATE = '@algebrawl_gameState';

interface GameState {
  // Auth
  userId: string | null;
  username: string | null;
  ingameName: string | null;
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

  // Actions
  loadLocalData: () => Promise<void>;
  recordLevelProgress: (levelId: number, score: number, didWin: boolean) => void;
  updateStats: (xpToAdd: number, isWin: boolean, coinsEarned?: number) => void;
  setUsername: (username: string) => void;
  setIngameName: (ingameName: string) => void;
  loginWithData: (userId: string, data: UserData) => void;
  logout: () => Promise<void>;
  getUserId: () => string | null;

  // Shop & Inventory Actions
  buyItem: (itemId: string) => PurchaseResult;
  equipItem: (itemId: string) => void;
  addCoins: (amount: number) => void;
  unlockAllDev: () => void;
}

/**
 * Persist game state to AsyncStorage.
 */
const persistLocally = async (state: Partial<GameState>) => {
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
    };
    await AsyncStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(saveable));
  } catch (error) {
    console.warn('[AsyncStorage] Save failed:', error);
  }
};

/**
 * Sync current game state to Firestore / Supabase.
 */
const syncToCloud = async (userId: string | null, state: Partial<GameState>) => {
  if (!userId || !state.isLoggedIn) return;
  await syncToFirestore(userId, {
    isGuest: !state.isLoggedIn,
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
  });
};

export const useGameStore = create<GameState>((set, get) => ({
  // Auth state
  userId: null,
  username: null,
  ingameName: null,
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
  inventory: ['g1', 's1', 'c0', 'char_algebro'],
  equippedCharacter: 'c0',
  equippedGear: 'g1',

  /**
   * Initialize: load userId from AsyncStorage (or generate one),
   * load local game state, then attempt to sync with Firestore.
   */
  loadLocalData: async () => {
    try {
      // 1. Resolve userId
      let userId = await AsyncStorage.getItem(STORAGE_KEY_USER_ID);
      if (!userId) {
        userId = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY_USER_ID, userId);
      }

      // 2. Load username and ingameName if set
      const username = await AsyncStorage.getItem(STORAGE_KEY_USERNAME);
      const ingameName = await AsyncStorage.getItem(STORAGE_KEY_INGAMENAME);

      // 3. Load local game state
      const savedJson = await AsyncStorage.getItem(STORAGE_KEY_GAME_STATE);
      let localState = savedJson ? JSON.parse(savedJson) : null;

      // 4. Try to fetch from Firestore (may have newer data from another device)
      const cloudData = await fetchFromFirestore(userId);

      if (cloudData) {
        // Merge inventory lists (union)
        const combinedInventory = Array.from(
          new Set([
            'char_algebro',
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

        localState = merged;
      }

      const finalUsername = username || cloudData?.username || null;
      const finalIngameName = ingameName || cloudData?.ingameName || null;

      set({
        userId,
        username: finalUsername,
        ingameName: finalIngameName,
        isLoaded: true,
        isLoggedIn: !!finalUsername,
        unlockedLevel: localState?.unlockedLevel ?? 1,
        totalXP: localState?.totalXP ?? 0,
        totalBattlesWon: localState?.totalBattlesWon ?? 0,
        totalBattles: localState?.totalBattles ?? 0,
        currentStreak: localState?.currentStreak ?? 0,
        maxStreak: localState?.maxStreak ?? 0,
        levelStars: localState?.levelStars ?? {},
        coins: localState?.coins ?? 100,
        inventory: localState?.inventory ?? ['char_algebro'],
        equippedCharacter: localState?.equippedCharacter ?? 'char_algebro',
        equippedGear: localState?.equippedGear ?? null,
      });

      // Persist the merged state back
      await persistLocally(localState ?? {});

      // Save username/ingameName locally if we got it from cloud
      if (cloudData?.username && !username) {
        await AsyncStorage.setItem(STORAGE_KEY_USERNAME, cloudData.username);
      }
      if (cloudData?.ingameName && !ingameName) {
        await AsyncStorage.setItem(STORAGE_KEY_INGAMENAME, cloudData.ingameName);
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

  loginWithData: (userId: string, data: UserData) => {
    const newState = {
      userId,
      username: data.username || null,
      ingameName: data.ingameName || null,
      isLoaded: true,
      isLoggedIn: true,
      unlockedLevel: data.unlockedLevel ?? 1,
      totalXP: data.xp ?? 0,
      totalBattlesWon: data.wins ?? 0,
      totalBattles: data.totalBattles ?? 0,
      currentStreak: data.currentStreak ?? 0,
      maxStreak: data.maxStreak ?? 0,
      levelStars: data.levelStars ?? {},
      coins: data.coins ?? 100,
      inventory: data.inventory ?? ['char_algebro'],
      equippedCharacter: data.equippedCharacter ?? 'char_algebro',
      equippedGear: data.equippedGear ?? null,
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
    persistLocally(newState);

    // Also push to Firestore with isGuest: false since user is now authenticated
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
    }).catch(() => { });
  },

  logout: async () => {
    try {
      // Generate a fresh guest ID
      const newGuestId = Crypto.randomUUID();

      // Clear stored auth data
      await AsyncStorage.removeItem(STORAGE_KEY_USERNAME);
      await AsyncStorage.removeItem(STORAGE_KEY_INGAMENAME);
      await AsyncStorage.setItem(STORAGE_KEY_USER_ID, newGuestId);

      // Reset to fresh guest state
      const freshState = {
        userId: newGuestId,
        username: null,
        ingameName: null,
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
        inventory: ['char_algebro'],
        equippedCharacter: 'char_algebro',
        equippedGear: null,
      };

      set(freshState);
      await persistLocally(freshState);
    } catch (error) {
      console.warn('[useGameStore] logout failed:', error);
    }
  },

  getUserId: () => get().userId,

  // ── Purchase & Inventory Actions ──────────────────────────

  buyItem: (itemId: string): PurchaseResult => {
    const state = get();
    const item = SHOP_ITEMS.find((i) => i.id === itemId);

    if (!item) {
      return { success: false, message: 'Item not found in catalog.' };
    }

    if (state.inventory.includes(itemId)) {
      return { success: false, message: `You already own ${item.name}!`, item };
    }

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

    return {
      success: true,
      message: `Unlocked ${item.name}!`,
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
    const allItems = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 'c0', 'c1', 'c2', 'c3', 'c4', 'char_algebro'];
    const newInventory = Array.from(new Set([...state.inventory, ...allItems]));
    const newState = {
      ...state,
      unlockedLevel: 7,
      coins: Math.max(state.coins, 9999),
      inventory: newInventory,
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
}));