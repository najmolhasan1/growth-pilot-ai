'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BarChart3, Target, HelpCircle, Sparkles, ArrowRight, Loader2, Zap, TrendingUp,
  ChevronRight, GitCompare, Lightbulb, MessageCircle, Wand2, History, Trash2, Clock,
  ChevronDown, ChevronUp, Globe, Languages, Briefcase, Copy, Check, 
  DollarSign, Users, Monitor
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';
import { fetchSystemConfig } from '@/lib/admin-config';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

interface SocialBuzzItem {
  platform: string;
  title?: string;
  link?: string;
  date?: string;
}

interface KeywordData {
  ai_provider?: string;
  ai_model?: string;
  difficulty: number;
  volume: string;
  intent: string;
  cpc: string;
  trend: string;
  strategy?: string;
  content_angles: string[];
  social_media: Record<string, string>;
  ai_prompts: string[];
  ai_prompts_basis?: string;
  serp_features: string[];
  target_audience?: string;
  monetization?: string;
  ai_error?: string;
  social_buzz: SocialBuzzItem[];
  keyword_ideas: string[];
  questions: string[];
  questions_basis?: string;
  comparisons: string[];
  related_keywords: string[];
}

interface SavedReport { id: string; keyword: string; date: string; data: KeywordData; }

