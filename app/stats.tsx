// app/stats.tsx
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, View, ViewStyle
} from 'react-native';
import ErrorModal from '../components/ErrorModal';
import NeoButton from '../components/NeoButton';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { supabase } from '../services/supabase';
import { fetchFromSupabase, lookupByEmail, lookupByIngameName, lookupByUsername, syncToSupabase } from '../services/supabaseSync';

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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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

const ps = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,16,8,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  cardWrap: { width: '100%', maxWidth: 340, position: 'relative' },
  shadow: { position: 'absolute', top: 6, left: 6, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  card: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 16, padding: 28, alignItems: 'center' },
  icon: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '900', color: '#1a1008', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  message: { fontSize: 14, fontWeight: '700', color: '#7a6a55', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btnWrap: { position: 'relative', width: '100%' },
  btnShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  btn: { backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
});

const LEVELS = [
  { id: 1, name: 'Variables', questions: 10 },
  { id: 2, name: 'Equations', questions: 20 },
  { id: 3, name: 'Polynomials', questions: 20 },
  { id: 4, name: 'Factoring', questions: 30 },
  { id: 5, name: 'Systems', questions: 30 },
  { id: 6, name: 'Exponents', questions: 50 },
  { id: 7, name: 'Random', questions: 100 },
];

// Updated practical gears
const GEARS = [
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', unlockLevel: 7 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', unlockLevel: 6 },
];

const CHARACTERS = [
  { id: 'c0', name: 'Algebro', icon: '🧮', image: require('../assets/images/avatar/algebroavatar.png'), unlockLevel: 1 },
  { id: 'c1', name: 'Ada Lovelace', icon: '👩‍💻', image: require('../assets/images/avatar/lovelaceavatar.png'), unlockLevel: 2 },
  { id: 'c2', name: 'Isaac Newton', icon: '🍎', image: require('../assets/images/avatar/newtonavatar.png'), unlockLevel: 3 },
  { id: 'c3', name: 'Nikola Tesla', icon: '⚡', image: require('../assets/images/avatar/teslaavatar.png'), unlockLevel: 4 },
  { id: 'c4', name: 'Marie Curie', icon: '☢️', image: require('../assets/images/avatar/curieavatar.png'), unlockLevel: 5 },
];

const CHARACTER_AVATARS: Record<string, any> = {
  c0: require('../assets/images/avatar/algebroavatar.png'),
  char_algebro: require('../assets/images/avatar/algebroavatar.png'),
  c1: require('../assets/images/avatar/lovelaceavatar.png'),
  c2: require('../assets/images/avatar/newtonavatar.png'),
  c3: require('../assets/images/avatar/teslaavatar.png'),
  c4: require('../assets/images/avatar/curieavatar.png'),
};

