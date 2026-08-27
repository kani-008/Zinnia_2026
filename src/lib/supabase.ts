import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aiefrwricgwchvapinlc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jP4KLIgOGvI-QIWVEBzznA_5b_FJvOL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;

  if (!url || !key) return false;

  const lowerUrl = url.toLowerCase();
  const lowerKey = key.toLowerCase();

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
