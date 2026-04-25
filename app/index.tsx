// app/index.tsx
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '15%', left: '15%', transform: [{ rotate: '-10deg' }] }]}>-</Text>
      <Text style={[styles.bgSymbol, { top: '45%', left: '10%', transform: [{ rotate: '15deg' }] }]}>x²</Text>
      <Text style={[styles.bgSymbol, { bottom: '20%', left: '20%', transform: [{ rotate: '-5deg' }] }]}>×</Text>
      
      <Text style={[styles.bgSymbol, { top: '20%', right: '15%', transform: [{ rotate: '10deg' }] }]}>∑</Text>
      <Text style={[styles.bgSymbol, { top: '50%', right: '10%', transform: [{ rotate: '-15deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', right: '15%', transform: [{ rotate: '5deg' }] }]}>÷</Text>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>ALGEBRAWL</Text>
        <Text style={styles.subtitle}>Math Battle Arena</Text>
        
        <View style={styles.buttonContainer}>
          
          {/* Primary Button: Start Adventure */}
          <View style={styles.btnWrapper}>
            <View style={styles.btnShadow} />
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.btnPrimary} 
              onPress={() => router.push('/map')}
            >
              <Text style={styles.btnPrimaryText}>Start Adventure</Text>
            </TouchableOpacity>
          </View>
          
          {/* Versus Button */}
          <View style={styles.btnWrapper}>
            <View style={styles.btnShadow} />
            <TouchableOpacity style={styles.btnVersus} onPress={() => router.push('/versus')}>
              <Text style={styles.btnVersusText}>Versus</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary Button: Player Stats */}
          <View style={styles.btnWrapper}>
            <View style={styles.btnShadow} />
            <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/stats')}>
              <Text style={styles.btnSecondaryText}>Player Stats</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff9f0', 
    overflow: 'hidden' 
  },
  bgSymbol: { 
    position: 'absolute', 
    fontSize: 50, 
    fontWeight: '900', 
    color: '#e5d9c4', 
    opacity: 0.6 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10 
  },
  title: { 
    fontSize: 60, 
    fontWeight: '900', 
    color: '#1a1008', 
    marginBottom: 5, 
    letterSpacing: 2 
  },
  subtitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#7a6a55', 
    marginBottom: 60 
  },
  buttonContainer: { 
    width: '85%', 
    maxWidth: 320, 
    gap: 24 
  },
  btnWrapper: { 
    position: 'relative', 
    width: '100%' 
  },
  btnShadow: { 
    position: 'absolute', 
    top: 6, 
    left: 6, 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#1a1008', 
    borderRadius: 16 
  },
  btnPrimary: { 
    backgroundColor: '#e8302a', 
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
  },
  btnPrimaryText: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  btnVersus: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center'
  },
  btnVersusText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  btnSecondary: { 
    backgroundColor: '#f5a623', 
    borderWidth: 3, 
    borderColor: '#1a1008', 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  btnSecondaryText: { 
    color: '#1a1008', 
    fontSize: 22, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  }
});
