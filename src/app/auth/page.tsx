'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles, Zap, Mail, KeyRound, User } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const next = useMemo(() => {
    const requested = searchParams.get('next') || '/dashboard';
    return requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
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
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
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
        <div className="absolute left-1/2 top-[-100px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-[-50px] h-[350px] w-[350px] rounded-full bg-violet-500/10 dark:bg-violet-600/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[90px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-border bg-card/65 shadow-2xl backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      >
        {/* Left branding panel */}
        <div className="relative hidden overflow-hidden border-r border-border p-12 lg:block bg-muted/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_40%)]" />
          <div className="relative h-full flex flex-col justify-between">
            <div>
              <Link href="/" className="mb-16 inline-flex items-center gap-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <Zap fill="white" size={18} className="text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">GrowthPilot AI</span>
              </Link>

              <div className="max-w-lg mt-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/5 dark:bg-blue-450/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300 shadow-xs">
                  <Sparkles size={12} className="animate-pulse" /> Your AI growth workspace
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
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
              <Zap fill="white" size={14} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-tight text-foreground">GrowthPilot AI</span>
          </Link>

          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
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
              className={`relative z-10 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${mode === 'register' ? 'text-white dark:text-slate-900' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`relative z-10 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${mode === 'login' ? 'text-white dark:text-slate-900' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Login
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute inset-y-1 rounded-xl bg-indigo-600 dark:bg-white shadow-sm"
              style={{
                left: mode === 'register' ? '4px' : '50%',
                right: mode === 'register' ? '50%' : '4px',
              }}
            />
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
                      className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-indigo-500/10 text-foreground placeholder:text-muted-foreground/50"
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
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-indigo-500/10 text-foreground placeholder:text-muted-foreground/50"
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
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0f172a] pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-indigo-500/10 text-foreground placeholder:text-muted-foreground/50"
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
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
