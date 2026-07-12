import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { verifyAdminSession } from '../auth/route';

const MOCK_USERS = [
  {
    id: 'u-1',
    email: 'najmol@growthpilot.com',
    full_name: 'NAJMOL HASAN',
    username: 'najmolhasan',
    plan: 'Plus',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 12500, keywords: 15, marketing: 12 }
  },
  {
    id: 'u-2',
    email: 'sarah.c@design.co',
    full_name: 'Sarah Connor',
    username: 'sarah_designer',
    plan: 'Trial',
    role: 'user',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 3200, keywords: 2, marketing: 1 }
  },
  {
    id: 'u-3',
    email: 'john.doe@gmail.com',
    full_name: 'John Doe',
    username: 'johndoe',
    plan: 'Trial ended',
    role: 'user',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 5000, keywords: 3, marketing: 3 }
  },
  {
    id: 'u-4',
    email: 'alice.smith@growth.io',
    full_name: 'Alice Smith',
    username: 'alicesmith',
    plan: 'Plus',
    role: 'user',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 24300, keywords: 28, marketing: 19 }
  },
  {
    id: 'u-5',
    email: 'bob.johnson@partner.com',
    full_name: 'Bob Johnson',
    username: 'bobjohnson',
    plan: 'Trial',
    role: 'user',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 800, keywords: 1, marketing: 0 }
  }
];

export async function GET(request: Request) {
  const isAdmin = await verifyAdminSession(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: true, users: MOCK_USERS, isMock: true });
    }

    const { data, error } = await supabase.auth.admin.listUsers();
    if (error || !data?.users) {
      return NextResponse.json({ success: true, users: MOCK_USERS, isMock: true });
    }

    const users = data.users.map((user: any) => {
      const meta = user.user_metadata || {};
      const createdAt = new Date(user.created_at);
      const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: user.id,
        email: user.email,
        full_name: meta.full_name || meta.name || 'Anonymous User',
        username: meta.username || user.email?.split('@')[0] || 'user',
        plan: meta.plan || (diffDays > 7 ? 'Trial ended' : 'Trial'),
        role: meta.role || 'user',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        stats: {
          words: meta.stat_words || 0,
          keywords: meta.stat_keywords || 0,
          marketing: meta.stat_marketing || 0
        }
      };
    });

    return NextResponse.json({ success: true, users, isMock: false });
  } catch {
    return NextResponse.json({ success: true, users: MOCK_USERS, isMock: true });
  }
}

export async function PUT(request: Request) {
  const isAdmin = await verifyAdminSession(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, plan, role, full_name, username } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: true, isMock: true, message: 'Mock update (no service role key)' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { plan, role, full_name, username }
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isMock: false, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await verifyAdminSession(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: true, isMock: true });
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
