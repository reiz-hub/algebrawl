import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';

export default function RootLayout() {
  const loadLocalData = useGameStore((state) => state.loadLocalData);

  useEffect(() => {
    // We only need to load the temporary local data now. No database initialization!
    loadLocalData();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="pre-battle" />
      <Stack.Screen name="battle" />
    </Stack>
  );
}