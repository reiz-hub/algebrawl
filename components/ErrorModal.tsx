// components/ErrorModal.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  subMessage?: string;
  onDismiss: () => void;
}

export default function ErrorModal({ visible, title, message, subMessage, onDismiss }: ErrorModalProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Shake the icon after entrance
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Card shadow (neo-brutalist) */}
          <View style={styles.cardShadow} />

          <View style={styles.card}>
            {/* Warning icon */}
            <Animated.View
              style={[styles.iconContainer, { transform: [{ translateX: shakeAnim }] }]}
            >
              <Text style={styles.iconText}>⚠️</Text>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Message */}
            <Text style={styles.message}>{message}</Text>
            
            {subMessage && (
              <Text style={styles.subMessage}>{subMessage}</Text>
            )}

            {/* Button */}
            <View style={styles.btnWrapper}>
              <View style={styles.btnShadow} />
              <TouchableOpacity
                style={styles.dismissBtn}
                activeOpacity={0.8}
                onPress={onDismiss}
              >
                <Text style={styles.dismissBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 20,
  },
  card: {
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3cd',
    borderWidth: 3,
    borderColor: '#f5a623',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e8302a',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#e8302a',
    borderRadius: 2,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1008',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  subMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7a6a55',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  btnWrapper: {
    position: 'relative',
    width: '100%',
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
  dismissBtn: {
    backgroundColor: '#f5a623',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#1a1008',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
