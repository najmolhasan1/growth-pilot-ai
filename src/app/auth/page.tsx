'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles, Zap, Mail, KeyRound, User } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import BrandLogo from '@/components/layout/BrandLogo';

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const next = useMemo(() => {
    const requested = searchParams.get('next') || '/dashboard';
    return requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(next);
      }
    });
  }, [next, router]);

  const goNext = () => {
    router.replace(next);
    router.refresh();
    window.setTimeout(() => {
      window.location.assign(next);
    }, 250);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setMessage('');

    if (!isSupabaseConfigured()) {
      setError('Account access is not available yet. Please contact support or try again later.');
      return;
    }

    setOauthLoading(provider);
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      if (oauthError) throw oauthError;
    } catch (authError: any) {
      setError(authError instanceof Error ? authError.message : `Failed to sign in with ${provider}.`);
      setOauthLoading(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured()) {
      setError('Account access is not available yet. Please contact support or try again later.');
      return;
    }

    if (password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

        if (signUpError) throw signUpError;
        if (data.session) {
          goNext();
          return;
        }
        setMessage('Almost there. Check your email to confirm your account, then come back to continue.');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error('Login succeeded, but the browser session was not saved. Please allow cookies and try again.');
        }
        goNext();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Could not complete this request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300 bg-grid-pattern relative flex items-center justify-center py-12 px-6">
      {/* Background spotlights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-[-100px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#FF5533]/10 dark:bg-[#FF5533]/15 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-50px] h-[350px] w-[350px] rounded-full bg-[#FF8A00]/10 dark:bg-[#FF8A00]/12 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[#FF4D42]/8 dark:bg-[#FF4D42]/10 blur-[90px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-border bg-card/65 shadow-2xl backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      >
        {/* Left branding panel */}
        <div className="relative hidden overflow-hidden border-r border-border p-12 lg:block bg-muted/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,51,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,138,0,0.1),transparent_40%)]" />
          <div className="relative h-full flex flex-col justify-between">
            <div>
              <div className="mb-16">
                <BrandLogo href="/" imgClassName="h-10 w-auto" />
              </div>

              <div className="max-w-lg mt-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5533] dark:text-[#FF7A45] shadow-xs">
                  <Sparkles size={12} className="animate-pulse text-[#FF6A3D]" /> Your AI growth workspace
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground">
                  Plan, create, and package marketing assets from one focused workspace.
                </h1>
                <p className="mt-6 text-sm leading-7 text-muted-foreground">
                  Use GrowthPilot AI for SEO content, keyword research, trend ideas, video creator kits, social campaigns, and launch assets.
                </p>
              </div>
            </div>
            
            <p className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">
              2026 GROWTHPILOT AI • ALL RIGHTS RESERVED
            </p>
          </div>
        </div>

        {/* Right Form panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8 lg:hidden">
            <BrandLogo href="/" imgClassName="h-8 w-auto" />
          </div>

          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#FF5533] dark:text-[#FF7A45]">
              {mode === 'register' ? 'Start your workspace' : 'Welcome back'}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {mode === 'register' ? 'Create your account' : 'Continue your work'}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {mode === 'register'
                ? 'Start with the workflows your business needs most: content, video, research, and campaigns.'
                : 'Pick up where you left off and keep building your marketing assets.'}
            </p>
          </div>

          {/* Toggle pill selector */}
          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-border bg-muted/30 p-1 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`relative z-10 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${mode === 'register' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`relative z-10 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${mode === 'login' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Login
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute inset-y-1 rounded-xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] shadow-sm"
              style={{
                left: mode === 'register' ? '4px' : '50%',
                right: mode === 'register' ? '50%' : '4px',
              }}
            />
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading || oauthLoading !== null}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#0f172a]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-4 py-3 text-xs font-bold text-foreground transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#FF5533]" />
              ) : (
                <GoogleIcon className="h-4 w-4 shrink-0" />
              )}
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading || oauthLoading !== null}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#0f172a]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-4 py-3 text-xs font-bold text-foreground transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#FF5533]" />
              ) : (
                <GithubIcon className="h-4 w-4 shrink-0" />
              )}
              <span>GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <span className="relative bg-card px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
              Or continue with email
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      value={name}
                      onChange={event => setName(event.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#FF5533] focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-[#FF5533]/15 text-foreground placeholder:text-muted-foreground/50"
                      placeholder="Your name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#FF5533] focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-[#FF5533]/15 text-foreground placeholder:text-muted-foreground/50"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-[#FF5533] focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-[#FF5533]/15 text-foreground placeholder:text-muted-foreground/50"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-relaxed text-red-600 dark:text-red-300 font-semibold"
              >
                {error}
              </motion.p>
            )}
            
            {message && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-emerald-600 dark:text-emerald-300 font-semibold"
              >
                {message}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || oauthLoading !== null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#FF5547] hover:to-[#FF9036] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#FF5533]/25 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {mode === 'register' ? 'Start Free Trial' : 'Go to Dashboard'}
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs leading-6 text-muted-foreground/60 font-semibold">
            No clutter. No generic prompts. Just focused workflows.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-muted-foreground/40 flex items-center justify-center">Loading authentication...</div>}>
      <AuthContent />
    </Suspense>
  );
}
