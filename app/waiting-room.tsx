// app/waiting-room.tsx
// Pre-match waiting room — displays room code, topic config, exact MMR queue, 10s Ready Check, countdown

import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import NeoButton from '../components/NeoButton';
import Sprite from '../components/sprite';
import TouchableOpacity from '../components/TouchableOpacity';
import { getCharacterDetails } from '../constants/characterSkills';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { useMultiplayerStore } from '../hooks/useMultiplayerStore';
import { getRank } from '../services/mmrService';
import { attemptMatch, checkConnectivity } from '../services/multiplayerService';
import { soundService } from '../services/soundService';
import { supabase } from '../services/supabase';

const CHARACTER_AVATARS: Record<string, any> = {
  c0: require('../assets/images/avatar/algebroavatar.png'),
  char_algebro: require('../assets/images/avatar/algebroavatar.png'),
  c1: require('../assets/images/avatar/lovelaceavatar.png'),
  c2: require('../assets/images/avatar/newtonavatar.png'),
  c3: require('../assets/images/avatar/teslaavatar.png'),
  c4: require('../assets/images/avatar/curieavatar.png'),
  c5: require('../assets/images/avatar/algegalavatar.png'),
  char_algegal: require('../assets/images/avatar/algegalavatar.png'),
};

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

  const { userId, ingameName, username, mmr, equippedCharacter, equippedTitle, isLoggedIn } = useGameStore();
  const mp = useMultiplayerStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [readyTimer, setReadyTimer] = useState<number>(10);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const bufferPulseAnim = useRef(new Animated.Value(1)).current;
  const searchInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const connCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionLost = useRef(false);
  const initialized = useRef(false);

  const playerName = ingameName || username || 'Player';
  const isLobby = action !== 'search' && mp.mode === 'lobby';
  const isReadyCheck = mp.matchStatus === 'ready_check';

  const paramCharacter = params.character ? String(params.character) : undefined;
  const activeCharId = paramCharacter || equippedCharacter || mp.myCharacter || 'c0';
  const oppCharId = mp.opponentCharacter || 'c0';
  const myChar = getCharacterDetails(activeCharId);
  const oppChar = getCharacterDetails(oppCharId);

  const myAvatar = CHARACTER_AVATARS[activeCharId] || myChar.avatar;
  const oppAvatar = CHARACTER_AVATARS[oppCharId] || oppChar.avatar;

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

  // Pulse animation for search/buffering placeholder
  useEffect(() => {
    if (mp.matchStatus === 'searching' || mp.matchStatus === 'waiting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(bufferPulseAnim, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bufferPulseAnim, {
            toValue: 0.94,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
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

    const charId = activeCharId;
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
  }, [userId, activeCharId, isLoggedIn]);

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
        const isLobbyMode = action === 'create' || action === 'join' || mp.mode === 'lobby';
        if (mp.matchStatus === 'searching') {
          mp.cancelSearch(userId);
        } else {
          mp.reset();
        }
        mp.reset();
        const returnTab = isLobbyMode ? '1v1' : 'rank';
        router.replace(`/(tabs)/dungeon?tab=${returnTab}` as any);
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

      const charId = activeCharId;

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
    const isLobbyMode = action === 'create' || action === 'join' || mp.mode === 'lobby';
    if (userId) {
      if (mp.matchStatus === 'searching') {
        mp.cancelSearch(userId);
      } else if (mp.matchStatus === 'ready_check') {
        mp.handleReadyCheckTimeout();
      } else {
        mp.reset();
      }
    }
    const targetTab = isLobbyMode ? '1v1' : 'rank';
    router.replace(`/(tabs)/dungeon?tab=${targetTab}` as any);
  }, [userId, mp.matchStatus, action, mp.mode]);

  // Hardware back: cancel search / leave room and return to ranked tab
  useEffect(() => {
    const onBackPress = () => {
      handleCancel();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleCancel]);

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
            ? 'READY CHECK'
            : action === 'search' || mp.mode === 'ranked'
              ? 'RANKED MATCH'
              : 'LOBBY VERSUS'}
        </Text>
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

        {/* Search Timer (Above Characters) */}
        {mp.matchStatus === 'searching' && (
          <View style={styles.searchTimerContainer}>
            <Text style={styles.searchTimeClean}>{formatTime(mp.searchTime)}</Text>
          </View>
        )}

        {/* Center Stage: Duel face-off with Character Sprites */}
        <View style={styles.centerStage}>
          <View style={styles.vsContainer}>
            {/* Player Card (YOU) */}
            <View style={styles.playerCardClean}>
              {/* Character Idle Sprite */}
              <View style={styles.cardSpriteStage}>
                <View style={styles.cardSpriteWrapper}>
                  <Sprite action="idle" characterId={activeCharId} />
                </View>
              </View>

              <Text style={styles.playerNameClean} numberOfLines={1}>
                {playerName}
              </Text>

              {isLobby ? (
                <>
                  <Text style={styles.playerRankClean}>❤️ 3 Hearts</Text>
                  <Text style={styles.playerMmrClean}>Casual Match</Text>
                </>
              ) : (
                <View style={styles.playerRankMmrRowClean}>
                  <Image source={myRank.icon} style={styles.playerRankIconClean} resizeMode="contain" />
                  <Text style={styles.playerMmrClean}>{mmr} MMR</Text>
                </View>
              )}

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

            {/* Center VS Badge */}
            <View style={styles.vsBadgeClean}>
              <Text style={styles.vsTextClean}>VS</Text>
            </View>

            {/* Opponent Card (OPPONENT) */}
            <View style={styles.playerCardClean}>
              {mp.opponentId ? (
                <>
                  {/* Opponent Equipped Character in Idle Pose (facing player) */}
                  <View style={styles.cardSpriteStage}>
                    <View style={styles.cardSpriteWrapper}>
                      <Sprite action="idle" isEnemy characterId={oppCharId} />
                    </View>
                  </View>

                  <Text style={styles.playerNameClean} numberOfLines={1}>
                    {mp.opponentName}
                  </Text>

                  {isLobby ? (
                    <>
                      <Text style={styles.playerRankClean}>❤️ 3 Hearts</Text>
                      <Text style={styles.playerMmrClean}>Ready</Text>
                    </>
                  ) : (
                    <View style={styles.playerRankMmrRowClean}>
                      <Image source={opponentRank.icon} style={styles.playerRankIconClean} resizeMode="contain" />
                      <Text style={styles.playerMmrClean}>{mp.opponentMmr} MMR</Text>
                    </View>
                  )}

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
                /* Enemy Placeholder Buffering */
                <>
                  {/* Buffering Radar & Mystery Rival Stage */}
                  <View style={styles.cardBufferingStage}>
                    {/* Animated Pulsing Outer Halo */}
                    <Animated.View
                      style={[
                        styles.radarPulseRing,
                        {
                          transform: [{ scale: bufferPulseAnim }],
                          opacity: bufferPulseAnim.interpolate({
                            inputRange: [0.94, 1.08],
                            outputRange: [0.25, 0.6],
                          }),
                        },
                      ]}
                    />

                    {/* Rotating Dashed Radar Scanner Ring */}
                    <Animated.View
                      style={[
                        styles.radarSpinnerRing,
                        { transform: [{ rotate: spin }] },
                      ]}
                    >
                      <View style={styles.radarDashedCircle} />
                      <View style={styles.radarBlip} />
                    </Animated.View>

                    {/* Mystery Rival Center Silhouette */}
                    <Animated.View
                      style={[
                        styles.radarMysteryCenter,
                        { transform: [{ scale: bufferPulseAnim }] },
                      ]}
                    >
                      <Feather name="user" size={30} color="#d97706" />
                    </Animated.View>
                  </View>

                  {/* Buffering Indicator Text */}
                  <Animated.Text
                    style={[
                      styles.bufferingTextClean,
                      {
                        opacity: bufferPulseAnim.interpolate({
                          inputRange: [0.94, 1.08],
                          outputRange: [0.65, 1],
                        }),
                      },
                    ]}
                  >
                    Searching...
                  </Animated.Text>
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
    justifyContent: 'center',
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
    textAlign: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 36,
    justifyContent: 'space-between',
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

  // Center Stage (Vertically & Horizontally Centered)
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },

  // VS Layout
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  playerCard: {
    flex: 1,
    position: 'relative',
    maxWidth: 165,
  },
  playerCardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  playerCardContent: {
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 228,
    justifyContent: 'flex-start',
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
  playerAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    overflow: 'hidden',
  },
  playerAvatarImage: {
    width: 56,
    height: 56,
  },
  searchingAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  waitingSubText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#fff',
    opacity: 0.7,
    marginTop: 2,
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

  /* Clean Transparent Cards (No Background, No Shadow, Minimalist) */
  playerCardClean: {
    flex: 1,
    maxWidth: 165,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  playerNameClean: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerRankMmrRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  playerRankIconClean: {
    width: 34,
    height: 34,
  },
  playerMmrClean: {
    fontFamily: GameFonts.arcade,
    fontSize: 15,
    color: '#1a1008',
    textAlign: 'center',
  },
  playerRankClean: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#1a1008',
  },
  vsBadgeClean: {
    alignSelf: 'flex-start',
    marginTop: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  vsTextClean: {
    fontFamily: GameFonts.brawl,
    fontSize: 22,
    color: '#d97706',
    letterSpacing: 1,
  },

  /* Card Sprite Stage (Idle Character Display) */
  cardSpriteStage: {
    height: 140,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardSpriteWrapper: {
    width: 120,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.0 }],
  },

  /* Card Buffering Stage (Enemy Placeholder Radar/Loader) */
  cardBufferingStage: {
    height: 140,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.35)',
  },
  radarSpinnerRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(217, 119, 6, 0.65)',
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  radarDashedCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
  },
  radarBlip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d97706',
    marginTop: -4,
  },
  radarMysteryCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 2,
    borderColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingTextClean: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#d97706',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  /* Search Timer */
  searchTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 6,
  },
  searchTimeClean: {
    fontFamily: GameFonts.arcade,
    fontSize: 26,
    color: '#1a1008',
    letterSpacing: 2,
  },
});
