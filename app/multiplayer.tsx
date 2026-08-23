// app/multiplayer.tsx
// Multiplayer Hub — Create Room, Join Room, Find Match, Leaderboard

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { getRank } from '../services/mmrService';
import { getRankedMatchHistory, RankedMatchHistoryItem } from '../services/multiplayerService';
import { getCharacterDetails } from '../constants/characterSkills';
import { soundService } from '../services/soundService';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { userId, ingameName, username, isLoggedIn, mmr } = useGameStore();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [matchHistory, setMatchHistory] = useState<RankedMatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const rank = getRank(mmr);

  const requireLogin = (action: () => void) => {
    if (!isLoggedIn) {
      soundService.playSound('click');
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const handleCreateRoom = () => {
    requireLogin(() => {
      router.push({
        pathname: '/waiting-room' as any,
        params: { action: 'create' },
      });
    });
  };

  const handleJoinRoom = () => {
    requireLogin(() => setShowJoinModal(true));
  };

  const handleSubmitJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Room codes are 6 characters long.');
      return;
    }
    setShowJoinModal(false);
    setJoinCode('');
    router.push({
      pathname: '/waiting-room' as any,
      params: { action: 'join', code },
    });
  };

  const handleFindMatch = () => {
    requireLogin(() => {
      router.push({
        pathname: '/waiting-room' as any,
        params: { action: 'search' },
      });
    });
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard' as any);
  };

  const handleOpenHistory = async () => {
    requireLogin(async () => {
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.title}>⚔️ MULTIPLAYER</Text>
      <Text style={styles.subtitle}>Online • Real-Time • Ranked</Text>

      {/* Player MMR Card / Guest Banner */}
      {isLoggedIn ? (
        <View style={styles.mmrCard}>
          <View style={styles.mmrCardShadow} />
          <View style={styles.mmrCardContent}>
            <Text style={styles.mmrPlayerName}>
              {ingameName || username || 'Player'}
            </Text>
            <View style={styles.mmrRow}>
              <Text style={styles.mmrBadge}>{rank.badge}</Text>
              <View>
                <Text style={[styles.mmrRankName, { color: rank.color }]}>{rank.name}</Text>
                <Text style={styles.mmrValue}>{mmr} MMR</Text>
              </View>
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
                <Text style={styles.guestSubtitle}>Account required to play Ranked & Versus matches</Text>
              </View>
            </View>

            <View style={styles.guestBtnRow}>
              <Text style={styles.guestBtnText}>TAP TO LOG IN / REGISTER ➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Lobby Versus Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>🏠</Text>
        <View>
          <Text style={styles.sectionTitle}>LOBBY VERSUS</Text>
          <Text style={styles.sectionDesc}>Play with a friend using a room code</Text>
        </View>
      </View>

      <View style={styles.lobbyRow}>
        <NeoButton
          wrapperStyle={styles.lobbyBtnWrapper}
          style={styles.createBtn}
          onPress={handleCreateRoom}
        >
          <Feather name="plus-circle" size={22} color="#fff" />
          <Text style={styles.btnText}>Create Room</Text>
        </NeoButton>

        <NeoButton
          wrapperStyle={styles.lobbyBtnWrapper}
          style={styles.joinBtn}
          onPress={handleJoinRoom}
        >
          <Feather name="log-in" size={22} color="#fff" />
          <Text style={styles.btnText}>Join Room</Text>
        </NeoButton>
      </View>

      {/* Ranked Queue Section */}
      <View style={styles.rankedSectionHeaderRow}>
        <View style={styles.sectionHeaderFlex}>
          <Text style={styles.sectionEmoji}>⚔️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>RANKED MATCH</Text>
            <Text style={styles.sectionDesc}>Real Players • 3 Hearts • ±200 MMR</Text>
          </View>
        </View>

        {/* Small History Button (Ranked Match Only, Max 5) */}
        <TouchableOpacity
          style={styles.historySmallBtn}
          onPress={handleOpenHistory}
          activeOpacity={0.7}
        >
          <Feather name="clock" size={13} color="#1a1008" />
          <Text style={styles.historySmallBtnText}>HISTORY (5)</Text>
        </TouchableOpacity>
      </View>

      <NeoButton
        style={styles.rankedBtn}
        onPress={handleFindMatch}
      >
        <Feather name="search" size={24} color="#fff" />
        <Text style={styles.rankedBtnText}>Find Match</Text>
      </NeoButton>

      {/* Leaderboard Button */}
      <NeoButton
        wrapperStyle={{ marginTop: 12 }}
        style={styles.leaderboardBtn}
        onPress={handleLeaderboard}
      >
        <Feather name="award" size={24} color="#1a1008" />
        <Text style={styles.leaderboardBtnText}>Leaderboard</Text>
      </NeoButton>

      {/* How It Works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>HOW IT WORKS</Text>
        <Text style={styles.infoItem}>👥  Real players only (No bots / AI)</Text>
        <Text style={styles.infoItem}>🎯  Matchmaking within 200 MMR difference</Text>
        <Text style={styles.infoItem}>❤️  3 Hearts: Lose 1 heart on wrong answer (0 = Knockout)</Text>
        <Text style={styles.infoItem}>⏳  10-second Ready Check before match start</Text>
        <Text style={styles.infoItem}>⏱️  5-minute battle with identical seeded questions</Text>
        <Text style={styles.infoItem}>🏆  Winner gains MMR (Forfeit/Knockout loses MMR)</Text>
      </View>

      {/* Back Button */}
      <NeoButton
        wrapperStyle={{ marginTop: 8 }}
        style={styles.backBtn}
        onPress={() => router.replace('/')}
      >
        <Feather name="arrow-left" size={20} color="#1a1008" />
        <Text style={styles.backBtnText}>Back to Menu</Text>
      </NeoButton>

      {/* Join Room Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalShadow} />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>JOIN ROOM</Text>
              <Text style={styles.modalSubtitle}>Enter the 6-character room code</Text>

              <TextInput
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
                style={styles.codeInput}
                placeholder="XXXXXX"
                placeholderTextColor="#b0a18e"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowJoinModal(false); setJoinCode(''); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalJoinBtn, joinCode.length !== 6 && styles.modalBtnDisabled]}
                  onPress={handleSubmitJoin}
                  disabled={joinCode.length !== 6}
                >
                  <Text style={styles.modalJoinText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ranked Match History Modal (Max 5 previous matches) */}
      <Modal visible={showHistoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalWrapper}>
            <View style={styles.historyModalShadow} />
            <View style={styles.historyModalContent}>
              {/* Header */}
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
                        {/* Result Badge */}
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

                        {/* Opponent Info */}
                        <View style={styles.historyMiddleCol}>
                          <View style={styles.historyOpponentRow}>
                            <Text style={styles.historyCharIcon}>{oppChar.icon}</Text>
                            <Text style={styles.historyOpponentName} numberOfLines={1}>
                              {item.opponentName}
                            </Text>
                            <Text style={styles.historyOpponentRankBadge}>{oppRank.badge}</Text>
                          </View>
                          <Text style={styles.historyDate}>{formatMatchDate(item.date)}</Text>
                        </View>

                        {/* Score & MMR Change */}
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

              {/* Close Button */}
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
              {/* Lock Badge */}
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeIcon}>🔒</Text>
              </View>

              <Text style={styles.loginModalTitle}>LOGIN REQUIRED</Text>
              <Text style={styles.loginModalSubtitle}>
                Sign in or register to battle online, gain MMR, and climb the leaderboard!
              </Text>

              {/* Feature Benefits List */}
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

              {/* Action Buttons */}
              <View style={styles.loginActionCol}>
                <TouchableOpacity
                  style={styles.loginBtnPrimary}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowLoginModal(false);
                    router.push('/stats' as any);
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff9f0',
  },
  title: {
    fontFamily: GameFonts.brawl,
    fontSize: 30,
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
  },

  // MMR Card
  mmrCard: {
    position: 'relative',
    marginBottom: 24,
  },
  mmrCardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  mmrCardContent: {
    backgroundColor: '#1a1008',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  mmrPlayerName: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#f5a623',
    marginBottom: 8,
  },
  mmrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mmrBadge: {
    fontSize: 36,
  },
  mmrRankName: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mmrValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    color: '#ffffff',
    marginTop: 2,
  },
  loginHint: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#f5a623',
    marginTop: 10,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  rankedSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 28,
  },
  sectionTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  sectionDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },

  // History Small Button
  historySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  historySmallBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
    letterSpacing: 0.5,
  },

  // Lobby Buttons
  lobbyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  lobbyBtnWrapper: {
    flex: 1,
  },
  createBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#fff',
    textTransform: 'uppercase',
  },

  // Ranked Button
  rankedBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rankedBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Leaderboard
  leaderboardBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  leaderboardBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  infoItem: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#3d3222',
    marginBottom: 6,
  },

  // Back
  backBtn: {
    backgroundColor: '#e5d9c4',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    textTransform: 'uppercase',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 350,
    position: 'relative',
  },
  modalShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 24,
    color: '#1a6cf5',
    marginBottom: 6,
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
    marginBottom: 20,
  },
  codeInput: {
    fontFamily: GameFonts.arcade,
    fontSize: 28,
    color: '#1a1008',
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#e5d9c4',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    textTransform: 'uppercase',
  },
  modalJoinBtn: {
    flex: 1,
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalJoinText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },

  // History Modal
  historyModalWrapper: {
    width: '100%',
    maxWidth: 360,
    position: 'relative',
  },
  historyModalShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  historyModalContent: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 20,
    maxHeight: 520,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 2,
    borderColor: '#f0e6d6',
    paddingBottom: 10,
  },
  historyHeaderTitleCol: {
    flex: 1,
  },
  historyTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  historySubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    marginTop: 1,
  },
  historyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1008',
    backgroundColor: '#f1ebd8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyLoadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  historyLoadingText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
  },
  historyEmptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  historyEmptyTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    marginBottom: 4,
  },
  historyEmptyText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  historyList: {
    maxHeight: 320,
    marginBottom: 12,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdfbf7',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
  },
  historyBadgeWin: {
    backgroundColor: '#22c55e',
  },
  historyBadgeLoss: {
    backgroundColor: '#e8302a',
  },
  historyBadgeDraw: {
    backgroundColor: '#f59e0b',
  },
  historyBadgeText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
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
    fontSize: 13,
    color: '#1a1008',
    flexShrink: 1,
  },
  historyOpponentRankBadge: {
    fontSize: 12,
  },
  historyDate: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    marginTop: 2,
  },
  historyRightCol: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    color: '#1a1008',
  },
  historyMmrChange: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    marginTop: 1,
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
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  historyDismissText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 1,
  },

  // Guest Card
  guestCard: {
    position: 'relative',
    marginBottom: 24,
  },
  guestCardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  guestCardContent: {
    backgroundColor: '#fff9e6',
    borderWidth: 3,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 16,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  guestLockBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  guestSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  guestBtnRow: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Login Required Modal
  loginModalWrapper: {
    width: '100%',
    maxWidth: 360,
    position: 'relative',
  },
  loginModalShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 18,
  },
  loginModalContent: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    borderWidth: 3,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockBadgeIcon: {
    fontSize: 28,
  },
  loginModalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 22,
    color: '#e8302a',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  loginModalSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  loginFeatureList: {
    width: '100%',
    backgroundColor: '#fdfbf7',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 18,
  },
  loginFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginFeatureEmoji: {
    fontSize: 16,
  },
  loginFeatureText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#1a1008',
    flex: 1,
  },
  loginActionCol: {
    width: '100%',
    gap: 8,
  },
  loginBtnPrimary: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnPrimaryText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.5,
  },
  loginCancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginCancelText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#7a6a55',
    letterSpacing: 0.5,
  },
});
