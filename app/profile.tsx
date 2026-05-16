import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { lookupByUsername, lookupByIngameName } from '../services/firestoreSync';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, username, setUsername, ingameName, setIngameName } = useGameStore();
  
  const [usernameInput, setUsernameInput] = useState(username || '');
  const [ingameNameInput, setIngameNameInput] = useState(ingameName || '');
  
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [ingameSaved, setIngameSaved] = useState(false);

  const handleSaveUsername = async () => {
    if (username) return; // Locked
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      Alert.alert('Invalid', 'Username must be 3-20 characters.');
      return;
    }
    
    const existing = await lookupByUsername(trimmed);
    if (existing && existing.userId !== userId) {
      Alert.alert('Taken', 'This username is already taken by another user.');
      return;
    }

    setUsername(trimmed);
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  };

  const handleSaveIngameName = async () => {
    const trimmed = ingameNameInput.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      Alert.alert('Invalid', 'In-game name must be 3-20 characters.');
      return;
    }
    
    const existing = await lookupByIngameName(trimmed);
    if (existing && existing.userId !== userId) {
      Alert.alert('Taken', 'This in-game name is already taken by another user.');
      return;
    }

    setIngameName(trimmed);
    setIngameSaved(true);
    setTimeout(() => setIngameSaved(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PROFILE</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Guest ID Card */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>YOUR PLAYER ID</Text>
            <Text style={styles.guestId} numberOfLines={1} ellipsizeMode="middle">
              {userId || 'Loading...'}
            </Text>
            <Text style={styles.hint}>
              This is your unique guest ID. Your progress is saved under this ID.
            </Text>
          </View>
        </View>

        {/* Username Section */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>
              {username ? 'LOGIN USERNAME' : 'CLAIM A USERNAME'}
            </Text>
            <Text style={styles.hint}>
              {username
                ? 'This is your permanent username used for logging in.'
                : 'Set a username to log in from other devices.'}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, username ? styles.inputDisabled : null]}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter username..."
                placeholderTextColor="#b5a58d"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!username}
              />
            </View>

            {!username && (
              <View style={styles.btnWrapper}>
                <View style={styles.btnShadow} />
                <TouchableOpacity
                  style={[styles.saveBtn, usernameSaved && styles.saveBtnDone]}
                  activeOpacity={0.8}
                  onPress={handleSaveUsername}
                >
                  <Text style={styles.saveBtnText}>
                    {usernameSaved ? '✓ CLAIMED!' : 'CLAIM USERNAME'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* In-game Name Section */}
        <View style={styles.card}>
          <View style={styles.cardShadow} />
          <View style={styles.cardInner}>
            <Text style={styles.label}>IN-GAME NAME</Text>
            <Text style={styles.hint}>
              This is the name other players will see. You can change it anytime.
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={ingameNameInput}
                onChangeText={setIngameNameInput}
                placeholder="Enter in-game name..."
                placeholderTextColor="#b5a58d"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.btnWrapper}>
              <View style={styles.btnShadow} />
              <TouchableOpacity
                style={[styles.saveBtn, ingameSaved && styles.saveBtnDone]}
                activeOpacity={0.8}
                onPress={handleSaveIngameName}
              >
                <Text style={styles.saveBtnText}>
                  {ingameSaved ? '✓ SAVED!' : 'UPDATE IN-GAME NAME'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          activeOpacity={0.7}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold}>Log in here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 24, fontWeight: '900', color: '#1a1008' },
  title: {
    fontSize: 28,
    color: '#1a1008',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: { padding: 24 },
  card: { marginBottom: 24, position: 'relative' },
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
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7a6a55',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  guestId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1008',
    backgroundColor: '#f5f0e6',
    borderWidth: 2,
    borderColor: '#e5d9c4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    marginBottom: 8,
    overflow: 'hidden',
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7a6a55',
    lineHeight: 18,
  },
  inputRow: { marginTop: 12 },
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
  },
  inputDisabled: {
    backgroundColor: '#e5d9c4',
    color: '#7a6a55',
  },
  btnWrapper: { position: 'relative', marginTop: 16 },
  btnShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDone: {
    backgroundColor: '#22c55e',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7a6a55',
  },
  loginLinkBold: {
    color: '#1a6cf5',
    fontWeight: '900',
  },
});
