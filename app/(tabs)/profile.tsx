import { useRouter } from 'expo-router';
import React from 'react';
import PlayerStatsScreen from '../stats';

export default function TabProfileScreen() {
  const router = useRouter();
  return <PlayerStatsScreen onBack={() => router.replace('/(tabs)/dungeon' as any)} />;
}
