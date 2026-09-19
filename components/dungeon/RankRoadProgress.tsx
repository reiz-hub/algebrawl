// components/dungeon/RankRoadProgress.tsx
// Non-swipable, clean rank tier progression with glowing connector line between ranks

import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GameFonts } from '../../constants/theme';
import { getRank, RankInfo, RANKS } from '../../services/mmrService';
import { soundService } from '../../services/soundService';
import TouchableOpacity from '../TouchableOpacity';

const ITEM_WIDTH = 44;
const PADDING_H = 8;
const LINE_OFFSET = PADDING_H + ITEM_WIDTH / 2; // Center of first and last node (30px)

interface RankRoadProgressProps {
  mmr?: number | null;
}

export default function RankRoadProgress({ mmr }: RankRoadProgressProps) {
  const currentMmr = mmr ?? 0;
  const currentRank = useMemo(() => getRank(currentMmr), [currentMmr]);

  const [selectedRank, setSelectedRank] = useState<RankInfo | null>(null);

  const currentIndex = useMemo(() => {
    const idx = RANKS.findIndex((r) => r.name === currentRank.name);
    return idx >= 0 ? idx : 0;
  }, [currentRank]);

  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  // Calculate overall connector progress across the 4 segments (0% to 100%)
  const progressPercent = useMemo(() => {
    if (currentIndex >= RANKS.length - 1) {
      return 100; // Conqueror (max rank)
    }
    const currentMin = currentRank.minMmr;
    const nextMin = nextRank ? nextRank.minMmr : currentMin + 500;
    const tierSpan = Math.max(1, nextMin - currentMin);
    const tierFraction = Math.min(1, Math.max(0, (currentMmr - currentMin) / tierSpan));
    const totalFraction = (currentIndex + tierFraction) / (RANKS.length - 1);
    return Math.min(100, Math.max(0, totalFraction * 100));
  }, [currentMmr, currentIndex, currentRank, nextRank]);

  const handlePressNode = (rankItem: RankInfo) => {
    soundService.playSound('click');
    setSelectedRank(rankItem);
  };

  return (
    <View style={styles.container}>
      {/* Connector Line Tracks (Positioned behind the badge nodes) */}
      <View style={styles.lineContainer} pointerEvents="none">
        {/* Base Inactive Groove */}
        <View style={styles.baseTrack} />

        {/* Active Glowing Beam */}
        {progressPercent > 0 && (
          <View style={[styles.activeTrackWrapper, { width: `${progressPercent}%` }]}>
            {/* Ambient Outer Halo */}
            <View style={styles.glowingHalo} />
            {/* Mid Laser Beam */}
            <View style={styles.glowingLaser} />
            {/* Core White Filament */}
            <View style={styles.coreFilament} />
            {/* Glowing Leading Energy Dot */}
            {progressPercent < 100 && (
              <View style={styles.leadingGlowDot}>
                <View style={styles.leadingGlowDotCore} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Row of 5 Rank Nodes */}
      <View style={styles.nodesRow}>
        {RANKS.map((r) => {
          const isAchieved = currentMmr >= r.minMmr;
          const isCurrent = currentRank.name === r.name;

          return (
            <TouchableOpacity
              key={r.name}
              activeOpacity={0.8}
              style={styles.nodeItem}
              onPress={() => handlePressNode(r)}
            >
              {/* Icon Wrapper (No border around rank icon) */}
              <View style={styles.tierIconWrapper}>
                <Image
                  source={r.icon}
                  style={[
                    styles.rankIcon,
                    isCurrent && styles.rankIconCurrent,
                    !isAchieved && styles.rankIconLocked,
                  ]}
                  resizeMode="contain"
                />

                {!isAchieved && (
                  <Image
                    source={r.icon}
                    style={styles.tierIconShadowOverlay}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* Just number / MMR below rank */}
              <Text
                style={[
                  styles.tierMmrText,
                  { color: isAchieved ? r.color : '#8c7e6c' },
                  isCurrent && styles.tierMmrTextCurrent,
                  !isAchieved && styles.tierTextLocked,
                ]}
              >
                {r.minMmr}+
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Rank Info Modal */}
      <Modal
        visible={!!selectedRank}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRank(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <View style={styles.modalShadow} />
            <View style={styles.modalContent}>
              {selectedRank && (
                <>
                  <View style={styles.modalHeaderRow}>
                    <Image
                      source={selectedRank.icon}
                      style={styles.modalRankIcon}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalRankName, { color: selectedRank.color }]}>
                        {selectedRank.name.toUpperCase()}
                      </Text>
                      <Text style={styles.modalRankMmr}>
                        Requirement: {selectedRank.minMmr}+ MMR
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalInfoList}>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoEmoji}>🛡️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalInfoTitle}>Tier Status</Text>
                        <Text style={styles.modalInfoDesc}>
                          {currentMmr >= selectedRank.minMmr
                            ? currentRank.name === selectedRank.name
                              ? 'This is your current ranked tier!'
                              : 'Tier mastered & completed.'
                            : `Need ${selectedRank.minMmr - currentMmr} more MMR to unlock.`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoEmoji}>⚖️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalInfoTitle}>Elo Calibration</Text>
                        <Text style={styles.modalInfoDesc}>
                          {selectedRank.name === 'Bronze'
                            ? 'Beginner tier: loss cushion (0.65x penalty) applied.'
                            : selectedRank.name === 'Silver' || selectedRank.name === 'Gold'
                            ? 'Balanced 1:1 Elo matchmaking (K=32).'
                            : 'Prestigious tier: Strict calibration (K=24) with no cushions.'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => {
                      soundService.playSound('click');
                      setSelectedRank(null);
                    }}
                  >
                    <Text style={styles.modalCloseText}>CLOSE</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: PADDING_H,
    marginTop: 6,
    position: 'relative',
  },
  lineContainer: {
    position: 'absolute',
    left: LINE_OFFSET,
    right: LINE_OFFSET,
    top: 25, // Exactly center-aligned with 38px rank icons
    height: 12,
    justifyContent: 'center',
    zIndex: 1,
  },
  baseTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2d9cc',
    borderWidth: 0.5,
    borderColor: '#cfc4b2',
  },
  activeTrackWrapper: {
    position: 'absolute',
    left: 0,
    height: 12,
    justifyContent: 'center',
  },
  glowingHalo: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 2,
  },
  glowingLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  coreFilament: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  leadingGlowDot: {
    position: 'absolute',
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  leadingGlowDotCore: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  tierIconWrapper: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  rankIcon: {
    width: 38,
    height: 38,
  },
  rankIconCurrent: {
    width: 42,
    height: 42,
    transform: [{ scale: 1.1 }],
  },
  rankIconLocked: {
    opacity: 0.35,
  },
  tierIconShadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 38,
    height: 38,
    tintColor: '#000000',
    opacity: 0.6,
  },
  tierMmrText: {
    fontFamily: GameFonts.arcade,
    fontSize: 10,
  },
  tierMmrTextCurrent: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
  },
  tierTextLocked: {
    opacity: 0.5,
  },
  // Info Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 340,
    position: 'relative',
  },
  modalShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 18,
  },
  modalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalRankIcon: {
    width: 52,
    height: 52,
  },
  modalRankName: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
  },
  modalRankMmr: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
  },
  modalDivider: {
    height: 1.5,
    backgroundColor: '#e5d9c4',
  },
  modalInfoList: {
    gap: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalInfoEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  modalInfoTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
  },
  modalInfoDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#6b5c49',
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#1a1008',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#ffffff',
  },
});
