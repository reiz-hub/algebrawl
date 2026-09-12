// app/battle.tsx
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Modal, StyleSheet, Text, View } from 'react-native';
import AttackProjectile from '../components/AttackProjectile';
import ReviewModal from '../components/ReviewModal';
import Sprite from '../components/sprite';
import TouchableOpacity from '../components/TouchableOpacity';
import { getLevelTheme, LEVEL_THEMES } from '../constants/levelThemes';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { generateQuestion, Question } from '../scripts/mathGenerator';
import { soundService } from '../services/soundService';
import { getGearAsset, getSkillAsset } from '../constants/shopItems';

export default function BattleScreen() {
  const { level, questions, timePerQuestion: timeParam, skillId, skillName, skillIcon, gearId, gearName, gearIcon, gearStat, characterId: paramCharId, difficulty: paramDifficulty } = useLocalSearchParams();
  const router = useRouter();
  const { recordLevelProgress, updateStats, coins, equippedCharacter } = useGameStore();
  const selectedCharId = String(paramCharId || equippedCharacter || 'c0');
  const selectedDifficulty = (paramDifficulty ? String(paramDifficulty) : 'medium') as 'easy' | 'medium' | 'hard';

  const totalQuestions = Number(questions) || 10;
  const currentLevel = Number(level) || 1;
  const levelTheme = getLevelTheme(currentLevel, selectedDifficulty);
  const isExtraLarge = currentLevel <= 2;
  const isMedium = currentLevel === 3;

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

  const activeGearImage = getGearAsset(gearId as string) || getGearAsset(gearName as string) || getGearAsset(activeGearIcon);
  const activeSkillImage = getSkillAsset(skillId as string) || getSkillAsset(activeSkillName) || getSkillAsset(activeSkillIcon) || getSkillAsset('s1');

  // Gear bonus calculations
  const gearBonusHearts =
    activeGearStat === '+1 Heart' ? 1 :
      activeGearStat === '+2 Hearts' ? 2 :
        activeGearStat.includes('+3 Hearts') ? 3 : 0;

  const gearBonusTime =
    activeGearStat === '+2s / Q' ? 2 :
      activeGearStat === '+4s / Q' ? 4 :
        activeGearStat.includes('+5s') ? 5 : 0;

  // Character passive bonus calculations
  const charBonusHearts =
    selectedCharId === 'c2' ? 1 : // Isaac Newton: +1 Heart
      selectedCharId === 'c3' ? 2 : // Nikola Tesla: +2 Hearts
        selectedCharId === 'c4' ? 2 : 0; // Marie Curie: +2 Hearts

  const charBonusTime =
    selectedCharId === 'c1' ? 3 : // Ada Lovelace: +3s / Q
      selectedCharId === 'c3' ? 3 : 0; // Nikola Tesla: +3s / Q

  const charStartShield = selectedCharId === 'c4'; // Marie Curie starts with active Shield!

  const bonusHearts = gearBonusHearts + charBonusHearts;
  const bonusTime = gearBonusTime + charBonusTime;
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
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [timer, setTimer] = useState(initialTime);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const reviewShown = useRef(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [skillUsed, setSkillUsed] = useState(false);
  const [hasShield, setHasShield] = useState(charStartShield);
  const [hasDoubleStrike, setHasDoubleStrike] = useState(false);

  const [attackActive, setAttackActive] = useState(false);
  const [attacker, setAttacker] = useState<'player' | 'enemy'>('player');
  const [isImpactPhase, setIsImpactPhase] = useState(false);

  const [musicEnabled, setMusicEnabled] = useState(soundService.getMusicEnabled());
  const [soundEnabled, setSoundEnabled] = useState(soundService.getSoundEnabled());

  useEffect(() => {
    if (isPaused) {
      setMusicEnabled(soundService.getMusicEnabled());
      setSoundEnabled(soundService.getSoundEnabled());
    }
  }, [isPaused]);

  const playerAction = useMemo(() => {
    if (isWon || showVictory) return 'win';
    if (showDefeat) return 'defeat';
    if (attackActive) {
      if (attacker === 'player') return 'attack';
      if (attacker === 'enemy') return isImpactPhase ? 'hit' : 'idle';
    }
    if (isAnswering && selectedOption) {
      return currentQ && selectedOption === currentQ.correctAnswer ? 'attack' : 'hit';
    }
    return 'idle';
  }, [isWon, showVictory, showDefeat, attackActive, attacker, isImpactPhase, isAnswering, selectedOption, currentQ]);

  const enemyAction = useMemo(() => {
    if (isWon || showVictory) return 'defeat';
    if (showDefeat) return 'win';
    if (attackActive) {
      if (attacker === 'enemy') return 'attack';
      if (attacker === 'player') return isImpactPhase ? 'hit' : 'idle';
    }
    if (isAnswering && selectedOption) {
      return currentQ && selectedOption === currentQ.correctAnswer ? 'hit' : 'attack';
    }
    return 'idle';
  }, [isWon, showVictory, showDefeat, attackActive, attacker, isImpactPhase, isAnswering, selectedOption, currentQ]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const isBossQuestion = currentLevel === 7 && questionIndex >= totalQuestions - 5;
  const currentEnemyId = useMemo(() => {
    if (currentLevel === 7) {
      if (isBossQuestion) {
        if (selectedDifficulty === 'medium') return 'medium_dragon';
        if (selectedDifficulty === 'easy') return 'easy_dragon';
        return 'medium_dragon';
      }
      const srcLevel = currentQ?.sourceLevel || 1;
      return LEVEL_THEMES[srcLevel]?.enemyId || 'villain1';
    }
    return levelTheme.enemyId || 'villain1';
  }, [currentLevel, isBossQuestion, selectedDifficulty, currentQ?.sourceLevel, levelTheme.enemyId]);

  useEffect(() => {
    const q = generateQuestion(currentLevel, 0, totalQuestions, selectedDifficulty);
    setCurrentQ(q);
    if (currentLevel === 7) {
      setTimer(getTimeForLevel(q.sourceLevel));
    }
  }, []);

  // Play victory sound: when win pose starts.
  useEffect(() => {
    if (isWon) {
      soundService.playSound('victory');
    }
  }, [isWon]);

  // Play defeat sound: when showDefeat becomes true.
  useEffect(() => {
    if (showDefeat) {
      soundService.playSound('defeat');
    }
  }, [showDefeat]);

  useEffect(() => {
    if (isPaused || isWon || showVictory || showDefeat || isAnswering || !currentQ || playerHP <= 0) return;

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
    if (isAnswering || attackActive) return;
    setIsAnswering(true);
    setSelectedOption('TIMEOUT');
    setAttacker('enemy');
    setIsImpactPhase(false);
    setAttackActive(true);
  };

  const handleOptionPress = (opt: string) => {
    if (isAnswering || !currentQ || attackActive) return;

    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;
    setAttacker(isCorrect ? 'player' : 'enemy');
    setIsImpactPhase(false);
    setAttackActive(true);
  };

  const handleProjectileImpact = () => {
    setIsImpactPhase(true);
    if (attacker === 'player') {
      soundService.playSound('hit');
    } else {
      if (hasShield) {
        soundService.playSound('click');
      } else {
        soundService.playSound('break');
      }
    }
  };

  const handleProjectileComplete = () => {
    setAttackActive(false);
    setIsImpactPhase(false);

    if (attacker === 'player') {
      applyCorrectAnswer();
    } else {
      applyWrongAnswer();
    }
  };

  const applyCorrectAnswer = () => {
    const damage = hasDoubleStrike ? 2 : 1;
    const newEnemyHP = Math.max(0, enemyHP - damage);
    const newCorrectCount = correctAnswersCount + 1;

    setEnemyHP(newEnemyHP);
    setCorrectAnswersCount(newCorrectCount);
    setHasDoubleStrike(false);

    if (newEnemyHP <= 0) {
      setIsWon(true);
      recordLevelProgress(currentLevel, newCorrectCount, true);
      updateStats(50 * xpMultiplier, true, 50);
      setTimeout(() => {
        setShowVictory(true);
      }, 1800);
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
      soundService.playSound('heartbreak');

      if (newPlayerHP <= 0) {
        recordLevelProgress(currentLevel, correctAnswersCount, false);
        updateStats(0, false);
        setIsAnswering(false);
        setSelectedOption(null);
        setShowDefeat(true);
      } else {
        resetForNextQuestion();
      }
    }
  };

  const resetForNextQuestion = () => {
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    const nextQ = generateQuestion(currentLevel, nextIndex, totalQuestions, selectedDifficulty);
    const nextTime = currentLevel === 7
      ? getTimeForLevel(nextQ.sourceLevel)
      : initialTime;
    setTimer(nextTime);
    setCurrentQ(nextQ);
    setSelectedOption(null);
    setIsAnswering(false);
  };

  const getOptionStyle = (opt: string) => {
    const baseStyle = [
      styles.optionButton,
      { backgroundColor: levelTheme.buttonBg, borderColor: levelTheme.buttonBorder },
      isMedium && styles.optionButtonMedium,
      isExtraLarge && styles.optionButtonLarge
    ];
    if (!isAnswering || !currentQ) return baseStyle;
    if (opt === currentQ.correctAnswer) return [...baseStyle, styles.optionCorrect];
    if (opt === selectedOption && opt !== currentQ.correctAnswer) return [...baseStyle, styles.optionWrong];
    return [...baseStyle, styles.optionDimmed];
  };

  const actionBadgeImage = useMemo(() => {
    const CHARACTER_SPRITES: Record<string, Record<string, any>> = {
      c0: { win: require('../assets/images/sprites/hero_win.png'), attack: require('../assets/images/sprites/hero_attack.png'), defeat: require('../assets/images/sprites/hero_defeat.png'), hit: require('../assets/images/sprites/hero_hit.png') },
      char_algebro: { win: require('../assets/images/sprites/hero_win.png'), attack: require('../assets/images/sprites/hero_attack.png'), defeat: require('../assets/images/sprites/hero_defeat.png'), hit: require('../assets/images/sprites/hero_hit.png') },
      c1: { win: require('../assets/images/sprites/lovelacewin.png'), attack: require('../assets/images/sprites/lovelaceattack.png'), defeat: require('../assets/images/sprites/Lovelacedefeat.png'), hit: require('../assets/images/sprites/Lovelacehit.png') },
      c2: { win: require('../assets/images/sprites/newtonwin.png'), attack: require('../assets/images/sprites/newtonattack.png'), defeat: require('../assets/images/sprites/Newtondefeat.png'), hit: require('../assets/images/sprites/Newtonhit.png') },
      c3: { win: require('../assets/images/sprites/teslawin.png'), attack: require('../assets/images/sprites/teslaattack.png'), defeat: require('../assets/images/sprites/tesladefeat.png'), hit: require('../assets/images/sprites/teslahit.png') },
      c4: { win: require('../assets/images/sprites/curiewin.png'), attack: require('../assets/images/sprites/curieattack.png'), defeat: require('../assets/images/sprites/curiedefeat.png'), hit: require('../assets/images/sprites/curiehit.png') },
    };
    const charSpriteSet = CHARACTER_SPRITES[selectedCharId] || CHARACTER_SPRITES.c0;
    if (showVictory) return charSpriteSet.win;
    if (showDefeat) return charSpriteSet.defeat;
    if (isAnswering && selectedOption && currentQ) {
      return selectedOption === currentQ.correctAnswer
        ? charSpriteSet.attack
        : charSpriteSet.hit;
    }
    return charSpriteSet.win;
  }, [showVictory, showDefeat, isAnswering, selectedOption, currentQ, selectedCharId]);

  const renderHearts = () => {
    const safeHP = Math.max(0, playerHP);
    const lostHearts = Math.max(0, maxHearts - safeHP);
    return '❤️'.repeat(safeHP) + '🖤'.repeat(lostHearts);
  };

  const restartBattle = () => {
    setShowDefeat(false);
    setShowVictory(false);
    setIsWon(false);
    soundService.stopSound('defeat');
    soundService.stopSound('victory');

    setPlayerHP(maxHearts);
    setEnemyHP(totalQuestions);
    setCorrectAnswersCount(0);
    setQuestionIndex(0);
    setSkillUsed(false);
    setHasShield(charStartShield);
    setHasDoubleStrike(false);
    setAttackActive(false);
    setIsImpactPhase(false);
    setSelectedOption(null);
    setIsAnswering(false);
    reviewShown.current = false;

    const firstQ = generateQuestion(currentLevel, 0, totalQuestions, selectedDifficulty);
    setCurrentQ(firstQ);
    const firstTime = currentLevel === 7
      ? getTimeForLevel(firstQ.sourceLevel)
      : initialTime;
    setTimer(firstTime);
  };

  return (
    <View style={styles.container}>

      {/* 1. TOP BAR (HEADER & PAUSE BUTTON OUTSIDE MAP BG) */}
      <View style={styles.topBar}>
        <Text style={styles.levelTitle} numberOfLines={1} adjustsFontSizeToFit>
          Level {currentLevel}: {levelTitle.toUpperCase()}
        </Text>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
          <Feather name="pause" size={14} color="#1a1008" />
          <Text style={styles.pauseLabel}>PAUSE</Text>
        </TouchableOpacity>
      </View>

      {/* MAP BACKGROUND COVERING SUB-BAR HUD (HEARTS, TIMER, Q COUNTER) AND ARENA */}
      <ImageBackground
        source={levelTheme.bgImage || undefined}
        style={[styles.mapArea, { backgroundColor: levelTheme.stageBgColor }]}
        resizeMode="cover"
      >
        {/* 1b. TIMER + Q COUNTER BAR (Floating directly over background environment) */}
        <View style={styles.subBar}>
          <Text style={styles.hpHearts}>{renderHearts()}</Text>

          <Text style={[styles.timer, timer <= 5 && styles.timerDanger]}>{timer}s</Text>

          <Text style={styles.questionCounter}>Q:{totalQuestions - enemyHP + 1}/{totalQuestions}</Text>
        </View>

        {/* 2. ARENA AREA */}
        <View style={styles.arena}>
          {/* Player Side */}
          <View style={styles.characterSlot}>
            <View style={styles.statusBadgeArea}>
              {hasShield && (
                <View style={styles.statusBadgeRow}>
                  <Image source={require('../assets/icons/skills/shield.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                  <Text style={styles.statusBadgeLabel}>SHIELDED</Text>
                </View>
              )}
              {hasDoubleStrike && (
                <View style={styles.statusBadgeRow}>
                  <Image source={require('../assets/icons/skills/double_strike.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                  <Text style={styles.statusBadgeLabel}>2X DMG</Text>
                </View>
              )}
            </View>

            <Sprite action={playerAction} characterId={selectedCharId} />

            <View style={styles.bottomUIArea}>
              {(Boolean(activeGearStat) || Boolean(activeSkillName)) ? (
                <View style={styles.loadoutRow}>
                  {Boolean(activeGearStat) && (
                    <View style={styles.gearSquare}>
                      {activeGearImage ? (
                        <Image source={activeGearImage} style={styles.gearIconLarge} resizeMode="contain" />
                      ) : activeGearIcon ? (
                        <Text style={{ fontSize: 26 }}>{activeGearIcon}</Text>
                      ) : null}
                      <Text style={styles.gearSquareText} numberOfLines={1} adjustsFontSizeToFit>{activeGearStat}</Text>
                    </View>
                  )}

                  {Boolean(activeSkillName) && (
                    <TouchableOpacity
                      style={[
                        styles.skillSquare,
                        skillUsed && styles.skillSquareUsed,
                      ]}
                      activeOpacity={0.8}
                      disabled={skillUsed || activeSkillName === "Basic Attack"}
                      onPress={activateSkill}
                    >
                      {activeSkillImage ? (
                        <Image
                          source={activeSkillImage}
                          style={[styles.skillIconLarge, skillUsed && styles.skillIconLargeUsed]}
                          resizeMode="contain"
                        />
                      ) : activeSkillIcon ? (
                        <Text style={{ fontSize: 26 }}>{activeSkillIcon}</Text>
                      ) : null}
                      <Text style={[styles.skillSquareText, skillUsed && styles.skillSquareTextUsed]} numberOfLines={1} adjustsFontSizeToFit>
                        {activeSkillName}{skillUsed ? " (USED)" : ""}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          {/* Enemy Side */}
          <View style={styles.characterSlot}>
            <View style={styles.statusBadgeArea}>
              {isBossQuestion && (
                <View style={[styles.statusBadgeRow, { backgroundColor: '#e8302a', borderColor: '#1a1008' }]}>
                  <Text style={{ fontSize: 14 }}>👑</Text>
                  <Text style={[styles.statusBadgeLabel, { color: '#ffffff' }]}>BOSS</Text>
                </View>
              )}
            </View>
            <Sprite action={enemyAction} isEnemy enemyId={currentEnemyId} />
            <View style={styles.bottomUIArea} />
          </View>

          {/* Projectile Layer (Rendered on top of character slots) */}
          <AttackProjectile
            active={attackActive}
            attacker={attacker}
            characterId={selectedCharId}
            enemyId={currentEnemyId}
            hasDoubleStrike={hasDoubleStrike}
            hasShield={hasShield}
            onImpact={handleProjectileImpact}
            onComplete={handleProjectileComplete}
          />
        </View>
      </ImageBackground>

      {/* 3. QUESTION PANEL */}
      {currentQ && (
        <View style={[styles.questionPanel, { backgroundColor: levelTheme.panelBg, borderColor: levelTheme.buttonBorder }]}>
          {currentQ.hint ? (
            <Text style={[styles.hintText, isMedium && styles.hintTextMedium, isExtraLarge && styles.hintTextLarge]}>{currentQ.hint}</Text>
          ) : null}
          <Text style={[styles.equation, isMedium && styles.equationMedium, isExtraLarge && styles.equationLarge]} adjustsFontSizeToFit numberOfLines={2}>{currentQ.equation}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => (
              <View key={idx} style={styles.optionWrapper}>
                <View style={styles.optionShadow} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  silent={true}
                  style={getOptionStyle(opt)}
                  disabled={isAnswering}
                  onPress={() => handleOptionPress(opt)}
                >
                  <Text style={[
                    styles.optionText,
                    isMedium && styles.optionTextMedium,
                    isExtraLarge && styles.optionTextLarge,
                    isAnswering && opt === currentQ.correctAnswer && styles.optionTextCorrect,
                    isAnswering && opt === selectedOption && opt !== currentQ.correctAnswer && styles.optionTextWrong
                  ]} adjustsFontSizeToFit numberOfLines={2}>
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

              <View style={styles.pauseTogglesRow}>
                <View style={styles.pauseToggleWrapper}>
                  <View style={styles.pauseToggleShadow} />
                  <TouchableOpacity
                    style={[styles.pauseToggleBtn, !musicEnabled && styles.pauseToggleBtnDisabled]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      const newValue = !musicEnabled;
                      setMusicEnabled(newValue);
                      await soundService.setMusicEnabled(newValue);
                    }}
                  >
                    <Feather
                      name={musicEnabled ? "music" : "slash"}
                      size={20}
                      color={musicEnabled ? "#fff" : "#7a6a55"}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.pauseToggleWrapper}>
                  <View style={styles.pauseToggleShadow} />
                  <TouchableOpacity
                    style={[styles.pauseToggleBtn, !soundEnabled && styles.pauseToggleBtnDisabled, soundEnabled && { backgroundColor: '#f5a623' }]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      const newValue = !soundEnabled;
                      setSoundEnabled(newValue);
                      await soundService.setSoundEnabled(newValue);
                    }}
                  >
                    <Feather
                      name={soundEnabled ? "volume-2" : "volume-x"}
                      size={20}
                      color={soundEnabled ? "#fff" : "#7a6a55"}
                    />
                  </TouchableOpacity>
                </View>
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
                  Q:{correctAnswersCount}/{totalQuestions}
                </Text>
              </View>
              <Text style={styles.victorySubtitle}>Level {currentLevel} Cleared!</Text>

              {/* Coin Reward Banner */}
              <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: '#fbbf24', marginBottom: 16, alignItems: 'center', width: '100%' }}>
                <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: '900' }}>🪙 +50 COINS EARNED!</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 2 }}>Current Balance: 🪙 {coins}</Text>
              </View>

              {xpMultiplier > 1 && (
                <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 15 }}>
                  ✨ {xpMultiplier}x XP BOOST APPLIED! ✨
                </Text>
              )}

              <View style={{ width: '100%', gap: 10 }}>
                <View style={styles.btnWrapper}>
                  <View style={styles.btnShadow} />
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => {
                    setShowVictory(false);
                    soundService.stopSound('victory');
                    if (!reviewShown.current) {
                      reviewShown.current = true;
                      setShowReview(true);
                    } else {
                      router.replace('/map');
                    }
                  }}>
                    <Text style={styles.btnPrimaryText}>NEXT LEVEL</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.btnWrapper}>
                  <View style={styles.btnShadow} />
                  <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: '#3b82f6' }]} onPress={() => {
                    setShowVictory(false);
                    soundService.stopSound('victory');
                    router.replace('/map');
                    setTimeout(() => {
                      router.push('/shop');
                    }, 50);
                  }}>
                    <Text style={styles.btnSecondaryText}>VISIT ITEM SHOP 🛍️</Text>
                  </TouchableOpacity>
                </View>
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
              <View style={styles.starsContainer}>
                <Text style={styles.victoryStars}>
                  Q:{correctAnswersCount}/{totalQuestions}
                </Text>
              </View>
              <Text style={styles.defeatSubtitle}>You ran out of hearts!</Text>
              <View style={{ width: '100%', gap: 12 }}>
                <View style={styles.btnWrapper}>
                  <View style={styles.btnShadow} />
                  <TouchableOpacity style={styles.btnPrimary} onPress={restartBattle}>
                    <Text style={styles.btnPrimaryText}>Try Again</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.btnWrapper}>
                  <View style={styles.btnShadow} />
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => {
                    setShowDefeat(false);
                    soundService.stopSound('defeat');
                    router.replace('/map');
                  }}>
                    <Text style={styles.btnSecondaryText}>Back to Menu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>



      {/* 8. POST-GAME REVIEW MODAL */}
      <ReviewModal
        visible={showReview}
        onDismiss={() => {
          setShowReview(false);
          router.replace('/map');
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },

  mapArea: {
    flex: 1,
    position: 'relative',
  },
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
    fontFamily: GameFonts.brawl,
    flex: 1,
    fontSize: 20,
    color: '#ffffff',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginRight: 10,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  questionCounter: {
    fontFamily: GameFonts.arcade,
    fontSize: 16,
    color: '#f5a623',
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pauseIcon: {
    fontFamily: GameFonts.brawl, fontSize: 12, color: '#1a1008'
  },
  pauseLabel: {
    fontFamily: GameFonts.brawl, fontSize: 12, color: '#1a1008', textTransform: 'uppercase', letterSpacing: 0.5
  },
  pauseTogglesRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseToggleWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  pauseToggleShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 48,
    height: 48,
    backgroundColor: '#1a1008',
    borderRadius: 24,
  },
  pauseToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseToggleBtnDisabled: {
    backgroundColor: '#e5d9c4',
  },

  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  timerBlock: { alignItems: 'center' },
  hpHearts: {
    fontFamily: GameFonts.brawl,
    fontSize: 20,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  topRight: {},
  levelLabel: {},
  enemyHpText: {
    fontFamily: GameFonts.arcade, fontSize: 14, color: '#f5a623'
  },
  timer: {
    fontFamily: GameFonts.arcade,
    fontSize: 20,
    color: '#ffffff',
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  timerDanger: { color: '#e8302a' },


  arena: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 16,
  },
  characterSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomUIArea: {
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  statusBadgeArea: {
    height: 36,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontFamily: GameFonts.hud,
    backgroundColor: '#fff9f0', color: '#1a1008', fontSize: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 2, borderColor: '#1a1008', borderRadius: 8, overflow: 'hidden'
  },
  statusBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff9f0', borderWidth: 2, borderColor: '#1a1008', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statusBadgeImage: { width: 18, height: 18 },
  statusBadgeLabel: {
    fontFamily: GameFonts.hud, fontSize: 12, color: '#1a1008'
  },

  loadoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gearSquare: {
    width: 60,
    minHeight: 56,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  gearIconLarge: {
    width: 38,
    height: 38,
  },
  gearSquareText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  skillSquare: {
    width: 60,
    minHeight: 56,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  skillSquareUsed: {
    opacity: 0.5,
  },
  skillIconLarge: {
    width: 38,
    height: 38,
  },
  skillIconLargeUsed: {
    opacity: 0.6,
  },
  skillSquareText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  skillSquareTextUsed: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  questionPanel: {
    minHeight: 270,
    maxHeight: 350,
    justifyContent: 'space-between',
    backgroundColor: '#fff9f0', borderTopWidth: 4, borderColor: '#1a1008',
    paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16, borderRadius: 0, alignItems: 'center',
  },
  equation: {
    fontFamily: GameFonts.impact, fontSize: 24, color: '#ffffff', marginVertical: 4, textAlign: 'center'
  },
  equationMedium: {
    fontFamily: GameFonts.impact, fontSize: 26, marginVertical: 6
  },
  equationLarge: {
    fontFamily: GameFonts.impact, fontSize: 28, marginVertical: 8
  },
  hintText: {
    fontFamily: GameFonts.hud, fontSize: 12, color: '#ffffff', marginBottom: 2, textAlign: 'center', fontStyle: 'italic'
  },
  hintTextMedium: {
    fontFamily: GameFonts.hud, fontSize: 13, marginBottom: 4
  },
  hintTextLarge: {
    fontFamily: GameFonts.hud, fontSize: 14, marginBottom: 4
  },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%', marginTop: 6 },
  optionWrapper: { width: '47%', position: 'relative' },
  optionShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 8 },
  optionButton: { backgroundColor: '#fff9f0', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  optionButtonMedium: { paddingVertical: 10, minHeight: 54 },
  optionButtonLarge: { paddingVertical: 10, minHeight: 56 },
  optionCorrect: { backgroundColor: '#22c55e', borderColor: '#14532d' },
  optionWrong: { backgroundColor: '#e8302a', borderColor: '#7f1d1d' },
  optionDimmed: { opacity: 0.5 },
  optionText: {
    fontFamily: GameFonts.brawl, fontSize: 16, color: '#ffffff', textAlign: 'center'
  },
  optionTextMedium: {
    fontFamily: GameFonts.brawl, fontSize: 18
  },
  optionTextLarge: {
    fontFamily: GameFonts.brawl, fontSize: 20
  },
  optionTextCorrect: { color: '#fff' },
  optionTextWrong: { color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 16, 8, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuWrapper: { width: '100%', maxWidth: 350, position: 'relative' },
  menuShadow: { position: 'absolute', top: 8, left: 8, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  menuContent: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  menuTitle: {
    fontFamily: GameFonts.brawl, fontSize: 30, color: '#e8302a', marginBottom: 30, letterSpacing: 2
  },

  victoryContent: { backgroundColor: '#1a6cf5', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  victoryTitle: {
    fontFamily: GameFonts.brawl, fontSize: 34, color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2
  },
  starsContainer: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 15 },
  victoryStars: {
    fontFamily: GameFonts.brawl, fontSize: 28, color: '#1a1008', letterSpacing: 2
  },
  victorySubtitle: {
    fontFamily: GameFonts.brawl, fontSize: 20, color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1
  },

  defeatContent: { backgroundColor: '#e8302a', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 30, alignItems: 'center' },
  defeatTitle: {
    fontFamily: GameFonts.brawl, fontSize: 34, color: '#f5a623', textShadowColor: '#1a1008', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0, marginBottom: 10, letterSpacing: 2
  },
  defeatSubtitle: {
    fontFamily: GameFonts.brawl, fontSize: 20, color: '#fff', marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1
  },

  unlockContent: { backgroundColor: '#fff', borderWidth: 4, borderColor: '#1a1008', borderRadius: 16, padding: 24, alignItems: 'center' },
  unlockTitle: {
    fontFamily: GameFonts.brawl, fontSize: 24, color: '#1a1008', marginBottom: 16, letterSpacing: 1
  },
  unlockList: { width: '100%', maxHeight: 260, marginBottom: 20 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f0', borderWidth: 2, borderColor: '#1a1008', borderLeftWidth: 6, borderRadius: 10, padding: 12, marginBottom: 10, gap: 12 },
  unlockIcon: {
    fontFamily: GameFonts.brawl, fontSize: 32
  },
  unlockInfo: { flex: 1 },
  unlockNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  unlockName: {
    fontFamily: GameFonts.brawl, fontSize: 15, color: '#1a1008'
  },
  unlockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  unlockBadgeText: {
    fontFamily: GameFonts.hud, fontSize: 10, letterSpacing: 0.5
  },
  unlockDetail: {
    fontFamily: GameFonts.hud, fontSize: 12, color: '#7a6a55'
  },

  btnWrapper: { width: '100%', position: 'relative', marginBottom: 15 },
  btnShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  btnPrimary: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: {
    fontFamily: GameFonts.brawl, color: '#fff', fontSize: 18, textTransform: 'uppercase'
  },
  btnSecondary: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnSecondaryText: {
    fontFamily: GameFonts.brawl, color: '#1a1008', fontSize: 18, textTransform: 'uppercase'
  },
});