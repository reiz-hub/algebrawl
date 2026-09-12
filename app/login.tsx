// app/login.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import ErrorModal from '../components/ErrorModal';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { useGameStore } from '../hooks/useGameStore';
import { soundService } from '../services/soundService';
import { supabase } from '../services/supabase';
import { fetchFromSupabase, lookupByEmail, lookupByUsername } from '../services/supabaseSync';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithData, setUsername, setIngameName, setEmail } = useGameStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorConfig, setErrorConfig] = useState<{ visible: boolean; title: string; message: string; subMessage?: string } | null>(null);

  const checkNetwork = async (): Promise<boolean> => {
    try {
      await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  };

  const handleLogin = async () => {
    const trimmed = usernameInput.trim();
    const trimPass = passwordInput.trim();

    if (!trimmed) {
      setErrorConfig({
        visible: true,
        title: 'Invalid Input',
        message: 'Please enter your username or email.',
      });
      return;
    }
    if (!trimPass) {
      setErrorConfig({
        visible: true,
        title: 'Invalid Input',
        message: 'Please enter your password.',
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
      let targetEmail = trimmed;
      const isEmailInput = trimmed.includes('@');
      let fallbackEmail: string | null = null;
      let emailUserFound: any = null;

      if (isEmailInput) {
        emailUserFound = await lookupByEmail(trimmed);
        if (emailUserFound && emailUserFound.data.username) {
          fallbackEmail = `${emailUserFound.data.username.toLowerCase()}@algebrawls.local`;
        }
      } else {
        const found = await lookupByUsername(trimmed);
        if (found && found.data.email) {
          targetEmail = found.data.email;
        } else {
          targetEmail = `${trimmed.toLowerCase()}@algebrawls.local`;
        }
      }

      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: trimPass,
      });

      // If direct email auth failed and we have an internal fallback email for this user
      if ((authError || !authData?.user) && fallbackEmail) {
        const fallbackRes = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password: trimPass,
        });
        if (fallbackRes.data?.user) {
          authData = fallbackRes.data;
          authError = null;
        }
      }

      if (authError || !authData?.user) {
        const msg = authError?.message?.toLowerCase() || '';
        setIsLoading(false);

        if (isEmailInput) {
          if (!emailUserFound) {
            setErrorConfig({
              visible: true,
              title: 'Account Not Found',
              message: `No account found linked to "${trimmed}".`,
              subMessage: 'Please check your spelling or register a new account.',
            });
            return;
          }
        } else {
          const userExists = await lookupByUsername(trimmed);
          if (!userExists) {
            setErrorConfig({
              visible: true,
              title: 'Account Not Found',
              message: `No account found with username "${trimmed}".`,
              subMessage: 'Please check your spelling or register a new account.',
            });
            return;
          }
        }

        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          setErrorConfig({
            visible: true,
            title: 'Login Failed',
            message: 'Incorrect password or credentials.',
            subMessage: 'Please double-check your password and try again.',
          });
        } else if (msg.includes('email not confirmed')) {
          setErrorConfig({
            visible: true,
            title: 'Email Not Verified',
            message: 'Please verify your email address before logging in.',
          });
        } else {
          setErrorConfig({
            visible: true,
            title: 'Login Failed',
            message: authError?.message || 'Unable to log in. Please try again.',
          });
        }
        return;
      }

      const uid = authData.user.id;
      const cloudData = await fetchFromSupabase(uid);

      if (cloudData && (cloudData as any).isActive === false) {
        await supabase.auth.signOut();
        setIsLoading(false);
        setErrorConfig({
          visible: true,
          title: 'Account Deactivated',
          message: 'Your account has been deactivated by an administrator.',
          subMessage: 'Please contact support if you believe this is a mistake.',
        });
        return;
      }

      const resolvedUser = cloudData?.username || trimmed;
      const userEmail = authData.user.email || cloudData?.email || null;

      loginWithData(uid, {
        email: userEmail ?? undefined,
        username: resolvedUser,
        ingameName: cloudData?.ingameName ?? undefined,
        unlockedLevel: cloudData?.unlockedLevel ?? 1,
        levelStars: cloudData?.levelStars ?? {},
        xp: cloudData?.xp ?? 0,
        totalBattles: cloudData?.totalBattles ?? 0,
        wins: cloudData?.wins ?? 0,
        currentStreak: cloudData?.currentStreak ?? 0,
        maxStreak: cloudData?.maxStreak ?? 0,
        coins: cloudData?.coins ?? 100,
        inventory: cloudData?.inventory ?? ['char_algebro'],
        equippedCharacter: cloudData?.equippedCharacter ?? 'char_algebro',
        equippedGear: cloudData?.equippedGear ?? null,
        mmr: cloudData?.mmr ?? 1000,
        onlineWins: cloudData?.onlineWins ?? 0,
        onlineLosses: cloudData?.onlineLosses ?? 0,
      });

      setUsername(resolvedUser);
      if (cloudData?.ingameName) setIngameName(cloudData.ingameName);
      if (userEmail) setEmail(userEmail);

      Alert.alert(
        'Welcome Back!',
        `Logged in as "${resolvedUser}". Your progress has been restored.`,
        [{ text: 'OK', onPress: () => router.replace('/') }],
      );
    } catch (error: any) {
      console.warn('[Login] Error:', error);
      setErrorConfig({
        visible: true,
        title: 'Error',
        message: error.message || 'Something went wrong.',
        subMessage: 'Please check your internet connection and try again.',
      });
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
        <Text style={styles.subtitle}>Enter your username and password to restore your progress</Text>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>USERNAME OR EMAIL</Text>
            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Enter username or email..."
              placeholderTextColor="#b5a58d"
              maxLength={40}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Enter password..."
              placeholderTextColor="#b5a58d"
              secureTextEntry
              maxLength={40}
              autoCapitalize="none"
              editable={!isLoading}
            />

            <NeoButton
              wrapperStyle={styles.btnWrapper}
              shadowStyle={styles.btnShadow}
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled] as ViewStyle[]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>LOG IN</Text>
              )}
            </NeoButton>
          </View>
        </View>

        {/* Back / Guest */}
        <NeoButton
          wrapperStyle={styles.btnWrapper}
          shadowStyle={styles.btnShadow}
          style={styles.backBtn as ViewStyle}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>BACK</Text>
        </NeoButton>

        <TouchableOpacity
          onPress={() => {
            soundService.playSound('click');
            router.replace('/register');
          }}
          style={{ marginTop: 24, alignItems: 'center' }}
          activeOpacity={0.7}
        >
          <Text style={styles.footerHint}>
            {"Don't"} have an account?{' '}
            <Text style={styles.footerLink}>Register here</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorModal
        visible={errorConfig?.visible || false}
        title={errorConfig?.title || ''}
        message={errorConfig?.message || ''}
        subMessage={errorConfig?.subMessage}
        onDismiss={() => setErrorConfig(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0', overflow: 'hidden' },
  bgSymbol: {
    fontFamily: 'JungleAdventurer',
    position: 'absolute',
    fontSize: 60,
    fontWeight: '900',
    color: '#e5d9c4',
    opacity: 0.3,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  title: {
    fontFamily: 'JungleAdventurer',
    fontSize: 48,
    fontWeight: '900',
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'JungleAdventurer',
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
    fontFamily: 'JungleAdventurer',
    fontSize: 14,
    fontWeight: '900',
    color: '#7a6a55',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'JungleAdventurer',
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  backBtnText: {
    fontFamily: 'JungleAdventurer',
    color: '#1a1008',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerHint: {
    fontFamily: 'JungleAdventurer',
    fontSize: 13,
    fontWeight: '600',
    color: '#7a6a55',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  footerLink: {
    color: '#1a6cf5',
    textDecorationLine: 'underline',
    fontWeight: '900',
  },
});
