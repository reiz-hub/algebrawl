import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ErrorModal from '../../components/ErrorModal';
import TopBar from '../../components/TopBar';
import TouchableOpacity from '../../components/TouchableOpacity';
import { GameFonts } from '../../constants/theme';
import { useGameStore } from '../../hooks/useGameStore';
import { soundService } from '../../services/soundService';
import { STARTING_MMR } from '../../services/mmrService';
import { supabase } from '../../services/supabase';
import { IS_DEV_BUILD } from '../../constants/devMode';
import {
  fetchFromSupabase,
  lookupByEmail,
  lookupByIngameName,
  lookupByUsername,
  resolveLoginEmails,
  syncToSupabase,
} from '../../services/supabaseSync';
import { sendEmailLinkedNotification } from '../../services/emailService';

/* ── Neo-Brutalist Success Popup ── */
interface SuccessPopupProps {
  visible: boolean;
  icon: string;
  title: string;
  message: string;
  onDismiss: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ visible, icon, title, message, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      ]).start();
      timerRef.current = setTimeout(() => onDismiss(), 3000);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[ps.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[ps.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={ps.shadow} />
          <View style={ps.card}>
            {!!icon && <Text style={ps.icon}>{icon}</Text>}
            <Text style={ps.title}>{title}</Text>
            <Text style={ps.message}>{message}</Text>
            <View style={ps.btnWrap}>
              <View style={ps.btnShadow} />
              <TouchableOpacity style={ps.btn} onPress={onDismiss} activeOpacity={0.8}>
                <Text style={ps.btnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function TabSettingsScreen() {
  const router = useRouter();
  const {
    userId,
    isLoggedIn,
    username,
    email,
    loginWithData,
    setUsername,
    setIngameName,
    setEmail,
    logout,
    devModeEnabled,
    toggleDevMode,
  } = useGameStore();

  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auth Modals state
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showIngameModal, setShowIngameModal] = useState(false);
  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Form fields
  const [formUser, setFormUser] = useState('');
  const [formPass, setFormPass] = useState('');
  const [formIngameName, setFormIngameName] = useState('');
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingLinkEmail, setPendingLinkEmail] = useState<string | null>(null);

  // Popups & alerts
  const [errorConfig, setErrorConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);

  const [popup, setPopup] = useState<{ visible: boolean; icon: string; title: string; message: string }>({
    visible: false,
    icon: '',
    title: '',
    message: '',
  });

  const showPopup = useCallback((icon: string, title: string, message: string) => {
    setPopup({ visible: true, icon, title, message });
  }, []);

  const hidePopup = useCallback(() => {
    setPopup((p) => ({ ...p, visible: false }));
  }, []);

  const isKeyboardVisibleRef = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => { isKeyboardVisibleRef.current = true; }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => { isKeyboardVisibleRef.current = false; }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleModalClose = (closeFn: () => void) => {
    Keyboard.dismiss();
    closeFn();
  };

  const handleModalRequestClose = (closeFn: () => void) => {
    if (isKeyboardVisibleRef.current) {
      Keyboard.dismiss();
      return;
    }
    handleModalClose(closeFn);
  };

  useEffect(() => {
    setMusicEnabled(soundService.getMusicEnabled());
    setSoundEnabled(soundService.getSoundEnabled());
  }, []);

  const handleToggleMusic = async () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    await soundService.setMusicEnabled(newValue);
  };

  const handleToggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await soundService.setSoundEnabled(newValue);
  };

  const handleDevUnlockAll = () => {
    useGameStore.getState().unlockAllDev();
    Alert.alert(
      'DEV MODE 🔓',
      'All levels (1-7), characters, gears, skills, and 9,999 coins have been unlocked!'
    );
  };

  const resetForm = () => {
    setFormUser('');
    setFormPass('');
    setFormIngameName('');
    setLinkEmailInput('');
    setOtpCode('');
    setNameSuggestions([]);
    setPendingLinkEmail(null);
  };

  const generateSuggestions = () => {
    const prefixes = ['Math', 'Alge', 'Calc', 'Number', 'Prime', 'Sigma', 'Geo'];
    const suffixes = ['Wiz', 'Bro', 'Ninja', 'King', 'Master', 'Star'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const suggestions = Array.from(
      { length: 3 },
      () => `${pick(prefixes)}${pick(suffixes)}${Math.floor(Math.random() * 99)}`
    );
    setNameSuggestions(suggestions);
  };

  const checkNetwork = async (): Promise<boolean> => {
    try {
      await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  };

  /* ── Register: Step 1 ── */
  const handleRegisterNext = async () => {
    soundService.playSound('click');
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();

    if (!trimUser || trimUser.length < 3) {
      setErrorConfig({ visible: true, title: 'Invalid Username', message: 'Username must be at least 3 characters.' });
      return;
    }
    if (!trimPass || trimPass.length < 6) {
      setErrorConfig({ visible: true, title: 'Invalid Password', message: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    const online = await checkNetwork();
    if (!online) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'No Internet', message: 'Please check your internet connection and try again.' });
      return;
    }

    const existingUser = await lookupByUsername(trimUser);
    setLoading(false);

    if (existingUser) {
      setErrorConfig({ visible: true, title: 'Username Taken', message: 'That username is already registered. Try a different one.' });
      return;
    }

    setShowRegister(false);
    setShowIngameModal(true);
  };

  /* ── Register: Step 2 ── */
  const handleRegisterSubmit = async () => {
    soundService.playSound('click');
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();
    const trimIngame = formIngameName.trim() || trimUser;

    if (!trimIngame) {
      setErrorConfig({ visible: true, title: 'Invalid Name', message: 'Ingame name cannot be empty.' });
      return;
    }

    setLoading(true);

    const existingIngame = await lookupByIngameName(trimIngame);
    if (existingIngame) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'Name Taken', message: 'That ingame name is already taken. Try a different one.' });
      return;
    }

    try {
      const generatedEmail = `${trimUser.toLowerCase()}@algebrawls.local`;
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      let authUser: any = null;

      if (currentSession?.user?.is_anonymous) {
        // Upgrade existing anonymous guest account without losing UUID!
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
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
            setErrorConfig({ visible: true, title: 'Username Taken', message: 'An account with this username already exists.' });
          } else {
            setErrorConfig({ visible: true, title: 'Registration Error', message: msg });
          }
          setLoading(false);
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

      setShowIngameModal(false);
      resetForm();
      showPopup('🎉', 'Account Created!', `Welcome, ${trimUser}! Your game account is ready.`);
    } catch (error: any) {
      console.warn('[Registration] Error:', error);
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Log In ── */
  const handleLogin = async () => {
    soundService.playSound('click');
    const input = formUser.trim();
    const trimPass = formPass.trim();

    if (!input) {
      setErrorConfig({ visible: true, title: 'Invalid', message: 'Please enter your username or email.' });
      return;
    }
    if (!trimPass) {
      setErrorConfig({ visible: true, title: 'Invalid', message: 'Please enter a password.' });
      return;
    }

    setLoading(true);
    const online = await checkNetwork();
    if (!online) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'No Internet', message: 'Please check your internet connection and try again.' });
      return;
    }

    try {
      const isEmailInput = input.includes('@');
      const { candidates, userRecord } = await resolveLoginEmails(input);

      if (candidates.length === 0) {
        setLoading(false);
        setErrorConfig({
          visible: true,
          title: 'Account Not Found',
          message: isEmailInput
            ? `No account found linked to "${input}".`
            : `No account found with username "${input}".`,
          subMessage: 'Please check your spelling or register a new account.',
        });
        return;
      }

      let authData: any = null;
      let authError: any = null;

      // Try each candidate email in priority order (true auth email from RPC comes first)
      for (const emailCandidate of candidates) {
        const res = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password: trimPass,
        });
        if (res.data?.user && !res.error) {
          authData = res.data;
          authError = null;
          break;
        }
        authError = res.error;
      }

      if (authError || !authData?.user) {
        const msg = authError?.message?.toLowerCase() || '';
        setLoading(false);

        if (!userRecord && !isEmailInput) {
          setErrorConfig({
            visible: true,
            title: 'Account Not Found',
            message: `No account found with username "${input}".`,
            subMessage: 'Please check your spelling or register a new account.',
          });
          return;
        }

        if (!userRecord && isEmailInput) {
          setErrorConfig({
            visible: true,
            title: 'Account Not Found',
            message: `No account found linked to "${input}".`,
            subMessage: 'Please check your spelling or register a new account.',
          });
          return;
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
        setErrorConfig({ visible: true, title: 'Account Deactivated', message: 'Your account has been deactivated by an administrator.' });
        setLoading(false);
        return;
      }

      if (!cloudData?.email && authData.user.email) {
        await supabase.from('users').update({ email: authData.user.email }).eq('id', uid);
      }

      const resolvedUser = cloudData?.username || input;
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
        mmr: cloudData?.mmr ?? STARTING_MMR,
        onlineWins: cloudData?.onlineWins ?? 0,
        onlineLosses: cloudData?.onlineLosses ?? 0,
      });

      setUsername(resolvedUser);
      if (cloudData?.ingameName) setIngameName(cloudData.ingameName);
      if (userEmail) setEmail(userEmail);

      setShowLogin(false);
      resetForm();
      showPopup('🎉', 'Welcome Back!', `Welcome back, ${resolvedUser}! Your progress has been restored.`);
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Link Email ── */
  const handleLinkGmail = async () => {
    soundService.playSound('click');
    const trimEmail = linkEmailInput.trim().toLowerCase();

    if (!trimEmail || !trimEmail.includes('@') || !trimEmail.includes('.')) {
      setErrorConfig({ visible: true, title: 'Invalid Email', message: 'Please enter a valid email address (e.g. user@gmail.com).' });
      return;
    }

    if (trimEmail.endsWith('@algebrawls.local')) {
      setErrorConfig({ visible: true, title: 'Invalid Email', message: 'Please provide a valid personal email address.' });
      return;
    }

    setLoading(true);
    const online = await checkNetwork();
    if (!online) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'No Internet', message: 'Please check your internet connection and try again.' });
      return;
    }

    const existing = await lookupByEmail(trimEmail);
    if (existing && existing.userId !== userId) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'Email Taken', message: 'That email is already linked to another game account.' });
      return;
    }

    try {
      const uid = userId || (await supabase.auth.getUser()).data?.user?.id;

      if (uid) {
        await syncToSupabase(uid, { email: trimEmail });
      }

      await supabase.auth.updateUser({
        data: { linked_email: trimEmail },
      });

      try {
        await supabase.auth.updateUser({ email: trimEmail });
      } catch (authErr) {
        console.warn('[handleLinkGmail] Supabase email update notice:', authErr);
      }

      setEmail(trimEmail);
      setShowLinkEmailModal(false);
      setLinkEmailInput('');
      showPopup('🎉', 'Email Linked!', `Your account is now securely linked to ${trimEmail}.`);

      sendEmailLinkedNotification(trimEmail, username || 'Player');
    } catch (err: any) {
      console.warn('[handleLinkGmail] error:', err);
      setErrorConfig({ visible: true, title: 'Error', message: err.message || 'Failed to link email.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify OTP ── */
  const handleVerifyOtp = async () => {
    soundService.playSound('click');
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorConfig({ visible: true, title: 'Invalid Code', message: 'Please enter the 6-digit OTP code sent to your email.' });
      return;
    }

    const targetEmail = pendingLinkEmail;
    if (!targetEmail) {
      setErrorConfig({ visible: true, title: 'Error', message: 'Session expired. Please try again.' });
      return;
    }

    setLoading(true);
    try {
      let { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanCode,
        type: 'email_change',
      });

      if (verifyError || !verifyData?.user) {
        const { data: altData, error: altError } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: cleanCode,
          type: 'email',
        });

        if (altError || !altData?.user) {
          setErrorConfig({ visible: true, title: 'Verification Failed', message: verifyError?.message || altError?.message || 'Invalid verification code.' });
          setLoading(false);
          return;
        }
        verifyData = altData;
      }

      const uid = verifyData.user?.id || userId;
      if (uid) {
        await syncToSupabase(uid, { email: targetEmail });
      }
      setEmail(targetEmail);
      setShowOtpModal(false);
      resetForm();
      showPopup('🎉', 'Email Verified!', `Your account is now linked to ${targetEmail}.`);
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = pendingLinkEmail;
    if (!targetEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'email_change',
        email: targetEmail,
      });
      if (error) {
        setErrorConfig({ visible: true, title: 'Resend Failed', message: error.message });
      } else {
        showPopup('📧', 'Code Sent!', `A new verification code has been sent to ${targetEmail}`);
      }
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Failed to resend code.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    soundService.playSound('click');
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    resetForm();
    showPopup('👋', 'Logged Out', 'Logged out successfully. Starting fresh as Guest User.');
  };

  /* ── Modal: Register Step 1 ── */
  const renderRegisterModal = () => (
    <Modal visible={showRegister} transparent animationType="fade" onRequestClose={() => handleModalRequestClose(() => { setShowRegister(false); resetForm(); })}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={ms.overlay}
      >
        <ScrollView
          contentContainerStyle={ms.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[ms.card, ms.elevatedModalCard]}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>CREATE GAME ACCOUNT</Text>
              <Text style={{ fontFamily: GameFonts.hud, fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16 }}>
                Save all guest progress across devices with a username and password!
              </Text>

              <Text style={ms.label}>USERNAME</Text>
              <TextInput
                style={ms.input}
                value={formUser}
                onChangeText={setFormUser}
                placeholder="Enter username..."
                placeholderTextColor="#b5a58d"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={ms.label}>PASSWORD</Text>
              <TextInput
                style={ms.input}
                value={formPass}
                onChangeText={setFormPass}
                placeholder="Enter password (min. 6 chars)..."
                placeholderTextColor="#b5a58d"
                secureTextEntry
                maxLength={40}
                autoCapitalize="none"
                editable={!loading}
              />

              <View style={ms.btnRow}>
                <TouchableOpacity
                  style={ms.cancelBtn}
                  onPress={() => handleModalClose(() => { setShowRegister(false); resetForm(); })}
                  disabled={loading}
                >
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity
                    style={[ms.submitBtn, loading && ms.submitBtnDisabled, { backgroundColor: '#22c55e' }]}
                    onPress={handleRegisterNext}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>NEXT</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  /* ── Modal: Register Step 2 (Choose Ingame Name) ── */
  const renderIngameModal = () => (
    <Modal visible={showIngameModal} transparent animationType="fade" onRequestClose={() => handleModalRequestClose(() => { setShowIngameModal(false); resetForm(); })}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={ms.overlay}
      >
        <ScrollView
          contentContainerStyle={ms.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[ms.card, ms.elevatedModalCard]}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>CHOOSE INGAME NAME</Text>
              <Text style={{ fontFamily: GameFonts.hud, fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16 }}>
                This is the name other players see in battle:
              </Text>

              <Text style={ms.label}>INGAME NAME</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: nameSuggestions.length > 0 ? 8 : 12 }}>
                <TextInput
                  style={[ms.input, { flex: 1, marginBottom: 0 }]}
                  value={formIngameName}
                  onChangeText={setFormIngameName}
                  placeholder="Enter ingame name..."
                  placeholderTextColor="#b5a58d"
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity style={ms.suggestBtn} onPress={generateSuggestions} disabled={loading}>
                  <Text style={ms.suggestBtnText}>SUGGEST</Text>
                </TouchableOpacity>
              </View>
              {nameSuggestions.length > 0 && (
                <View style={ms.chipsContainer}>
                  {nameSuggestions.map((sugg) => (
                    <TouchableOpacity key={sugg} style={ms.chip} onPress={() => setFormIngameName(sugg)}>
                      <Text style={ms.chipText}>{sugg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={ms.btnRow}>
                <TouchableOpacity
                  style={ms.cancelBtn}
                  onPress={() => handleModalClose(() => { setShowIngameModal(false); resetForm(); })}
                  disabled={loading}
                >
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity
                    style={[ms.submitBtn, loading && ms.submitBtnDisabled, { backgroundColor: '#22c55e' }]}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>REGISTER</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  /* ── Modal: Log In ── */
  const renderLoginModal = () => (
    <Modal visible={showLogin} transparent animationType="fade" onRequestClose={() => handleModalRequestClose(() => { setShowLogin(false); resetForm(); })}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={ms.overlay}
      >
        <ScrollView
          contentContainerStyle={ms.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[ms.card, ms.elevatedModalCard]}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>LOG IN</Text>

              <Text style={ms.label}>USERNAME OR EMAIL</Text>
              <TextInput
                style={ms.input}
                value={formUser}
                onChangeText={setFormUser}
                placeholder="Username or Email..."
                placeholderTextColor="#b5a58d"
                maxLength={40}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={ms.label}>PASSWORD</Text>
              <TextInput
                style={ms.input}
                value={formPass}
                onChangeText={setFormPass}
                placeholder="Enter password..."
                placeholderTextColor="#b5a58d"
                secureTextEntry
                maxLength={40}
                autoCapitalize="none"
                editable={!loading}
              />

              <View style={ms.btnRow}>
                <TouchableOpacity
                  style={ms.cancelBtn}
                  onPress={() => handleModalClose(() => { setShowLogin(false); resetForm(); })}
                  disabled={loading}
                >
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity
                    style={[ms.submitBtn, loading && ms.submitBtnDisabled, { backgroundColor: '#1a6cf5' }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>LOG IN</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  /* ── Modal: Link Email ── */
  const renderLinkEmailModal = () => (
    <Modal visible={showLinkEmailModal} transparent animationType="fade" onRequestClose={() => handleModalRequestClose(() => { setShowLinkEmailModal(false); setLinkEmailInput(''); })}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={ms.overlay}
      >
        <ScrollView
          contentContainerStyle={ms.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[ms.card, ms.elevatedModalCard]}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>LINK EMAIL</Text>
              <Text style={{ fontFamily: GameFonts.hud, fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
                Link your legit Gmail or personal email for password recovery and account security.
              </Text>

              <Text style={ms.label}>REAL EMAIL ADDRESS</Text>
              <TextInput
                style={ms.input}
                value={linkEmailInput}
                onChangeText={setLinkEmailInput}
                placeholder="user@gmail.com..."
                placeholderTextColor="#b5a58d"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <View style={ms.btnRow}>
                <TouchableOpacity
                  style={ms.cancelBtn}
                  onPress={() => handleModalClose(() => { setShowLinkEmailModal(false); setLinkEmailInput(''); })}
                  disabled={loading}
                >
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity
                    style={[ms.submitBtn, loading && ms.submitBtnDisabled, { backgroundColor: '#1a6cf5' }]}
                    onPress={handleLinkGmail}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>LINK EMAIL</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  /* ── Modal: OTP Verification ── */
  const renderOtpModal = () => (
    <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => handleModalRequestClose(() => { setShowOtpModal(false); resetForm(); })}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={ms.overlay}
      >
        <ScrollView
          contentContainerStyle={ms.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[ms.card, ms.elevatedModalCard]}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>ENTER VERIFICATION CODE</Text>
              <Text style={{ fontFamily: GameFonts.hud, fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16 }}>
                A 6-digit OTP code was sent to{'\n'}
                <Text style={{ fontWeight: '900', color: '#1a1008' }}>{pendingLinkEmail}</Text>
              </Text>

              <Text style={ms.label}>6-DIGIT OTP CODE</Text>
              <TextInput
                style={[ms.input, { textAlign: 'center', letterSpacing: 6, fontSize: 22 }]}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="123456"
                placeholderTextColor="#b5a58d"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
                <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                  <Text style={{ fontFamily: GameFonts.hud, fontSize: 12, fontWeight: '900', color: '#f5a623', textDecorationLine: 'underline' }}>
                    Didn&apos;t receive code? Resend OTP
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={ms.btnRow}>
                <TouchableOpacity
                  style={ms.cancelBtn}
                  onPress={() => handleModalClose(() => { setShowOtpModal(false); resetForm(); })}
                  disabled={loading}
                >
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity
                    style={[ms.submitBtn, loading && ms.submitBtnDisabled, { backgroundColor: '#22c55e' }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>VERIFY OTP</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <TopBar title="SETTINGS" onBack={() => router.replace('/(tabs)/dungeon' as any)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadow} />
          <View style={styles.cardContent}>
            <Text style={styles.cardSectionHeader}>ACCOUNT</Text>

            {isLoggedIn ? (
              <View style={{ gap: 12 }}>
                <View style={styles.signedInCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#22c55e' }]}>
                    <Feather name="user-check" size={18} color="#fff" />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.statusDot} />
                      <Text style={styles.signedInBadgeText}>SIGNED IN AS</Text>
                    </View>
                    <Text style={styles.signedInUsername}>
                      {username ? username.toUpperCase() : 'PLAYER'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {email && !email.endsWith('@algebrawls.local') ? `Linked: ${email}` : 'Game Account'}
                    </Text>
                  </View>
                </View>

                {/* Link Email Button (if not linked to a real email) */}
                {(!email || email.endsWith('@algebrawls.local')) && (
                  <TouchableOpacity
                    style={[styles.logoutRow, { borderColor: '#1a6cf5' }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      soundService.playSound('click');
                      setLinkEmailInput('');
                      setShowLinkEmailModal(true);
                    }}
                  >
                    <View style={[styles.iconBox, { backgroundColor: '#1a6cf5' }]}>
                      <Feather name="mail" size={18} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.toggleTitle, { color: '#1a6cf5' }]}>LINK EMAIL</Text>
                      <Text style={styles.toggleSub}>Add a real email for account recovery</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#1a6cf5" />
                  </TouchableOpacity>
                )}

                {/* Log Out Button */}
                <TouchableOpacity
                  style={[styles.logoutRow, { borderColor: '#e8302a' }]}
                  activeOpacity={0.8}
                  onPress={handleLogout}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#e8302a' }]}>
                    <Feather name="log-out" size={18} color="#fff" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.toggleTitle, { color: '#e8302a' }]}>LOG OUT</Text>
                    <Text style={styles.toggleSub}>Sign out and switch to guest mode</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#e8302a" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.signedInCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#7a6a55' }]}>
                    <Feather name="user" size={18} color="#fff" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.signedInBadgeText}>CURRENT STATUS</Text>
                    <Text style={styles.signedInUsername}>GUEST PLAYER</Text>
                    <Text style={styles.toggleSub}>Save your progress across devices</Text>
                  </View>
                </View>

                {/* Log In Button */}
                <TouchableOpacity
                  style={[styles.logoutRow, { borderColor: '#1a6cf5' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    soundService.playSound('click');
                    resetForm();
                    setShowLogin(true);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#1a6cf5' }]}>
                    <Feather name="log-in" size={18} color="#fff" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.toggleTitle, { color: '#1a6cf5' }]}>LOG IN</Text>
                    <Text style={styles.toggleSub}>Sign in to restore existing account & progress</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#1a6cf5" />
                </TouchableOpacity>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.logoutRow, { borderColor: '#22c55e' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    soundService.playSound('click');
                    resetForm();
                    setShowRegister(true);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#22c55e' }]}>
                    <Feather name="user-plus" size={18} color="#fff" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.toggleTitle, { color: '#22c55e' }]}>REGISTER</Text>
                    <Text style={styles.toggleSub}>Create a permanent account to save progress</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#22c55e" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Audio Configuration Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadow} />
          <View style={styles.cardContent}>
            <Text style={styles.cardSectionHeader}>AUDIO CONFIGURATION</Text>

            {/* Music Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              activeOpacity={0.8}
              onPress={handleToggleMusic}
            >
              <View style={[styles.iconBox, !musicEnabled && styles.iconBoxDisabled]}>
                <Feather
                  name={musicEnabled ? 'music' : 'slash'}
                  size={18}
                  color={musicEnabled ? '#fff' : '#7a6a55'}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.toggleTitle, !musicEnabled && styles.textDisabled]}>
                  BACKGROUND MUSIC
                </Text>
                <Text style={styles.toggleSub}>Battle & menu themes</Text>
              </View>
              <View style={[styles.switchTrack, musicEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
                <View style={[styles.switchThumb, musicEnabled ? styles.switchThumbOn : styles.switchThumbOff]} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Sound Effects Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              activeOpacity={0.8}
              onPress={handleToggleSound}
            >
              <View style={[styles.iconBox, !soundEnabled && styles.iconBoxDisabled, soundEnabled && { backgroundColor: '#f5a623' }]}>
                <Feather
                  name={soundEnabled ? 'volume-2' : 'volume-x'}
                  size={18}
                  color={soundEnabled ? '#fff' : '#7a6a55'}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.toggleTitle, !soundEnabled && styles.textDisabled]}>
                  SOUND EFFECTS
                </Text>
                <Text style={styles.toggleSub}>Attacks, clicks, & combat audio</Text>
              </View>
              <View style={[styles.switchTrack, soundEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
                <View style={[styles.switchThumb, soundEnabled ? styles.switchThumbOn : styles.switchThumbOff]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Tools Card (only in dev builds) */}
        {IS_DEV_BUILD && (
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadow} />
          <View style={styles.cardContent}>
            <Text style={styles.cardSectionHeader}>DEVELOPER OPTIONS</Text>

            <TouchableOpacity
              style={styles.toggleRow}
              activeOpacity={0.8}
              onPress={toggleDevMode}
            >
              <View style={[styles.devIconBox, !devModeEnabled && { backgroundColor: '#94a3b8' }]}>
                <Feather name={devModeEnabled ? 'unlock' : 'lock'} size={18} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.devUnlockTitle, !devModeEnabled && { color: '#7a6a55' }]}>
                  DEV MODE {devModeEnabled ? 'ON' : 'OFF'}
                </Text>
                <Text style={styles.devUnlockSub}>
                  {devModeEnabled
                    ? 'All levels, 99,999 coins, answers shown'
                    : 'Max levels, coins, show answers'}
                </Text>
              </View>
              <View style={[styles.switchTrack, devModeEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
                <View style={[styles.switchThumb, devModeEnabled ? styles.switchThumbOn : styles.switchThumbOff]} />
              </View>
            </TouchableOpacity>

            {devModeEnabled && (
              <View style={{ backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b', borderRadius: 8, padding: 8, marginTop: 4 }}>
                <Text style={{ fontFamily: GameFonts.hud, fontSize: 10, color: '#92400e', fontWeight: '700', textAlign: 'center' }}>
                  ⚠️ Dev mode is active. Turn off to restore your real progress.
                </Text>
              </View>
            )}
          </View>
        </View>
        )}

        {/* App Info Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardShadow} />
          <View style={styles.cardContent}>
            <Text style={styles.cardSectionHeader}>ABOUT ALGEBRAWLS</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>0.0.01</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>Mobile Educational Game</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* In-place Auth Modals transferred from Profile */}
      {renderRegisterModal()}
      {renderIngameModal()}
      {renderLoginModal()}
      {renderLinkEmailModal()}
      {renderOtpModal()}

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={ms.overlay}>
          <View style={ms.card}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>LOG OUT</Text>
              <Text style={{ fontFamily: GameFonts.hud, fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                Are you sure you want to log out? Your progress is saved to your account and you can log back in anytime!
              </Text>
              <View style={ms.btnRow}>
                <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowLogoutConfirm(false)} activeOpacity={0.8}>
                  <Text style={ms.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, position: 'relative' }}>
                  <View style={ms.submitShadow} />
                  <TouchableOpacity style={ms.submitBtn} onPress={confirmLogout} activeOpacity={0.8}>
                    <Text style={ms.submitBtnText}>LOGOUT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Neo-Brutalist Success Popup */}
      <SuccessPopup
        visible={popup.visible}
        icon={popup.icon}
        title={popup.title}
        message={popup.message}
        onDismiss={hidePopup}
      />

      {/* Error Modal */}
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

/* ── Modal styles transferred from Profile ── */
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,16,8,0.6)', justifyContent: 'center', padding: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  card: { position: 'relative' },
  elevatedModalCard: { marginBottom: 110 },
  cardShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  cardInner: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 16, padding: 24 },
  title: { fontFamily: GameFonts.brawl, fontSize: 20, color: '#1a1008', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  label: { fontFamily: GameFonts.brawl, fontSize: 11, color: '#7a6a55', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  input: { fontFamily: GameFonts.hud, backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '900', color: '#1a1008', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#e5d9c4', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: GameFonts.brawl, fontSize: 13, color: '#1a1008' },
  submitShadow: { position: 'absolute', top: 2, left: 2, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  submitBtn: { backgroundColor: '#e8302a', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#7a6a55' },
  submitBtnText: { fontFamily: GameFonts.brawl, fontSize: 13, color: '#fff', letterSpacing: 1 },
  suggestBtn: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  suggestBtnText: { fontFamily: GameFonts.brawl, fontSize: 11, color: '#1a1008' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { backgroundColor: '#e5d9c4', borderWidth: 2, borderColor: '#1a1008', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: GameFonts.brawl, fontSize: 10, color: '#1a1008' },
});

/* ── Popup styles ── */
const ps = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,16,8,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  cardWrap: { width: '100%', maxWidth: 340, position: 'relative' },
  shadow: { position: 'absolute', top: 6, left: 6, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  card: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 16, padding: 28, alignItems: 'center' },
  icon: { fontSize: 44, marginBottom: 10 },
  title: { fontFamily: GameFonts.brawl, fontSize: 20, color: '#1a1008', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  message: { fontFamily: GameFonts.hud, fontSize: 14, fontWeight: '700', color: '#7a6a55', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btnWrap: { position: 'relative', width: '100%' },
  btnShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  btn: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: GameFonts.brawl, fontSize: 16, color: '#fff', letterSpacing: 2 },
});

/* ── Settings page styles ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  cardWrapper: {
    position: 'relative',
    width: '100%',
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
  cardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardSectionHeader: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxDisabled: {
    backgroundColor: '#e5d9c4',
  },
  textContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 13,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
  toggleSub: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
  },
  textDisabled: {
    color: '#7a6a55',
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 2,
    backgroundColor: '#e5d9c4',
    marginVertical: 4,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#1a1008',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#22c55e',
  },
  switchTrackOff: {
    backgroundColor: '#e5d9c4',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1a1008',
    backgroundColor: '#fff',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  devUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  devIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e8302a',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devUnlockTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#e8302a',
    letterSpacing: 0.5,
  },
  devUnlockSub: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    color: '#7a6a55',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontFamily: GameFonts.brawl,
    fontSize: 11,
    color: '#1a1008',
  },
  infoValue: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
  },
  signedInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff9f0',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#1a1008',
  },
  signedInBadgeText: {
    fontFamily: GameFonts.hud,
    fontSize: 10,
    fontWeight: '800',
    color: '#7a6a55',
    letterSpacing: 1,
  },
  signedInUsername: {
    fontFamily: GameFonts.brawl,
    fontSize: 14,
    color: '#1a1008',
    letterSpacing: 0.5,
  },
});
