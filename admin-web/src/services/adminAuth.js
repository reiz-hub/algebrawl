/**
 * Admin Authentication Service
 *
 * Authenticates admin users against the separate `admins` Firestore collection.
 * Completely independent from Firebase Auth / player auth.
 */
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import SHA256 from 'crypto-js/sha256';

const ADMINS_COLLECTION = 'admins';
const SESSION_KEY = 'algebrawl_admin_session';

/* ── helpers ───────────────────────────────────── */

/** Hash a plaintext password with SHA-256 (hex string). */
export function hashPassword(plain) {
  return SHA256(plain).toString();
}

/** Generate a random session token. */
function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ── public API ────────────────────────────────── */

/**
 * POST /admin/login equivalent.
 * Validates email + password against the `admins` collection only.
 * Returns { success, admin, token } or { success: false, error }.
 */
export async function adminLogin(email, password) {
  try {
    const q = query(
      collection(db, ADMINS_COLLECTION),
      where('email', '==', email.trim().toLowerCase()),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    // Compare hashed passwords
    const inputHash = hashPassword(password);
    if (inputHash !== adminData.passwordHash) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    // Build session
    const token = generateToken();
    const session = {
      token,
      adminId: adminDoc.id,
      username: adminData.username,
      email: adminData.email,
      loginAt: Date.now(),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, admin: session, token };
  } catch (err) {
    console.error('[AdminAuth] Login failed:', err);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * POST /admin/logout equivalent.
 * Clears the admin session — does NOT touch Firebase Auth / player tokens.
 */
export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Returns the current admin session or null.
 */
export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Guard: returns true only if there is a valid admin session token.
 * Player tokens (Firebase Auth) are irrelevant here.
 */
export function isAdminAuthenticated() {
  const session = getAdminSession();
  return session !== null && typeof session.token === 'string';
}
