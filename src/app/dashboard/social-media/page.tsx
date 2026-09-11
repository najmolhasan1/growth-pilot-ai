'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Brain, 
  Loader2, 
  Share2, 
  Layers, 
  Video, 
  Lightbulb, 
  FileText, 
  Repeat, 
  BookmarkCheck, 
  Flame, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Send
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

type ToolId = 
  | 'viral_caption' 
  | 'carousel_planner' 
  | 'reels_shorts_script' 
  | 'video_ideas' 
  | 'social_article' 
  | 'repurpose_pack';

interface ToolDef {
  id: ToolId;
  label: string;
  icon: typeof Sparkles;
  description: string;
  badge?: string;
}

const TOOLS: ToolDef[] = [
  { 
    id: 'viral_caption', 
    label: 'Viral Captions & Hooks', 
    icon: Flame, 
    description: '5 psychological hook types + high-converting captions tailored by platform.',
    badge: 'Popular'
  },
  { 
    id: 'carousel_planner', 
    label: 'Carousel & Post Planner', 
    icon: Layers, 
    description: 'Slide-by-slide breakdowns with exact copy and designer visual cues.' 
  },
  { 
    id: 'reels_shorts_script', 
    label: 'Reels & Shorts Scripts', 
    icon: Video, 
    description: 'Timestamped 15-60s short-form scripts with on-screen text overlays & B-roll cues.' 
  },
  { 
    id: 'video_ideas', 
    label: 'Video Ideas Generator', 
    icon: Lightbulb, 
    description: '8-10 high-retention video concepts, click-worthy titles & talking outlines.' 
  },
  { 
    id: 'social_article', 
    label: 'Social Articles & Newsletters', 
    icon: FileText, 
    description: 'Deep-dive LinkedIn Pulse, Medium, or newsletter editions with zero fluff.' 
  },
  { 
    id: 'repurpose_pack', 
    label: '1-to-Many Repurposer', 
    icon: Repeat, 
    description: 'Turn 1 topic, link, or note into a 5-platform complete content bundle.',
    badge: '10x Speed'
  },
];

const PLATFORMS = [
  'Facebook',
  'Instagram',
  'LinkedIn',
  'X / Twitter',
  'TikTok',
  'YouTube Shorts',
  'Multi-Platform'
];

const TONES = [
  'Conversational & Human',
  'Bold & Contrarian',
  'Educational & Actionable',
  'Relatable Storyteller',
  'High Energy & Punchy',
  'Executive & Thought Leader'
];

