// app/battle.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Sprite from '../components/sprite';
import { useGameStore } from '../hooks/useGameStore';
import { generateQuestion, Question } from '../scripts/mathGenerator';

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', unlockLevel: 7 },
];

const ALL_SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', unlockLevel: 6 },
];

const OUTFITS = [
  { id: 'o1', name: 'Default Uniform', icon: '👕', unlockLevel: 1 },
  { id: 'o2', name: 'School Bag', icon: '🎒', unlockLevel: 2 },
  { id: 'o3', name: 'Lucky Cap', icon: '🧢', unlockLevel: 3 },
  { id: 'o4', name: 'Focus Scarf', icon: '🧣', unlockLevel: 4 },
  { id: 'o5', name: 'Battle Gi', icon: '🥋', unlockLevel: 5 },
  { id: 'o6', name: 'Champion Crown', icon: '👑', unlockLevel: 6 },
];

type UnlockItem = { icon: string; name: string; type: 'GEAR' | 'SKILL' | 'OUTFIT'; detail: string };

const computeNewUnlocks = (nextLevel: number): UnlockItem[] => {
  const unlocks: UnlockItem[] = [];
  for (const g of GEARS) {
    if (g.unlockLevel === nextLevel) unlocks.push({ icon: g.icon, name: g.name, type: 'GEAR', detail: g.stat });
  }
  for (const s of ALL_SKILLS) {
    if (s.unlockLevel === nextLevel) unlocks.push({ icon: s.icon, name: s.name, type: 'SKILL', detail: s.desc });
  }
  for (const o of OUTFITS) {
    if (o.unlockLevel === nextLevel) unlocks.push({ icon: o.icon, name: o.name, type: 'OUTFIT', detail: 'Cosmetic' });
  }
  return unlocks;
};

