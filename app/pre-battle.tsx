// app/pre-battle.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';

const LOCK_ICON = require('../assets/icons/UI_icons/lock.png');

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', image: require('../assets/icons/gears/no2_pencil.png'), cost: 0 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', image: require('../assets/icons/gears/study_notes.png'), cost: 100 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', image: require('../assets/icons/gears/math_ruler.png'), cost: 200 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', image: require('../assets/icons/gears/pocket_calc.png'), cost: 350 },
  { id: 'g5', name: 'Golden Protractor', stat: '+3 Hearts & +5s/Q', icon: '📐', image: require('../assets/icons/gears/golden_protractor.png'), cost: 600 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', image: require('../assets/icons/skills/basic_attack.png'), cost: 0 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', image: require('../assets/icons/skills/skills.png'), cost: 150 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', image: require('../assets/icons/skills/shield.png'), cost: 250 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', image: require('../assets/icons/skills/double_strike.png'), cost: 400 },
];

const CHARACTERS = [
  { id: 'c0', name: 'Algebro', stat: 'Balanced', icon: '🧮', image: require('../assets/images/avatar/algebroavatar.png'), cost: 0 },
  { id: 'c1', name: 'Ada Lovelace', stat: '+3s / Q', icon: '👩‍💻', image: require('../assets/images/avatar/lovelaceavatar.png'), cost: 150 },
  { id: 'c2', name: 'Isaac Newton', stat: '+1 Heart', icon: '🍎', image: require('../assets/images/avatar/newtonavatar.png'), cost: 300 },
  { id: 'c3', name: 'Nikola Tesla', stat: '+2 HP & +3s', icon: '⚡', image: require('../assets/images/avatar/teslaavatar.png'), cost: 500 },
  { id: 'c4', name: 'Marie Curie', stat: '+2 HP & Shield', icon: '☢️', image: require('../assets/images/avatar/curieavatar.png'), cost: 750 },
];

