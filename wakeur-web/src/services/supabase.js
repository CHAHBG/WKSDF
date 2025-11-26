import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aimnpbroehaeihkpvumm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbW5wYnJvZWhhZWloa3B2dW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzYwNTIsImV4cCI6MjA3OTU1MjA1Mn0.XkpiIFJCmCelsQ-dPcWZ6fU-0eAXe7xY3Q3uwrAnOA8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
