import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  // Service-role key bypasses Row Level Security — this client must only ever
  // be imported by server-side code (API routes), never sent to the browser.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabase = globalForSupabase.supabase ?? makeClient();

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase;
