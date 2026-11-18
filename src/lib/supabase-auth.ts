import { getSupabaseServerClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export async function getRequestUserId(request: Request): Promise<{
  userId: string | null;
  user: User | null;
  error: string | null;
  status: number;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { userId: null, user: null, error: 'Supabase is not configured.', status: 503 };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { userId: null, user: null, error: 'Authentication token is required.', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { userId: null, user: null, error: error?.message || 'Invalid authentication token.', status: 401 };
  }

  return { userId: data.user.id, user: data.user, error: null, status: 200 };
}
