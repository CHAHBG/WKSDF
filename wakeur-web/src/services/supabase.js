import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://aimnpbroehaeihkpvumm.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbW5wYnJvZWhhZWloa3B2dW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzYwNTIsImV4cCI6MjA3OTU1MjA1Mn0.XkpiIFJCmCelsQ-dPcWZ6fU-0eAXe7xY3Q3uwrAnOA8';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
    console.warn('Using fallback Supabase credentials. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in production.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
