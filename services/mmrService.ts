// services/mmrService.ts
// Elo-style MMR calculation for online multiplayer matches

import { ImageSourcePropType } from 'react-native';

/**
 * K-factor determines how much MMR changes per match.
 * Higher K = more volatile, lower K = more stable.
 */
const K_FACTOR = 32;

/**
 * Minimum MMR floor — players can't go below this.
 */
const MMR_FLOOR = 0;

/**
 * Starting MMR for new players.
 */
export const STARTING_MMR = 500;

export interface RankInfo {
  name: string;
  minMmr: number;
  badge: string;
  color: string;
  icon: ImageSourcePropType;
}

/**
 * Rank thresholds and display info.
 */
export const RANKS: readonly RankInfo[] = [
  {
    name: 'Bronze',
    minMmr: 0,
    badge: '🥉',
    color: '#CD7F32',
    icon: require('../assets/icons/rank_icons/bronze.png'),
  },
  {
    name: 'Silver',
    minMmr: 1000,
    badge: '🥈',
    color: '#C0C0C0',
    icon: require('../assets/icons/rank_icons/silver.png'),
  },
  {
    name: 'Gold',
    minMmr: 1500,
    badge: '🥇',
    color: '#FFD700',
    icon: require('../assets/icons/rank_icons/gold.png'),
  },
  {
    name: 'Diamond',
    minMmr: 2000,
    badge: '💎',
    color: '#B9F2FF',
    icon: require('../assets/icons/rank_icons/diamond.png'),
  },
  {
    name: 'Conqueror',
    minMmr: 2500,
    badge: '👑',
    color: '#FF6B6B',
    icon: require('../assets/icons/rank_icons/conqueror.png'),
  },
] as const;

/**
 * Get the rank info for a given MMR value.
 */
export function getRank(mmr: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (mmr >= RANKS[i].minMmr) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * Calculate the expected score (probability of winning) based on Elo formula.
 * @param playerMmr - The player's current MMR
 * @param opponentMmr - The opponent's current MMR
 * @returns A value between 0 and 1 representing the expected win probability
 */
function expectedScore(playerMmr: number, opponentMmr: number): number {
  return 1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 400));
}

/**
 * Calculate the MMR change after a match using Tier-Weighted Elo progression.
 *
 * - Bronze (< 1000 MMR): Losses are cushioned (0.65x) to encourage beginner learning.
 * - Silver & Gold (1000 - 1999 MMR): Balanced 1:1 Elo (K = 32).
 * - Diamond & Conqueror (2000+ MMR): High-tier calibration (K = 24) to keep top ranks prestigious.
 *
 * @param playerMmr - The player's MMR before the match
 * @param opponentMmr - The opponent's MMR before the match
 * @param result - 'win', 'loss', or 'draw'
 * @param options - Optional performance bonuses (e.g. hearts remaining, win streak)
 * @returns The MMR change (positive for gain, negative for loss)
 */
export function calculateMmrChange(
  playerMmr: number,
  opponentMmr: number,
  result: 'win' | 'loss' | 'draw',
  options?: { heartsRemaining?: number; winStreak?: number }
): number {
  if (result === 'draw') return 0;

  // Determine K-factor based on tier
  let k = K_FACTOR;
  if (playerMmr >= 2000) {
    k = 24; // Stricter high-tier progression
  }

  const expected = expectedScore(playerMmr, opponentMmr);
  const actual = result === 'win' ? 1 : 0;
  let rawChange = k * (actual - expected);

  // Bronze loss cushion: beginners lose less MMR to prevent discouragement
  if (result === 'loss' && playerMmr < 1000) {
    rawChange *= 0.65;
  }

  let finalChange = Math.round(rawChange);

  // Optional performance & streak bonus on wins (capped up to Gold)
  if (result === 'win' && playerMmr < 2000 && options) {
    let bonus = 0;
    // Flawless / high HP victory bonus
    if (options.heartsRemaining && options.heartsRemaining >= 3) {
      bonus += 3;
    }
    // Win streak bonus (3+ streak gives +2, 5+ streak gives +4)
    if (options.winStreak && options.winStreak >= 5) {
      bonus += 4;
    } else if (options.winStreak && options.winStreak >= 3) {
      bonus += 2;
    }
    finalChange += bonus;
  }

  // Ensure a win always grants at least +1 MMR, and a loss always deducts at least -1 MMR
  if (result === 'win' && finalChange <= 0) finalChange = 1;
  if (result === 'loss' && finalChange >= 0) finalChange = -1;

  return finalChange;
}

/**
 * Apply an MMR change and enforce the floor.
 * @param currentMmr - Current MMR
 * @param change - MMR delta (can be negative)
 * @returns New MMR value (never below MMR_FLOOR)
 */
export function applyMmrChange(currentMmr: number, change: number): number {
  return Math.max(MMR_FLOOR, currentMmr + change);
}
