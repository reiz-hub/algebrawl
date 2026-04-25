// components/Sprite.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ActionState = 'stand' | 'idle' | 'attack' | 'hit' | 'win' | 'defeat';

interface SpriteProps {
  action: ActionState;
  isEnemy?: boolean;
}

export default function Sprite({ action, isEnemy = false }: SpriteProps) {
  // Replace these background colors with actual Image components sourcing your assets
  const getBackgroundColor = () => {
    switch (action) {
      case 'attack': return '#ffcc00'; // Yellow for attack flash
      case 'hit': return '#ff4444'; // Red for taking damage
      case 'win': return '#00C851'; // Green for win
      case 'defeat': return '#33b5e5'; // Blue for defeat
      default: return isEnemy ? '#aa66cc' : '#4285F4'; // Default idle colors
    }
  };

  return (
    <View style={[styles.spriteBox, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.text}>{isEnemy ? 'Enemy' : 'Player'}</Text>
      <Text style={styles.actionText}>{action.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spriteBox: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 10, margin: 20 },
  text: { color: 'white', fontWeight: 'bold' },
  actionText: { color: 'white', fontSize: 10, marginTop: 5 }
});