import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Sprite from '../components/sprite';
import { generateQuestion, Question } from '../scripts/mathGenerator';

export default function VersusBattleScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const p1Name = String(params.p1Name ?? 'Player 1');
  const p2Name = String(params.p2Name ?? 'Player 2');

  const p1SkillName = String(params.p1SkillName ?? 'Basic Attack');
  const p2SkillName = String(params.p2SkillName ?? 'Basic Attack');
  const p1SkillIcon = String(params.p1SkillIcon ?? '⚔️');
  const p2SkillIcon = String(params.p2SkillIcon ?? '⚔️');

  const p1GearStat = String(params.p1GearStat ?? '');
  const p2GearStat = String(params.p2GearStat ?? '');
  const p1GearIcon = String(params.p1GearIcon ?? '');
  const p2GearIcon = String(params.p2GearIcon ?? '');

  const totalQuestions = Number(params.questions ?? 20) || 20;

  const p1BonusHearts = p1GearStat === '+1 Heart' ? 1 : p1GearStat === '+2 Hearts' ? 2 : 0;
  const p2BonusHearts = p2GearStat === '+1 Heart' ? 1 : p2GearStat === '+2 Hearts' ? 2 : 0;

  const p1BonusTime = p1GearStat === '+2s / Q' ? 2 : p1GearStat === '+4s / Q' ? 4 : 0;
  const p2BonusTime = p2GearStat === '+2s / Q' ? 2 : p2GearStat === '+4s / Q' ? 4 : 0;

  const p1MaxHearts = 3 + p1BonusHearts;
  const p2MaxHearts = 3 + p2BonusHearts;
  const p1InitialTime = 15 + p1BonusTime;
  const p2InitialTime = 15 + p2BonusTime;

  const [p1HP, setP1HP] = useState(p1MaxHearts);
  const [p2HP, setP2HP] = useState(p2MaxHearts);

  const [turn, setTurn] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(p1InitialTime);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [nextPlayerName, setNextPlayerName] = useState('');

  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [p1SkillCooldown, setP1SkillCooldown] = useState(0);
  const [p2SkillCooldown, setP2SkillCooldown] = useState(0);
  const [p1Shield, setP1Shield] = useState(false);
  const [p2Shield, setP2Shield] = useState(false);
  const [p1Double, setP1Double] = useState(false);
  const [p2Double, setP2Double] = useState(false);

  const activeName = turn === 1 ? p1Name : p2Name;
  const activeSkillName = turn === 1 ? p1SkillName : p2SkillName;
  const activeSkillIcon = turn === 1 ? p1SkillIcon : p2SkillIcon;
  const activeGearStat = turn === 1 ? p1GearStat : p2GearStat;
  const activeGearIcon = turn === 1 ? p1GearIcon : p2GearIcon;
  const activeInitialTime = turn === 1 ? p1InitialTime : p2InitialTime;
  const activeSkillCooldown = turn === 1 ? p1SkillCooldown : p2SkillCooldown;
  const activeHasShield = turn === 1 ? p1Shield : p2Shield;
  const activeHasDouble = turn === 1 ? p1Double : p2Double;

  useEffect(() => {
    setCurrentQ(generateQuestion(1));
  }, []);

  useEffect(() => {
    if (isPaused || showVictory || isAnswering || !currentQ) return;

    if (timer === 0) {
      handleTimeOut();
      return;
    }

    const countdown = setTimeout(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [timer, isPaused, showVictory, isAnswering, currentQ]);

  const renderHearts = (hp: number, max: number) => {
    const safeHP = Math.max(0, hp);
    const lostHearts = Math.max(0, max - safeHP);
    return '❤️'.repeat(safeHP) + '🖤'.repeat(lostHearts);
  };

  const activateSkill = () => {
    if (activeSkillCooldown > 0 || activeSkillName === 'Basic Attack') return;

    if (activeSkillName === 'Focus') {
      setTimer((prev) => prev + 5);
    } else if (activeSkillName === 'Shield') {
      if (turn === 1) {
        setP1Shield(true);
      } else {
        setP2Shield(true);
      }
    } else if (activeSkillName === 'Double Strike') {
      if (turn === 1) {
        setP1Double(true);
      } else {
        setP2Double(true);
      }
    }

    if (turn === 1) {
      setP1SkillCooldown(5);
    } else {
      setP2SkillCooldown(5);
    }
  };

  const nextTurn = () => {
    // Show notification first, then switch
    const next = turn === 1 ? 2 : 1;
    const nextName = next === 1 ? p1Name : p2Name;
    setNextPlayerName(nextName);
    setShowTurnNotification(true);

    // Auto-dismiss after 2s and switch turn
    setTimeout(() => {
      setShowTurnNotification(false);
      
      setTurn(next);
      setTimer(next === 1 ? p1InitialTime : p2InitialTime);
      setSelectedOption(null);
      setIsAnswering(false);
      setCurrentQ(generateQuestion(1));

      if (next === 1) {
        setP1SkillCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setP2SkillCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }

      if (next === 1) {
        setRound((r) => r + 1);
      }

      // Optional: End after totalQuestions, higher hearts wins
      if (round >= totalQuestions && next === 1) {
        const p1Alive = p1HP;
        const p2Alive = p2HP;
        if (p1Alive === p2Alive) {
          setWinner('Draw');
        } else {
          setWinner(p1Alive > p2Alive ? p1Name : p2Name);
        }
        setShowVictory(true);
      }
    }, 2000);
  };

  const handleTimeOut = () => {
    setIsAnswering(true);
    setSelectedOption('TIMEOUT');
    setTimeout(() => {
      applyWrongAnswer();
    }, 1000);
  };

  const handleOptionPress = (opt: string) => {
    if (isAnswering || !currentQ) return;
    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;
    setTimeout(() => {
      if (isCorrect) applyCorrectAnswer();
      else applyWrongAnswer();
    }, 1000);
  };

  const applyCorrectAnswer = () => {
    // TURN-BASED Q&A RULE: Correct answer passes turn to opponent (no damage)
    nextTurn();
  };

  const applyWrongAnswer = () => {
    // TURN-BASED Q&A RULE: Wrong answer loses 1 heart, passes turn
    if (turn === 1) {
      if (p1Shield) {
        setP1Shield(false);
      } else {
        const newHP = p1HP - 1;
        setP1HP(newHP);
        if (newHP <= 0) {
          setWinner(p2Name);
          setShowVictory(true);
          return;
        }
      }
    } else {
      if (p2Shield) {
        setP2Shield(false);
      } else {
        const newHP = p2HP - 1;
        setP2HP(newHP);
        if (newHP <= 0) {
          setWinner(p1Name);
          setShowVictory(true);
          return;
        }
      }
    }

    nextTurn();
  };

  const p1SpriteAction = useMemo(() => {
    if (showVictory) return winner === p1Name ? 'win' : 'defeat';
    if (turn === 1 && isAnswering && selectedOption) {
      return currentQ && selectedOption === currentQ.correctAnswer ? 'attack' : 'hit';
    }
    return 'idle';
  }, [showVictory, winner, p1Name, turn, isAnswering, selectedOption, currentQ]);

  const p2SpriteAction = useMemo(() => {
    if (showVictory) return winner === p2Name ? 'win' : 'defeat';
    if (turn === 2 && isAnswering && selectedOption) {
      return currentQ && selectedOption === currentQ.correctAnswer ? 'attack' : 'hit';
    }
    return 'idle';
  }, [showVictory, winner, p2Name, turn, isAnswering, selectedOption, currentQ]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
            <Text style={styles.pauseIcon}>||</Text>
          </TouchableOpacity>
          <Text style={styles.hpHearts}>{renderHearts(p1HP, p1MaxHearts)}</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.timer, timer <= 5 && styles.timerDanger]}>{timer}s</Text>
          <Text style={styles.turnText}>{activeName.toUpperCase()} TURN</Text>
          <Text style={styles.roundText}>Round {Math.min(round, totalQuestions)}/{totalQuestions}</Text>
        </View>

        <View style={styles.topRight}>
          <Text style={styles.enemyHpText}>{renderHearts(p2HP, p2MaxHearts)}</Text>
        </View>
      </View>

      <View style={styles.arena}>
        <View style={{ alignItems: 'center' }}>
          <Sprite action={p1SpriteAction as any} />
          <Text style={styles.playerName}>{p1Name}</Text>
          {!!p1GearStat && (
            <View style={styles.gearIndicator}>
              <Text style={styles.gearIndicatorText}>{p1GearIcon} {p1GearStat}</Text>
            </View>
          )}
          {p1Shield && <Text style={styles.statusBadge}>🛡️ SHIELDED</Text>}
          {p1Double && <Text style={styles.statusBadge}>🔥 2X DMG</Text>}
        </View>

        <View style={{ alignItems: 'center' }}>
          <Sprite action={p2SpriteAction as any} isEnemy />
          <Text style={styles.playerName}>{p2Name}</Text>
          {!!p2GearStat && (
            <View style={styles.gearIndicator}>
              <Text style={styles.gearIndicatorText}>{p2GearIcon} {p2GearStat}</Text>
            </View>
          )}
          {p2Shield && <Text style={styles.statusBadge}>🛡️ SHIELDED</Text>}
          {p2Double && <Text style={styles.statusBadge}>🔥 2X DMG</Text>}
        </View>

        <TouchableOpacity
          style={styles.skillBadgeContainer}
          activeOpacity={0.8}
          disabled={activeSkillCooldown > 0 || activeSkillName === 'Basic Attack'}
          onPress={activateSkill}
        >
          <View style={styles.skillBadgeShadow} />
          <View style={[styles.skillBadge, activeSkillCooldown > 0 && styles.skillBadgeUsed]}>
            <Text style={[styles.skillBadgeText, activeSkillCooldown > 0 && styles.skillBadgeTextUsed]}>
              {activeSkillIcon} {activeSkillName} {activeSkillCooldown > 0 ? `(CD: ${activeSkillCooldown})` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {!!activeGearStat && (
          <View style={styles.activeGearPill}>
            <Text style={styles.activeGearPillText}>{activeGearIcon} {activeGearStat}</Text>
          </View>
        )}
      </View>

      {currentQ && (
        <View style={styles.questionPanel}>
          <Text style={styles.equation}>{currentQ.equation}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => {
              const isCorrect = opt === currentQ.correctAnswer;
              const isWrongPick = opt === selectedOption && !isCorrect;
              return (
                <View key={idx} style={styles.optionWrapper}>
                  <View style={styles.optionShadow} />
                  <TouchableOpacity
                    activeOpacity={0.7}
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

      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>PAUSED</Text>

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnPrimary} onPress={() => setIsPaused(false)}>
                  <Text style={styles.btnPrimaryText}>RESUME</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/versus')}>
                  <Text style={styles.btnSecondaryText}>QUIT BATTLE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showVictory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.victoryContent}>
              <Text style={styles.victoryTitle}>{winner === 'Draw' ? 'DRAW!' : 'VICTORY!'}</Text>
              <Text style={styles.victorySubtitle}>
                {winner === 'Draw' ? 'Both players stood strong!' : `${winner} Wins!`}
              </Text>

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/versus')}>
                  <Text style={styles.btnPrimaryText}>PLAY AGAIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>


      {/* Turn Notification Modal */}
      <Modal visible={showTurnNotification} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.turnNotificationWrapper}>
            <View style={styles.turnNotificationShadow} />
            <View style={styles.turnNotificationContent}>
              <Text style={styles.turnNotificationTitle}>NEXT TURN</Text>
              <Text style={styles.turnNotificationSubtitle}>{nextPlayerName.toUpperCase()}'S TURN!</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#fff9f0', zIndex: 10,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRight: {
    backgroundColor: '#fff',
    borderWidth: 3, borderColor: '#1a1008',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  pauseBtn: {
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008',
    borderRadius: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  pauseIcon: { fontSize: 18, fontWeight: '900', color: '#1a1008', transform: [{ rotate: '90deg' }] },
  hpHearts: { fontSize: 20 },
  enemyHpText: { fontSize: 18, fontWeight: '900', color: '#f5a623' },
  timer: { fontSize: 32, fontWeight: '900', color: '#1a1008' },
  timerDanger: { color: '#e8302a' },
  turnText: { fontSize: 12, fontWeight: '900', color: '#1a1008', marginTop: 2 },
  roundText: { fontSize: 11, fontWeight: '800', color: '#7a6a55', marginTop: 2 },

  arena: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', position: 'relative' },
  playerName: { marginTop: -5, fontWeight: '900', color: '#1a1008', fontSize: 14 },
  statusBadge: {
    marginTop: 6,
    backgroundColor: '#fff',
    color: '#1a1008',
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gearIndicator: {
    marginTop: 8,
    backgroundColor: '#e5d9c4',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gearIndicatorText: { fontSize: 12, fontWeight: '900', color: '#1a1008' },

  skillBadgeContainer: { position: 'absolute', bottom: 20, left: 20 },
  skillBadgeShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 8 },
  skillBadge: { backgroundColor: '#fef3c7', borderWidth: 3, borderColor: '#1a1008', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  skillBadgeUsed: { backgroundColor: '#e5d9c4' },
  skillBadgeText: { fontSize: 14, fontWeight: '900', color: '#1a1008', textTransform: 'uppercase' },
  skillBadgeTextUsed: { color: '#7a6a55' },

  activeGearPill: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#e5d9c4',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeGearPillText: { fontSize: 11, fontWeight: '900', color: '#1a1008' },

  questionPanel: {
    backgroundColor: '#fff', borderTopWidth: 4, borderColor: '#1a1008',
    padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center',
  },
  equation: { fontSize: 48, fontWeight: '900', color: '#1a1008', marginVertical: 20 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, width: '100%', paddingBottom: 30 },
  optionWrapper: { width: '45%', position: 'relative' },
  optionShadow: { position: 'absolute', top: 5, left: 5, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  optionButton: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  optionCorrect: { backgroundColor: '#22c55e', borderColor: '#14532d' },
  optionWrong: { backgroundColor: '#e8302a', borderColor: '#7f1d1d' },
  optionDimmed: { opacity: 0.5 },
  optionText: { fontSize: 28, fontWeight: '900', color: '#1a1008' },
  optionTextOnColor: { color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 16, 8, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuWrapper: { width: '100%', maxWidth: 350, position: 'relative' },
  menuShadow: { position: 'absolute', top: 8, left: 8, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  menuContent: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  menuTitle: { fontSize: 40, fontWeight: '900', color: '#e8302a', marginBottom: 30, letterSpacing: 2 },

  victoryContent: { backgroundColor: '#1a6cf5', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  victoryTitle: { fontSize: 48, fontWeight: '900', color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2 },
  victorySubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },

  defeatContent: { backgroundColor: '#e8302a', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  defeatTitle: { fontSize: 48, fontWeight: '900', color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2 },
  defeatSubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1 },

  btnWrapper: { width: '100%', position: 'relative', marginBottom: 15 },
  btnShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  btnPrimary: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  btnSecondary: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryText: { color: '#1a1008', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },

  // Turn Notification Styles (moved to end)
  turnNotificationWrapper: { width: '100%', maxWidth: 350, position: 'relative' },
  turnNotificationShadow: { 
    position: 'absolute', 
    top: 8, left: 8, 
    width: '100%', height: '100%', 
    backgroundColor: '#1a1008', 
    borderRadius: 20 
  },
  turnNotificationContent: { 
    backgroundColor: '#f5a623', 
    borderWidth: 4, 
    borderColor: '#1a1008', 
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center' 
  },
  turnNotificationTitle: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: '#1a1008', 
    textShadowColor: '#f5a623', 
    textShadowOffset: { width: 2, height: 2 }, 
    textShadowRadius: 0, 
    marginBottom: 10, 
    letterSpacing: 3 
  },
  turnNotificationSubtitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#1a1008', 
    textTransform: 'uppercase', 
    letterSpacing: 2 
  },
});
