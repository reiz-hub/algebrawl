// app/map.tsx
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';

const LEVELS = [
  { id: 1, title: 'Variables & Expressions', questions: 10 },
  { id: 2, title: 'Equations & Inequalities', questions: 20 },
  { id: 3, title: 'Polynomials', questions: 20 },
  { id: 4, title: 'Factoring', questions: 30 },
  { id: 5, title: 'Systems of Equations', questions: 30 },
  { id: 6, title: 'Exponents & Roots', questions: 50 },
  { id: 7, title: 'Random Mode', questions: 100 },
];

export default function MapScreen() {
  const router = useRouter();
  
  // Get both unlocked level and the star data from the store
  const { unlockedLevel, levelStars } = useGameStore();

  return (
    <View style={styles.mainContainer}>
      {/* 1. TOP HEADER WITH BACK BUTTON */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.header}>SELECT LEVEL</Text>
        <View style={{ width: 45 }} /> {/* Spacer to keep title centered */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {LEVELS.map((level) => {
          const isLocked = level.id > unlockedLevel;
          
          // Get stars for this level (default to 0 if not started)
          const starsEarned = levelStars[level.id] || 0;
          
          // Calculate progress bar width based on stars (0/3, 1/3, 2/3, 3/3)
          const progressPercent = (starsEarned / 3) * 100;

          // Create the stars string (e.g., "⭐⭐☆" for 2 stars)
          const starsDisplay = isLocked 
            ? '🔒' 
            : '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);

          return (
            <View key={level.id} style={styles.cardWrapper}>
              <View style={styles.cardShadow} />
              
              <TouchableOpacity
                style={[styles.cardContent, isLocked && styles.lockedCard]}
                disabled={isLocked}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/pre-battle', params: { level: level.id, questions: level.questions } })}
              >
                <View style={styles.cardHeader}>
                   <View style={[styles.badge, isLocked && styles.lockedBadge]}>
                     <Text style={styles.badgeText}>{level.id}</Text>
                   </View>
                </View>

                <View style={styles.cardBody}>
                   <Text style={[styles.titleText, isLocked && styles.lockedText]}>{level.title}</Text>
                   
                   <View style={styles.progressRow}>
                      <View style={styles.progressBarOuter}>
                         {/* Dynamic Width based on earned stars */}
                         <View style={[styles.progressBarInner, { width: `${progressPercent}%` }]} />
                      </View>
                      <Text style={[styles.starsText, starsEarned === 0 && !isLocked && styles.emptyStars]}>
                        {starsDisplay}
                      </Text>
                   </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff9f0' },
  
  // Header with Back Button
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
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

  cardWrapper: { marginBottom: 24, width: '100%', position: 'relative' },
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
  titleText: { fontSize: 18, fontWeight: '900', color: '#1a1008', marginBottom: 8 },
  lockedText: { color: '#7a6a55' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  starsText: { 
    fontSize: 16, 
    letterSpacing: 2,
    color: '#f5a623', 
    fontWeight: 'bold'
  },
  emptyStars: {
    color: '#7a6a55', // Muted color for empty stars
    opacity: 0.5
  }
});