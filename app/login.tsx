// app/login.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { lookupByUsername } from '../services/firestoreSync';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithData } = useGameStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Please enter a username.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await lookupByUsername(trimmed);

      if (!result) {
        Alert.alert(
          'Not Found',
          'No account found with that username. Check spelling or create a new account from the Profile screen.',
        );
        setIsLoading(false);
        return;
      }

      // Restore progress from the found account
      loginWithData(result.userId, result.data);

      Alert.alert(
        'Welcome Back!',
        `Logged in as "${trimmed}". Your progress has been restored.`,
        [{ text: 'OK', onPress: () => router.replace('/') }],
      );
    } catch (error) {
      console.warn('[Login] Error:', error);
      Alert.alert('Error', 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '10%', left: '10%', transform: [{ rotate: '-10deg' }] }]}>x</Text>
      <Text style={[styles.bgSymbol, { top: '30%', right: '15%', transform: [{ rotate: '20deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '30%', left: '20%', transform: [{ rotate: '-15deg' }] }]}>÷</Text>
      <Text style={[styles.bgSymbol, { bottom: '10%', right: '10%', transform: [{ rotate: '10deg' }] }]}>∑</Text>

      <View style={styles.content}>
        <Text style={styles.title}>LOG IN</Text>
        <Text style={styles.subtitle}>Enter your username to restore your progress</Text>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Enter your username..."
              placeholderTextColor="#b5a58d"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <View style={styles.btnWrapper}>
              <View style={styles.btnShadow} />
              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>LOG IN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Back / Guest */}
        <View style={styles.btnWrapper}>
          <View style={styles.btnShadow} />
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>BACK</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>
          Don't have an account? Just play as a guest and claim a username from the Profile screen later.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0', overflow: 'hidden' },
  bgSymbol: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: { position: 'relative', marginBottom: 24 },
  cardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  cardInner: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7a6a55',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 16,
  },
  btnWrapper: { position: 'relative' },
  btnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  loginBtn: {
    backgroundColor: '#e8302a',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnDisabled: {
    backgroundColor: '#7a6a55',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  backBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#1a1008',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7a6a55',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