export default function BattleScreen() {
  const { level, questions, timePerQuestion: timeParam, skillName, skillIcon, gearName, gearIcon, gearStat } = useLocalSearchParams();
  const router = useRouter();
  const { completeLevel, updateStats } = useGameStore();

  const totalQuestions = Number(questions) || 10;
  const currentLevel = Number(level) || 1;

  const LEVEL_TITLES: Record<number, string> = {
    1: 'Variable Basics',
    2: 'Equations & Inequalities',
    3: 'Polynomials',
    4: 'Factoring',
    5: 'Systems of Equations',
    6: 'Exponents & Roots',
    7: 'Random Mode',
  };
  const LEVEL_TIMES: Record<number, number> = {
    1: 30,
    2: 30,
    3: 60,
    4: 60,
    5: 60,
    6: 60,
    7: 23,
  };
  const levelTitle = LEVEL_TITLES[currentLevel] ?? `Level ${currentLevel}`;

  const activeSkillName = skillName ? String(skillName) : "Basic Attack";
  const activeSkillIcon = skillIcon ? String(skillIcon) : "⚔️";
  const activeGearStat = gearStat ? String(gearStat) : "";
  const activeGearIcon = gearIcon ? String(gearIcon) : "";

  const bonusHearts = activeGearStat === '+1 Heart' ? 1 : activeGearStat === '+2 Hearts' ? 2 : 0;
  const bonusTime = activeGearStat === '+2s / Q' ? 2 : activeGearStat === '+4s / Q' ? 4 : 0;
  const xpMultiplier = activeGearStat === '2x XP Boost' ? 2 : 1;

  const maxHearts = 3 + bonusHearts;

  const getTimeForLevel = (srcLevel: number) => {
    return (LEVEL_TIMES[srcLevel] || 30) + bonusTime;
  };

  const initialTime = currentLevel === 7
    ? 30 + bonusTime  // placeholder; will be overridden once the first question loads
    : (Number(timeParam) || LEVEL_TIMES[currentLevel] || 30) + bonusTime;

  const [playerHP, setPlayerHP] = useState(maxHearts);
  const [enemyHP, setEnemyHP] = useState(totalQuestions);
  const [timer, setTimer] = useState(initialTime);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [showUnlocks, setShowUnlocks] = useState(false);
  const [newUnlocks, setNewUnlocks] = useState<UnlockItem[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [skillUsed, setSkillUsed] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [hasDoubleStrike, setHasDoubleStrike] = useState(false);

  const playerAction = useMemo(() => {
    if (showVictory) return 'win';
    if (showDefeat) return 'defeat';
    if (isAnswering && selectedOption) {
      return currentQ && selectedOption === currentQ.correctAnswer ? 'attack' : 'hit';
    }
    return 'idle';
  }, [showVictory, showDefeat, isAnswering, selectedOption, currentQ]);

  const enemyAction = useMemo(() => {
    if (showVictory) return 'defeat';
    if (showDefeat) return 'win';
    if (isAnswering && selectedOption) {
      // Player hit correctly → villain takes damage
      // Player wrong/timeout → villain counter-attacks
      return currentQ && selectedOption === currentQ.correctAnswer ? 'hit' : 'attack';
    }
    return 'idle';
  }, [showVictory, showDefeat, isAnswering, selectedOption, currentQ]);
  useEffect(() => {
    const q = generateQuestion(currentLevel);
    setCurrentQ(q);
    if (currentLevel === 7) {
      setTimer(getTimeForLevel(q.sourceLevel));
    }
  }, []);

  useEffect(() => {
    if (isPaused || showVictory || showDefeat || isAnswering || !currentQ || playerHP <= 0) return;

    if (timer === 0) {
      handleTimeOut();
      return;
    }

    const countdown = setTimeout(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [timer, isPaused, showVictory, showDefeat, isAnswering, currentQ, playerHP]);

  const activateSkill = () => {
    if (skillUsed || activeSkillName === "Basic Attack") return;

    if (activeSkillName === "Focus") {
      setTimer((prev) => prev + 5);
    } else if (activeSkillName === "Shield") {
      setHasShield(true);
    } else if (activeSkillName === "Double Strike") {
      setHasDoubleStrike(true);
    }

    setSkillUsed(true);
  };

  const handleTimeOut = () => {
    setIsAnswering(true);
    setSelectedOption('TIMEOUT');

    setTimeout(() => {
      applyWrongAnswer();
    }, 1500);
  };

  const handleOptionPress = (opt: string) => {
    if (isAnswering || !currentQ) return;

    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;

    setTimeout(() => {
      if (isCorrect) {
        applyCorrectAnswer();
      } else {
        applyWrongAnswer();
      }
    }, 1500);
  };

  const applyCorrectAnswer = () => {
    const damage = hasDoubleStrike ? 2 : 1;
    const newEnemyHP = Math.max(0, enemyHP - damage);

    setEnemyHP(newEnemyHP);
    setHasDoubleStrike(false);

    if (newEnemyHP <= 0) {
      completeLevel(currentLevel, totalQuestions);
      updateStats(50 * xpMultiplier, true);
      const unlocks = computeNewUnlocks(currentLevel + 1);
      setNewUnlocks(unlocks);
      setShowVictory(true);
    } else {
      resetForNextQuestion();
    }
  };

  const applyWrongAnswer = () => {
    if (hasShield) {
      setHasShield(false);
      resetForNextQuestion();
    } else {
      const newPlayerHP = playerHP - 1;
      setPlayerHP(newPlayerHP);

      if (newPlayerHP <= 0) {
        updateStats(0, false);
        setIsAnswering(false);
        setSelectedOption(null);
        setCurrentQ(null);
        setShowDefeat(true);
      } else {
        resetForNextQuestion();
      }
    }
  };

  const resetForNextQuestion = () => {
    const nextQ = generateQuestion(currentLevel);
    const nextTime = currentLevel === 7
      ? getTimeForLevel(nextQ.sourceLevel)
      : initialTime;
    setTimer(nextTime);
    setCurrentQ(nextQ);
    setSelectedOption(null);
    setIsAnswering(false);
  };

  const getOptionStyle = (opt: string) => {
    if (!isAnswering || !currentQ) return styles.optionButton;
    if (opt === currentQ.correctAnswer) return [styles.optionButton, styles.optionCorrect];
    if (opt === selectedOption && opt !== currentQ.correctAnswer) return [styles.optionButton, styles.optionWrong];
    return [styles.optionButton, styles.optionDimmed];
  };

  const actionBadgeImage = useMemo(() => {
    if (showVictory) return require('../assets/images/sprites/hero_win.png');
    if (showDefeat) return require('../assets/images/sprites/hero_defeat.png');
    if (isAnswering && selectedOption && currentQ) {
      return selectedOption === currentQ.correctAnswer
        ? require('../assets/images/sprites/hero_attack.png')
        : require('../assets/images/sprites/hero_hit.png');
    }
    return require('../assets/images/sprites/hero_win.png');
  }, [showVictory, showDefeat, isAnswering, selectedOption, currentQ]);

  const renderHearts = () => {
    const safeHP = Math.max(0, playerHP);
    const lostHearts = Math.max(0, maxHearts - safeHP);
    return '❤️'.repeat(safeHP) + '🖤'.repeat(lostHearts);
  };

  return (
    <View style={styles.container}>

      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.levelTitle} numberOfLines={1} adjustsFontSizeToFit>
          Level {currentLevel}: {levelTitle.toUpperCase()}
        </Text>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
          <Text style={styles.pauseIcon}>||</Text>
          <Text style={styles.pauseLabel}>PAUSE</Text>
        </TouchableOpacity>
      </View>

      {/* 1b. TIMER + Q COUNTER BAR */}
      <View style={styles.subBar}>
        <Text style={[styles.hpHearts, { alignSelf: 'flex-end' }]}>{renderHearts()}</Text>
        <View style={styles.timerBlock}>
          <Text style={[styles.timer, timer <= 5 && styles.timerDanger]}>{timer}s</Text>
        </View>
        <Text style={styles.questionCounter}>Q:{totalQuestions - enemyHP + 1}/{totalQuestions}</Text>
      </View>

      {/* 2. ARENA AREA */}
      <View style={styles.arena}>

        {/* Player Side */}
        <View style={styles.characterSlot}>
          <View style={styles.statusBadgeArea}>
            {hasShield && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/images/sprites/hero_win.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>SHIELDED</Text>
              </View>
            )}
            {hasDoubleStrike && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/images/sprites/hero_attack.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>2X DMG</Text>
              </View>
            )}
          </View>

          <Sprite action={playerAction} />

          {activeGearStat ? (
            <View style={styles.gearIndicator}>
              <Text style={styles.gearIndicatorText}>{activeGearIcon} {activeGearStat}</Text>
            </View>
          ) : (
            <View style={styles.gearIndicatorPlaceholder} />
          )}

          <TouchableOpacity
            style={styles.skillBadgeContainer}
            activeOpacity={0.8}
            disabled={skillUsed || activeSkillName === "Basic Attack"}
            onPress={activateSkill}
          >
            <View style={[styles.skillBadge, skillUsed && styles.skillBadgeUsed]}>
              <Text style={[styles.skillBadgeText, skillUsed && styles.skillBadgeTextUsed]}>
                {activeSkillIcon} {activeSkillName} {skillUsed ? "(USED)" : ""}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enemy Side */}
        <View style={styles.characterSlot}>
          <View style={styles.statusBadgeArea} />
          <Sprite action={enemyAction} isEnemy />
          <View style={styles.gearIndicatorPlaceholder} />
          <View style={styles.skillPlaceholder} />
        </View>

      </View>

      {/* 3. QUESTION PANEL */}
      {currentQ && (
        <View style={styles.questionPanel}>
          {currentQ.hint ? (
            <Text style={styles.hintText}>{currentQ.hint}</Text>
          ) : null}
          <Text style={styles.equation}>{currentQ.equation}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => (
              <View key={idx} style={styles.optionWrapper}>
                <View style={styles.optionShadow} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={getOptionStyle(opt)}
                  disabled={isAnswering}
                  onPress={() => handleOptionPress(opt)}
                >
                  <Text style={[
                    styles.optionText,
                    isAnswering && opt === currentQ.correctAnswer && styles.optionTextCorrect,
                    isAnswering && opt === selectedOption && opt !== currentQ.correctAnswer && styles.optionTextWrong
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 4. PAUSE MODAL */}
      <Modal visible={isPaused} transparent={true} animationType="fade">
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
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/map')}>
                  <Text style={styles.btnSecondaryText}>QUIT BATTLE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. VICTORY MODAL */}
      <Modal visible={showVictory} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.victoryContent}>
              <Text style={styles.victoryTitle}>VICTORY!</Text>
              <View style={styles.starsContainer}>
                <Text style={styles.victoryStars}>
                  Q:{totalQuestions}/{totalQuestions}
                </Text>
              </View>
              <Text style={styles.victorySubtitle}>Level {currentLevel} Cleared!</Text>
              {xpMultiplier > 1 && (
                <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 15 }}>
                  ✨ {xpMultiplier}x XP BOOST APPLIED! ✨
                </Text>
              )}
              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnPrimary} onPress={() => {
                  setShowVictory(false);
                  if (newUnlocks.length > 0) {
                    setShowUnlocks(true);
                  } else {
                    router.replace('/map');
                  }
                }}>
                  <Text style={styles.btnPrimaryText}>NEXT LEVEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. DEFEAT MODAL */}
      <Modal visible={showDefeat} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.defeatContent}>
              <Text style={styles.defeatTitle}>DEFEAT!</Text>
              <Text style={styles.defeatSubtitle}>You ran out of hearts!</Text>
              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/map')}>
                  <Text style={styles.btnSecondaryText}>RETREAT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. NEW UNLOCKS MODAL */}
      <Modal visible={showUnlocks} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.menuWrapper}>
            <View style={styles.menuShadow} />
            <View style={styles.unlockContent}>
              <Text style={styles.unlockTitle}>🎉 NEW UNLOCKS!</Text>
              <ScrollView style={styles.unlockList} showsVerticalScrollIndicator={false}>
                {newUnlocks.map((item, idx) => {
                  const borderColor = item.type === 'GEAR' ? '#1a6cf5' : item.type === 'SKILL' ? '#f5a623' : '#a855f7';
                  const badgeBg = item.type === 'GEAR' ? '#1a6cf5' : item.type === 'SKILL' ? '#f5a623' : '#a855f7';
                  const badgeText = item.type === 'SKILL' ? '#1a1008' : '#fff';
                  return (
                    <View key={idx} style={[styles.unlockRow, { borderLeftColor: borderColor }]}> 
                      <Text style={styles.unlockIcon}>{item.icon}</Text>
                      <View style={styles.unlockInfo}>
                        <View style={styles.unlockNameRow}>
                          <Text style={styles.unlockName}>{item.name}</Text>
                          <View style={[styles.unlockBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.unlockBadgeText, { color: badgeText }]}>{item.type}</Text>
                          </View>
                        </View>
                        <Text style={styles.unlockDetail}>{item.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnPrimary} onPress={() => {
                  setShowUnlocks(false);
                  router.replace('/map');
                }}>
                  <Text style={styles.btnPrimaryText}>AWESOME!</Text>
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
  container: { flex: 1, backgroundColor: '#fff9f0' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#1a1008',
  },
  levelTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginRight: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  questionCounter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1008',
    fontStyle: 'italic',
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1008',
    borderWidth: 2.5,
    borderColor: '#f5a623',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pauseIcon: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  pauseLabel: { fontSize: 16, fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1.5 },

  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff9f0',
  },
  timerBlock: { alignItems: 'center' },
  hpHearts: { fontSize: 20 },
  topRight: {},
  levelLabel: {},
  enemyHpText: { fontSize: 16, fontWeight: '900', color: '#f5a623' },
  timer: { fontSize: 28, fontWeight: '900', color: '#1a1008' },
  timerDanger: { color: '#e8302a' },

  arena: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 16,
  },
  characterSlot: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  statusBadgeArea: {
    minHeight: 36,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    backgroundColor: '#fff', color: '#1a1008', fontWeight: '900', fontSize: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 2, borderColor: '#1a1008', borderRadius: 8, overflow: 'hidden'
  },
  statusBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statusBadgeImage: { width: 18, height: 18 },
  statusBadgeLabel: { fontSize: 12, fontWeight: '900', color: '#1a1008' },

  gearIndicator: {
    marginTop: 8,
    backgroundColor: '#e5d9c4', borderWidth: 2, borderColor: '#1a1008',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  gearIndicatorText: { fontSize: 12, fontWeight: '900', color: '#1a1008' },
  gearIndicatorPlaceholder: {
    marginTop: 8,
    height: 28,
  },
  skillBadgeContainer: {
    marginTop: 10,
    position: 'relative',
  },
  skillBadgeShadow: {
    position: 'absolute', top: 4, left: 4,
    width: '100%', height: '100%',
    backgroundColor: '#1a1008', borderRadius: 8,
  },
  skillBadge: {
    backgroundColor: '#fef3c7', borderWidth: 3, borderColor: '#1a1008',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  skillBadgeUsed: { backgroundColor: '#e5d9c4' },
  skillBadgeText: { fontSize: 14, fontWeight: '900', color: '#1a1008', textTransform: 'uppercase' },
  skillBadgeTextUsed: { color: '#7a6a55' },
  skillActionImage: { width: 24, height: 24 },
  skillActionImageUsed: { opacity: 0.7 },
  skillPlaceholder: {
    marginTop: 10,
    height: 46,
  },

  questionPanel: {
    backgroundColor: '#fff', borderTopWidth: 4, borderColor: '#1a1008',
    padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center',
  },
  equation: { fontSize: 48, fontWeight: '900', color: '#1a1008', marginVertical: 20 },
  hintText: { fontSize: 17, fontWeight: '700', color: '#7a6a55', marginBottom: 4, textAlign: 'center', fontStyle: 'italic' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, width: '100%', paddingBottom: 30 },
  optionWrapper: { width: '45%', position: 'relative' },
  optionShadow: { position: 'absolute', top: 5, left: 5, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  optionButton: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  optionCorrect: { backgroundColor: '#22c55e', borderColor: '#14532d' },
  optionWrong: { backgroundColor: '#e8302a', borderColor: '#7f1d1d' },
  optionDimmed: { opacity: 0.5 },
  optionText: { fontSize: 28, fontWeight: '900', color: '#1a1008' },
  optionTextCorrect: { color: '#fff' },
  optionTextWrong: { color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 16, 8, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuWrapper: { width: '100%', maxWidth: 350, position: 'relative' },
  menuShadow: { position: 'absolute', top: 8, left: 8, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  menuContent: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  menuTitle: { fontSize: 40, fontWeight: '900', color: '#e8302a', marginBottom: 30, letterSpacing: 2 },

  victoryContent: { backgroundColor: '#1a6cf5', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  victoryTitle: { fontSize: 48, fontWeight: '900', color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2 },
  starsContainer: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 15 },
  victoryStars: { fontSize: 28, fontWeight: '900', color: '#1a1008', letterSpacing: 2 },
  victorySubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },

  defeatContent: { backgroundColor: '#e8302a', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  defeatTitle: { fontSize: 48, fontWeight: '900', color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2 },
  defeatSubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1 },

  unlockContent: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 24, alignItems: 'center' },
  unlockTitle: { fontSize: 32, fontWeight: '900', color: '#1a1008', marginBottom: 16, letterSpacing: 1 },
  unlockList: { width: '100%', maxHeight: 260, marginBottom: 20 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f0', borderWidth: 2, borderColor: '#1a1008', borderLeftWidth: 6, borderRadius: 10, padding: 12, marginBottom: 10, gap: 12 },
  unlockIcon: { fontSize: 32 },
  unlockInfo: { flex: 1 },
  unlockNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  unlockName: { fontSize: 15, fontWeight: '900', color: '#1a1008' },
  unlockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  unlockBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  unlockDetail: { fontSize: 12, fontWeight: '700', color: '#7a6a55' },

  btnWrapper: { width: '100%', position: 'relative', marginBottom: 15 },
  btnShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  btnPrimary: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  btnSecondary: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryText: { color: '#1a1008', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
});