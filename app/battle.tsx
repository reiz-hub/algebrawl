// app/battle.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { generateQuestion, Question } from '../scripts/mathGenerator';

export default function BattleScreen() {
  const { level, questions, skillName, skillIcon, gearName, gearIcon, gearStat } = useLocalSearchParams();
  const router = useRouter();
  const { completeLevel, updateStats } = useGameStore();
  
  const totalQuestions = Number(questions) || 10;
  const currentLevel = Number(level) || 1;
  
  // Skill & Gear data from pre-battle
  const activeSkillName = skillName ? String(skillName) : "Basic Attack";
  const activeSkillIcon = skillIcon ? String(skillIcon) : "⚔️";
  const activeGearStat = gearStat ? String(gearStat) : "";
  const activeGearIcon = gearIcon ? String(gearIcon) : "";

  // Parse Gear Bonuses
  const bonusHearts = activeGearStat === '+1 Heart' ? 1 : activeGearStat === '+2 Hearts' ? 2 : 0;
  const bonusTime = activeGearStat === '+2s / Q' ? 2 : activeGearStat === '+4s / Q' ? 4 : 0;
  const xpMultiplier = activeGearStat === '2x XP Boost' ? 2 : 1;

  const maxHearts = 3 + bonusHearts;
  const initialTime = 15 + bonusTime;

  // Core Game State (Applied Bonuses)
  const [playerHP, setPlayerHP] = useState(maxHearts);
  const [enemyHP, setEnemyHP] = useState(totalQuestions);
  const [timer, setTimer] = useState(initialTime);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  
  // Modals & Delays
  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Skill States
  const [skillUsed, setSkillUsed] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [hasDoubleStrike, setHasDoubleStrike] = useState(false);

  // Initialize first question
  useEffect(() => {
    setCurrentQ(generateQuestion(currentLevel));
  }, []);

  // ⏱️ TIMER LOGIC
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
      // Cap earned stars to max 3 even if they have 4 or 5 hearts
      const earnedStars = Math.min(3, playerHP); 
      
      completeLevel(currentLevel, earnedStars);
      
      // Apply XP multiplier from Gear
      updateStats(50 * xpMultiplier, true); 

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
    setTimer(initialTime); // Use gear-boosted time!
    setCurrentQ(generateQuestion(currentLevel));
    setSelectedOption(null);
    setIsAnswering(false);
  };

  const getOptionStyle = (opt: string) => {
    if (!isAnswering || !currentQ) return styles.optionButton;
    if (opt === currentQ.correctAnswer) return [styles.optionButton, styles.optionCorrect];
    if (opt === selectedOption && opt !== currentQ.correctAnswer) return [styles.optionButton, styles.optionWrong]; 
    return [styles.optionButton, styles.optionDimmed]; 
  };

  // Helper for dynamic hearts
  const renderHearts = () => {
    const safeHP = Math.max(0, playerHP);
    const lostHearts = Math.max(0, maxHearts - safeHP);
    return '❤️'.repeat(safeHP) + '🖤'.repeat(lostHearts);
  };

  return (
    <View style={styles.container}>
      
      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
            <Text style={styles.pauseIcon}>||</Text>
          </TouchableOpacity>
          <Text style={styles.hpHearts}>{renderHearts()}</Text>
        </View>
        
        <Text style={[styles.timer, timer <= 5 && styles.timerDanger]}>{timer}s</Text>
        
        <View style={styles.topRight}>
          <Text style={styles.enemyHpText}>⭐ x {enemyHP}</Text>
        </View>
      </View>

      {/* 2. ARENA AREA */}
      <View style={styles.arena}>
        
        {/* Player Side */}
        <View style={{ alignItems: 'center' }}>
          <View style={styles.spritePlaceholder}>
            <Text style={styles.spriteText}>PLAYER</Text>
            {hasShield && <Text style={styles.statusText}>🛡️ SHIELDED</Text>}
            {hasDoubleStrike && <Text style={styles.statusText}>🔥 2X DMG</Text>}
          </View>

          {/* Equipped Gear Indicator */}
          {activeGearStat && (
            <View style={styles.gearIndicator}>
              <Text style={styles.gearIndicatorText}>{activeGearIcon} {activeGearStat}</Text>
            </View>
          )}
        </View>

        <View style={[styles.spritePlaceholder, styles.enemySprite]}>
          <Text style={styles.spriteText}>ENEMY</Text>
        </View>

        {/* Clickable Active Skill Display */}
        <TouchableOpacity 
          style={styles.skillBadgeContainer} 
          activeOpacity={0.8}
          disabled={skillUsed || activeSkillName === "Basic Attack"}
          onPress={activateSkill}
        >
          <View style={styles.skillBadgeShadow} />
          <View style={[styles.skillBadge, skillUsed && styles.skillBadgeUsed]}>
            <Text style={[styles.skillBadgeText, skillUsed && styles.skillBadgeTextUsed]}>
              {activeSkillIcon} {activeSkillName} {skillUsed ? "(USED)" : ""}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. QUESTION PANEL */}
      {currentQ && (
        <View style={styles.questionPanel}>
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
                   {'⭐'.repeat(Math.min(3, playerHP))}{'☆'.repeat(Math.max(0, 3 - Math.min(3, playerHP)))}
                 </Text>
              </View>
              <Text style={styles.victorySubtitle}>Level {currentLevel} Cleared!</Text>
              
              {xpMultiplier > 1 && <Text style={{color: '#fff', fontWeight: '900', marginBottom: 15}}>✨ {xpMultiplier}x XP BOOST APPLIED! ✨</Text>}

              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/map')}>
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
              <View style={styles.heartsContainer}>
                <Text style={styles.defeatHearts}>
                  {'🖤'.repeat(maxHearts)}
                </Text>
              </View>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  
  topBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#fff9f0', zIndex: 10
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pauseBtn: {
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008',
    borderRadius: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  pauseIcon: { fontSize: 18, fontWeight: '900', color: '#1a1008', transform: [{ rotate: '90deg' }] },
  hpHearts: { fontSize: 20 },
  topRight: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  enemyHpText: { fontSize: 18, fontWeight: '900', color: '#f5a623' },
  timer: { fontSize: 32, fontWeight: '900', color: '#1a1008' },
  timerDanger: { color: '#e8302a' },
  
  arena: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', position: 'relative' },
  spritePlaceholder: {
    width: 100, height: 120, backgroundColor: '#4285F4', 
    borderWidth: 4, borderColor: '#1a1008', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', position: 'relative'
  },
  enemySprite: { backgroundColor: '#aa66cc' },
  spriteText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  statusText: { 
    position: 'absolute', top: -30, 
    backgroundColor: '#fff', color: '#1a1008', fontWeight: '900', fontSize: 12, 
    paddingHorizontal: 8, paddingVertical: 4, 
    borderWidth: 2, borderColor: '#1a1008', borderRadius: 8, overflow: 'hidden'
  },
  gearIndicator: {
    marginTop: 10, backgroundColor: '#e5d9c4', borderWidth: 2, borderColor: '#1a1008', 
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4
  },
  gearIndicatorText: { fontSize: 12, fontWeight: '900', color: '#1a1008' },
  
  skillBadgeContainer: { position: 'absolute', bottom: 20, left: 20 },
  skillBadgeShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 8 },
  skillBadge: { backgroundColor: '#fef3c7', borderWidth: 3, borderColor: '#1a1008', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  skillBadgeUsed: { backgroundColor: '#e5d9c4' }, 
  skillBadgeText: { fontSize: 14, fontWeight: '900', color: '#1a1008', textTransform: 'uppercase' },
  skillBadgeTextUsed: { color: '#7a6a55' }, 

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
  victoryStars: { fontSize: 32, letterSpacing: 5 },
  victorySubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },

  defeatContent: { backgroundColor: '#e8302a', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  defeatTitle: { fontSize: 48, fontWeight: '900', color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2 },
  heartsContainer: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 15 },
  defeatHearts: { fontSize: 32, letterSpacing: 5 },
  defeatSubtitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1 },

  btnWrapper: { width: '100%', position: 'relative', marginBottom: 15 },
  btnShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  btnPrimary: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  btnSecondary: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryText: { color: '#1a1008', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
});