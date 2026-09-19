// services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://bhjkpepmrklicrkqparx.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoamtwZXBtcmtsaWNya3FwYXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzUzNzgsImV4cCI6MjEwMTUxMTM3OH0.G14CZP4e5f0x1PGfh8L_1-toEfizHYioQgW4Qr5x3q8';

// No-op storage used during SSR (Node has no window/localStorage)
const noopStorage = {
  getItem: async () => null,
  setItem: async () => { },
  removeItem: async () => { },
};

const isServer = typeof window === 'undefined';

const storage = isServer
  ? noopStorage
  : Platform.OS === 'web'
    ? window.localStorage
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});