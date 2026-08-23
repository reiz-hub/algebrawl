// hooks/useMultiplayerStore.ts
// Zustand store for multiplayer session state

import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  createRoom,
  joinRoom,
  joinQueue,
  leaveQueue,
  findMatch,
  checkRankedMatch,
  createRankedRoom,
  setPlayerReady,
  cancelRankedMatch,
  startMatch,
  finishMatch,
  writeMatchResult,
  updatePlayerMmr,
  updateRoomTopics,
  subscribeToRoom,
  broadcastToRoom,
  subscribeToRoomChanges,
  getRoom,
  type MatchRoom,
  type PlayerAction,
} from '../services/multiplayerService';
import { calculateMmrChange, applyMmrChange } from '../services/mmrService';
import { generateSeededQuestions } from '../scripts/mathGenerator';
import type { Question } from '../scripts/mathGenerator';

/* ── Types ───────────────────────────────────────────────── */

export type MatchStatus =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'searching'
  | 'ready_check'
  | 'countdown'
  | 'playing'
  | 'finished';

interface MultiplayerState {
  // Room info
  roomId: string | null;
  roomCode: string | null;
  mode: 'lobby' | 'ranked' | null;
  isHost: boolean;
  matchStatus: MatchStatus;

  // Ready Check
  myReady: boolean;
  opponentReady: boolean;
  readyCountdown: number;

  // Player info
  myId: string | null;
  myName: string | null;
  myMmr: number;
  myCharacter: string;

  // Opponent info
  opponentId: string | null;
  opponentName: string | null;
  opponentMmr: number;
  opponentCharacter: string;

  // Battle state
  questionSeed: number;
  selectedTopics: number[];
  questions: Question[];
  currentQuestionIndex: number;
  myScore: number;
  opponentScore: number;
  myHearts: number;
  opponentHearts: number;
  timeRemaining: number;
  matchDuration: number;

  // Match result
  result: 'win' | 'loss' | 'draw' | null;
  mmrChange: number;

  // Queue state
  searchTime: number;
  mmrSearchRange: number;

  // Realtime
  channel: RealtimeChannel | null;
  roomChangeUnsub: (() => void) | null;

  // Error
  error: string | null;

  // Actions
  initCreateRoom: (playerId: string, playerName: string, playerMmr: number, characterId?: string) => Promise<string | null>;
  initJoinRoom: (code: string, playerId: string, playerName: string, playerMmr: number, characterId?: string) => Promise<boolean>;
  initSearchMatch: (playerId: string, playerName: string, playerMmr: number, characterId?: string) => Promise<void>;
  enterReadyCheck: (room: MatchRoom, isHost: boolean, characterId?: string) => Promise<void>;
  setReady: () => Promise<void>;
  startRankedCountdown: () => Promise<void>;
  handleReadyCheckTimeout: () => Promise<void>;
  handleReadyCheckFailed: (reason?: string) => Promise<void>;
  setSelectedTopics: (topics: number[]) => Promise<void>;
  setMyHearts: (hearts: number) => void;
  setOpponentHearts: (hearts: number) => void;
  cancelSearch: (playerId: string) => Promise<void>;
  hostStartMatch: () => Promise<void>;
  answerQuestion: (isCorrect: boolean, hearts?: number) => void;
  endMatch: (playerId: string, forcedWinnerId?: string | null) => Promise<void>;
  setTimeRemaining: (time: number) => void;
  incrementSearchTime: () => void;
  setReadyCountdown: (time: number) => void;
  reset: () => void;
  cleanup: () => void;
}

/* ── Initial state ───────────────────────────────────────── */

