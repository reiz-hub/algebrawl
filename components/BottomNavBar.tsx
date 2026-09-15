import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameFonts } from '../constants/theme';
import { soundService } from '../services/soundService';
import TouchableOpacity from './TouchableOpacity';

interface TabConfig {
  label: string;
  icon: ImageSourcePropType;
}

const ALLOWED_TABS = ['profile', 'shop', 'dungeon', 'ranking', 'settings'];

const TAB_CONFIGS: Record<string, TabConfig> = {
  profile: {
    label: 'PROFILE',
    icon: require('../assets/icons/UI_icons/profile.png'),
  },
  shop: {
    label: 'SHOP',
    icon: require('../assets/icons/UI_icons/shop.png'),
  },
  dungeon: {
    label: 'DUNGEON',
    icon: require('../assets/icons/UI_icons/maps2.png'),
  },
  ranking: {
    label: 'RANKING',
    icon: require('../assets/icons/UI_icons/leaderboards.png'),
  },
  settings: {
    label: 'SETTINGS',
    icon: require('../assets/icons/UI_icons/settings.png'),
  },
};

export default function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((route) => {
    if (!ALLOWED_TABS.includes(route.name)) return false;
    const { options } = descriptors[route.key] || {};
    if (options && (options as any).href === null) return false;
    return true;
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {visibleRoutes.map((route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === index;
        const config = TAB_CONFIGS[route.name] || {
          label: route.name.toUpperCase(),
          icon: require('../assets/icons/UI_icons/profile.png'),
        };

        const onPress = () => {
          soundService.playSound('click');
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const isDungeon = route.name === 'dungeon';

        if (isDungeon) {
          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.85}
              onPress={onPress}
              style={styles.dungeonTab}
            >
              <View style={styles.centerButtonOuter}>
                <View
                  style={[
                    styles.centerButtonCircle,
                    isFocused ? styles.centerButtonActive : styles.centerButtonInactive,
                  ]}
                >
                  {isFocused && <View style={styles.centerRingHighlight} />}
                  <Image
                    source={config.icon}
                    style={[
                      styles.dungeonTabIcon,
                      { transform: [{ scale: isFocused ? 1.06 : 1 }] },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.regularTab}
          >
            <View style={styles.regularIconContainer}>
              <Image
                source={config.icon}
                style={[
                  styles.regularTabIcon,
                  {
                    opacity: isFocused ? 1 : 0.65,
                    transform: [{ scale: isFocused ? 1.08 : 1 }],
                  },
                ]}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff9f0',
    borderTopWidth: 3,
    borderTopColor: '#1a1008',
    paddingTop: 8,
    paddingHorizontal: 8,
    overflow: 'visible',
    zIndex: 50,
  },
  regularTab: {
    flex: 1,
    maxWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  regularIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: 28,
  },
  regularTabIcon: {
    width: 26,
    height: 26,
  },
  dungeonTab: {
    flex: 1,
    maxWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    overflow: 'visible',
    zIndex: 100,
  },
  centerButtonOuter: {
    position: 'relative',
    marginTop: -28,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3.5,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerButtonActive: {
    backgroundColor: '#e8302a',
  },
  centerButtonInactive: {
    backgroundColor: '#ffffff',
  },
  centerRingHighlight: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 2.5,
    bottom: 2.5,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  dungeonTabIcon: {
    width: 44,
    height: 44,
  },
  tabLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#e8302a',
  },
  tabLabelInactive: {
    color: '#7a6a55',
  },
});
