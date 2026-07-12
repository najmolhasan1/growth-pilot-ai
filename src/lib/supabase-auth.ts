import { getSupabaseServerClient } from '@/lib/supabase';

export async function getRequestUserId(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { userId: null, error: 'Supabase is not configured.', status: 503 };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { userId: null, error: 'Authentication token is required.', status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { userId: null, error: error?.message || 'Invalid authentication token.', status: 401 };
  }

  return { userId: data.user.id, error: null, status: 200 };
}
