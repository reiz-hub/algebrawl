import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCharacterDetails } from '../../constants/characterSkills';
import { GameFonts } from '../../constants/theme';
import { useGameStore } from '../../hooks/useGameStore';
import { getRank, RANKS } from '../../services/mmrService';
import {
  checkConnectivity,
  getRankedMatchHistory,
  RankedMatchHistoryItem,
} from '../../services/multiplayerService';
import { soundService } from '../../services/soundService';
import NeoButton from '../NeoButton';
import TouchableOpacity from '../TouchableOpacity';

export default function RankView() {
  const router = useRouter();
  const { userId, ingameName, username, isLoggedIn, mmr } = useGameStore();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [matchHistory, setMatchHistory] = useState<RankedMatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showNoConnectionModal, setShowNoConnectionModal] = useState(false);

  const rank = getRank(mmr);

  const requireLoginAndConnection = (action: () => void) => {
    if (!isLoggedIn) {
      soundService.playSound('click');
      setShowLoginModal(true);
      return;
    }
    checkConnectivity().then((isOnline) => {
      if (!isOnline) {
        soundService.playSound('click');
        setShowNoConnectionModal(true);
        return;
      }
      action();
    });
  };

  const handleFindMatch = () => {
    requireLoginAndConnection(() => {
      router.push({
        pathname: '/waiting-room' as any,
        params: { action: 'search' },
      });
    });
  };

  const handleOpenHistory = async () => {
    requireLoginAndConnection(async () => {
      soundService.playSound('click');
      setShowHistoryModal(true);
      setLoadingHistory(true);
      if (userId) {
        const history = await getRankedMatchHistory(userId, 5);
        setMatchHistory(history);
      }
      setLoadingHistory(false);
    });
  };

  const formatMatchDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Player MMR Card / Guest Banner */}
      {isLoggedIn ? (
        <View style={styles.mmrCard}>
          <View style={styles.mmrCardShadow} />
          <View style={styles.mmrCardContent}>
            <Text style={styles.mmrPlayerName}>
              {ingameName || username || 'Player'}
            </Text>
            <View style={styles.mmrRow}>
              <Image source={rank.icon} style={styles.mmrRankIcon} resizeMode="contain" />
              <View>
                <Text style={[styles.mmrRankName, { color: rank.color }]}>{rank.name}</Text>
                <Text style={styles.mmrValue}>{mmr} MMR</Text>
              </View>
            </View>

            {/* Rank Tiers Overview */}
            <View style={styles.tierOverviewContainer}>
              {RANKS.map((r) => {
                const isAchieved = (mmr ?? 0) >= r.minMmr;
                const isCurrent = rank.name === r.name;
                return (
                  <View
                    key={r.name}
                    style={[styles.tierItem, isCurrent && styles.tierItemCurrent]}
                  >
                    <View style={styles.tierIconWrapper}>
                      <Image
                        source={r.icon}
                        style={[
                          styles.tierIcon,
                          !isAchieved && styles.tierIconLocked,
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
                    <Text
                      style={[
                        styles.tierMmrText,
                        { color: isAchieved ? r.color : '#8c7e6c' },
                        !isAchieved && styles.tierTextLocked,
                      ]}
                    >
                      {r.minMmr}+
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.guestCard}
          onPress={() => {
            soundService.playSound('click');
            setShowLoginModal(true);
          }}
        >
          <View style={styles.guestCardShadow} />
          <View style={styles.guestCardContent}>
            <View style={styles.guestHeaderRow}>
              <View style={styles.guestLockBadge}>
                <Text style={{ fontSize: 22 }}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>GUEST PLAYER</Text>
                <Text style={styles.guestSubtitle}>Account required to play Ranked matches</Text>
              </View>
            </View>

            <View style={styles.guestBtnRow}>
              <Text style={styles.guestBtnText}>TAP TO LOG IN / REGISTER ➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Ranked Queue Section */}
      <View style={styles.rankedSectionHeaderRow}>
        <View style={styles.sectionHeaderFlex}>
          <Text style={styles.sectionEmoji}>⚔️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>RANKED MATCH</Text>
            <Text style={styles.sectionDesc}>Real Players • 3 Hearts • ±200 MMR</Text>
          </View>
        </View>

        {/* Small History Button */}
        <TouchableOpacity
          style={styles.historySmallBtn}
          onPress={handleOpenHistory}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={13} color="#1a1008" />
          <Text style={styles.historySmallBtnText}>HISTORY (5)</Text>
        </TouchableOpacity>
      </View>

      <NeoButton style={styles.rankedBtn} onPress={handleFindMatch}>
        <Feather name="search" size={24} color="#fff" />
        <Text style={styles.rankedBtnText}>Find Match</Text>
      </NeoButton>

      {/* How It Works Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>HOW IT WORKS</Text>
        <Text style={styles.infoItem}>👥  Real players only (No bots / AI)</Text>
        <Text style={styles.infoItem}>🎯  Matchmaking within 200 MMR difference</Text>
        <Text style={styles.infoItem}>❤️  3 Hearts: Lose 1 heart on wrong answer (0 = Knockout)</Text>
        <Text style={styles.infoItem}>⏳  10-second Ready Check before match start</Text>
        <Text style={styles.infoItem}>⏱️  5-minute battle with identical seeded questions</Text>
        <Text style={styles.infoItem}>🏆  Winner gains MMR (Forfeit/Knockout loses MMR)</Text>
      </View>

      {/* Ranked Match History Modal (Max 5 previous matches) */}
      <Modal visible={showHistoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalWrapper}>
            <View style={styles.historyModalShadow} />
            <View style={styles.historyModalContent}>
              <View style={styles.historyHeaderRow}>
                <View style={styles.historyHeaderTitleCol}>
                  <Text style={styles.historyTitle}>📜 RANKED HISTORY</Text>
                  <Text style={styles.historySubtitle}>Last 5 ranked matches</Text>
                </View>
                <TouchableOpacity
                  style={styles.historyCloseBtn}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowHistoryModal(false);
                  }}
                >
                  <Feather name="x" size={18} color="#1a1008" />
                </TouchableOpacity>
              </View>

              {loadingHistory ? (
                <View style={styles.historyLoadingBox}>
                  <Feather name="loader" size={24} color="#1a1008" />
                  <Text style={styles.historyLoadingText}>Fetching match history...</Text>
                </View>
              ) : matchHistory.length === 0 ? (
                <View style={styles.historyEmptyBox}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>⚔️</Text>
                  <Text style={styles.historyEmptyTitle}>No Ranked History</Text>
                  <Text style={styles.historyEmptyText}>
                    Play a ranked match to start recording your 5 most recent battle results!
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                  {matchHistory.map((item) => {
                    const isWin = item.result === 'VICTORY';
                    const isLoss = item.result === 'DEFEAT';
                    const oppChar = getCharacterDetails(item.opponentCharacter);
                    const oppRank = getRank(item.opponentMmr);

                    return (
                      <View key={item.id} style={styles.historyItemCard}>
                        <View
                          style={[
                            styles.historyBadge,
                            isWin
                              ? styles.historyBadgeWin
                              : isLoss
                                ? styles.historyBadgeLoss
                                : styles.historyBadgeDraw,
                          ]}
                        >
                          <Text style={styles.historyBadgeText}>
                            {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                          </Text>
                        </View>

                        <View style={styles.historyMiddleCol}>
                          <View style={styles.historyOpponentRow}>
                            <Text style={styles.historyCharIcon}>{oppChar.icon}</Text>
                            <Text style={styles.historyOpponentName} numberOfLines={1}>
                              {item.opponentName}
                            </Text>
                            <Image
                              source={oppRank.icon}
                              style={styles.historyOpponentRankIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <Text style={styles.historyDate}>{formatMatchDate(item.date)}</Text>
                        </View>

                        <View style={styles.historyRightCol}>
                          <Text style={styles.historyScore}>
                            {item.myScore} - {item.opponentScore}
                          </Text>
                          <Text
                            style={[
                              styles.historyMmrChange,
                              item.mmrChange > 0
                                ? styles.mmrGain
                                : item.mmrChange < 0
                                  ? styles.mmrLoss
                                  : styles.mmrEven,
                            ]}
                          >
                            {item.mmrChange > 0 ? `+${item.mmrChange}` : item.mmrChange} MMR
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.historyDismissBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setShowHistoryModal(false);
                }}
              >
                <Text style={styles.historyDismissText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Login Required Modal */}
      <Modal visible={showLoginModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loginModalWrapper}>
            <View style={styles.loginModalShadow} />
            <View style={styles.loginModalContent}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeIcon}>🔒</Text>
              </View>

              <Text style={styles.loginModalTitle}>LOGIN REQUIRED</Text>
              <Text style={styles.loginModalSubtitle}>
                Sign in or register to battle online, gain MMR, and climb the leaderboard!
              </Text>

              <View style={styles.loginFeatureList}>
                <View style={styles.loginFeatureItem}>
                  <Text style={styles.loginFeatureEmoji}>🏆</Text>
                  <Text style={styles.loginFeatureText}>Compete in Ranked matches & gain MMR</Text>
                </View>
                <View style={styles.loginFeatureItem}>
                  <Text style={styles.loginFeatureEmoji}>👥</Text>
                  <Text style={styles.loginFeatureText}>Create & join private Versus lobbies</Text>
                </View>
                <View style={styles.loginFeatureItem}>
                  <Text style={styles.loginFeatureEmoji}>📜</Text>
                  <Text style={styles.loginFeatureText}>Save battle history & view match results</Text>
                </View>
              </View>

              <View style={styles.loginActionCol}>
                <TouchableOpacity
                  style={styles.loginBtnPrimary}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowLoginModal(false);
                    router.push('/(tabs)/profile' as any);
                  }}
                >
                  <Feather name="log-in" size={18} color="#fff" />
                  <Text style={styles.loginBtnPrimaryText}>GO TO LOGIN / REGISTER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginCancelBtn}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowLoginModal(false);
                  }}
                >
                  <Text style={styles.loginCancelText}>MAYBE LATER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Internet Connection Modal */}
      <Modal visible={showNoConnectionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.noConnModalWrapper}>
            <View style={styles.noConnModalShadow} />
            <View style={styles.noConnModalContent}>
              <View style={styles.noConnIconBadge}>
                <Text style={styles.noConnIconText}>📡</Text>
              </View>

              <Text style={styles.noConnTitle}>NO CONNECTION</Text>
              <Text style={styles.noConnSubtitle}>
                {"You're offline! Ranked matches require an active internet connection."}
              </Text>

              <View style={styles.noConnTipsList}>
                <View style={styles.noConnTipItem}>
                  <Text style={styles.noConnTipEmoji}>📶</Text>
                  <Text style={styles.noConnTipText}>Check your Wi-Fi or mobile data</Text>
                </View>
                <View style={styles.noConnTipItem}>
                  <Text style={styles.noConnTipEmoji}>🔄</Text>
                  <Text style={styles.noConnTipText}>Try toggling Airplane Mode off</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.noConnBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setShowNoConnectionModal(false);
                }}
              >
                <Text style={styles.noConnBtnText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  mmrCard: {
    position: 'relative',
    width: '100%',
  },
  mmrCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  mmrCardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  mmrPlayerName: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
  },
  mmrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mmrRankIcon: {
    width: 44,
    height: 44,
  },
  mmrRankName: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
  },
  mmrValue: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
  },
  tierOverviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f5f0',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2d9cc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  tierItem: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierItemCurrent: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1a1008',
  },
  tierIconWrapper: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  tierIcon: {
    width: 38,
    height: 38,
  },
  tierIconLocked: {
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
  tierTextLocked: {
    opacity: 0.5,
  },
  guestCard: {
    position: 'relative',
    width: '100%',
  },
  guestCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  guestCardContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestLockBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e5d9c4',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  guestSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  guestBtnRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5d9c4',
    paddingTop: 10,
    alignItems: 'center',
  },
  guestBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a6cf5',
  },
  rankedSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionEmoji: {
    fontSize: 22,
  },
  sectionTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  sectionDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
  },
  historySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  historySmallBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
    color: '#1a1008',
  },
  rankedBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  rankedBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 20,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoItem: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#554838',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  historyModalWrapper: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    position: 'relative',
  },
  historyModalShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  historyModalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 20,
    maxHeight: '100%',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyHeaderTitleCol: {
    flex: 1,
  },
  historyTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
  },
  historySubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  historyCloseBtn: {
    padding: 4,
  },
  historyLoadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  historyLoadingText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
  },
  historyEmptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  historyEmptyTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    marginBottom: 6,
  },
  historyEmptyText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  historyList: {
    maxHeight: 260,
    marginBottom: 16,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
  },
  historyBadgeWin: {
    backgroundColor: '#22c55e',
  },
  historyBadgeLoss: {
    backgroundColor: '#e8302a',
  },
  historyBadgeDraw: {
    backgroundColor: '#f5a623',
  },
  historyBadgeText: {
    fontFamily: GameFonts.brawl,
    fontSize: 9,
    color: '#fff',
  },
  historyMiddleCol: {
    flex: 1,
  },
  historyOpponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCharIcon: {
    fontSize: 14,
  },
  historyOpponentName: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
    maxWidth: 90,
  },
  historyOpponentRankIcon: {
    width: 20,
    height: 20,
  },
  historyDate: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
    color: '#7a6a55',
  },
  historyRightCol: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontFamily: GameFonts.impact,
    fontSize: 13,
    color: '#1a1008',
  },
  historyMmrChange: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
  },
  mmrGain: {
    color: '#16a34a',
  },
  mmrLoss: {
    color: '#dc2626',
  },
  mmrEven: {
    color: '#7a6a55',
  },
  historyDismissBtn: {
    backgroundColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  historyDismissText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
  },
  loginModalWrapper: {
    width: '100%',
    maxWidth: 340,
    position: 'relative',
  },
  loginModalShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  loginModalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  lockBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadgeIcon: {
    fontSize: 26,
  },
  loginModalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
  },
  loginModalSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  loginFeatureList: {
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  loginFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginFeatureEmoji: {
    fontSize: 16,
  },
  loginFeatureText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
  },
  loginActionCol: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  loginBtnPrimary: {
    backgroundColor: '#1a6cf5',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnPrimaryText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },
  loginCancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginCancelText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  noConnModalWrapper: {
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  noConnModalShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  noConnModalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  noConnIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConnIconText: {
    fontSize: 24,
  },
  noConnTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
  },
  noConnSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  noConnTipsList: {
    width: '100%',
    gap: 8,
  },
  noConnTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noConnTipEmoji: {
    fontSize: 16,
  },
  noConnTipText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
  },
  noConnBtn: {
    width: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  noConnBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
  },
});
