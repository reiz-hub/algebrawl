import { ShopItem } from '../types/shop';

export const SHOP_ITEMS: ShopItem[] = [
  // ── GEARS ───────────────────────────────────────────────
  {
    id: 'g1',
    name: 'No. 2 Pencil',
    category: 'gear',
    cost: 0,
    description: 'Starter writing tool. Adds +2 seconds to every question timer.',
    rarity: 'common',
    icon: '✏️',
    stats: {
      extraTimeSeconds: 2,
    },
  },
  {
    id: 'g2',
    name: 'Study Notes',
    category: 'gear',
    cost: 100,
    description: 'Comprehensive math notes. Grants +1 bonus starting heart.',
    rarity: 'common',
    icon: '📓',
    stats: {
      extraHearts: 1,
    },
  },
  {
    id: 'g3',
    name: 'Math Ruler',
    category: 'gear',
    cost: 200,
    description: 'Precision measuring tool. Adds +4 seconds to every question timer.',
    rarity: 'rare',
    icon: '📏',
    stats: {
      extraTimeSeconds: 4,
    },
  },
  {
    id: 'g4',
    name: 'Pocket Calc',
    category: 'gear',
    cost: 350,
    description: 'Digital calculator assistant. Grants +2 bonus starting hearts.',
    rarity: 'rare',
    icon: '📱',
    stats: {
      extraHearts: 2,
    },
  },
  {
    id: 'g5',
    name: 'Golden Protractor',
    category: 'gear',
    cost: 600,
    description: 'Legendary geometry tool. Grants +3 bonus hearts and +5 seconds to every question timer.',
    rarity: 'legendary',
    icon: '📐',
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
    description: 'Standard mathematical strike dealing normal answer damage.',
    rarity: 'common',
    icon: '⚔️',
    stats: {
      attackBonus: 5,
    },
  },
  {
    id: 's2',
    name: 'Focus',
    category: 'skill',
    cost: 150,
    description: 'Concentrates your mind to add +5s to the current question timer (1x per battle).',
    rarity: 'rare',
    icon: '⏱️',
    stats: {
      extraTimeSeconds: 5,
    },
  },
  {
    id: 's3',
    name: 'Shield',
    category: 'skill',
    cost: 250,
    description: 'Protective mathematical barrier that blocks 1 wrong answer hit (1x per battle).',
    rarity: 'rare',
    icon: '🛡️',
    stats: {
      startShield: true,
    },
  },
  {
    id: 's4',
    name: 'Double Strike',
    category: 'skill',
    cost: 400,
    description: 'Empowers your next correct answer to deal 2x damage (1x per battle).',
    rarity: 'epic',
    icon: '🔥',
    stats: {
      attackBonus: 20,
    },
  },

  // ── CHARACTERS ──────────────────────────────────────────
  {
    id: 'c0',
    name: 'Algebro',
    category: 'character',
    cost: 0,
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
