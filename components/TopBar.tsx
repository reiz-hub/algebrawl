import { Feather } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchableOpacity from './TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { soundService } from '../services/soundService';

const CHARACTER_AVATARS: Record<string, any> = {
  c0: require('../assets/images/avatar/algebroavatar.png'),
  char_algebro: require('../assets/images/avatar/algebroavatar.png'),
  c1: require('../assets/images/avatar/lovelaceavatar.png'),
  c2: require('../assets/images/avatar/newtonavatar.png'),
  c3: require('../assets/images/avatar/teslaavatar.png'),
  c4: require('../assets/images/avatar/curieavatar.png'),
  c5: require('../assets/images/avatar/algegalavatar.png'),
  char_algegal: require('../assets/images/avatar/algegalavatar.png'),
};

interface TopBarProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function TopBar({ title, onBack, showBackButton = true }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const coins = useGameStore((state) => state.coins);
  const username = useGameStore((state) => state.username);
  const ingameName = useGameStore((state) => state.ingameName);
  const isLoggedIn = useGameStore((state) => state.isLoggedIn);
  const unlockedLevel = useGameStore((state) => state.unlockedLevel);
  const equippedCharacter = useGameStore((state) => state.equippedCharacter);

  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20) + 6;

  const displayName = (isLoggedIn && ingameName)
    ? ingameName.toUpperCase()
    : (username ? username.toUpperCase() : 'GUEST_01');

  const avatarSource = CHARACTER_AVATARS[equippedCharacter] || CHARACTER_AVATARS.c0;

  const handleBack = () => {
    soundService.playSound('click');
    if (onBack) {
      onBack();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dungeon' as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop }]}>
      {/* Top Row: Profile (Left) & Coins (Right) */}
      <View style={styles.topRow}>
        {/* Left Side: Avatar + Name + Level */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarShadow} />
            <View style={styles.avatarBox}>
              <Image source={avatarSource} style={styles.avatarImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>LVL {unlockedLevel || 1}</Text>
            </View>
          </View>
        </View>

        {/* Right Side: Coin Balance */}
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* Screen Indicator Row with Back Button on the Right */}
      {!!title && (
        <View style={styles.screenRow}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {title}
          </Text>

          {showBackButton && (
            <View style={styles.backBtnWrapper}>
              <View style={styles.backBtnShadow} />
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="arrow-left" size={14} color="#1a1008" />
                <Text style={styles.backBtnText}>BACK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff9f0',
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#1a1008',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatarShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 40,
    height: 40,
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1008',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
  },
  profileInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  nameText: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  levelText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 0.5,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinText: {
    fontFamily: GameFonts.impact,
    fontSize: 15,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  screenTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 8,
  },
  backBtnWrapper: {
    position: 'relative',
  },
  backBtnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5a623',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
});
