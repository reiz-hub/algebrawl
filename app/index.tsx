import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import NeoButton from '../components/NeoButton';

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
    <View style={styles.container}>
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

          {/* Primary Button: Start Adventure */}
          <NeoButton style={styles.btnPrimary as ViewStyle} onPress={() => router.push('/map')}>
            <Feather name="play" size={28} color="#fff" />
            <Text style={styles.btnPrimaryText}>Start Adventure</Text>
          </NeoButton>

          {/* Versus Button */}
          <NeoButton style={styles.btnVersus as ViewStyle} onPress={() => router.push('/versus')}>
            <Feather name="crosshair" size={28} color="#fff" />
            <Text style={styles.btnVersusText}>Versus</Text>
          </NeoButton>

          {/* Secondary Button: Player Stats */}
          <NeoButton style={styles.btnSecondary as ViewStyle} onPress={() => router.push('/stats')}>
            <Feather name="user" size={28} color="#1a1008" />
            <Text style={styles.btnSecondaryText}>Player Stats</Text>
          </NeoButton>


        </View>
      </View>

      {/* App Version */}
      <Text style={styles.versionText}>version 0.0.01</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
    overflow: 'hidden'
  },
  bgSymbol: {
    position: 'absolute',
    fontSize: 50,
    fontWeight: '900',
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
  btnPrimary: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
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
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
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
    color: '#1a1008',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  versionText: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#7a6a55',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
});
