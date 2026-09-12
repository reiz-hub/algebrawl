import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import DeactivatedModal from '../components/DeactivatedModal';
import { useGameStore } from '../hooks/useGameStore';
import { soundService } from '../services/soundService';
import { checkAccountStatus, createUserDoc } from '../services/supabaseSync';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    JungleAdventurer: require('../assets/fonts/JungleAdventurer.ttf'),
    'JungleAdventurer-Bold': require('../assets/fonts/JungleAdventurer.ttf'),
    PressStart2P: require('../assets/fonts/PressStart2P.ttf'),
    'PressStart2P-Bold': require('../assets/fonts/PressStart2P.ttf'),
    CinzelDecorative: require('../assets/fonts/CinzelDecorativeBold.ttf'),
    CinzelDecorativeBold: require('../assets/fonts/CinzelDecorativeBold.ttf'),
    'CinzelDecorative-Bold': require('../assets/fonts/CinzelDecorativeBold.ttf'),
    Bungee: require('../assets/fonts/Bungee.ttf'),
    'Bungee-Bold': require('../assets/fonts/Bungee.ttf'),
    RussoOne: require('../assets/fonts/RussoOne.ttf'),
    'RussoOne-Bold': require('../assets/fonts/RussoOne.ttf'),
    ChakraPetch: require('../assets/fonts/ChakraPetchBold.ttf'),
    ChakraPetchBold: require('../assets/fonts/ChakraPetchBold.ttf'),
    'ChakraPetch-Bold': require('../assets/fonts/ChakraPetchBold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('[Font Error]', fontError);
    }
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const loadLocalData = useGameStore((state) => state.loadLocalData);
  const userId = useGameStore((state) => state.userId);
  const isLoggedIn = useGameStore((state) => state.isLoggedIn);
  const isLoaded = useGameStore((state) => state.isLoaded);
  const logout = useGameStore((state) => state.logout);
  const pathname = usePathname();

  const [showDeactivated, setShowDeactivated] = useState(false);

  useEffect(() => {
    loadLocalData();
    soundService.initialize();
  }, []);

  // Ensure user row exists in Supabase users table (guest or permanent)
  useEffect(() => {
    if (!isLoaded || !userId) return;
    createUserDoc(userId);
  }, [isLoaded, userId]);

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleDeactivatedLogout = async () => {
    setShowDeactivated(false);
    await logout();
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="map" />
        <Stack.Screen name="pre-battle" />
        <Stack.Screen name="battle" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
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