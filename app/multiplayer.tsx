import { Redirect } from 'expo-router';
import React from 'react';

export default function MultiplayerScreen() {
  return <Redirect href={'/(tabs)/dungeon?tab=rank' as any} />;
}
