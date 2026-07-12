import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminSession } from '../auth/route';

// Default limits fallback
const DEFAULT_CONFIG = {
  trial_seo_word_limit: 5000,
  trial_keyword_limit: 3,
  trial_marketing_limit: 3,
};

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ success: true, config: DEFAULT_CONFIG, isFallback: true });
    }

    const { data, error } = await supabase
      .from('system_config')
      .select('key, value');

    if (error || !data) {
      return NextResponse.json({ success: true, config: DEFAULT_CONFIG, isFallback: true });
    }

    // Build config object from rows
    const config: Record<string, any> = { ...DEFAULT_CONFIG };
    for (const row of data) {
      config[row.key] = typeof row.value === 'string'
        ? parseFloat(row.value) || row.value
        : row.value;
    }

    return NextResponse.json({ success: true, config, isFallback: false });
  } catch (err: any) {
    return NextResponse.json({ success: true, config: DEFAULT_CONFIG, isFallback: true });
  }
}

export async function PUT(request: Request) {
  // Verify admin session
  const isAdmin = await verifyAdminSession(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { trial_seo_word_limit, trial_keyword_limit, trial_marketing_limit } = body;

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    // Upsert all config keys
    const updates = [
      { key: 'trial_seo_word_limit', value: String(trial_seo_word_limit ?? 5000), updated_at: new Date().toISOString() },
      { key: 'trial_keyword_limit', value: String(trial_keyword_limit ?? 3), updated_at: new Date().toISOString() },
      { key: 'trial_marketing_limit', value: String(trial_marketing_limit ?? 3), updated_at: new Date().toISOString() },
    ];

    const { error } = await supabase
      .from('system_config')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      console.error('Config update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Configuration updated and synced globally' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Update failed' }, { status: 500 });
  }
}
