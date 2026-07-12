import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

type ArticlePayload = {
  id?: string;
  title?: string;
  keyword?: string;
  date?: string;
  wordCount?: number;
  status?: 'published' | 'draft';
  slug?: string;
  fullData?: {
    data?: {
      seo_title?: string;
      meta_description?: string;
      slug?: string;
      article_html?: string;
      word_count?: number;
      keyword_density_percent?: number;
      og_tags?: Record<string, string>;
      schema?: Record<string, unknown>;
      table_of_contents?: string[];
      lsi_keywords?: string[];
      images?: unknown[];
      internal_link_placeholders?: string[];
      external_link_placeholders?: string[];
      seo_audit?: Record<string, boolean>;
      mode_audit?: unknown;
      generation_settings?: unknown;
    };
    keyword?: string;
    mode?: string;
    mode_name?: string;
  };
};

function toArticleSummary(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.seo_title || 'Untitled Article'),
    keyword: String(row.keyword || ''),
    date: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : '',
    createdAt: String(row.created_at || ''),
    wordCount: Number(row.word_count || 0),
    status: String(row.status || 'draft'),
    slug: String(row.slug || ''),
    fullData: {
      data: {
        seo_title: row.seo_title,
        meta_description: row.meta_description,
        slug: row.slug,
        article_html: row.article_html,
        word_count: row.word_count,
        keyword_density_percent: row.keyword_density_percent,
        og_tags: row.og_tags,
        schema: row.schema,
        table_of_contents: row.table_of_contents,
        lsi_keywords: row.lsi_keywords,
        images: row.images,
        internal_link_placeholders: row.internal_link_placeholders,
        external_link_placeholders: row.external_link_placeholders,
        seo_audit: row.seo_audit,
        mode_audit: row.mode_audit,
        generation_settings: row.generation_settings,
      },
      keyword: row.keyword,
      mode: row.mode,
      mode_name: row.mode_name,
    },
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, articles: (data || []).map(toArticleSummary) });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const payload = (await request.json()) as ArticlePayload;
  const article = payload.fullData;
  const data = article?.data;

  if (!data?.article_html) {
    return NextResponse.json({ success: false, error: 'Article content is missing.' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('articles')
    .insert({
      keyword: payload.keyword || article?.keyword || '',
      mode: article?.mode || null,
      mode_name: article?.mode_name || null,
      language: typeof data.generation_settings === 'object' && data.generation_settings && 'language' in data.generation_settings
        ? String((data.generation_settings as { language?: string }).language || '')
        : null,
      seo_title: data.seo_title || payload.title || 'Untitled Article',
      meta_description: data.meta_description || '',
      slug: data.slug || payload.slug || '',
      article_html: data.article_html,
      word_count: data.word_count || payload.wordCount || 0,
      keyword_density_percent: data.keyword_density_percent || 0,
      og_tags: data.og_tags || {},
      schema: data.schema || {},
      table_of_contents: data.table_of_contents || [],
      lsi_keywords: data.lsi_keywords || [],
      images: data.images || [],
      internal_link_placeholders: data.internal_link_placeholders || [],
      external_link_placeholders: data.external_link_placeholders || [],
      seo_audit: data.seo_audit || {},
      mode_audit: data.mode_audit || null,
      generation_settings: data.generation_settings || null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, article: toArticleSummary(inserted) });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ success: false, error: 'Article id is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
