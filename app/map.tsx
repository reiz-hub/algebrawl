import { Redirect } from 'expo-router';
import React from 'react';

export default function MapScreen() {
  return <Redirect href={'/(tabs)/dungeon?tab=adventure' as any} />;
}