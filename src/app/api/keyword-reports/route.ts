import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('keyword_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    reports: (data || []).map(row => ({
      id: row.id,
      keyword: row.topic,
      date: row.created_at ? new Date(row.created_at).toLocaleString() : '',
      data: row.report,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const body = (await request.json()) as { keyword?: string; language?: string; data?: unknown };
  if (!body.keyword || !body.data) {
    return NextResponse.json({ success: false, error: 'Keyword and report data are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('keyword_reports')
    .insert({ topic: body.keyword, language: body.language || null, report: body.data })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    report: {
      id: data.id,
      keyword: data.topic,
      date: data.created_at ? new Date(data.created_at).toLocaleString() : '',
      data: data.report,
    },
  });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ success: false, error: 'Report id is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('keyword_reports').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
