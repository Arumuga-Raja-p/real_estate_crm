import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    // Return null or placeholder when environment variables are not configured
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
