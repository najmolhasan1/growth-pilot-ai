import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/lib/supabase-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

// Secret list of valid keys stored on the server.
// It is recommended to configure LICENSE_KEYS in Vercel environment settings.
const SERVER_LICENSE_KEYS = (process.env.LICENSE_KEYS || 'GP-PLUS-2026,NAJMOL-GROWTH-2026,TRIAL-UNLOCK-99X')
  .split(',')
  .map(key => key.trim().toUpperCase());

export async function POST(request: Request) {
  try {
    // 1. Verify user token
    const auth = await getRequestUserId(request);
    if (!auth.userId) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: auth.status });
    }

    // 2. Read license key from request body
    const { licenseKey } = await request.json();
    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json({ success: false, error: 'License key is required.' }, { status: 400 });
    }

    const enteredKey = licenseKey.trim().toUpperCase();

    // 3. Verify license key
    if (!SERVER_LICENSE_KEYS.includes(enteredKey)) {
      return NextResponse.json({ success: false, error: 'Invalid activation key. Please check and try again.' }, { status: 400 });
    }

    // 4. Initialize Supabase admin client
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase server configuration missing.' }, { status: 503 });
    }

    // 5. Update user plan to Plus using Service Role Admin client
    const { error } = await supabase.auth.admin.updateUserById(auth.userId, {
      user_metadata: { plan: 'Plus' }
    });

    if (error) {
      console.error('License Activation error:', error);
      return NextResponse.json({ success: false, error: error.message || 'Failed to activate license.' }, { status: 500 });
    }

    console.log(`Successfully upgraded user ${auth.userId} to plan: Plus via License Activation`);
    return NextResponse.json({ success: true, message: 'License key activated successfully.' });
  } catch (error: any) {
    console.error('License Activation general failure:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
