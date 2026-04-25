// app/pre-battle.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';

// Mock data for Gears & Skills with unlock requirements
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

export default function PreBattleScreen() {
  const router = useRouter();
  const { level, questions, timePerQuestion: timeParam } = useLocalSearchParams();
  const timePerQuestion = Number(timeParam) || 15;
  const currentLevel = Number(level) || 1;
  const unlockedLevel = useGameStore((state) => state.unlockedLevel);

  // State for selections
  const [selectedGear, setSelectedGear] = useState('g1');
  const [selectedSkill, setSelectedSkill] = useState('s1');

  // Neo-Brutalist shadow wrapper component
  const BrutalistCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.cardShadow} />
      <View style={[styles.cardContent, style]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '5%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '25%', right: '15%', transform: [{ rotate: '20deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', left: '20%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '5%', right: '10%', transform: [{ rotate: '10deg' }] }]}>÷</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>LEVEL {level}</Text>
        <Text style={styles.subtitle}>PREPARE FOR BATTLE</Text>

        {/* 1. BATTLE INFO */}
        <BrutalistCard style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⚔️  QUESTIONS</Text>
            <Text style={styles.infoValue}>{questions}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏱️  TIME LIMIT</Text>
            <Text style={styles.infoValue}>
              {currentLevel === 7 
                ? '22-27s / Q (dynamic)' 
                : `${timePerQuestion}s / Q`
              }
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>❤️  STARTING HP</Text>
            <Text style={styles.infoValue}>3 Hearts</Text>
          </View>
        </BrutalistCard>

        {/* 2. CHOOSE GEAR (HORIZONTAL SCROLL) */}
        <Text style={styles.sectionHeader}>EQUIP GEAR (CHOOSE 1)</Text>
        <View style={styles.gearScrollWrapper}>
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.gearScrollContainer}
          >
            {GEARS.map((gear) => {
              const isLocked = unlockedLevel < gear.unlockLevel;
              const isSelected = selectedGear === gear.id;

              return (
                <TouchableOpacity
                  key={gear.id}
                  activeOpacity={0.8}
                  disabled={isLocked}
                  onPress={() => setSelectedGear(gear.id)}
                  style={styles.itemWrapper}
                >
                  <View style={styles.itemShadow} />
                  <View style={[
                    styles.itemSlot, 
                    isSelected && styles.itemSlotSelected,
                    isLocked && styles.itemSlotLocked
                  ]}>
                    <Text style={styles.itemIcon}>{isLocked ? '🔒' : gear.icon}</Text>
                  </View>
                  <Text style={[styles.itemName, isLocked && styles.lockedText]}>
                    {isLocked ? `Lv. ${gear.unlockLevel}` : gear.name}
                  </Text>
                  {!isLocked && <Text style={styles.itemStat}>{gear.stat}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. CHOOSE SKILL */}
        <Text style={styles.sectionHeader}>ACTIVE SKILL (CHOOSE 1)</Text>
        <BrutalistCard style={styles.skillBox}>
            {SKILLS.map((skill, index) => {
              const isLocked = unlockedLevel < skill.unlockLevel;
              const isSelected = selectedSkill === skill.id;

              return (
                <TouchableOpacity 
                  key={skill.id} 
                  activeOpacity={0.8}
                  disabled={isLocked}
                  onPress={() => setSelectedSkill(skill.id)}
                  style={[
                    styles.skillRow, 
                    index < SKILLS.length - 1 && styles.skillBorder,
                    isSelected && styles.skillRowSelected,
                    isLocked && styles.skillRowLocked
                  ]}
                >
                    <View style={[styles.skillIconContainer, isLocked && styles.lockedIconContainer]}>
                        <Text style={styles.skillIcon}>{isLocked ? '🔒' : skill.icon}</Text>
                    </View>
                    <View style={styles.skillTextContainer}>
                        <Text style={[styles.skillName, isLocked && styles.lockedText]}>
                          {isLocked ? `Unlocks at Level ${skill.unlockLevel}` : skill.name}
                        </Text>
                        {!isLocked && <Text style={styles.skillDesc}>{skill.desc}</Text>}
                    </View>
                    
                    {/* Selection Indicator */}
                    <View style={styles.radioCircle}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
              );
            })}
        </BrutalistCard>

        {/* 4. BUTTONS */}
        <View style={styles.buttonContainer}>
          <View style={styles.btnWrapper}>
            <View style={styles.btnShadow} />
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.btnPrimary} 
              onPress={() => {
                // 👇 Find the full objects based on the selected IDs
                const activeSkill = SKILLS.find(s => s.id === selectedSkill);
                const activeGear = GEARS.find(g => g.id === selectedGear);

                router.push({
                  pathname: '/battle',
                  // 👇 Pass all the relevant data as params!
                  params: { 
                    level, 
                    questions,
                    timePerQuestion: timePerQuestion.toString(),
                    skillName: activeSkill?.name,
                    skillIcon: activeSkill?.icon,
                    gearName: activeGear?.name,
                    gearIcon: activeGear?.icon,
                    gearStat: activeGear?.stat
                  }
                });
              }}
            >
              <Text style={styles.btnPrimaryText}>Start Battle!</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnWrapper}>
            <View style={styles.btnShadow} />
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.btnSecondary} 
              onPress={() => router.back()}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff9f0', 
  },
  bgSymbol: { 
    position: 'absolute', 
    fontSize: 60, 
    fontWeight: '900', 
    color: '#e5d9c4', 
    opacity: 0.3, 
    zIndex: 1
  },
  content: { 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingTop: 60, 
    paddingBottom: 40, 
    zIndex: 10 
  },
  title: { 
    fontSize: 50, 
    fontWeight: '900', 
    color: '#1a1008', 
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  subtitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#f5a623', 
    marginBottom: 30, 
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1008',
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 20,
    position: 'relative'
  },
  cardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16
  },
  cardContent: { 
    backgroundColor: '#fff', 
    borderWidth: 3, 
    borderColor: '#1a1008', 
    borderRadius: 16, 
  },
  infoBox: { 
    padding: 20, 
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  infoLabel: { 
    color: '#7a6a55', 
    fontSize: 16, 
    fontWeight: '900',
    letterSpacing: 1
  },
  infoValue: { 
    color: '#1a1008', 
    fontSize: 16,
    fontWeight: '900' 
  },
  
  // GEAR SCROLL STYLING
  gearScrollWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  gearScrollContainer: {
    paddingBottom: 15, // Space for the neo-brutalist shadows
    paddingHorizontal: 5, 
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: 80,
    marginRight: 20, // Forces space between items ensuring horizontal flow
  },
  itemShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 80,
    height: 80,
    backgroundColor: '#1a1008',
    borderRadius: 16
  },
  itemSlot: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemSlotSelected: {
    backgroundColor: '#e6f0ff',
    borderColor: '#1a6cf5',
  },
  itemSlotLocked: {
    backgroundColor: '#e5d9c4',
  },
  itemIcon: {
    fontSize: 36,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
  },
  itemStat: {
    fontSize: 12,
    fontWeight: '900',
    color: '#22c55e', 
  },
  lockedText: {
    color: '#7a6a55',
  },

  // SKILL BOX STYLING
  skillBox: {
    padding: 0,
    overflow: 'hidden',
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  skillRowSelected: {
    backgroundColor: '#e6f0ff',
  },
  skillRowLocked: {
    backgroundColor: '#f5f5f5',
  },
  skillBorder: {
    borderBottomWidth: 2,
    borderColor: '#e5d9c4',
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lockedIconContainer: {
    backgroundColor: '#e5d9c4',
  },
  skillIcon: {
    fontSize: 20,
  },
  skillTextContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1008',
  },
  skillDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a6a55',
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1a1008',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#1a6cf5',
  },

  // BUTTON STYLING
  buttonContainer: { 
    width: '100%', 
    marginTop: 30,
    gap: 20 
  },
  btnWrapper: { 
    position: 'relative', 
    width: '100%' 
  },
  btnShadow: { 
    position: 'absolute', 
    top: 5, 
    left: 5, 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#1a1008', 
    borderRadius: 16 
  },
  btnPrimary: { 
    backgroundColor: '#e8302a', 
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
  },
  btnPrimaryText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900', 
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  btnSecondary: { 
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  btnSecondaryText: { 
    color: '#1a1008', 
    fontSize: 18, 
    fontWeight: '900', 
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});