const initialState = {
  roomId: null,
  roomCode: null,
  mode: null as 'lobby' | 'ranked' | null,
  isHost: false,
  matchStatus: 'idle' as MatchStatus,
  myReady: false,
  opponentReady: false,
  readyCountdown: 10,
  myId: null,
  myName: null,
  myMmr: 1000,
  myCharacter: 'c0',
  opponentId: null,
  opponentName: null,
  opponentMmr: 1000,
  opponentCharacter: 'c0',
  questionSeed: 0,
  selectedTopics: [1, 2, 3, 4, 5, 6, 7],
  questions: [] as Question[],
  currentQuestionIndex: 0,
  myScore: 0,
  opponentScore: 0,
  myHearts: 3,
  opponentHearts: 3,
  timeRemaining: 300,
  matchDuration: 300,
  result: null as 'win' | 'loss' | 'draw' | null,
  mmrChange: 0,
  searchTime: 0,
  mmrSearchRange: 200,
  channel: null as RealtimeChannel | null,
  roomChangeUnsub: null as (() => void) | null,
  error: null as string | null,
};

/* ── Store ───────────────────────────────────────────────── */

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  ...initialState,

  /**
   * Set fundamental topics for the lobby room and sync with opponent.
   */
  setSelectedTopics: async (topics: number[]) => {
    const validTopics = topics.length > 0 ? topics : [1, 2, 3, 4, 5, 6, 7];
    set({ selectedTopics: validTopics });

    const state = get();
    if (state.channel) {
      await broadcastToRoom(state.channel, 'topics_updated', {
        selectedTopics: validTopics,
      });
    }
    if (state.roomId && state.isHost) {
      await updateRoomTopics(state.roomId, validTopics);
    }
  },

  setMyHearts: (hearts: number) => {
    set({ myHearts: hearts });
  },

  setOpponentHearts: (hearts: number) => {
    set({ opponentHearts: hearts });
  },

  /**
   * Create a lobby room and wait for an opponent.
   * Returns the room code on success, null on failure.
   */
  initCreateRoom: async (playerId, playerName, playerMmr, characterId = 'c0') => {
    const topics = get().selectedTopics;
    set({ matchStatus: 'creating', myId: playerId, myName: playerName, myMmr: playerMmr, myCharacter: characterId, error: null, myHearts: 3, opponentHearts: 3 });

    const room = await createRoom(playerId, playerName, playerMmr, topics);
    if (!room) {
      set({ matchStatus: 'idle', error: 'Failed to create room. Please try again.' });
      return null;
    }

    // Subscribe to realtime channel
    const { channel } = subscribeToRoom(room.id, {
      onOpponentJoined: (name, mmr, char) => {
        set({
          opponentName: name,
          opponentMmr: mmr,
          ...(char ? { opponentCharacter: char } : {}),
        });
        // Reply back with host's equipped character
        if (channel) {
          broadcastToRoom(channel, 'player_info', {
            playerId,
            character: characterId,
          });
        }
      },
      onPlayerInfo: (pid, char) => {
        if (pid !== playerId && char) {
          set({ opponentCharacter: char });
        }
      },
      onTopicsUpdated: (selectedTopics) => {
        set({ selectedTopics });
      },
      onPlayerAction: (action) => {
        if (action.playerId !== playerId) {
          set({
            opponentScore: action.score,
            ...(action.hearts !== undefined ? { opponentHearts: action.hearts } : {}),
          });
        }
      },
      onMatchFinished: async (winnerId, hostScore, guestScore) => {
        const state = get();
        if (state.matchStatus !== 'finished') {
          const isRanked = state.mode === 'ranked';
          const result = winnerId === playerId ? 'win' : winnerId === null ? 'draw' : 'loss';
          let mmrChange = 0;
          let newMmr = state.myMmr;
          if (isRanked && result !== 'draw') {
            mmrChange = calculateMmrChange(state.myMmr, state.opponentMmr, result);
            newMmr = applyMmrChange(state.myMmr, mmrChange);
            if (playerId) {
              await updatePlayerMmr(playerId, newMmr, result === 'win');
            }
          }
          set({
            matchStatus: 'finished',
            result,
            mmrChange,
            myScore: state.isHost ? hostScore : guestScore,
            opponentScore: state.isHost ? guestScore : hostScore,
          });
        }
      },
    });

    // Subscribe to DB changes to detect opponent joining
    const { unsubscribe: roomChangeUnsub } = subscribeToRoomChanges(room.id, (updatedRoom) => {
      if (updatedRoom.guest_id && !get().opponentId) {
        set({
          opponentId: updatedRoom.guest_id,
          opponentName: updatedRoom.guest_name ?? 'Opponent',
          opponentMmr: updatedRoom.guest_mmr ?? 1000,
          ...(updatedRoom.guest_character ? { opponentCharacter: updatedRoom.guest_character } : {}),
        });
      }
      if (updatedRoom.status === 'playing' && get().matchStatus !== 'playing') {
        const activeTopics = updatedRoom.selected_topics || get().selectedTopics;
        const questions = generateSeededQuestions(updatedRoom.question_seed, 200, activeTopics);
        set({
          matchStatus: 'countdown',
          questions,
          selectedTopics: activeTopics,
        });
        // Countdown 3 seconds then start
        setTimeout(() => {
          set({ matchStatus: 'playing', timeRemaining: updatedRoom.duration_seconds ?? 300 });
        }, 3000);
      }
    });

    set({
      roomId: room.id,
      roomCode: room.room_code,
      mode: 'lobby',
      isHost: true,
      matchStatus: 'waiting',
      questionSeed: room.question_seed,
      matchDuration: room.duration_seconds,
      channel,
      roomChangeUnsub,
    });

    return room.room_code;
  },

  /**
   * Join an existing lobby room by code.
   */
  initJoinRoom: async (code, playerId, playerName, playerMmr, characterId = 'c0') => {
    set({ matchStatus: 'joining', myId: playerId, myName: playerName, myMmr: playerMmr, myCharacter: characterId, error: null, myHearts: 3, opponentHearts: 3 });

    const room = await joinRoom(code, playerId, playerName, playerMmr);
    if (!room) {
      set({ matchStatus: 'idle', error: 'Room not found or already full.' });
      return false;
    }

    const initialTopics = room.selected_topics || [1, 2, 3, 4, 5, 6, 7];

    // Subscribe to realtime channel
    const { channel } = subscribeToRoom(room.id, {
      onPlayerInfo: (pid, char) => {
        if (pid !== playerId && char) {
          set({ opponentCharacter: char });
        }
      },
      onTopicsUpdated: (selectedTopics) => {
        set({ selectedTopics });
      },
      onMatchStart: (_startedAt, questionSeed, selectedTopics) => {
        const activeTopics = selectedTopics || get().selectedTopics;
        const questions = generateSeededQuestions(questionSeed, 200, activeTopics);
        set({
          matchStatus: 'countdown',
          questions,
          selectedTopics: activeTopics,
        });
        setTimeout(() => {
          set({ matchStatus: 'playing', timeRemaining: get().matchDuration });
        }, 3000);
      },
      onPlayerAction: (action) => {
        if (action.playerId !== playerId) {
          set({
            opponentScore: action.score,
            ...(action.hearts !== undefined ? { opponentHearts: action.hearts } : {}),
          });
        }
      },
      onMatchFinished: async (winnerId, hostScore, guestScore) => {
        const state = get();
        if (state.matchStatus !== 'finished') {
          const isRanked = state.mode === 'ranked';
          const result = winnerId === playerId ? 'win' : winnerId === null ? 'draw' : 'loss';
          let mmrChange = 0;
          let newMmr = state.myMmr;
          if (isRanked && result !== 'draw') {
            mmrChange = calculateMmrChange(state.myMmr, state.opponentMmr, result);
            newMmr = applyMmrChange(state.myMmr, mmrChange);
            if (playerId) {
              await updatePlayerMmr(playerId, newMmr, result === 'win');
            }
          }
          set({
            matchStatus: 'finished',
            result,
            mmrChange,
            myScore: state.isHost ? hostScore : guestScore,
            opponentScore: state.isHost ? guestScore : hostScore,
          });
        }
      },
    });

    // Subscribe to DB changes (to detect match start)
    const { unsubscribe: roomChangeUnsub } = subscribeToRoomChanges(room.id, (updatedRoom) => {
      if (updatedRoom.status === 'playing' && get().matchStatus !== 'playing') {
        const activeTopics = updatedRoom.selected_topics || get().selectedTopics;
        const questions = generateSeededQuestions(updatedRoom.question_seed, 200, activeTopics);
        set({
          matchStatus: 'countdown',
          questions,
          selectedTopics: activeTopics,
        });
        setTimeout(() => {
          set({ matchStatus: 'playing', timeRemaining: updatedRoom.duration_seconds ?? 300 });
        }, 3000);
      }
    });

    // Broadcast to host that we joined
    await broadcastToRoom(channel, 'opponent_joined', {
      opponentName: playerName,
      opponentMmr: playerMmr,
      opponentCharacter: characterId,
    });

    set({
      roomId: room.id,
      roomCode: room.room_code,
      mode: 'lobby',
      isHost: false,
      matchStatus: 'waiting',
      opponentId: room.host_id,
      opponentName: room.host_name ?? 'Opponent',
      opponentMmr: room.host_mmr ?? 1000,
      opponentCharacter: room.host_character ?? 'c0',
      questionSeed: room.question_seed,
      selectedTopics: initialTopics,
      matchDuration: room.duration_seconds,
      channel,
      roomChangeUnsub,
    });

    return true;
  },

  /**
   * Enter the ranked matchmaking queue and poll for an opponent.
   */
  initSearchMatch: async (playerId, playerName, playerMmr, characterId = 'c0') => {
    get().cleanup();

    set({
      matchStatus: 'searching',
      myId: playerId,
      myName: playerName,
      myMmr: playerMmr,
      myCharacter: characterId,
      mode: 'ranked',
      searchTime: 0,
      mmrSearchRange: 200,
      myReady: false,
      opponentReady: false,
      readyCountdown: 10,
      selectedTopics: [1, 2, 3, 4, 5, 6, 7],
      error: null,
    });

    const joined = await joinQueue(playerId, playerName, playerMmr);
    if (!joined) {
      set({ matchStatus: 'idle', error: 'Failed to join queue. Please try again.' });
      return;
    }
  },

  /**
   * Transition to Ready Check state once two players are matched.
   */
  enterReadyCheck: async (room: MatchRoom, isHost: boolean, characterId = 'c0') => {
    const state = get();
    state.cleanup();

    const opponentId = isHost ? room.guest_id : room.host_id;
    const opponentName = isHost ? (room.guest_name ?? 'Opponent') : (room.host_name ?? 'Opponent');
    const opponentMmr = isHost ? (room.guest_mmr ?? 1000) : (room.host_mmr ?? 1000);
    const opponentCharacter = isHost ? (room.guest_character || 'c0') : (room.host_character || 'c0');
    const initialTopics = room.selected_topics || [1, 2, 3, 4, 5, 6, 7];

    // Subscribe to realtime channel for ready events
    const { channel } = subscribeToRoom(room.id, {
      onPlayerInfo: (pid, char) => {
        if (pid !== (isHost ? room.host_id : room.guest_id) && char) {
          set({ opponentCharacter: char });
        }
      },
      onPlayerReady: (playerId, isReady, char) => {
        if (playerId !== get().myId) {
          set({
            opponentReady: isReady,
            ...(char ? { opponentCharacter: char } : {}),
          });
          if (get().myReady && isReady) {
            get().startRankedCountdown();
          }
        }
      },
      onReadyCheckFailed: (reason) => {
        get().handleReadyCheckFailed(reason);
      },
      onMatchStart: (_startedAt, questionSeed, selectedTopics) => {
        const activeTopics = selectedTopics || get().selectedTopics;
        const questions = generateSeededQuestions(questionSeed, 200, activeTopics);
        set({
          matchStatus: 'countdown',
          questions,
          selectedTopics: activeTopics,
        });
        setTimeout(() => {
          set({ matchStatus: 'playing', timeRemaining: get().matchDuration });
        }, 3000);
      },
      onPlayerAction: (action) => {
        if (action.playerId !== get().myId) {
          set({
            opponentScore: action.score,
            ...(action.hearts !== undefined ? { opponentHearts: action.hearts } : {}),
          });
        }
      },
      onMatchFinished: async (winnerId, hostScore, guestScore) => {
        const current = get();
        if (current.matchStatus !== 'finished') {
          const isRanked = current.mode === 'ranked';
          const result = winnerId === current.myId ? 'win' : winnerId === null ? 'draw' : 'loss';
          let mmrChange = 0;
          let newMmr = current.myMmr;
          if (isRanked && result !== 'draw') {
            mmrChange = calculateMmrChange(current.myMmr, current.opponentMmr, result);
            newMmr = applyMmrChange(current.myMmr, mmrChange);
            if (current.myId) {
              await updatePlayerMmr(current.myId, newMmr, result === 'win');
            }
          }
          set({
            matchStatus: 'finished',
            result,
            mmrChange,
            myScore: current.isHost ? hostScore : guestScore,
            opponentScore: current.isHost ? guestScore : hostScore,
          });
        }
      },
    });

    // Broadcast our character to opponent
    broadcastToRoom(channel, 'player_info', {
      playerId: isHost ? room.host_id : (room.guest_id || 'guest'),
      character: characterId,
    });

    // Subscribe to DB changes
    const { unsubscribe: roomChangeUnsub } = subscribeToRoomChanges(room.id, (updatedRoom) => {
      const oppChar = isHost ? updatedRoom.guest_character : updatedRoom.host_character;
      if (oppChar && oppChar !== get().opponentCharacter) {
        set({ opponentCharacter: oppChar });
      }

      const oppIsReady = isHost ? updatedRoom.guest_ready : updatedRoom.host_ready;
      if (oppIsReady && !get().opponentReady) {
        set({ opponentReady: true });
        if (get().myReady) {
          get().startRankedCountdown();
        }
      }

      if (updatedRoom.status === 'cancelled' && get().matchStatus === 'ready_check') {
        get().handleReadyCheckFailed('Opponent declined or match was cancelled.');
      } else if (updatedRoom.status === 'playing' && get().matchStatus !== 'playing') {
        const activeTopics = updatedRoom.selected_topics || get().selectedTopics;
        const questions = generateSeededQuestions(updatedRoom.question_seed, 200, activeTopics);
        set({
          matchStatus: 'countdown',
          questions,
          selectedTopics: activeTopics,
        });
        setTimeout(() => {
          set({ matchStatus: 'playing', timeRemaining: updatedRoom.duration_seconds ?? 300 });
        }, 3000);
      }
    });

    set({
      roomId: room.id,
      roomCode: null,
      mode: 'ranked',
      isHost,
      matchStatus: 'ready_check',
      myReady: false,
      opponentReady: false,
      readyCountdown: 10,
      myHearts: 3,
      opponentHearts: 3,
      myScore: 0,
      opponentScore: 0,
      currentQuestionIndex: 0,
      myCharacter: characterId,
      opponentId,
      opponentName,
      opponentMmr,
      opponentCharacter,
      questionSeed: room.question_seed,
      selectedTopics: initialTopics,
      matchDuration: room.duration_seconds ?? 300,
      channel,
      roomChangeUnsub,
      error: null,
    });
  },

  /**
   * Current player taps Ready.
   */
  setReady: async () => {
    const state = get();
    if (state.matchStatus !== 'ready_check' || state.myReady || !state.roomId || !state.myId) return;

    set({ myReady: true });

    // Broadcast ready event to opponent (including character)
    if (state.channel) {
      await broadcastToRoom(state.channel, 'player_ready', {
        playerId: state.myId,
        isReady: true,
        character: state.myCharacter,
      });
    }

    // Persist ready in DB
    await setPlayerReady(state.roomId, state.isHost, true);

    // If opponent was already ready, start countdown!
    if (state.opponentReady) {
      await get().startRankedCountdown();
    }
  },

  /**
   * Start 3-second battle countdown once both players are ready.
   */
  startRankedCountdown: async () => {
    const state = get();
    if (state.matchStatus === 'countdown' || state.matchStatus === 'playing') return;

    const questions = generateSeededQuestions(state.questionSeed, 200, state.selectedTopics);
    set({ matchStatus: 'countdown', questions });

    if (state.isHost && state.roomId) {
      await startMatch(state.roomId);
      if (state.channel) {
        await broadcastToRoom(state.channel, 'match_start', {
          startedAt: new Date().toISOString(),
          questionSeed: state.questionSeed,
          selectedTopics: state.selectedTopics,
        });
      }
    }

    setTimeout(() => {
      set({ matchStatus: 'playing', timeRemaining: state.matchDuration });
    }, 3000);
  },

  /**
   * Ready check timer timed out (10s expired).
   * Clean up and resume matchmaking queue.
   */
  handleReadyCheckTimeout: async () => {
    const state = get();
    if (state.matchStatus !== 'ready_check') return;

    if (state.channel) {
      await broadcastToRoom(state.channel, 'ready_check_failed', {
        reason: 'Ready check timed out.',
      });
    }

    if (state.roomId) {
      await cancelRankedMatch(state.roomId);
    }

    state.cleanup();

    // Re-queue the player to resume matchmaking
    if (state.myId && state.myName) {
      await joinQueue(state.myId, state.myName, state.myMmr);
      set({
        matchStatus: 'searching',
        roomId: null,
        opponentId: null,
        opponentName: null,
        myReady: false,
        opponentReady: false,
        searchTime: 0,
        error: 'Ready check expired. Resuming matchmaking...',
      });
    } else {
      set({ ...initialState, error: 'Ready check expired.' });
    }
  },

  /**
   * Ready check failed (opponent declined/unready).
   * Clean up and resume matchmaking queue.
   */
  handleReadyCheckFailed: async (reason) => {
    const state = get();
    state.cleanup();

    if (state.myId && state.myName && state.mode === 'ranked') {
      await joinQueue(state.myId, state.myName, state.myMmr);
      set({
        matchStatus: 'searching',
        roomId: null,
        opponentId: null,
        opponentName: null,
        myReady: false,
        opponentReady: false,
        searchTime: 0,
        error: reason || 'Opponent was not ready. Resuming matchmaking...',
      });
    } else {
      set({ ...initialState, error: reason || 'Match was cancelled.' });
    }
  },

  /**
   * Cancel the matchmaking search.
   */
  cancelSearch: async (playerId) => {
    await leaveQueue(playerId);
    const state = get();
    state.cleanup();
    set({ ...initialState });
  },

  /**
   * Host starts the match (lobby mode).
   */
  hostStartMatch: async () => {
    const state = get();
    if (!state.roomId || !state.isHost) return;

    const success = await startMatch(state.roomId);
    if (!success) {
      set({ error: 'Failed to start match.' });
      return;
    }

    const questions = generateSeededQuestions(state.questionSeed, 200, state.selectedTopics);
    set({ matchStatus: 'countdown', questions });

    // Broadcast match start with selected topics
    if (state.channel) {
      await broadcastToRoom(state.channel, 'match_start', {
        startedAt: new Date().toISOString(),
        questionSeed: state.questionSeed,
        selectedTopics: state.selectedTopics,
      });
    }

    setTimeout(() => {
      set({ matchStatus: 'playing', timeRemaining: state.matchDuration });
    }, 3000);
  },

  /**
   * Record a player's answer and broadcast to opponent.
   */
  answerQuestion: (isCorrect, hearts) => {
    const state = get();
    if (state.matchStatus !== 'playing') return;

    const newScore = isCorrect ? state.myScore + 1 : state.myScore;
    const newIndex = state.currentQuestionIndex + 1;
    const currentHearts = hearts !== undefined ? hearts : state.myHearts;

    set({
      myScore: newScore,
      currentQuestionIndex: newIndex,
      myHearts: currentHearts,
    });

    // Broadcast to opponent
    if (state.channel && state.myId) {
      broadcastToRoom(state.channel, 'player_action', {
        playerId: state.myId,
        action: currentHearts <= 0 ? 'knockout' : (isCorrect ? 'correct' : 'wrong'),
        score: newScore,
        questionIndex: newIndex,
        hearts: currentHearts,
        timestamp: Date.now(),
      });
    }
  },

  /**
   * End the match, calculate MMR (ranked only), and write results.
   */
  endMatch: async (playerId, forcedWinnerId) => {
    const state = get();
    if (!state.roomId || state.matchStatus === 'finished') return;

    const myScore = state.myScore;
    const oppScore = state.opponentScore;
    const isLobby = state.mode === 'lobby';

    // Determine result
    let result: 'win' | 'loss' | 'draw';
    let winnerId: string | null = null;

    if (forcedWinnerId !== undefined) {
      winnerId = forcedWinnerId;
      result = forcedWinnerId === playerId ? 'win' : forcedWinnerId === null ? 'draw' : 'loss';
    } else if (state.myHearts <= 0 || state.opponentHearts <= 0) {
      // If either player is knocked out (ran out of hearts)
      if (state.myHearts > state.opponentHearts) {
        result = 'win';
        winnerId = playerId;
      } else {
        result = 'loss';
        winnerId = state.opponentId;
      }
    } else if (myScore > oppScore) {
      result = 'win';
      winnerId = playerId;
    } else if (myScore < oppScore) {
      result = 'loss';
      winnerId = state.opponentId;
    } else {
      result = 'draw';
      winnerId = null;
    }

    // Calculate MMR change (Ranked mode ONLY)
    let mmrChange = 0;
    let newMmr = state.myMmr;

    if (!isLobby) {
      mmrChange = result === 'draw' ? 0 : calculateMmrChange(state.myMmr, state.opponentMmr, result);
      newMmr = applyMmrChange(state.myMmr, mmrChange);
    }

    set({
      matchStatus: 'finished',
      result,
      mmrChange,
    });

    // Broadcast finish (only host finalizes the DB record)
    if (state.channel) {
      await broadcastToRoom(state.channel, 'match_finished', {
        winnerId,
        hostScore: state.isHost ? myScore : oppScore,
        guestScore: state.isHost ? oppScore : myScore,
      });
    }

    // Write to DB
    if (state.roomId) {
      await finishMatch(
        state.roomId,
        state.isHost ? myScore : oppScore,
        state.isHost ? oppScore : myScore,
        winnerId
      );
    }

    // Write personal match result
    if (state.opponentId) {
      await writeMatchResult(
        state.roomId,
        playerId,
        state.opponentId,
        myScore,
        oppScore,
        result,
        mmrChange,
        newMmr
      );
    }

    // Update MMR in users table for ranked mode only
    if (!isLobby && result !== 'draw') {
      await updatePlayerMmr(playerId, newMmr, result === 'win');
    }
  },

  setTimeRemaining: (time) => {
    set({ timeRemaining: time });
  },

  setReadyCountdown: (time: number) => {
    set({ readyCountdown: time });
  },

  incrementSearchTime: () => {
    const state = get();
    // Ranked mode: matchmaking capped at maximum 200 MMR difference, waits indefinitely
    set({
      searchTime: state.searchTime + 1,
      mmrSearchRange: 200,
    });
  },

  reset: () => {
    const state = get();
    state.cleanup();
    set({ ...initialState });
  },

  cleanup: () => {
    const state = get();
    if (state.channel) {
      const { supabase: sb } = require('../services/supabase');
      sb.removeChannel(state.channel);
    }
    if (state.roomChangeUnsub) {
      state.roomChangeUnsub();
    }
    set({ channel: null, roomChangeUnsub: null });
  },
}));
