/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const GameFonts = {
  /** Classic Algebrawls Adventure Title Font */
  jungle: 'JungleAdventurer',
  /** Retro 8-bit Arcade Gaming Font */
  arcade: 'PressStart2P',
  /** Epic Dark Fantasy RPG Boss & Realm Title Font */
  epic: 'CinzelDecorativeBold',
  /** Heavy Action Brawling Font */
  brawl: 'Bungee',
  /** Modern Combat Math Equation Font */
  impact: 'RussoOne',
  /** Tactical Cyber HUD & Player Stats Font */
  hud: 'ChakraPetchBold',
};

export const GameFontStyles = {
  titleEpic: {
    fontFamily: GameFonts.epic,
    fontSize: 28,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  titleBrawl: {
    fontFamily: GameFonts.brawl,
    fontSize: 26,
    textTransform: 'uppercase' as const,
  },
  mathEquation: {
    fontFamily: GameFonts.impact,
    fontSize: 34,
    letterSpacing: 1,
  },
  actionButton: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    textTransform: 'uppercase' as const,
  },
  arcadeBadge: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
  },
  hudLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    letterSpacing: 0.5,
  },
};