export default function SocialMediaWorkspacePage() {
  const [activeTool, setActiveTool] = useState<ToolId>('viral_caption');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('Conversational & Human');
  const [goal, setGoal] = useState('Engagement & Shares');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState<'English' | 'Bengali'>('English');
  const [sourceContent, setSourceContent] = useState('');
  const [duration, setDuration] = useState('30-45 seconds');

  const [brandProfile, setBrandProfile] = useState<Record<string, string>>({});
  const [isSyncingBrand, setIsSyncingBrand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brand profile
  useEffect(() => {
    const local = localStorage.getItem('marketing_brand_profile');
    if (local) {
      try {
        setBrandProfile(JSON.parse(local));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAutofillBrand = () => {
    setIsSyncingBrand(true);
    if (brandProfile.audience && !audience) {
      setAudience(brandProfile.audience);
    }
    if (brandProfile.offer && !topic) {
      setTopic(brandProfile.offer);
    }
    if (brandProfile.language) {
      if (/bengali|bangla/i.test(brandProfile.language)) {
        setLanguage('Bengali');
      } else {
        setLanguage('English');
      }
    }
    setTimeout(() => setIsSyncingBrand(false), 400);
  };

  const handleGenerate = async () => {
    if (!topic && !sourceContent) {
      setError('Please provide a topic or source content to generate.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/social-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: activeTool,
          topic,
          platform,
          tone,
          goal,
          audience,
          language,
          duration,
          sourceContent,
          brandProfile
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Generation failed');
      }

      setGeneratedData(resData.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key = 'main') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveAsset = async () => {
    if (!generatedData) return;
    try {
      if (!isSupabaseConfigured()) {
        setIsSaved(true);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) {
        setIsSaved(true);
        return;
      }

      await fetch('/api/marketing-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tool: `social_${activeTool}`,
          title: topic || 'Social Media Asset',
          language,
          inputs: { topic, platform, tone, goal, audience },
          result: {
            executiveSummary: `Generated ${activeTool} for ${platform}`,
            primaryOutput: JSON.stringify(generatedData, null, 2),
            assumptions: [],
            missingInputs: [],
            strategy: [],
            variations: [],
            checklist: [],
            nextBestActions: []
          }
        })
      });
      setIsSaved(true);
    } catch (e) {
      console.error(e);
      setIsSaved(true);
    }
  };

  const downloadAsMarkdown = () => {
    if (!generatedData) return;
    const content = typeof generatedData === 'string' 
      ? generatedData 
      : JSON.stringify(generatedData, null, 2);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTool}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                AI Social Suite
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Anti-AI Slop • Native Bangla & English
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Social Media Workspace
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Produce viral hooks, platform-optimized captions, carousel scripts, and video ideas tailored for high retention and conversions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutofillBrand}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all shadow-sm"
              title="Pull audience, tone and offer from Brand Brain"
            >
              <Brain className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isSyncingBrand ? 'animate-spin' : ''}`} />
              Sync Brand Brain
            </button>
          </div>
        </div>

        {/* Tool Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setGeneratedData(null);
                  setError(null);
                }}
                className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/5 ring-2 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tool.badge && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {tool.badge}
                  </span>
                )}
                <div className={`p-2 rounded-xl mb-2 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                  {tool.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Smart Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Campaign & Content Inputs
              </h2>
              <span className="text-xs text-slate-400">
                {activeTool.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Language Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Output Language & Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('English')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      language === 'English'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    English (Conversion Copy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('Bengali')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      language === 'Bengali'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    বাংলা (Natural Banglish)
                  </button>
                </div>
              </div>

              {/* Topic or Core Subject */}
              {activeTool !== 'repurpose_pack' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    What is the topic, product, or core message?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 5 Common SEO Mistakes in 2026, or Summer Leather Bag Launch"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Paste Source Content or Link / Notes to Repurpose
                  </label>
                  <textarea
                    rows={5}
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    placeholder="Paste a blog excerpt, video transcript, or raw campaign notes here to transform into 5 multi-channel posts..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

              {/* Target Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Desired Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tool specific options */}
              {activeTool === 'reels_shorts_script' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Video Target Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['15-30s (Rapid)', '30-45s (Standard)', '60s (Deep)'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                          duration === d
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience & Goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Audience / Persona
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Freelancers, Tech students, SME founders"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Conversion Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Get DMs, Website Clicks, Saves"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Human-Grade Social Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate {TOOLS.find(t => t.id === activeTool)?.label}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Formatted Output */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm min-h-[540px] flex flex-col">
            
            {/* Output Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Live Social Canvas
                </span>
              </div>

              {generatedData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(typeof generatedData === 'string' ? generatedData : JSON.stringify(generatedData, null, 2), 'all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                  >
                    {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy All
                  </button>
                  <button
                    onClick={downloadAsMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    MD
                  </button>
                  <button
                    onClick={handleSaveAsset}
                    disabled={isSaved}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    {isSaved ? 'Saved to Library' : 'Save Asset'}
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              {!generatedData && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <Share2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ready to create usable social content
                  </h3>
                  <p className="text-xs max-w-sm text-slate-500 dark:text-slate-400">
                    Fill in your topic or paste raw notes on the left, pick your platform, and generate human-grade social media copy without generic AI fluff.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Crafting Human-Rhythm Social Copy...
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Applying anti-slop filters, optimizing hooks for {platform}, and aligning with audience psychology.
                  </p>
                </div>
              )}

              {generatedData && !isGenerating && (
                <div className="space-y-6">
                  {/* Tool 1: Viral Caption Kit */}
                  {activeTool === 'viral_caption' && (
                    <div className="space-y-5">
                      {/* Hooks Section */}
                      {generatedData.hookVariations && (
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5" /> 5 Psychological Hook Variations
                            </span>
                            <span className="text-[11px] text-slate-400">Click to copy hook</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {generatedData.hookVariations.map((h: any, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => copyToClipboard(h.hook, `hook-${idx}`)}
                                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-400 cursor-pointer transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    {h.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400 group-hover:text-indigo-600">
                                    {copiedKey === `hook-${idx}` ? 'Copied!' : 'Copy'}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                  "{h.hook}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Primary Caption */}
                      {generatedData.primaryCaption && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Primary High-Converting Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.primaryCaption, 'primary-cap')}
                              className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              {copiedKey === 'primary-cap' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy Caption
                            </button>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {generatedData.primaryCaption}
                          </div>
                        </div>
                      )}

                      {/* Alternative Captions */}
                      {generatedData.alternativeCaptions && (
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                            Alternative Angles
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {generatedData.alternativeCaptions.map((alt: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
                              >
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {alt.label}
                                  </span>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-4">
                                    {alt.caption}
                                  </p>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(alt.caption, `alt-${idx}`)}
                                  className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 self-start hover:underline inline-flex items-center gap-1"
                                >
                                  {copiedKey === `alt-${idx}` ? 'Copied!' : 'Copy Angle'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags & Tips */}
                      {generatedData.hashtags && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-xs font-semibold text-slate-400 mr-1">Tags:</span>
                          {generatedData.hashtags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool 2: Carousel Planner */}
                  {activeTool === 'carousel_planner' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          Carousel Promise / Theme: {generatedData.theme}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generatedData.slides?.map((slide: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  Slide {slide.slideNumber || idx + 1}: {slide.slideType}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(`${slide.headline}\n${slide.body}`, `slide-${idx}`)}
                                  className="text-[10px] text-slate-400 hover:text-indigo-600"
                                >
                                  {copiedKey === `slide-${idx}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                                {slide.headline}
                              </h5>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                {slide.body}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Visual Cue: </span>
                              {slide.visualDirection}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.postCaption && (
                        <div className="mt-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Carousel Accompanying Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.postCaption, 'car-cap')}
                              className="text-xs text-indigo-600 font-semibold hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                            {generatedData.postCaption}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool 3: Reels & Shorts Script */}
                  {activeTool === 'reels_shorts_script' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {generatedData.videoTitle}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Target Emotion: {generatedData.targetEmotion} • Duration: {generatedData.estimatedDuration}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(generatedData.scriptSections, null, 2), 'script-all')}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Copy Script
                        </button>
                      </div>

                      <div className="space-y-3">
                        {generatedData.scriptSections?.map((sec: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                                {sec.timeRange} — {sec.sectionName}
                              </span>
                              {sec.onScreenText && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                  Overlay: "{sec.onScreenText}"
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2 leading-relaxed">
                              🗣️ "{sec.speakerText}"
                            </p>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Visual Cue: </span>
                              {sec.visualCue}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.audioMusicDirection && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">🎵 Audio Direction: </span>
                          {generatedData.audioMusicDirection}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool 4: Video Ideas Generator */}
                  {activeTool === 'video_ideas' && (
                    <div className="space-y-3">
                      {generatedData.strategySummary && (
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-800 dark:text-indigo-200">
                          <span className="font-bold">Strategy: </span>
                          {generatedData.strategySummary}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        {generatedData.ideas?.map((idea: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Concept #{idx + 1} • {idea.format || 'Short Video'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(`${idea.title}\nHook: ${idea.hook}\n${idea.talkingPoints?.join('\n')}`, `idea-${idx}`)}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {copiedKey === `idea-${idx}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2.5">
                              Hook: "{idea.hook}"
                            </p>

                            <div className="space-y-1 mb-2.5">
                              {idea.talkingPoints?.map((pt: string, pIdx: number) => (
                                <div key={pIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                  <span className="text-indigo-500 font-bold">•</span>
                                  <span>{pt}</span>
                                </div>
                              ))}
                            </div>

                            {idea.retentionCTA && (
                              <div className="text-[11px] font-medium text-slate-500 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">CTA Trigger: </span>
                                {idea.retentionCTA}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool 5: Social Article */}
                  {activeTool === 'social_article' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {generatedData.readTime || '3 min read'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(generatedData.contentMarkdown, 'art-md')}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Copy Full Article
                          </button>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                          {generatedData.articleTitle}
                        </h3>
                        <p className="text-xs text-slate-500 italic mb-4">
                          {generatedData.subtitle}
                        </p>

                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                          {generatedData.contentMarkdown}
                        </div>
                      </div>

                      {generatedData.keyTakeaways && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                            Key Takeaways:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {generatedData.keyTakeaways.map((t: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool 6: Repurpose Pack */}
                  {activeTool === 'repurpose_pack' && (
                    <div className="space-y-4">
                      {/* Story Post */}
                      {generatedData.storyPost && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              Channel 1: Story Narrative ({generatedData.storyPost.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.storyPost.content, 'rep-story')}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                            {generatedData.storyPost.headline}
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {generatedData.storyPost.content}
                          </p>
                        </div>
                      )}

                      {/* Video Script */}
                      {generatedData.shortVideoScript && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              Channel 2: Short-Form Video ({generatedData.shortVideoScript.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(`Hook: ${generatedData.shortVideoScript.hook}\n${generatedData.shortVideoScript.body}\nCTA: ${generatedData.shortVideoScript.cta}`, 'rep-vid')}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                            Hook: "{generatedData.shortVideoScript.hook}"
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                            {generatedData.shortVideoScript.body}
                          </p>
                          <span className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded">
                            CTA: {generatedData.shortVideoScript.cta}
                          </span>
                        </div>
                      )}

                      {/* Authority Post */}
                      {generatedData.authorityPost && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                              Channel 3: Authority Post ({generatedData.authorityPost.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.authorityPost.content, 'rep-auth')}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {generatedData.authorityPost.content}
                          </p>
                        </div>
                      )}

                      {/* Tweet Thread */}
                      {generatedData.tweetThread?.tweets && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Channel 4: Thread ({generatedData.tweetThread.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.tweetThread.tweets.join('\n\n---\n\n'), 'rep-thread')}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              Copy Thread
                            </button>
                          </div>
                          <div className="space-y-2">
                            {generatedData.tweetThread.tweets.map((tw: string, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80">
                                <span className="font-bold text-slate-400 mr-1.5">{idx + 1}/</span>
                                {tw}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
