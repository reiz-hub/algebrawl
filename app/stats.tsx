// app/stats.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { auth } from '../services/firebase';
import { fetchFromFirestore, syncToFirestore } from '../services/firestoreSync';

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
            <Text style={ps.icon}>{icon}</Text>
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

const OUTFITS = [
  { id: 'o1', name: 'Default Uniform', icon: '👕', unlockLevel: 1 },
  { id: 'o2', name: 'School Bag', icon: '🎒', unlockLevel: 2 },
  { id: 'o3', name: 'Lucky Cap', icon: '🧢', unlockLevel: 3 },
  { id: 'o4', name: 'Focus Scarf', icon: '🧣', unlockLevel: 4 },
  { id: 'o5', name: 'Battle Gi', icon: '🥋', unlockLevel: 5 },
  { id: 'o6', name: 'Champion Crown', icon: '👑', unlockLevel: 6 },
];

const toEmail = (username: string) => `${username.toLowerCase()}@algebrawler.app`;

export default function PlayerStatsScreen() {
  const router = useRouter();

  const {
    unlockedLevel, totalXP, totalBattlesWon,
    totalBattles, maxStreak, levelStars, username,
    isLoggedIn, loginWithData, setUsername, logout,
  } = useGameStore();

  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [formUser, setFormUser] = useState('');
  const [formPass, setFormPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
  const displayName = (isLoggedIn && username) ? username.toUpperCase() : 'GUEST USER';

  const achievements = [
    { id: 1, icon: '🎯', title: 'First Blood', desc: 'Win your first battle', done: totalBattlesWon >= 1 },
    { id: 2, icon: '🔥', title: 'On Fire', desc: '5 streak in one battle', done: safeMaxStreak >= 5 },
    { id: 3, icon: '👑', title: 'Undefeated', desc: 'Win 5 battles total', done: totalBattlesWon >= 5 },
    { id: 4, icon: '💀', title: 'Boss Slayer', desc: 'Defeat the Math Overlord', done: !!levelStars[7] },
    { id: 5, icon: '⚡', title: 'Speed Demon', desc: 'Answer in under 5 seconds', done: false },
    { id: 6, icon: '💎', title: 'Perfectionist', desc: 'Perfect score on all levels', done: LEVELS.every(lvl => (levelStars[lvl.id] || 0) === lvl.questions) },
  ];

  const resetForm = () => { setFormUser(''); setFormPass(''); };

  const handleRegister = async () => {
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();
    if (!trimUser || trimUser.length < 3) { Alert.alert('Invalid', 'Username must be at least 3 characters.'); return; }
    if (!trimPass || trimPass.length < 6) { Alert.alert('Invalid', 'Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, toEmail(trimUser), trimPass);
      const uid = cred.user.uid;
      const state = useGameStore.getState();

      // Save current guest progress to Firestore under the new auth uid
      await syncToFirestore(uid, {
        isGuest: false,
        username: trimUser,
        unlockedLevel: state.unlockedLevel,
        levelStars: state.levelStars,
        xp: state.totalXP,
        totalBattles: state.totalBattles,
        wins: state.totalBattlesWon,
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
      });

      // Update local state
      loginWithData(uid, {
        username: trimUser,
        unlockedLevel: state.unlockedLevel,
        levelStars: state.levelStars,
        xp: state.totalXP,
        totalBattles: state.totalBattles,
        wins: state.totalBattlesWon,
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
      });
      setUsername(trimUser);

      setShowRegister(false);
      resetForm();
      showPopup('🎉', 'Account Created!', `Welcome, ${trimUser}!`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Username Taken', 'That username is already registered. Try a different one.');
      } else {
        Alert.alert('Error', error.message || 'Registration failed.');
      }
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    const trimUser = formUser.trim();
    const trimPass = formPass.trim();
    if (!trimUser) { Alert.alert('Invalid', 'Please enter a username.'); return; }
    if (!trimPass) { Alert.alert('Invalid', 'Please enter a password.'); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, toEmail(trimUser), trimPass);
      const uid = cred.user.uid;

      // Fetch progress from Firestore
      const cloudData = await fetchFromFirestore(uid);
      loginWithData(uid, {
        username: trimUser,
        unlockedLevel: cloudData?.unlockedLevel ?? 1,
        levelStars: cloudData?.levelStars ?? {},
        xp: cloudData?.xp ?? 0,
        totalBattles: cloudData?.totalBattles ?? 0,
        wins: cloudData?.wins ?? 0,
        currentStreak: cloudData?.currentStreak ?? 0,
        maxStreak: cloudData?.maxStreak ?? 0,
      });
      setUsername(trimUser);

      setShowLogin(false);
      resetForm();
      showPopup('👋', 'Welcome Back!', `Welcome back, ${trimUser}! Your progress has been restored.`);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Login Failed', 'Invalid username or password.');
      } else {
        Alert.alert('Error', error.message || 'Login failed.');
      }
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try { await auth.signOut(); } catch (_) {}
    await logout();
    showPopup('🚪', 'Logged Out', 'Logged out successfully. Starting fresh as Guest User.');
  };

  const renderAuthModal = (visible: boolean, onClose: () => void, title: string, onSubmit: () => void, submitLabel: string) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.card}>
          <View style={ms.cardShadow} />
          <View style={ms.cardInner}>
            <Text style={ms.title}>{title}</Text>

            <Text style={ms.label}>USERNAME</Text>
            <TextInput style={ms.input} value={formUser} onChangeText={setFormUser}
              placeholder="Enter username..." placeholderTextColor="#b5a58d"
              maxLength={20} autoCapitalize="none" autoCorrect={false} editable={!loading} />

            <Text style={ms.label}>PASSWORD</Text>
            <TextInput style={ms.input} value={formPass} onChangeText={setFormPass}
              placeholder="Enter password..." placeholderTextColor="#b5a58d"
              secureTextEntry maxLength={40} autoCapitalize="none" editable={!loading} />

            <View style={ms.btnRow}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => { onClose(); resetForm(); }} disabled={loading}>
                <Text style={ms.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={ms.submitShadow} />
                <TouchableOpacity style={[ms.submitBtn, loading && ms.submitBtnDisabled]}
                  onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>{submitLabel}</Text>}
                </TouchableOpacity>
              </View>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PLAYER PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PLAYER CARD */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarBox}>
                <Image
                  source={require('../assets/images/sprites/hero_win.png')}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.playerName}>{displayName}</Text>
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
              <View style={{ position: 'relative' }}>
                <View style={{ position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 }} />
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                  <Text style={styles.logoutBtnText}>🚪 LOGOUT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.authBanner}>
            <View style={styles.authBannerShadow} />
            <View style={styles.authBannerInner}>
              <Text style={styles.authHint}>Save your progress across devices</Text>
              <View style={styles.authBtnRow}>
                <View style={styles.authBtnWrapper}>
                  <View style={styles.authBtnShadow} />
                  <TouchableOpacity style={styles.registerBtn} onPress={() => setShowRegister(true)} activeOpacity={0.8}>
                    <Text style={styles.authBtnIcon}>📝</Text>
                    <Text style={styles.authBtnText}>REGISTER</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.authBtnWrapper}>
                  <View style={[styles.authBtnShadow, { backgroundColor: '#1a1008' }]} />
                  <TouchableOpacity style={styles.loginBtn} onPress={() => setShowLogin(true)} activeOpacity={0.8}>
                    <Text style={styles.authBtnIcon}>🔑</Text>
                    <Text style={styles.authBtnText}>LOGIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* EQUIPMENT & SKILLS */}
        <View style={styles.row}>
            <View style={{flex: 1}}>
                <Text style={styles.sectionHeader}>EQUIPMENT</Text>
                <View style={styles.gearRow}>
                    {GEARS.filter((gear) => unlockedLevel >= gear.unlockLevel).map((gear) => (
                      <View key={gear.id} style={styles.iconBox}>
                        <Text style={styles.gearIcon}>{gear.icon}</Text>
                      </View>
                    ))}
                </View>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.sectionHeader}>SKILLS</Text>
                <View style={styles.gearRow}>
                    {SKILLS.filter((skill) => unlockedLevel >= skill.unlockLevel).map((skill) => (
                      <View key={skill.id} style={[styles.iconBox, {backgroundColor: '#fef3c7'}]}>
                        <Text style={styles.gearIcon}>{skill.icon}</Text>
                      </View>
                    ))}
                </View>
            </View>
        </View>

        {/* OUTFITS */}
        <Text style={styles.sectionHeader}>OUTFITS</Text>
        <View style={styles.gearRow}>
          {OUTFITS.filter((outfit) => unlockedLevel >= outfit.unlockLevel).map((outfit) => (
            <View key={outfit.id} style={[styles.iconBox, {backgroundColor: '#fef3c7'}]}>
              <Text style={styles.gearIcon}>{outfit.icon}</Text>
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
            <View style={styles.achIconBox}><Text style={{fontSize: 24}}>{ach.icon}</Text></View>
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.desc}</Text>
            </View>
            <Text style={{fontSize: 18}}>{ach.done ? '✅' : '🔒'}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Auth Modals */}
      {renderAuthModal(showRegister, () => setShowRegister(false), 'REGISTER', handleRegister, 'REGISTER')}
      {renderAuthModal(showLogin, () => setShowLogin(false), 'LOG IN', handleLogin, 'LOG IN')}

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={ms.overlay}>
          <View style={ms.card}>
            <View style={ms.cardShadow} />
            <View style={ms.cardInner}>
              <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🚪</Text>
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
    </View>
  );
}

