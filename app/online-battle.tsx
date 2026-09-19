// app/online-battle.tsx
// Online Battle — 5-minute simultaneous battle with live score sync & optional Lobby 3-hearts system

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AttackProjectile from '../components/AttackProjectile';
import RankProgressModal from '../components/RankProgressModal';
import Sprite from '../components/sprite';
import TouchableOpacity from '../components/TouchableOpacity';
import { getCharacterDetails } from '../constants/characterSkills';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { useMultiplayerStore } from '../hooks/useMultiplayerStore';
import { STARTING_MMR } from '../services/mmrService';
import { soundService } from '../services/soundService';

export default function OnlineBattleScreen() {
  const router = useRouter();
  const { userId, updateMmr, equippedCharacter } = useGameStore();
  const mp = useMultiplayerStore();

  const isLobby = mp.mode === 'lobby';
  const myChar = getCharacterDetails(mp.myCharacter || equippedCharacter || 'c0');
  const oppChar = getCharacterDetails(mp.opponentCharacter || 'c0');

  const [isPaused, setIsPaused] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showRankProgress, setShowRankProgress] = useState(false);
  const [prevMmrForAnimation, setPrevMmrForAnimation] = useState(mp.myMmr || STARTING_MMR);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'correct' | 'wrong' | null>(null);
  const [opponentLastAction, setOpponentLastAction] = useState<'correct' | 'wrong' | null>(null);

  // Projectile state
  const [attackActive, setAttackActive] = useState(false);
  const [attacker, setAttacker] = useState<'player' | 'enemy'>('player');
  const prevOppScoreRef = useRef(mp.opponentScore);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultHandled = useRef(false);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    };
  }, []);

  const currentQ = useMemo(() => {
    if (mp.questions.length === 0) return null;
    return mp.questions[mp.currentQuestionIndex % mp.questions.length];
  }, [mp.questions, mp.currentQuestionIndex]);

  // Timer countdown — continues ticking in real time even if paused
  useEffect(() => {
    if (mp.matchStatus !== 'playing') return;

    timerRef.current = setInterval(() => {
      const newTime = mp.timeRemaining - 1;
      mp.setTimeRemaining(newTime);

      if (newTime <= 0) {
        // Time's up!
        if (timerRef.current) clearInterval(timerRef.current);
        handleMatchEnd();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mp.matchStatus, mp.timeRemaining]);

  // Watch for match finished state (triggered by opponent finish/forfeit or timer)
  useEffect(() => {
    if (mp.matchStatus === 'finished' && !resultHandled.current) {
      resultHandled.current = true;
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Update local MMR in useGameStore
      const isRanked = !isLobby && (mp.result === 'win' || mp.result === 'loss');
      if (!isLobby && mp.result && mp.result !== 'draw' && mp.mmrChange !== 0) {
        updateMmr(mp.mmrChange, mp.result === 'win');
      }
      if (isRanked) {
        setPrevMmrForAnimation(mp.myMmr);
        setShowRankProgress(true);
      } else {
        setShowResult(true);
        if (mp.result === 'win') {
          soundService.playSound('victory');
        } else {
          soundService.playSound('defeat');
        }
      }
    }
  }, [mp.matchStatus, mp.result, mp.mmrChange, mp.myMmr, isLobby]);

  // Clear opponent action highlight after a short time
  useEffect(() => {
    if (opponentLastAction) {
      const timer = setTimeout(() => setOpponentLastAction(null), 800);
      return () => clearTimeout(timer);
    }
  }, [opponentLastAction]);

  // Check if opponent was knocked out (Ranked or Lobby Mode)
  useEffect(() => {
    if (mp.matchStatus === 'playing' && mp.opponentHearts <= 0 && !resultHandled.current) {
      handleKnockout(mp.opponentId || 'opponent');
    }
  }, [mp.matchStatus, mp.opponentHearts]);

  const handleKnockout = async (loserId: string) => {
    if (resultHandled.current || !userId) return;
    resultHandled.current = true;

    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const winnerId = loserId === userId ? mp.opponentId : userId;
    await mp.endMatch(userId, winnerId);

    // Update local MMR in ranked mode
    const finalMp = useMultiplayerStore.getState();
    const isRanked = !isLobby && (finalMp.result === 'win' || finalMp.result === 'loss');
    if (!isLobby && finalMp.result && finalMp.result !== 'draw' && finalMp.mmrChange !== 0) {
      updateMmr(finalMp.mmrChange, finalMp.result === 'win');
    }

    if (isRanked) {
      setPrevMmrForAnimation(finalMp.myMmr);
      setShowRankProgress(true);
    } else {
      setShowResult(true);
      if (winnerId === userId) {
        soundService.playSound('victory');
      } else {
        soundService.playSound('defeat');
      }
    }
  };

  const handleMatchEnd = async () => {
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    if (resultHandled.current || !userId) return;
    resultHandled.current = true;

    await mp.endMatch(userId);

    // Update local MMR in ranked mode
    const finalMp = useMultiplayerStore.getState();
    const isRanked = !isLobby && (finalMp.result === 'win' || finalMp.result === 'loss');
    if (!isLobby && finalMp.result && finalMp.result !== 'draw' && finalMp.mmrChange !== 0) {
      updateMmr(finalMp.mmrChange, finalMp.result === 'win');
    }

    if (isRanked) {
      setPrevMmrForAnimation(finalMp.myMmr);
      setShowRankProgress(true);
    } else {
      setShowResult(true);
      if (finalMp.result === 'win') {
        soundService.playSound('victory');
      } else if (finalMp.result === 'loss') {
        soundService.playSound('defeat');
      }
    }
  };

  // Track pending answer undergoing attack projectile flight
  const pendingAnswerRef = useRef<{ isCorrect: boolean; nextHearts: number } | null>(null);

  // Opponent scoring projectile trigger
  useEffect(() => {
    if (mp.opponentScore > prevOppScoreRef.current) {
      prevOppScoreRef.current = mp.opponentScore;
      if (!attackActive && !isAnswering) {
        setAttacker('enemy');
        setOpponentLastAction('correct');
        setAttackActive(true);
      }
    }
  }, [mp.opponentScore, attackActive, isAnswering]);

  const handleOptionPress = (opt: string) => {
    if (isAnswering || !currentQ || attackActive) return;
    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;

    if (isCorrect) {
      // Player attacks opponent
      pendingAnswerRef.current = { isCorrect: true, nextHearts: mp.myHearts };
      setAttacker('player');
      setLastAction('correct');
      setOpponentLastAction(null);
      setAttackActive(true);
    } else {
      // Wrong answer: Opponent attacks player!
      const nextHearts = Math.max(0, mp.myHearts - 1);
      pendingAnswerRef.current = { isCorrect: false, nextHearts };
      setAttacker('enemy');
      setOpponentLastAction('correct');
      setLastAction(null);
      setAttackActive(true);
    }
  };

  const handleProjectileImpact = () => {
    if (attacker === 'player') {
      // Opponent hit by player's projectile
      setOpponentLastAction('wrong');
      soundService.playSound('hit');
    } else {
      // Player hit by opponent's projectile
      setLastAction('wrong');
      if (pendingAnswerRef.current && !pendingAnswerRef.current.isCorrect) {
        soundService.playSound('heartbreak');
        mp.setMyHearts(pendingAnswerRef.current.nextHearts);
      } else {
        soundService.playSound('hit');
      }
    }
  };

  const handleProjectileComplete = () => {
    setAttackActive(false);

    if (pendingAnswerRef.current) {
      const { isCorrect, nextHearts } = pendingAnswerRef.current;
      pendingAnswerRef.current = null;

      mp.answerQuestion(isCorrect, nextHearts);
      setIsAnswering(false);
      setSelectedOption(null);
      setLastAction(null);
      setOpponentLastAction(null);

      // If out of hearts on wrong answer, trigger defeat knockout
      if (!isCorrect && nextHearts <= 0) {
        handleKnockout(userId || 'player');
      }
    } else {
      setOpponentLastAction(null);
      setLastAction(null);
    }
  };

  const handleOpenForfeitModal = () => {
    soundService.playSound('click');
    setIsPaused(false);
    setShowForfeitModal(true);
  };

  const handleCancelForfeit = () => {
    soundService.playSound('click');
    setShowForfeitModal(false);
  };

  const handleConfirmForfeit = async () => {
    soundService.playSound('click');
    setShowForfeitModal(false);
    await handleQuit();
  };

  const handleQuit = async () => {
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPaused(false);

    if (userId) {
      resultHandled.current = true;
      // Forfeiting player loses, opponent is awarded victory
      await mp.endMatch(userId, mp.opponentId);
      const finalMp = useMultiplayerStore.getState();
      if (!isLobby && finalMp.mmrChange !== 0) {
        updateMmr(finalMp.mmrChange, false);
      }
      if (!isLobby) {
        setPrevMmrForAnimation(finalMp.myMmr);
        setShowRankProgress(true);
      } else {
        setShowResult(true);
        soundService.playSound('defeat');
      }
    } else {
      const returnTab = isLobby ? '1v1' : 'rank';
      mp.reset();
      router.replace(`/(tabs)/dungeon?tab=${returnTab}` as any);
    }
  };

  const handleResultDone = () => {
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
    soundService.stopSound('victory');
    soundService.stopSound('defeat');
    const returnTab = isLobby ? '1v1' : 'rank';
    mp.reset();
    router.replace(`/(tabs)/dungeon?tab=${returnTab}` as any);
  };

  // Hardware back: handle result if ended, close forfeit modal if open, or prompt forfeit confirmation
  useEffect(() => {
    const onBackPress = () => {
      if (showRankProgress) {
        setShowRankProgress(false);
        setShowResult(true);
        return true;
      }
      if (showResult) {
        handleResultDone();
        return true;
      }
      if (showForfeitModal) {
        setShowForfeitModal(false);
        return true;
      }
      setShowForfeitModal(true);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showRankProgress, showResult, showForfeitModal]);

  // Format timer
  const formatTimer = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderHearts = (hearts: number, maxHearts: number = 3) => {
    const safeHP = Math.max(0, hearts);
    const lostHearts = Math.max(0, maxHearts - safeHP);
    return '❤️'.repeat(safeHP) + '🖤'.repeat(lostHearts);
  };

  // Sprite actions
  const mySpriteAction = useMemo(() => {
    if (showResult) return mp.result === 'win' ? 'win' : 'defeat';
    if (lastAction === 'correct') return 'attack';
    if (lastAction === 'wrong') return 'hit';
    return 'idle';
  }, [showResult, mp.result, lastAction]);

  const oppSpriteAction = useMemo(() => {
    if (showResult) return mp.result === 'loss' ? 'win' : mp.result === 'win' ? 'defeat' : 'idle';
    if (opponentLastAction === 'correct') return 'attack';
    if (opponentLastAction === 'wrong') return 'hit';
    return 'idle';
  }, [showResult, mp.result, opponentLastAction]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* My Score & Hearts */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>YOU</Text>
          <Text style={styles.scoreValue}>{mp.myScore}</Text>
          <Text style={styles.heartsValue}>{renderHearts(mp.myHearts)}</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerBox}>
          <Text style={[
            styles.timerValue,
            mp.timeRemaining <= 30 && styles.timerDanger,
            mp.timeRemaining <= 10 && styles.timerCritical,
          ]}>
            {formatTimer(mp.timeRemaining)}
          </Text>
          <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
            <Feather name="pause" size={16} color="#1a1008" />
          </TouchableOpacity>
        </View>

        {/* Opponent Score & Hearts */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>OPP</Text>
          <Text style={[styles.scoreValue, styles.oppScoreValue]}>{mp.opponentScore}</Text>
          <Text style={styles.heartsValue}>{renderHearts(mp.opponentHearts)}</Text>
        </View>
      </View>

      {/* Arena */}
      <View style={styles.arena}>
        {/* My Sprite */}
        <View style={styles.spriteCol}>
          <Sprite action={mySpriteAction as any} characterId={myChar.id} />
          <Text style={styles.spriteLabel}>{mp.myName ?? 'You'}</Text>
          <Text style={styles.spriteHearts}>{renderHearts(mp.myHearts)}</Text>
        </View>

        {/* VS Divider */}
        <View style={styles.vsDivider}>
          <Text style={styles.vsText}>⚔️</Text>
          {isLobby ? (
            <Text style={styles.lobbyTag}>LOBBY</Text>
          ) : (
            <Text style={[styles.lobbyTag, { backgroundColor: '#f59e0b' }]}>RANKED</Text>
          )}
        </View>

        {/* Opponent Sprite */}
        <View style={styles.spriteCol}>
          <Sprite action={oppSpriteAction as any} isEnemy characterId={oppChar.id} />
          <Text style={styles.spriteLabel}>{mp.opponentName ?? 'Opponent'}</Text>
          <Text style={styles.spriteHearts}>{renderHearts(mp.opponentHearts)}</Text>
        </View>

        {/* Projectile Layer */}
        <AttackProjectile
          active={attackActive}
          attacker={attacker}
          characterId={myChar.id}
          enemyId={oppChar.id}
          onImpact={handleProjectileImpact}
          onComplete={handleProjectileComplete}
        />
      </View>

      {/* Question Panel */}
      {currentQ && mp.matchStatus === 'playing' && (
        <View style={styles.questionPanel}>
          <Text style={styles.questionNumber}>
            Q{mp.currentQuestionIndex + 1}
          </Text>
          <Text style={styles.equation} adjustsFontSizeToFit numberOfLines={2}>
            {currentQ.equation}
          </Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => {
              const isCorrect = opt === currentQ.correctAnswer;
              const isWrongPick = opt === selectedOption && !isCorrect;
              return (
                <View key={`${mp.currentQuestionIndex}-${idx}`} style={styles.optionWrapper}>
                  <View style={styles.optionShadow} />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    silent={true}
                    style={[
                      styles.optionButton,
                      isAnswering && isCorrect && styles.optionCorrect,
                      isAnswering && isWrongPick && styles.optionWrong,
                      isAnswering && !isCorrect && !isWrongPick && styles.optionDimmed,
                    ]}
                    disabled={isAnswering}
                    onPress={() => handleOptionPress(opt)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isAnswering && (isCorrect || isWrongPick) && styles.optionTextOnColor,
                      ]}
                      adjustsFontSizeToFit
                      numberOfLines={2}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Pause Modal */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>PAUSED</Text>
              <Text style={styles.menuSubtitle}>
                ⚠️ Time does not stop in online battles!
              </Text>
              <View style={styles.menuLiveTimerBadge}>
                <Text style={styles.menuLiveTimerText}>
                  ⏱️ {formatTimer(mp.timeRemaining)} remaining
                </Text>
              </View>

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnResume} onPress={() => setIsPaused(false)}>
                  <Text style={styles.btnResumeText}>RESUME</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnQuit} onPress={handleOpenForfeitModal}>
                  <Text style={styles.btnQuitText}>FORFEIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forfeit Confirmation Modal */}
      <Modal visible={showForfeitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.forfeitModalContent}>
              {/* Flag Badge */}
              <View style={styles.forfeitIconBadge}>
                <Text style={styles.forfeitIconText}>🏳️</Text>
              </View>

              <Text style={styles.forfeitModalTitle}>FORFEIT MATCH?</Text>

              {/* Warning Card */}
              <View style={styles.forfeitWarningBox}>
                <Feather name="alert-triangle" size={20} color="#e8302a" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.forfeitWarningTitle}>
                    {!isLobby ? 'RANKED PENALTY' : 'FRIENDLY MATCH'}
                  </Text>
                  <Text style={styles.forfeitWarningText}>
                    {!isLobby
                      ? 'You will LOSE MMR and your opponent will immediately be awarded the victory.'
                      : 'You will forfeit this match and award the win to your opponent.'}
                  </Text>
                </View>
              </View>

              {/* Keep Playing Button */}
              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity
                  style={[styles.btnResume, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                  onPress={handleCancelForfeit}
                >
                  <Feather name="play" size={20} color="#fff" />
                  <Text style={styles.btnResumeText}>KEEP PLAYING</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Forfeit Button */}
              <View style={[styles.btnWrapper, { marginBottom: 0 }]}>
                <View style={styles.btnShadow} />
                <TouchableOpacity
                  style={[styles.btnQuit, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                  onPress={handleConfirmForfeit}
                >
                  <Feather name="flag" size={20} color="#fff" />
                  <Text style={styles.btnQuitText}>CONFIRM FORFEIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rank Progression / Promotion Animation Modal */}
      <RankProgressModal
        visible={showRankProgress}
        prevMmr={prevMmrForAnimation}
        mmrChange={mp.mmrChange}
        onComplete={() => {
          setShowRankProgress(false);
          setShowResult(true);
        }}
      />

      {/* Result Modal */}
      <Modal visible={showResult} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={[styles.resultContent, {
              backgroundColor: mp.result === 'win' ? '#1a6cf5' : mp.result === 'draw' ? '#f5a623' : '#e8302a',
            }]}>
              <Text style={styles.resultTitle}>
                {mp.result === 'win' ? '🏆 VICTORY!' : mp.result === 'draw' ? '🤝 DRAW!' : '💀 DEFEAT'}
              </Text>

              {/* Score Comparison */}
              <View style={styles.resultScoreRow}>
                <View style={styles.resultScoreCol}>
                  <Text style={styles.resultScoreLabel}>You</Text>
                  <Text style={styles.resultScoreVal}>{mp.myScore}</Text>
                  <Text style={styles.resultHeartsVal}>{renderHearts(mp.myHearts)}</Text>
                </View>
                <Text style={styles.resultVs}>vs</Text>
                <View style={styles.resultScoreCol}>
                  <Text style={styles.resultScoreLabel}>{mp.opponentName ?? 'Opp'}</Text>
                  <Text style={styles.resultScoreVal}>{mp.opponentScore}</Text>
                  <Text style={styles.resultHeartsVal}>{renderHearts(mp.opponentHearts)}</Text>
                </View>
              </View>

              {/* MMR Change (Ranked Only) */}
              {!isLobby ? (
                <View style={styles.mmrChangeRow}>
                  <Text style={styles.mmrChangeLabel}>MMR</Text>
                  <Text style={[styles.mmrChangeValue, {
                    color: mp.mmrChange >= 0 ? '#dcfce7' : '#fecaca',
                  }]}>
                    {mp.mmrChange >= 0 ? '+' : ''}{mp.mmrChange}
                  </Text>
                </View>
              ) : (
                <View style={styles.lobbyResultBadge}>
                  <Text style={styles.lobbyResultBadgeText}>🏠 Lobby Friendly Match</Text>
                </View>
              )}

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnResume} onPress={handleResultDone}>
                  <Text style={styles.btnResumeText}>CONTINUE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 10,
    backgroundColor: '#1a1008',
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  scoreLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#b0a18e',
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 26,
    color: '#22c55e',
  },
  oppScoreValue: {
    color: '#e8302a',
  },
  heartsValue: {
    fontSize: 10,
    marginTop: 2,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 24,
    color: '#ffffff',
  },
  timerDanger: {
    color: '#f5a623',
  },
  timerCritical: {
    color: '#e8302a',
  },
  pauseBtn: {
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Arena
  arena: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#e8ddd0',
    borderBottomWidth: 3,
    borderColor: '#1a1008',
  },
  spriteCol: {
    alignItems: 'center',
  },
  spriteLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    marginTop: 4,
  },
  spriteHearts: {
    fontSize: 10,
    marginTop: 2,
  },
  vsDivider: {
    alignItems: 'center',
    padding: 4,
  },
  vsText: {
    fontSize: 22,
  },
  lobbyTag: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
    color: '#7a6a55',
    marginTop: 2,
    letterSpacing: 1,
  },

  // Question Panel
  questionPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionNumber: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 6,
  },
  equation: {
    fontFamily: GameFonts.impact,
    fontSize: 30,
    color: '#1a1008',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  optionWrapper: {
    width: '45%',
    position: 'relative',
  },
  optionShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 0,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  optionCorrect: {
    backgroundColor: '#22c55e',
    borderColor: '#14532d',
  },
  optionWrong: {
    backgroundColor: '#e8302a',
    borderColor: '#7f1d1d',
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    textAlign: 'center',
  },
  optionTextOnColor: {
    color: '#fff',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuWrapper: {
    width: '100%',
    maxWidth: 350,
    position: 'relative',
  },
  menuShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  menuTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 28,
    color: '#e8302a',
    marginBottom: 8,
    letterSpacing: 2,
  },
  menuSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    marginBottom: 12,
  },
  menuLiveTimerBadge: {
    backgroundColor: '#fff9e6',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  menuLiveTimerText: {
    fontFamily: GameFonts.arcade,
    fontSize: 14,
    color: '#d97706',
  },

  // Result Modal
  resultContent: {
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  resultTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 30,
    color: '#fff',
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    marginBottom: 20,
    letterSpacing: 1,
  },
  resultScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  resultScoreCol: {
    alignItems: 'center',
  },
  resultScoreLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  resultScoreVal: {
    fontFamily: GameFonts.arcade,
    fontSize: 36,
    color: '#fff',
  },
  resultHeartsVal: {
    fontSize: 12,
    marginTop: 4,
  },
  resultVs: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#fff',
    opacity: 0.6,
  },
  mmrChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mmrChangeLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    color: '#fff',
  },
  mmrChangeValue: {
    fontFamily: GameFonts.arcade,
    fontSize: 22,
    color: '#fff',
  },
  lobbyResultBadge: {
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lobbyResultBadgeText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Buttons
  btnWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  btnShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  btnResume: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnResumeText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  btnQuit: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnQuitText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 18,
    textTransform: 'uppercase',
  },

  // Forfeit Confirmation Modal
  forfeitModalContent: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  forfeitIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    borderWidth: 3,
    borderColor: '#e8302a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  forfeitIconText: {
    fontSize: 30,
  },
  forfeitModalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 26,
    color: '#e8302a',
    letterSpacing: 1.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  forfeitWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  forfeitWarningTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  forfeitWarningText: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 17,
  },
});
