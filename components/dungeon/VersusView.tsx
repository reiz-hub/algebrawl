import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import NeoButton from '../NeoButton';
import TouchableOpacity from '../TouchableOpacity';
import { GameFonts } from '../../constants/theme';
import { soundService } from '../../services/soundService';

const CHARACTERS = [
  { id: 'c0', name: 'Algebro', stat: 'Balanced', icon: '🧮', avatar: require('../../assets/images/avatar/algebroavatar.png') },
  { id: 'c1', name: 'Ada Lovelace', stat: '+3s Timer', icon: '👩‍💻', avatar: require('../../assets/images/avatar/lovelaceavatar.png') },
  { id: 'c2', name: 'Isaac Newton', stat: '+1 Heart', icon: '🍎', avatar: require('../../assets/images/avatar/newtonavatar.png') },
  { id: 'c3', name: 'Nikola Tesla', stat: '+2 HP & +3s', icon: '⚡', avatar: require('../../assets/images/avatar/teslaavatar.png') },
  { id: 'c4', name: 'Marie Curie', stat: '+2 HP & Shield', icon: '☢️', avatar: require('../../assets/images/avatar/curieavatar.png') },
];

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', image: require('../../assets/icons/gears/no2_pencil.png') },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', image: require('../../assets/icons/gears/study_notes.png') },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', image: require('../../assets/icons/gears/math_ruler.png') },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', image: require('../../assets/icons/gears/pocket_calc.png') },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', image: require('../../assets/icons/gears/golden_protractor.png') },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', image: require('../../assets/icons/skills/basic_attack.png') },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', image: require('../../assets/icons/skills/skills.png') },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', image: require('../../assets/icons/skills/shield.png') },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', image: require('../../assets/icons/skills/double_strike.png') },
];

const TIME_LIMITS = [
  { id: '15', name: '15s (Fast)', icon: '⚡' },
  { id: '20', name: '20s (Normal)', icon: '⏱️' },
  { id: '30', name: '30s (Relaxed)', icon: '⏳' },
  { id: '45', name: '45s (Extended)', icon: '🧠' },
];

