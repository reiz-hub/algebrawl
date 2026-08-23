// constants/characterSkills.ts
// Character details, avatars, and skill descriptions for multiplayer & battle

export interface CharacterSkillInfo {
  id: string;
  name: string;
  rarity: string;
  icon: string;
  avatar: any;
  skillName: string;
  skillIcon: string;
  skillType: string;
  skillDesc: string;
}

export const CHARACTER_DETAILS: Record<string, CharacterSkillInfo> = {
  c0: {
    id: 'c0',
    name: 'Algebro',
    rarity: 'common',
    icon: '🧮',
    avatar: require('../assets/images/avatar/algebroavatar.png'),
    skillName: 'Algebraic Balance',
    skillIcon: '🧮',
    skillType: 'Passive',
    skillDesc: 'Balanced math warrior with standard 3 Hearts & reliable power.',
  },
  char_algebro: {
    id: 'c0',
    name: 'Algebro',
    rarity: 'common',
    icon: '🧮',
    avatar: require('../assets/images/avatar/algebroavatar.png'),
    skillName: 'Algebraic Balance',
    skillIcon: '🧮',
    skillType: 'Passive',
    skillDesc: 'Balanced math warrior with standard 3 Hearts & reliable power.',
  },
  c1: {
    id: 'c1',
    name: 'Ada Lovelace',
    rarity: 'rare',
    icon: '👩‍💻',
    avatar: require('../assets/images/avatar/lovelaceavatar.png'),
    skillName: 'Chronos Calculation',
    skillIcon: '⏱️',
    skillType: 'Passive',
    skillDesc: 'Grants +3 seconds bonus to every question timer.',
  },
  c2: {
    id: 'c2',
    name: 'Isaac Newton',
    rarity: 'rare',
    icon: '🍎',
    avatar: require('../assets/images/avatar/newtonavatar.png'),
    skillName: 'Gravitational Force',
    skillIcon: '🍎',
    skillType: 'Passive',
    skillDesc: 'Grants +1 bonus heart & reinforced resilience.',
  },
  c3: {
    id: 'c3',
    name: 'Nikola Tesla',
    rarity: 'epic',
    icon: '⚡',
    avatar: require('../assets/images/avatar/teslaavatar.png'),
    skillName: 'High Voltage',
    skillIcon: '⚡',
    skillType: 'Passive',
    skillDesc: 'Grants +2 bonus hearts & +3s timer boost per question.',
  },
  c4: {
    id: 'c4',
    name: 'Marie Curie',
    rarity: 'legendary',
    icon: '☢️',
    avatar: require('../assets/images/avatar/curieavatar.png'),
    skillName: 'Radiant Barrier',
    skillIcon: '☢️',
    skillType: 'Passive',
    skillDesc: 'Grants +2 bonus hearts & starts with a free Shield.',
  },
};

export function getCharacterDetails(charId?: string | null): CharacterSkillInfo {
  const key = charId || 'c0';
  return CHARACTER_DETAILS[key] || CHARACTER_DETAILS.c0;
}
