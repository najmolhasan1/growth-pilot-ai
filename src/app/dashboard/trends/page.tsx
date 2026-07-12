'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Zap, ExternalLink, Wand2, RefreshCw,
  Cpu, Layout, Code, Brain, GraduationCap,
  Layers, Flame, Star, Search, Bookmark, BookmarkPlus, BookmarkCheck
} from 'lucide-react';

interface Trend {
  id?: string;
  title: string;
  proposedTitle?: string;
  reason?: string;
  link: string;
  pubDate: string;
  sourceName: string;
  sourceCategory: string;
  language: string;
  topic: string;
  score: number;
  isSmartPick?: boolean;
  targetKeyword?: string;
  opportunityType?: 'Trending' | 'Evergreen' | 'Hybrid';
  searchIntent?: string;
}

const INTELLIGENCE_CACHE_VERSION = 'quality-v4';

export default function TrendTracker() {
  const router = useRouter();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [recommendations, setRecommendations] = useState<Trend[]>([]);
  const [savedTrends, setSavedTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [generatedAt, setGeneratedAt] = useState('');
  const [methodology, setMethodology] = useState('');

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      if (data.success) {
        setTrends(data.trends);
        setRecommendations(data.recommendations || []);
        setGeneratedAt(data.generatedAt || '');
        setMethodology(data.methodology || '');
        localStorage.setItem('hero_trends', JSON.stringify(data.trends));
        localStorage.setItem('hero_recommendations', JSON.stringify(data.recommendations || []));
        localStorage.setItem('hero_trends_date', new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }));
        localStorage.setItem('hero_trends_generated_at', data.generatedAt || '');
        localStorage.setItem('hero_trends_methodology', data.methodology || '');
        localStorage.setItem('hero_trends_version', INTELLIGENCE_CACHE_VERSION);
      }
    } catch {
      console.error('Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  // Load browser-persisted trend state once the client is mounted.
  useEffect(() => {
    let cancelled = false;

    async function loadBookmarks() {
      try {
        const response = await fetch('/api/trend-bookmarks');
        const data = await response.json();
        if (!cancelled && response.ok && data.success && Array.isArray(data.bookmarks)) {
          setSavedTrends(data.bookmarks as Trend[]);
          return;
        }
      } catch {
        console.warn('Supabase trend bookmarks unavailable; using browser-local bookmarks.');
      }

      const savedB = localStorage.getItem('hero_bookmarks');
      if (!cancelled && savedB) {
        setSavedTrends(JSON.parse(savedB));
      }
    }

    const savedT = localStorage.getItem('hero_trends');
    const savedR = localStorage.getItem('hero_recommendations');
    const cachedDate = localStorage.getItem('hero_trends_date');
    const cachedVersion = localStorage.getItem('hero_trends_version');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

    if (savedT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrends(JSON.parse(savedT));
    }
    if (savedR) {
      setRecommendations(JSON.parse(savedR));
    }
    loadBookmarks();
    setGeneratedAt(localStorage.getItem('hero_trends_generated_at') || '');
    setMethodology(localStorage.getItem('hero_trends_methodology') || '');

    if (!savedT || cachedDate !== today || cachedVersion !== INTELLIGENCE_CACHE_VERSION) fetchTrends();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = (trend: Trend) => {
    let updatedBookmarks = [...savedTrends];
    const isAlreadySaved = updatedBookmarks.find(t => t.link === trend.link);

    if (isAlreadySaved) {
      updatedBookmarks = updatedBookmarks.filter(t => t.link !== trend.link);
    } else {
      updatedBookmarks.push(trend);
    }

    setSavedTrends(updatedBookmarks);
    localStorage.setItem('hero_bookmarks', JSON.stringify(updatedBookmarks));

    if (isAlreadySaved) {
      fetch('/api/trend-bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: trend.link }),
      }).catch(() => console.warn('Supabase trend bookmark delete failed.'));
    } else {
      fetch('/api/trend-bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trend),
      }).catch(() => console.warn('Supabase trend bookmark save failed.'));
    }
  };

  const isSaved = (link: string) => savedTrends.some(t => t.link === link);

  const handleGenerate = (trend: Trend) => {
    const title = trend.proposedTitle || trend.title.split(' - ')[0].trim();
    router.push(`/dashboard/generate?keyword=${encodeURIComponent(title)}&lang=${trend.language}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const categories = [
    { id: 'all', label: 'All Streams', icon: Layers },
    { id: 'saved', label: 'Saved Intel', icon: BookmarkCheck },
    { id: 'Web Development', label: 'Web Dev', icon: Layout },
    { id: 'Programming', label: 'Programming', icon: Code },
    { id: 'DevOps & Tools', label: 'DevOps', icon: Cpu },
    { id: 'Tech Update', label: 'Tech News', icon: Zap },
    { id: 'Education BD', label: 'Education', icon: GraduationCap },
  ];

  const filteredTrends = filter === 'saved' 
    ? savedTrends 
    : trends.filter(t => filter === 'all' || t.sourceCategory === filter);
  const visibleRecommendations = recommendations.filter(trend => filter === 'all' || trend.sourceCategory === filter);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-indigo-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <Brain size={12} /> Strategic Hub
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Intelligence</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Daily curated content opportunities blending fresh updates with durable learner search intent.
            </p>
            {generatedAt && (
              <p className="text-[10px] text-indigo-400/70 uppercase tracking-widest">
                Refreshed {formatDate(generatedAt)} | Top 10 editorial picks
              </p>
            )}
          </div>
          
          <button 
            onClick={fetchTrends}
            disabled={loading}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold text-xs tracking-tight flex items-center gap-2 transition-all shadow-xl hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Refresh Strategy'}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-4 z-20 mb-12 bg-[#030712]/60 backdrop-blur-lg p-1.5 rounded-2xl border border-white/5 shadow-2xl flex items-center justify-start overflow-x-auto no-scrollbar px-2">
          <div className="flex gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === cat.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <cat.icon size={14} />
                <span>{cat.label} {cat.id === 'saved' && `(${savedTrends.length})`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top daily opportunities from current and evergreen-demand signals. */}
        {!loading && filter !== 'saved' && visibleRecommendations.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Star size={14} className="text-indigo-400" fill="currentColor" />
              <div>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Top 10 Daily Content Opportunities</h2>
                {methodology && <p className="text-[10px] text-slate-600 mt-2 normal-case tracking-normal">{methodology}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleRecommendations.slice(0, 10).map((rec, i) => (
                <div key={i} className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-indigo-500/40 transition-all flex flex-col shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-500/5 rounded-full">
                        <Flame size={10} /> Pick #{i+1}
                      </div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase">{formatDate(rec.pubDate)}</div>
                    </div>
                    <button onClick={() => toggleSave(rec)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {isSaved(rec.link) ? <BookmarkCheck size={16} className="text-indigo-500" /> : <Bookmark size={16} className="text-slate-600" />}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-4 leading-snug flex-1 group-hover:text-indigo-300 transition-colors line-clamp-3">
                    {rec.proposedTitle || rec.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {rec.opportunityType && (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 rounded-full px-2 py-1">{rec.opportunityType}</span>
                    )}
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 rounded-full px-2 py-1">Priority {rec.score}</span>
                  </div>
                  {rec.targetKeyword && (
                    <p className="text-[10px] text-indigo-300/80 font-bold mb-2">Keyword: {rec.targetKeyword}</p>
                  )}
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-6 line-clamp-3">{rec.reason}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <a href={rec.link} target="_blank" className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => handleGenerate(rec)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap">
                      <Wand2 size={14} /> Generate Blog
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEED GRID */}
        <div className="flex items-center gap-3 mb-8">
           <TrendingUp size={14} className="text-slate-500" />
           <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
             {filter === 'saved' ? 'Your Saved Intelligence' : 'Curated Source Streams'}
           </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-60 bg-slate-900/40 rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredTrends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTrends.map((trend, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group bg-slate-900/20 border border-white/5 rounded-3xl p-6 hover:bg-slate-900/40 hover:border-white/10 transition-all flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{trend.sourceName}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">{formatDate(trend.pubDate)}</div>
                      <button onClick={() => toggleSave(trend)} className="p-1 rounded-md hover:bg-white/5 transition-colors">
                        {isSaved(trend.link) ? <BookmarkCheck size={14} className="text-indigo-500" /> : <BookmarkPlus size={14} className="text-slate-700" />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white/80 leading-relaxed mb-6 flex-1 line-clamp-3 group-hover:text-white transition-colors">
                    {trend.proposedTitle || trend.title}
                  </h3>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[9px] font-bold text-indigo-500/60 uppercase">{trend.topic}</div>
                      {trend.opportunityType && <div className="text-[8px] font-bold text-emerald-400/70 uppercase mt-1">{trend.opportunityType}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                       <a href={trend.link} target="_blank" className="p-2 text-slate-600 hover:text-white transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => handleGenerate(trend)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 whitespace-nowrap">
                        <Wand2 size={14} /> Generate Blog
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[4rem]">
            <Search className="mx-auto text-slate-700 mb-4" size={40} />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {filter === 'saved' ? 'No saved content yet. Start bookmarking!' : 'Scanning...'}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
