// constants/titleBanners.ts
import { ImageSourcePropType } from 'react-native';

export interface TitleBanner {
  id: string;
  name: string;
  badgeImage: ImageSourcePropType;
  description: string;
  unlockRequirement: string;
  category: 'adventure' | 'multiplayer' | 'starter';
  themeColor: string;
  /** Function to determine whether the title is unlocked given player stats */
  isUnlocked: (stats: {
    unlockedLevel: number;
    levelStars: Record<number, number>;
    totalBattlesWon: number;
    onlineWins: number;
    mmr: number;
  }) => boolean;
}

export const TITLE_BANNERS: readonly TitleBanner[] = [
  {
    id: 'novice',
    name: 'Novice',
    badgeImage: require('../assets/images/badges/novice_badge.png'),
    description: 'Every grand mathematician starts with a single equation.',
    unlockRequirement: 'Unlocked by default',
    category: 'starter',
    themeColor: '#8B5A2B',
    isUnlocked: () => true,
  },
  {
    id: 'variable_vanguard',
    name: 'Variable Vanguard',
    badgeImage: require('../assets/images/badges/variable_vanguard_badge.png'),
    description: 'Master of algebraic substitution and basic expressions.',
    unlockRequirement: 'Complete Level 1 (Variables & Expressions)',
    category: 'adventure',
    themeColor: '#1a6cf5',
    isUnlocked: (s) => (s.levelStars[1] || 0) > 0 || s.unlockedLevel > 1,
  },
  {
    id: 'the_equalizer',
    name: 'The Equalizer',
    badgeImage: require('../assets/images/badges/the_equalizer_badge.png'),
    description: 'Keeps both sides of every equation in perfect balance.',
    unlockRequirement: 'Complete Level 2 (Equations & Inequalities)',
    category: 'adventure',
    themeColor: '#0284c7',
    isUnlocked: (s) => (s.levelStars[2] || 0) > 0 || s.unlockedLevel > 2,
  },
  {
    id: 'polynomial_paladin',
    name: 'Polynomial Paladin',
    badgeImage: require('../assets/images/badges/polynomial_paladin_badge.png'),
    description: 'Champion of multi-term operations and algebraic distribution.',
    unlockRequirement: 'Complete Level 3 (Polynomials)',
    category: 'adventure',
    themeColor: '#16a34a',
    isUnlocked: (s) => (s.levelStars[3] || 0) > 0 || s.unlockedLevel > 3,
  },
  {
    id: 'the_deconstructor',
    name: 'The Deconstructor',
    badgeImage: require('../assets/images/badges/the_deconstructor_badge.png'),
    description: 'Breaks complex algebraic expressions into prime factors.',
    unlockRequirement: 'Complete Level 4 (Factoring)',
    category: 'adventure',
    themeColor: '#dc2626',
    isUnlocked: (s) => (s.levelStars[4] || 0) > 0 || s.unlockedLevel > 4,
  },
  {
    id: 'system_sovereign',
    name: 'System Sovereign',
    badgeImage: require('../assets/images/badges/system_sovereign_badge.png'),
    description: 'Rules over simultaneous multi-variable linear intersections.',
    unlockRequirement: 'Complete Level 5 (Systems of Equations)',
    category: 'adventure',
    themeColor: '#475569',
    isUnlocked: (s) => (s.levelStars[5] || 0) > 0 || s.unlockedLevel > 5,
  },
  {
    id: 'grand_algebrawler',
    name: 'Grand Algebrawler',
    badgeImage: require('../assets/images/badges/grand_algebrawler_badge.png'),
    description: 'Wielder of exponential power and ancient radicals.',
    unlockRequirement: 'Complete Level 6 (Exponents & Roots)',
    category: 'adventure',
    themeColor: '#7c3aed',
    isUnlocked: (s) => (s.levelStars[6] || 0) > 0 || s.unlockedLevel > 6,
  },
  {
    id: 'pinnacle_of_power',
    name: 'Pinnacle of Power',
    badgeImage: require('../assets/images/badges/pinnacle_of_power_badge.png'),
    description: 'Vanished the Math Overlord in the ultimate randomized gauntlet.',
    unlockRequirement: 'Defeat Math Overlord (Level 7)',
    category: 'adventure',
    themeColor: '#9333ea',
    isUnlocked: (s) => (s.levelStars[7] || 0) > 0,
  },
  {
    id: 'arena_skirmisher',
    name: 'Arena Skirmisher',
    badgeImage: require('../assets/images/badges/arena_skirmisher_badge.png'),
    description: 'Proved courage and rapid calculation in the multiplayer arena.',
    unlockRequirement: 'Win your first battle or online match',
    category: 'multiplayer',
    themeColor: '#15803d',
    isUnlocked: (s) => s.onlineWins >= 1 || s.totalBattlesWon >= 1,
  },
  {
    id: 'battle_tested_gladiator',
    name: 'Battle-Tested Gladiator',
    badgeImage: require('../assets/images/badges/battle-tested_gladiator_badge.png'),
    description: 'Veteran of intense PvP battles with 5+ wins or 1500+ MMR.',
    unlockRequirement: 'Win 5 Online matches or reach Gold rank (1500+ MMR)',
    category: 'multiplayer',
    themeColor: '#b45309',
    isUnlocked: (s) => s.onlineWins >= 5 || s.mmr >= 1500,
  },
] as const;

/**
 * Lookup a title banner by ID with fallback to Novice.
 */
export function getTitleBanner(id?: string | null): TitleBanner {
  if (!id) return TITLE_BANNERS[0];
  const found = TITLE_BANNERS.find((b) => b.id === id);
  return found || TITLE_BANNERS[0];
}

/**
 * Check if a specific title banner is unlocked for a given stats snapshot.
 */
export function isTitleBannerUnlocked(
  id: string,
  stats: {
    unlockedLevel: number;
    levelStars: Record<number, number>;
    totalBattlesWon: number;
    onlineWins: number;
    mmr: number;
  }
): boolean {
  const banner = TITLE_BANNERS.find((b) => b.id === id);
  if (!banner) return false;
  return banner.isUnlocked(stats);
}
