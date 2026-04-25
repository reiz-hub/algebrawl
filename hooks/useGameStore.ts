// hooks/useGameStore.ts
import { create } from 'zustand';

interface GameState {
  unlockedLevel: number;
  totalXP: number;
  totalBattlesWon: number;
  totalBattles: number;
  currentStreak: number;
  maxStreak: number;
  levelStars: Record<number, number>;
  
  loadLocalData: () => void;
  completeLevel: (levelId: number, stars: number) => void;
  updateStats: (xpToAdd: number, isWin: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  unlockedLevel: 1,
  totalXP: 0,
  totalBattlesWon: 0,
  totalBattles: 0,
  currentStreak: 0,
  maxStreak: 0,
  levelStars: {},

  loadLocalData: () => console.log("Data loaded"),

  completeLevel: (levelId, stars) => set((state) => ({
    unlockedLevel: Math.max(state.unlockedLevel, levelId + 1),
    levelStars: {
      ...state.levelStars,
      [levelId]: Math.max(state.levelStars[levelId] || 0, stars)
    }
  })),

  updateStats: (xpToAdd, isWin) => set((state) => {
    const newTotalBattles = state.totalBattles + 1;
    const newTotalBattlesWon = isWin ? state.totalBattlesWon + 1 : state.totalBattlesWon;
    const newCurrentStreak = isWin ? state.currentStreak + 1 : 0;
    const newMaxStreak = Math.max(state.maxStreak, newCurrentStreak);

    return {
      totalXP: state.totalXP + xpToAdd,
      totalBattles: newTotalBattles,
      totalBattlesWon: newTotalBattlesWon,
      currentStreak: newCurrentStreak,
      maxStreak: newMaxStreak,
    };
  }),
}));