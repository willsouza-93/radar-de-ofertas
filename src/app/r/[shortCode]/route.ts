import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/server/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<unknown> }
) {
  const params = await context.params;
  const shortCode = typeof params === 'object' && params !== null && 'shortCode' in params
    ? String((params as { shortCode: unknown }).shortCode)
    : '';
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notFoundRedirect();

  const { data, error } = await supabase.rpc('resolve_publication_redirect', {
    target_short_code: shortCode
  });

  if (error) return notFoundRedirect();
  const row = Array.isArray(data) ? data[0] : data;
  const destination = row?.destination_url;
  if (typeof destination !== 'string') return notFoundRedirect();

  return NextResponse.redirect(destination, 302);
}

function notFoundRedirect() {
  return new NextResponse(null, {
    status: 404
  });
}
