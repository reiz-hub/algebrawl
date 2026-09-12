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
export const STARTING_MMR = 1000;

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
 * Calculate the MMR change after a match.
 *
 * @param playerMmr - The player's MMR before the match
 * @param opponentMmr - The opponent's MMR before the match
 * @param result - 'win', 'loss', or 'draw'
 * @returns The MMR change (positive for gain, negative for loss)
 *
 * Examples:
 *   Player (1200) beats Opponent (1350): +28 MMR (beat stronger → bigger reward)
 *   Player (1350) beats Opponent (1200): +18 MMR (beat weaker → smaller reward)
 *   Player (1200) loses to Opponent (1350): -18 MMR (lost to stronger → smaller penalty)
 *   Player (1350) loses to Opponent (1200): -28 MMR (lost to weaker → bigger penalty)
 */
export function calculateMmrChange(
  playerMmr: number,
  opponentMmr: number,
  result: 'win' | 'loss' | 'draw'
): number {
  const expected = expectedScore(playerMmr, opponentMmr);
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  return Math.round(K_FACTOR * (actual - expected));
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
