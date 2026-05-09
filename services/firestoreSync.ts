// services/firestoreSync.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
  username?: string;
  isGuest?: boolean;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  xp: number;
  totalBattles: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  createdAt?: any;
}

/**
 * Write user data to Firestore.
 * Silently catches errors (e.g. offline — Firestore SDK will queue the write).
 */
export const syncToFirestore = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Write failed (will retry when online):', error);
  }
};

/**
 * Read user data from Firestore.
 * Returns null if the doc doesn't exist or on error.
 */
export const fetchFromFirestore = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Read failed:', error);
    return null;
  }
};

/**
 * Create a new user document (first launch with a new guestId).
 */
export const createUserDoc = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        isGuest: true,
        unlockedLevel: 1,
        levelStars: {},
        xp: 0,
        totalBattles: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn('[Firestore] Create user doc failed:', error);
  }
};

/**
 * Claim a username for a guest account.
 */
export const claimUsername = async (userId: string, username: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { username }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Claim username failed:', error);
  }
};

/**
 * Look up a userId by username.
 * Scans the users collection for a matching username field.
 */
export const lookupByUsername = async (username: string): Promise<{ userId: string; data: UserData } | null> => {
  try {
    // Using Firestore query to find by username
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const firstDoc = snapshot.docs[0];
    return {
      userId: firstDoc.id,
      data: firstDoc.data() as UserData,
    };
  } catch (error) {
    console.warn('[Firestore] Username lookup failed:', error);
    return null;
  }
};
