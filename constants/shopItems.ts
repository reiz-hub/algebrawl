import { ShopItem } from '../types/shop';

export const SHOP_ITEMS: ShopItem[] = [
  // ── GEARS ───────────────────────────────────────────────
  {
    id: 'g1',
    name: 'No. 2 Pencil',
    category: 'gear',
    cost: 0,
    unlockLevel: 1,
    description: 'Starter writing tool. Adds +2 seconds to every question timer.',
    rarity: 'common',
    icon: '✏️',
    image: require('../assets/icons/gears/no2_pencil.png'),
    stats: {
      extraTimeSeconds: 2,
    },
  },
  {
    id: 'g2',
    name: 'Study Notes',
    category: 'gear',
    cost: 100,
    unlockLevel: 1,
    description: 'Comprehensive math notes. Grants +1 bonus starting heart.',
    rarity: 'common',
    icon: '📓',
    image: require('../assets/icons/gears/study_notes.png'),
    stats: {
      extraHearts: 1,
    },
  },
  {
    id: 'g3',
    name: 'Math Ruler',
    category: 'gear',
    cost: 200,
    unlockLevel: 3,
    description: 'Precision measuring tool. Adds +4 seconds to every question timer.',
    rarity: 'rare',
    icon: '📏',
    image: require('../assets/icons/gears/math_ruler.png'),
    stats: {
      extraTimeSeconds: 4,
    },
  },
  {
    id: 'g4',
    name: 'Pocket Calc',
    category: 'gear',
    cost: 350,
    unlockLevel: 5,
    description: 'Digital calculator assistant. Grants +2 bonus starting hearts.',
    rarity: 'rare',
    icon: '📱',
    image: require('../assets/icons/gears/pocket_calc.png'),
    stats: {
      extraHearts: 2,
    },
  },
  {
    id: 'g5',
    name: 'Golden Protractor',
    category: 'gear',
    cost: 600,
    unlockLevel: 7,
    description: 'Legendary geometry tool. Grants +3 bonus hearts and +5 seconds to every question timer.',
    rarity: 'legendary',
    icon: '📐',
    image: require('../assets/icons/gears/golden_protractor.png'),
    stats: {
      extraHearts: 3,
      extraTimeSeconds: 5,
    },
  },

  // ── SKILLS ──────────────────────────────────────────────
  {
    id: 's1',
    name: 'Basic Attack',
    category: 'skill',
    cost: 0,
    unlockLevel: 1,
    description: 'Standard mathematical strike dealing normal answer damage.',
    rarity: 'common',
    icon: '⚔️',
    image: require('../assets/icons/skills/basic_attack.png'),
    stats: {
      attackBonus: 5,
    },
  },
  {
    id: 's2',
    name: 'Focus',
    category: 'skill',
    cost: 150,
    unlockLevel: 2,
    description: 'Concentrates your mind to add +5s to the current question timer (1x per battle).',
    rarity: 'rare',
    icon: '⏱️',
    image: require('../assets/icons/skills/skills.png'),
    stats: {
      extraTimeSeconds: 5,
    },
    isConsumable: true,
  },
  {
    id: 's3',
    name: 'Shield',
    category: 'skill',
    cost: 250,
    unlockLevel: 4,
    description: 'Protective mathematical barrier that blocks 1 wrong answer hit (1x per battle).',
    rarity: 'rare',
    icon: '🛡️',
    image: require('../assets/icons/skills/shield.png'),
    stats: {
      startShield: true,
    },
    isConsumable: true,
  },
  {
    id: 's4',
    name: 'Double Strike',
    category: 'skill',
    cost: 400,
    unlockLevel: 6,
    description: 'Empowers your next correct answer to deal 2x damage (1x per battle).',
    rarity: 'epic',
    icon: '🔥',
    image: require('../assets/icons/skills/double_strike.png'),
    stats: {
      attackBonus: 20,
    },
    isConsumable: true,
  },

  // ── CHARACTERS ──────────────────────────────────────────
  {
    id: 'c0',
    name: 'Algebro',
    category: 'character',
    cost: 0,
    unlockLevel: 1,
    description: 'The default math warrior. Balanced gameplay with standard 3 Hearts.',
    rarity: 'common',
    icon: '🧮',
    image: require('../assets/images/avatar/algebroavatar.png'),
    stats: {},
  },
  {
    id: 'c1',
    name: 'Ada Lovelace',
    category: 'character',
    cost: 150,
    unlockLevel: 2,
    description: 'First computer programmer. Passive: Grants +3 seconds to every question timer.',
    rarity: 'rare',
    icon: '👩‍💻',
    image: require('../assets/images/avatar/lovelaceavatar.png'),
    stats: {
      extraTimeSeconds: 3,
    },
  },
  {
    id: 'c2',
    name: 'Isaac Newton',
    category: 'character',
    cost: 300,
    unlockLevel: 3,
    description: 'Father of calculus & gravity. Passive: Grants +1 bonus starting heart.',
    rarity: 'rare',
    icon: '🍎',
    image: require('../assets/images/avatar/newtonavatar.png'),
    stats: {
      extraHearts: 1,
    },
  },
  {
    id: 'c3',
    name: 'Nikola Tesla',
    category: 'character',
    cost: 500,
    unlockLevel: 4,
    description: 'Master of electricity. Passive: Grants +2 bonus hearts & +3s timer per question.',
    rarity: 'epic',
    icon: '⚡',
    image: require('../assets/images/avatar/teslaavatar.png'),
    stats: {
      extraHearts: 2,
      extraTimeSeconds: 3,
    },
  },
  {
    id: 'c4',
    name: 'Marie Curie',
    category: 'character',
    cost: 750,
    unlockLevel: 5,
    description: 'Radioactive pioneer. Passive: Grants +2 bonus hearts & starts every battle with a free Shield!',
    rarity: 'legendary',
    icon: '☢️',
    image: require('../assets/images/avatar/curieavatar.png'),
    stats: {
      extraHearts: 2,
      startShield: true,
    },
  },
];

