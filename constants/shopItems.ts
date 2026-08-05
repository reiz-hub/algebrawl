import { ShopItem } from '../types/shop';

export const SHOP_ITEMS: ShopItem[] = [
  // ── GEARS ───────────────────────────────────────────────
  {
    id: 'g1',
    name: 'No. 2 Pencil',
    category: 'gear',
    cost: 0,
    description: 'Starter writing tool. Adds +2 seconds per question timer.',
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
      defenseBonus: 5,
    },
  },
  {
    id: 'g3',
    name: 'Math Ruler',
    category: 'gear',
    cost: 200,
    description: 'Precision measuring tool. Adds +4 seconds per question timer.',
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
      defenseBonus: 10,
    },
  },
  {
    id: 'g5',
    name: 'Golden Protractor',
    category: 'gear',
    cost: 600,
    description: 'Legendary geometry tool. Grants 2x XP boost on victories.',
    rarity: 'legendary',
    icon: '📐',
    stats: {
      xpMultiplier: 2.0,
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
    description: 'Concentrates your mind to add +5s to the current question timer.',
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
    description: 'Protective mathematical barrier that blocks 1 wrong answer hit.',
    rarity: 'rare',
    icon: '🛡️',
    stats: {
      defenseBonus: 15,
    },
  },
  {
    id: 's4',
    name: 'Double Strike',
    category: 'skill',
    cost: 400,
    description: 'Empowers your next correct answer to deal 2x damage.',
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
    description: 'The default math warrior. Always ready for algebraic battle.',
    rarity: 'common',
    icon: '🧮',
    image: require('../assets/images/avatar/algebroavatar.png'),
    stats: {
      defenseBonus: 5,
    },
  },
  {
    id: 'c1',
    name: 'Ada Lovelace',
    category: 'character',
    cost: 150,
    description: 'The first computer programmer. Boosts your logical thinking in battle.',
    rarity: 'rare',
    icon: '👩‍💻',
    image: require('../assets/images/avatar/lovelaceavatar.png'),
    stats: {
      defenseBonus: 10,
    },
  },
  {
    id: 'c2',
    name: 'Isaac Newton',
    category: 'character',
    cost: 300,
    description: 'Father of calculus and gravity. Adds mathematical precision to your attacks.',
    rarity: 'rare',
    icon: '🍎',
    image: require('../assets/images/avatar/newtonavatar.png'),
    stats: {
      defenseBonus: 15,
    },
  },
  {
    id: 'c3',
    name: 'Nikola Tesla',
    category: 'character',
    cost: 500,
    description: 'Master of electricity and invention. Electrifies your problem-solving skills.',
    rarity: 'epic',
    icon: '⚡',
    image: require('../assets/images/avatar/teslaavatar.png'),
    stats: {
      defenseBonus: 20,
    },
  },
  {
    id: 'c4',
    name: 'Marie Curie',
    category: 'character',
    cost: 750,
    description: 'Pioneer of radioactivity. Her brilliance radiates supreme defense in battle.',
    rarity: 'legendary',
    icon: '☢️',
    image: require('../assets/images/avatar/curieavatar.png'),
    stats: {
      defenseBonus: 30,
    },
  },
];