export default function KeywordResearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('English');
  const [businessType, setBusinessType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copyErrorIdx, setCopyErrorIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadReports() {
      try {
        const response = await fetch('/api/keyword-reports');
        const data = await response.json();
        if (!cancelled && response.ok && data.success && Array.isArray(data.reports)) {
          setSavedReports(data.reports as SavedReport[]);
          return;
        }
      } catch {
        console.warn('Supabase keyword reports unavailable; using browser-local reports.');
      }

      const saved = localStorage.getItem('hero_keyword_reports');
      if (!cancelled && saved) {
        setSavedReports(JSON.parse(saved) as SavedReport[]);
      }
    }

    loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveReport = async (kw: string, d: KeywordData) => {
    const r: SavedReport = { id: Date.now().toString(), keyword: kw, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), data: d };
    const updated = [r, ...savedReports].slice(0, 30);
    setSavedReports(updated);
    localStorage.setItem('hero_keyword_reports', JSON.stringify(updated));

    try {
      const response = await fetch('/api/keyword-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw, language, data: d }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.report?.id) {
        const withDbId = [result.report as SavedReport, ...savedReports.filter(report => report.id !== r.id)].slice(0, 30);
        setSavedReports(withDbId);
        localStorage.setItem('hero_keyword_reports', JSON.stringify(withDbId));
      }
    } catch {
      console.warn('Supabase keyword report save failed; keeping browser-local copy.');
    }
  };

  const deleteReport = (id: string) => {
    const u = savedReports.filter(r => r.id !== id);
    setSavedReports(u);
    localStorage.setItem('hero_keyword_reports', JSON.stringify(u));
    fetch('/api/keyword-reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => console.warn('Supabase keyword report delete failed.'));
  };
  const loadReport = (r: SavedReport) => { setKeyword(r.keyword); setData(r.data); setShowHistory(false); };

  const copyText = async (text: string, idx: number) => {
    const successful = await copyTextSafely(text);
    if (successful) {
      setCopyErrorIdx(null);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
      return;
    }

    setCopiedIdx(null);
    setCopyErrorIdx(idx);
    setTimeout(() => setCopyErrorIdx(null), 2500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true); setError(null); setData(null);

    // Enforce trial limit for keyword reports (dynamic config — synced from Admin Panel)
    let isPlus = false;
    try {
      // refreshSession() fetches fresh user_metadata from server (reflects admin changes instantly)
      const { data } = await getSupabaseBrowserClient().auth.refreshSession();
      isPlus = data.session?.user?.user_metadata?.plan === 'Plus';
    } catch (err) {
      console.warn(err);
      // fallback to cached
      try {
        const { data } = await getSupabaseBrowserClient().auth.getUser();
        isPlus = data.user?.user_metadata?.plan === 'Plus';
      } catch { /* ignore */ }
    }

    if (!isPlus) {
      let limitValue = 3;
      try {
        const sysConfig = await fetchSystemConfig();
        limitValue = sysConfig.trial_keyword_limit;
      } catch (err) {
        console.warn(err);
      }

      if (savedReports.length >= limitValue) {
        setError(`Free Trial Limit Reached: You have generated the maximum of ${limitValue} keyword research reports allowed in the trial. Upgrade to GrowthPilot Plus to perform unlimited keyword research!`);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), location, language, businessType, purpose })
      });
      const result = await res.json();
      if (result.success) { setData(result.data); saveReport(keyword.trim(), result.data); }
      else setError(result.error);
    } catch { setError('Connection error.'); }
    finally { setLoading(false); }
  };

  const goGenerate = (t: string) => router.push(`/dashboard/generate?keyword=${encodeURIComponent(t)}`);

  const trendColor = (t: string) => t === 'Rising' ? 'text-emerald-400' : t === 'Declining' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#030712]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Zap size={12} /> Advanced SEO Intelligence
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Keyword <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Intelligence</span>
          </h1>
        </div>
        {savedReports.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">
            <History size={14} /> Past Reports ({savedReports.length}) {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* History */}
      <AnimatePresence>{showHistory && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 overflow-hidden">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedReports.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all group">
                  <div className="cursor-pointer flex-1" onClick={() => loadReport(r)}>
                    <p className="text-sm font-bold text-white group-hover:text-indigo-300">{r.keyword}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Clock size={10} /> {r.date}</p>
                  </div>
                  <button onClick={() => deleteReport(r.id)} className="p-2 text-slate-700 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Advanced Search Form */}
      <form onSubmit={handleSearch} className="mb-10 space-y-4">
        <div className="flex items-center gap-3 bg-slate-900/40 border border-white/5 rounded-2xl p-2 focus-within:border-indigo-500/30 transition-all max-w-3xl">
          <Search className="ml-4 text-slate-500" size={20} />
          <input type="text" placeholder="Enter your target keyword..." className="w-full bg-transparent border-none outline-none px-3 py-2 text-white font-medium placeholder:text-slate-600" value={keyword} onChange={(e) => setKeyword(e.target.value)} disabled={loading} />
          <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Context Inputs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl">
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 z-10" />
            <select className="w-full bg-slate-900/30 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/30 appearance-none" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Global</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Japan">Japan</option>
              <option value="South Korea">South Korea</option>
              <option value="Singapore">Singapore</option>
              <option value="UAE">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Pakistan">Pakistan</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Brazil">Brazil</option>
            </select>
          </div>
          <div className="relative">
            <Languages size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <select className="w-full bg-slate-900/30 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/30 appearance-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Bengali">Bengali</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
          <div className="relative">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" placeholder="Business type..." className="w-full bg-slate-900/30 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/30" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
          </div>
          <div className="relative">
            <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" placeholder="Purpose (e.g. Blog, Ads)" className="w-full bg-slate-900/30 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/30" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
        </div>
      </form>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm max-w-3xl">{error}</div>}

      <AnimatePresence mode="wait">
        {data ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {!data.ai_error && data.ai_provider && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Sparkles size={14} /> Live AI analysis powered by {data.ai_provider}
                </div>
                {data.ai_model && (
                  <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-full">
                    {data.ai_model}
                  </span>
                )}
              </div>
            )}

            {data.ai_error && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
                AI analysis unavailable: {data.ai_error}. Suggestions and buzz remain available; displayed metric defaults are estimates.
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: BarChart3, label: 'Difficulty', value: `${data.difficulty}/100`, color: 'text-indigo-400' },
                { icon: TrendingUp, label: 'Volume', value: data.volume, color: 'text-emerald-400' },
                { icon: Target, label: 'Intent', value: data.intent, color: 'text-violet-400' },
                { icon: DollarSign, label: 'Est. CPC', value: data.cpc, color: 'text-amber-400' },
                { icon: TrendingUp, label: 'Trend', value: data.trend, color: trendColor(data.trend) },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-center">
                  <s.icon className={`mx-auto ${s.color} mb-2`} size={20} />
                  <div className={`text-xl font-black text-white ${s.label === 'Intent' ? 'text-sm uppercase' : ''}`}>{s.value}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Strategy + Audience Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.strategy && (
                <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3"><Sparkles className="text-indigo-400" size={16} /><h3 className="text-sm font-bold text-white">SEO Strategy</h3></div>
                  <p className="text-slate-400 text-sm leading-relaxed">{data.strategy}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                {data.target_audience && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Users className="text-pink-400" size={16} /><h3 className="text-sm font-bold text-white">Target Audience</h3></div>
                    <p className="text-slate-400 text-xs leading-relaxed">{data.target_audience}</p>
                  </div>
                )}
                {data.monetization && (
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="text-emerald-400" size={16} /><h3 className="text-sm font-bold text-white">Monetization</h3></div>
                    <p className="text-slate-400 text-xs leading-relaxed">{data.monetization}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SERP Features */}
            {data.serp_features?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Monitor size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">SERP Features:</span>
                {data.serp_features.map((f: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-slate-400">{f}</span>
                ))}
              </div>
            )}

            {/* Social Media Hooks */}
            {data.social_media && Object.keys(data.social_media).length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5"><MessageCircle className="text-blue-400" size={18} /><h3 className="text-sm font-bold text-white">Social Media Hooks</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'twitter', icon: MessageCircle, label: 'Twitter/X', color: 'text-sky-400' },
                    { key: 'linkedin', icon: Briefcase, label: 'LinkedIn', color: 'text-blue-400' },
                    { key: 'youtube', icon: Monitor, label: 'YouTube', color: 'text-red-400' },
                    { key: 'facebook', icon: Globe, label: 'Facebook', color: 'text-blue-500' },
                    { key: 'tiktok', icon: Zap, label: 'TikTok/Reels', color: 'text-pink-400' },
                  ].map((p, i) => data.social_media[p.key] && (
                    <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><p.icon size={14} className={p.color} /><span className="text-[10px] font-bold text-slate-500 uppercase">{p.label}</span></div>
                        <button onClick={() => copyText(data.social_media[p.key], i)} className="p-1 hover:bg-white/5 rounded-md">
                          {copiedIdx === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className={copyErrorIdx === i ? 'text-amber-400' : 'text-slate-600'} />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-300">{data.social_media[p.key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Buzz - Real Discussions */}
            {data.social_buzz?.length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="text-orange-400" size={18} />
                  <h3 className="text-sm font-bold text-white">Social Media Buzz</h3>
                  <span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Live</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.social_buzz.map((item, i: number) => {
                    const platformColors: Record<string, string> = { 'Reddit': 'text-orange-400', 'YouTube': 'text-red-400', 'LinkedIn': 'text-blue-400', 'Twitter/X': 'text-sky-400' };
                    const platformIcons: Record<string, typeof Globe> = { 'Reddit': MessageCircle, 'YouTube': Monitor, 'LinkedIn': Briefcase, 'Twitter/X': MessageCircle };
                    const PIcon = platformIcons[item.platform] || Globe;
                    return (
                      <a key={i} href={item.link} target="_blank" className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:border-orange-500/20 transition-all group">
                        <PIcon size={16} className={`${platformColors[item.platform] || 'text-slate-500'} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">{item.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-slate-600">{item.platform}</span>
                            {item.date && <span className="text-[10px] text-slate-700">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Prompts */}
            {data.ai_prompts?.length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Sparkles className="text-violet-400" size={18} />
                  <h3 className="text-sm font-bold text-white">Questions Learners May Ask ChatGPT / Gemini / Claude</h3>
                  <span className="text-[9px] font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full uppercase">10 AI Query Ideas</span>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  {data.ai_prompts_basis || 'Likely learner questions based on this topic.'} These are estimates, not private platform search logs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.ai_prompts.map((prompt: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl group">
                      <span className="w-6 h-6 bg-violet-500/10 text-violet-400 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                      <p className="text-sm text-slate-300 flex-1 leading-relaxed">{prompt}</p>
                      <button onClick={() => copyText(prompt, 100 + i)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all shrink-0">
                        {copiedIdx === 100 + i ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className={copyErrorIdx === 100 + i ? 'text-amber-400' : 'text-slate-500'} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.questions?.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2"><HelpCircle className="text-violet-400" size={18} /><h3 className="text-sm font-bold text-white">Questions People Search</h3><span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">10+ Terms</span></div>
                  <p className="text-[11px] text-slate-500 mb-5">{data.questions_basis || 'Search question ideas'}</p>
                  <div className="space-y-2">{data.questions.map((q: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group" onClick={() => goGenerate(q)}>
                      <ChevronRight size={14} className="text-violet-500/50" /><span className="text-sm text-slate-300 flex-1">{q}</span><Wand2 size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  ))}</div>
                </div>
              )}

              {data.keyword_ideas?.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5"><Lightbulb className="text-amber-400" size={18} /><h3 className="text-sm font-bold text-white">Keyword Ideas</h3><span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Real</span></div>
                  <div className="flex flex-wrap gap-2">{data.keyword_ideas.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 hover:text-white hover:border-amber-500/20 transition-all cursor-pointer" onClick={() => goGenerate(kw)}>{kw}</span>
                  ))}</div>
                </div>
              )}

              {data.comparisons?.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5"><GitCompare className="text-cyan-400" size={18} /><h3 className="text-sm font-bold text-white">Comparisons</h3><span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Real</span></div>
                  <div className="space-y-2">{data.comparisons.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group" onClick={() => goGenerate(c)}>
                      <ChevronRight size={14} className="text-cyan-500/50" /><span className="text-sm text-slate-300 flex-1">{c}</span><Wand2 size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  ))}</div>
                </div>
              )}

              {data.related_keywords?.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5"><MessageCircle className="text-pink-400" size={18} /><h3 className="text-sm font-bold text-white">Related Searches</h3><span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Real</span></div>
                  <div className="flex flex-wrap gap-2">{data.related_keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 hover:text-white hover:border-pink-500/20 transition-all cursor-pointer" onClick={() => goGenerate(kw)}>{kw}</span>
                  ))}</div>
                </div>
              )}

              {data.content_angles?.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-5"><Sparkles className="text-indigo-400" size={18} /><h3 className="text-sm font-bold text-white">Content Ideas for Your Business</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">{data.content_angles.map((a: string, i: number) => (
                    <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all cursor-pointer group" onClick={() => goGenerate(a)}>
                      <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed">{a}</p>
                      <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Generate <ArrowRight size={10} /></div>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          !loading && (
            <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <Search className="mx-auto text-slate-700 mb-6" size={48} />
              <h3 className="text-lg font-black text-slate-600 uppercase tracking-widest">Ready to Analyze</h3>
              <p className="text-slate-700 mt-2 text-sm">Fill in your details above for personalized, actionable insights.</p>
            </div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