export default function PreBattleScreen() {
  const router = useRouter();
  const { level, questions, timePerQuestion: timeParam, difficulty: difficultyParam } = useLocalSearchParams();
  const timePerQuestion = Number(timeParam) || 30;
  const currentLevel = Number(level) || 1;
  const difficulty = difficultyParam ? String(difficultyParam) : undefined;

  const inventory = useGameStore((state) => state.inventory);
  const coins = useGameStore((state) => state.coins);
  const equippedCharacter = useGameStore((state) => state.equippedCharacter);
  const equippedGear = useGameStore((state) => state.equippedGear);
  const skillStocks = useGameStore((state) => state.skillStocks);
  const consumeSkill = useGameStore((state) => state.consumeSkill);
  const getSkillStock = useGameStore((state) => state.getSkillStock);

  // Helper: check if item is unlocked (owned in inventory or free starter item)
  const isItemUnlocked = (id: string, cost: number) => {
    if (cost === 0) return true;
    return inventory.includes(id) || (id === 'c0' && inventory.includes('char_algebro'));
  };

  const normalizedEquippedChar = equippedCharacter === 'char_algebro' ? 'c0' : equippedCharacter;
  const initialChar = normalizedEquippedChar && isItemUnlocked(normalizedEquippedChar, 0) ? normalizedEquippedChar : 'c0';
  const initialGear = equippedGear && isItemUnlocked(equippedGear, 0) ? equippedGear : 'g1';

  const [selectedGear, setSelectedGear] = useState(initialGear);
  const [selectedSkill, setSelectedSkill] = useState('s1');
  const [selectedCharacter, setSelectedCharacter] = useState(initialChar);

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

        {/* 1b. DIFFICULTY (Level 7 only) */}
        {currentLevel === 7 && difficulty && (
          <BrutalistCard style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🎯  DIFFICULTY</Text>
              <Text style={[styles.infoValue, {
                color: difficulty === 'easy' ? '#22c55e' : difficulty === 'hard' ? '#e8302a' : '#f5a623'
              }]}>{difficulty.toUpperCase()}</Text>
            </View>
          </BrutalistCard>
        )}

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
                    {!isUnlocked ? (
                      <Image source={LOCK_ICON} style={{ width: 34, height: 34 }} resizeMode="contain" />
                    ) : gear.image ? (
                      <Image source={gear.image} style={{ width: 44, height: 44 }} resizeMode="contain" />
                    ) : (
                      <Text style={styles.itemIcon}>{gear.icon}</Text>
                    )}
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
                      <Image source={LOCK_ICON} style={{ width: 34, height: 34 }} resizeMode="contain" />
                    ) : char.image ? (
                      <Image source={char.image} style={{ width: 48, height: 48, borderRadius: 8 }} resizeMode="contain" />
                    ) : (
                      <Text style={styles.itemIcon}>{char.icon}</Text>
                    )}
                  </View>
                  <Text style={[styles.itemName, !isUnlocked && styles.lockedText]}>
                    {!isUnlocked ? `🪙 ${char.cost}` : char.name}
                  </Text>
                  {isUnlocked ? (
                    <Text style={styles.itemStat}>{char.stat}</Text>
                  ) : (
                    <Text style={styles.shopPromptText}>BUY IN SHOP</Text>
                  )}
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
            const isConsumable = skill.id !== 's1' && skill.cost > 0;
            const stock = isConsumable ? (skillStocks[skill.id] ?? 0) : Infinity;
            const hasZeroStock = isConsumable && isUnlocked && stock <= 0;
            return (
              <TouchableOpacity
                key={skill.id}
                activeOpacity={0.8}
                onPress={() => {
                  if (!isUnlocked || hasZeroStock) {
                    router.push('/shop');
                  } else {
                    setSelectedSkill(skill.id);
                  }
                }}
                style={[
                  styles.skillRow,
                  index < SKILLS.length - 1 && styles.skillBorder,
                  isSelected && styles.skillRowSelected,
                  (!isUnlocked || hasZeroStock) && styles.skillRowLocked,
                ]}
              >
                <View style={[styles.skillIconContainer, !isUnlocked && styles.lockedIconContainer]}>
                  {!isUnlocked ? (
                    <Image source={LOCK_ICON} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  ) : skill.image ? (
                    <Image
                      source={skill.image}
                      style={{ width: 34, height: 34, opacity: hasZeroStock ? 0.5 : 1 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[styles.skillIcon, hasZeroStock && { opacity: 0.5 }]}>{skill.icon}</Text>
                  )}
                </View>
                <View style={styles.skillTextContainer}>
                  <Text style={[styles.skillName, !isUnlocked && styles.lockedText]}>
                    {!isUnlocked ? `${skill.name} (🪙 ${skill.cost})` : skill.name}
                  </Text>
                  <Text style={styles.skillDesc}>
                    {!isUnlocked ? 'Unlock in Item Shop using Coins' : skill.desc}
                  </Text>
                </View>
                {isConsumable && isUnlocked && (
                  <View style={{
                    backgroundColor: stock > 0 ? '#fef3c7' : '#fee2e2',
                    borderWidth: 1.5,
                    borderColor: '#1a1008',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    marginRight: 6,
                  }}>
                    <Text style={{
                      fontFamily: GameFonts.arcade,
                      fontSize: 11,
                      color: stock > 0 ? '#1a1008' : '#dc2626',
                    }}>×{stock}</Text>
                  </View>
                )}
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

              // Consume skill stock for consumable skills before entering battle
              if (selectedSkill !== 's1') {
                const consumed = consumeSkill(selectedSkill);
                if (!consumed) {
                  // Safety fallback: shouldn't happen since UI prevents selection
                  setSelectedSkill('s1');
                  return;
                }
              }

              router.push({
                pathname: '/battle',
                params: {
                  level,
                  questions,
                  timePerQuestion: timePerQuestion.toString(),
                  skillId: activeSkill?.id,
                  skillName: activeSkill?.name,
                  skillIcon: activeSkill?.icon,
                  gearId: activeGear?.id,
                  gearName: activeGear?.name,
                  gearIcon: activeGear?.icon,
                  gearStat: activeGear?.stat,
                  characterName: activeCharacter?.name,
                  characterIcon: activeCharacter?.icon,
                  characterId: activeCharacter?.id,
                  ...(difficulty ? { difficulty } : {}),
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
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
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
    fontFamily: GameFonts.arcade,
    color: '#1a1008',
    fontSize: 13,
  },
  fixedShopDivider: {
    width: 2,
    height: 14,
    backgroundColor: '#1a1008',
  },
  fixedShopText: {
    fontFamily: GameFonts.brawl,
    color: '#1a1008',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bgSymbol: {
    fontFamily: GameFonts.impact,
    position: 'absolute',
    fontSize: 60,
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
    fontFamily: GameFonts.brawl,
    fontSize: 34,
    color: '#1a1008',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 15,
    color: '#f5a623',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
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
    fontFamily: GameFonts.hud,
    fontSize: 13,
    color: '#7a6a55',
  },
  infoValue: {
    fontFamily: GameFonts.brawl,
    fontSize: 15,
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
    fontFamily: GameFonts.brawl,
    fontSize: 32,
  },
  itemName: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
    textAlign: 'center',
    marginTop: 6,
  },
  itemStat: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#f5a623',
    textAlign: 'center',
  },
  lockedText: {
    color: '#64748b',
  },
  shopPromptText: {
    fontFamily: GameFonts.hud,
    fontSize: 9,
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
    fontFamily: GameFonts.brawl,
    fontSize: 20,
  },
  skillTextContainer: {
    flex: 1,
  },
  skillName: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  skillDesc: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
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
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 18,
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
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});