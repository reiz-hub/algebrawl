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
  villain1: {
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
    particles: ['/', '\\', 'x', '+', '!', '='],
    impactColor: '#0284c7',
    symbol: 'SLASH',
  },
  slash: {
    name: 'Knight Blade Slash',
    image: require('../assets/projectiles/slash.png'),
    mainColor: '#38bdf8',
    glowColor: '#60a5fa',
    particles: ['/', '\\', 'x', '+', '!', '='],
    impactColor: '#0284c7',
    symbol: 'SLASH',
  },
  mummy: {
    name: 'Ancient Mummy Curse',
    image: require('../assets/projectiles/mummy_projectile.png'),
    mainColor: '#f59e0b',
    glowColor: '#d97706',
    particles: ['x²', '√y', '+', '-', '÷', '='],
    impactColor: '#b45309',
    symbol: 'CURSE',
  },
  mummy_projectile: {
    name: 'Ancient Mummy Curse',
    image: require('../assets/projectiles/mummy_projectile.png'),
    mainColor: '#f59e0b',
    glowColor: '#d97706',
    particles: ['x²', '√y', '+', '-', '÷', '='],
    impactColor: '#b45309',
    symbol: 'CURSE',
  },
  golem: {
    name: 'Seismic Golem Thorns',
    image: require('../assets/projectiles/thorns.png'),
    mainColor: '#a855f7',
    glowColor: '#7c3aed',
    particles: ['F=ma', 'x²', 'Δt', '+', 'x', '='],
    impactColor: '#581c87',
    symbol: 'THORNS',
  },
  thorns: {
    name: 'Seismic Golem Thorns',
    image: require('../assets/projectiles/thorns.png'),
    mainColor: '#a855f7',
    glowColor: '#7c3aed',
    particles: ['F=ma', 'x²', 'Δt', '+', 'x', '='],
    impactColor: '#581c87',
    symbol: 'THORNS',
  },
  easy_dragon: {
    name: 'Inferno Dragon Flame',
    image: require('../assets/projectiles/easy_flame.png'),
    mainColor: '#f97316',
    glowColor: '#dc2626',
    particles: ['x²', 'x³', 'Δ', 'π', '+', 'x'],
    impactColor: '#b91c1c',
    symbol: 'FLAME',
  },
  dragon: {
    name: 'Inferno Dragon Flame',
    image: require('../assets/projectiles/easy_flame.png'),
    mainColor: '#f97316',
    glowColor: '#dc2626',
    particles: ['x²', 'x³', 'Δ', 'π', '+', 'x'],
    impactColor: '#b91c1c',
    symbol: 'FLAME',
  },
  easy_flame: {
    name: 'Inferno Dragon Flame',
    image: require('../assets/projectiles/easy_flame.png'),
    mainColor: '#f97316',
    glowColor: '#dc2626',
    particles: ['x²', 'x³', 'Δ', 'π', '+', 'x'],
    impactColor: '#b91c1c',
    symbol: 'FLAME',
  },
  medium_dragon: {
    name: 'Inferno Dragon Flame',
    image: require('../assets/projectiles/medium_flame.png'),
    mainColor: '#f97316',
    glowColor: '#dc2626',
    particles: ['x²', 'x³', 'Δ', 'π', '+', 'x'],
    impactColor: '#b91c1c',
    symbol: 'FLAME',
  },
  medium_flame: {
    name: 'Inferno Dragon Flame',
    image: require('../assets/projectiles/medium_flame.png'),
    mainColor: '#f97316',
    glowColor: '#dc2626',
    particles: ['x²', 'x³', 'Δ', 'π', '+', 'x'],
    impactColor: '#b91c1c',
    symbol: 'FLAME',
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

  const onImpactRef = useRef(onImpact);
  onImpactRef.current = onImpact;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowImpact(true);

      const blocked = attacker === 'enemy' && hasShield;
      setIsBlocked(blocked);

      if (onImpactRef.current) {
        onImpactRef.current();
      }

      // Impact explosion & floating text
      Animated.timing(impactAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      });
    });
  }, [active, attacker, hasShield]);

  const isVisible = active || isAnimating;

  const startX = attacker === 'player' ? 45 : containerWidth - 115;
  const targetX = attacker === 'player' ? containerWidth - 115 : 45;

  const projectileTranslateX = flightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, targetX],
  });

  const baseScale = hasDoubleStrike && attacker === 'player' ? 1.7 : 1.3;

  const projectileScale = flightAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0.7 * baseScale, baseScale, baseScale, 1.15 * baseScale],
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

  return (
    <View
      style={[StyleSheet.absoluteFillObject, styles.rootContainer]}
      pointerEvents="none"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      {/* Pre-warm image in background memory so it renders with zero decode delay */}
      {!isVisible && (
        <Image
          source={powerConfig.image}
          style={styles.preloaderImage}
          resizeMode="contain"
        />
      )}

      {/* 1. FLYING PROJECTILE (CLEAN SPRITE FLIGHT) */}
      {isVisible && !showImpact && (
        <Animated.View
          style={[
            styles.projectileWrapper,
            {
              transform: [
                { translateX: projectileTranslateX },
                { scale: projectileScale },
                { scaleX: attacker === 'enemy' ? -1 : 1 },
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
        </Animated.View>
      )}

      {/* 2. IMPACT BURST & DAMAGE POPUP */}
      {isVisible && showImpact && (
        <View style={[styles.impactContainer, { left: targetX - 38 }]}>
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

              {/* Floating Combat Damage Text (Pure text, no box) */}
              <Animated.View
                style={[
                  styles.damagePopup,
                  {
                    transform: [{ translateY: popupTranslateY }, { scale: popupScale }],
                    opacity: popupOpacity,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.damagePopupText,
                    {
                      color:
                        attacker === 'player'
                          ? hasDoubleStrike
                            ? '#f59e0b'
                            : '#22c55e'
                          : '#e8302a',
                    },
                  ]}
                >
                  {attacker === 'player'
                    ? hasDoubleStrike
                      ? 'CRIT -2 HP'
                      : '-1 HP'
                    : '-1 HEART'}
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
  rootContainer: {
    zIndex: 999,
    elevation: 100,
  },
  preloaderImage: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
  projectileWrapper: {
    position: 'absolute',
    left: 0,
    top: '38%',
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 101,
  },
  projectileImage: {
    width: 82,
    height: 82,
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
  impactContainer: {
    position: 'absolute',
    top: '42%',
    width: 78,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    elevation: 102,
  },
  impactRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
  },
  damagePopup: {
    position: 'absolute',
    top: -34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  damagePopupText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
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
