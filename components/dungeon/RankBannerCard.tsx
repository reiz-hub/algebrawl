// components/dungeon/RankBannerCard.tsx
// Competitive rank banner inspired by AAA mobile game rank cards

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

interface RankBannerCardProps {
  mmr?: number | null;
  playerName?: string | null;
}

export default function RankBannerCard({ mmr, playerName }: RankBannerCardProps) {
  const currentMmr = mmr ?? 0;
  const currentRank = useMemo(() => getRank(currentMmr), [currentMmr]);

  const [selectedRank, setSelectedRank] = useState<RankInfo | null>(null);

  const currentIndex = useMemo(() => {
    const idx = RANKS.findIndex((r) => r.name === currentRank.name);
    return idx >= 0 ? idx : 0;
  }, [currentRank]);

  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  // Next rank MMR and progress calculations
  const { targetMmr, neededMmr, progressPercent } = useMemo(() => {
    if (!nextRank) {
      return {
        targetMmr: currentRank.minMmr,
        neededMmr: 0,
        progressPercent: 100,
      };
    }
    const tierStart = currentRank.minMmr;
    const tierEnd = nextRank.minMmr;
    const span = Math.max(1, tierEnd - tierStart);
    const progress = Math.min(100, Math.max(0, ((currentMmr - tierStart) / span) * 100));
    const needed = Math.max(0, tierEnd - currentMmr);
    return {
      targetMmr: tierEnd,
      neededMmr: needed,
      progressPercent: progress,
    };
  }, [currentMmr, currentRank, nextRank]);

  const handlePressRank = (rankInfo: RankInfo) => {
    soundService.playSound('click');
    setSelectedRank(rankInfo);
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Neo-brutalist Hard Drop Shadow */}
      <View style={styles.cardShadow} />

      {/* Main Banner Content */}
      <View style={styles.cardContent}>
        {/* Left: Current Rank Crest */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.crestCol}
          onPress={() => handlePressRank(currentRank)}
        >
          <Image
            source={currentRank.icon}
            style={styles.currentCrestIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Center: Rank Title, MMR Ratio, Progress Bar */}
        <View style={styles.centerCol}>
          {/* Player Name / Tag */}
          <Text style={styles.playerNameText} numberOfLines={1}>
            {playerName || 'Player'}
          </Text>

          {/* Current Rank Title */}
          <Text
            style={[styles.rankTitleText, { color: currentRank.color }]}
            numberOfLines={1}
          >
            {currentRank.name.toUpperCase()}
          </Text>

          {/* MMR Ratio: e.g. 1056 / 1500 MMR */}
          <Text style={styles.mmrRatioText} numberOfLines={1}>
            <Text style={styles.mmrCurrentText}>{currentMmr}</Text>
            <Text style={styles.mmrDividerText}> / </Text>
            <Text style={styles.mmrTargetText}>{targetMmr} MMR</Text>
          </Text>

          {/* Progress Bar & Percentage */}
          <View style={styles.progressBarRow}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progressPercent)}%` },
                ]}
              />
            </View>
            <Text style={styles.percentText}>
              {Math.round(progressPercent)}%
            </Text>
          </View>
        </View>

        {/* Right: Next Rank Preview Sub-Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.nextRankSubCard}
          onPress={() => handlePressRank(nextRank || currentRank)}
        >
          {nextRank ? (
            <View style={styles.nextRankRow}>
              <Image
                source={nextRank.icon}
                style={styles.nextRankIcon}
                resizeMode="contain"
              />
              <View style={styles.nextRankCol}>
                <Text style={styles.nextRankLabel}>Next Rank</Text>
                <Text
                  style={[styles.nextRankName, { color: nextRank.color }]}
                  numberOfLines={1}
                >
                  {nextRank.name.toUpperCase()}
                </Text>
                <Text style={styles.nextRankNeededText}>
                  {neededMmr} MMR Needed
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.nextRankRow}>
              <Image
                source={currentRank.icon}
                style={styles.nextRankIcon}
                resizeMode="contain"
              />
              <View style={styles.nextRankCol}>
                <Text style={styles.nextRankLabel}>Top Tier</Text>
                <Text style={[styles.nextRankName, { color: '#ef4444' }]}>
                  CONQUEROR
                </Text>
                <Text style={styles.nextRankNeededText}>Max Rank Achieved</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Interactive Rank Details Modal */}
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
                              ? 'This is your currently active ranked tier!'
                              : 'Tier mastered & unlocked.'
                            : `Need ${selectedRank.minMmr - currentMmr} more MMR to reach this tier.`}
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
  cardWrapper: {
    position: 'relative',
    width: '100%',
  },
  cardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  cardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCrestIcon: {
    width: 54,
    height: 54,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  playerNameText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#8c7e6c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankTitleText: {
    fontFamily: GameFonts.brawl,
    fontSize: 15,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  mmrRatioText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  mmrCurrentText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
  },
  mmrDividerText: {
    color: '#9ca3af',
  },
  mmrTargetText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e8ded0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a1008',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a6cf5',
    borderRadius: 3,
  },
  percentText: {
    fontFamily: GameFonts.brawl,
    fontSize: 9,
    color: '#1a1008',
    minWidth: 26,
  },
  nextRankSubCard: {
    backgroundColor: '#f8f4ec',
    borderWidth: 1.5,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  nextRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextRankIcon: {
    width: 30,
    height: 30,
  },
  nextRankCol: {
    justifyContent: 'center',
  },
  nextRankLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 8,
    color: '#8c7e6c',
    textTransform: 'uppercase',
  },
  nextRankName: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    lineHeight: 14,
  },
  nextRankNeededText: {
    fontFamily: GameFonts.hud,
    fontSize: 8,
    color: '#6b5c49',
  },
  // Modal Styles
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
