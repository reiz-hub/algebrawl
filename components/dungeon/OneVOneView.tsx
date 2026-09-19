import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { GameFonts } from '../../constants/theme';
import { useGameStore } from '../../hooks/useGameStore';
import { checkConnectivity } from '../../services/multiplayerService';
import { soundService } from '../../services/soundService';
import NeoButton from '../NeoButton';
import TouchableOpacity from '../TouchableOpacity';

export default function OneVOneView() {
  const router = useRouter();
  const { isLoggedIn, equippedCharacter } = useGameStore();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNoConnectionModal, setShowNoConnectionModal] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const clearCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const requireLoginAndConnection = (action: () => void) => {
    if (!isLoggedIn) {
      soundService.playSound('click');
      setShowLoginModal(true);
      return;
    }
    checkConnectivity().then((isOnline: boolean) => {
      if (!isOnline) {
        soundService.playSound('click');
        setShowNoConnectionModal(true);
        return;
      }
      action();
    });
  };

  const handleCreateRoom = () => {
    requireLoginAndConnection(() => {
      router.replace({
        pathname: '/waiting-room' as any,
        params: { action: 'create', character: equippedCharacter || 'c0' },
      });
    });
  };

  const handleJoinRoom = () => {
    requireLoginAndConnection(() => {
      if (clearCodeTimerRef.current) {
        clearTimeout(clearCodeTimerRef.current);
      }
      setJoinCode('');
      setShowJoinModal(true);
    });
  };

  const handleCloseJoinModal = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setShowJoinModal(false);
    if (clearCodeTimerRef.current) {
      clearTimeout(clearCodeTimerRef.current);
    }
    clearCodeTimerRef.current = setTimeout(() => {
      setJoinCode('');
    }, 300);
  };

  const handleRequestCloseJoinModal = () => {
    if (isKeyboardVisibleRef.current) {
      Keyboard.dismiss();
      inputRef.current?.blur();
      return;
    }
    handleCloseJoinModal();
  };

  const handleSubmitJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Room codes are 6 characters long.');
      return;
    }
    Keyboard.dismiss();
    inputRef.current?.blur();
    setShowJoinModal(false);
    setJoinCode('');
    router.replace({
      pathname: '/waiting-room' as any,
      params: { action: 'join', code, character: equippedCharacter || 'c0' },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner / Header Card */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerCardShadow} />
        <View style={styles.bannerCardContent}>
          <Text style={styles.bannerEmoji}>🏠</Text>
          <Text style={styles.bannerTitle}>DIRECT 1V1 LOBBY</Text>
          <Text style={styles.bannerSubtitle}>
            Challenge your friends online with a private 6-character room code!
          </Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <NeoButton
          wrapperStyle={styles.actionBtnWrapper}
          style={styles.createBtn}
          onPress={handleCreateRoom}
        >
          <Feather name="plus-circle" size={24} color="#fff" />
          <Text style={styles.btnText}>Create Room</Text>
        </NeoButton>

        <NeoButton
          wrapperStyle={styles.actionBtnWrapper}
          style={styles.joinBtn}
          onPress={handleJoinRoom}
        >
          <Feather name="log-in" size={24} color="#fff" />
          <Text style={styles.btnText}>Join Room</Text>
        </NeoButton>
      </View>

      {/* How It Works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>HOW DIRECT 1V1 WORKS</Text>
        <Text style={styles.infoItem}>1. Tap <Text style={{ fontWeight: '900' }}>Create Room</Text> to generate a unique 6-character code.</Text>
        <Text style={styles.infoItem}>2. Share your room code with your opponent.</Text>
        <Text style={styles.infoItem}>3. Your opponent taps <Text style={{ fontWeight: '900' }}>Join Room</Text> and enters the code.</Text>
        <Text style={styles.infoItem}>4. Both players complete the Ready Check and battle in real time!</Text>
      </View>

      {/* Join Room Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={handleRequestCloseJoinModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
          enabled={showJoinModal}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={[styles.modalWrapper, styles.joinModalWrapper]}>
            <View style={styles.modalShadow} />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>JOIN ROOM</Text>
              <Text style={styles.modalSubtitle}>Enter the 6-character room code</Text>

              <TextInput
                ref={inputRef}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
                style={styles.codeInput}
                placeholder="XXXXXX"
                placeholderTextColor="#b0a18e"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus={showJoinModal}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={handleCloseJoinModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalJoinBtn, joinCode.length !== 6 && styles.modalBtnDisabled]}
                  onPress={handleSubmitJoin}
                  disabled={joinCode.length !== 6}
                >
                  <Text style={styles.modalJoinText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Login Required Modal */}
      <Modal visible={showLoginModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loginModalWrapper}>
            <View style={styles.loginModalShadow} />
            <View style={styles.loginModalContent}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeIcon}>🔒</Text>
              </View>

              <Text style={styles.loginModalTitle}>LOGIN REQUIRED</Text>
              <Text style={styles.loginModalSubtitle}>
                Sign in or register to create or join online rooms!
              </Text>

              <View style={styles.loginActionCol}>
                <TouchableOpacity
                  style={styles.loginBtnPrimary}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowLoginModal(false);
                    router.replace('/(tabs)/profile' as any);
                  }}
                >
                  <Feather name="log-in" size={18} color="#fff" />
                  <Text style={styles.loginBtnPrimaryText}>GO TO LOGIN / REGISTER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginCancelBtn}
                  onPress={() => {
                    soundService.playSound('click');
                    setShowLoginModal(false);
                  }}
                >
                  <Text style={styles.loginCancelText}>MAYBE LATER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* No Internet Connection Modal */}
      <Modal visible={showNoConnectionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.noConnModalWrapper}>
            <View style={styles.noConnModalShadow} />
            <View style={styles.noConnModalContent}>
              <View style={styles.noConnIconBadge}>
                <Text style={styles.noConnIconText}>📡</Text>
              </View>

              <Text style={styles.noConnTitle}>NO CONNECTION</Text>
              <Text style={styles.noConnSubtitle}>
                {"You're offline! 1v1 rooms require an active internet connection."}
              </Text>

              <TouchableOpacity
                style={styles.noConnBtn}
                onPress={() => {
                  soundService.playSound('click');
                  setShowNoConnectionModal(false);
                }}
              >
                <Text style={styles.noConnBtnText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  bannerCard: {
    position: 'relative',
    width: '100%',
  },
  bannerCardShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  bannerCardContent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  bannerEmoji: {
    fontSize: 32,
  },
  bannerTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  createBtn: {
    backgroundColor: '#16a34a',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinBtn: {
    backgroundColor: '#1a6cf5',
    borderWidth: 3,
    borderColor: '#1a1008',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: GameFonts.brawl,
    color: '#fff',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1a1008',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoItem: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#554838',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  joinModalWrapper: {
    marginBottom: 100,
  },
  modalShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  modalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 18,
    color: '#1a1008',
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 12,
    color: '#7a6a55',
    marginTop: 4,
    marginBottom: 16,
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a1008',
    borderRadius: 12,
    fontSize: 26,
    fontFamily: GameFonts.impact,
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 12,
    color: '#1a1008',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e5d9c4',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#1a1008',
  },
  modalJoinBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a6cf5',
    borderWidth: 2,
    borderColor: '#1a1008',
    alignItems: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalJoinText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
  },
  loginModalWrapper: {
    width: '100%',
    maxWidth: 340,
    position: 'relative',
  },
  loginModalShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  loginModalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  lockBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadgeIcon: {
    fontSize: 26,
  },
  loginModalTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
  },
  loginModalSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  loginActionCol: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  loginBtnPrimary: {
    backgroundColor: '#1a6cf5',
    borderWidth: 2.5,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnPrimaryText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },
  loginCancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginCancelText: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
  },
  noConnModalWrapper: {
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  noConnModalShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  noConnModalContent: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  noConnIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#1a1008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConnIconText: {
    fontSize: 24,
  },
  noConnTitle: {
    fontFamily: GameFonts.brawl,
    fontSize: 16,
    color: '#1a1008',
    textAlign: 'center',
  },
  noConnSubtitle: {
    fontFamily: GameFonts.hud,
    fontSize: 11,
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 16,
  },
  noConnBtn: {
    width: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  noConnBtnText: {
    fontFamily: GameFonts.brawl,
    fontSize: 12,
    color: '#fff',
  },
});
