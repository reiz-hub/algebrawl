import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import NeoButton from '../components/NeoButton';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';

const LEVELS = [
  {
    id: 1,
    title: 'Variables & Expressions',
    questions: 10,
    timePerQuestion: 30,
    mapButtonImage: require('../assets/images/map_button/lvl1_mapbutton.png'),
    overview: 'Master the basics of algebra by evaluating algebraic expressions and combining like terms.',
    strategies: [
      {
        title: 'Precise Substitution',
        desc: 'Enclose substituted values in parentheses to prevent sign errors.'
      },
      {
        title: 'Order of Operations',
        desc: 'Strictly adhere to PEMDAS/BODMAS rules.'
      },
      {
        title: 'Like Terms Only',
        desc: 'Only add or subtract terms with identical variables and exponents.'
      }
    ]
  },
  {
    id: 2,
    title: 'Equations & Inequalities',
    questions: 20,
    timePerQuestion: 30,
    mapButtonImage: require('../assets/images/mapbg/orc_bg.png'),
    overview: 'Isolate variables to determine their exact values or operational ranges.',
    strategies: [
      {
        title: 'Algebraic Balance',
        desc: 'Perform the exact same operation on both sides of the relation.'
      },
      {
        title: 'Inverse Operations',
        desc: 'Work backward to isolate the variable (e.g., undo division with multiplication).'
      },
      {
        title: 'The Negative Rule',
        desc: 'Automatically reverse the inequality sign (< to >) whenever multiplying or dividing by a negative number.'
      }
    ]
  },
  {
    id: 3,
    title: 'Polynomials',
    questions: 20,
    timePerQuestion: 60,
    mapButtonImage: require('../assets/images/mapbg/slime_bg.png'),
    overview: 'Execute addition, subtraction, and multiplication across multi-term expressions.',
    strategies: [
      {
        title: 'Vertical Stacking',
        desc: 'Align identical terms vertically to simplify multi-term addition and subtraction.'
      },
      {
        title: 'Total Distribution',
        desc: 'Ensure external terms are multiplied across every internal term within parentheses.'
      },
      {
        title: 'FOIL Method',
        desc: 'Use First, Outer, Inner, Last ordering when multiplying binomials.'
      }
    ]
  },
  {
    id: 4,
    title: 'Factoring',
    questions: 30,
    timePerQuestion: 60,
    mapButtonImage: require('../assets/images/mapbg/knight_bg.png'),
    overview: 'Reverse polynomial multiplication by deconstructing complex expressions into their foundational factors.',
    strategies: [
      {
        title: 'GCF Priority',
        desc: 'Always extract the Greatest Common Factor before applying other methods.'
      },
      {
        title: 'Pattern Recognition',
        desc: 'Identify special products instantly, such as the Difference of Squares:\na² - b² = (a + b)(a - b)'
      },
      {
        title: 'Verification',
        desc: 'Re-multiply your factors to ensure they return to the original expression.'
      }
    ]
  },
  {
    id: 5,
    title: 'Systems of Equations',
    questions: 30,
    timePerQuestion: 60,
    overview: 'Solve for two unknown variables simultaneously by locating their single point of intersection.',
    strategies: [
      {
        title: 'Strategic Selection',
        desc: 'Choose Substitution if a variable is already isolated, or Elimination if variables are aligned vertically.'
      },
      {
        title: 'Double Verification',
        desc: 'Validate your final coordinates by plugging them back into both original equations.'
      }
    ]
  },
  {
    id: 6,
    title: 'Exponents & Roots',
    questions: 50,
    timePerQuestion: 60,
    overview: 'Simplify advanced expressions by manipulating exponential bases and radicals.',
    strategies: [
      {
        title: 'Exponent Laws',
        desc: 'Apply core operational rules (add exponents for multiplication, subtract for division, multiply for powers).'
      },
      {
        title: 'Inverses & Identities',
        desc: 'Remember that any non-zero base to the power of 0 equals 1, and negative exponents shift terms to the denominator.'
      },
      {
        title: 'Fractional Powers',
        desc: 'Treat fractional exponents as radical operations (e.g., an exponent of 1/2 denotes a square root).'
      }
    ]
  },
  {
    id: 7,
    title: 'Random Mode',
    questions: 105,
    timePerQuestion: 25,
    overview: 'An ultimate, randomized endurance test spanning all previous algebraic concepts. Choose your difficulty and face the Boss!',
    strategies: [
      {
        title: 'Concept Diagnosis',
        desc: 'Pause to categorize the problem type before selecting an operational strategy.'
      },
      {
        title: 'Pacing & Precision',
        desc: 'Maintain focus across a long series; double-check signs and arithmetic fundamentals to avoid unforced errors.'
      }
    ]
  }
];