export const GEAR_ASSETS: Record<string, any> = {
  g1: require('../assets/icons/gears/no2_pencil.png'),
  'No. 2 Pencil': require('../assets/icons/gears/no2_pencil.png'),
  '✏️': require('../assets/icons/gears/no2_pencil.png'),
  g2: require('../assets/icons/gears/study_notes.png'),
  'Study Notes': require('../assets/icons/gears/study_notes.png'),
  '📓': require('../assets/icons/gears/study_notes.png'),
  g3: require('../assets/icons/gears/math_ruler.png'),
  'Math Ruler': require('../assets/icons/gears/math_ruler.png'),
  '📏': require('../assets/icons/gears/math_ruler.png'),
  g4: require('../assets/icons/gears/pocket_calc.png'),
  'Pocket Calc': require('../assets/icons/gears/pocket_calc.png'),
  '📱': require('../assets/icons/gears/pocket_calc.png'),
  g5: require('../assets/icons/gears/golden_protractor.png'),
  'Golden Protractor': require('../assets/icons/gears/golden_protractor.png'),
  '📐': require('../assets/icons/gears/golden_protractor.png'),
};

export const SKILL_ASSETS: Record<string, any> = {
  s1: require('../assets/icons/skills/basic_attack.png'),
  'Basic Attack': require('../assets/icons/skills/basic_attack.png'),
  '⚔️': require('../assets/icons/skills/basic_attack.png'),
  s2: require('../assets/icons/skills/skills.png'),
  'Focus': require('../assets/icons/skills/skills.png'),
  '⏱️': require('../assets/icons/skills/skills.png'),
  s3: require('../assets/icons/skills/shield.png'),
  'Shield': require('../assets/icons/skills/shield.png'),
  '🛡️': require('../assets/icons/skills/shield.png'),
  s4: require('../assets/icons/skills/double_strike.png'),
  'Double Strike': require('../assets/icons/skills/double_strike.png'),
  '🔥': require('../assets/icons/skills/double_strike.png'),
};

export function getGearAsset(key?: string | null): any {
  if (!key) return null;
  return GEAR_ASSETS[key] || null;
}

export function getSkillAsset(key?: string | null): any {
  if (!key) return null;
  return SKILL_ASSETS[key] || null;
}
