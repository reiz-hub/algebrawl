import React from 'react';
import { StyleSheet, View } from 'react-native';
import ShopView from '../../components/ShopView';
import TopBar from '../../components/TopBar';

export default function TabShopScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="ITEM SHOP" />
      <ShopView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
});