export default function PlayerStatsScreen() {
  const router = useRouter();

  const {
    unlockedLevel, totalXP, totalBattlesWon,
    totalBattles, maxStreak, levelStars, username, ingameName,
    isLoggedIn, loginWithData, setUsername, setIngameName, logout,
    equippedCharacter, equipItem, inventory,
  } = useGameStore();

  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showIngameModal, setShowIngameModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showEditIngameModal, setShowEditIngameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formPass, setFormPass] = useState('');
  const [formIngameName, setFormIngameName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingReg, setPendingReg] = useState<{ email: string; user: string; pass: string; ingame: string } | null>(null);
  const [editIngameName, setEditIngameName] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorConfig, setErrorConfig] = useState<{ visible: boolean; title: string; message: string; subMessage?: string } | null>(null);

  const generateSuggestions = () => {
    const prefixes = ['Math', 'Alge', 'Calc', 'Number', 'Prime', 'Sigma', 'Geo'];
    const suffixes = ['Wiz', 'Bro', 'Ninja', 'King', 'Master', 'Star'];
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const suggestions = Array.from({ length: 3 }, () => `${pick(prefixes)}${pick(suffixes)}${Math.floor(Math.random() * 99)}`);
    setNameSuggestions(suggestions);
  };

  // Success popup state
  const [popup, setPopup] = useState<{ visible: boolean; icon: string; title: string; message: string }>({
    visible: false, icon: '', title: '', message: '',
  });
  const showPopup = useCallback((icon: string, title: string, message: string) => {
    setPopup({ visible: true, icon, title, message });
  }, []);
  const hidePopup = useCallback(() => {
    setPopup(p => ({ ...p, visible: false }));
  }, []);

  const xpProgress = totalXP % 100;
  const playerRank = unlockedLevel >= 5 ? 'Mathlete' : 'Novice';
  const safeTotalBattles = totalBattles || 0;
  const winRate = safeTotalBattles > 0 ? Math.round((totalBattlesWon / safeTotalBattles) * 100) : 0;
  const safeMaxStreak = maxStreak || 0;
  const displayName = (isLoggedIn && ingameName) ? ingameName.toUpperCase() : (username ? username.toUpperCase() : 'GUEST USER');

  const achievements = [
    { id: 1, icon: '🎯', title: 'First Blood', desc: 'Win your first battle', done: totalBattlesWon >= 1 },
    { id: 2, icon: '🔥', title: 'On Fire', desc: '5 streak in one battle', done: safeMaxStreak >= 5 },
    { id: 3, icon: '👑', title: 'Undefeated', desc: 'Win 5 battles total', done: totalBattlesWon >= 5 },
    { id: 4, icon: '💀', title: 'Boss Slayer', desc: 'Defeat the Math Overlord', done: !!levelStars[7] },
    { id: 5, icon: '⚡', title: 'Speed Demon', desc: 'Answer in under 5 seconds', done: false },
    { id: 6, icon: '💎', title: 'Perfectionist', desc: 'Perfect score on all levels', done: LEVELS.every(lvl => (levelStars[lvl.id] || 0) === lvl.questions) },
  ];

  const resetForm = () => { setFormEmail(''); setFormUser(''); setFormPass(''); setFormIngameName(''); setOtpCode(''); setNameSuggestions([]); setPendingReg(null); };

  const checkNetwork = async (): Promise<boolean> => {
    try {
      await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  };

  const handleRegisterNext = async () => {
    const trimEmail = formEmail.trim().toLowerCase();
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();

    if (!trimEmail || !trimEmail.includes('@') || !trimEmail.includes('.')) {
      setErrorConfig({ visible: true, title: 'Invalid Email', message: 'Please enter a valid email address.' });
      return;
    }
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

    const existingEmail = await lookupByEmail(trimEmail);
    if (existingEmail) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'Email Taken', message: 'That email is already registered. Try logging in instead.' });
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

  const handleRegisterSubmit = async () => {
    const trimEmail = formEmail.trim().toLowerCase();
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();
    const trimIngame = formIngameName.trim();

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimEmail,
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
          setErrorConfig({ visible: true, title: 'Email Taken', message: 'That email is already registered.' });
        } else {
          setErrorConfig({ visible: true, title: 'Registration Error', message: msg });
        }
        setLoading(false);
        return;
      }

      const uid = authData.user.id;
      const state = useGameStore.getState();

      // If user is immediately logged in/confirmed (Confirm Email = OFF in Supabase)
      if (authData.session || authData.user.confirmed_at || authData.user.email_confirmed_at) {
        await syncToSupabase(uid, {
          email: trimEmail,
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
        });

        loginWithData(uid, {
          email: trimEmail,
          username: trimUser,
          ingameName: trimIngame,
          unlockedLevel: state.unlockedLevel,
          levelStars: state.levelStars,
          xp: state.totalXP,
          totalBattles: state.totalBattles,
          wins: state.totalBattlesWon,
          currentStreak: state.currentStreak,
          maxStreak: state.maxStreak,
        });
        setUsername(trimUser);

        setShowIngameModal(false);
        resetForm();
        showPopup('', 'Account Created!', `Welcome, ${trimUser}! Your account has been created.`);
        return;
      }

      setPendingReg({ email: trimEmail, user: trimUser, pass: trimPass, ingame: trimIngame });
      setShowIngameModal(false);
      setShowOtpModal(true);
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Registration failed.' });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorConfig({ visible: true, title: 'Invalid Code', message: 'Please enter the 6-digit OTP code sent to your email.' });
      return;
    }
    if (!pendingReg) {
      setErrorConfig({ visible: true, title: 'Error', message: 'Session expired. Please try registering again.' });
      return;
    }

    setLoading(true);
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingReg.email,
        token: cleanCode,
        type: 'signup',
      });

      if (verifyError || !verifyData.user) {
        // Also check if verifyOtp with type 'email' works
        const { data: altData, error: altError } = await supabase.auth.verifyOtp({
          email: pendingReg.email,
          token: cleanCode,
          type: 'email',
        });

        if (altError || !altData.user) {
          setErrorConfig({ visible: true, title: 'Verification Failed', message: verifyError?.message || altError?.message || 'Invalid verification code.' });
          setLoading(false);
          return;
        }
        verifyData.user = altData.user;
      }

      const uid = verifyData.user.id;
      const state = useGameStore.getState();

      await syncToSupabase(uid, {
        email: pendingReg.email,
        username: pendingReg.user,
        ingameName: pendingReg.ingame,
        isGuest: false,
        unlockedLevel: state.unlockedLevel,
        levelStars: state.levelStars,
        xp: state.totalXP,
        totalBattles: state.totalBattles,
        wins: state.totalBattlesWon,
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
      });

      loginWithData(uid, {
        email: pendingReg.email,
        username: pendingReg.user,
        ingameName: pendingReg.ingame,
        unlockedLevel: state.unlockedLevel,
        levelStars: state.levelStars,
        xp: state.totalXP,
        totalBattles: state.totalBattles,
        wins: state.totalBattlesWon,
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
      });
      setUsername(pendingReg.user);

      setShowOtpModal(false);
      resetForm();
      showPopup('', 'Email Verified!', `Welcome, ${pendingReg.user}! Your email has been verified.`);
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Verification failed.' });
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (!pendingReg) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingReg.email,
      });
      if (error) {
        // Fallback: re-trigger signUp to send confirmation code
        const { error: signUpError } = await supabase.auth.signUp({
          email: pendingReg.email,
          password: pendingReg.pass,
        });
        if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
          setErrorConfig({ visible: true, title: 'Resend Failed', message: signUpError.message || error.message });
        } else {
          showPopup('📧', 'Code Sent!', `A new verification code has been sent to ${pendingReg.email}`);
        }
      } else {
        showPopup('📧', 'Code Sent!', `A new verification code has been sent to ${pendingReg.email}`);
      }
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Failed to resend code.' });
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
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
      let targetEmail = input;

      // If input is a username (not an email), resolve its email address
      if (!input.includes('@')) {
        const found = await lookupByUsername(input);
        if (found && found.data.email) {
          targetEmail = found.data.email;
        } else if (found && !found.data.email) {
          // Email missing in public.users — fetch from Supabase Auth via RPC
          try {
            const { data: authEmail } = await supabase.rpc('get_auth_email', {
              target_user_id: found.userId,
            });
            if (authEmail) {
              targetEmail = authEmail;
              // Backfill email in public.users so future logins work directly
              supabase.from('users').update({ email: authEmail }).eq('id', found.userId).then(() => { });
            } else {
              setErrorConfig({ visible: true, title: 'Login Failed', message: 'Could not resolve email for that username. Please try logging in with your email.' });
              setLoading(false);
              return;
            }
          } catch (_) {
            setErrorConfig({ visible: true, title: 'Login Failed', message: 'Could not resolve email for that username. Please try logging in with your email.' });
            setLoading(false);
            return;
          }
        } else {
          setErrorConfig({ visible: true, title: 'Login Failed', message: 'No account found with that username.' });
          setLoading(false);
          return;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: trimPass,
      });

      if (authError || !authData.user) {
        const msg = authError?.message || 'Login failed.';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          setErrorConfig({ visible: true, title: 'Login Failed', message: 'Invalid username/email or password.' });
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          setErrorConfig({ visible: true, title: 'Email Not Verified', message: 'Please check your email and verify your account first.' });
        } else {
          setErrorConfig({ visible: true, title: 'Error', message: msg });
        }
        setLoading(false);
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

      // Backfill email in public.users if it was missing (enables future username login)
      if (!cloudData?.email && authData.user.email) {
        await supabase.from('users').update({ email: authData.user.email }).eq('id', uid);
      }

      const resolvedUser = cloudData?.username || input;

      loginWithData(uid, {
        email: authData.user.email || cloudData?.email,
        username: resolvedUser,
        ingameName: cloudData?.ingameName ?? undefined,
        unlockedLevel: cloudData?.unlockedLevel ?? 1,
        levelStars: cloudData?.levelStars ?? {},
        xp: cloudData?.xp ?? 0,
        totalBattles: cloudData?.totalBattles ?? 0,
        wins: cloudData?.wins ?? 0,
        currentStreak: cloudData?.currentStreak ?? 0,
        maxStreak: cloudData?.maxStreak ?? 0,
      });
      setUsername(resolvedUser);

      setShowLogin(false);
      resetForm();
      showPopup('', 'Welcome Back!', `Welcome back, ${resolvedUser}! Your progress has been restored.`);
    } catch (error: any) {
      setErrorConfig({ visible: true, title: 'Error', message: error.message || 'Login failed.' });
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try { await supabase.auth.signOut(); } catch (_) { }
    await logout();
    resetForm();
    showPopup('', 'Logged Out', 'Logged out successfully. Starting fresh as Guest User.');
  };

  const renderRegisterModal = () => (
    <Modal visible={showRegister} transparent animationType="fade" onRequestClose={() => { setShowRegister(false); resetForm(); }}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>REGISTER</Text>

            <Text style={ms.label}>REAL EMAIL ADDRESS</Text>
            <TextInput style={ms.input} value={formEmail} onChangeText={setFormEmail}
              placeholder="user@example.com" placeholderTextColor="#b5a58d"
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} />

            <Text style={ms.label}>USERNAME</Text>
            <TextInput style={ms.input} value={formUser} onChangeText={setFormUser}
              placeholder="Enter username..." placeholderTextColor="#b5a58d"
              maxLength={20} autoCapitalize="none" autoCorrect={false} editable={!loading} />

            <Text style={ms.label}>PASSWORD</Text>
            <TextInput style={ms.input} value={formPass} onChangeText={setFormPass}
              placeholder="Enter password..." placeholderTextColor="#b5a58d"
              secureTextEntry maxLength={40} autoCapitalize="none" editable={!loading} />

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => { setShowRegister(false); resetForm(); }} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={ms.submitShadow} />
                <TouchableOpacity style={[ms.submitBtn, loading && ms.submitBtnDisabled]}
                  onPress={handleRegisterNext} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>NEXT</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLoginModal = () => (
    <Modal visible={showLogin} transparent animationType="fade" onRequestClose={() => { setShowLogin(false); resetForm(); }}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>LOG IN</Text>

            <Text style={ms.label}>USERNAME OR EMAIL</Text>
            <TextInput style={ms.input} value={formUser} onChangeText={setFormUser}
              placeholder="Username or Email..." placeholderTextColor="#b5a58d"
              maxLength={40} autoCapitalize="none" autoCorrect={false} editable={!loading} />

            <Text style={ms.label}>PASSWORD</Text>
            <TextInput style={ms.input} value={formPass} onChangeText={setFormPass}
              placeholder="Enter password..." placeholderTextColor="#b5a58d"
              secureTextEntry maxLength={40} autoCapitalize="none" editable={!loading} />

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => { setShowLogin(false); resetForm(); }} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={ms.submitShadow} />
                <TouchableOpacity style={[ms.submitBtn, loading && ms.submitBtnDisabled]}
                  onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>LOG IN</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOtpModal = () => (
    <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => { setShowOtpModal(false); resetForm(); }}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>VERIFY EMAIL</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16 }}>
              A 6-digit OTP code was sent to{'\n'}
              <Text style={{ fontWeight: '900', color: '#1a1008' }}>{pendingReg?.email}</Text>
            </Text>

            <Text style={ms.label}>6-DIGIT OTP CODE</Text>
            <TextInput style={[ms.input, { textAlign: 'center', letterSpacing: 6, fontSize: 22 }]}
              value={otpCode} onChangeText={setOtpCode}
              placeholder="123456" placeholderTextColor="#b5a58d"
              keyboardType="number-pad" maxLength={6} editable={!loading} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#f5a623', textDecorationLine: 'underline' }}>
                  Didn&apos;t receive code? Resend OTP
                </Text>
              </TouchableOpacity>
            </View>

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => { setShowOtpModal(false); resetForm(); }} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={ms.submitShadow} />
                <TouchableOpacity style={[ms.submitBtn, loading && ms.submitBtnDisabled]}
                  onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>VERIFY OTP</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderIngameModal = () => (
    <Modal visible={showIngameModal} transparent animationType="fade" onRequestClose={() => { setShowIngameModal(false); resetForm(); }}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>CHOOSE INGAME NAME</Text>

            <Text style={ms.label}>INGAME NAME</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: nameSuggestions.length > 0 ? 8 : 12 }}>
              <TextInput style={[ms.input, { flex: 1, marginBottom: 0 }]} value={formIngameName} onChangeText={setFormIngameName}
                placeholder="Enter ingame name..." placeholderTextColor="#b5a58d"
                maxLength={20} autoCapitalize="none" autoCorrect={false} editable={!loading} />
              <TouchableOpacity style={ms.suggestBtn} onPress={generateSuggestions} disabled={loading}>
                <Text style={ms.suggestBtnText}>SUGGEST</Text>
              </TouchableOpacity>
            </View>
            {nameSuggestions.length > 0 && (
              <View style={ms.chipsContainer}>
                {nameSuggestions.map(sugg => (
                  <TouchableOpacity key={sugg} style={ms.chip} onPress={() => setFormIngameName(sugg)}>
                    <Text style={ms.chipText}>{sugg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => { setShowIngameModal(false); resetForm(); }} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={ms.submitShadow} />
                <TouchableOpacity style={[ms.submitBtn, loading && ms.submitBtnDisabled]}
                  onPress={handleRegisterSubmit} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>REGISTER</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleEditIngameSubmit = async () => {
    const trimIngame = editIngameName.trim();
    if (!trimIngame) {
      setErrorConfig({ visible: true, title: 'Invalid', message: 'Ingame name cannot be empty.' });
      return;
    }
    if (trimIngame === (ingameName || username)) {
      setShowEditIngameModal(false);
      return;
    }

    setLoading(true);
    const existingIngame = await lookupByIngameName(trimIngame);
    if (existingIngame) {
      setLoading(false);
      setErrorConfig({ visible: true, title: 'Name Taken', message: 'That ingame name is already taken. Try a different one.' });
      return;
    }

    setIngameName(trimIngame);
    setLoading(false);
    setShowEditIngameModal(false);
    showPopup('', 'Name Updated!', `Your ingame name is now ${trimIngame}`);
  };

  const renderEditIngameModal = () => (
    <Modal visible={showEditIngameModal} transparent animationType="fade" onRequestClose={() => setShowEditIngameModal(false)}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>EDIT INGAME NAME</Text>

            <Text style={ms.label}>NEW INGAME NAME</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: nameSuggestions.length > 0 ? 8 : 12 }}>
              <TextInput style={[ms.input, { flex: 1, marginBottom: 0 }]} value={editIngameName} onChangeText={setEditIngameName}
                placeholder="Enter new ingame name..." placeholderTextColor="#b5a58d"
                maxLength={20} autoCapitalize="none" autoCorrect={false} editable={!loading} />
              <TouchableOpacity style={ms.suggestBtn} onPress={generateSuggestions} disabled={loading}>
                <Text style={ms.suggestBtnText}>SUGGEST</Text>
              </TouchableOpacity>
            </View>
            {nameSuggestions.length > 0 && (
              <View style={ms.chipsContainer}>
                {nameSuggestions.map(sugg => (
                  <TouchableOpacity key={sugg} style={ms.chip} onPress={() => setEditIngameName(sugg)}>
                    <Text style={ms.chipText}>{sugg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowEditIngameModal(false)} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <NeoButton
                wrapperStyle={{ flex: 1 }}
                shadowStyle={ms.submitShadow}
                style={[ms.submitBtn, loading && ms.submitBtnDisabled] as ViewStyle[]}
                disabled={loading}
                onPress={handleEditIngameSubmit}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>SAVE</Text>}
              </NeoButton>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAvatarModal = () => (
    <Modal visible={showAvatarModal} transparent animationType="fade" onRequestClose={() => setShowAvatarModal(false)}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>SELECT AVATAR</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 16 }}>
              Tap an avatar to equip it on your profile:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              {CHARACTERS.map((char) => {
                const isOwned = inventory.includes(char.id) || char.id === 'c0' || char.id === 'char_algebro';
                const isEquipped = equippedCharacter === char.id || (char.id === 'c0' && equippedCharacter === 'char_algebro');

                return (
                  <TouchableOpacity
                    key={char.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isOwned) {
                        equipItem(char.id);
                        setShowAvatarModal(false);
                        showPopup('', 'Avatar Updated!', `Equipped ${char.name} as your profile avatar.`);
                      } else {
                        setShowAvatarModal(false);
                        router.push('/shop');
                      }
                    }}
                    style={{
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 14,
                      borderWidth: 3,
                      borderColor: isEquipped ? '#22c55e' : '#1a1008',
                      backgroundColor: isEquipped ? '#f0fdf4' : isOwned ? '#ffffff' : '#f1f5f9',
                      width: 96,
                    }}
                  >
                    <View style={{ position: 'relative', width: 56, height: 56, marginBottom: 6 }}>
                      <Image source={char.image} style={{ width: 56, height: 56, opacity: isOwned ? 1 : 0.4 }} resizeMode="contain" />
                      {!isOwned && (
                        <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: '#1a1008', borderRadius: 10, padding: 4 }}>
                          <Feather name="lock" size={14} color="#ffffff" />
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#1a1008', textAlign: 'center' }} numberOfLines={1}>
                      {char.name}
                    </Text>
                    {isEquipped ? (
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#22c55e', marginTop: 4 }}>✓ EQUIPPED</Text>
                    ) : isOwned ? (
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#1a6cf5', marginTop: 4 }}>EQUIP</Text>
                    ) : (
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#7a6a55', marginTop: 4 }}>SHOP 🛍️</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowAvatarModal(false)}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <NeoButton
          style={styles.backBtn as ViewStyle}
          shadowStyle={{ borderRadius: 23 }}
          wrapperStyle={{ width: 45 }}
          onPress={() => router.replace('/')}
        >
          <Feather name="arrow-left" size={24} color="#1a1008" />
        </NeoButton>
        <Text style={styles.title}>PLAYER PROFILE</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PLAYER CARD */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <View style={styles.avatarRow}>
              <TouchableOpacity
                style={styles.avatarBox}
                onPress={() => setShowAvatarModal(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={CHARACTER_AVATARS[equippedCharacter] || require('../assets/images/avatar/algebroavatar.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
                <View style={styles.avatarEditBadge}>
                  <Feather name="camera" size={11} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.playerName}>{displayName}</Text>
                  {isLoggedIn && (
                    <TouchableOpacity
                      onPress={() => { setEditIngameName(ingameName || username || ''); setShowEditIngameModal(true); }}
                      style={{ padding: 2, transform: [{ translateY: 1 }] }}
                    >
                      <Feather name="edit" size={14} color="#1a1008" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.rankBadge}><Text style={styles.rankText}>{playerRank}</Text></View>
              </View>
            </View>
            <Text style={styles.statLabel}>LEVEL {unlockedLevel}</Text>
            <View style={styles.xpBarOuter}><View style={[styles.xpBarInner, { width: `${xpProgress}%` }]} /></View>
          </View>
        </View>

        {/* AUTH BANNER */}
        {isLoggedIn ? (
          <View style={styles.authBanner}>
            <View style={styles.authBannerShadow} />
            <View style={styles.authBannerInner}>
              <View style={styles.loggedInRow}>
                <View style={styles.statusDot} />
                <Text style={styles.loggedInText}>Signed in as <Text style={styles.loggedInName}>{username}</Text></Text>
              </View>
              <NeoButton
                shadowStyle={{ position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 }}
                style={styles.logoutBtn as ViewStyle}
                onPress={handleLogout}
              >
                <Text style={styles.logoutBtnText}>LOGOUT</Text>
              </NeoButton>
            </View>
          </View>
        ) : (
          <View style={styles.authBanner}>
            <View style={styles.authBannerShadow} />
            <View style={styles.authBannerInner}>
              <Text style={styles.authHint}>Save your progress across devices</Text>
              <View style={styles.authBtnRow}>
                <NeoButton
                  wrapperStyle={styles.authBtnWrapper}
                  shadowStyle={styles.authBtnShadow}
                  style={styles.registerBtn as ViewStyle}
                  onPress={() => setShowRegister(true)}
                >
                  <Text style={styles.authBtnText}>REGISTER</Text>
                </NeoButton>
                <NeoButton
                  wrapperStyle={styles.authBtnWrapper}
                  shadowStyle={[styles.authBtnShadow, { backgroundColor: '#1a1008' }]}
                  style={styles.loginBtn as ViewStyle}
                  onPress={() => setShowLogin(true)}
                >
                  <Text style={styles.authBtnText}>LOGIN</Text>
                </NeoButton>
              </View>
            </View>
          </View>
        )}

        {/* EQUIPMENT & SKILLS */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionHeader}>EQUIPMENT</Text>
            <View style={styles.gearRow}>
              {GEARS.filter((gear) => inventory.includes(gear.id) || gear.id === 'g1').map((gear) => (
                <View key={gear.id} style={styles.iconBox}>
                  <Text style={styles.gearIcon}>{gear.icon}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionHeader}>SKILLS</Text>
            <View style={styles.gearRow}>
              {SKILLS.filter((skill) => inventory.includes(skill.id) || skill.id === 's1').map((skill) => (
                <View key={skill.id} style={styles.iconBox}>
                  <Text style={styles.gearIcon}>{skill.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* CHARACTERS */}
        <Text style={styles.sectionHeader}>CHARACTERS</Text>
        <View style={styles.gearRow}>
          {CHARACTERS.filter((char) => inventory.includes(char.id) || char.id === 'c0' || char.id === 'char_algebro').map((char) => (
            <View key={char.id} style={styles.iconBox}>
              {char.image ? (
                <Image source={char.image} style={{ width: 44, height: 44 }} resizeMode="contain" />
              ) : (
                <Text style={styles.gearIcon}>{char.icon}</Text>
              )}
            </View>
          ))}
        </View>

        {/* BATTLE STATS */}
        <Text style={styles.sectionHeader}>BATTLE STATS</Text>
        <View style={styles.battleStatsCard}>
          <View style={styles.battleGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>TOTAL BATTLES</Text>
              <Text style={styles.gridValue}>{safeTotalBattles}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>BATTLES WON</Text>
              <Text style={styles.gridValue}>{totalBattlesWon}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>WIN RATE</Text>
              <Text style={styles.gridValue}>{winRate}%</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>MAX STREAK</Text>
              <Text style={styles.gridValue}>{safeMaxStreak}</Text>
            </View>
          </View>
        </View>

        {/* LEVEL PROGRESS SECTION */}
        <Text style={styles.sectionHeader}>LEVEL PROGRESS</Text>
        <View style={styles.progressCard}>
          {LEVELS.map((lvl) => {
            const scoreEarned = levelStars[lvl.id] || 0;
            const isLocked = lvl.id > unlockedLevel;
            const progressPercent = isLocked ? 0 : (scoreEarned / lvl.questions) * 100;
            const isPerfect = scoreEarned === lvl.questions;
            const scoreDisplay = isLocked ? '🔒' : `${scoreEarned}/${lvl.questions}`;

            return (
              <View key={lvl.id} style={[styles.levelProgressRow, isLocked && { opacity: 0.4 }]}>
                <Text style={styles.levelNameText}>{lvl.name}</Text>
                <View style={styles.levelBarOuter}>
                  <View style={[
                    styles.levelBarInner,
                    { width: `${progressPercent}%` },
                    isPerfect && styles.levelBarPerfect,
                  ]} />
                </View>
                <Text style={[
                  styles.scoreText,
                  isPerfect && styles.scoreTextPerfect,
                  isLocked && styles.scoreTextLocked,
                ]}>
                  {scoreDisplay}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionHeader}>🏅 ACHIEVEMENTS</Text>
        {achievements.map((ach) => (
          <View key={ach.id} style={[styles.achRow, !ach.done && { opacity: 0.5 }]}>
            <Text style={styles.achNum}>{ach.id}</Text>
            <View style={styles.achIconBox}><Text style={{ fontSize: 24 }}>{ach.icon}</Text></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.desc}</Text>
            </View>
            <Text style={{ fontSize: 18 }}>{ach.done ? '✅' : '🔒'}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Auth Modals */}
      {renderRegisterModal()}
      {renderLoginModal()}
      {renderIngameModal()}
      {renderOtpModal()}
      {renderEditIngameModal()}
      {renderAvatarModal()}

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={ms.overlay}>
          <View style={ms.card}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={ms.title}>LOGOUT</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#7a6a55', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                Are you sure? This will start a fresh guest session.
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

      {/* Success Popup */}
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

/* ── Modal styles ── */
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,16,8,0.6)', justifyContent: 'center', padding: 24 },
  card: { position: 'relative' },
  cardShadow: { position: 'absolute', top: 6, left: 6, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  cardInner: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 16, padding: 24 },
  title: { fontFamily: GameFonts.brawl, fontSize: 20, color: '#1a1008', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  label: { fontFamily: GameFonts.brawl, fontSize: 11, color: '#7a6a55', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  input: { fontFamily: GameFonts.hud, backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '900', color: '#1a1008', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#e5d9c4', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: GameFonts.brawl, fontSize: 13, color: '#1a1008' },
  submitShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  submitBtn: { backgroundColor: '#e8302a', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#7a6a55' },
  submitBtnText: { fontFamily: GameFonts.brawl, fontSize: 13, color: '#fff', letterSpacing: 1 },
  suggestBtn: { backgroundColor: '#f5a623', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  suggestBtnText: { fontFamily: GameFonts.brawl, fontSize: 11, color: '#1a1008' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { backgroundColor: '#e5d9c4', borderWidth: 2, borderColor: '#1a1008', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: GameFonts.brawl, fontSize: 10, color: '#1a1008' },
});

/* ── Page styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, zIndex: 10 },
  backBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#fff', borderWidth: 3, borderColor: '#1a1008', justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontFamily: GameFonts.brawl, fontSize: 20, color: '#1a1008' },
  title: { fontFamily: GameFonts.brawl, fontSize: 22, color: '#1a1008', textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  sectionHeader: { fontFamily: GameFonts.brawl, fontSize: 14, color: '#1a1008', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { marginBottom: 15 },
  cardShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  cardInner: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  avatarRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  avatarBox: { width: 80, height: 80, backgroundColor: '#fff9f0', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarEditBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#f5a623', borderRadius: 12, width: 22, height: 22, borderWidth: 2, borderColor: '#1a1008', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 64, height: 64 },
  profileInfo: { flex: 1, justifyContent: 'center' },
  playerName: { fontFamily: GameFonts.brawl, fontSize: 16, color: '#1a1008' },
  rankBadge: { backgroundColor: '#ffb347', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 2, borderColor: '#1a1008', alignSelf: 'flex-start', marginTop: 2 },
  rankText: { fontFamily: GameFonts.brawl, color: '#1a1008', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Auth banner below player card */
  authBanner: { marginBottom: 15, position: 'relative' },
  authBannerShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  authBannerInner: { backgroundColor: '#fffbf2', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 14 },
  authHint: { fontFamily: GameFonts.hud, fontSize: 12, fontWeight: '800', color: '#7a6a55', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  authBtnRow: { flexDirection: 'row', gap: 12 },
  authBtnWrapper: { flex: 1, position: 'relative' },
  authBtnShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  registerBtn: { backgroundColor: '#22c55e', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  loginBtn: { backgroundColor: '#1a6cf5', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  authBtnIcon: { fontSize: 16 },
  authBtnText: { fontFamily: GameFonts.brawl, fontSize: 12, color: '#fff', letterSpacing: 1 },
  loggedInRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#1a1008' },
  loggedInText: { fontFamily: GameFonts.hud, fontSize: 13, color: '#7a6a55' },
  loggedInName: { fontFamily: GameFonts.brawl, color: '#1a1008' },
  logoutBtn: { backgroundColor: '#e8302a', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  logoutBtnText: { fontFamily: GameFonts.brawl, fontSize: 12, color: '#fff', letterSpacing: 1 },

  statLabel: { fontFamily: GameFonts.brawl, fontSize: 11, color: '#7a6a55' },
  xpBarOuter: { height: 12, backgroundColor: '#e5d9c4', borderRadius: 6, borderWidth: 2, borderColor: '#1a1008', marginTop: 4, overflow: 'hidden' },
  xpBarInner: { height: '100%', backgroundColor: '#22c55e' },

  row: { flexDirection: 'row', gap: 20 },
  gearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBox: { width: 60, height: 60, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gearIcon: { fontSize: 28 },

  battleStatsCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  battleGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, justifyContent: 'space-between' },
  gridItem: { width: '47%' },
  gridLabel: { fontFamily: GameFonts.brawl, fontSize: 10, color: '#7a6a55', marginBottom: 4 },
  gridValue: { fontFamily: GameFonts.impact, fontSize: 22, color: '#1a1008' },

  progressCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  levelProgressRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  levelNameText: { fontFamily: GameFonts.brawl, width: 85, fontSize: 10, color: '#1a1008' },
  levelBarOuter: { flex: 1, height: 10, backgroundColor: '#e5d9c4', borderRadius: 5, borderWidth: 1.5, borderColor: '#1a1008', marginHorizontal: 10, overflow: 'hidden' },
  levelBarInner: { height: '100%', backgroundColor: '#22c55e' },
  levelBarPerfect: { backgroundColor: '#f5a623' },
  scoreText: { fontFamily: GameFonts.brawl, width: 52, fontSize: 10, textAlign: 'right', color: '#22c55e' },
  scoreTextPerfect: { color: '#f5a623' },
  scoreTextLocked: { color: '#7a6a55' },

  achRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 12, marginBottom: 10 },
  achNum: { fontFamily: GameFonts.brawl, width: 25, fontSize: 12, color: '#f5a623' },
  achIconBox: { width: 40, alignItems: 'center' },
  achTitle: { fontFamily: GameFonts.brawl, fontSize: 12, color: '#1a1008' },
  achDesc: { fontFamily: GameFonts.hud, fontSize: 11, color: '#7a6a55' },
});