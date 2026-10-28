'use client';

import { useState, useEffect, useRef } from 'react';
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
  Send,
  Mic,
  Square,
  Volume2,
  Trash2,
  Target,
  Globe,
  AlertCircle,
  CheckCircle2,
  PenTool
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
  const [context, setContext] = useState('');
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

  // Voice Typing (Bangla / Banglish / English)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio stream and timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = async () => {
    setVoiceErrorMsg('');
    setVoiceSuccessMsg('');

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceErrorMsg('Microphone is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 180) {
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceErrorMsg('Microphone access denied. Please allow microphone permissions.');
      } else {
        setVoiceErrorMsg('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      return;
    }

    recorder.onstop = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);

      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      audioChunksRef.current = [];

      if (audioBlob.size < 100) {
        setVoiceErrorMsg('Recording was too short or empty. Please speak again.');
        return;
      }

      setIsTranscribing(true);
      setVoiceErrorMsg('');

      try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const res = await fetch('/api/voice-transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: audioBlob.type || 'audio/webm',
              }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Failed to transcribe speech.');
            }

            const transcribedText = (data.text || '').trim();
            if (!transcribedText) {
              setVoiceErrorMsg('No speech could be recognized. Please try speaking closer to the microphone.');
            } else {
              if (activeTool === 'repurpose_pack') {
                setSourceContent(prev => {
                  const cleaned = prev.trim();
                  return cleaned ? `${cleaned}\n\n${transcribedText}` : transcribedText;
                });
              } else {
                setContext(prev => {
                  const cleaned = prev.trim();
                  return cleaned ? `${cleaned}\n\n${transcribedText}` : transcribedText;
                });
                if (!topic) {
                  const firstWords = transcribedText.split(/\s+/).slice(0, 8).join(' ');
                  setTopic(firstWords);
                }
              }
              setVoiceSuccessMsg('Voice transcribed accurately! Feel free to edit or add more.');
              setTimeout(() => setVoiceSuccessMsg(''), 5000);
            }
          } catch (transcribeErr: any) {
            setVoiceErrorMsg(transcribeErr.message || 'Voice transcription failed.');
          } finally {
            setIsTranscribing(false);
          }
        };
      } catch (err: any) {
        setIsTranscribing(false);
        setVoiceErrorMsg(err.message || 'Failed to process audio.');
      }
    };

    recorder.stop();
  };

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
    if (brandProfile.rawBusinessDescription && !context) {
      setContext(brandProfile.rawBusinessDescription);
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
    if (!topic && !sourceContent && !context) {
      setError('Please provide a topic, context, or source content to generate.');
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
          topic: topic || (context ? context.slice(0, 100) : ''),
          context,
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
          inputs: { topic, context, platform, tone, goal, audience },
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#030303] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-[#FF5533] border border-orange-500/30">
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
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#FF5533]/50 transition-all shadow-sm"
              title="Pull audience, tone and offer from Brand Brain"
            >
              <Brain className={`w-4 h-4 text-[#FF5533] dark:text-[#FF7A45] ${isSyncingBrand ? 'animate-spin' : ''}`} />
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
                    ? 'bg-white dark:bg-[#0d0d0f] border-[#FF5533] dark:border-[#FF5533] shadow-md shadow-[#FF5533]/15 ring-2 ring-[#FF5533]/20'
                    : 'bg-white/60 dark:bg-[#0d0d0f]/60 border-slate-200 dark:border-white/[0.06] hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tool.badge && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {tool.badge}
                  </span>
                )}
                <div className={`p-2 rounded-xl mb-2 ${isActive ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white shadow-sm shadow-[#FF5533]/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
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
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md p-5 sm:p-7 shadow-xl dark:shadow-2xl dark:shadow-black/40 space-y-6">
            
            {/* Header: Tool Identity & Brand Sync */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] flex items-center justify-center text-white shadow-md shadow-[#FF5533]/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {TOOLS.find(t => t.id === activeTool)?.label}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5 line-clamp-1">
                    {TOOLS.find(t => t.id === activeTool)?.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutofillBrand}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#FF5533]/10 hover:bg-[#FF5533]/20 border border-[#FF5533]/30 text-[#FF5533] dark:text-[#FF7A45] transition-all shadow-sm"
                title="Auto-fill audience, tone and offer from Brand Brain"
              >
                <Brain className={`w-3.5 h-3.5 ${isSyncingBrand ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Brand</span>
              </button>
            </div>

            {/* SECTION 1: CONTENT, TOPIC & VOICE CONTEXT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#FF5533]" />
                  1. Content & Topic Details
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60">
                  Required
                </span>
              </div>

              {activeTool !== 'repurpose_pack' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Topic / Headline / Core Angle <span className="text-[#FF5533]">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 5 Costly SEO Mistakes in 2026, or Summer Handbag Launch"
                    className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] transition"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Source Content, Link or Raw Notes <span className="text-[#FF5533]">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    placeholder="Paste blog content, video transcript, or raw campaign notes here to transform into 5 multi-channel posts..."
                    className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] resize-y transition"
                  />
                </div>
              )}

              {/* CONTEXT BOX WITH VOICE TYPING */}
              {activeTool !== 'repurpose_pack' && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Campaign Context, Offer Details & Talking Points
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-white/40">
                      Add pricing, specific discount, backstory, pain points, or speak directly via mic.
                    </p>
                  </div>

                  {/* Voice Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isRecording && !isTranscribing && (
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5533]/15 hover:bg-[#FF5533]/25 border border-[#FF5533]/40 text-[#FF5533] dark:text-[#FF8A00] text-xs font-bold transition shadow-sm"
                        >
                          <Mic size={14} className="group-hover:scale-110 transition-transform" />
                          <span>Voice Type (Bangla / Banglish / English)</span>
                        </button>
                      )}

                      {isRecording && (
                        <div className="inline-flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 dark:text-rose-300 text-xs font-semibold animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Recording: {formatTimer(recordSeconds)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-black shadow-md transition"
                          >
                            <Square size={11} className="fill-white" />
                            <span>Done & Transcribe</span>
                          </button>

                          <button
                            type="button"
                            onClick={cancelVoiceRecording}
                            title="Cancel recording"
                            className="inline-flex items-center p-2 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition text-xs"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}

                      {isTranscribing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
                          <Loader2 size={14} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                          <span>AI transcribing voice in Bangla/Banglish/English...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/40">
                      <Volume2 size={13} className="hidden sm:inline opacity-60" />
                      <span className="hidden sm:inline">Bangla & mixed Banglish supported</span>
                      {context && (
                        <button
                          type="button"
                          onClick={() => setContext('')}
                          className="text-[10px] text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white underline underline-offset-2 ml-1 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Provide additional context: What makes this special? Who is it for? Any promotion, discount code, personal story, or key angles? (Or tap the mic to speak in Bangla / Banglish)..."
                    className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] resize-y transition"
                  />

                  {voiceSuccessMsg && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-2.5 rounded-xl">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                      <span>{voiceSuccessMsg}</span>
                    </div>
                  )}

                  {voiceErrorMsg && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-2.5 rounded-xl">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{voiceErrorMsg}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: CHANNEL & VOICE POSITIONING */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#FF5533]" />
                  2. Channel, Tone & Positioning
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Publishing Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] transition"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Voice Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] transition"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Audience & Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Audience / Persona
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Freelancers, Tech students, SME founders"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Call-to-Action / Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Comment 'GUIDE', DMs, Website Clicks"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#030303] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF5533]/25 focus:border-[#FF5533] transition"
                  />
                </div>
              </div>

              {/* Video duration if reels */}
              {activeTool === 'reels_shorts_script' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Video Target Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['15-30s (Rapid)', '30-45s (Standard)', '60s (Deep)'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                          duration === d
                            ? 'bg-[#FF5533]/15 border-[#FF5533] text-[#FF5533] dark:text-[#FF7A45] shadow-sm'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: LANGUAGE PREFERENCE */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white/90 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#FF5533]" />
                  3. Output Language
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLanguage('English')}
                  className={`py-2.5 px-3.5 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                    language === 'English'
                      ? 'bg-[#FF5533]/15 border-[#FF5533] text-[#FF5533] dark:text-[#FF7A45] shadow-sm'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span>English (Global Copy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('Bengali')}
                  className={`py-2.5 px-3.5 text-xs font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                    language === 'Bengali'
                      ? 'bg-[#FF5533]/15 border-[#FF5533] text-[#FF5533] dark:text-[#FF7A45] shadow-sm'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span>বাংলা (Natural Banglish)</span>
                </button>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT CTA */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-4 px-5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:brightness-110 active:scale-[0.99] text-white transition-all shadow-xl shadow-[#FF5533]/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Human-Grade Social Copy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {TOOLS.find(t => t.id === activeTool)?.label}</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Column: Dynamic Formatted Output */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#0d0d0f] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm min-h-[540px] flex flex-col">
            
            {/* Output Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-white/[0.06]">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/10 text-[#FF5533] dark:text-[#FF7A45] hover:bg-orange-500/20 transition-all"
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
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5533] dark:text-[#FF7A45] mb-4">
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
                  <Loader2 className="w-10 h-10 text-[#FF5533] animate-spin mb-4" />
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
                            <span className="text-xs font-bold text-[#FF5533] dark:text-[#FF7A45] uppercase tracking-wider flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5" /> 5 Psychological Hook Variations
                            </span>
                            <span className="text-[11px] text-slate-400">Click to copy hook</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {generatedData.hookVariations.map((h: any, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => copyToClipboard(h.hook, `hook-${idx}`)}
                                className="group p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#030303]/50 hover:bg-white dark:hover:bg-[#0d0d0f] hover:border-[#FF5533]/50 cursor-pointer transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-[#FF5533]">
                                    {h.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400 group-hover:text-[#FF5533]">
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
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-[#030303]/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Primary High-Converting Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.primaryCaption, 'primary-cap')}
                              className="text-xs font-semibold text-[#FF5533] hover:underline inline-flex items-center gap-1"
                            >
                              {copiedKey === 'primary-cap' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy Caption
                            </button>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal bg-white dark:bg-[#0d0d0f] p-3.5 rounded-lg border border-slate-200 dark:border-white/10">
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
                                className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f] flex flex-col justify-between"
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
                                  className="mt-3 text-[11px] font-semibold text-[#FF5533] dark:text-[#FF7A45] self-start hover:underline inline-flex items-center gap-1"
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
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-orange-500/10 hover:text-[#FF5533] transition-colors"
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
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <span className="text-xs font-bold text-[#FF5533] dark:text-[#FF7A45]">
                          Carousel Promise / Theme: {generatedData.theme}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generatedData.slides?.map((slide: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f] shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  Slide {slide.slideNumber || idx + 1}: {slide.slideType}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(`${slide.headline}\n${slide.body}`, `slide-${idx}`)}
                                  className="text-[10px] text-slate-400 hover:text-[#FF5533]"
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

                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#030303] border border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Visual Cue: </span>
                              {slide.visualDirection}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.postCaption && (
                        <div className="mt-4 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#030303]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Carousel Accompanying Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.postCaption, 'car-cap')}
                              className="text-xs text-[#FF5533] font-semibold hover:underline"
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
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#030303] border border-slate-200 dark:border-white/10">
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
                          className="text-xs font-semibold text-[#FF5533] dark:text-[#FF7A45] hover:underline"
                        >
                          Copy Script
                        </button>
                      </div>

                      <div className="space-y-3">
                        {generatedData.scriptSections?.map((sec: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-[#FF5533] border border-orange-500/30">
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

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#030303] p-2 rounded-lg">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Visual Cue: </span>
                              {sec.visualCue}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.audioMusicDirection && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#030303] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
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
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-[#FF5533] dark:text-[#FF7A45]">
                          <span className="font-bold">Strategy: </span>
                          {generatedData.strategySummary}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        {generatedData.ideas?.map((idea: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Concept #{idx + 1} • {idea.format || 'Short Video'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(`${idea.title}\nHook: ${idea.hook}\n${idea.talkingPoints?.join('\n')}`, `idea-${idx}`)}
                                className="text-[11px] font-semibold text-[#FF5533] dark:text-[#FF7A45] hover:underline"
                              >
                                {copiedKey === `idea-${idx}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-[#FF5533] dark:text-[#FF7A45] font-medium mb-2.5">
                              Hook: "{idea.hook}"
                            </p>

                            <div className="space-y-1 mb-2.5">
                              {idea.talkingPoints?.map((pt: string, pIdx: number) => (
                                <div key={pIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                  <span className="text-[#FF5533] font-bold">•</span>
                                  <span>{pt}</span>
                                </div>
                              ))}
                            </div>

                            {idea.retentionCTA && (
                              <div className="text-[11px] font-medium text-slate-500 bg-slate-50 dark:bg-[#030303] p-2 rounded-lg">
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
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-[#FF5533]">
                            {generatedData.readTime || '3 min read'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(generatedData.contentMarkdown, 'art-md')}
                            className="text-xs font-semibold text-[#FF5533] dark:text-[#FF7A45] hover:underline"
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

                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-white/10 pt-3">
                          {generatedData.contentMarkdown}
                        </div>
                      </div>

                      {generatedData.keyTakeaways && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#030303] border border-slate-200 dark:border-white/10">
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
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              Channel 1: Story Narrative ({generatedData.storyPost.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.storyPost.content, 'rep-story')}
                              className="text-xs text-[#FF5533] hover:underline"
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
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              Channel 2: Short-Form Video ({generatedData.shortVideoScript.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(`Hook: ${generatedData.shortVideoScript.hook}\n${generatedData.shortVideoScript.body}\nCTA: ${generatedData.shortVideoScript.cta}`, 'rep-vid')}
                              className="text-xs text-[#FF5533] hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs font-bold text-[#FF5533] dark:text-[#FF7A45] mb-1">
                            Hook: "{generatedData.shortVideoScript.hook}"
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                            {generatedData.shortVideoScript.body}
                          </p>
                          <span className="text-[11px] text-slate-500 bg-slate-50 dark:bg-[#030303] px-2 py-1 rounded">
                            CTA: {generatedData.shortVideoScript.cta}
                          </span>
                        </div>
                      )}

                      {/* Authority Post */}
                      {generatedData.authorityPost && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                              Channel 3: Authority Post ({generatedData.authorityPost.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.authorityPost.content, 'rep-auth')}
                              className="text-xs text-[#FF5533] hover:underline"
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
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Channel 4: Thread ({generatedData.tweetThread.platform})
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.tweetThread.tweets.join('\n\n---\n\n'), 'rep-thread')}
                              className="text-xs text-[#FF5533] hover:underline"
                            >
                              Copy Thread
                            </button>
                          </div>
                          <div className="space-y-2">
                            {generatedData.tweetThread.tweets.map((tw: string, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#030303] text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/[0.06]">
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
