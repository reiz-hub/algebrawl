import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import BottomNavBar from '../../components/BottomNavBar';

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    const onHardwareBack = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [router]);

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
