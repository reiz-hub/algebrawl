import { GameFonts } from './theme';

export interface LevelTheme {
  level: number;
  name: string;
  bgImage: any | null;
  mapButtonImage?: any | null;
  enemyId?: string;
  projectileId?: string;
  stageBgColor: string;
  panelBg: string;
  buttonBg: string;
  buttonBorder: string;
  textColor: string;
  equationColor: string;
  optionTextColor: string;
  accentColor: string;
  titleFont: string;
  equationFont: string;
  buttonFont: string;
}

export const DEFAULT_LEVEL_THEME: LevelTheme = {
  level: 1,
  name: 'Necromancer Realm',
  bgImage: require('../assets/images/mapbg/necromancer_bg.png'),
  mapButtonImage: require('../assets/images/map_button/lvl1_mapbutton.png'),
  enemyId: 'villain1',
  projectileId: 'enemy',
  stageBgColor: '#241233',
  panelBg: '#2b163d',       // Rich Necromancer Dark Purple
  buttonBg: '#3a1d52',      // Purple Answer Button Fill
  buttonBorder: '#170a24',  // Dark Necromancer Border
  textColor: '#ffffff',     // White
  equationColor: '#ffffff',
  optionTextColor: '#ffffff',
  accentColor: '#f5a623',
  titleFont: GameFonts.brawl,       // Action title font
  equationFont: GameFonts.impact,  // High readability math
  buttonFont: GameFonts.brawl,     // Action button font
};

export const LEVEL_THEMES: Record<number, LevelTheme> = {
  1: {
    level: 1,
    name: 'Necromancer Realm',
    bgImage: require('../assets/images/mapbg/necromancer_bg.png'), // Exclusive background for Level 1
    mapButtonImage: require('../assets/images/map_button/lvl1_mapbutton.png'),
    enemyId: 'villain1',
    projectileId: 'enemy',
    stageBgColor: '#241233',
    panelBg: '#2b163d',       // Rich Purple Question Panel
    buttonBg: '#3a1d52',      // Purple Option Buttons
    buttonBorder: '#170a24',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#f5a623',
    titleFont: GameFonts.brawl,       // Action title font
    equationFont: GameFonts.impact,  // Crisp math equation font
    buttonFont: GameFonts.brawl,     // Punchy brawl button font
  },
  2: {
    level: 2,
    name: 'Orc Stronghold',
    bgImage: require('../assets/images/mapbg/orc_bg.png'),
    mapButtonImage: require('../assets/images/map_button/orc_mapbutton.png'),
    enemyId: 'villain2',
    projectileId: 'orc_slash',
    stageBgColor: '#0d2b1b',   // Deep Forest Emerald Stage Background
    panelBg: '#133622',       // Deep Forest Green Question Panel
    buttonBg: '#1b4c30',      // Emerald Green Option Buttons
    buttonBorder: '#0a2114',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#4ade80',
    titleFont: GameFonts.brawl,      // Heavy rugged brawl font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.brawl,
  },
  3: {
    level: 3,
    name: 'Slime Realm',
    bgImage: require('../assets/images/mapbg/slime_bg.png'), // Slime background for Level 3
    mapButtonImage: require('../assets/images/map_button/slime_mapbutton.png'),
    enemyId: 'slime',
    projectileId: 'spit',
    stageBgColor: '#0f291e',   // Deep Toxic Slime Green Stage Background
    panelBg: '#143826',       // Slime Green Question Panel
    buttonBg: '#1b4e35',      // Slime Green Option Buttons
    buttonBorder: '#0a2216',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#22c55e',
    titleFont: GameFonts.jungle,     // Wild adventure font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.brawl,
  },
  4: {
    level: 4,
    name: 'Knight Realm',
    bgImage: require('../assets/images/mapbg/knight_bg.png'),
    mapButtonImage: require('../assets/images/map_button/knight_mapbutton.png'),
    enemyId: 'knight',
    projectileId: 'slash',
    stageBgColor: '#0f2233',   // Deep Frost Navy Stage Background
    panelBg: '#142a3e',       // Deep Frost Navy Question Panel
    buttonBg: '#1c3c59',      // Ice Blue Option Buttons
    buttonBorder: '#091724',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#38bdf8',
    titleFont: GameFonts.hud,        // Crystalline Tech HUD font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.brawl,
  },
  5: {
    level: 5,
    name: 'Desert Ruins',
    bgImage: require('../assets/images/mapbg/mummy_bg.png'),
    mapButtonImage: require('../assets/images/map_button/mummy_mapbutton.png'),
    enemyId: 'mummy',
    projectileId: 'mummy_projectile',
    stageBgColor: '#2e2110',   // Deep Desert Bronze Stage Background
    panelBg: '#382914',       // Bronze Sand Amber Question Panel
    buttonBg: '#4f391c',      // Sand Bronze Option Buttons
    buttonBorder: '#1f1609',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#f59e0b',
    titleFont: GameFonts.impact,     // Ancient combat impact font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.brawl,
  },
  6: {
    level: 6,
    name: 'Void Sanctum',
    bgImage: require('../assets/images/mapbg/golem_bg.png'),
    mapButtonImage: require('../assets/images/map_button/golem_mapbutton.png'),
    enemyId: 'golem',
    projectileId: 'thorns',
    stageBgColor: '#160f2e',   // Deep Void Indigo Stage Background
    panelBg: '#1c1438',       // Deep Void Indigo Question Panel
    buttonBg: '#281b52',      // Void Purple Option Buttons
    buttonBorder: '#0e0921',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#a855f7',
    titleFont: GameFonts.arcade,     // Void Retro 8-bit Arcade font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.arcade,
  },
  7: {
    level: 7,
    name: 'Chaos Arena',
    bgImage: require('../assets/images/mapbg/inferno_bg.png'),
    mapButtonImage: require('../assets/images/map_button/inferno_mapbutton.png'),
    enemyId: 'easy_dragon',
    projectileId: 'easy_flame',
    stageBgColor: '#1a0a0a',   // Deep Crimson-Black Stage Background
    panelBg: '#2d0f0f',       // Dark Crimson Question Panel
    buttonBg: '#3d1515',      // Crimson-Gold Option Buttons
    buttonBorder: '#1a0808',
    textColor: '#ffffff',
    equationColor: '#ffffff',
    optionTextColor: '#ffffff',
    accentColor: '#f5a623',
    titleFont: GameFonts.brawl,      // Total chaos brawl font
    equationFont: GameFonts.impact,
    buttonFont: GameFonts.brawl,
  },
};

export function getLevelTheme(levelNumber: number, difficulty?: string): LevelTheme {
  const base = LEVEL_THEMES[levelNumber] || DEFAULT_LEVEL_THEME;
  if (levelNumber === 7 && difficulty === 'medium') {
    return {
      ...base,
      enemyId: 'medium_dragon',
      projectileId: 'medium_flame',
    };
  }
  return base;
}

