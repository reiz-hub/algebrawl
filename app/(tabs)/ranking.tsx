import { useRouter } from 'expo-router';
import React from 'react';
import LeaderboardScreen from '../leaderboard';

export default function TabRankingScreen() {
  const router = useRouter();
  return <LeaderboardScreen onBack={() => router.replace('/(tabs)/dungeon' as any)} />;
}
