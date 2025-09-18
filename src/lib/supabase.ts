import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'security-role-request-app' } },
});

// expose for console probes
if (typeof window !== 'undefined') {
  (window as any).sb = supabase;
}
