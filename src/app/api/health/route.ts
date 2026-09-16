import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Always run fresh — never cache this route, every hit must reach Supabase
// so it counts as activity and prevents the free-tier auto-pause.
export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  // No Supabase env vars (local dev / mock mode) — still report healthy.
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: 'mock', db: 'not-configured', timestamp });
  }

  // One tiny read. Any query counts as project activity for Supabase.
  const { error } = await supabase.from('leads').select('id').limit(1);

  return NextResponse.json({
    ok: true,
    mode: 'supabase',
    db: error ? 'reachable-query-failed' : 'alive',
    ...(error ? { detail: error.message } : {}),
    timestamp,
  });
}
