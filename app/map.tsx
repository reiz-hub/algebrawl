import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import NeoButton from '../components/NeoButton';
import { useGameStore } from '../hooks/useGameStore';

const LEVELS = [
  {
    id: 1,
    title: 'Variables & Expressions',
    questions: 10,
    timePerQuestion: 30,
    instruction: 'Learn how to simplify expressions and evaluate variables using basic algebra rules.',
  },
  {
    id: 2,
    title: 'Equations & Inequalities',
    questions: 20,
    timePerQuestion: 30,
    instruction: 'Solve one-step and multi-step equations, then compare values with inequality symbols.',
  },
  {
    id: 3,
    title: 'Polynomials',
    questions: 20,
    timePerQuestion: 60,
    instruction: 'Practice adding, subtracting, and multiplying polynomial terms with confidence.',
  },
  {
    id: 4,
    title: 'Factoring',
    questions: 30,
    timePerQuestion: 60,
    instruction: 'Break expressions into factors using common factors and special factoring patterns.',
  },
  {
    id: 5,
    title: 'Systems of Equations',
    questions: 30,
    timePerQuestion: 60,
    instruction: 'Find where equations meet by solving systems with substitution and elimination.',
  },
  {
    id: 6,
    title: 'Exponents & Roots',
    questions: 50,
    timePerQuestion: 60,
    instruction: 'Master exponent laws, square roots, and how powers relate to radical expressions.',
  },
  {
    id: 7,
    title: 'Random Mode',
    questions: 100,
    timePerQuestion: 25,
    instruction: 'A mixed challenge of every topic. Survive the gauntlet and test full algebra mastery.',
  },
];

export default function MapScreen() {
  const router = useRouter();
  const [selectedInstruction, setSelectedInstruction] = useState<{ title: string; text: string } | null>(null);
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);

  const { unlockedLevel, levelStars } = useGameStore();

  const openInstruction = (title: string, instruction: string) => {
    setSelectedInstruction({ title, text: instruction });
    setIsInstructionVisible(true);
  };

  const closeInstruction = () => {
    setIsInstructionVisible(false);
    setSelectedInstruction(null);
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

          return (
            <NeoButton
              key={level.id}
              wrapperStyle={[styles.cardWrapper, staggerAlignment]}
              shadowStyle={styles.cardShadow}
              style={[styles.cardContent, isLocked && styles.lockedCard] as ViewStyle[]}
              disabled={isLocked}
              onPress={() => router.push({
                pathname: '/pre-battle',
                params: {
                  level: level.id,
                  questions: level.questions,
                  timePerQuestion: level.timePerQuestion
                }
              })}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, isLocked && styles.lockedBadge]}>
                  <Text style={styles.badgeText}>{level.id}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text 
                  style={[styles.titleText, isLocked && styles.lockedText]}
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
                    !hasScore && !isLocked && styles.emptyScore,
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
                  onPress={() => openInstruction(level.title, level.instruction)}
                >
                  <Text style={styles.helpButtonText}>?</Text>
                </NeoButton>
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
              {selectedInstruction ? selectedInstruction.title : 'LEVEL INFO'}
            </Text>
            <Text style={styles.modalBodyText}>
              {selectedInstruction ? selectedInstruction.text : ''}
            </Text>
            <NeoButton 
              style={styles.modalButton as ViewStyle} 
              shadowStyle={{ backgroundColor: '#1a1008', borderRadius: 12, position: 'absolute', top: 3, left: 3, width: '100%', height: '100%' }}
              wrapperStyle={{ alignSelf: 'flex-end', marginTop: 10, width: 100 }}
              onPress={closeInstruction}
            >
              <Text style={styles.modalButtonText}>GOT IT</Text>
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
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
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
  backBtnText: { fontSize: 24, fontWeight: '900', color: '#1a1008' },
  header: {
    fontSize: 28,
    color: '#1a1008',
    fontWeight: '900',
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
  badgeText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cardBody: { flex: 1, justifyContent: 'center' },
  titleText: { fontSize: 15, fontWeight: '900', color: '#1a1008', marginBottom: 8, lineHeight: 18 },
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
    fontSize: 15,
    fontWeight: '900',
    color: '#22c55e',
    minWidth: 52,
    textAlign: 'right',
  },
  emptyScore: {
    color: '#7a6a55',
    opacity: 0.5,
  },
  perfectScore: {
    color: '#f5a623',
  },
  lockedScore: {
    color: '#7a6a55',
    fontSize: 16,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
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
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1008',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  modalBodyText: {
    fontSize: 15,
    color: '#1a1008',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});