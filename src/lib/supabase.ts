import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = "https://zbhivvrmejywmqdhjyqj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaGl2dnJtZWp5d21xZGhqeXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjA1MzksImV4cCI6MjA3NTMzNjUzOX0.hMt08x0e-TW02Ggju7_22xYLRPDP_ko5InOoxssCPlE";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'security-role-request-app' } },
});

// expose for console probes
if (typeof window !== 'undefined') {
  (window as any).sb = supabase;
}
