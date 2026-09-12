import { Redirect } from 'expo-router';
import React from 'react';

export default function ShopScreen() {
  return <Redirect href={'/(tabs)/shop' as any} />;
}
