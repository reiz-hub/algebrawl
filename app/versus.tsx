import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  const [p1Gear, setP1Gear] = useState('g1');
  const [p2Gear, setP2Gear] = useState('g1');
  const [p1Skill, setP1Skill] = useState('s1');
  const [p2Skill, setP2Skill] = useState('s1');

  const getGearById = (id: string) => GEARS.find((g) => g.id === id);
  const getSkillById = (id: string) => SKILLS.find((s) => s.id === id);

  const startVersus = () => {
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
              onPress={() => onSelect(item.id)}
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
        {renderSelector('Gear', GEARS, p2Gear, setP2Gear)}
        {renderSelector('Skill', SKILLS, p2Skill, setP2Skill)}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={startVersus}>
        <Text style={styles.primaryBtnText}>Start Versus!</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </TouchableOpacity>
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
    fontSize: 42,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 10,
  },
  input: {
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
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 6,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1008',
  },
  primaryBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1008',
    textTransform: 'uppercase',
  },
});
