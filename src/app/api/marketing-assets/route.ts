import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/lib/supabase-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type MarketingAssetPayload = {
  id?: string;
  tool?: string;
  title?: string;
  language?: string;
  inputs?: Record<string, string>;
  brandSnapshot?: Record<string, string>;
  result?: unknown;
};

function mapAsset(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tool: String(row.tool || ''),
    title: String(row.title || 'Untitled asset'),
    language: String(row.language || 'English'),
    inputs: row.inputs || {},
    brandSnapshot: row.brand_snapshot || {},
    result: row.result || {},
    createdAt: String(row.created_at || ''),
  };
}

export async function GET(request: Request) {
  const auth = await getRequestUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase!
    .from('marketing_assets')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, assets: (data || []).map(mapAsset) });
}

export async function POST(request: Request) {
  const auth = await getRequestUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as MarketingAssetPayload;
  if (!body.tool || !body.result) {
    return NextResponse.json({ success: false, error: 'Tool and result are required.' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase!
    .from('marketing_assets')
    .insert({
      user_id: auth.userId,
      tool: body.tool,
      title: body.title || 'Untitled asset',
      language: body.language || 'English',
      inputs: body.inputs || {},
      brand_snapshot: body.brandSnapshot || {},
      result: body.result,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, asset: mapAsset(data) });
}

export async function DELETE(request: Request) {
  const auth = await getRequestUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ success: false, error: 'Asset id is required.' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase!
    .from('marketing_assets')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
