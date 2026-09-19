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
import { GameFonts } from '../../constants/theme';
import { useGameStore } from '../../hooks/useGameStore';
import {
  checkConnectivity,
} from '../../services/multiplayerService';
import { soundService } from '../../services/soundService';
import NeoButton from '../NeoButton';
import RankProgressModal from '../RankProgressModal';
import Sprite from '../sprite';
import TouchableOpacity from '../TouchableOpacity';
import RankBannerCard from './RankBannerCard';

export default function RankView() {
  const router = useRouter();
  const { userId, ingameName, username, isLoggedIn, mmr, devModeEnabled, equippedCharacter } = useGameStore();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNoConnectionModal, setShowNoConnectionModal] = useState(false);
  const [previewRankModal, setPreviewRankModal] = useState<{
    visible: boolean;
    fromRank: string;
    toRank: string;
    fromMmr: number;
    toMmr: number;
  }>({
    visible: false,
    fromRank: 'Bronze',
    toRank: 'Silver',
    fromMmr: 980,
    toMmr: 1025,
  });

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
      router.replace({
        pathname: '/waiting-room' as any,
        params: { action: 'search', character: equippedCharacter || 'c0' },
      });
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Player MMR Card / Guest Banner */}
      {isLoggedIn ? (
        <RankBannerCard mmr={mmr} playerName={ingameName || username || 'Player'} />
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

      {/* Equipped Character Showcase (Idle Pose) */}
      <View style={styles.characterStageContainer}>
        {/* Character Idle Sprite */}
        <View style={styles.spriteWrapper}>
          <Sprite action="idle" characterId={equippedCharacter || 'c0'} />
        </View>
      </View>

      <NeoButton style={styles.rankedBtn} onPress={handleFindMatch}>
        <Feather name="search" size={24} color="#fff" />
        <Text style={styles.rankedBtnText}>Find Match</Text>
      </NeoButton>

      {/* Dev Mode Rank Animation Previewer */}
      {devModeEnabled && (
        <View style={styles.devPreviewCard}>
          <View style={styles.devPreviewCardShadow} />
          <View style={styles.devPreviewCardContent}>
            <View style={styles.devPreviewHeader}>
              <Feather name="zap" size={16} color="#d97706" />
              <Text style={styles.devPreviewTitle}>DEV PREVIEW: RANK UP ANIMATION</Text>
            </View>
            <Text style={styles.devPreviewDesc}>
              Test rank promotion & progression animations directly without waiting for a match.
            </Text>
            <View style={styles.devPreviewBtnGrid}>
              <TouchableOpacity
                style={styles.devPreviewBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Bronze',
                    toRank: 'Silver',
                    fromMmr: 980,
                    toMmr: 1025,
                  });
                }}
              >
                <Text style={styles.devPreviewBtnText}>🥉 ➔ 🥈 Bronze to Silver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devPreviewBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Silver',
                    toRank: 'Gold',
                    fromMmr: 1480,
                    toMmr: 1520,
                  });
                }}
              >
                <Text style={styles.devPreviewBtnText}>🥈 ➔ 🥇 Silver to Gold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devPreviewBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Gold',
                    toRank: 'Diamond',
                    fromMmr: 1975,
                    toMmr: 2015,
                  });
                }}
              >
                <Text style={styles.devPreviewBtnText}>🥇 ➔ 💎 Gold to Diamond</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devPreviewBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Diamond',
                    toRank: 'Conqueror',
                    fromMmr: 2480,
                    toMmr: 2510,
                  });
                }}
              >
                <Text style={styles.devPreviewBtnText}>💎 ➔ 👑 Diamond to Conqueror</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devPreviewBtn, { borderColor: '#ef4444', backgroundColor: '#fee2e2' }]}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Silver',
                    toRank: 'Silver',
                    fromMmr: 1050,
                    toMmr: 1025,
                  });
                }}
              >
                <Text style={[styles.devPreviewBtnText, { color: '#b91c1c' }]}>💀 -25 MMR Defeat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devPreviewBtn, { borderColor: '#ef4444', backgroundColor: '#fee2e2' }]}
                onPress={() => {
                  soundService.playSound('click');
                  setPreviewRankModal({
                    visible: true,
                    fromRank: 'Silver',
                    toRank: 'Bronze',
                    fromMmr: 1015,
                    toMmr: 985,
                  });
                }}
              >
                <Text style={[styles.devPreviewBtnText, { color: '#b91c1c' }]}>💀 🥈 ➔ 🥉 Demotion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
              <View style={styles.loginModalDivider} />
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
                    router.replace('/(tabs)/profile' as any);
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
              <View style={styles.noConnDivider} />
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

      {/* Rank Progress / Promotion Modal for Dev Preview */}
      <RankProgressModal
        visible={previewRankModal.visible}
        prevMmr={previewRankModal.fromMmr}
        mmrChange={previewRankModal.toMmr - previewRankModal.fromMmr}
        forceRankUpPreview={{
          fromRankName: previewRankModal.fromRank,
          toRankName: previewRankModal.toRank,
          fromMmr: previewRankModal.fromMmr,
          toMmr: previewRankModal.toMmr,
        }}
        onComplete={() => {
          setPreviewRankModal((prev) => ({ ...prev, visible: false }));
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
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
  characterStageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  spriteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 235,
    transform: [{ scale: 1.75 }],
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
  loginModalWrapper: {
    width: '100%',
    maxWidth: 340,
    position: 'relative',
  },
  loginModalShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
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
    color: '#b45309',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginModalDivider: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f5a623',
    marginBottom: 4,
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
    top: 3,
    left: 3,
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
    color: '#e8302a',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noConnDivider: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e8302a',
    marginBottom: 4,
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
  devPreviewCard: {
    position: 'relative',
    width: '100%',
  },
  devPreviewCardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: '#000',
    borderRadius: 14,
  },
  devPreviewCardContent: {
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 14,
  },
  devPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  devPreviewTitle: {
    fontFamily: GameFonts.arcade,
    fontSize: 12,
    color: '#b45309',
    letterSpacing: 0.5,
  },
  devPreviewDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#78350f',
    marginBottom: 10,
  },
  devPreviewBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  devPreviewBtn: {
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexGrow: 1,
    alignItems: 'center',
  },
  devPreviewBtnText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#92400e',
    fontWeight: '700',
  },
});
