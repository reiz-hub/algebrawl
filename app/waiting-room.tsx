// app/waiting-room.tsx
// Pre-match waiting room — displays room code, topic config, exact MMR queue, 10s Ready Check, countdown

import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { getCharacterDetails } from '../constants/characterSkills';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { useMultiplayerStore } from '../hooks/useMultiplayerStore';
import { getRank } from '../services/mmrService';
import { attemptMatch, checkConnectivity } from '../services/multiplayerService';
import { soundService } from '../services/soundService';
import { supabase } from '../services/supabase';

const FUNDAMENTAL_TOPICS = [
  { id: 1, name: 'Variables', icon: '🔤', desc: 'Basics & Substitution' },
  { id: 2, name: 'Equations', icon: '⚖️', desc: 'Linear & Inequalities' },
  { id: 3, name: 'Polynomials', icon: '📐', desc: 'Terms & Distribution' },
  { id: 4, name: 'Factoring', icon: '🧩', desc: 'Quadratics & GCF' },
  { id: 5, name: 'Systems', icon: '🔗', desc: '2-Variable Linear' },
  { id: 6, name: 'Exponents', icon: '⚡', desc: 'Powers & Radicals' },
  { id: 7, name: 'Random Mode', icon: '🎲', desc: 'Adaptive Mix' },
];

