import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://aimnpbroehaeihkpvumm.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbW5wYnJvZWhhZWloa3B2dW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzYwNTIsImV4cCI6MjA3OTU1MjA1Mn0.XkpiIFJCmCelsQ-dPcWZ6fU-0eAXe7xY3Q3uwrAnOA8';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fallbackAnonKey;

if (__DEV__ && (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn('Using fallback Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for production.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Keep token refresh active only while app is in foreground.
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
