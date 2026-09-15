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
import TopBar from '../components/TopBar';
import TouchableOpacity from '../components/TouchableOpacity';
import { GameFonts } from '../constants/theme';
import { useGameStore } from '../hooks/useGameStore';
import { supabase } from '../services/supabase';
import { fetchFromSupabase, lookupByEmail, lookupByIngameName, lookupByUsername, syncToSupabase } from '../services/supabaseSync';
import { sendEmailLinkedNotification } from '../services/emailService';

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

const LOCK_ICON = require('../assets/icons/UI_icons/lock.png');
const ACHIEVEMENTS_ICON = require('../assets/icons/UI_icons/achievements.png');

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
  { id: 'g1', name: 'No. 2 Pencil', stat: '+2s / Q', icon: '✏️', image: require('../assets/icons/gears/no2_pencil.png'), unlockLevel: 1 },
  { id: 'g2', name: 'Study Notes', stat: '+1 Heart', icon: '📓', image: require('../assets/icons/gears/study_notes.png'), unlockLevel: 1 },
  { id: 'g3', name: 'Math Ruler', stat: '+4s / Q', icon: '📏', image: require('../assets/icons/gears/math_ruler.png'), unlockLevel: 3 },
  { id: 'g4', name: 'Pocket Calc', stat: '+2 Hearts', icon: '📱', image: require('../assets/icons/gears/pocket_calc.png'), unlockLevel: 5 },
  { id: 'g5', name: 'Golden Protractor', stat: '2x XP Boost', icon: '📐', image: require('../assets/icons/gears/golden_protractor.png'), unlockLevel: 7 },
];

