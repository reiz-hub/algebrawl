import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ShopView from '../components/ShopView';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';

export default function ShopScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/map');
          }
        }}>
          <Text style={styles.backBtnText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ITEM SHOP</Text>
        <View style={{ width: 65 }} />
      </View>
      <ShopView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#1a1008',
    backgroundColor: '#1a1008',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5a623',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  backBtnText: {
    fontFamily: GameFonts.brawl,
    color: '#1a1008',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: GameFonts.brawl,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
