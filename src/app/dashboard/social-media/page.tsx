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
import { WorkspacePage, WorkspaceHeader, WorkspaceBody, ToolSwitcher, Panel, Field, Segmented, EmptyState, Notice, ui, cx } from '@/components/workspace/ui';

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
    label: 'Captions & Hooks', 
    icon: Flame, 
    description: '5 psychological hook types + high-converting captions tailored by platform.',
    badge: 'Popular'
  },
  { 
    id: 'carousel_planner', 
    label: 'Carousel', 
    icon: Layers, 
    description: 'Slide-by-slide breakdowns with exact copy and designer visual cues.' 
  },
  { 
    id: 'reels_shorts_script', 
    label: 'Reels Script', 
    icon: Video, 
    description: 'Timestamped 15-60s short-form scripts with on-screen text overlays & B-roll cues.' 
  },
  { 
    id: 'video_ideas', 
    label: 'Video Ideas', 
    icon: Lightbulb, 
    description: '8-10 high-retention video concepts, click-worthy titles & talking outlines.' 
  },
  { 
    id: 'social_article', 
    label: 'Article', 
    icon: FileText, 
    description: 'Deep-dive LinkedIn Pulse, Medium, or newsletter editions with zero fluff.' 
  },
  { 
    id: 'repurpose_pack', 
    label: 'Repurpose', 
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
  const [duration, setDuration] = useState('30-45s (Standard)');

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

  const currentTool = TOOLS.find(t => t.id === activeTool) || TOOLS[0];
  const textOut = generatedData ? (typeof generatedData === 'string' ? generatedData : JSON.stringify(generatedData, null, 2)) : '';

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Social Workspace"
        crumbs={[{ label: 'Growth', href: '/dashboard' }]}
        actions={
          <button type="button" onClick={handleAutofillBrand} className={ui.btnSecondary} title="Fill audience, offer and language from Brand Brain">
            <Brain size={14} className={isSyncingBrand ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Use Brand Brain</span>
          </button>
        }
      />

      <WorkspaceBody>
        <ToolSwitcher
          items={TOOLS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
          value={activeTool}
          onChange={id => {
            setActiveTool(id);
            setGeneratedData(null);
            setError(null);
          }}
        />

        <div className="flex flex-col gap-6">
          {/* Input */}
          <Panel title={currentTool.label} bodyClassName="space-y-4">
            {activeTool !== 'repurpose_pack' ? (
              <Field label="Topic">
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. 5 SEO mistakes small shops make"
                  className={ui.input}
                />
              </Field>
            ) : (
              <Field label="Source content">
                <textarea
                  rows={6}
                  value={sourceContent}
                  onChange={e => setSourceContent(e.target.value)}
                  placeholder="Paste a blog post, transcript or notes"
                  className={ui.textarea}
                />
              </Field>
            )}

            {activeTool !== 'repurpose_pack' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Details</span>
                  <div className="flex items-center gap-1">
                    {!isRecording && !isTranscribing && (
                      <button type="button" onClick={startVoiceRecording} className={ui.btnGhost} title="Speak in Bangla, Banglish or English">
                        <Mic size={13} /> Voice
                      </button>
                    )}
                    {isRecording && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2 text-xs font-medium tabular-nums text-red-500">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                          {formatTimer(recordSeconds)}
                        </span>
                        <button type="button" onClick={stopVoiceRecording} className={ui.btnGhost}>
                          <Square size={11} className="fill-current" /> Done
                        </button>
                        <button type="button" onClick={cancelVoiceRecording} className={ui.btnGhost} title="Cancel">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    {isTranscribing && (
                      <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
                        <Loader2 size={13} className="animate-spin" /> Transcribing
                      </span>
                    )}
                    {context && !isRecording && (
                      <button type="button" onClick={() => setContext('')} className={ui.btnGhost}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Offer, price, story, pain points"
                  className={ui.textarea}
                />
                {voiceSuccessMsg && <div className="mt-2"><Notice tone="success">{voiceSuccessMsg}</Notice></div>}
                {voiceErrorMsg && <div className="mt-2"><Notice>{voiceErrorMsg}</Notice></div>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Platform">
                <select value={platform} onChange={e => setPlatform(e.target.value)} className={ui.select}>
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tone">
                <select value={tone} onChange={e => setTone(e.target.value)} className={ui.select}>
                  {TONES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Audience">
                <input
                  type="text"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  placeholder="e.g. SME founders"
                  className={ui.input}
                />
              </Field>
              <Field label="Goal / CTA">
                <input
                  type="text"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="e.g. Comment GUIDE"
                  className={ui.input}
                />
              </Field>
            </div>

            {activeTool === 'reels_shorts_script' && (
              <div>
                <span className={ui.label}>Duration</span>
                <Segmented
                  className="w-full"
                  options={[
                    { id: '15-30s (Rapid)', label: '15–30s' },
                    { id: '30-45s (Standard)', label: '30–45s' },
                    { id: '60s (Deep)', label: '60s' },
                  ]}
                  value={duration}
                  onChange={setDuration}
                />
              </div>
            )}

            <div>
              <span className={ui.label}>Language</span>
              <Segmented
                className="w-full"
                options={[
                  { id: 'English', label: 'English' },
                  { id: 'Bengali', label: 'বাংলা' },
                ]}
                value={language}
                onChange={v => setLanguage(v as 'English' | 'Bengali')}
              />
            </div>

            {error && <Notice>{error}</Notice>}

            <button type="button" disabled={isGenerating} onClick={handleGenerate} className={cx(ui.btnPrimary, 'h-11 w-full')}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generating…' : 'Generate'}
            </button>
          </Panel>

          {/* Output */}
          <Panel
            title="Output"
            bodyClassName="min-h-[480px]"
            actions={
              generatedData && (
                <>
                  <button onClick={() => copyToClipboard(textOut, 'all')} className={ui.btnGhost}>
                    {copiedKey === 'all' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === 'all' ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={downloadAsMarkdown} className={ui.btnGhost}>
                    <Download className="h-3.5 w-3.5" /> .md
                  </button>
                  <button onClick={handleSaveAsset} disabled={isSaved} className={ui.btnSecondary}>
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </>
              )
            }
          >
            <div>
              {!generatedData && !isGenerating && (
                <EmptyState icon={Share2} title="Nothing generated yet" text="Fill in the topic and press Generate." />
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Loader2 className="mb-3 h-6 w-6 animate-spin text-[#FF5533]" />
                  <p className="text-sm text-muted-foreground">Writing for {platform}…</p>
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
                              <Flame className="w-3.5 h-3.5" /> Hooks
                            </span>
                            <span className="text-[11px] text-slate-400">Click to copy</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {generatedData.hookVariations.map((h: any, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => copyToClipboard(h.hook, `hook-${idx}`)}
                                className="group p-3 rounded-xl border border-border bg-background hover:bg-white dark:hover:bg-[#0d0d0f] hover:border-[#FF5533]/50 cursor-pointer transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-[#FF5533]">
                                    {h.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400 group-hover:text-[#FF5533]">
                                    {copiedKey === `hook-${idx}` ? 'Copied!' : 'Copy'}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-foreground">
                                  "{h.hook}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Primary Caption */}
                      {generatedData.primaryCaption && (
                        <div className="p-4 rounded-xl border border-border bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">
                              Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.primaryCaption, 'primary-cap')}
                              className="text-xs font-semibold text-[#FF5533] hover:underline inline-flex items-center gap-1"
                            >
                              {copiedKey === 'primary-cap' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy Caption
                            </button>
                          </div>
                          <div className="text-xs text-foreground whitespace-pre-line leading-relaxed font-normal bg-card p-3.5 rounded-lg border border-border">
                            {generatedData.primaryCaption}
                          </div>
                        </div>
                      )}

                      {/* Alternative Captions */}
                      {generatedData.alternativeCaptions && (
                        <div>
                          <span className="text-xs font-bold text-foreground block mb-2">
                            Alternative Angles
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {generatedData.alternativeCaptions.map((alt: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between"
                              >
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {alt.label}
                                  </span>
                                  <p className="text-xs text-foreground mt-1 line-clamp-4">
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
                              className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground cursor-pointer hover:bg-orange-500/10 hover:text-[#FF5533] transition-colors"
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
                            className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground">
                                  Slide {slide.slideNumber || idx + 1}: {slide.slideType}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(`${slide.headline}\n${slide.body}`, `slide-${idx}`)}
                                  className="text-[10px] text-slate-400 hover:text-[#FF5533]"
                                >
                                  {copiedKey === `slide-${idx}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <h5 className="text-xs font-bold text-foreground mb-1.5">
                                {slide.headline}
                              </h5>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                {slide.body}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg bg-muted border border-border text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-foreground">Visual Cue: </span>
                              {slide.visualDirection}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.postCaption && (
                        <div className="mt-4 p-3.5 rounded-xl border border-border bg-background">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-foreground">
                              Caption
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedData.postCaption, 'car-cap')}
                              className="text-xs text-[#FF5533] font-semibold hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">
                            {generatedData.postCaption}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tool 3: Reels & Shorts Script */}
                  {activeTool === 'reels_shorts_script' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">
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
                            className="p-3.5 rounded-xl border border-border bg-card"
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

                            <p className="text-xs font-semibold text-foreground mb-2 leading-relaxed">
                              "{sec.speakerText}"
                            </p>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-muted p-2 rounded-lg">
                              <span className="font-semibold text-foreground">Visual Cue: </span>
                              {sec.visualCue}
                            </div>
                          </div>
                        ))}
                      </div>

                      {generatedData.audioMusicDirection && (
                        <div className="p-3 rounded-xl bg-muted border border-border text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-foreground">Audio: </span>
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
                            className="p-4 rounded-xl border border-border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                                Concept #{idx + 1} • {idea.format || 'Short Video'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(`${idea.title}\nHook: ${idea.hook}\n${idea.talkingPoints?.join('\n')}`, `idea-${idx}`)}
                                className="text-[11px] font-semibold text-[#FF5533] dark:text-[#FF7A45] hover:underline"
                              >
                                {copiedKey === `idea-${idx}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            <h4 className="text-xs font-bold text-foreground mb-1">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-[#FF5533] dark:text-[#FF7A45] font-medium mb-2.5">
                              Hook: "{idea.hook}"
                            </p>

                            <div className="space-y-1 mb-2.5">
                              {idea.talkingPoints?.map((pt: string, pIdx: number) => (
                                <div key={pIdx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-[#FF5533] font-bold">•</span>
                                  <span>{pt}</span>
                                </div>
                              ))}
                            </div>

                            {idea.retentionCTA && (
                              <div className="text-[11px] font-medium text-slate-500 bg-muted p-2 rounded-lg">
                                <span className="font-semibold text-foreground">CTA Trigger: </span>
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
                      <div className="p-4 rounded-xl border border-border bg-card">
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
                        <h3 className="text-sm font-extrabold text-foreground mb-1">
                          {generatedData.articleTitle}
                        </h3>
                        <p className="text-xs text-slate-500 italic mb-4">
                          {generatedData.subtitle}
                        </p>

                        <div className="text-xs text-foreground whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-white/10 pt-3">
                          {generatedData.contentMarkdown}
                        </div>
                      </div>

                      {generatedData.keyTakeaways && (
                        <div className="p-3.5 rounded-xl bg-muted border border-border">
                          <span className="text-xs font-bold text-foreground block mb-2">
                            Key Takeaways:
                          </span>
                          <ul className="space-y-1 text-xs text-muted-foreground">
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
                        <div className="p-4 rounded-xl border border-border bg-card">
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
                          <h5 className="text-xs font-bold text-foreground mb-1.5">
                            {generatedData.storyPost.headline}
                          </h5>
                          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                            {generatedData.storyPost.content}
                          </p>
                        </div>
                      )}

                      {/* Video Script */}
                      {generatedData.shortVideoScript && (
                        <div className="p-4 rounded-xl border border-border bg-card">
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
                          <p className="text-xs text-muted-foreground mb-2">
                            {generatedData.shortVideoScript.body}
                          </p>
                          <span className="text-[11px] text-slate-500 bg-muted px-2 py-1 rounded">
                            CTA: {generatedData.shortVideoScript.cta}
                          </span>
                        </div>
                      )}

                      {/* Authority Post */}
                      {generatedData.authorityPost && (
                        <div className="p-4 rounded-xl border border-border bg-card">
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
                          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                            {generatedData.authorityPost.content}
                          </p>
                        </div>
                      )}

                      {/* Tweet Thread */}
                      {generatedData.tweetThread?.tweets && (
                        <div className="p-4 rounded-xl border border-border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">
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
                              <div key={idx} className="p-2.5 rounded-lg bg-muted text-xs text-foreground border border-border">
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
          </Panel>
        </div>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