const SKILLS = [
  { id: 's1', name: 'Basic Attack', desc: 'Standard Damage', icon: '⚔️', image: require('../assets/icons/skills/basic_attack.png'), unlockLevel: 1 },
  { id: 's2', name: 'Focus', desc: '+5s Timer (1x)', icon: '⏱️', image: require('../assets/icons/skills/skills.png'), unlockLevel: 2 },
  { id: 's3', name: 'Shield', desc: 'Block 1 Hit (1x)', icon: '🛡️', image: require('../assets/icons/skills/shield.png'), unlockLevel: 4 },
  { id: 's4', name: 'Double Strike', desc: '2x Damage (1x)', icon: '🔥', image: require('../assets/icons/skills/double_strike.png'), unlockLevel: 6 },
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

export default function PlayerStatsScreen({ showBackButton = true }: { showBackButton?: boolean } = {}) {
  const router = useRouter();

  const {
    userId, unlockedLevel, totalXP, totalBattlesWon,
    totalBattles, maxStreak, levelStars, username, ingameName,
    email, setEmail,
    isLoggedIn, loginWithData, setUsername, setIngameName, logout,
    equippedCharacter, equipItem, inventory,
  } = useGameStore();

  const [showEditIngameModal, setShowEditIngameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editIngameName, setEditIngameName] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
    { id: 1, icon: '🎯', image: require('../assets/icons/achievements/first_blood.png'), title: 'First Blood', desc: 'Win your first battle', done: totalBattlesWon >= 1 },
    { id: 2, icon: '🔥', image: require('../assets/icons/achievements/onfire.png'), title: 'On Fire', desc: '5 streak in one battle', done: safeMaxStreak >= 5 },
    { id: 3, icon: '👑', image: require('../assets/icons/achievements/undefeated.png'), title: 'Undefeated', desc: 'Win 5 battles total', done: totalBattlesWon >= 5 },
    { id: 4, icon: '💀', image: require('../assets/icons/achievements/boss_slayer.png'), title: 'Boss Slayer', desc: 'Defeat the Math Overlord', done: !!levelStars[7] },
    { id: 5, icon: '⚡', image: require('../assets/icons/achievements/speed_demon.png'), title: 'Speed Demon', desc: 'Answer in under 5 seconds', done: false },
    { id: 6, icon: '💎', image: require('../assets/icons/achievements/Perfectionist.png'), title: 'Perfectionist', desc: 'Perfect score on all levels', done: LEVELS.every(lvl => (levelStars[lvl.id] || 0) === lvl.questions) },
  ];

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

            {!username && (
              <TouchableOpacity
                style={{ marginTop: 8, marginBottom: 12, alignItems: 'center' }}
                onPress={() => {
                  setShowEditIngameModal(false);
                  router.push('/profile');
                }}
              >
                <Text style={{ fontFamily: GameFonts.hud, fontSize: 12, color: '#1a6cf5', fontWeight: '800' }}>
                  Want to claim a login username? Tap here →
                </Text>
              </TouchableOpacity>
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
      {/* Header with standard TopBar and Back button on the right */}
      <TopBar title="PLAYER PROFILE" />

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playerName}>{displayName}</Text>
                  <TouchableOpacity
                    onPress={() => { setEditIngameName(ingameName || username || ''); setShowEditIngameModal(true); }}
                    style={{ padding: 4 }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit" size={14} color="#1a1008" />
                  </TouchableOpacity>
                </View>
                <View style={styles.rankBadge}><Text style={styles.rankText}>{playerRank}</Text></View>
              </View>
            </View>
            <Text style={styles.statLabel}>LEVEL {unlockedLevel}</Text>
            <View style={styles.xpBarOuter}><View style={[styles.xpBarInner, { width: `${xpProgress}%` }]} /></View>
          </View>
        </View>

        {/* EQUIPMENT */}
        <Text style={styles.sectionHeader}>EQUIPMENT</Text>
        <View style={styles.gearRow}>
          {GEARS.filter((gear) => inventory.includes(gear.id) || gear.id === 'g1').map((gear) => (
            <View key={gear.id} style={styles.iconBox}>
              {gear.image ? (
                <Image source={gear.image} style={{ width: 42, height: 42 }} resizeMode="contain" />
              ) : (
                <Text style={styles.gearIcon}>{gear.icon}</Text>
              )}
            </View>
          ))}
        </View>

        {/* SKILLS */}
        <Text style={styles.sectionHeader}>SKILLS</Text>
        <View style={styles.gearRow}>
          {SKILLS.filter((skill) => inventory.includes(skill.id) || skill.id === 's1').map((skill) => (
            <View key={skill.id} style={styles.iconBox}>
              {skill.image ? (
                <Image source={skill.image} style={{ width: 42, height: 42 }} resizeMode="contain" />
              ) : (
                <Text style={styles.gearIcon}>{skill.icon}</Text>
              )}
            </View>
          ))}
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
            return (
              <View key={lvl.id} style={[styles.levelProgressRow, isLocked && { opacity: 0.4 }]}>
                <Text style={styles.levelNameText}>{lvl.name}</Text>
                <View style={styles.levelBarOuter}>
                  <View style={[
                    styles.levelBarInner,
                    lvl.id === 7 && styles.levelBarRandom,
                    { width: `${progressPercent}%` },
                    isPerfect && styles.levelBarPerfect,
                  ]} />
                </View>
                {isLocked ? (
                  <View style={styles.levelLockBox}>
                    <Image source={LOCK_ICON} style={styles.levelLockIcon} resizeMode="contain" />
                  </View>
                ) : (
                  <Text style={[
                    styles.scoreText,
                    lvl.id === 7 && styles.scoreTextRandom,
                    isPerfect && styles.scoreTextPerfect,
                  ]}>
                    {scoreEarned}/{lvl.questions}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ACHIEVEMENTS */}
        <View style={styles.sectionHeaderRow}>
          <Image source={ACHIEVEMENTS_ICON} style={styles.sectionHeaderIcon} resizeMode="contain" />
          <Text style={styles.sectionHeaderInline}>ACHIEVEMENTS</Text>
        </View>
        {achievements.map((ach) => (
          <View key={ach.id} style={[styles.achRow, !ach.done && { opacity: 0.5 }]}>
            <Text style={styles.achNum}>{ach.id}</Text>
            <View style={styles.achIconBox}>
              {ach.image ? (
                <Image source={ach.image} style={styles.achImage} resizeMode="contain" />
              ) : (
                <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.desc}</Text>
            </View>
            <View style={styles.achStatusBox}>
              {ach.done ? (
                <Text style={{ fontSize: 18 }}>✅</Text>
              ) : (
                <Image source={LOCK_ICON} style={styles.achLockIcon} resizeMode="contain" />
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Profile Modals */}
      {renderEditIngameModal()}
      {renderAvatarModal()}

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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10, gap: 8 },
  sectionHeaderIcon: { width: 22, height: 22 },
  sectionHeaderInline: { fontFamily: GameFonts.brawl, fontSize: 14, color: '#1a1008', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { marginBottom: 15 },
  cardShadow: { position: 'absolute', top: 4, left: 4, width: '100%', height: '100%', backgroundColor: '#1a1008', borderRadius: 12 },
  cardInner: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 15 },
  avatarRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  avatarBox: { width: 80, height: 80, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarEditBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1a6cf5', borderRadius: 12, width: 22, height: 22, borderWidth: 2, borderColor: '#1a1008', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 72, height: 72 },
  profileInfo: { flex: 1, justifyContent: 'center' },
  playerName: { fontFamily: GameFonts.brawl, fontSize: 16, color: '#1a1008' },
  rankBadge: { backgroundColor: '#e5d9c4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 2, borderColor: '#1a1008', alignSelf: 'flex-start', marginTop: 2 },
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
  logoutBtn: { backgroundColor: '#e8302a', borderWidth: 2.5, borderColor: '#1a1008', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
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
  levelBarRandom: { backgroundColor: '#f5a623' },
  levelBarPerfect: { backgroundColor: '#f5a623' },
  scoreText: { fontFamily: GameFonts.brawl, width: 52, fontSize: 10, textAlign: 'right', color: '#22c55e' },
  scoreTextRandom: { color: '#f5a623' },
  scoreTextPerfect: { color: '#f5a623' },
  scoreTextLocked: { color: '#7a6a55' },
  levelLockBox: { width: 52, alignItems: 'flex-end', justifyContent: 'center' },
  levelLockIcon: { width: 14, height: 14 },

  achRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1a1008', borderRadius: 12, padding: 12, marginBottom: 10 },
  achNum: { fontFamily: GameFonts.brawl, width: 25, fontSize: 12, color: '#f5a623' },
  achIconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  achImage: { width: 36, height: 36 },
  achTitle: { fontFamily: GameFonts.brawl, fontSize: 12, color: '#1a1008' },
  achDesc: { fontFamily: GameFonts.hud, fontSize: 11, color: '#7a6a55' },
  achStatusBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  achLockIcon: { width: 20, height: 20 },
});