import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

type TrendPayload = {
  title: string;
  proposedTitle?: string;
  link: string;
  pubDate?: string;
  sourceName?: string;
  sourceCategory?: string;
  language?: string;
  topic?: string;
  score?: number;
  opportunityType?: string;
  targetKeyword?: string;
  reason?: string;
};

function mapBookmark(row: Record<string, unknown>) {
  const payload = (row.trend_payload || {}) as Record<string, unknown>;
  return {
    ...payload,
    id: row.id,
    title: row.title,
    proposedTitle: row.proposed_title,
    link: row.link,
    sourceName: row.source_name,
    sourceCategory: row.source_category,
    topic: row.topic,
    language: payload.language || 'English',
    score: row.score,
    opportunityType: row.opportunity_type,
    targetKeyword: row.target_keyword,
    reason: row.reason,
    pubDate: payload.pubDate || row.created_at,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('trend_bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, bookmarks: (data || []).map(mapBookmark) });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const trend = (await request.json()) as TrendPayload;
  if (!trend.title || !trend.link) {
    return NextResponse.json({ success: false, error: 'Trend title and link are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('trend_bookmarks')
    .upsert({
      title: trend.title,
      proposed_title: trend.proposedTitle || null,
      link: trend.link,
      source_name: trend.sourceName || null,
      source_category: trend.sourceCategory || null,
      topic: trend.topic || null,
      language: trend.language || null,
      score: trend.score || 0,
      opportunity_type: trend.opportunityType || null,
      target_keyword: trend.targetKeyword || null,
      reason: trend.reason || null,
      trend_payload: trend,
    }, { onConflict: 'link' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, bookmark: mapBookmark(data) });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { link } = (await request.json()) as { link?: string };
  if (!link) {
    return NextResponse.json({ success: false, error: 'Bookmark link is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('trend_bookmarks').delete().eq('link', link);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
