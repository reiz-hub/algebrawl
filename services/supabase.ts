// services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhjkpepmrklicrkqparx.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoamtwZXBtcmtsaWNya3FwYXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzUzNzgsImV4cCI6MjEwMTUxMTM3OH0.G14CZP4e5f0x1PGfh8L_1-toEfizHYioQgW4Qr5x3q8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