/* ── Modal styles ── */
const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,16,8,0.6)', justifyContent: 'center', padding: 24 },
  card: { position: 'relative' },
  cardShadow: { position: 'absolute', top: 6, left: 6, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 16 },
  cardInner: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 16, padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1008', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  label: { fontSize: 12, fontWeight: '900', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff9f0', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '900', color: '#1a1008', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#e5d9c4', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '900', color: '#1a1008' },
  submitShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  submitBtn: { backgroundColor: '#e8302a', borderWidth: 3, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#7a6a55' },
  submitBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});

/* ── Page styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  backBtnText: { fontSize: 20, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1008' },
  scrollContent: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '900', color: '#1a1008', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  
  card: { marginBottom: 15 },
  cardShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  cardInner: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  avatarRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  avatarBox: { width: 80, height: 80, backgroundColor: '#1a6cf5', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 64, height: 64 },
  profileInfo: { flex: 1, justifyContent: 'center' },
  playerName: { fontSize: 20, fontWeight: '900' },
  rankBadge: { backgroundColor: '#1a6cf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  rankText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  /* Auth banner below player card */
  authBanner: { marginBottom: 15, position: 'relative' },
  authBannerShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  authBannerInner: { backgroundColor: '#fffbf2', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 14 },
  authHint: { fontSize: 12, fontWeight: '800', color: '#7a6a55', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  authBtnRow: { flexDirection: 'row', gap: 12 },
  authBtnWrapper: { flex: 1, position: 'relative' },
  authBtnShadow: { position: 'absolute', top: 3, left: 3, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 10 },
  registerBtn: { backgroundColor: '#22c55e', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  loginBtn: { backgroundColor: '#1a6cf5', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  authBtnIcon: { fontSize: 16 },
  authBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  loggedInRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#1a1008' },
  loggedInText: { fontSize: 13, fontWeight: '700', color: '#7a6a55' },
  loggedInName: { fontWeight: '900', color: '#1a1008' },
  logoutBtn: { backgroundColor: '#e8302a', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  logoutBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  
  statLabel: { fontSize: 12, fontWeight: '900', color: '#7a6a55' },
  xpBarOuter: { height: 12, backgroundColor: '#e5d9c4', borderRadius: 6, borderWidth: 2, borderColor: '#1a1008', marginTop: 4, overflow: 'hidden' },
  xpBarInner: { height: '100%', backgroundColor: '#22c55e' },

  row: { flexDirection: 'row', gap: 20 },
  gearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBox: { width: 60, height: 60, backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gearIcon: { fontSize: 28 },

  battleStatsCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  battleGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, justifyContent: 'space-between' },
  gridItem: { width: '47%' },
  gridLabel: { fontSize: 12, fontWeight: '900', color: '#7a6a55', marginBottom: 4 },
  gridValue: { fontSize: 24, fontWeight: '900', color: '#1a1008' },

  progressCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  levelProgressRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  levelNameText: { width: 80, fontSize: 12, fontWeight: '900', color: '#1a1008' },
  levelBarOuter: { flex: 1, height: 10, backgroundColor: '#e5d9c4', borderRadius: 5, borderWidth: 1.5, borderColor: '#1a1008', marginHorizontal: 10, overflow: 'hidden' },
  levelBarInner: { height: '100%', backgroundColor: '#22c55e' },
  levelBarPerfect: { backgroundColor: '#f5a623' },
  scoreText: { width: 52, fontSize: 12, fontWeight: '900', textAlign: 'right', color: '#22c55e' },
  scoreTextPerfect: { color: '#f5a623' },
  scoreTextLocked: { color: '#7a6a55', fontWeight: '400' },

  achRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 12, marginBottom: 10 },
  achNum: { width: 25, fontSize: 16, fontWeight: '900', color: '#f5a623' },
  achIconBox: { width: 40, alignItems: 'center' },
  achTitle: { fontSize: 14, fontWeight: '900' },
  achDesc: { fontSize: 11, color: '#7a6a55' },
});