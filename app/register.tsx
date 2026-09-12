// app/register.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import ErrorModal from '../components/ErrorModal';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { useGameStore } from '../hooks/useGameStore';
import { soundService } from '../services/soundService';
import { supabase } from '../services/supabase';
import {
  lookupByIngameName,
  lookupByUsername,
  syncToSupabase,
} from '../services/supabaseSync';

export default function RegisterScreen() {
  const router = useRouter();
  const {
    userId,
    loginWithData,
    setUsername,
    setIngameName,
    setEmail,
  } = useGameStore();

  const [usernameInput, setUsernameInput] = useState('');
  const [ingameNameInput, setIngameNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorConfig, setErrorConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);

  const checkNetwork = async (): Promise<boolean> => {
    try {
      await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleRegister = async () => {
    soundService.playSound('click');
    const trimUser = usernameInput.trim();
    const trimIngame = (ingameNameInput.trim() || trimUser);
    const trimPass = passwordInput.trim();
    const trimConfirm = confirmPasswordInput.trim();

    if (!trimUser || trimUser.length < 3) {
      setErrorConfig({
        visible: true,
        title: 'Invalid Username',
        message: 'Username must be at least 3 characters long.',
      });
      return;
    }

    if (trimUser.length > 20) {
      setErrorConfig({
        visible: true,
        title: 'Invalid Username',
        message: 'Username cannot exceed 20 characters.',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimUser)) {
      setErrorConfig({
        visible: true,
        title: 'Invalid Username',
        message: 'Username can only contain letters, numbers, underscores, and hyphens.',
      });
      return;
    }

    if (trimIngame.length < 3 || trimIngame.length > 20) {
      setErrorConfig({
        visible: true,
        title: 'Invalid In-Game Name',
        message: 'In-game name must be between 3 and 20 characters.',
      });
      return;
    }

    if (!trimPass || trimPass.length < 6) {
      setErrorConfig({
        visible: true,
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (trimPass !== trimConfirm) {
      setErrorConfig({
        visible: true,
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please re-enter your password.',
      });
      return;
    }

    setIsLoading(true);

    const online = await checkNetwork();
    if (!online) {
      setIsLoading(false);
      setErrorConfig({
        visible: true,
        title: 'No Internet',
        message: 'Please check your internet connection and try again.',
      });
      return;
    }

    try {
      // 1. Check if username is already taken
      const existingUser = await lookupByUsername(trimUser);
      if (existingUser) {
        setIsLoading(false);
        setErrorConfig({
          visible: true,
          title: 'Username Taken',
          message: `The username "${trimUser}" is already taken. Please choose another.`,
        });
        return;
      }

      // 2. Check if ingame name is already taken
      const existingIngame = await lookupByIngameName(trimIngame);
      if (existingIngame) {
        setIsLoading(false);
        setErrorConfig({
          visible: true,
          title: 'Name Taken',
          message: `The in-game name "${trimIngame}" is already taken. Try a different one.`,
        });
        return;
      }

      const generatedEmail = `${trimUser.toLowerCase()}@algebrawls.local`;
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      let authUser: any = null;

      if (currentSession?.user?.is_anonymous) {
        // Upgrade current anonymous session so progress UUID is preserved
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          email: generatedEmail,
          password: trimPass,
          data: {
            display_name: trimUser,
            username: trimUser,
          },
        });

        if (updateError) {
          throw updateError;
        }
        authUser = updateData.user;
      } else {
        // Create new account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: generatedEmail,
          password: trimPass,
          options: {
            data: {
              display_name: trimUser,
              username: trimUser,
            },
          },
        });

        if (authError || !authData.user) {
          const msg = authError?.message || 'Registration failed.';
          if (
            msg.toLowerCase().includes('already registered') ||
            msg.toLowerCase().includes('already been registered')
          ) {
            setErrorConfig({
              visible: true,
              title: 'Account Exists',
              message: 'An account with this username already exists.',
            });
          } else {
            setErrorConfig({
              visible: true,
              title: 'Registration Error',
              message: msg,
            });
          }
          setIsLoading(false);
          return;
        }
        authUser = authData.user;
      }

      const uid = authUser?.id || userId || currentSession?.user?.id;
      const state = useGameStore.getState();

      if (uid) {
        await syncToSupabase(uid, {
          email: generatedEmail,
          username: trimUser,
          ingameName: trimIngame,
          isGuest: false,
          unlockedLevel: state.unlockedLevel,
          levelStars: state.levelStars,
          xp: state.totalXP,
          totalBattles: state.totalBattles,
          wins: state.totalBattlesWon,
          currentStreak: state.currentStreak,
          maxStreak: state.maxStreak,
          coins: state.coins,
          inventory: state.inventory,
          equippedCharacter: state.equippedCharacter,
          equippedGear: state.equippedGear,
          mmr: state.mmr,
          onlineWins: state.onlineWins,
          onlineLosses: state.onlineLosses,
        });

        loginWithData(uid, {
          email: generatedEmail,
          username: trimUser,
          ingameName: trimIngame,
          unlockedLevel: state.unlockedLevel,
          levelStars: state.levelStars,
          xp: state.totalXP,
          totalBattles: state.totalBattles,
          wins: state.totalBattlesWon,
          currentStreak: state.currentStreak,
          maxStreak: state.maxStreak,
          coins: state.coins,
          inventory: state.inventory,
          equippedCharacter: state.equippedCharacter,
          equippedGear: state.equippedGear,
          mmr: state.mmr,
          onlineWins: state.onlineWins,
          onlineLosses: state.onlineLosses,
        });
      }

      setUsername(trimUser);
      setIngameName(trimIngame);
      setEmail(generatedEmail);

      Alert.alert(
        'Account Created! 🎉',
        `Welcome, ${trimUser}! Your game account is ready and all your progress is saved.`,
        [{ text: 'CONTINUE', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      console.warn('[Register] Error:', error);
      setErrorConfig({
        visible: true,
        title: 'Registration Error',
        message: error.message || 'Unable to complete registration. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Floating Background Symbols */}
      <Text style={[styles.bgSymbol, { top: '8%', left: '8%', transform: [{ rotate: '-10deg' }] }]}>x</Text>
      <Text style={[styles.bgSymbol, { top: '22%', right: '12%', transform: [{ rotate: '20deg' }] }]}>+</Text>
      <Text style={[styles.bgSymbol, { bottom: '25%', left: '15%', transform: [{ rotate: '-15deg' }] }]}>÷</Text>
      <Text style={[styles.bgSymbol, { bottom: '8%', right: '10%', transform: [{ rotate: '10deg' }] }]}>∑</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>REGISTER</Text>
        <Text style={styles.subtitle}>Create a permanent account to save your progress</Text>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={(text) => {
                setUsernameInput(text);
                if (!ingameNameInput || ingameNameInput === usernameInput) {
                  setIngameNameInput(text);
                }
              }}
              placeholder="Enter unique username (min. 3 chars)..."
              placeholderTextColor="#b5a58d"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={styles.label}>IN-GAME NAME</Text>
            <TextInput
              style={styles.input}
              value={ingameNameInput}
              onChangeText={setIngameNameInput}
              placeholder="Display name in battles..."
              placeholderTextColor="#b5a58d"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Enter password (min. 6 chars)..."
              placeholderTextColor="#b5a58d"
              secureTextEntry
              maxLength={40}
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              placeholder="Re-enter your password..."
              placeholderTextColor="#b5a58d"
              secureTextEntry
              maxLength={40}
              autoCapitalize="none"
              editable={!isLoading}
            />

            <NeoButton
              wrapperStyle={styles.btnWrapper}
              shadowStyle={styles.btnShadow}
              style={[styles.registerBtn, isLoading && styles.registerBtnDisabled] as ViewStyle[]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
              )}
            </NeoButton>
          </View>
        </View>

        {/* Back Button */}
        <NeoButton
          wrapperStyle={styles.btnWrapper}
          shadowStyle={styles.btnShadow}
          style={styles.backBtn as ViewStyle}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>BACK</Text>
        </NeoButton>

        {/* Switch to Log In Link */}
        <TouchableOpacity
          style={styles.switchRow}
          activeOpacity={0.7}
          onPress={() => {
            soundService.playSound('click');
            router.replace('/login');
          }}
        >
          <Text style={styles.footerHint}>
            Already have an account?{' '}
            <Text style={styles.footerLink}>Log in here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ErrorModal
        visible={errorConfig?.visible || false}
        title={errorConfig?.title || ''}
        message={errorConfig?.message || ''}
        subMessage={errorConfig?.subMessage}
        onDismiss={() => setErrorConfig(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    zIndex: 10,
  },
  bgSymbol: {
    fontFamily: 'JungleAdventurer',
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 0,
  },
  title: {
    fontFamily: 'JungleAdventurer',
    fontSize: 44,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'JungleAdventurer',
    fontSize: 15,
    fontWeight: '700',
    color: '#7a6a55',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    position: 'relative',
    marginBottom: 20,
  },
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
    padding: 22,
  },
  label: {
    fontFamily: 'JungleAdventurer',
    fontSize: 13,
    fontWeight: '900',
    color: '#7a6a55',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'JungleAdventurer',
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1008',
    marginBottom: 14,
  },
  btnWrapper: {
    position: 'relative',
  },
  btnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  registerBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  registerBtnDisabled: {
    backgroundColor: '#7a6a55',
  },
  registerBtnText: {
    fontFamily: 'JungleAdventurer',
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
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: 'JungleAdventurer',
    color: '#1a1008',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  switchRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  footerHint: {
    fontFamily: 'JungleAdventurer',
    fontSize: 14,
    fontWeight: '600',
    color: '#7a6a55',
    textAlign: 'center',
  },
  footerLink: {
    color: '#1a6cf5',
    textDecorationLine: 'underline',
    fontWeight: '900',
  },
});
