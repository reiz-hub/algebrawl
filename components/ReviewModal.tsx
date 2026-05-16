// components/ReviewModal.tsx
// Post-game review modal — appears once per session after victory or defeat.
// Matches the existing neo-brutalist design language.

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGameStore } from '../hooks/useGameStore';
import { submitReview } from '../services/reviewService';

interface ReviewModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const STAR_COUNT = 5;

export default function ReviewModal({ visible, onDismiss }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { userId, username } = useGameStore();

  const handleSubmit = async () => {
    if (rating === 0 || !userId) return;
    setSubmitting(true);

    await submitReview({
      playerId: userId,
      username: username || 'Guest',
      rating,
      comment: comment.trim(),
    });

    setSubmitting(false);
    setRating(0);
    setComment('');
    onDismiss();
  };

  const handleSkip = () => {
    setRating(0);
    setComment('');
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.wrapper}>
          <View style={styles.shadow} />
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>HOW WAS THAT?</Text>
            <Text style={styles.subtitle}>Rate your experience!</Text>

            {/* Star row */}
            <View style={styles.starRow}>
              {Array.from({ length: STAR_COUNT }, (_, i) => {
                const starIndex = i + 1;
                const filled = starIndex <= rating;
                return (
                  <TouchableOpacity
                    key={starIndex}
                    activeOpacity={0.7}
                    onPress={() => setRating(starIndex)}
                    style={styles.starTouchable}
                  >
                    <Text style={[styles.star, filled && styles.starFilled]}>
                      {filled ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional comment */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Any thoughts? (optional)"
                placeholderTextColor="#b5a68e"
                value={comment}
                onChangeText={setComment}
                maxLength={200}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit */}
            <View style={styles.btnWrapper}>
              <View style={styles.btnShadow} />
              <TouchableOpacity
                style={[styles.btnPrimary, rating === 0 && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>
                  {submitting ? 'SENDING...' : 'SUBMIT'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip */}
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wrapper: {
    width: '100%',
    maxWidth: 350,
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#1a1008',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f5a623',
    letterSpacing: 2,
    textShadowColor: '#1a1008',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7a6a55',
    marginBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  starTouchable: {
    padding: 4,
  },
  star: {
    fontSize: 38,
    color: '#e5d9c4',
  },
  starFilled: {
    color: '#f5a623',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    minHeight: 70,
    backgroundColor: '#fff9f0',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1008',
    textAlignVertical: 'top',
  },
  btnWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 14,
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
  btnPrimary: {
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1008',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#b5a68e',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7a6a55',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
