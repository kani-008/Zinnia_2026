// Supabase client configuration with mock fallback
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) return false;

  const lowerUrl = url.toLowerCase();
  const lowerKey = key.toLowerCase();

  return (
    !lowerUrl.includes('your_project') &&
    !lowerUrl.includes('your-project') &&
    !lowerUrl.includes('mock') &&
    !lowerKey.includes('your_supabase') &&
    !lowerKey.includes('mock')
  );
};
