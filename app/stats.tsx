// app/stats.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';

const LEVELS = [
  { id: 1, name: 'Variables', questions: 10 },
  { id: 2, name: 'Equations', questions: 20 },
  { id: 3, name: 'Polynomials', questions: 20 },
  { id: 4, name: 'Factoring', questions: 30 },
  { id: 5, name: 'Systems', questions: 30 },
  { id: 6, name: 'Exponents', questions: 50 },
  { id: 7, name: 'Random', questions: 100 },
];

// Updated practical gears
const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', unlockLevel: 7 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', unlockLevel: 6 },
];

export default function PlayerStatsScreen() {
  const router = useRouter();
  
  // Pull the new stats from the store
  const { 
    unlockedLevel, totalXP, totalBattlesWon, 
    totalBattles, maxStreak, levelStars 
  } = useGameStore();

  const xpProgress = totalXP % 100;
  const playerRank = unlockedLevel >= 5 ? 'Mathlete' : 'Novice';

  // Calculate Win Rate safely (prevent dividing by 0)
  const safeTotalBattles = totalBattles || 0;
  const winRate = safeTotalBattles > 0 ? Math.round((totalBattlesWon / safeTotalBattles) * 100) : 0;
  const safeMaxStreak = maxStreak || 0;

  const achievements = [
    { id: 1, icon: '🎯', title: 'First Blood', desc: 'Win your first battle', done: totalBattlesWon >= 1 },
    { id: 2, icon: '🔥', title: 'On Fire', desc: '5 streak in one battle', done: safeMaxStreak >= 5 },
    { id: 3, icon: '👑', title: 'Undefeated', desc: 'Win 5 battles total', done: totalBattlesWon >= 5 },
    { id: 4, icon: '💀', title: 'Boss Slayer', desc: 'Defeat the Math Overlord', done: !!levelStars[7] },
    { id: 5, icon: '⚡', title: 'Speed Demon', desc: 'Answer in under 5 seconds', done: false },
    { id: 6, icon: '💎', title: 'Perfectionist', desc: 'Perfect score on all levels', done: LEVELS.every(lvl => (levelStars[lvl.id] || 0) === lvl.questions) },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PLAYER PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PLAYER CARD */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarBox}>
                <Image
                  source={require('../assets/images/sprites/hero_win.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.playerName}>ALGEBRAWLER</Text>
                <View style={styles.rankBadge}><Text style={styles.rankText}>{playerRank}</Text></View>
              </View>
            </View>
            <Text style={styles.statLabel}>LEVEL {unlockedLevel}</Text>
            <View style={styles.xpBarOuter}><View style={[styles.xpBarInner, { width: `${xpProgress}%` }]} /></View>
          </View>
        </View>

        {/* EQUIPMENT & SKILLS */}
        <View style={styles.row}>
            <View style={{flex: 1}}>
                <Text style={styles.sectionHeader}>EQUIPMENT</Text>
                <View style={styles.gearRow}>
                    {GEARS.filter((gear) => unlockedLevel >= gear.unlockLevel).map((gear) => (
                      <View key={gear.id} style={styles.iconBox}>
                        <Text style={styles.gearIcon}>{gear.icon}</Text>
                      </View>
                    ))}
                </View>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.sectionHeader}>SKILLS</Text>
                <View style={styles.gearRow}>
                    {SKILLS.filter((skill) => unlockedLevel >= skill.unlockLevel).map((skill) => (
                      <View key={skill.id} style={[styles.iconBox, {backgroundColor: '#fef3c7'}]}>
                        <Text style={styles.gearIcon}>{skill.icon}</Text>
                      </View>
                    ))}
                </View>
            </View>
        </View>

        {/* BATTLE STATS */}
        <Text style={styles.sectionHeader}>BATTLE STATS</Text>
        <View style={styles.battleStatsCard}>
          <View style={styles.battleGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>TOTAL BATTLES</Text>
              <Text style={styles.gridValue}>{safeTotalBattles}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>BATTLES WON</Text>
              <Text style={styles.gridValue}>{totalBattlesWon}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>WIN RATE</Text>
              <Text style={styles.gridValue}>{winRate}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>MAX STREAK</Text>
              <Text style={styles.gridValue}>{safeMaxStreak}</Text>
            </View>
          </View>
        </View>

        {/* LEVEL PROGRESS SECTION */}
        <Text style={styles.sectionHeader}>LEVEL PROGRESS</Text>
        <View style={styles.progressCard}>
          {LEVELS.map((lvl) => {
            const scoreEarned = levelStars[lvl.id] || 0;
            const isLocked = lvl.id > unlockedLevel;
            const progressPercent = isLocked ? 0 : (scoreEarned / lvl.questions) * 100;
            const isPerfect = scoreEarned === lvl.questions;
            const scoreDisplay = isLocked ? '🔒' : `${scoreEarned}/${lvl.questions}`;

            return (
              <View key={lvl.id} style={[styles.levelProgressRow, isLocked && { opacity: 0.4 }]}>
                <Text style={styles.levelNameText}>{lvl.name}</Text>
                <View style={styles.levelBarOuter}>
                  <View style={[
                    styles.levelBarInner,
                    { width: `${progressPercent}%` },
                    isPerfect && styles.levelBarPerfect,
                  ]} />
                </View>
                <Text style={[
                  styles.scoreText,
                  isPerfect && styles.scoreTextPerfect,
                  isLocked && styles.scoreTextLocked,
                ]}>
                  {scoreDisplay}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionHeader}>🏅 ACHIEVEMENTS</Text>
        {achievements.map((ach) => (
          <View key={ach.id} style={[styles.achRow, !ach.done && { opacity: 0.5 }]}>
            <Text style={styles.achNum}>{ach.id}</Text>
            <View style={styles.achIconBox}><Text style={{fontSize: 24}}>{ach.icon}</Text></View>
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.desc}</Text>
            </View>
            <Text style={{fontSize: 18}}>{ach.done ? '✅' : '🔒'}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  backBtnText: { fontSize: 20, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1008' },
  scrollContent: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '900', color: '#1a1008', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  
  card: { marginBottom: 15 },
  cardShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  cardInner: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  avatarRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  avatarBox: { width: 80, height: 80, backgroundColor: '#1a6cf5', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 64, height: 64 },
  profileInfo: { flex: 1, justifyContent: 'center' },
  playerName: { fontSize: 20, fontWeight: '900' },
  rankBadge: { backgroundColor: '#1a6cf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  rankText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  
  statLabel: { fontSize: 12, fontWeight: '900', color: '#7a6a55' },
  xpBarOuter: { height: 12, backgroundColor: '#e5d9c4', borderRadius: 6, borderWidth: 2, borderColor: '#1a1008', marginTop: 4, overflow: 'hidden' },
  xpBarInner: { height: '100%', backgroundColor: '#22c55e' },

  row: { flexDirection: 'row', gap: 20 },
  gearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBox: { width: 60, height: 60, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gearIcon: { fontSize: 28 },

  battleStatsCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  battleGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, justifyContent: 'space-between' },
  gridItem: { width: '47%' },
  gridLabel: { fontSize: 12, fontWeight: '900', color: '#7a6a55', marginBottom: 4 },
  gridValue: { fontSize: 24, fontWeight: '900', color: '#1a1008' },

  progressCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  levelProgressRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  levelNameText: { width: 80, fontSize: 12, fontWeight: '900', color: '#1a1008' },
  levelBarOuter: { flex: 1, height: 10, backgroundColor: '#e5d9c4', borderRadius: 5, borderWidth: 1.5, borderColor: '#1a1008', marginHorizontal: 10, overflow: 'hidden' },
  levelBarInner: { height: '100%', backgroundColor: '#22c55e' },
  levelBarPerfect: { backgroundColor: '#f5a623' },
  scoreText: { width: 52, fontSize: 12, fontWeight: '900', textAlign: 'right', color: '#22c55e' },
  scoreTextPerfect: { color: '#f5a623' },
  scoreTextLocked: { color: '#7a6a55', fontWeight: '400' },

  achRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 12, marginBottom: 10 },
  achNum: { width: 25, fontSize: 16, fontWeight: '900', color: '#f5a623' },
  achIconBox: { width: 40, alignItems: 'center' },
  achTitle: { fontSize: 14, fontWeight: '900' },
  achDesc: { fontSize: 11, color: '#7a6a55' }
});