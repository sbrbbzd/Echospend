import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto'; // Ensure URL polyfill if used

// Supabase configuration using provided credentials
const supabaseUrl = 'https://lmtpkjqcdclbkyjutouk.supabase.co';
const supabaseAnonKey = 'sb_publishable_MM2EanknfLCrIj4vZbtOlA_HptUUv4X';

// Safe initialization
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
    : null;
