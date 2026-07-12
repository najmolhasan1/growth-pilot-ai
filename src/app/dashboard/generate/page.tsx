'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, Layers, Loader2,
  Settings, Shield, Target, TrendingUp, Type, Zap,
} from 'lucide-react';
import { getWritingMode, OptimizationIntensity, WRITING_MODES, WritingModeId, YOAST_CHECKPOINT_GROUPS } from '@/lib/writing-modes';
import { fetchSystemConfig } from '@/lib/admin-config';

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const modeVisuals: Record<WritingModeId, { icon: typeof Target; color: string; border: string }> = {
  'fully-optimized': { icon: Target, color: 'from-blue-500 to-cyan-500', border: 'border-blue-500/40' },
  'rank-math': { icon: BarChart3, color: 'from-violet-500 to-purple-600', border: 'border-violet-500/40' },
  'semantic-nlp': { icon: Brain, color: 'from-emerald-500 to-teal-500', border: 'border-emerald-500/40' },
  yoast: { icon: Shield, color: 'from-orange-500 to-amber-500', border: 'border-orange-500/40' },
  hybrid: { icon: Layers, color: 'from-rose-500 to-pink-600', border: 'border-rose-500/40' },
  hcu: { icon: TrendingUp, color: 'from-sky-500 to-indigo-500', border: 'border-sky-500/40' },
};

