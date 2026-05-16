// services/reviewService.ts
// Handles all review-related Firestore operations.
// Uses a top-level "reviews" collection — separate from existing endpoints.

import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ReviewPayload {
  playerId: string;
  username: string;
  rating: number; // 1–5
  comment?: string;
}

/**
 * Submit a post-game review to Firestore.
 * Returns the new document ID on success, or null on failure.
 */
export const submitReview = async (payload: ReviewPayload): Promise<string | null> => {
  try {
    const ref = await addDoc(collection(db, 'reviews'), {
      playerId: payload.playerId,
      username: payload.username,
      rating: payload.rating,
      comment: payload.comment ?? '',
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.warn('[reviewService] submitReview failed:', error);
    return null;
  }
};
