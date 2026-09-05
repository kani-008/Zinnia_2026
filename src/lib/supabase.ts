import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL CONFIGURATION ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment variables. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    realtime: {
      timeout: 5000
    }
  }
);

export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const lowerUrl = supabaseUrl.toLowerCase();
  const lowerKey = supabaseAnonKey.toLowerCase();

  if (
    lowerUrl.includes('your_project') ||
    lowerUrl.includes('your-project') ||
    lowerUrl.includes('your_supabase') ||
    lowerUrl.includes('placeholder') ||
    lowerKey.includes('your_supabase') ||
    lowerKey.includes('your_project') ||
    lowerKey.includes('placeholder')
  ) {
    return false;
  }

  return true;
};

export const isRealtimeEnabled = () => {
  if (!isSupabaseConfigured()) return false;
  if (import.meta.env.VITE_SUPABASE_DISABLE_REALTIME === 'true') return false;
  return true;
};
