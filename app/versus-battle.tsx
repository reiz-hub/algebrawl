import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Modal, StyleSheet, Text, View } from 'react-native';
import AttackProjectile from '../components/AttackProjectile';
import ReviewModal from '../components/ReviewModal';
import Sprite from '../components/sprite';
import TouchableOpacity from '../components/TouchableOpacity';
import { getCharacterDetails } from '../constants/characterSkills';
import { getLevelTheme } from '../constants/levelThemes';
import { getGearAsset, getSkillAsset } from '../constants/shopItems';
import { GameFonts } from '../constants/theme';
import { generateQuestion, Question } from '../scripts/mathGenerator';
import { soundService } from '../services/soundService';

export default function VersusBattleScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const p1Name = String(params.p1Name ?? 'Player 1');
  const p2Name = String(params.p2Name ?? 'Player 2');

  const p1Character = String(params.p1Character ?? 'c0');
  const p2Character = String(params.p2Character ?? 'c1');
  const p1CharInfo = getCharacterDetails(p1Character);
  const p2CharInfo = getCharacterDetails(p2Character);

  const p1SkillName = String(params.p1SkillName ?? 'Basic Attack');
  const p2SkillName = String(params.p2SkillName ?? 'Basic Attack');
  const p1SkillIcon = String(params.p1SkillIcon ?? '⚔️');
  const p2SkillIcon = String(params.p2SkillIcon ?? '⚔️');
  const p1SkillId = String(params.p1SkillId ?? '');
  const p2SkillId = String(params.p2SkillId ?? '');

  const p1GearStat = String(params.p1GearStat ?? '');
  const p2GearStat = String(params.p2GearStat ?? '');
  const p1GearIcon = String(params.p1GearIcon ?? '');
  const p2GearIcon = String(params.p2GearIcon ?? '');
  const p1GearId = String(params.p1GearId ?? '');
  const p2GearId = String(params.p2GearId ?? '');

  const p1GearImage = getGearAsset(p1GearId || p1GearStat || p1GearIcon);
  const p2GearImage = getGearAsset(p2GearId || p2GearStat || p2GearIcon);
  const p1SkillImage = getSkillAsset(p1SkillId || p1SkillName || p1SkillIcon);
  const p2SkillImage = getSkillAsset(p2SkillId || p2SkillName || p2SkillIcon);

  const totalQuestions = Number(params.questions ?? 20) || 20;
  const baseTime = Number(params.timeLimit ?? 20) || 20;

  // Character Passives + Gear Stats
  const p1CharHearts = p1Character === 'c2' ? 1 : (p1Character === 'c3' || p1Character === 'c4') ? 2 : 0;
  const p2CharHearts = p2Character === 'c2' ? 1 : (p2Character === 'c3' || p2Character === 'c4') ? 2 : 0;
  const p1GearHearts = p1GearStat === '+1 Heart' ? 1 : p1GearStat === '+2 Hearts' ? 2 : 0;
  const p2GearHearts = p2GearStat === '+1 Heart' ? 1 : p2GearStat === '+2 Hearts' ? 2 : 0;
  const p1BonusHearts = p1GearHearts + p1CharHearts;
  const p2BonusHearts = p2GearHearts + p2CharHearts;

  const p1CharTime = (p1Character === 'c1' || p1Character === 'c3') ? 3 : 0;
  const p2CharTime = (p2Character === 'c1' || p2Character === 'c3') ? 3 : 0;
  const p1GearTime = p1GearStat === '+2s / Q' ? 2 : p1GearStat === '+4s / Q' ? 4 : 0;
  const p2GearTime = p2GearStat === '+2s / Q' ? 2 : p2GearStat === '+4s / Q' ? 4 : 0;
  const p1BonusTime = p1GearTime + p1CharTime;
  const p2BonusTime = p2GearTime + p2CharTime;

  const p1MaxHearts = 3 + p1BonusHearts;
  const p2MaxHearts = 3 + p2BonusHearts;
  const p1InitialTime = baseTime + p1BonusTime;
  const p2InitialTime = baseTime + p2BonusTime;

  const [p1HP, setP1HP] = useState(p1MaxHearts);
  const [p2HP, setP2HP] = useState(p2MaxHearts);

  const [turn, setTurn] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const currentLevel = Math.min(Math.ceil(round / 2), 6);
  const levelTheme = getLevelTheme(currentLevel);
  const isExtraLarge = currentLevel <= 2;
  const isMedium = currentLevel === 3;
  const [timer, setTimer] = useState(p1InitialTime);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [nextPlayerName, setNextPlayerName] = useState('');

  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Projectile & Sprite Action state
  const [attackActive, setAttackActive] = useState(false);
  const [attacker, setAttacker] = useState<'player' | 'enemy'>('player');
  const [p1Action, setP1Action] = useState<'idle' | 'attack' | 'hit' | 'win' | 'defeat' | null>(null);
  const [p2Action, setP2Action] = useState<'idle' | 'attack' | 'hit' | 'win' | 'defeat' | null>(null);

  const [p1SkillCooldown, setP1SkillCooldown] = useState(0);
  const [p2SkillCooldown, setP2SkillCooldown] = useState(0);
  const [p1Shield, setP1Shield] = useState(p1Character === 'c4');
  const [p2Shield, setP2Shield] = useState(p2Character === 'c4');
  const [p1Double, setP1Double] = useState(false);
  const [p2Double, setP2Double] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const reviewShown = useRef(false);

  const [musicEnabled, setMusicEnabled] = useState(soundService.getMusicEnabled());
  const [soundEnabled, setSoundEnabled] = useState(soundService.getSoundEnabled());

  useEffect(() => {
    if (isPaused) {
      setMusicEnabled(soundService.getMusicEnabled());
      setSoundEnabled(soundService.getSoundEnabled());
    }
  }, [isPaused]);

  const activeName = turn === 1 ? p1Name : p2Name;
  const activeSkillName = turn === 1 ? p1SkillName : p2SkillName;
  const activeSkillCooldown = turn === 1 ? p1SkillCooldown : p2SkillCooldown;

  useEffect(() => {
    setCurrentQ(generateQuestion(currentLevel));
  }, [currentLevel]);

  useEffect(() => {
    if (showVictory) {
      soundService.playSound('victory');
    }
  }, [showVictory]);

  useEffect(() => {
    if (isPaused || showVictory || isAnswering || attackActive || !currentQ) return;

    if (timer <= 0) {
      handleTimeOut();
      return;
    }

    const countdown = setTimeout(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(countdown);
  }, [timer, isPaused, showVictory, isAnswering, attackActive, currentQ]);

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
    const next = turn === 1 ? 2 : 1;
    const nextName = next === 1 ? p1Name : p2Name;
    setNextPlayerName(nextName);
    setShowTurnNotification(true);

    setTimeout(() => {
      setShowTurnNotification(false);

      setTurn(next);
      setTimer(next === 1 ? p1InitialTime : p2InitialTime);
      setSelectedOption(null);
      setIsAnswering(false);
      setCurrentQ(generateQuestion(currentLevel));

      if (next === 1) {
        setP1SkillCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setP2SkillCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }

      if (next === 1) {
        setRound((r) => r + 1);
      }

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
    if (isAnswering || attackActive) return;
    setIsAnswering(true);
    setSelectedOption('TIMEOUT');

    if (turn === 1) {
      setP2Action('attack');
      setP1Action(null);
      setAttacker('enemy');
    } else {
      setP1Action('attack');
      setP2Action(null);
      setAttacker('player');
    }
    setAttackActive(true);
  };

  const handleOptionPress = (opt: string) => {
    if (isAnswering || !currentQ || attackActive) return;
    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentQ.correctAnswer;
    if (turn === 1) {
      if (isCorrect) {
        // Player 1 attacks Player 2
        setP1Action('attack');
        setP2Action(null);
        setAttacker('player');
      } else {
        // Wrong answer: Player 2 counterattacks Player 1
        setP2Action('attack');
        setP1Action(null);
        setAttacker('enemy');
      }
    } else {
      if (isCorrect) {
        // Player 2 attacks Player 1
        setP2Action('attack');
        setP1Action(null);
        setAttacker('enemy');
      } else {
        // Wrong answer: Player 1 counterattacks Player 2
        setP1Action('attack');
        setP2Action(null);
        setAttacker('player');
      }
    }
    setAttackActive(true);
  };

  const handleProjectileImpact = () => {
    if (attacker === 'player') {
      // Player 2 is hit by Player 1
      setP2Action('hit');
      if (turn === 1) {
        // Player 1 answered correctly -> Player 2 is hit!
        soundService.playSound('hit');
      } else {
        // Player 2 answered wrongly -> Player 2 is hit by counterattack
        soundService.playSound('heartbreak');
      }
    } else {
      // Player 1 is hit by Player 2
      setP1Action('hit');
      if (turn === 2) {
        // Player 2 answered correctly -> Player 1 is hit!
        soundService.playSound('hit');
      } else {
        // Player 1 answered wrongly -> Player 1 is hit by counterattack
        soundService.playSound('heartbreak');
      }
    }
  };

  const handleProjectileComplete = () => {
    setAttackActive(false);
    setP1Action(null);
    setP2Action(null);
    if (selectedOption && currentQ && selectedOption === currentQ.correctAnswer) {
      applyCorrectAnswer();
    } else {
      applyWrongAnswer();
    }
  };

  const applyCorrectAnswer = () => {
    nextTurn();
  };

  const applyWrongAnswer = () => {
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
    if (p1Action) return p1Action;
    return 'idle';
  }, [showVictory, winner, p1Name, p1Action]);

  const p2SpriteAction = useMemo(() => {
    if (showVictory) return winner === p2Name ? 'win' : 'defeat';
    if (p2Action) return p2Action;
    return 'idle';
  }, [showVictory, winner, p2Name, p2Action]);

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER BAR (HEADER & PAUSE BUTTON OUTSIDE MAP BG) */}
      <View style={styles.headerBar}>
        <Text style={styles.versusTitle}>⚔️ VERSUS BATTLE</Text>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsPaused(true)}>
          <Feather name="pause" size={18} color="#1a1008" />
        </TouchableOpacity>
      </View>

      {/* MAP BACKGROUND COVERING SUB-BAR HUD (HEARTS, TIMER, TURN, ROUND) AND ARENA */}
      <ImageBackground
        source={levelTheme.bgImage || undefined}
        style={[styles.mapArea, { backgroundColor: levelTheme.stageBgColor }]}
        resizeMode="cover"
      >
        <View style={styles.topBar}>
          <Text style={styles.hpHearts}>{renderHearts(p1HP, p1MaxHearts)}</Text>

          <View style={styles.timerBadgeBox}>
            <Text style={[styles.timer, timer <= 5 && styles.timerDanger]}>{Math.max(0, timer)}s</Text>
            <Text style={styles.turnText}>{activeName.toUpperCase()} TURN</Text>
            <Text style={styles.roundText}>Round {Math.min(round, totalQuestions)}/{totalQuestions} · Lv.{currentLevel}</Text>
          </View>

          <Text style={styles.enemyHpText}>{renderHearts(p2HP, p2MaxHearts)}</Text>
        </View>

        <View style={styles.arena}>
          {/* Player 1 - left side */}
          <View style={styles.playerColumn}>
            <Sprite action={p1SpriteAction as any} characterId={p1Character} />
            <Text style={styles.playerName}>{p1CharInfo.icon} {p1Name}</Text>
            {p1Shield && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/icons/skills/shield.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>SHIELDED</Text>
              </View>
            )}
            {p1Double && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/icons/skills/double_strike.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>2X DMG</Text>
              </View>
            )}
            {(Boolean(p1GearStat) || Boolean(p1SkillName)) && (
              <View style={styles.loadoutRow}>
                {Boolean(p1GearStat) && (
                  <View style={styles.gearSquare}>
                    {p1GearImage ? (
                      <Image source={p1GearImage} style={styles.gearIconLarge} resizeMode="contain" />
                    ) : p1GearIcon ? (
                      <Text style={{ fontSize: 22 }}>{p1GearIcon}</Text>
                    ) : null}
                    <Text style={styles.gearSquareText} numberOfLines={1} adjustsFontSizeToFit>{p1GearStat}</Text>
                  </View>
                )}
                {Boolean(p1SkillName) && (
                  <TouchableOpacity
                    style={[
                      styles.skillSquare,
                      p1SkillCooldown > 0 && styles.skillSquareUsed,
                      turn === 1 && p1SkillCooldown === 0 && styles.skillSquareActive,
                    ]}
                    activeOpacity={0.8}
                    disabled={turn !== 1 || p1SkillCooldown > 0 || p1SkillName === 'Basic Attack'}
                    onPress={turn === 1 ? activateSkill : undefined}
                  >
                    {p1SkillImage ? (
                      <Image
                        source={p1SkillImage}
                        style={[styles.skillIconLarge, p1SkillCooldown > 0 && styles.skillIconLargeUsed]}
                        resizeMode="contain"
                      />
                    ) : p1SkillIcon ? (
                      <Text style={{ fontSize: 22 }}>{p1SkillIcon}</Text>
                    ) : null}
                    <Text style={[styles.skillSquareText, p1SkillCooldown > 0 && styles.skillSquareTextUsed]} numberOfLines={1} adjustsFontSizeToFit>
                      {p1SkillName}{p1SkillCooldown > 0 ? ` (CD:${p1SkillCooldown})` : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Player 2 - right side */}
          <View style={styles.playerColumnRight}>
            <Sprite action={p2SpriteAction as any} isEnemy characterId={p2Character} />
            <Text style={styles.playerName}>{p2CharInfo.icon} {p2Name}</Text>
            {p2Shield && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/icons/skills/shield.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>SHIELDED</Text>
              </View>
            )}
            {p2Double && (
              <View style={styles.statusBadgeRow}>
                <Image source={require('../assets/icons/skills/double_strike.png')} style={styles.statusBadgeImage} resizeMode="contain" />
                <Text style={styles.statusBadgeLabel}>2X DMG</Text>
              </View>
            )}
            {(Boolean(p2GearStat) || Boolean(p2SkillName)) && (
              <View style={styles.loadoutRow}>
                {Boolean(p2GearStat) && (
                  <View style={styles.gearSquare}>
                    {p2GearImage ? (
                      <Image source={p2GearImage} style={styles.gearIconLarge} resizeMode="contain" />
                    ) : p2GearIcon ? (
                      <Text style={{ fontSize: 22 }}>{p2GearIcon}</Text>
                    ) : null}
                    <Text style={styles.gearSquareText} numberOfLines={1} adjustsFontSizeToFit>{p2GearStat}</Text>
                  </View>
                )}
                {Boolean(p2SkillName) && (
                  <TouchableOpacity
                    style={[
                      styles.skillSquare,
                      p2SkillCooldown > 0 && styles.skillSquareUsed,
                      turn === 2 && p2SkillCooldown === 0 && styles.skillSquareActive,
                    ]}
                    activeOpacity={0.8}
                    disabled={turn !== 2 || p2SkillCooldown > 0 || p2SkillName === 'Basic Attack'}
                    onPress={turn === 2 ? activateSkill : undefined}
                  >
                    {p2SkillImage ? (
                      <Image
                        source={p2SkillImage}
                        style={[styles.skillIconLarge, p2SkillCooldown > 0 && styles.skillIconLargeUsed]}
                        resizeMode="contain"
                      />
                    ) : p2SkillIcon ? (
                      <Text style={{ fontSize: 22 }}>{p2SkillIcon}</Text>
                    ) : null}
                    <Text style={[styles.skillSquareText, p2SkillCooldown > 0 && styles.skillSquareTextUsed]} numberOfLines={1} adjustsFontSizeToFit>
                      {p2SkillName}{p2SkillCooldown > 0 ? ` (CD:${p2SkillCooldown})` : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          <AttackProjectile
            active={attackActive}
            attacker={attacker}
            characterId={p1Character}
            enemyId={p2Character}
            hasDoubleStrike={turn === 1 ? p1Double : p2Double}
            hasShield={turn === 1 ? p2Shield : p1Shield}
            onImpact={handleProjectileImpact}
            onComplete={handleProjectileComplete}
          />
        </View>
      </ImageBackground>

      {currentQ && (
        <View style={[styles.questionPanel, { backgroundColor: levelTheme.panelBg, borderColor: levelTheme.buttonBorder }]}>
          <Text style={[styles.equation, isMedium && styles.equationMedium, isExtraLarge && styles.equationLarge]} adjustsFontSizeToFit numberOfLines={2}>{currentQ.equation}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, idx) => {
              const isCorrect = opt === currentQ.correctAnswer;
              const isWrongPick = opt === selectedOption && !isCorrect;
              return (
                <View key={idx} style={styles.optionWrapper}>
                  <View style={styles.optionShadow} />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    silent={true}
                    style={[
                      styles.optionButton,
                      { backgroundColor: levelTheme.buttonBg, borderColor: levelTheme.buttonBorder },
                      isMedium && styles.optionButtonMedium,
                      isExtraLarge && styles.optionButtonLarge,
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
                        isMedium && styles.optionTextMedium,
                        isExtraLarge && styles.optionTextLarge,
                        isAnswering && (isCorrect || isWrongPick) && styles.optionTextOnColor,
                      ]} adjustsFontSizeToFit numberOfLines={2}
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
                <TouchableOpacity style={styles.btnPrimary} onPress={() => {
                  setShowVictory(false);
                  soundService.stopSound('victory');
                  if (!reviewShown.current) {
                    reviewShown.current = true;
                    setShowReview(true);
                  } else {
                    router.replace('/versus');
                  }
                }}>
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
              <Text style={styles.turnNotificationSubtitle}>{nextPlayerName.toUpperCase()}{"'S TURN!"}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post-game review modal */}
      <ReviewModal
        visible={showReview}
        onDismiss={() => {
          setShowReview(false);
          router.replace('/versus');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },

  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#1a1008', zIndex: 10,
  },
  versusTitle: {
    fontFamily: GameFonts.brawl, fontSize: 18, color: '#ffffff',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    backgroundColor: 'transparent', zIndex: 10,
  },
  topLeft: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
  topRight: {
    flexDirection: 'column', alignItems: 'flex-end', gap: 6,
  },
  pauseBtnPlaceholder: {
    width: 40, height: 40,
  },
  pauseBtn: {
    backgroundColor: '#fff9f0', borderWidth: 2.5, borderColor: '#1a1008',
    borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  pauseIcon: {
    fontFamily: GameFonts.brawl, fontSize: 18, color: '#1a1008', transform: [{ rotate: '90deg' }]
  },
  timerBadgeBox: {
    alignItems: 'center',
  },
  hpHearts: {
    fontFamily: GameFonts.brawl, fontSize: 18,
    textShadowColor: '#1a1008', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
  },
  enemyHpText: {
    fontFamily: GameFonts.arcade, fontSize: 16,
    textShadowColor: '#1a1008', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
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
  timer: {
    fontFamily: GameFonts.arcade, fontSize: 20, color: '#ffffff',
    textShadowColor: '#1a1008', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
  },
  timerDanger: { color: '#e8302a' },
  turnText: {
    fontFamily: GameFonts.brawl, fontSize: 13, color: '#f5a623', marginTop: 2,
    textShadowColor: '#1a1008', textShadowOffset: { width: 1.5, height: 1.5 }, textShadowRadius: 0,
  },
  roundText: {
    fontFamily: GameFonts.arcade, fontSize: 12, color: '#ffffff', marginTop: 2,
    textShadowColor: '#1a1008', textShadowOffset: { width: 1.5, height: 1.5 }, textShadowRadius: 0,
  },

  arena: { flex: 1, position: 'relative', overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 10 },
  playerColumn: { alignItems: 'flex-start', flex: 1 },
  playerColumnRight: { alignItems: 'flex-end', flex: 1 },
  playerName: {
    fontFamily: GameFonts.brawl, marginTop: 4, color: '#ffffff', fontSize: 14, marginBottom: 4, alignSelf: 'center',
    textShadowColor: '#1a1008', textShadowOffset: { width: 1.5, height: 1.5 }, textShadowRadius: 0,
  },
  statusBadge: {
    fontFamily: GameFonts.hud,
    marginTop: 6,
    backgroundColor: '#fff9f0',
    color: '#1a1008',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  gearSquare: {
    width: 52,
    minHeight: 48,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  gearIconLarge: {
    width: 32,
    height: 32,
  },
  gearSquareText: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  skillSquare: {
    width: 52,
    minHeight: 48,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  skillSquareActive: {
    opacity: 1,
  },
  skillSquareUsed: {
    opacity: 0.5,
  },
  skillIconLarge: {
    width: 32,
    height: 32,
  },
  skillIconLargeUsed: {
    opacity: 0.6,
  },
  skillSquareText: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
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
  statusBadgeRow: {
    marginTop: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff9f0', borderWidth: 2, borderColor: '#1a1008', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statusBadgeImage: { width: 16, height: 16 },
  statusBadgeLabel: {
    fontFamily: GameFonts.hud, fontSize: 12, color: '#1a1008'
  },

  questionPanel: {
    height: 340,
    justifyContent: 'center',
    backgroundColor: '#fff9f0', borderTopWidth: 4, borderColor: '#1a1008',
    paddingTop: 20, paddingBottom: 20, paddingHorizontal: 25, borderRadius: 0, alignItems: 'center',
  },
  equation: {
    fontFamily: GameFonts.impact, fontSize: 34, color: '#ffffff', marginVertical: 10, textAlign: 'center'
  },
  equationMedium: {
    fontFamily: GameFonts.impact, fontSize: 40, marginVertical: 15
  },
  equationLarge: {
    fontFamily: GameFonts.impact, fontSize: 44, marginVertical: 15
  },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%', marginTop: 10 },
  optionWrapper: { width: '45%', position: 'relative' },
  optionShadow: { position: 'absolute', top: 5, left: 5, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 0 },
  optionButton: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 0, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  optionButtonMedium: { paddingVertical: 14, minHeight: 64 },
  optionButtonLarge: { paddingVertical: 15, minHeight: 66 },
  optionCorrect: { backgroundColor: '#22c55e', borderColor: '#14532d' },
  optionWrong: { backgroundColor: '#e8302a', borderColor: '#7f1d1d' },
  optionDimmed: { opacity: 0.5 },
  optionText: {
    fontFamily: GameFonts.brawl, fontSize: 20, color: '#ffffff', textAlign: 'center'
  },
  optionTextMedium: {
    fontFamily: GameFonts.brawl, fontSize: 24
  },
  optionTextLarge: {
    fontFamily: GameFonts.brawl, fontSize: 26
  },
  optionTextOnColor: { color: '#fff' },

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
    fontFamily: GameFonts.brawl,
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1008',
    textShadowColor: '#f5a623',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 10,
    letterSpacing: 2
  },
  turnNotificationSubtitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1008',
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
});