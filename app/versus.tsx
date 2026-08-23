import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { soundService } from '../services/soundService';

const CHARACTERS = [
  { id: 'c0', name: 'Algebro', icon: '🧮', avatar: require('../assets/images/avatar/algebroavatar.png') },
  { id: 'c1', name: 'Ada Lovelace', icon: '👩‍💻', avatar: require('../assets/images/avatar/lovelaceavatar.png') },
  { id: 'c2', name: 'Isaac Newton', icon: '🍎', avatar: require('../assets/images/avatar/newtonavatar.png') },
  { id: 'c3', name: 'Nikola Tesla', icon: '⚡', avatar: require('../assets/images/avatar/teslaavatar.png') },
  { id: 'c4', name: 'Marie Curie', icon: '☢️', avatar: require('../assets/images/avatar/curieavatar.png') },
];

const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️' },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓' },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏' },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱' },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐' },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️' },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️' },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️' },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥' },
];

export default function VersusScreen() {
  const router = useRouter();

  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');

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
        p1Name: p1Name.trim() || 'Player 1',
        p2Name: p2Name.trim() || 'Player 2',
        p1Character,
        p2Character,
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
              onPress={() => {
                soundService.playSound('click');
                onSelect(char.id);
              }}
            >
              <Image source={char.avatar} style={styles.charAvatar} resizeMode="contain" />
              <Text style={[styles.charName, selected && styles.charNameSelected]} numberOfLines={1}>
                {char.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderSelector = (
    label: string,
    items: { id: string; name: string; icon: string }[],
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
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => {
                soundService.playSound('click');
                onSelect(item.id);
              }}
            >
              <Text style={styles.chipText}>
                {item.icon} {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>VERSUS MODE</Text>
      <Text style={styles.subtitle}>Two Players • Turn Based</Text>

      <View style={styles.card}>
        <Text style={styles.playerTitle}>PLAYER 1</Text>
        <TextInput
          value={p1Name}
          onChangeText={setP1Name}
          style={styles.input}
          placeholder="Player 1 Name"
          placeholderTextColor="#7a6a55"
        />
        {renderCharacterSelector('Character', p1Character, setP1Character)}
        {renderSelector('Gear', GEARS, p1Gear, setP1Gear)}
        {renderSelector('Skill', SKILLS, p1Skill, setP1Skill)}
      </View>

      <View style={styles.card}>
        <Text style={styles.playerTitle}>PLAYER 2</Text>
        <TextInput
          value={p2Name}
          onChangeText={setP2Name}
          style={styles.input}
          placeholder="Player 2 Name"
          placeholderTextColor="#7a6a55"
        />
        {renderCharacterSelector('Character', p2Character, setP2Character)}
        {renderSelector('Gear', GEARS, p2Gear, setP2Gear)}
        {renderSelector('Skill', SKILLS, p2Skill, setP2Skill)}
      </View>

      <NeoButton
        wrapperStyle={{ marginTop: 8 }}
        shadowStyle={{ position: 'absolute', top: 5, left: 5, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 }}
        style={styles.primaryBtn as any}
        onPress={startVersus}
      >
        <Text style={styles.primaryBtnText}>Start Versus!</Text>
      </NeoButton>

      <NeoButton
        wrapperStyle={{ marginTop: 10 }}
        shadowStyle={{ position: 'absolute', top: 5, left: 5, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 }}
        style={styles.secondaryBtn as any}
        onPress={() => {
          soundService.playSound('click');
          router.replace('/');
        }}
      >
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </NeoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff9f0',
  },
  title: {
    fontFamily: GameFonts.brawl,
    fontSize: 32,
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  playerTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: GameFonts.hud,
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1008',
    backgroundColor: '#fff9f0',
    marginBottom: 12,
  },
  selectorBlock: {
    marginBottom: 10,
  },
  selectorLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  charCard: {
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    padding: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    alignItems: 'center',
    width: 86,
  },
  charCardSelected: {
    backgroundColor: '#fffae5',
    borderColor: '#e8302a',
    borderWidth: 2.5,
  },
  charAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
  },
  charName: {
    fontFamily: GameFonts.brawl,
    fontSize: 10,
    color: '#1a1008',
    textAlign: 'center',
  },
  charNameSelected: {
    color: '#e8302a',
  },
  chip: {
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff9f0',
  },
  chipSelected: {
    backgroundColor: '#e6f0ff',
    borderColor: '#1a6cf5',
  },
  chipText: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
  },
  primaryBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
