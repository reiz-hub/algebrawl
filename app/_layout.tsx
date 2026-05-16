import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import DeactivatedModal from '../components/DeactivatedModal';
import { useGameStore } from '../hooks/useGameStore';
import { checkAccountStatus } from '../services/firestoreSync';

export default function RootLayout() {
  const loadLocalData = useGameStore((state) => state.loadLocalData);
  const userId = useGameStore((state) => state.userId);
  const isLoggedIn = useGameStore((state) => state.isLoggedIn);
  const isLoaded = useGameStore((state) => state.isLoaded);
  const logout = useGameStore((state) => state.logout);

  const [showDeactivated, setShowDeactivated] = useState(false);

  useEffect(() => {
    loadLocalData();
  }, []);

  // Check account status when a logged-in user's data finishes loading
  useEffect(() => {
    if (!isLoaded || !isLoggedIn || !userId) return;

    const verifyAccount = async () => {
      const isActive = await checkAccountStatus(userId);
      if (!isActive) {
        setShowDeactivated(true);
      }
    };

    verifyAccount();
  }, [isLoaded, isLoggedIn, userId]);

  const handleDeactivatedLogout = async () => {
    setShowDeactivated(false);
    await logout();
  };

  return (
    <>
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

      <DeactivatedModal
        visible={showDeactivated}
        onLogout={handleDeactivatedLogout}
      />
    </>
  );
}