export default function MapScreen() {
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

  return (
    <View style={styles.mainContainer}>
      <Text style={[styles.bgSymbol, { top: '5%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '25%', right: '15%', transform: [{ rotate: '20deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', left: '20%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '5%', right: '10%', transform: [{ rotate: '10deg' }] }]}>÷</Text>

      <View style={styles.headerRow}>
        <NeoButton
          style={styles.backBtn as ViewStyle}
          shadowStyle={{ borderRadius: 23 }}
          wrapperStyle={{ width: 45 }}
          onPress={() => router.replace('/')}
        >
          <Feather name="arrow-left" size={24} color="#1a1008" />
        </NeoButton>
        <Text style={styles.header}>SELECT LEVEL</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {LEVELS.map((level, index) => {
          const isLocked = level.id > unlockedLevel;

          const scoreEarned = levelStars[level.id] || 0;
          const progressPercent = (scoreEarned / level.questions) * 100;

          const scoreDisplay = isLocked
            ? '🔒'
            : `${scoreEarned}/${level.questions}`;

          const isPerfect = scoreEarned === level.questions;
          const hasScore = scoreEarned > 0;

          const staggerAlignment = (index % 2 === 0) ? { alignSelf: 'flex-start' as const } : { alignSelf: 'flex-end' as const };

          const hasBg = !!level.mapButtonImage && !isLocked;

          const cardChildren = (
            <>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, isLocked && styles.lockedBadge, hasBg && styles.badgeNoBg]}>
                  <Text style={[styles.badgeText, hasBg && styles.badgeTextOnBg]}>{level.id}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text
                  style={[styles.titleText, isLocked && styles.lockedText, hasBg && styles.textOnBg]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {level.title}
                </Text>

                <View style={styles.progressRow}>
                  <View style={styles.progressBarOuter}>
                    <View style={[
                      styles.progressBarInner,
                      { width: `${progressPercent}%` },
                      isPerfect && styles.progressBarPerfect,
                    ]} />
                  </View>
                  <Text style={[
                    styles.scoreText,
                    hasBg && styles.textOnBg,
                    !hasScore && !isLocked && styles.emptyScore,
                    !hasScore && hasBg && styles.emptyScoreOnBg,
                    isPerfect && styles.perfectScore,
                    isLocked && styles.lockedScore,
                  ]}>
                    {scoreDisplay}
                  </Text>
                </View>
              </View>

              <NeoButton
                wrapperStyle={styles.helpButtonWrapper}
                shadowStyle={{ backgroundColor: '#1a1008', borderRadius: 14, position: 'absolute', top: 2, left: 2, width: '100%', height: '100%' }}
                style={styles.helpButton as ViewStyle}
                onPress={() => openInstruction(level)}
              >
                <Text style={styles.helpButtonText}>?</Text>
              </NeoButton>
            </>
          );

          return (
            <NeoButton
              key={level.id}
              wrapperStyle={[styles.cardWrapper, staggerAlignment]}
              shadowStyle={styles.cardShadow}
              style={[
                styles.cardContent,
                level.mapButtonImage && styles.cardContentWithBg,
                isLocked && styles.lockedCard,
              ] as ViewStyle[]}
              disabled={isLocked}
              onPress={() => {
                if (level.id === 7) {
                  setIsDifficultyVisible(true);
                } else {
                  router.push({
                    pathname: '/pre-battle',
                    params: {
                      level: level.id,
                      questions: level.questions,
                      timePerQuestion: level.timePerQuestion
                    }
                  });
                }
              }}
            >
              {level.mapButtonImage ? (
                <ImageBackground
                  source={level.mapButtonImage}
                  style={styles.cardBgFill}
                  resizeMode="stretch"
                >
                  {cardChildren}
                </ImageBackground>
              ) : (
                cardChildren
              )}
            </NeoButton>
          );
        })}
      </ScrollView>

      <Modal
        visible={isInstructionVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInstruction}
      >
        <Pressable style={styles.modalOverlay} onPress={closeInstruction}>
          <Pressable style={styles.modalCard} onPress={() => { }}>
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
              shadowStyle={{ backgroundColor: '#1a1008', borderRadius: 12, position: 'absolute', top: 3, left: 3, width: '100%', height: '100%' }}
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
          <Pressable style={styles.difficultyModalCard} onPress={() => { }}>
            <Text style={styles.modalTitle}>CHOOSE DIFFICULTY</Text>
            <Text style={styles.difficultySubtitle}>Random Mode — Level 7</Text>

            {[
              { key: 'easy' as const, label: 'EASY', questions: 35, desc: '30 Questions + Boss', color: '#22c55e', icon: '🌿' },
              { key: 'medium' as const, label: 'MEDIUM', questions: 65, desc: '60 Questions + Boss', color: '#f5a623', icon: '🔥' },
              { key: 'hard' as const, label: 'HARD', questions: 105, desc: '100 Questions + Boss', color: '#e8302a', icon: '💀' },
            ].map((diff) => (
              <NeoButton
                key={diff.key}
                style={[styles.difficultyBtn, { backgroundColor: diff.color }] as ViewStyle[]}
                shadowStyle={{ backgroundColor: '#1a1008', borderRadius: 12, position: 'absolute', top: 4, left: 4, width: '100%', height: '100%' }}
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
                    }
                  });
                }}
              >
                <View style={styles.difficultyBtnInner}>
                  <Text style={styles.difficultyBtnIcon}>{diff.icon}</Text>
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
              shadowStyle={{ backgroundColor: '#1a1008', borderRadius: 12, position: 'absolute', top: 3, left: 3, width: '100%', height: '100%' }}
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
    zIndex: 0
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 10,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: GameFonts.brawl, fontSize: 22, color: '#1a1008'
  },
  header: {
    fontFamily: GameFonts.brawl,
    fontSize: 22,
    color: '#1a1008',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  scrollContainer: { padding: 24, paddingBottom: 50 },
  cardWrapper: { marginBottom: 24, width: '85%', position: 'relative' },
  cardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16
  },
  cardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardContentWithBg: {
    padding: 0,
  },
  cardBgFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  lockedCard: { backgroundColor: '#f0eade', opacity: 0.8 },
  cardHeader: { marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: { backgroundColor: '#7a6a55' },
  badgeNoBg: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeText: {
    fontFamily: GameFonts.arcade, fontSize: 18, color: '#fff'
  },
  badgeTextOnBg: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  cardBody: { flex: 1, justifyContent: 'center' },
  titleText: {
    fontFamily: GameFonts.brawl, fontSize: 15, color: '#1a1008', marginBottom: 8, lineHeight: 18
  },

  textOnBg: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  lockedText: { color: '#7a6a55' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  progressBarOuter: {
    flex: 1,
    height: 14,
    backgroundColor: '#e5d9c4',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1008',
    marginRight: 10,
    overflow: 'hidden'
  },
  progressBarInner: { height: '100%', backgroundColor: '#22c55e' },
  progressBarPerfect: { backgroundColor: '#f5a623' },
  scoreText: {
    fontFamily: GameFonts.arcade,
    fontSize: 12,
    color: '#22c55e',
    minWidth: 52,
    textAlign: 'right',
  },
  emptyScore: {
    color: '#7a6a55',
    opacity: 0.5,
  },
  emptyScoreOnBg: {
    color: '#ffffff',
    opacity: 0.7,
  },

  perfectScore: {
    color: '#f5a623',
  },
  lockedScore: {
    fontFamily: GameFonts.arcade,
    color: '#7a6a55',
    fontSize: 12,
  },
  helpButtonWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 28,
    height: 28,
  },
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 14,
    lineHeight: 17,
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
  difficultyBtnIcon: {
    fontSize: 24,
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