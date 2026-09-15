import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import NeoButton from '../NeoButton';
import { GameFonts } from '../../constants/theme';
import { useGameStore } from '../../hooks/useGameStore';

const LEVELS = [
  {
    id: 1,
    title: 'Variables & Expressions',
    questions: 10,
    timePerQuestion: 30,
    mapButtonImage: require('../../assets/images/map_button/lvl1_mapbutton.png'),
    overview: 'Master the basics of algebra by evaluating algebraic expressions and combining like terms.',
    strategies: [
      {
        title: 'Precise Substitution',
        desc: 'Enclose substituted values in parentheses to prevent sign errors.',
      },
      {
        title: 'Order of Operations',
        desc: 'Strictly adhere to PEMDAS/BODMAS rules.',
      },
      {
        title: 'Like Terms Only',
        desc: 'Only add or subtract terms with identical variables and exponents.',
      },
    ],
  },
  {
    id: 2,
    title: 'Equations & Inequalities',
    questions: 20,
    timePerQuestion: 30,
    mapButtonImage: require('../../assets/images/map_button/orc_mapbutton.png'),
    overview: 'Isolate variables to determine their exact values or operational ranges.',
    strategies: [
      {
        title: 'Algebraic Balance',
        desc: 'Perform the exact same operation on both sides of the relation.',
      },
      {
        title: 'Inverse Operations',
        desc: 'Work backward to isolate the variable (e.g., undo division with multiplication).',
      },
      {
        title: 'The Negative Rule',
        desc: 'Automatically reverse the inequality sign (< to >) whenever multiplying or dividing by a negative number.',
      },
    ],
  },
  {
    id: 3,
    title: 'Polynomials',
    questions: 20,
    timePerQuestion: 60,
    mapButtonImage: require('../../assets/images/map_button/slime_mapbutton.png'),
    overview: 'Execute addition, subtraction, and multiplication across multi-term expressions.',
    strategies: [
      {
        title: 'Vertical Stacking',
        desc: 'Align identical terms vertically to simplify multi-term addition and subtraction.',
      },
      {
        title: 'Total Distribution',
        desc: 'Ensure external terms are multiplied across every internal term within parentheses.',
      },
      {
        title: 'FOIL Method',
        desc: 'Use First, Outer, Inner, Last ordering when multiplying binomials.',
      },
    ],
  },
  {
    id: 4,
    title: 'Factoring',
    questions: 30,
    timePerQuestion: 60,
    mapButtonImage: require('../../assets/images/map_button/knight_mapbutton.png'),
    overview: 'Reverse polynomial multiplication by deconstructing complex expressions into their foundational factors.',
    strategies: [
      {
        title: 'GCF Priority',
        desc: 'Always extract the Greatest Common Factor before applying other methods.',
      },
      {
        title: 'Pattern Recognition',
        desc: 'Identify special products instantly, such as the Difference of Squares:\na\u00B2 - b\u00B2 = (a + b)(a - b)',
      },
      {
        title: 'Verification',
        desc: 'Re-multiply your factors to ensure they return to the original expression.',
      },
    ],
  },
  {
    id: 5,
    title: 'Systems of Equations',
    questions: 30,
    timePerQuestion: 60,
    mapButtonImage: require('../../assets/images/map_button/mummy_mapbutton.png'),
    overview: 'Solve for two unknown variables simultaneously by locating their single point of intersection.',
    strategies: [
      {
        title: 'Strategic Selection',
        desc: 'Choose Substitution if a variable is already isolated, or Elimination if variables are aligned vertically.',
      },
      {
        title: 'Double Verification',
        desc: 'Validate your final coordinates by plugging them back into both original equations.',
      },
    ],
  },
  {
    id: 6,
    title: 'Exponents & Roots',
    questions: 50,
    timePerQuestion: 60,
    mapButtonImage: require('../../assets/images/map_button/golem_mapbutton.png'),
    overview: 'Simplify advanced expressions by manipulating exponential bases and radicals.',
    strategies: [
      {
        title: 'Exponent Laws',
        desc: 'Apply core operational rules (add exponents for multiplication, subtract for division, multiply for powers).',
      },
      {
        title: 'Inverses & Identities',
        desc: 'Remember that any non-zero base to the power of 0 equals 1, and negative exponents shift terms to the denominator.',
      },
      {
        title: 'Fractional Powers',
        desc: 'Treat fractional exponents as radical operations (e.g., an exponent of 1/2 denotes a square root).',
      },
    ],
  },
  {
    id: 7,
    title: 'Random Mode',
    questions: 105,
    timePerQuestion: 25,
    mapButtonImage: require('../../assets/images/map_button/inferno_mapbutton.png'),
    overview: 'An ultimate, randomized endurance test spanning all previous algebraic concepts. Choose your difficulty and face the Boss!',
    strategies: [
      {
        title: 'Concept Diagnosis',
        desc: 'Pause to categorize the problem type before selecting an operational strategy.',
      },
      {
        title: 'Pacing & Precision',
        desc: 'Maintain focus across a long series; double-check signs and arithmetic fundamentals to avoid unforced errors.',
      },
    ],
  },
];

