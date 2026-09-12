// services/multiplayerService.ts
// Core multiplayer service — manages rooms, queue, and Realtime channels

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { calculateMmrChange } from './mmrService';

/* ── Connectivity Check ──────────────────────────────────── */

/**
 * Quick connectivity check — pings the Supabase REST endpoint with a
 * lightweight HEAD request. Returns true if the device is online and can
 * reach the backend, false otherwise. Uses a 5-second timeout so it
 * never blocks the UI for too long.
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://bhjkpepmrklicrkqparx.supabase.co/rest/v1/', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status === 401; // 401 is expected (no auth header) but proves connectivity
  } catch {
    return false;
  }
}

/* ── Types ───────────────────────────────────────────────── */

export interface MatchRoom {
  id: string;
  room_code: string | null;
  mode: 'lobby' | 'ranked';
  status: 'waiting' | 'ready_check' | 'playing' | 'finished' | 'cancelled';
  host_id: string;
  guest_id: string | null;
  host_name: string | null;
  guest_name: string | null;
  host_mmr: number;
  guest_mmr: number;
  question_seed: number;
  selected_topics?: number[];
  host_ready?: boolean;
  guest_ready?: boolean;
  host_character?: string;
  guest_character?: string;
  host_score: number;
  guest_score: number;
  winner_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface QueueEntry {
  id: string;
  player_id: string;
  player_name: string | null;
  mmr: number;
  character?: string;
  queued_at: string;
}

export type PlayerAction = {
  playerId: string;
  action: 'correct' | 'wrong' | 'timeout' | 'knockout';
  score: number;
  questionIndex: number;
  hearts?: number;
  timestamp: number;
};

export type MatchEvent =
  | { event: 'opponent_joined'; opponentName: string; opponentMmr: number; opponentCharacter?: string }
  | { event: 'topics_updated'; selectedTopics: number[] }
  | { event: 'player_ready'; playerId: string; isReady: boolean; character?: string }
  | { event: 'player_info'; playerId: string; character: string }
  | { event: 'ready_check_failed'; reason: string }
  | { event: 'match_start'; startedAt: string; questionSeed: number; selectedTopics?: number[] }
  | { event: 'player_action'; payload: PlayerAction }
  | { event: 'match_finished'; winnerId: string | null; hostScore: number; guestScore: number };

/* ── Room Code Generator ─────────────────────────────────── */

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ── Room Management ─────────────────────────────────────── */

/**
 * Create a new lobby room with a random join code.
 */
export async function createRoom(
  hostId: string,
  hostName: string,
  hostMmr: number,
  selectedTopics: number[] = [1, 2, 3, 4, 5, 6, 7],
  hostCharacter: string = 'c0'
): Promise<MatchRoom | null> {
  const roomCode = generateRoomCode();
  const questionSeed = Math.floor(Math.random() * 2147483647);

  const payload: Record<string, any> = {
    room_code: roomCode,
    mode: 'lobby',
    status: 'waiting',
    host_id: hostId,
    host_name: hostName,
    host_mmr: hostMmr,
    host_character: hostCharacter,
    question_seed: questionSeed,
    selected_topics: selectedTopics,
    duration_seconds: 300,
  };

  let { data, error } = await supabase
    .from('match_rooms')
    .insert(payload)
    .select()
    .single();

  // If column doesn't exist in Supabase yet (PGRST204), fallback to insert without it
  if (error && (error.code === 'PGRST204' || error.message?.includes('selected_topics') || error.message?.includes('character') || error.message?.includes('column'))) {
    console.warn('[Multiplayer] Column missing in DB; falling back to resilient insert.');
    delete payload.selected_topics;
    delete payload.host_character;
    const retry = await supabase
      .from('match_rooms')
      .insert(payload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.warn('[Multiplayer] Create room failed:', error.message || error);
    return null;
  }

  return data as MatchRoom;
}

/**
 * Update the fundamental topics for a lobby room.
 */
export async function updateRoomTopics(
  roomId: string,
  topics: number[]
): Promise<boolean> {
  const { error } = await supabase
    .from('match_rooms')
    .update({ selected_topics: topics })
    .eq('id', roomId);

  if (error) {
    if (error.code === 'PGRST204' || error.message?.includes('selected_topics')) {
      // Column not yet in DB; topics are still synced via Realtime broadcast
      return true;
    }
    console.warn('[Multiplayer] Update room topics failed:', error.message || error);
    return false;
  }
  return true;
}

/**
 * Join an existing lobby room by code.
 */
export async function joinRoom(
  roomCode: string,
  guestId: string,
  guestName: string,
  guestMmr: number,
  guestCharacter: string = 'c0'
): Promise<MatchRoom | null> {
  // Find the room
  const { data: room, error: findError } = await supabase
    .from('match_rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'waiting')
    .is('guest_id', null)
    .single();

  if (findError || !room) {
    console.warn('[Multiplayer] Room not found or already full:', findError);
    return null;
  }

  const updatePayload: Record<string, any> = {
    guest_id: guestId,
    guest_name: guestName,
    guest_mmr: guestMmr,
    guest_character: guestCharacter,
  };

  // Claim the guest slot
  let { data, error: updateError } = await supabase
    .from('match_rooms')
    .update(updatePayload)
    .eq('id', room.id)
    .is('guest_id', null) // Optimistic concurrency: only if still vacant
    .select()
    .single();

  if (updateError && (updateError.code === 'PGRST204' || updateError.message?.includes('character') || updateError.message?.includes('column'))) {
    delete updatePayload.guest_character;
    const retry = await supabase
      .from('match_rooms')
      .update(updatePayload)
      .eq('id', room.id)
      .is('guest_id', null)
      .select()
      .single();
    data = retry.data;
    updateError = retry.error;
  }

  if (updateError || !data) {
    console.warn('[Multiplayer] Failed to join room (race condition?):', updateError);
    return null;
  }

  return data as MatchRoom;
}

/**
 * Start a match — sets status to 'playing' and records the start time.
 */
export async function startMatch(roomId: string): Promise<boolean> {
  const { error } = await supabase
    .from('match_rooms')
    .update({
      status: 'playing',
      started_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (error) {
    console.warn('[Multiplayer] Start match failed:', error);
    return false;
  }
  return true;
}

/**
 * End a match — record final scores and winner.
 */
export async function finishMatch(
  roomId: string,
  hostScore: number,
  guestScore: number,
  winnerId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('match_rooms')
    .update({
      status: 'finished',
      host_score: hostScore,
      guest_score: guestScore,
      winner_id: winnerId,
      finished_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (error) {
    console.warn('[Multiplayer] Finish match failed:', error);
    return false;
  }
  return true;
}

/**
 * Write a match result record for a player.
 */
export async function writeMatchResult(
  roomId: string,
  playerId: string,
  opponentId: string,
  score: number,
  opponentScore: number,
  result: 'win' | 'loss' | 'draw',
  mmrChange: number,
  mmrAfter: number
): Promise<void> {
  const { error } = await supabase
    .from('match_results')
    .insert({
      room_id: roomId,
      player_id: playerId,
      opponent_id: opponentId,
      score,
      opponent_score: opponentScore,
      result,
      mmr_change: mmrChange,
      mmr_after: mmrAfter,
    });

  if (error) {
    console.warn('[Multiplayer] Write match result failed:', error);
  }
}

/**
 * Update a player's MMR in the users table.
 */
export async function updatePlayerMmr(
  playerId: string,
  newMmr: number,
  isWin: boolean
): Promise<void> {
  // Fetch current stats to increment
  const { data: current } = await supabase
    .from('users')
    .select('online_wins, online_losses')
    .eq('id', playerId)
    .single();

  const updates: Record<string, any> = { mmr: newMmr };
  if (current) {
    if (isWin) {
      updates.online_wins = (current.online_wins ?? 0) + 1;
    } else {
      updates.online_losses = (current.online_losses ?? 0) + 1;
    }
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', playerId);

  if (error) {
    console.warn('[Multiplayer] Update MMR failed:', error);
  }
}

/* ── Matchmaking Queue ───────────────────────────────────── */

/**
 * Join the ranked matchmaking queue.
 */
export async function joinQueue(
  playerId: string,
  playerName: string,
  mmr: number,
  character: string = 'c0'
): Promise<boolean> {
  // Remove any existing entry first (in case of stale queue)
  await leaveQueue(playerId);

  const payload: Record<string, any> = {
    player_id: playerId,
    player_name: playerName,
    mmr,
    character,
  };

  let { error } = await supabase
    .from('matchmaking_queue')
    .insert(payload);

  if (error && (error.code === 'PGRST204' || error.message?.includes('character') || error.message?.includes('column'))) {
    delete payload.character;
    const retry = await supabase.from('matchmaking_queue').insert(payload);
    error = retry.error;
  }

  if (error) {
    console.warn('[Multiplayer] Join queue failed:', error);
    return false;
  }
  return true;
}

/**
 * Leave the matchmaking queue.
 */
export async function leaveQueue(playerId: string): Promise<void> {
  await supabase
    .from('matchmaking_queue')
    .delete()
    .eq('player_id', playerId);
}

/**
 * Find an opponent in the queue within a maximum MMR difference (default 200, human players only).
 * Returns the opponent's queue entry if found, null otherwise.
 */
export async function findMatch(
  playerId: string,
  playerMmr: number,
  mmrRange: number = 200
): Promise<QueueEntry | null> {
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .neq('player_id', playerId)
    .gte('mmr', playerMmr - mmrRange)
    .lte('mmr', playerMmr + mmrRange)
    .order('queued_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as QueueEntry;
}

/**
 * Check if a ranked match room has already been created for this player.
 * Used by guests in the queue to detect when they have been matched by a host.
 */
export async function checkRankedMatch(playerId: string): Promise<MatchRoom | null> {
  const ninetySecondsAgo = new Date(Date.now() - 90000).toISOString();
  const { data, error } = await supabase
    .from('match_rooms')
    .select('*')
    .eq('guest_id', playerId)
    .eq('mode', 'ranked')
    .eq('status', 'ready_check')
    .gte('created_at', ninetySecondsAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as MatchRoom;
}

/**
 * Create a ranked room from two matched players with ready_check status.
 * Returns the room if successful, null if the opponent was already matched.
 */
export async function createRankedRoom(
  hostId: string,
  hostName: string,
  hostMmr: number,
  guestId: string,
  guestName: string,
  guestMmr: number,
  hostCharacter: string = 'c0',
  guestCharacter: string = 'c0'
): Promise<MatchRoom | null> {
  const questionSeed = Math.floor(Math.random() * 2147483647);

  const payload: Record<string, any> = {
    room_code: null, // No code for ranked
    mode: 'ranked',
    status: 'ready_check',
    host_id: hostId,
    host_name: hostName,
    host_mmr: hostMmr,
    host_character: hostCharacter,
    guest_id: guestId,
    guest_name: guestName,
    guest_mmr: guestMmr,
    guest_character: guestCharacter,
    host_ready: false,
    guest_ready: false,
    question_seed: questionSeed,
    duration_seconds: 300,
  };

  // Create the room in 'ready_check' status
  let { data: room, error: roomError } = await supabase
    .from('match_rooms')
    .insert(payload)
    .select()
    .single();

  // If host_ready/guest_ready/character columns do not exist in DB yet (PGRST204), fallback gracefully
  if (roomError && (roomError.code === 'PGRST204' || roomError.message?.includes('ready') || roomError.message?.includes('character') || roomError.message?.includes('column'))) {
    console.warn('[Multiplayer] Ready or character columns not yet in DB schema; falling back without columns.');
    delete payload.host_ready;
    delete payload.guest_ready;
    delete payload.host_character;
    delete payload.guest_character;
    const retry = await supabase
      .from('match_rooms')
      .insert(payload)
      .select()
      .single();
    room = retry.data;
    roomError = retry.error;
  }

  if (roomError || !room) {
    console.warn('[Multiplayer] Create ranked room failed:', roomError);
    return null;
  }

  // Clean up both players from queue
  await leaveQueue(hostId);
  await leaveQueue(guestId);

  return room as MatchRoom;
}

/**
 * Atomically attempt to find and match with an opponent via server-side Postgres function.
 * Uses FOR UPDATE SKIP LOCKED to prevent ghost matches — only one client can claim
 * an opponent at a time. Returns the matched room if found, null otherwise.
 *
 * This replaces the old pattern of calling findMatch() + createRankedRoom() separately,
 * which was prone to race conditions where two clients could match the same opponent.
 */
export async function attemptMatch(
  playerId: string,
  playerMmr: number,
  playerName: string,
  playerCharacter: string = 'c0'
): Promise<MatchRoom | null> {
  const { data: roomId, error } = await supabase.rpc('attempt_match', {
    p_player_id: playerId,
    p_player_mmr: playerMmr,
    p_player_name: playerName,
    p_player_character: playerCharacter,
    p_mmr_range: 200,
  });

  if (error) {
    // If the function doesn't exist yet (not deployed), fall back gracefully
    if (error.message?.includes('attempt_match') || error.code === '42883') {
      console.warn('[Multiplayer] attempt_match() function not found in DB. Run the latest schema.sql migration.');
      return null;
    }
    console.warn('[Multiplayer] attemptMatch RPC failed:', error.message || error);
    return null;
  }

  if (!roomId) return null;

  // Fetch the full room details
  return getRoom(roomId);
}

/**
 * Update a player's ready state in a match room.
 */
export async function setPlayerReady(
  roomId: string,
  isHost: boolean,
  isReady: boolean = true
): Promise<boolean> {
  const field = isHost ? 'host_ready' : 'guest_ready';
  const { error } = await supabase
    .from('match_rooms')
    .update({ [field]: isReady })
    .eq('id', roomId);

  if (error) {
    // If column doesn't exist yet, it's still handled through Realtime broadcast
    if (error.code !== 'PGRST204' && !error.message?.includes('ready')) {
      console.warn('[Multiplayer] Set player ready failed:', error);
      return false;
    }
  }
  return true;
}

/**
 * Cancel a ranked match room (e.g. if ready check fails or timed out).
 */
export async function cancelRankedMatch(roomId: string): Promise<boolean> {
  const { error } = await supabase
    .from('match_rooms')
    .update({ status: 'cancelled' })
    .eq('id', roomId);

  if (error) {
    console.warn('[Multiplayer] Cancel ranked match failed:', error);
    return false;
  }
  return true;
}

/* ── Realtime Channel Management ─────────────────────────── */

/**
 * Subscribe to a match room's Realtime channel.
 * Returns the channel and cleanup function.
 */
export function subscribeToRoom(
  roomId: string,
  callbacks: {
    onOpponentJoined?: (name: string, mmr: number, character?: string) => void;
    onTopicsUpdated?: (selectedTopics: number[]) => void;
    onPlayerReady?: (playerId: string, isReady: boolean, character?: string) => void;
    onPlayerInfo?: (playerId: string, character: string) => void;
    onReadyCheckFailed?: (reason: string) => void;
    onMatchStart?: (startedAt: string, questionSeed: number, selectedTopics?: number[]) => void;
    onPlayerAction?: (action: PlayerAction) => void;
    onMatchFinished?: (winnerId: string | null, hostScore: number, guestScore: number) => void;
  }
): { channel: RealtimeChannel; unsubscribe: () => void } {
  const channel = supabase.channel(`match:${roomId}`);

  // Listen for broadcast events
  channel
    .on('broadcast', { event: 'opponent_joined' }, ({ payload }) => {
      callbacks.onOpponentJoined?.(payload.opponentName, payload.opponentMmr, payload.opponentCharacter);
    })
    .on('broadcast', { event: 'topics_updated' }, ({ payload }) => {
      callbacks.onTopicsUpdated?.(payload.selectedTopics);
    })
    .on('broadcast', { event: 'player_ready' }, ({ payload }) => {
      callbacks.onPlayerReady?.(payload.playerId, payload.isReady, payload.character);
    })
    .on('broadcast', { event: 'player_info' }, ({ payload }) => {
      callbacks.onPlayerInfo?.(payload.playerId, payload.character);
    })
    .on('broadcast', { event: 'ready_check_failed' }, ({ payload }) => {
      callbacks.onReadyCheckFailed?.(payload.reason);
    })
    .on('broadcast', { event: 'match_start' }, ({ payload }) => {
      callbacks.onMatchStart?.(payload.startedAt, payload.questionSeed, payload.selectedTopics);
    })
    .on('broadcast', { event: 'player_action' }, ({ payload }) => {
      callbacks.onPlayerAction?.(payload as PlayerAction);
    })
    .on('broadcast', { event: 'match_finished' }, ({ payload }) => {
      callbacks.onMatchFinished?.(payload.winnerId, payload.hostScore, payload.guestScore);
    })
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Broadcast an event to all players in a room.
 */
export async function broadcastToRoom(
  channel: RealtimeChannel,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });
}

/* ── Leaderboard ─────────────────────────────────────────── */

export interface LeaderboardEntry {
  id: string;
  username: string | null;
  ingame_name: string | null;
  mmr: number;
  online_wins: number;
  online_losses: number;
}

/**
 * Fetch the top players by MMR for the leaderboard.
 */
export async function fetchLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, ingame_name, mmr, online_wins, online_losses')
    .eq('is_guest', false)
    .eq('is_active', true)
    .order('mmr', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[Multiplayer] Fetch leaderboard failed:', error);
    return [];
  }

  return (data ?? []) as LeaderboardEntry[];
}

/**
 * Get a specific room by ID.
 */
export async function getRoom(roomId: string): Promise<MatchRoom | null> {
  const { data, error } = await supabase
    .from('match_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error || !data) return null;
  return data as MatchRoom;
}

/**
 * Subscribe to room changes in the database (for detecting opponent joining).
 */
export function subscribeToRoomChanges(
  roomId: string,
  onUpdate: (room: MatchRoom) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`room_changes:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        onUpdate(payload.new as MatchRoom);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/* ── Ranked Match History ────────────────────────────────── */

export interface RankedMatchHistoryItem {
  id: string;
  opponentName: string;
  opponentMmr: number;
  opponentCharacter?: string;
  myScore: number;
  opponentScore: number;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  myCharacter?: string;
  mmrChange: number;
  date: string;
  finishedAt: string;
}

/**
 * Fetch the last N finished ranked matches for a player (maximum 5).
 */
export async function getRankedMatchHistory(
  playerId: string,
  limit: number = 5
): Promise<RankedMatchHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('match_rooms')
      .select('*')
      .eq('mode', 'ranked')
      .eq('status', 'finished')
      .or(`host_id.eq.${playerId},guest_id.eq.${playerId}`)
      .order('finished_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.warn('[Multiplayer] Failed to fetch ranked match history:', error);
      return [];
    }

    return data.map((room: MatchRoom) => {
      const isHost = room.host_id === playerId;
      const myScore = isHost ? room.host_score : room.guest_score;
      const opponentScore = isHost ? room.guest_score : room.host_score;
      const opponentName = isHost ? (room.guest_name ?? 'Opponent') : (room.host_name ?? 'Opponent');
      const opponentMmr = isHost ? (room.guest_mmr ?? 1000) : (room.host_mmr ?? 1000);
      const myMmr = isHost ? (room.host_mmr ?? 1000) : (room.guest_mmr ?? 1000);
      const opponentCharacter = isHost ? room.guest_character : room.host_character;
      const myCharacter = isHost ? room.host_character : room.guest_character;

      let result: 'VICTORY' | 'DEFEAT' | 'DRAW' = 'DRAW';
      let mmrChange = 0;
      if (room.winner_id === playerId) {
        result = 'VICTORY';
        mmrChange = calculateMmrChange(myMmr, opponentMmr, 'win');
      } else if (room.winner_id) {
        result = 'DEFEAT';
        mmrChange = calculateMmrChange(myMmr, opponentMmr, 'loss');
      }

      return {
        id: room.id,
        opponentName,
        opponentMmr,
        opponentCharacter,
        myScore,
        opponentScore,
        result,
        myCharacter,
        mmrChange,
        date: room.finished_at || room.created_at,
        finishedAt: room.finished_at || room.created_at,
      };
    });
  } catch (err) {
    console.warn('[Multiplayer] getRankedMatchHistory error:', err);
    return [];
  }
}
