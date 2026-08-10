import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { GameFonts } from '../constants/theme';
import { soundService } from '../services/soundService';
import TouchableOpacity from './TouchableOpacity';

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Rotation animation for settings gear
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial load from service
    setMusicEnabled(soundService.getMusicEnabled());
    setSoundEnabled(soundService.getSoundEnabled());
  }, []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleToggleMusic = async () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    await soundService.setMusicEnabled(newValue);
  };

  const handleToggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await soundService.setSoundEnabled(newValue);
  };

  const handleDevUnlockAll = () => {
    useGameStore.getState().unlockAllDev();
    Alert.alert(
      'DEV MODE 🔓',
      'All levels (1-7), characters, gears, skills, and 9,999 coins have been unlocked!'
    );
    setIsOpen(false);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      {/* Click Outside Overlay to Close */}
      {isOpen && (
        <Pressable 
          style={StyleSheet.absoluteFillObject} 
          onPress={() => setIsOpen(false)} 
        />
      )}

      <View style={styles.container}>
        {/* Main Floating Settings Button */}
        <View style={styles.btnWrapper}>
          <View style={styles.btnShadow} />
          <TouchableOpacity
            style={[styles.settingsBtn, isOpen && styles.settingsBtnOpen]}
            activeOpacity={0.8}
            onPress={() => setIsOpen(!isOpen)}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather 
                name={isOpen ? "x" : "settings"} 
                size={22} 
                color="#1a1008" 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Collapsible Dropdown Card */}
        {isOpen && (
          <View style={styles.menuContainer}>
            <View style={styles.menuShadow} />
            <View style={styles.menuInner}>
              <Text style={styles.menuHeader}>AUDIO CONFIG</Text>
              
              {/* Music Toggle Item */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={handleToggleMusic}
              >
                <View style={[styles.iconBox, !musicEnabled && styles.iconBoxDisabled]}>
                  <Feather 
                    name={musicEnabled ? "music" : "slash"} 
                    size={16} 
                    color={musicEnabled ? "#fff" : "#7a6a55"} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.toggleTitle, !musicEnabled && styles.textDisabled]}>
                    MUSIC
                  </Text>
                </View>
                {/* Neo-brutalist Switch Pill */}
                <View style={[styles.switchTrack, musicEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
                  <View style={[styles.switchThumb, musicEnabled ? styles.switchThumbOn : styles.switchThumbOff]} />
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Sound Effects Toggle Item */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={handleToggleSound}
              >
                <View style={[styles.iconBox, !soundEnabled && styles.iconBoxDisabled, soundEnabled && { backgroundColor: '#f5a623' }]}>
                  <Feather 
                    name={soundEnabled ? "volume-2" : "volume-x"} 
                    size={16} 
                    color={soundEnabled ? "#fff" : "#7a6a55"} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.toggleTitle, !soundEnabled && styles.textDisabled]}>
                    SOUNDS
                  </Text>
                </View>
                {/* Neo-brutalist Switch Pill */}
                <View style={[styles.switchTrack, soundEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
                  <View style={[styles.switchThumb, soundEnabled ? styles.switchThumbOn : styles.switchThumbOff]} />
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Developer Unlock All Button */}
              <TouchableOpacity
                style={styles.devUnlockRow}
                activeOpacity={0.8}
                onPress={handleDevUnlockAll}
              >
                <View style={styles.devIconBox}>
                  <Feather name="unlock" size={15} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.devUnlockTitle}>DEV UNLOCK</Text>
                  <Text style={styles.devUnlockSub}>Unlock All 🔓</Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 50,
    right: 16,
    zIndex: 9999,
    alignItems: 'flex-end',
  },
  btnWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  btnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 48,
    height: 48,
    backgroundColor: '#1a1008',
    borderRadius: 24,
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtnOpen: {
    backgroundColor: '#e8302a',
  },
  menuContainer: {
    position: 'relative',
    marginTop: 12,
    width: 195,
  },
  menuShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  menuInner: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  menuHeader: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxDisabled: {
    backgroundColor: '#e5d9c4',
  },
  textContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  textDisabled: {
    color: '#7a6a55',
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 2,
    backgroundColor: '#e5d9c4',
    marginHorizontal: -4,
  },
  switchTrack: {
    width: 42,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#1a1008',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#22c55e',
  },
  switchTrackOff: {
    backgroundColor: '#e5d9c4',
  },
  switchThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1a1008',
    backgroundColor: '#fff',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  devUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  devIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e8302a',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devUnlockTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#e8302a',
    letterSpacing: 0.5,
  },
  devUnlockSub: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
    color: '#7a6a55',
  },
});
