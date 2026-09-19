import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import BottomNavBar from '../../components/BottomNavBar';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onHardwareBack = () => {
      // If on shop tab, shop.tsx handles it (e.g. returning to pre-battle if entered from there)
      if (pathname && pathname.includes('shop')) {
        return false;
      }
      // If on dungeon tab, dungeon.tsx handles its own subtabs and home navigation
      if (pathname && pathname.includes('dungeon')) {
        return false;
      }
      // For other secondary tabs (settings, ranking, profile), return to dungeon hub
      if (pathname) {
        router.replace('/(tabs)/dungeon' as any);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [router, pathname]);

  return (
    <Tabs
      initialRouteName="dungeon"
      backBehavior="none"
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'SHOP',
        }}
      />
      <Tabs.Screen
        name="dungeon"
        options={{
          title: 'DUNGEON',
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'RANKING',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
        }}
      />
    </Tabs>
  );
}
