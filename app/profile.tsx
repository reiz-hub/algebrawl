// app/profile.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../hooks/useGameStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, username, setUsername } = useGameStore();
  const [inputValue, setInputValue] = useState(username || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Username cannot be empty.');
      return;
    }
    if (trimmed.length < 3) {
      Alert.alert('Too Short', 'Username must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 20) {
      Alert.alert('Too Long', 'Username must be 20 characters or fewer.');
      return;
    }

    setUsername(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      <View style={styles.content}>
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
              {username ? 'YOUR USERNAME' : 'CLAIM A USERNAME'}
            </Text>
            <Text style={styles.hint}>
              {username
                ? 'You can update your username at any time.'
                : 'Set a username to log in from other devices and recover your progress.'}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter username..."
                placeholderTextColor="#b5a58d"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.btnWrapper}>
              <View style={styles.btnShadow} />
              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                activeOpacity={0.8}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>
                  {saved ? '✓ SAVED!' : username ? 'UPDATE USERNAME' : 'CLAIM USERNAME'}
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
      </View>
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
