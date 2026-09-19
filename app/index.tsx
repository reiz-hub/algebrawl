import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet, Text, View, ViewStyle } from 'react-native';
import NeoButton from '../components/NeoButton';
import { GameFonts } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15, // Move up by 15px
          duration: 1500, // Smooth slow bounce
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  return (
    <ImageBackground
      source={require('../assets/images/mapbg/homebg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '15%', left: '15%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '45%', left: '10%', transform: [{ rotate: '15deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '20%', left: '20%', transform: [{ rotate: '-5deg' }] }]}>×</Text>

      <Text style={[styles.bgSymbol, { top: '20%', right: '15%', transform: [{ rotate: '10deg' }] }]}>∑</Text>
      <Text style={[styles.bgSymbol, { top: '50%', right: '10%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', right: '15%', transform: [{ rotate: '5deg' }] }]}>÷</Text>

      {/* Main Content */}
      <View style={styles.content}>
        <Animated.Image
          source={require('../assets/images/logos/Logo1.png')}
          style={[styles.logoImage, { transform: [{ translateY: bounceAnim }] }]}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          {/* Single Action Button: PLAY */}
          <NeoButton
            style={styles.btnPlay as ViewStyle}
            onPress={() => router.replace('/(tabs)/dungeon' as any)}
          >
            <Feather name="play" size={32} color="#fff" />
            <Text style={styles.btnPlayText}>PLAY</Text>
          </NeoButton>
        </View>
      </View>

      {/* App Version */}
      <Text style={styles.versionText}>version 0.0.01</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff9f0',
    overflow: 'hidden'
  },
  bgSymbol: {
    fontFamily: GameFonts.impact,
    position: 'absolute',
    fontSize: 50,
    color: '#e5d9c4',
    opacity: 0.6,
    zIndex: 0
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  logoImage: {
    width: 450,
    height: 260,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '85%',
    maxWidth: 320,
    gap: 24
  },
  btnWrapper: {
    position: 'relative',
    width: '100%'
  },
  btnShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16
  },
  btnPlay: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  btnPlayText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 26,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  btnVersus: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  btnVersusText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  btnMultiplayer: {
    backgroundColor: '#8b5cf6',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  btnMultiplayerText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  btnShop: {
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  btnShopText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  btnSecondary: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  btnSecondaryText: {
    fontFamily: GameFonts.brawl,
    color: '#1a1008',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  versionText: {
    fontFamily: GameFonts.arcade,
    position: 'absolute',
    bottom: 25,
    width: '100%',
    textAlign: 'center',
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
});
