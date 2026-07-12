'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  FileText,
  Globe,
  List,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  Wand2,
  Zap,
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

interface TrendSummary {
  title: string;
  proposedTitle?: string;
  targetKeyword?: string;
  opportunityType?: 'Trending' | 'Evergreen' | 'Hybrid';
  language: string;
  sourceCategory: string;
  topic?: string;
  score?: number;
  reason?: string;
}

interface StoredArticleSummary {
  id: string;
  title: string;
  keyword: string;
  date: string;
  createdAt?: string;
  wordCount?: number;
  status?: string;
}

// WORD_LIMIT dynamically loaded inside component state



function isThisMonth(article: StoredArticleSummary) {
  const date = new Date(article.createdAt || article.date);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Najmol');
  const [isPlus, setIsPlus] = useState(false);
  const [wordLimit, setWordLimit] = useState(5000);
  const [articles, setArticles] = useState<StoredArticleSummary[]>([]);
  const [trends, setTrends] = useState<TrendSummary[]>([]);
  const [recommendations, setRecommendations] = useState<TrendSummary[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trial_seo_word_limit');
      if (stored) setWordLimit(parseInt(stored, 10));
    }

    async function loadUser() {
      if (!isSupabaseConfigured()) return;
      try {
        // refreshSession() fetches fresh user_metadata from server (reflects admin changes instantly)
        const { data } = await getSupabaseBrowserClient().auth.refreshSession();
        const user = data.session?.user;
        if (!cancelled && user) {
          const metaName = user.user_metadata?.name;
          const emailName = user.email?.split('@')[0];
          setUserName(String(metaName || emailName || 'Najmol'));
          setIsPlus(user.user_metadata?.plan === 'Plus');
        }
      } catch {
        // fallback to cached getUser
        try {
          const { data } = await getSupabaseBrowserClient().auth.getUser();
          const metaName = data.user?.user_metadata?.name;
          const emailName = data.user?.email?.split('@')[0];
          if (!cancelled && data.user) {
            setUserName(String(metaName || emailName || 'Najmol'));
            setIsPlus(data.user.user_metadata?.plan === 'Plus');
          }
        } catch {
          if (!cancelled) setUserName('Najmol');
        }
      }
    }

    async function loadArticles() {
      setLoadingArticles(true);
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        if (!cancelled && response.ok && data.success && Array.isArray(data.articles)) {
          setArticles(data.articles as StoredArticleSummary[]);
          return;
        }
      } catch {
        console.warn('Dashboard article API unavailable; using browser-local articles.');
      } finally {
        if (!cancelled) setLoadingArticles(false);
      }

      if (!cancelled) {
        const saved = JSON.parse(localStorage.getItem('generated_articles') || '[]') as StoredArticleSummary[];
        setArticles(saved);
      }
    }

    async function loadTrends() {
      setLoadingTrends(true);
      try {
        const response = await fetch('/api/trends');
        const data = await response.json();
        if (!cancelled && response.ok && data.success) {
          setTrends(Array.isArray(data.trends) ? data.trends : []);
          setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
          return;
        }
      } catch {
        console.warn('Dashboard trend API unavailable; using browser-local trend cache.');
      } finally {
        if (!cancelled) setLoadingTrends(false);
      }

      if (!cancelled) {
        setTrends(JSON.parse(localStorage.getItem('hero_trends') || '[]') as TrendSummary[]);
        setRecommendations(JSON.parse(localStorage.getItem('hero_recommendations') || '[]') as TrendSummary[]);
      }
    }

    loadUser();
    loadArticles();
    loadTrends();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const lifetimeWords = articles.reduce((sum, article) => sum + (article.wordCount || 0), 0);
    const monthWords = articles
      .filter(isThisMonth)
      .reduce((sum, article) => sum + (article.wordCount || 0), 0);

    return {
      totalArticles: articles.length,
      wordsMonth: monthWords,
      avgWords: articles.length ? Math.round(lifetimeWords / articles.length) : 0,
      lifetimeWords,
    };
  }, [articles]);

  const recentArticles = articles.slice(0, 4);
  const topTrends = trends.slice(0, 5);
  const topRecommendations = recommendations.length > 0
    ? recommendations.slice(0, 4)
    : trends.slice(5, 9);

  const handleDelete = async (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!id || !confirm('Are you sure you want to permanently delete this report?')) return;

    setArticles(current => current.filter(article => article.id !== id));
    const localArticles = JSON.parse(localStorage.getItem('generated_articles') || '[]') as StoredArticleSummary[];
    localStorage.setItem('generated_articles', JSON.stringify(localArticles.filter(article => article.id !== id)));

    try {
      await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      console.warn('Dashboard article delete failed on server.');
    }
  };

  const goGenerate = (trend: TrendSummary) => {
    const keyword = trend.proposedTitle || trend.targetKeyword || trend.title;
    router.push(`/dashboard/generate?keyword=${encodeURIComponent(keyword)}&lang=${trend.language || 'English'}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#020617]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#0b0f1a]/80 px-8 backdrop-blur-md">
        <h2 className="text-left text-lg font-bold text-white">Dashboard Overview</h2>
        <div className="flex items-center gap-6">
          <div className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase text-white/40">
            {isPlus ? 'Plus • Unlimited' : `Free • ${stats.wordsMonth.toLocaleString()} / ${wordLimit.toLocaleString()}`}
          </div>
        </div>
      </header>

      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Welcome back, {userName}!</h1>
            <p className="text-sm text-white/40">Here is your real content activity, latest reports, and live content intelligence.</p>
          </div>
          <Link href="/dashboard/generate" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500">
            <Plus size={18} /> New Article
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'TOTAL ARTICLES', value: loadingArticles ? '...' : stats.totalArticles, icon: FileText },
            { label: 'WORDS THIS MONTH', value: loadingArticles ? '...' : stats.wordsMonth.toLocaleString(), icon: TrendingUp },
            { label: 'AVG WORDS', value: loadingArticles ? '...' : stats.avgWords.toLocaleString(), icon: Zap },
            { label: 'LIFETIME WORDS', value: loadingArticles ? '...' : stats.lifetimeWords.toLocaleString(), icon: BookOpen },
          ].map(stat => (
            <div key={stat.label} className="group rounded-2xl border border-white/5 bg-[#0d1117] p-6 transition-all hover:bg-white/5">
              <div className="mb-8 flex items-center justify-between text-left text-[10px] font-bold uppercase text-white/40">
                <h4>{stat.label}</h4>
                <stat.icon className="text-blue-400" size={18} />
              </div>
              <p className="text-left text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-8">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText size={16} className="text-blue-400" /> Recent Content Reports
            </h3>
            <Link href="/dashboard/articles" className="text-xs font-bold text-blue-400 hover:underline">View Library →</Link>
          </div>

          {loadingArticles ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <Loader2 className="mr-3 animate-spin" size={18} /> Loading your latest reports...
            </div>
          ) : recentArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {recentArticles.map(article => (
                <div key={article.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/5">
                  <button onClick={() => router.push(`/dashboard/generate/result?id=${article.id}`)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-all group-hover:bg-blue-500 group-hover:text-white">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-blue-400">{article.title}</h4>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="line-clamp-1 text-[10px] font-black uppercase tracking-widest text-white/40">{article.keyword || 'Untitled keyword'}</p>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <p className="text-[10px] text-white/40">{article.date}</p>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <p className="text-[10px] text-white/40">{(article.wordCount || 0).toLocaleString()} words</p>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/dashboard/generate/result?id=${article.id}`)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/40 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-600 hover:text-white" title="View Full Report">
                      <ArrowUpRight size={18} />
                    </button>
                    <button onClick={event => handleDelete(event, article.id)} className="rounded-xl p-2.5 text-white/10 transition-all hover:bg-red-500/10 hover:text-red-400" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center text-white/20">
              <FileText size={48} className="mb-4" />
              <p className="font-bold uppercase tracking-widest">No reports available</p>
              <p className="mt-2 text-xs">Generate your first article and it will appear here automatically.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0d1117] p-8 shadow-2xl">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-blue-600/5 blur-3xl transition-colors group-hover:bg-blue-600/10" />
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-xl font-black text-white">
                  <Sparkles className="h-5 w-5 text-blue-500" /> Strategic Intelligence
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/30">Live source stream picks</p>
              </div>
              <button onClick={() => router.push('/dashboard/trends')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400">
                View Full Tracker <ArrowRight size={14} />
              </button>
            </div>

            {loadingTrends ? (
              <div className="flex items-center justify-center py-16 text-white/30">
                <Loader2 className="mr-3 animate-spin" size={18} /> Loading intelligence...
              </div>
            ) : topTrends.length > 0 ? (
              <div className="space-y-4">
                {topTrends.map((trend, index) => (
                  <button key={`${trend.title}-${index}`} onClick={() => goGenerate(trend)} className="group/item flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:border-blue-500/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xs font-black text-blue-400 transition-all group-hover/item:bg-blue-500 group-hover/item:text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-white/90 transition-colors group-hover/item:text-blue-400">{trend.proposedTitle || trend.title}</h4>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[9px] font-black uppercase text-white/25">{trend.sourceCategory}</span>
                        <span className="text-[9px] font-black uppercase text-blue-500/60">• {trend.opportunityType || trend.topic || 'UPDATE'}</span>
                      </div>
                    </div>
                    <Wand2 size={16} className="text-white/10 transition-colors group-hover/item:text-blue-500" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-white/25">No trend stream loaded yet. Open the tracker and refresh strategy.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-[#0d1117] p-8">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap size={16} className="text-orange-400" /> Recommended for You
              </h3>
              <button onClick={() => router.push('/dashboard/trends')} className="text-[10px] font-bold uppercase tracking-widest text-white/25 transition-all hover:text-blue-400">Refresh Ideas</button>
            </div>

            {loadingTrends ? (
              <div className="flex items-center justify-center py-16 text-white/30">
                <Loader2 className="mr-3 animate-spin" size={18} /> Preparing ideas...
              </div>
            ) : topRecommendations.length > 0 ? (
              <div className="space-y-4">
                {topRecommendations.map((idea, index) => (
                  <button key={`${idea.proposedTitle || idea.title}-${index}`} onClick={() => goGenerate(idea)} className="group w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:bg-white/5">
                    <h4 className="mb-2 line-clamp-2 text-xs font-bold text-white/80 transition-colors group-hover:text-blue-400">{idea.proposedTitle || idea.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">{idea.opportunityType || 'Hybrid'} Opportunity</span>
                      <span className="h-1 w-1 rounded-full bg-white/10" />
                      <span className="text-[9px] font-black uppercase tracking-tighter text-blue-400">Priority {idea.score || 80}</span>
                    </div>
                    {idea.reason && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/35">{idea.reason}</p>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-white/25">No recommendations yet. Refresh trends to generate daily ideas.</p>
            )}

            <Link href="/dashboard/generate" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500">
              <Plus size={14} /> Create New Article
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-[#0d1117] p-8 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp size={16} className="text-blue-400" /> Live Trend Categories
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">Live 2026</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {['Web Development', 'Programming', 'DevOps & Tools', 'Tech Update'].map(category => {
                const count = trends.filter(trend => trend.sourceCategory === category).length;
                return (
                  <button key={category} onClick={() => router.push('/dashboard/trends')} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:bg-white/5">
                    <p className="text-xs font-bold text-white/80">{category}</p>
                    <p className="mt-2 text-2xl font-black text-blue-400">{count}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-white/25">content ideas</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          {[
            { title: 'Content Calendar', desc: 'Plan and schedule your upcoming content', icon: List, href: '/dashboard/calendar', color: 'text-orange-400' },
            { title: 'WordPress Sync', desc: 'Manage your connected WordPress sites', icon: Globe, href: '/dashboard/settings', color: 'text-emerald-400' },
            { title: 'SEO Trends', desc: 'Analyze trending keywords in your niche', icon: TrendingUp, href: '/dashboard/trends', color: 'text-blue-400' },
          ].map(card => (
            <Link key={card.title} href={card.href} className="group rounded-2xl border border-white/5 bg-[#0d1117] p-6 transition-all hover:bg-white/5">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${card.color} transition-transform group-hover:scale-110`}>
                <card.icon size={20} />
              </div>
              <h4 className="mb-1 text-sm font-bold text-white">{card.title}</h4>
              <p className="line-clamp-2 text-xs text-white/40">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
