import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/lib/supabase-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type BrandProfilePayload = {
  profile?: Record<string, string>;
};

export async function GET(request: Request) {
  const auth = await getRequestUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase!
    .from('brand_profiles')
    .select('profile, updated_at')
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    profile: data?.profile || null,
    updatedAt: data?.updated_at || null,
  });
}

export async function PUT(request: Request) {
  const auth = await getRequestUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as BrandProfilePayload;
  if (!body.profile || typeof body.profile !== 'object') {
    return NextResponse.json({ success: false, error: 'Brand profile is required.' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase!
    .from('brand_profiles')
    .upsert({
      user_id: auth.userId,
      profile: body.profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('profile, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: data.profile, updatedAt: data.updated_at });
}
