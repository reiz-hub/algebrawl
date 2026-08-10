// components/AttackProjectile.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { GameFonts } from '../constants/theme';

export interface AttackProjectileProps {
  active: boolean;
  attacker: 'player' | 'enemy';
  characterId?: string;
  enemyId?: string;
  hasDoubleStrike?: boolean;
  hasShield?: boolean;
  onImpact?: () => void;
  onComplete?: () => void;
}

export interface PowerConfig {
  name: string;
  image: any;
  mainColor: string;
  glowColor: string;
  particles: string[];
  impactColor: string;
  symbol: string;
}

const POWER_CONFIGS: Record<string, PowerConfig> = {
  c0: {
    name: 'Algebraic Punch',
    image: require('../assets/projectiles/punch.png'),
    mainColor: '#f97316',
    glowColor: '#ff4500',
    particles: ['+', '-', 'x', '/', 'x²', '√y'],
    impactColor: '#ea580c',
    symbol: 'PUNCH',
  },
  char_algebro: {
    name: 'Algebraic Punch',
    image: require('../assets/projectiles/punch.png'),
    mainColor: '#f97316',
    glowColor: '#ff4500',
    particles: ['+', '-', 'x', '/', 'x²', '√y'],
    impactColor: '#ea580c',
    symbol: 'PUNCH',
  },
  punch: {
    name: 'Algebraic Punch',
    image: require('../assets/projectiles/punch.png'),
    mainColor: '#f97316',
    glowColor: '#ff4500',
    particles: ['+', '-', 'x', '/', 'x²', '√y'],
    impactColor: '#ea580c',
    symbol: 'PUNCH',
  },
  c1: {
    name: 'Logic Matrix Frost',
    image: require('../assets/projectiles/ice.png'),
    mainColor: '#06b6d4',
    glowColor: '#38bdf8',
    particles: ['0', '1', '0101', 'if()', 'code'],
    impactColor: '#0284c7',
    symbol: 'CODE',
  },
  c2: {
    name: 'Gravity Bomb',
    image: require('../assets/projectiles/void.png'),
    mainColor: '#a855f7',
    glowColor: '#eab308',
    particles: ['F=ma', '∫dx', 'g', 'v', 'Δt'],
    impactColor: '#7e22ce',
    symbol: 'GRAV',
  },
  c3: {
    name: 'High-Voltage Arc',
    image: require('../assets/projectiles/electric.png'),
    mainColor: '#f59e0b',
    glowColor: '#3b82f6',
    particles: ['kV', 'AC', 'DC', 'V', 'A'],
    impactColor: '#d97706',
    symbol: 'VOLT',
  },
  c4: {
    name: 'Radium Gamma Blast',
    image: require('../assets/projectiles/radium.png'),
    mainColor: '#22c55e',
    glowColor: '#4ade80',
    particles: ['Ra', 'γ', 'α', 'β', 'eV'],
    impactColor: '#16a34a',
    symbol: 'RAD',
  },
  enemy: {
    name: 'Shadow Void Blast',
    image: require('../assets/projectiles/void.png'),
    mainColor: '#dc2626',
    glowColor: '#9333ea',
    particles: ['*', '+', 'x', '!'],
    impactColor: '#991b1b',
    symbol: 'VOID',
  },
  villain2: {
    name: 'Orcish Heavy Slash',
    image: require('../assets/projectiles/orc_slash.png'),
    mainColor: '#e8302a',
    glowColor: '#dc2626',
    particles: ['*', '+', 'x', '!'],
    impactColor: '#991b1b',
    symbol: 'SLASH',
  },
  orc: {
    name: 'Orcish Heavy Slash',
    image: require('../assets/projectiles/orc_slash.png'),
    mainColor: '#e8302a',
    glowColor: '#dc2626',
    particles: ['*', '+', 'x', '!'],
    impactColor: '#991b1b',
    symbol: 'SLASH',
  },
  orc_slash: {
    name: 'Orcish Heavy Slash',
    image: require('../assets/projectiles/orc_slash.png'),
    mainColor: '#e8302a',
    glowColor: '#dc2626',
    particles: ['*', '+', 'x', '!'],
    impactColor: '#991b1b',
    symbol: 'SLASH',
  },
  slime: {
    name: 'Toxic Slime Spit',
    image: require('../assets/projectiles/spit.png'),
    mainColor: '#22c55e',
    glowColor: '#4ade80',
    particles: ['+', '-', 'x', '÷', 'x²', '√y'],
    impactColor: '#15803d',
    symbol: 'SPIT',
  },
  spit: {
    name: 'Toxic Slime Spit',
    image: require('../assets/projectiles/spit.png'),
    mainColor: '#22c55e',
    glowColor: '#4ade80',
    particles: ['+', '-', 'x', '÷', 'x²', '√y'],
    impactColor: '#15803d',
    symbol: 'SPIT',
  },
  knight: {
    name: 'Knight Blade Slash',
    image: require('../assets/projectiles/slash.png'),
    mainColor: '#38bdf8',
    glowColor: '#60a5fa',
    particles: ['⚔️', '⚡', '⚔️', '⚡'],
    impactColor: '#0284c7',
    symbol: 'SLASH',
  },
  slash: {
    name: 'Knight Blade Slash',
    image: require('../assets/projectiles/slash.png'),
    mainColor: '#38bdf8',
    glowColor: '#60a5fa',
    particles: ['⚔️', '⚡', '⚔️', '⚡'],
    impactColor: '#0284c7',
    symbol: 'SLASH',
  },
};

