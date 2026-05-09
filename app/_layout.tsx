import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';

export default function RootLayout() {
  const loadLocalData = useGameStore((state) => state.loadLocalData);

  useEffect(() => {
    loadLocalData();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="pre-battle" />
      <Stack.Screen name="battle" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="login" />
      <Stack.Screen name="versus" />
      <Stack.Screen name="versus-battle" />
    </Stack>
  );
}