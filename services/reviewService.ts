// services/reviewService.ts
// Handles all review-related Supabase operations.
// Uses a top-level "reviews" table — separate from existing endpoints.

import { supabase } from './supabase';

export interface ReviewPayload {
  playerId: string;
  username: string;
  rating: number; // 1–5
  comment?: string;
}

/**
 * Submit a post-game review to Supabase.
 * Returns the new row ID on success, or null on failure.
 */
export const submitReview = async (payload: ReviewPayload): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        player_id: payload.playerId,
        username: payload.username,
        rating: payload.rating,
        comment: payload.comment ?? '',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[reviewService] submitReview failed:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.warn('[reviewService] submitReview failed:', error);
    return null;
  }
};
