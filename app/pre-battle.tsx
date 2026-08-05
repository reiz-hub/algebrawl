// app/pre-battle.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle, Image } from 'react-native';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { useGameStore } from '../hooks/useGameStore';

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', cost: 0 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', cost: 100 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', cost: 200 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', cost: 350 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', cost: 600 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', cost: 0 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', cost: 150 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', cost: 250 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', cost: 400 },
];

const CHARACTERS = [
  { id: 'c0', name: 'Algebro', icon: '🧮', image: require('../assets/images/avatar/algebroavatar.png'), cost: 0 },
  { id: 'c1', name: 'Ada Lovelace', icon: '👩‍💻', image: require('../assets/images/avatar/lovelaceavatar.png'), cost: 150 },
  { id: 'c2', name: 'Isaac Newton', icon: '🍎', image: require('../assets/images/avatar/newtonavatar.png'), cost: 300 },
  { id: 'c3', name: 'Nikola Tesla', icon: '⚡', image: require('../assets/images/avatar/teslaavatar.png'), cost: 500 },
  { id: 'c4', name: 'Marie Curie', icon: '☢️', image: require('../assets/images/avatar/curieavatar.png'), cost: 750 },
];

export default function PreBattleScreen() {
  const router = useRouter();
  const { level, questions, timePerQuestion: timeParam } = useLocalSearchParams();
  const timePerQuestion = Number(timeParam) || 30;
  const currentLevel = Number(level) || 1;

  const inventory = useGameStore((state) => state.inventory);
  const coins = useGameStore((state) => state.coins);

  const [selectedGear, setSelectedGear] = useState('g1');
  const [selectedSkill, setSelectedSkill] = useState('s1');
  const [selectedCharacter, setSelectedCharacter] = useState('c0');

  // Helper: check if item is unlocked (owned in inventory or free starter item)
  const isItemUnlocked = (id: string, cost: number) => {
    if (cost === 0) return true;
    return inventory.includes(id);
  };

  const BrutalistCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.cardShadow} />
      <View style={[styles.cardContent, style]}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Neo-Brutalist Top Bar */}
      <View style={styles.fixedTopBar}>
        <TouchableOpacity
          style={styles.backShortcutBtn}
          activeOpacity={0.8}
          onPress={() => router.replace('/map')}
        >
          <Text style={styles.backShortcutText}>‹ MAP</Text>
        </TouchableOpacity>

        <View style={styles.fixedShopWrapper}>
          <View style={styles.fixedShopShadow} />
          <TouchableOpacity
            style={styles.fixedShopBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/shop')}
          >
            <Text style={styles.fixedShopCoins}>🪙 {coins}</Text>
            <View style={styles.fixedShopDivider} />
            <Text style={styles.fixedShopText}>ITEM SHOP 🛍️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.bgSymbol, { top: '8%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
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
                : `${timePerQuestion}s / Q`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>❤️  STARTING HP</Text>
            <Text style={styles.infoValue}>3 Hearts</Text>
          </View>
        </BrutalistCard>

        {/* 2. CHOOSE GEAR */}
        <Text style={styles.sectionHeader}>EQUIP GEAR (CHOOSE 1)</Text>
        <View style={styles.gearScrollWrapper}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gearScrollContainer}
          >
            {GEARS.map((gear) => {
              const isUnlocked = isItemUnlocked(gear.id, gear.cost);
              const isSelected = selectedGear === gear.id;
              return (
                <TouchableOpacity
                  key={gear.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isUnlocked) {
                      setSelectedGear(gear.id);
                    } else {
                      router.push('/shop');
                    }
                  }}
                  style={styles.itemWrapper}
                >
                  <View style={styles.itemShadow} />
                  <View
                    style={[
                      styles.itemSlot,
                      isSelected && styles.itemSlotSelected,
                      !isUnlocked && styles.itemSlotLocked,
                    ]}
                  >
                    <Text style={styles.itemIcon}>{!isUnlocked ? '🔒' : gear.icon}</Text>
                  </View>
                  <Text style={[styles.itemName, !isUnlocked && styles.lockedText]}>
                    {!isUnlocked ? `🪙 ${gear.cost}` : gear.name}
                  </Text>
                  {isUnlocked ? (
                    <Text style={styles.itemStat}>{gear.stat}</Text>
                  ) : (
                    <Text style={styles.shopPromptText}>BUY IN SHOP</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. CHOOSE CHARACTER */}
        <Text style={[styles.sectionHeader, { marginTop: 3 }]}>CHOOSE CHARACTER</Text>
        <View style={styles.gearScrollWrapper}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gearScrollContainer}
          >
            {CHARACTERS.map((char) => {
              const isUnlocked = isItemUnlocked(char.id, char.cost);
              const isSelected = selectedCharacter === char.id;
              return (
                <TouchableOpacity
                  key={char.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isUnlocked) {
                      setSelectedCharacter(char.id);
                    } else {
                      router.push('/shop');
                    }
                  }}
                  style={styles.itemWrapper}
                >
                  <View style={styles.itemShadow} />
                  <View
                    style={[
                      styles.itemSlot,
                      isSelected && styles.itemSlotSelected,
                      !isUnlocked && styles.itemSlotLocked,
                    ]}
                  >
                    {!isUnlocked ? (
                      <Text style={styles.itemIcon}>🔒</Text>
                    ) : char.image ? (
                      <Image source={char.image} style={{ width: 48, height: 48, borderRadius: 8 }} resizeMode="contain" />
                    ) : (
                      <Text style={styles.itemIcon}>{char.icon}</Text>
                    )}
                  </View>
                  <Text style={[styles.itemName, !isUnlocked && styles.lockedText]}>
                    {!isUnlocked ? `🪙 ${char.cost}` : char.name}
                  </Text>
                  {!isUnlocked && <Text style={styles.shopPromptText}>BUY IN SHOP</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. CHOOSE SKILL */}
        <Text style={styles.sectionHeader}>ACTIVE SKILL (CHOOSE 1)</Text>
        <BrutalistCard style={styles.skillBox}>
          {SKILLS.map((skill, index) => {
            const isUnlocked = isItemUnlocked(skill.id, skill.cost);
            const isSelected = selectedSkill === skill.id;
            return (
              <TouchableOpacity
                key={skill.id}
                activeOpacity={0.8}
                onPress={() => {
                  if (isUnlocked) {
                    setSelectedSkill(skill.id);
                  } else {
                    router.push('/shop');
                  }
                }}
                style={[
                  styles.skillRow,
                  index < SKILLS.length - 1 && styles.skillBorder,
                  isSelected && styles.skillRowSelected,
                  !isUnlocked && styles.skillRowLocked,
                ]}
              >
                <View style={[styles.skillIconContainer, !isUnlocked && styles.lockedIconContainer]}>
                  <Text style={styles.skillIcon}>{!isUnlocked ? '🔒' : skill.icon}</Text>
                </View>
                <View style={styles.skillTextContainer}>
                  <Text style={[styles.skillName, !isUnlocked && styles.lockedText]}>
                    {!isUnlocked ? `${skill.name} (🪙 ${skill.cost})` : skill.name}
                  </Text>
                  <Text style={styles.skillDesc}>
                    {!isUnlocked ? 'Unlock in Item Shop using Coins' : skill.desc}
                  </Text>
                </View>
                <View style={styles.radioCircle}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </BrutalistCard>

        {/* 5. BUTTONS */}
        <View style={styles.buttonContainer}>
          <NeoButton
            wrapperStyle={styles.btnWrapper}
            shadowStyle={styles.btnShadow}
            style={styles.btnPrimary as ViewStyle}
            onPress={() => {
              const activeSkill = SKILLS.find((s) => s.id === selectedSkill);
              const activeGear = GEARS.find((g) => g.id === selectedGear);
              const activeCharacter = CHARACTERS.find((c) => c.id === selectedCharacter);

              router.push({
                pathname: '/battle',
                params: {
                  level,
                  questions,
                  timePerQuestion: timePerQuestion.toString(),
                  skillName: activeSkill?.name,
                  skillIcon: activeSkill?.icon,
                  gearName: activeGear?.name,
                  gearIcon: activeGear?.icon,
                  gearStat: activeGear?.stat,
                  characterName: activeCharacter?.name,
                  characterIcon: activeCharacter?.icon,
                  characterId: activeCharacter?.id,
                },
              });
            }}
          >
            <Text style={styles.btnPrimaryText}>Start Battle!</Text>
          </NeoButton>

          <NeoButton
            wrapperStyle={styles.btnWrapper}
            shadowStyle={styles.btnShadow}
            style={styles.btnSecondary as ViewStyle}
            onPress={() => router.replace('/map')}
          >
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </NeoButton>
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
  fixedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 249, 240, 0.95)',
  },
  backShortcutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1008',
  },
  backShortcutText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  fixedShopWrapper: {
    position: 'relative',
  },
  fixedShopShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  fixedShopBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixedShopCoins: {
    color: '#1a1008',
    fontSize: 14,
    fontWeight: '900',
  },
  fixedShopDivider: {
    width: 2,
    height: 14,
    backgroundColor: '#1a1008',
  },
  fixedShopText: {
    color: '#1a1008',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bgSymbol: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f5a623',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 15,
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 16,
  },
  infoBox: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7a6a55',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1008',
  },
  gearScrollWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  gearScrollContainer: {
    paddingRight: 20,
    gap: 12,
  },
  itemWrapper: {
    position: 'relative',
    width: 96,
    alignItems: 'center',
  },
  itemShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: 90,
    backgroundColor: '#1a1008',
    borderRadius: 14,
  },
  itemSlot: {
    width: '100%',
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSlotSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#1a1008',
  },
  itemSlotLocked: {
    backgroundColor: '#e2e8f0',
    borderColor: '#94a3b8',
  },
  itemIcon: {
    fontSize: 32,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
    marginTop: 6,
  },
  itemStat: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f5a623',
    textAlign: 'center',
  },
  lockedText: {
    color: '#64748b',
  },
  shopPromptText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#3b82f6',
    marginTop: 2,
  },
  skillBox: {
    paddingVertical: 4,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  skillBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#f0e6d6',
  },
  skillRowSelected: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  skillRowLocked: {
    opacity: 0.7,
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5a623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockedIconContainer: {
    backgroundColor: '#cbd5e1',
  },
  skillIcon: {
    fontSize: 20,
  },
  skillTextContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1008',
  },
  skillDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a6a55',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a1008',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
    gap: 14,
  },
  btnWrapper: {
    position: 'relative',
    width: '100%',
  },
  btnShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  btnPrimary: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btnSecondary: {
    backgroundColor: '#ef4444',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});