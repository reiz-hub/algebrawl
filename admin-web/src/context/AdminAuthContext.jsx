/**
 * Admin Auth Context
 *
 * Provides admin session state to the entire app.
 * Completely separate from Firebase Auth (player tokens).
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  adminLogin as doLogin,
  adminLogout as doLogout,
  getAdminSession,
} from '../services/adminAuth';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => getAdminSession());
  const [loading, setLoading] = useState(true);

  // On mount, restore from sessionStorage
  useEffect(() => {
    setAdmin(getAdminSession());
    setLoading(false);
  }, []);

  /** Login — validates against admins collection only */
  const login = useCallback(async (email, password) => {
    const result = await doLogin(email, password);
    if (result.success) {
      setAdmin(result.admin);
    }
    return result;
  }, []);

  /** Logout — clears admin session, does NOT touch player auth */
  const logout = useCallback(() => {
    doLogout();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside <AdminAuthProvider>');
  return ctx;
}