export default function AdventureView() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[number] | null>(null);
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);
  const [isDifficultyVisible, setIsDifficultyVisible] = useState(false);

  const { unlockedLevel, levelStars } = useGameStore();

  const openInstruction = (level: typeof LEVELS[number]) => {
    setSelectedLevel(level);
    setIsInstructionVisible(true);
  };

  const closeInstruction = () => {
    setIsInstructionVisible(false);
    setSelectedLevel(null);
  };

  const handleLevelPress = (level: typeof LEVELS[number]) => {
    if (level.id === 7) {
      setIsDifficultyVisible(true);
    } else {
      router.push({
        pathname: '/pre-battle',
        params: {
          level: level.id,
          questions: level.questions,
          timePerQuestion: level.timePerQuestion,
        },
      });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={[styles.bgSymbol, { top: '5%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '25%', right: '15%', transform: [{ rotate: '20deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', left: '20%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '5%', right: '10%', transform: [{ rotate: '10deg' }] }]}>÷</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {LEVELS.map((level) => {
          const isLocked = level.id > unlockedLevel;
          const scoreEarned = levelStars[level.id] || 0;
          const progressPercent = Math.min((scoreEarned / level.questions) * 100, 100);
          const isPerfect = scoreEarned >= level.questions;

          return (
            <NeoButton
              key={level.id}
              wrapperStyle={styles.cardWrapper}
              shadowStyle={styles.cardShadow}
              style={styles.cardContent}
              disabled={isLocked}
              disabledOpacity={1}
              onPress={() => handleLevelPress(level)}
            >
              <ImageBackground
                source={level.mapButtonImage}
                style={styles.cardBgImage}
                resizeMode="cover"
              >
                {isLocked ? (
                  <>
                    {/* Darkened overlay for locked banner */}
                    <View style={styles.lockedOverlay} />

                    {/* Top Row: Level indicator & Title */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.lockedBadgePill}>
                        <Text style={styles.lockedBadgeText}>LEVEL {level.id}</Text>
                      </View>

                      <Text style={[styles.cardTitleText, styles.lockedTitleText]} numberOfLines={1}>
                        {level.title}
                      </Text>
                    </View>

                    {/* Question Mark Button on the very edge */}
                    <NeoButton
                      wrapperStyle={styles.helpButtonWrapper}
                      shadowStyle={styles.helpButtonShadow}
                      style={styles.helpButton}
                      onPress={() => openInstruction(level)}
                    >
                      <Text style={styles.helpButtonText}>?</Text>
                    </NeoButton>

                    {/* Centered Locked Banner UX matching inspo */}
                    <View style={styles.lockedCenterContent}>
                      <Image
                        source={require('../../assets/icons/UI_icons/lock.png')}
                        style={styles.lockedPadlockImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.lockedPromptText}>
                        COMPLETE LEVEL {level.id - 1} TO UNLOCK
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Top Row: Campaign Title (no scrim, fully bright map) */}
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }} />
                      <Text style={styles.cardTitleText} numberOfLines={2}>
                        {level.title}
                      </Text>
                    </View>

                    {/* Question Mark Button on the very edge */}
                    <NeoButton
                      wrapperStyle={styles.helpButtonWrapper}
                      shadowStyle={styles.helpButtonShadow}
                      style={styles.helpButton}
                      onPress={() => openInstruction(level)}
                    >
                      <Text style={styles.helpButtonText}>?</Text>
                    </NeoButton>

                    {/* Bottom Left Score: bold numbers without background */}
                    <View style={styles.bottomScoreContainer}>
                      <Text style={[styles.bottomScoreText, isPerfect && styles.bottomScorePerfect]}>
                        {scoreEarned} / {level.questions}
                      </Text>
                    </View>

                    {/* Bottom Progress Bar */}
                    <View style={styles.cardBottomBar}>
                      <View
                        style={[
                          styles.cardBottomProgress,
                          { width: `${progressPercent}%` },
                          isPerfect && styles.cardBottomProgressPerfect,
                        ]}
                      />
                    </View>
                  </>
                )}
              </ImageBackground>
            </NeoButton>
          );
        })}
      </ScrollView>

      {/* LEVEL INFO MODAL */}
      <Modal
        visible={isInstructionVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInstruction}
      >
        <Pressable style={styles.modalOverlay} onPress={closeInstruction}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {selectedLevel ? selectedLevel.title : 'LEVEL INFO'}
            </Text>

            {selectedLevel && (
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Quest Info Container */}
                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>QUESTS</Text>
                    <Text style={styles.modalInfoValue}>{selectedLevel.questions} Qs</Text>
                  </View>
                  <View style={styles.modalInfoDivider} />
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>TIME LIMIT</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedLevel.id === 7 ? 'Dynamic' : `${selectedLevel.timePerQuestion}s / Q`}
                    </Text>
                  </View>
                </View>

                {/* Overview */}
                <Text style={styles.sectionSubHeader}>OVERVIEW</Text>
                <Text style={styles.modalOverviewText}>{selectedLevel.overview}</Text>

                {/* Core Strategies */}
                <Text style={styles.sectionSubHeader}>CORE STRATEGIES</Text>
                {selectedLevel.strategies.map((strat, idx) => (
                  <View key={idx} style={styles.strategyRow}>
                    <Text style={styles.strategyBullet}>•</Text>
                    <View style={styles.strategyTextContainer}>
                      <Text style={styles.strategyTitle}>{strat.title}</Text>
                      <Text style={styles.strategyDesc}>{strat.desc}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <NeoButton
              style={styles.modalButton as ViewStyle}
              shadowStyle={{
                backgroundColor: '#1a1008',
                borderRadius: 12,
                position: 'absolute',
                top: 3,
                left: 3,
                width: '100%',
                height: '100%',
              }}
              wrapperStyle={{ alignSelf: 'stretch', marginTop: 10 }}
              onPress={closeInstruction}
            >
              <Text style={styles.modalButtonText}>GOT IT</Text>
            </NeoButton>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DIFFICULTY SELECTION MODAL (Level 7) */}
      <Modal
        visible={isDifficultyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDifficultyVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsDifficultyVisible(false)}>
          <Pressable style={styles.difficultyModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>CHOOSE DIFFICULTY</Text>
            <Text style={styles.difficultySubtitle}>Random Mode — Level 7</Text>

            {[
              { key: 'easy' as const, label: 'EASY', questions: 35, desc: '30 Questions + Boss', color: '#22c55e', icon: require('../../assets/icons/UI_icons/easy.png') },
              { key: 'medium' as const, label: 'MEDIUM', questions: 65, desc: '60 Questions + Boss', color: '#f5a623', icon: require('../../assets/icons/UI_icons/medium.png') },
              { key: 'hard' as const, label: 'HARD', questions: 105, desc: '100 Questions + Boss', color: '#e8302a', icon: require('../../assets/icons/UI_icons/hard.png') },
            ].map((diff) => (
              <NeoButton
                key={diff.key}
                style={[styles.difficultyBtn, { backgroundColor: diff.color }] as ViewStyle[]}
                shadowStyle={{
                  backgroundColor: '#1a1008',
                  borderRadius: 12,
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  width: '100%',
                  height: '100%',
                }}
                wrapperStyle={{ alignSelf: 'stretch', marginBottom: 12 }}
                onPress={() => {
                  setIsDifficultyVisible(false);
                  router.push({
                    pathname: '/pre-battle',
                    params: {
                      level: 7,
                      questions: diff.questions,
                      timePerQuestion: 25,
                      difficulty: diff.key,
                    },
                  });
                }}
              >
                <View style={styles.difficultyBtnInner}>
                  <Image source={diff.icon} style={styles.difficultyBtnImage} resizeMode="contain" />
                  <View style={styles.difficultyBtnText}>
                    <Text style={styles.difficultyBtnLabel}>{diff.label}</Text>
                    <Text style={styles.difficultyBtnDesc}>{diff.desc}</Text>
                  </View>
                  <Text style={styles.difficultyBtnQs}>{diff.questions}Q</Text>
                </View>
              </NeoButton>
            ))}

            <NeoButton
              style={styles.modalButton as ViewStyle}
              shadowStyle={{
                backgroundColor: '#1a1008',
                borderRadius: 12,
                position: 'absolute',
                top: 3,
                left: 3,
                width: '100%',
                height: '100%',
              }}
              wrapperStyle={{ alignSelf: 'stretch', marginTop: 4 }}
              onPress={() => setIsDifficultyVisible(false)}
            >
              <Text style={styles.modalButtonText}>CANCEL</Text>
            </NeoButton>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff9f0', position: 'relative' },
  bgSymbol: {
    fontFamily: GameFonts.jungle,
    position: 'absolute',
    fontSize: 60,
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 0,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  cardWrapper: {
    marginBottom: 18,
    width: '100%',
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  cardContent: {
    height: 155,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    backgroundColor: '#1a1008',
    position: 'relative',
    overflow: 'hidden',
  },
  cardBgImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 46,
    paddingTop: 8,
    zIndex: 20,
    elevation: 20,
  },
  bottomScoreContainer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    zIndex: 10,
  },
  bottomScoreText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
  },
  bottomScorePerfect: {
    color: '#f5a623',
  },
  cardTitleText: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
    flexShrink: 1,
    marginLeft: 8,
  },
  helpButtonWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 25,
    elevation: 25,
    width: 30,
    height: 30,
  },
  helpButtonShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 15,
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 26,
    elevation: 26,
  },
  helpButtonText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 14,
    lineHeight: 17,
  },
  cardBottomBar: {
    height: 5,
    width: '100%',
    backgroundColor: 'rgba(26, 16, 8, 0.65)',
    borderTopWidth: 1,
    borderTopColor: '#1a1008',
  },
  cardBottomProgress: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  cardBottomProgressPerfect: {
    backgroundColor: '#f5a623',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 14, 10, 0.85)',
    zIndex: 1,
    elevation: 1,
  },
  lockedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 16, 8, 0.9)',
    borderWidth: 1.5,
    borderColor: '#5a4938',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 25,
    elevation: 25,
  },
  lockedBadgeText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#fff9f0',
    letterSpacing: 0.5,
  },
  lockedTitleText: {
    color: '#ffffff',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
  },
  lockedCenterContent: {
    position: 'absolute',
    top: 36,
    left: 12,
    right: 12,
    bottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
    gap: 6,
  },
  lockedPromptText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#ffdf7a',
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    zIndex: 25,
    elevation: 25,
  },
  lockedPadlockImage: {
    width: 52,
    height: 52,
    zIndex: 25,
    elevation: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  modalScrollView: {
    marginVertical: 12,
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  modalInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalInfoValue: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  modalInfoDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#1a1008',
    marginHorizontal: 8,
  },
  sectionSubHeader: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a6cf5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },
  modalOverviewText: {
    fontFamily: GameFonts.hud,
    fontSize: 14,
    color: '#1a1008',
    lineHeight: 20,
    marginBottom: 12,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  strategyBullet: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a6cf5',
    marginRight: 6,
    lineHeight: 18,
  },
  strategyTextContainer: {
    flex: 1,
  },
  strategyTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
    marginBottom: 2,
  },
  strategyDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyModalCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  difficultySubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  difficultyBtn: {
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  difficultyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBtnImage: {
    width: 36,
    height: 36,
  },
  difficultyBtnText: {
    flex: 1,
  },
  difficultyBtnLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  difficultyBtnDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  difficultyBtnQs: {
    fontFamily: GameFonts.arcade,
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
