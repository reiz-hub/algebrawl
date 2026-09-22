import {
  BottomTabBarHeightCallbackContext,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import React, { useContext } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
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
    icon: require('../assets/icons/navbuttons/profile.png'),
  },
  shop: {
    label: 'SHOP',
    icon: require('../assets/icons/navbuttons/shop.png'),
  },
  dungeon: {
    label: 'DUNGEON',
    icon: require('../assets/icons/navbuttons/maps2.png'),
  },
  ranking: {
    label: 'RANKING',
    icon: require('../assets/icons/navbuttons/leaderboards.png'),
  },
  settings: {
    label: 'SETTINGS',
    icon: require('../assets/icons/navbuttons/settings.png'),
  },
};

export default function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const visibleRoutes = state.routes.filter((route) => {
    if (!ALLOWED_TABS.includes(route.name)) return false;
    const { options } = descriptors[route.key] || {};
    if (options && (options as any).href === null) return false;
    return true;
  });

  const numTabs = visibleRoutes.length || 5;
  const itemWidth = Math.ceil(screenWidth / numTabs);
  const itemHeight = Math.round(itemWidth * 1.13);

  const handleLayout = (e: LayoutChangeEvent) => {
    onHeightChange?.(e.nativeEvent.layout.height);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { paddingBottom: 0 },
      ]}
    >
      {visibleRoutes.map((route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === index;
        const config = TAB_CONFIGS[route.name] || {
          label: route.name.toUpperCase(),
          icon: require('../assets/icons/navbuttons/profile.png'),
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

        const currentHeight = isFocused ? itemHeight + 12 : itemHeight;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={[
              styles.tabButton,
              { width: itemWidth, height: currentHeight, zIndex: isFocused ? 10 : 1 },
            ]}
            hitSlop={{ top: 12, bottom: 8, left: 4, right: 4 }}
          >
            <View
              style={[
                styles.iconWrapper,
                { width: itemWidth + 2, height: currentHeight },
                isFocused ? styles.iconWrapperActive : styles.iconWrapperInactive,
              ]}
            >
              <Image
                source={config.icon}
                style={{ width: itemWidth + 2, height: currentHeight }}
                resizeMode="stretch"
              />
              <OutlinedText
                text={config.label}
                color={isFocused ? '#ffea79' : '#ffffff'}
                fontSize={8.5}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface OutlinedTextProps {
  text: string;
  color: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontSize?: number;
}

function OutlinedText({
  text,
  color,
  outlineColor = '#1a1008',
  outlineWidth = 1,
  fontSize = 8.5,
}: OutlinedTextProps) {
  const baseStyle: TextStyle = {
    fontFamily: GameFonts.brawl,
    fontSize,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    position: 'absolute',
  };

  const d = outlineWidth;

  return (
    <View style={styles.outlinedTextContainer}>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: -d }, { translateY: -d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: 0 }, { translateY: -d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: d }, { translateY: -d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: -d }, { translateY: 0 }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: d }, { translateY: 0 }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: -d }, { translateY: d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: 0 }, { translateY: d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color: outlineColor, transform: [{ translateX: d }, { translateY: d }] }]}>{text}</Text>
      <Text style={[baseStyle, { color, position: 'relative' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#fff9f0',
    paddingTop: 18,
    paddingHorizontal: 0,
    overflow: 'visible',
    zIndex: 50,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: -1,
    overflow: 'visible',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  iconWrapperActive: {
    opacity: 1,
    zIndex: 10,
  },
  iconWrapperInactive: {
    opacity: 1,
    zIndex: 1,
  },
  outlinedTextContainer: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
