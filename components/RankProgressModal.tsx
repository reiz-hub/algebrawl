// components/RankProgressModal.tsx
// Minimal, punchy animated rank progression, promotion, and defeat modal for ranked matches

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GameFonts } from '../constants/theme';
import { getRank, RankInfo, RANKS } from '../services/mmrService';
import { soundService } from '../services/soundService';
import TouchableOpacity from './TouchableOpacity';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RankProgressModalProps {
  visible: boolean;
  prevMmr: number;
  mmrChange: number;
  onComplete: () => void;
  // Optional preview override for testing in Dev Mode
  forceRankUpPreview?: {
    fromRankName?: string;
    toRankName?: string;
    fromMmr?: number;
    toMmr?: number;
  };
}

export default function RankProgressModal({
  visible,
  prevMmr,
  mmrChange,
  onComplete,
  forceRankUpPreview,
}: RankProgressModalProps) {
  // Rank calculations
  const effectivePrevMmr = forceRankUpPreview?.fromMmr ?? prevMmr;
  const effectiveMmrChange = forceRankUpPreview
    ? (forceRankUpPreview.toMmr ?? 1025) - (forceRankUpPreview.fromMmr ?? 980)
    : mmrChange;
  const effectiveNewMmr = Math.max(0, effectivePrevMmr + effectiveMmrChange);

  const startRank: RankInfo = useMemo(() => {
    if (forceRankUpPreview?.fromRankName) {
      const found = RANKS.find((r) => r.name.toLowerCase() === forceRankUpPreview.fromRankName?.toLowerCase());
      if (found) return found;
    }
    return getRank(effectivePrevMmr);
  }, [forceRankUpPreview, effectivePrevMmr]);

  const targetRank: RankInfo = useMemo(() => {
    if (forceRankUpPreview?.toRankName) {
      const found = RANKS.find((r) => r.name.toLowerCase() === forceRankUpPreview.toRankName?.toLowerCase());
      if (found) return found;
    }
    return getRank(effectiveNewMmr);
  }, [forceRankUpPreview, effectiveNewMmr]);

  const isPromotion = targetRank.minMmr > startRank.minMmr;
  const isDemotion = targetRank.minMmr < startRank.minMmr;
  const isDefeat = effectiveMmrChange < 0;

  // Next rank ceiling calculation for progress bar
  const startTierMin = startRank.minMmr;
  const nextRankTier = RANKS.find((r) => r.minMmr > startTierMin);
  const startTierMax = nextRankTier ? nextRankTier.minMmr : startTierMin + 500;
  const tierSpan = Math.max(1, startTierMax - startTierMin);

  const initialPercent = Math.min(100, Math.max(0, ((effectivePrevMmr - startTierMin) / tierSpan) * 100));
  const finalPercent = isPromotion
    ? 100
    : isDemotion
    ? 0
    : Math.min(100, Math.max(0, ((effectiveNewMmr - startTierMin) / tierSpan) * 100));

  // State
  const [displayedMmr, setDisplayedMmr] = useState(effectivePrevMmr);
  const [hasTransformed, setHasTransformed] = useState(false);
  const [showContinueBtn, setShowContinueBtn] = useState(false);

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.7)).current;
  const sunburstSpin = useRef(new Animated.Value(0)).current;
  const oldBadgeScale = useRef(new Animated.Value(0)).current;
  const oldBadgeOpacity = useRef(new Animated.Value(1)).current;
  const newBadgeScale = useRef(new Animated.Value(0)).current;
  const newBadgeOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(initialPercent)).current;
  const continueBtnAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0)).current;

  // Continuous background sunburst rotation
  useEffect(() => {
    if (!visible) return;
    const spinLoop = Animated.loop(
      Animated.timing(sunburstSpin, {
        toValue: 1,
        duration: isDefeat ? 18000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [visible, sunburstSpin, isDefeat]);

  // Main orchestration sequence
  useEffect(() => {
    if (!visible) {
      setHasTransformed(false);
      setShowContinueBtn(false);
      overlayOpacity.setValue(0);
      contentScale.setValue(0.7);
      oldBadgeScale.setValue(0);
      oldBadgeOpacity.setValue(1);
      newBadgeScale.setValue(0);
      newBadgeOpacity.setValue(0);
      shakeAnim.setValue(0);
      flashAnim.setValue(0);
      progressBarAnim.setValue(initialPercent);
      continueBtnAnim.setValue(0);
      headerScale.setValue(0);
      return;
    }

    setDisplayedMmr(effectivePrevMmr);
    setHasTransformed(false);
    setShowContinueBtn(false);

    // Audio on entry
    if (isDefeat) {
      soundService.playSound('defeat');
    }

    // 1. Enter Overlay & Starting Badge
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(oldBadgeScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Bar Progress & Number Ticker
    const timer1 = setTimeout(() => {
      soundService.playSound('click');

      Animated.timing(progressBarAnim, {
        toValue: finalPercent,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      const stepCount = 20;
      const stepDuration = 1000 / stepCount;
      const delta = effectiveNewMmr - effectivePrevMmr;
      let currentStep = 0;
      const tickerInterval = setInterval(() => {
        currentStep++;
        const currentVal = Math.round(effectivePrevMmr + (delta * currentStep) / stepCount);
        setDisplayedMmr(currentVal);
        if (currentStep >= stepCount) {
          clearInterval(tickerInterval);
          setDisplayedMmr(effectiveNewMmr);
        }
      }, stepDuration);
    }, 450);

    // 3. Transformation / Celebration / Defeat Effects
    let timer2: ReturnType<typeof setTimeout> | null = null;
    let timer3: ReturnType<typeof setTimeout> | null = null;

    if (isPromotion) {
      // PROMOTION: Badge shakes with tension, flashes, transforms to higher badge
      timer2 = setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();

        timer3 = setTimeout(() => {
          setHasTransformed(true);
          soundService.playSound('victory');

          // Flash
          Animated.sequence([
            Animated.timing(flashAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          // Old badge scales out
          Animated.parallel([
            Animated.timing(oldBadgeScale, { toValue: 1.4, duration: 200, useNativeDriver: true }),
            Animated.timing(oldBadgeOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          ]).start();

          // New badge scales in
          Animated.sequence([
            Animated.timing(newBadgeOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.spring(newBadgeScale, {
              toValue: 1,
              friction: 4,
              tension: 70,
              useNativeDriver: true,
            }),
          ]).start();

          // Header scale in
          Animated.spring(headerScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start();

          // Show continue button
          setTimeout(() => {
            setShowContinueBtn(true);
            Animated.spring(continueBtnAnim, {
              toValue: 1,
              friction: 6,
              useNativeDriver: true,
            }).start();
          }, 600);
        }, 350);
      }, 1500);
    } else if (isDemotion) {
      // DEMOTION: Badge rumbles down, flashes, reveals lower tier badge
      timer2 = setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        timer3 = setTimeout(() => {
          setHasTransformed(true);

          // Subtle flash
          Animated.sequence([
            Animated.timing(flashAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          // Old badge scales down
          Animated.parallel([
            Animated.timing(oldBadgeScale, { toValue: 0.6, duration: 200, useNativeDriver: true }),
            Animated.timing(oldBadgeOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          ]).start();

          // New (demoted) badge appears
          Animated.sequence([
            Animated.timing(newBadgeOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.spring(newBadgeScale, {
              toValue: 1,
              friction: 5,
              tension: 60,
              useNativeDriver: true,
            }),
          ]).start();

          Animated.spring(headerScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            setShowContinueBtn(true);
            Animated.spring(continueBtnAnim, {
              toValue: 1,
              friction: 6,
              useNativeDriver: true,
            }).start();
          }, 600);
        }, 300);
      }, 1500);
    } else if (isDefeat) {
      // DEFEAT WITHIN SAME RANK: subtle rumble, no badge change
      timer2 = setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        setShowContinueBtn(true);
        Animated.spring(continueBtnAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 1500);
    } else {
      // WIN WITHIN SAME RANK: gentle pulse
      timer2 = setTimeout(() => {
        Animated.sequence([
          Animated.timing(oldBadgeScale, { toValue: 1.12, duration: 150, useNativeDriver: true }),
          Animated.spring(oldBadgeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();

        setShowContinueBtn(true);
        Animated.spring(continueBtnAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 1500);
    }

    return () => {
      clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
    };
  }, [visible, isPromotion, isDemotion, isDefeat, effectivePrevMmr, effectiveNewMmr, finalPercent, initialPercent]);

  const handlePressContinue = () => {
    soundService.playSound('click');
    onComplete();
  };

  const spin = sunburstSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const activeRank = hasTransformed ? targetRank : startRank;
  const themeColor = isDefeat ? '#ef4444' : activeRank.color;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onComplete}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {/* Flash effect on rank-up / demotion */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { opacity: flashAnim }]}
        />

        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: contentScale }] },
          ]}
        >
          {/* Header Title */}
          {isPromotion && hasTransformed ? (
            <Animated.Text
              style={[
                styles.headerTitle,
                {
                  color: targetRank.color,
                  transform: [{ scale: headerScale }],
                },
              ]}
            >
              PROMOTED TO
            </Animated.Text>
          ) : isDemotion && hasTransformed ? (
            <Animated.Text
              style={[
                styles.headerTitle,
                {
                  color: '#ef4444',
                  transform: [{ scale: headerScale }],
                },
              ]}
            >
              DEMOTED TO
            </Animated.Text>
          ) : isDefeat ? (
            <Text style={[styles.headerTitle, { color: '#ef4444' }]}>
              DEFEAT
            </Text>
          ) : (
            <View style={styles.titlePlaceholder} />
          )}

          {/* Badge Showcase Arena with Sunburst */}
          <View style={styles.badgeArena}>
            {/* Sunburst Rays */}
            <Animated.View
              style={[
                styles.sunburstWrapper,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <View style={[styles.sunburstRay, { backgroundColor: themeColor, opacity: isDefeat ? 0.12 : 0.18 }]} />
              <View
                style={[
                  styles.sunburstRay,
                  { transform: [{ rotate: '45deg' }], backgroundColor: themeColor, opacity: isDefeat ? 0.12 : 0.18 },
                ]}
              />
              <View
                style={[
                  styles.sunburstRay,
                  { transform: [{ rotate: '90deg' }], backgroundColor: themeColor, opacity: isDefeat ? 0.12 : 0.18 },
                ]}
              />
              <View
                style={[
                  styles.sunburstRay,
                  { transform: [{ rotate: '135deg' }], backgroundColor: themeColor, opacity: isDefeat ? 0.12 : 0.18 },
                ]}
              />
            </Animated.View>

            {/* Glow Aura */}
            <View
              style={[
                styles.glowCircle,
                { backgroundColor: themeColor, shadowColor: themeColor },
              ]}
            />

            {/* Current Badge */}
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  opacity: oldBadgeOpacity,
                  transform: [
                    { scale: oldBadgeScale },
                    { translateX: shakeAnim },
                  ],
                },
              ]}
            >
              <Image source={startRank.icon} style={styles.rankIcon} resizeMode="contain" />
            </Animated.View>

            {/* Transformed Badge (Promoted or Demoted) */}
            {(isPromotion || isDemotion) && (
              <Animated.View
                style={[
                  styles.badgeContainer,
                  styles.badgeAbsolute,
                  {
                    opacity: newBadgeOpacity,
                    transform: [{ scale: newBadgeScale }],
                  },
                ]}
              >
                <Image source={targetRank.icon} style={styles.rankIcon} resizeMode="contain" />
              </Animated.View>
            )}
          </View>

          {/* Minimal MMR & Progress Section */}
          <View style={styles.cardWrapper}>
            <View style={styles.cardShadow} />
            <View style={styles.cardContent}>
              {/* MMR & Gain/Loss Delta */}
              <View style={styles.mmrRow}>
                <Text style={styles.mmrScoreText}>{displayedMmr} MMR</Text>
                <Text
                  style={[
                    styles.mmrDeltaText,
                    { color: isDefeat ? '#ef4444' : '#22c55e' },
                  ]}
                >
                  {effectiveMmrChange > 0 ? `+${effectiveMmrChange}` : `${effectiveMmrChange}`}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressBarAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: themeColor,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <Animated.View
            pointerEvents={showContinueBtn ? 'auto' : 'none'}
            style={[
              styles.continueBtnWrapper,
              {
                opacity: continueBtnAnim,
                transform: [
                  {
                    translateY: continueBtnAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.btnShadow} />
            <TouchableOpacity
              style={[
                styles.btnContinue,
                isDefeat && styles.btnContinueDefeat,
              ]}
              onPress={handlePressContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.btnContinueText}>CONTINUE</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 6, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 99,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 44, 340),
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 10,
  },
  titlePlaceholder: {
    height: 38,
  },
  headerTitle: {
    fontFamily: GameFonts.arcade,
    fontSize: 24,
    letterSpacing: 2,
    marginBottom: 6,
    height: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  sunburstWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  sunburstRay: {
    position: 'absolute',
    width: 12,
    height: 250,
    borderRadius: 6,
  },
  badgeArena: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  glowCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 12,
  },
  badgeContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeAbsolute: {
    position: 'absolute',
  },
  rankIcon: {
    width: 145,
    height: 145,
  },
  cardWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  cardShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    backgroundColor: '#000000',
    borderRadius: 14,
  },
  cardContent: {
    backgroundColor: '#1f1712',
    borderWidth: 2,
    borderColor: '#3d2e22',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mmrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mmrScoreText: {
    fontFamily: GameFonts.arcade,
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: 1,
  },
  mmrDeltaText: {
    fontFamily: GameFonts.arcade,
    fontSize: 18,
    letterSpacing: 1,
  },
  progressBarTrack: {
    width: '100%',
    height: 14,
    backgroundColor: '#0f0a07',
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#3d2e22',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  continueBtnWrapper: {
    width: '100%',
    position: 'relative',
  },
  btnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  btnContinue: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnContinueDefeat: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  btnContinueText: {
    fontFamily: GameFonts.arcade,
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
});
