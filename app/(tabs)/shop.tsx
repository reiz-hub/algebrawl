import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import ShopView from '../../components/ShopView';
import TopBar from '../../components/TopBar';

export default function TabShopScreen() {
  const router = useRouter();
  const { from, pbLevel, pbQuestions, pbTime, pbDifficulty } = useLocalSearchParams<{
    from?: string;
    pbLevel?: string;
    pbQuestions?: string;
    pbTime?: string;
    pbDifficulty?: string;
  }>();

  const isFromPreBattle = from === 'pre-battle';

  const handleBack = () => {
    if (isFromPreBattle) {
      router.replace({
        pathname: '/pre-battle' as any,
        params: {
          level: pbLevel || '1',
          questions: pbQuestions || '10',
          timePerQuestion: pbTime || '30',
          difficulty: pbDifficulty || '',
        },
      });
    } else {
      router.replace('/(tabs)/dungeon' as any);
    }
  };

  // Hardware back button: return to pre-battle if came from there
  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isFromPreBattle, pbLevel, pbQuestions, pbTime, pbDifficulty]);

  return (
    <View style={styles.container}>
      <TopBar title="ITEM SHOP" onBack={handleBack} />
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
