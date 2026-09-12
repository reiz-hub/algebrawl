import { Redirect } from 'expo-router';
import React from 'react';

export default function VersusScreen() {
  return <Redirect href={'/(tabs)/dungeon?tab=versus' as any} />;
}
