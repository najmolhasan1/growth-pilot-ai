'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase is not configured.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const next = searchParams.get('next') || '/dashboard';
    const code = searchParams.get('code');
    const error = searchParams.get('error_description') || searchParams.get('error');

    if (error) {
      setErrorMsg(error);
      const timer = setTimeout(() => {
        router.replace(`/auth?error=${encodeURIComponent(error)}`);
      }, 2000);
      return () => clearTimeout(timer);
    }

    let isSubscribed = true;

    const completeAuth = async () => {
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session && isSubscribed) {
          router.replace(next);
          router.refresh();
          setTimeout(() => {
            window.location.assign(next);
          }, 250);
        } else if (isSubscribed) {
          // Listen for session detection from hash fragments
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (currentSession && isSubscribed) {
              subscription.unsubscribe();
              router.replace(next);
              window.location.assign(next);
            }
          });

          // Timeout fallback in case neither code nor hash resolved
          setTimeout(() => {
            if (isSubscribed) {
              supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                  router.replace(next);
                } else {
                  router.replace('/auth');
                }
              });
            }
          }, 3500);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('OAuth callback error:', err);
        setErrorMsg(err?.message || 'Authentication failed');
        setTimeout(() => {
          router.replace(`/auth?error=${encodeURIComponent(err?.message || 'Authentication failed')}`);
        }, 2000);
      }
    };

    completeAuth();

    return () => {
      isSubscribed = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {errorMsg ? (
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
          <p className="text-sm font-bold text-red-500 mb-2">Sign-in Error</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-4">Redirecting back to login...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF4D42]/15 via-[#FF6A3D]/10 to-[#FF8526]/15 flex items-center justify-center border border-[#FF5533]/20 shadow-lg shadow-[#FF5533]/10">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF5533]" />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">Authenticating with GrowthPilot...</h2>
          <p className="text-xs text-muted-foreground">Redirecting you to your workspace dashboard</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF5533]" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