export default function VersusView() {
  const router = useRouter();

  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');

  const [timeLimit, setTimeLimit] = useState('20');

  const [p1Character, setP1Character] = useState('c0');
  const [p2Character, setP2Character] = useState('c1');

  const [p1Gear, setP1Gear] = useState('g1');
  const [p2Gear, setP2Gear] = useState('g1');
  const [p1Skill, setP1Skill] = useState('s1');
  const [p2Skill, setP2Skill] = useState('s1');

  const getGearById = (id: string) => GEARS.find((g) => g.id === id);
  const getSkillById = (id: string) => SKILLS.find((s) => s.id === id);

  const startVersus = () => {
    soundService.playSound('click');
    const p1GearData = getGearById(p1Gear);
    const p2GearData = getGearById(p2Gear);
    const p1SkillData = getSkillById(p1Skill);
    const p2SkillData = getSkillById(p2Skill);

    router.push({
      pathname: '/versus-battle',
      params: {
        mode: 'versus',
        questions: '20',
        timeLimit: timeLimit,
        p1Name: p1Name.trim() || 'Player 1',
        p2Name: p2Name.trim() || 'Player 2',
        p1Character,
        p2Character,
        p1GearId: p1Gear,
        p2GearId: p2Gear,
        p1SkillId: p1Skill,
        p2SkillId: p2Skill,
        p1GearStat: p1GearData?.stat ?? '',
        p2GearStat: p2GearData?.stat ?? '',
        p1GearIcon: p1GearData?.icon ?? '',
        p2GearIcon: p2GearData?.icon ?? '',
        p1SkillName: p1SkillData?.name ?? 'Basic Attack',
        p2SkillName: p2SkillData?.name ?? 'Basic Attack',
        p1SkillIcon: p1SkillData?.icon ?? '⚔️',
        p2SkillIcon: p2SkillData?.icon ?? '⚔️',
      },
    });
  };

  const renderCharacterSelector = (
    label: string,
    selectedId: string,
    onSelect: (id: string) => void
  ) => (
    <View style={styles.selectorBlock}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CHARACTERS.map((char) => {
          const selected = char.id === selectedId;
          return (
            <TouchableOpacity
              key={char.id}
              style={[styles.charCard, selected && styles.charCardSelected]}
              onPress={() => onSelect(char.id)}
              activeOpacity={0.8}
            >
              <Image source={char.avatar} style={styles.charAvatar} resizeMode="contain" />
              <Text style={styles.charName} numberOfLines={1}>{char.name}</Text>
              <Text style={styles.charStat}>{char.stat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSelector = (
    label: string,
    items: { id: string; name: string; icon: string; image?: any; stat?: string; desc?: string }[],
    selectedId: string,
    onSelect: (id: string) => void
  ) => (
    <View style={styles.selectorBlock}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, selected && styles.itemCardSelected]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.8}
            >
              {item.image ? (
                <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
              ) : (
                <Text style={styles.itemIcon}>{item.icon}</Text>
              )}
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.stat || item.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Player 1 Config */}
      <View style={styles.playerCard}>
        <View style={styles.playerCardShadow} />
        <View style={styles.playerCardContent}>
          <View style={styles.playerCardHeader}>
            <View style={[styles.playerBadge, { backgroundColor: '#1a6cf5' }]}>
              <Text style={styles.playerBadgeText}>P1</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={p1Name}
              onChangeText={setP1Name}
              placeholder="Player 1 Name"
              placeholderTextColor="#a0907e"
              maxLength={15}
              autoCorrect={false}
            />
          </View>
          {renderCharacterSelector('CHOOSE HERO', p1Character, setP1Character)}
          {renderSelector('GEAR', GEARS, p1Gear, setP1Gear)}
          {renderSelector('SKILL', SKILLS, p1Skill, setP1Skill)}
        </View>
      </View>

      {/* Player 2 Config */}
      <View style={styles.playerCard}>
        <View style={styles.playerCardShadow} />
        <View style={styles.playerCardContent}>
          <View style={styles.playerCardHeader}>
            <View style={[styles.playerBadge, { backgroundColor: '#e8302a' }]}>
              <Text style={styles.playerBadgeText}>P2</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={p2Name}
              onChangeText={setP2Name}
              placeholder="Player 2 Name"
              placeholderTextColor="#a0907e"
              maxLength={15}
              autoCorrect={false}
            />
          </View>
          {renderCharacterSelector('CHOOSE HERO', p2Character, setP2Character)}
          {renderSelector('GEAR', GEARS, p2Gear, setP2Gear)}
          {renderSelector('SKILL', SKILLS, p2Skill, setP2Skill)}
        </View>
      </View>

      {/* Match Rules & Time Limit */}
      <View style={styles.playerCard}>
        <View style={styles.playerCardShadow} />
        <View style={styles.playerCardContent}>
          <Text style={styles.rulesTitle}>MATCH RULES</Text>
          {renderSelector('TIME PER QUESTION', TIME_LIMITS, timeLimit, setTimeLimit)}
          <View style={styles.rulesSummary}>
            <Text style={styles.rulesSummaryText}>• 20 Total Questions</Text>
            <Text style={styles.rulesSummaryText}>• Turn-based (Alternating)</Text>
            <Text style={styles.rulesSummaryText}>• Correct answers deal damage</Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <NeoButton style={styles.startBtn} onPress={startVersus}>
        <Feather name="zap" size={24} color="#fff" />
        <Text style={styles.startBtnText}>START BATTLE</Text>
      </NeoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  playerCard: {
    position: 'relative',
    width: '100%',
  },
  playerCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  playerCardContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 14,
    gap: 12,
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBadgeText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 16,
  },
  nameInput: {
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#fff9f0',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 2,
    textAlignVertical: 'center',
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
  },
  selectorBlock: {
    gap: 6,
  },
  selectorLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
    color: '#7a6a55',
    letterSpacing: 0.5,
  },
  charCard: {
    width: 90,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#e5d9c4',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  charCardSelected: {
    borderColor: '#1a1008',
    backgroundColor: '#fef3c7',
    borderWidth: 2,
  },
  charAvatar: {
    width: 44,
    height: 44,
    marginBottom: 4,
  },
  charName: {
    fontFamily: GameFonts.brawl,
    fontSize: 9,
    color: '#1a1008',
    textAlign: 'center',
  },
  charStat: {
    fontFamily: GameFonts.hud,
    fontSize: 8,
    color: '#7a6a55',
    textAlign: 'center',
  },
  itemCard: {
    minWidth: 80,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#e5d9c4',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  itemCardSelected: {
    borderColor: '#1a1008',
    backgroundColor: '#fef3c7',
  },
  itemIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  itemImage: {
    width: 32,
    height: 32,
    marginBottom: 2,
  },
  itemName: {
    fontFamily: GameFonts.brawl,
    fontSize: 9,
    color: '#1a1008',
    textAlign: 'center',
  },
  itemSub: {
    fontFamily: GameFonts.hud,
    fontSize: 8,
    color: '#7a6a55',
    textAlign: 'center',
  },
  rulesTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  rulesSummary: {
    backgroundColor: '#fff9f0',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1008',
    gap: 4,
  },
  rulesSummaryText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#1a1008',
  },
  startBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  startBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 18,
    letterSpacing: 1,
  },
});