export default function WaitingRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const action = String(params.action ?? 'create'); // 'create' | 'join' | 'search'
  const joinCode = String(params.code ?? '');

  const { userId, ingameName, username, mmr, equippedCharacter, isLoggedIn } = useGameStore();
  const mp = useMultiplayerStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [readyTimer, setReadyTimer] = useState<number>(10);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const searchInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const connCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionLost = useRef(false);
  const initialized = useRef(false);

  const playerName = ingameName || username || 'Player';
  const isLobby = action !== 'search' && mp.mode === 'lobby';
  const isReadyCheck = mp.matchStatus === 'ready_check';

  const myChar = getCharacterDetails(mp.myCharacter || equippedCharacter || 'c0');
  const oppChar = getCharacterDetails(mp.opponentCharacter || 'c0');

  // Spinning animation for search
  useEffect(() => {
    if (mp.matchStatus === 'searching' || mp.matchStatus === 'waiting') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [mp.matchStatus]);

  // Pulse animation for countdown overlay
  useEffect(() => {
    if (countdown !== null) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdown]);

  // Pulse animation for Ready Check timer
  useEffect(() => {
    if (isReadyCheck) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(timerPulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isReadyCheck]);

  // Initialize based on action
  useEffect(() => {
    if (initialized.current || !userId) return;
    initialized.current = true;

    const charId = equippedCharacter || 'c0';
    if (action === 'create') {
      mp.initCreateRoom(userId, playerName, mmr, charId);
    } else if (action === 'join' && joinCode) {
      mp.initJoinRoom(joinCode, userId, playerName, mmr, charId);
    } else if (action === 'search') {
      if (!isLoggedIn) {
        Alert.alert('Login Required', 'You must be signed in to play ranked matches. Guest players cannot enter ranked queue.');
        router.replace('/(tabs)/dungeon?tab=rank' as any);
        return;
      }
      mp.initSearchMatch(userId, playerName, mmr, charId);
    }
  }, [userId, equippedCharacter, isLoggedIn]);

  // ── Connectivity Monitor ──────────────────────────────────
  // While searching or waiting, ping the backend every 10s.
  // On failure, set an error and cancel the current action gracefully.
  useEffect(() => {
    const isActive = mp.matchStatus === 'searching' || mp.matchStatus === 'waiting';
    if (!isActive || !userId) {
      if (connCheckInterval.current) {
        clearInterval(connCheckInterval.current);
        connCheckInterval.current = null;
      }
      return;
    }

    connectionLost.current = false;
    connCheckInterval.current = setInterval(async () => {
      if (connectionLost.current) return;
      const online = await checkConnectivity();
      if (!online) {
        connectionLost.current = true;
        if (connCheckInterval.current) {
          clearInterval(connCheckInterval.current);
          connCheckInterval.current = null;
        }
        // Stop search / leave room
        if (mp.matchStatus === 'searching') {
          mp.cancelSearch(userId);
        } else {
          mp.reset();
        }
        mp.reset();
        router.replace('/multiplayer' as any);
        // Brief delay to ensure navigation completes before alert
        setTimeout(() => {
          const { Alert } = require('react-native');
          Alert.alert(
            '📡 Connection Lost',
            'You lost your internet connection. Please reconnect and try again.',
            [{ text: 'OK' }]
          );
        }, 300);
      }
    }, 10000);

    return () => {
      if (connCheckInterval.current) {
        clearInterval(connCheckInterval.current);
        connCheckInterval.current = null;
      }
    };
  }, [mp.matchStatus, userId]);

  // Ranked Matchmaking Polling — single atomic RPC call per tick.
  // Uses server-side attempt_match() with FOR UPDATE SKIP LOCKED to prevent
  // ghost matches. Only one client can claim an opponent at a time.
  useEffect(() => {
    if (mp.matchStatus !== 'searching' || !userId) {
      if (searchInterval.current) {
        clearInterval(searchInterval.current);
        searchInterval.current = null;
      }
      return;
    }

    searchInterval.current = setInterval(async () => {
      mp.incrementSearchTime();

      const charId = equippedCharacter || 'c0';

      // Touch queue heartbeat so opponent matching knows this player is active
      supabase
        .from('matchmaking_queue')
        .update({ queued_at: new Date().toISOString() })
        .eq('player_id', userId)
        .then(() => { });

      // Single atomic RPC: finds opponent, creates room, cleans up queue
      // Returns the matched room or null if no opponent found yet
      const room = await attemptMatch(userId, mmr, playerName, charId);
      if (room) {
        soundService.playSound('hit');
        const isHost = room.host_id === userId;
        await mp.enterReadyCheck(room, isHost, charId);
        if (searchInterval.current) {
          clearInterval(searchInterval.current);
          searchInterval.current = null;
        }
      }
    }, 2000);

    return () => {
      if (searchInterval.current) {
        clearInterval(searchInterval.current);
        searchInterval.current = null;
      }
    };
  }, [mp.matchStatus, userId, mmr, playerName]);

  // 10-Second Ready Check Countdown
  useEffect(() => {
    if (mp.matchStatus !== 'ready_check') {
      setReadyTimer(10);
      return;
    }

    setReadyTimer(10);
    const readyInterval = setInterval(() => {
      setReadyTimer((prev) => {
        if (prev <= 1) {
          clearInterval(readyInterval);
          // Timed out: neither or only one player readied
          mp.handleReadyCheckTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(readyInterval);
  }, [mp.matchStatus, mp.roomId]);

  // Watch for 3s battle countdown state
  useEffect(() => {
    if (mp.matchStatus === 'countdown') {
      setCountdown(3);
    }
  }, [mp.matchStatus]);

  // Countdown timer for 3s pre-battle
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.replace({
        pathname: '/online-battle' as any,
      });
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Navigate to battle when status becomes 'playing'
  useEffect(() => {
    if (mp.matchStatus === 'playing') {
      router.replace({ pathname: '/online-battle' as any });
    }
  }, [mp.matchStatus]);

  const handleCancel = useCallback(() => {
    if (userId) {
      if (mp.matchStatus === 'searching') {
        mp.cancelSearch(userId);
      } else if (mp.matchStatus === 'ready_check') {
        mp.handleReadyCheckTimeout();
      } else {
        mp.reset();
      }
    }
    router.replace('/multiplayer' as any);
  }, [userId, mp.matchStatus]);

  const handleTapReady = useCallback(async () => {
    soundService.playClick();
    await mp.setReady();
  }, []);

  const handleDeclineMatch = useCallback(async () => {
    soundService.playClick();
    await mp.handleReadyCheckTimeout();
  }, []);

  const handleStartBattle = useCallback(() => {
    if (mp.opponentId && mp.isHost) {
      mp.hostStartMatch();
    }
  }, [mp.opponentId, mp.isHost]);

  // Topic Toggle Handlers (Lobby mode)
  const handleToggleTopic = (topicId: number) => {
    if (!mp.isHost) return;
    const current = mp.selectedTopics;
    let next: number[];
    if (current.includes(topicId)) {
      if (current.length === 1) return; // Keep at least one topic selected
      next = current.filter((id) => id !== topicId);
    } else {
      next = [...current, topicId].sort((a, b) => a - b);
    }
    mp.setSelectedTopics(next);
  };

  const handleSelectAllTopics = () => {
    if (!mp.isHost) return;
    mp.setSelectedTopics([1, 2, 3, 4, 5, 6, 7]);
  };

  const allTopicsSelected = mp.selectedTopics.length === 7;
  const opponentRank = getRank(mp.opponentMmr);
  const myRank = getRank(mmr);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Format search time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isReadyCheck
            ? '⚔️ READY CHECK'
            : action === 'search' || mp.mode === 'ranked'
              ? '⚔️ RANKED MATCH'
              : '🏠 LOBBY VERSUS'}
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={handleCancel}>
          <Feather name="x" size={20} color="#1a1008" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pre-Battle Countdown Overlay */}
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Animated.Text
              style={[styles.countdownText, { transform: [{ scale: pulseAnim }] }]}
            >
              {countdown}
            </Animated.Text>
            <Text style={styles.countdownLabel}>GET READY!</Text>
          </View>
        )}

        {/* Ready Check Banner (Ranked Mode when match is found) */}
        {isReadyCheck && (
          <View style={styles.readyCheckBanner}>
            <View style={styles.readyCheckBannerShadow} />
            <View style={styles.readyCheckBannerContent}>
              <View style={styles.readyHeaderRow}>
                <Text style={styles.readyBannerTitle}>⚔️ MATCH FOUND!</Text>
                <Animated.View
                  style={[
                    styles.timerPill,
                    readyTimer <= 3 && styles.timerPillUrgent,
                    { transform: [{ scale: timerPulseAnim }] },
                  ]}
                >
                  <Text style={styles.timerPillText}>⏳ {readyTimer}s</Text>
                </Animated.View>
              </View>
              <Text style={styles.readyBannerSubtitle}>
                Tap &ldquo;READY&rdquo; within 10 seconds. Battle begins only when both players accept!
              </Text>
            </View>
          </View>
        )}

        {/* Room Code Display (Lobby mode) */}
        {mp.roomCode && mp.isHost && mp.matchStatus === 'waiting' && (
          <View style={styles.codeCard}>
            <View style={styles.codeCardShadow} />
            <View style={styles.codeCardContent}>
              <Text style={styles.codeLabel}>ROOM CODE</Text>
              <Text style={styles.codeValue}>{mp.roomCode}</Text>
              <Text style={styles.codeHint}>Share this code with your friend</Text>
            </View>
          </View>
        )}

        {/* Player Cards (VS Layout) */}
        <View style={styles.vsContainer}>
          {/* My Card */}
          <View style={styles.playerCard}>
            <View style={styles.playerCardShadow} />
            <View style={[styles.playerCardContent, { backgroundColor: '#1a6cf5' }]}>
              <Text style={styles.playerLabel}>YOU</Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {playerName}
              </Text>
              {isLobby ? (
                <>
                  <Text style={styles.playerRank}>❤️ 3 Hearts</Text>
                  <Text style={styles.playerMmr}>Casual Match</Text>
                </>
              ) : (
                <>
                  <View style={styles.playerRankBadgeRow}>
                    <Image source={myRank.icon} style={styles.playerRankIcon} resizeMode="contain" />
                    <Text style={styles.playerRank}>{myRank.name}</Text>
                  </View>
                  <Text style={styles.playerMmr}>{mmr} MMR</Text>
                </>
              )}

              {/* Character Section */}
              <View style={styles.charBadge}>
                <Text style={styles.charIconText}>{myChar.icon}</Text>
                <Text style={styles.charNameText} numberOfLines={1}>
                  {myChar.name}
                </Text>
              </View>

              {/* Ready Status Badge for You */}
              {isReadyCheck && (
                <View
                  style={[
                    styles.readyStatusBadge,
                    mp.myReady ? styles.readyBadgeGreen : styles.readyBadgePending,
                  ]}
                >
                  <Text style={styles.readyStatusText}>
                    {mp.myReady ? '✓ READY' : '⏳ PENDING'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* VS Badge */}
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Opponent Card */}
          <View style={styles.playerCard}>
            <View style={styles.playerCardShadow} />
            <View
              style={[
                styles.playerCardContent,
                {
                  backgroundColor: mp.opponentId ? '#e8302a' : '#3d3222',
                },
              ]}
            >
              {mp.opponentId ? (
                <>
                  <Text style={styles.playerLabel}>OPPONENT</Text>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {mp.opponentName}
                  </Text>
                  {isLobby ? (
                    <>
                      <Text style={styles.playerRank}>❤️ 3 Hearts</Text>
                      <Text style={styles.playerMmr}>Ready</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.playerRankBadgeRow}>
                        <Image source={opponentRank.icon} style={styles.playerRankIcon} resizeMode="contain" />
                        <Text style={styles.playerRank}>{opponentRank.name}</Text>
                      </View>
                      <Text style={styles.playerMmr}>{mp.opponentMmr} MMR</Text>
                    </>
                  )}

                  {/* Character Section for Opponent */}
                  <View style={styles.charBadge}>
                    <Text style={styles.charIconText}>{oppChar.icon}</Text>
                    <Text style={styles.charNameText} numberOfLines={1}>
                      {oppChar.name}
                    </Text>
                  </View>

                  {/* Ready Status Badge for Opponent */}
                  {isReadyCheck && (
                    <View
                      style={[
                        styles.readyStatusBadge,
                        mp.opponentReady ? styles.readyBadgeGreen : styles.readyBadgePending,
                      ]}
                    >
                      <Text style={styles.readyStatusText}>
                        {mp.opponentReady ? '✓ READY' : '⏳ WAITING...'}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Feather name="loader" size={32} color="#fff" />
                  </Animated.View>
                  <Text style={styles.waitingText}>
                    {mp.matchStatus === 'searching' ? 'Searching...' : 'Waiting...'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Fundamental Topics Selection (Lobby Mode only) */}
        {isLobby && Boolean(mp.opponentId) && (
          <View style={styles.topicsSection}>
            <View style={styles.topicsSectionShadow} />
            <View style={styles.topicsSectionContent}>
              <View style={styles.topicsHeaderRow}>
                <View>
                  <Text style={styles.topicsTitle}>📚 FUNDAMENTAL TOPICS</Text>
                  <Text style={styles.topicsSubtitle}>
                    {mp.isHost
                      ? 'Select topics to include in this battle'
                      : 'Topics configured by Host (View Only)'}
                  </Text>
                </View>
                {mp.isHost && (
                  <TouchableOpacity
                    style={[styles.allTopicsBtn, allTopicsSelected && styles.allTopicsBtnActive]}
                    onPress={handleSelectAllTopics}
                  >
                    <Text
                      style={[
                        styles.allTopicsBtnText,
                        allTopicsSelected && styles.allTopicsBtnTextActive,
                      ]}
                    >
                      🎲 All / Random
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.topicGrid}>
                {FUNDAMENTAL_TOPICS.map((topic) => {
                  const isSelected = mp.selectedTopics.includes(topic.id);
                  return (
                    <TouchableOpacity
                      key={topic.id}
                      disabled={!mp.isHost}
                      style={[
                        styles.topicChip,
                        isSelected ? styles.topicChipActive : styles.topicChipInactive,
                        !mp.isHost && styles.topicChipDisabled,
                      ]}
                      onPress={() => handleToggleTopic(topic.id)}
                    >
                      <Text style={styles.topicIcon}>{topic.icon}</Text>
                      <View style={styles.topicTextCol}>
                        <Text
                          style={[
                            styles.topicName,
                            isSelected ? styles.topicNameActive : styles.topicNameInactive,
                          ]}
                          numberOfLines={1}
                        >
                          Lv.{topic.id} {topic.name}
                        </Text>
                        <Text
                          style={[
                            styles.topicDesc,
                            isSelected ? styles.topicDescActive : styles.topicDescInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {topic.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={14} color="#fff" style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Searching Queue Info (Ranked Searching Mode) */}
        {mp.matchStatus === 'searching' && (
          <View style={styles.searchCard}>
            <View style={styles.searchCardShadow} />
            <View style={styles.searchCardContent}>
              <Text style={styles.searchTime}>⏱️ {formatTime(mp.searchTime)}</Text>
              <View style={styles.searchPillRow}>
                <View style={styles.searchBadge}>
                  <Text style={styles.searchBadgeText}>
                    🎯 MMR Range: {Math.max(0, mmr - 200)}–{mmr + 200} (±200)
                  </Text>
                </View>
                <View style={styles.searchBadgeHuman}>
                  <Text style={styles.searchBadgeHumanText}>👥 Real Players (No Bots)</Text>
                </View>
              </View>
              <Text style={styles.searchNote}>
                The queue will wait indefinitely until a human opponent within 200 MMR difference enters ({Math.max(0, mmr - 200)}–{mmr + 200}).
              </Text>
            </View>
          </View>
        )}

        {/* Status Message for Lobby Mode */}
        {isLobby && mp.matchStatus === 'waiting' && !mp.opponentId && (
          <Text style={styles.statusText}>Waiting for opponent to join...</Text>
        )}

        {isLobby && mp.opponentId && mp.matchStatus === 'waiting' && (
          <Text style={styles.statusTextReady}>
            ✅ Opponent joined! {mp.isHost ? 'Start the battle!' : 'Waiting for host to start...'}
          </Text>
        )}

        {/* Error Message / Notification */}
        {mp.error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {mp.error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionArea}>
          {/* Ready Check Action Button */}
          {isReadyCheck && (
            <>
              {!mp.myReady ? (
                <NeoButton style={styles.readyBtn} onPress={handleTapReady}>
                  <Feather name="check-circle" size={24} color="#fff" />
                  <Text style={styles.readyBtnText}>READY! ({readyTimer}s)</Text>
                </NeoButton>
              ) : (
                <View style={styles.readyWaitingPill}>
                  <Feather name="clock" size={20} color="#14532d" />
                  <Text style={styles.readyWaitingPillText}>
                    {mp.opponentReady ? 'STARTING BATTLE...' : 'WAITING FOR OPPONENT...'}
                  </Text>
                </View>
              )}

              <NeoButton
                wrapperStyle={{ marginTop: 10 }}
                style={styles.declineBtn}
                onPress={handleDeclineMatch}
              >
                <Text style={styles.declineBtnText}>Decline Match</Text>
              </NeoButton>
            </>
          )}

          {/* Lobby Host Start Button */}
          {isLobby && mp.isHost && mp.opponentId && mp.matchStatus === 'waiting' && (
            <NeoButton style={styles.startBtn} onPress={handleStartBattle}>
              <Feather name="play" size={22} color="#fff" />
              <Text style={styles.startBtnText}>Start Battle!</Text>
            </NeoButton>
          )}

          {/* Cancel Search / Leave Room */}
          {!isReadyCheck && (
            <NeoButton
              wrapperStyle={{ marginTop: 12 }}
              style={styles.cancelBtn}
              onPress={handleCancel}
            >
              <Text style={styles.cancelBtnText}>
                {mp.matchStatus === 'searching' ? 'Cancel Search' : 'Leave Room'}
              </Text>
            </NeoButton>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#1a1008',
  },
  headerTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#fff',
    letterSpacing: 1,
  },
  closeBtn: {
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  // Ready Check Banner
  readyCheckBanner: {
    position: 'relative',
    marginBottom: 16,
  },
  readyCheckBannerShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  readyCheckBannerContent: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 16,
  },
  readyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  readyBannerTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    letterSpacing: 1,
  },
  timerPill: {
    backgroundColor: '#1a1008',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerPillUrgent: {
    backgroundColor: '#e8302a',
  },
  timerPillText: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    color: '#fff',
  },
  readyBannerSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
    lineHeight: 16,
  },

  // Room Code (Lobby)
  codeCard: {
    position: 'relative',
    marginBottom: 20,
  },
  codeCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  codeCardContent: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 1,
  },
  codeValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 32,
    color: '#fff',
    letterSpacing: 8,
    textShadowColor: '#14532d',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  codeHint: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#dcfce7',
    marginTop: 4,
  },

  // VS Layout
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  playerCard: {
    flex: 1,
    position: 'relative',
    maxWidth: 160,
  },
  playerCardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  playerCardContent: {
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  playerLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 2,
  },
  playerName: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerRankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playerRankIcon: {
    width: 18,
    height: 18,
  },
  playerRank: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#fff',
  },
  playerMmr: {
    fontFamily: GameFonts.arcade,
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
    opacity: 0.9,
  },

  // Character card badge
  charBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  charIconText: {
    fontSize: 16,
  },
  charNameText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
  },

  // Ready status badge on player card
  readyStatusBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1a1008',
  },
  readyBadgeGreen: {
    backgroundColor: '#22c55e',
  },
  readyBadgePending: {
    backgroundColor: '#f5a623',
  },
  readyStatusText: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
  },

  vsBadge: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  vsText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },

  waitingText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    opacity: 0.8,
  },

  // Topics Section
  topicsSection: {
    position: 'relative',
    marginBottom: 16,
  },
  topicsSectionShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  topicsSectionContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 14,
  },
  topicsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicsTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  topicsSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    marginTop: 1,
  },
  allTopicsBtn: {
    backgroundColor: '#f1ebd8',
    borderWidth: 1.5,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  allTopicsBtnActive: {
    backgroundColor: '#f5a623',
  },
  allTopicsBtnText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
  },
  allTopicsBtnTextActive: {
    color: '#1a1008',
    fontFamily: GameFonts.brawl,
  },
  topicGrid: {
    flexDirection: 'column',
    gap: 6,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  topicChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#14532d',
  },
  topicChipInactive: {
    backgroundColor: '#fff9f0',
    borderColor: '#d1c7b7',
    opacity: 0.75,
  },
  topicChipDisabled: {
    opacity: 0.9,
  },
  topicIcon: {
    fontSize: 16,
  },
  topicTextCol: {
    flex: 1,
  },
  topicName: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
  },
  topicNameActive: {
    color: '#ffffff',
  },
  topicNameInactive: {
    color: '#7a6a55',
  },
  topicDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
  },
  topicDescActive: {
    color: '#dcfce7',
  },
  topicDescInactive: {
    color: '#998877',
  },
  checkIcon: {
    marginLeft: 4,
  },

  // Search Card
  searchCard: {
    position: 'relative',
    marginBottom: 16,
  },
  searchCardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  searchCardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  searchTime: {
    fontFamily: GameFonts.arcade,
    fontSize: 22,
    color: '#1a1008',
    marginBottom: 8,
  },
  searchPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBadge: {
    backgroundColor: '#f1ebd8',
    borderWidth: 1.5,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchBadgeText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
  },
  searchBadgeHuman: {
    backgroundColor: '#dcfce7',
    borderWidth: 1.5,
    borderColor: '#14532d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchBadgeHumanText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#14532d',
  },
  searchNote: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    marginTop: 4,
  },

  // Status
  statusText: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusTextReady: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#22c55e',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Error
  errorCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#e8302a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#e8302a',
    textAlign: 'center',
  },

  // Countdown
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 16, 8, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countdownText: {
    fontFamily: GameFonts.brawl,
    fontSize: 80,
    color: '#f5a623',
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  countdownLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 24,
    color: '#fff',
    marginTop: 10,
    letterSpacing: 2,
  },

  // Actions
  actionArea: {
    marginTop: 6,
  },
  readyBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  readyBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  readyWaitingPill: {
    backgroundColor: '#dcfce7',
    borderWidth: 3,
    borderColor: '#14532d',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readyWaitingPillText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#14532d',
    letterSpacing: 1,
  },
  declineBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 3,
    borderColor: '#e8302a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#e8302a',
    textTransform: 'uppercase',
  },
  startBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cancelBtn: {
    backgroundColor: '#e5d9c4',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
    textTransform: 'uppercase',
  },
});
