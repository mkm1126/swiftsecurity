import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to hardcoded credentials
const supabaseUrl = import.meta.env.VITE_BoltDatabase_URL || 'https://lyzcqbbfmgtxieytskrf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5emNxYmJmbWd0eGlleXRza3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NjM0NDQsImV4cCI6MjA2NTMzOTQ0NH0.54VVlT0nZwmqbAw9wHJeUYe0P-fEY54iY1SNZjTDeL8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'security-role-request-app' } },
});

// expose for console probes
if (typeof window !== 'undefined') {
  (window as any).sb = supabase;
}
