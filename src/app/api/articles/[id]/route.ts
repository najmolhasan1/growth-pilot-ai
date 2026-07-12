import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    article: {
      data: {
        seo_title: data.seo_title,
        meta_description: data.meta_description,
        slug: data.slug,
        article_html: data.article_html,
        word_count: data.word_count,
        keyword_density_percent: data.keyword_density_percent,
        og_tags: data.og_tags,
        schema: data.schema,
        table_of_contents: data.table_of_contents,
        lsi_keywords: data.lsi_keywords,
        images: data.images,
        internal_link_placeholders: data.internal_link_placeholders,
        external_link_placeholders: data.external_link_placeholders,
        seo_audit: data.seo_audit,
        mode_audit: data.mode_audit,
        generation_settings: data.generation_settings,
      },
      keyword: data.keyword,
      mode: data.mode,
      mode_name: data.mode_name,
    },
  });
}