export default function AttackProjectile({
  active,
  attacker,
  characterId = 'c0',
  enemyId,
  hasDoubleStrike = false,
  hasShield = false,
  onImpact,
  onComplete,
}: AttackProjectileProps) {
  const [containerWidth, setContainerWidth] = useState(340);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const flightAnim = useRef(new Animated.Value(0)).current;
  const impactAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const powerConfig =
    attacker === 'player'
      ? POWER_CONFIGS[characterId] || POWER_CONFIGS.c0
      : (enemyId && POWER_CONFIGS[enemyId]) || POWER_CONFIGS.enemy;

  useEffect(() => {
    if (!active) {
      setIsAnimating(false);
      setShowImpact(false);
      setIsBlocked(false);
      return;
    }

    setIsAnimating(true);
    setShowImpact(false);
    setIsBlocked(false);
    flightAnim.setValue(0);
    impactAnim.setValue(0);
    spinAnim.setValue(0);

    // Straight linear flight sequence
    Animated.timing(flightAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setShowImpact(true);

      const blocked = attacker === 'enemy' && hasShield;
      setIsBlocked(blocked);

      if (onImpact) {
        onImpact();
      }

      // Impact explosion & floating text
      Animated.timing(impactAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        if (onComplete) {
          onComplete();
        }
      });
    });
  }, [active]);

  if (!active && !isAnimating) return null;

  const startX = attacker === 'player' ? 40 : containerWidth - 100;
  const targetX = attacker === 'player' ? containerWidth - 100 : 40;

  const projectileTranslateX = flightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, targetX],
  });

  const baseScale = hasDoubleStrike && attacker === 'player' ? 1.6 : 1.1;

  const projectileScale = flightAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0.6 * baseScale, baseScale, baseScale, 1.2 * baseScale],
  });

  // Impact burst scales
  const impactRingScale = impactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 2.5],
  });

  const impactRingOpacity = impactAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.7, 0],
  });

  const popupTranslateY = impactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });

  const popupScale = impactAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.5, 1.3, 1],
  });

  const popupOpacity = impactAnim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  const particleAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* 1. FLYING PROJECTILE (STRAIGHT FLIGHT, NO GLOW BACKGROUND) */}
      {!showImpact && (
        <Animated.View
          style={[
            styles.projectileWrapper,
            {
              transform: [
                { translateX: projectileTranslateX },
                { scale: projectileScale },
                ...(attacker === 'enemy' ? [{ scaleX: -1 as const }] : []),
              ],
            },
          ]}
        >
          {/* Projectile Sprite Image */}
          <Image
            source={powerConfig.image}
            style={styles.projectileImage}
            resizeMode="contain"
          />

          {/* Double Strike Aura */}
          {hasDoubleStrike && attacker === 'player' && (
            <View style={styles.doubleStrikeAura}>
              <Text style={styles.doubleStrikeIcon}>2X POWER</Text>
            </View>
          )}

          {/* Floating Power Particles behind Projectile */}
          <View style={styles.particlesContainer}>
            {powerConfig.particles.slice(0, 3).map((symbol, idx) => (
              <Animated.Text
                key={idx}
                style={[
                  styles.floatingParticleText,
                  {
                    color: powerConfig.mainColor,
                    transform: [
                      {
                        translateX: (idx - 1) * 14 * (attacker === 'player' ? -1 : 1),
                      },
                      { translateY: (idx % 2 === 0 ? 1 : -1) * 10 },
                    ],
                  },
                ]}
              >
                {symbol}
              </Animated.Text>
            ))}
          </View>
        </Animated.View>
      )}

      {/* 2. IMPACT BURST & DAMAGE POPUP */}
      {showImpact && (
        <View style={[styles.impactContainer, { left: targetX - 30 }]}>
          {/* Shield Forcefield Barrier Deflection */}
          {isBlocked ? (
            <Animated.View
              style={[
                styles.shieldDeflectBarrier,
                {
                  transform: [{ scale: popupScale }],
                  opacity: popupOpacity,
                },
              ]}
            >
              <Text style={styles.shieldDeflectText}>SHIELD BLOCKED!</Text>
            </Animated.View>
          ) : (
            <>
              {/* Expanding Shockwave Ring */}
              <Animated.View
                style={[
                  styles.impactRing,
                  {
                    borderColor: powerConfig.mainColor,
                    backgroundColor: powerConfig.glowColor,
                    transform: [{ scale: impactRingScale }],
                    opacity: impactRingOpacity,
                  },
                ]}
              />

              {/* Burst Particles */}
              {particleAngles.map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const distance = 40;
                const pX = impactAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos(rad) * distance],
                });
                const pY = impactAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin(rad) * distance],
                });
                const pSymbol =
                  powerConfig.particles[i % powerConfig.particles.length];

                return (
                  <Animated.Text
                    key={i}
                    style={[
                      styles.burstParticle,
                      {
                        transform: [{ translateX: pX }, { translateY: pY }],
                        opacity: impactRingOpacity,
                      },
                    ]}
                  >
                    {pSymbol}
                  </Animated.Text>
                );
              })}

              {/* Floating Combat Damage Popup */}
              <Animated.View
                style={[
                  styles.damagePopup,
                  {
                    backgroundColor: attacker === 'player' ? '#22c55e' : '#e8302a',
                    transform: [{ translateY: popupTranslateY }, { scale: popupScale }],
                    opacity: popupOpacity,
                  },
                ]}
              >
                <Text style={styles.damagePopupText}>
                  {attacker === 'player'
                    ? hasDoubleStrike
                      ? '2X CRIT HIT!'
                      : 'HIT! -1 HP'
                    : 'HIT! -1 HEART'}
                </Text>
              </Animated.View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  projectileWrapper: {
    position: 'absolute',
    top: '30%',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  projectileImage: {
    width: 54,
    height: 54,
  },
  specialOverlayText: {
    fontFamily: GameFonts.brawl,
    position: 'absolute',
    fontSize: 24,
  },
  doubleStrikeAura: {
    position: 'absolute',
    top: -16,
    backgroundColor: '#b91c1c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  doubleStrikeIcon: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  particlesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingParticleText: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  impactContainer: {
    position: 'absolute',
    top: '30%',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  impactRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  burstParticle: {
    fontFamily: GameFonts.brawl,
    position: 'absolute',
    fontSize: 18,
  },
  damagePopup: {
    position: 'absolute',
    top: -30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1008',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  damagePopupText: {
    fontFamily: GameFonts.arcade,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shieldDeflectBarrier: {
    backgroundColor: '#0284c7',
    borderWidth: 3,
    borderColor: '#f5a623',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 8,
  },
  shieldDeflectIcon: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
  },
  shieldDeflectText: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