const tones = ['Informative', 'Professional', 'Conversational', 'Authoritative', 'Friendly'];
const languages = ['English', 'Bengali', 'Spanish', 'French', 'German'];
const wordCounts = [1500, 1800, 2000, 2500, 3000, 4000];
const formalities = ['Casual', 'Balanced', 'Formal'];
const readingLevels = ['Simple', 'General', 'Expert'];
const pointsOfView = ['Second person', 'First person', 'Third person'];
const intensities: Array<{ id: OptimizationIntensity; label: string }> = [
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'strict', label: 'Strict' },
];

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<WritingModeId>('fully-optimized');
  const [keyword, setKeyword] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [tone, setTone] = useState('Informative');
  const [language, setLanguage] = useState('English');
  const [formality, setFormality] = useState('Balanced');
  const [readingLevel, setReadingLevel] = useState('General');
  const [pointOfView, setPointOfView] = useState('Second person');
  const [intensity, setIntensity] = useState<OptimizationIntensity>('recommended');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');
  const mode = getWritingMode(selectedMode);

  useEffect(() => {
    const kw = searchParams.get('keyword');
    if (kw) {
      // Sync keyword passed from trend exploration into the configuration screen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeyword(kw);
      setStep(2);

      if (/[\u0980-\u09FF]/.test(kw)) {
        setLanguage('Bengali');
      }
    }
  }, [searchParams]);

  const stages = [
    'Researching facts and supporting insights...',
    `Applying the ${mode.shortName} writing system...`,
    'Generating article structure and content...',
    'Running measurable optimization checks...',
  ];

  const chooseMode = (modeId: WritingModeId) => {
    const nextMode = getWritingMode(modeId);
    setSelectedMode(modeId);
    setWordCount(current => Math.max(current, nextMode.minimumWords));
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('Please enter a focus keyword');
      return;
    }

    setError('');
    setLoading(true);

    // Enforce 7-day trial limit (dynamic config — synced from Admin Panel)
    let isPlus = false;
    try {
      // refreshSession() fetches fresh user_metadata from server (reflects admin changes instantly)
      const { data } = await getSupabaseBrowserClient().auth.refreshSession();
      isPlus = data.session?.user?.user_metadata?.plan === 'Plus';
    } catch (e) {
      console.warn(e);
      // fallback to cached
      try {
        const { data } = await getSupabaseBrowserClient().auth.getUser();
        isPlus = data.user?.user_metadata?.plan === 'Plus';
      } catch { /* ignore */ }
    }

    if (!isPlus) {
      let monthWords = 0;
      let limitValue = 5000;

      try {
        const sysConfig = await fetchSystemConfig();
        limitValue = sysConfig.trial_seo_word_limit;
      } catch (e) {
        console.warn(e);
      }

      try {
        const saved = JSON.parse(localStorage.getItem('generated_articles') || '[]') as any[];
        let cloudArticles: any[] = [];
        try {
          const response = await fetch('/api/articles');
          const data = await response.json();
          if (response.ok && data.success && Array.isArray(data.articles)) {
            cloudArticles = data.articles;
          }
        } catch {
          // ignore
        }

        const allArticles = [...cloudArticles, ...saved];
        const uniqueArticles = Array.from(new Map(allArticles.map(item => [item.id, item])).values()) as any[];

        const now = new Date();
        const thisMonthArticles = uniqueArticles.filter(art => {
          const date = new Date(art.createdAt || art.date);
          return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        monthWords = thisMonthArticles.reduce((sum, art) => sum + (art.wordCount || 0), 0);
      } catch (e) {
        console.warn(e);
      }

      if (monthWords >= limitValue || monthWords + wordCount > limitValue) {
        setError(`Free Trial Word Limit Exceeded: You have generated ${monthWords.toLocaleString()} of your ${limitValue.toLocaleString()} words limit. Upgrade to GrowthPilot Plus to write unlimited articles!`);
        setLoading(false);
        return;
      }
    }

    setStep(3);
    setLoadingStage(0);

    try {
      const researchResponse = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, language }),
      });
      const researchData = await researchResponse.json();
      const research = researchResponse.ok && researchData.success ? researchData.research : undefined;

      setLoadingStage(1);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          mode: selectedMode,
          wordCount,
          tone: tone.toLowerCase(),
          language,
          formality: formality.toLowerCase(),
          readingLevel: readingLevel.toLowerCase(),
          pointOfView: pointOfView.toLowerCase(),
          intensity,
          research,
        }),
      });

      setLoadingStage(2);
      const json = await response.json();
      setLoadingStage(3);

      if (!response.ok || !json.success) {
        setError(json.error || 'Generation failed. Please try again.');
        setLoading(false);
        setStep(2);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      let articleId = Math.random().toString(36).slice(2, 11);
      const savedArticles = JSON.parse(localStorage.getItem('generated_articles') || '[]');
      const newArticle = {
        id: articleId,
        title: json.data.seo_title,
        keyword,
        date: new Date().toLocaleDateString(),
        wordCount: json.data.word_count,
        status: 'draft',
        slug: json.data.slug,
        fullData: json,
      };

      try {
        const saveResponse = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle),
        });
        const saved = await saveResponse.json();
        if (saveResponse.ok && saved.success && saved.article?.id) {
          articleId = saved.article.id;
          newArticle.id = articleId;
        }
      } catch {
        console.warn('Supabase article save failed; keeping browser-local copy.');
      }

      localStorage.setItem('generated_articles', JSON.stringify([newArticle, ...savedArticles]));
      router.push(`/dashboard/generate/result?id=${articleId}`);
    } catch {
      setError('Network error. Please check your connection.');
      setLoading(false);
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">Generate Content</h1>
        </div>
        <p className="text-white/40 text-sm ml-12">Six selectable SEO writing systems with post-generation validation</p>
      </div>

      <div className="flex items-center gap-3 mb-10">
        {[{ n: 1, label: 'Select Mode' }, { n: 2, label: 'Configure' }, { n: 3, label: 'Generate' }].map((item, index) => (
          <div key={item.n} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${step >= item.n ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-white/5 text-white/30 border border-white/10'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step >= item.n ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}>
                {step > item.n ? 'OK' : item.n}
              </span>
              {item.label}
            </div>
            {index < 2 && <div className={`h-px w-8 ${step > item.n ? 'bg-blue-500/50' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Settings size={18} className="text-blue-400" /> Choose Your SEO Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {WRITING_MODES.map(writingMode => {
              const visual = modeVisuals[writingMode.id];
              const Icon = visual.icon;
              const selected = selectedMode === writingMode.id;
              return (
                <button key={writingMode.id} onClick={() => chooseMode(writingMode.id)}
                  className={`relative text-left p-5 rounded-2xl border transition-all ${selected ? `bg-gradient-to-br ${visual.color} bg-opacity-10 ${visual.border} border bg-white/5` : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'}`}>
                  <span className="absolute top-3 right-3 text-[9px] bg-white/10 text-white/55 px-2 py-0.5 rounded-full font-bold">
                    {writingMode.publicCheckCount}
                  </span>
                  {selected && <CheckCircle2 size={14} className="absolute bottom-3 right-3 text-blue-400" />}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${visual.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="font-bold text-sm">{writingMode.name}</p>
                  <p className="text-[11px] text-white/40 mt-1">{writingMode.tagline}</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(2)}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
            Continue <ArrowRight size={18} />
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Type size={18} className="text-blue-400" /> Configure Your Article
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Focus Keyword *</label>
                <input value={keyword} onChange={event => setKeyword(event.target.value)}
                  placeholder="e.g. best SEO tools 2026"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Word Count</label>
                <div className="flex flex-wrap gap-2">
                  {wordCounts.map(count => (
                    <button key={count} onClick={() => setWordCount(Math.max(count, mode.minimumWords))}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${wordCount === count ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                      {count}+
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Language</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map(option => (
                    <button key={option} onClick={() => setLanguage(option)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${language === option ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(option => (
                    <button key={option} onClick={() => setTone(option)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${tone === option ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Formality</label>
                <div className="flex gap-2">
                  {formalities.map(option => (
                    <button key={option} onClick={() => setFormality(option)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${formality === option ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Reading Level</label>
                  <select value={readingLevel} onChange={event => setReadingLevel(event.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-blue-500/60">
                    {readingLevels.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">Point of View</label>
                  <select value={pointOfView} onChange={event => setPointOfView(event.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-blue-500/60">
                    {pointsOfView.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 h-fit">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{mode.name}</p>
                  <p className="text-[11px] text-white/40 mt-1">{mode.auditTarget}</p>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2.5 py-1 font-bold">
                  {mode.measuredCheckCount} measured checks
                </span>
              </div>
              <p className="text-[11px] text-white/50 mb-4">
                Minimum depth: {mode.minimumWords}+ words. Measurable output signals are audited after generation.
              </p>
              <div className="space-y-2">
                {mode.rules.map(rule => (
                  <div key={rule} className="flex items-start gap-2 text-[11px] text-white/60">
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                    {rule}
                  </div>
                ))}
              </div>
              {mode.id === 'yoast' && (
                <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-orange-300">Yoast validation checklist</p>
                    <p className="text-[10px] text-white/40 mt-1">
                      Generated output is measured against all 46 named checks. Site-level signals use available article and link-plan data.
                    </p>
                  </div>
                  {YOAST_CHECKPOINT_GROUPS.map(group => (
                    <div key={group.title}>
                      <p className="text-[10px] font-bold text-white/70 mb-1.5">
                        {group.title} <span className="text-white/35">{group.checks.length} checks</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                        {group.checks.map(check => (
                          <p key={check} className="text-[10px] text-white/45">- {check}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mt-7 mb-3">Optimization Intensity</p>
              <div className="grid grid-cols-3 gap-2">
                {intensities.map(option => (
                  <button key={option.id} onClick={() => setIntensity(option.id)}
                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${intensity === option.id ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">Back</button>
            <button onClick={handleGenerate}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
              <Zap size={16} /> Generate Article
            </button>
          </div>
        </motion.div>
      )}

      {step === 3 && loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30">
            <Loader2 size={36} className="text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-black mb-2">Generating with {mode.shortName}</h2>
          <div className="space-y-3 mt-10">
            {stages.map((stage, index) => (
              <div key={stage} className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all ${index < loadingStage ? 'bg-emerald-500/10 border-emerald-500/20' : index === loadingStage ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${index < loadingStage ? 'bg-emerald-500 text-white' : index === loadingStage ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/20'}`}>
                  {index < loadingStage ? 'OK' : index === loadingStage ? <Loader2 size={12} className="animate-spin" /> : index + 1}
                </div>
                <p className={`text-xs font-medium ${index < loadingStage ? 'text-emerald-400' : index === loadingStage ? 'text-blue-300' : 'text-white/25'}`}>{stage}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/20">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
