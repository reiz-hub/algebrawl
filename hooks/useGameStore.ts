// hooks/useGameStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import {
  fetchFromFirestore,
  syncToFirestore,
  UserData,
} from '../services/firestoreSync';

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

  // Actions
  loadLocalData: () => Promise<void>;
  recordLevelProgress: (levelId: number, score: number, didWin: boolean) => void;
  updateStats: (xpToAdd: number, isWin: boolean) => void;
  setUsername: (username: string) => void;
  setIngameName: (ingameName: string) => void;
  loginWithData: (userId: string, data: UserData) => void;
  logout: () => Promise<void>;
  getUserId: () => string | null;
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
    };
    await AsyncStorage.setItem(STORAGE_KEY_GAME_STATE, JSON.stringify(saveable));
  } catch (error) {
    console.warn('[AsyncStorage] Save failed:', error);
  }
};

/**
 * Sync current game state to Firestore.
 */
const syncToCloud = async (userId: string | null, state: Partial<GameState>) => {
  if (!userId || !state.isLoggedIn) return;
  await syncToFirestore(userId, {
    isGuest: !state.isLoggedIn,
    unlockedLevel: state.unlockedLevel ?? 1,
    levelStars: state.levelStars ?? {},
    xp: state.totalXP ?? 0,
    totalBattles: state.totalBattles ?? 0,
    wins: state.totalBattlesWon ?? 0,
    currentStreak: state.currentStreak ?? 0,
    maxStreak: state.maxStreak ?? 0,
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
        // Merge: take the "best" of local vs cloud
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

  updateStats: (xpToAdd, isWin) =>
    set((state) => {
      const newCurrentStreak = isWin ? state.currentStreak + 1 : 0;
      const newState = {
        ...state,
        totalXP: state.totalXP + xpToAdd,
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
      username: data.username,
      ingameName: data.ingameName,
      unlockedLevel: data.unlockedLevel ?? 1,
      levelStars: data.levelStars ?? {},
      xp: data.xp ?? 0,
      totalBattles: data.totalBattles ?? 0,
      wins: data.wins ?? 0,
      currentStreak: data.currentStreak ?? 0,
      maxStreak: data.maxStreak ?? 0,
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
      };

      set(freshState);
      await persistLocally(freshState);

      // Guest sessions are local-only — no Firestore doc created
    } catch (error) {
      console.warn('[useGameStore] logout failed:', error);
    }
  },

  getUserId: () => get().userId,
}));