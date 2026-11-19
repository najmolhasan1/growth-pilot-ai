'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { WorkspaceHeader, Panel, Notice, ui } from '@/components/workspace/ui';
import { 
  ArrowRight, 
  Brain, 
  CheckCircle2, 
  Cloud, 
  Save, 
  Sparkles, 
  Wand2, 
  Target, 
  Rocket, 
  Users, 
  Check, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Edit3,
  Mic,
  Square,
  Volume2,
  Trash2
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEY = 'marketing_brand_profile';

export type ICPData = {
  personaName: string;
  roleAndContext: string;
  primaryPains: string[];
  dreamOutcome: string;
  purchasingTriggers: string;
  keyObjections: string[];
};

export type GTMData = {
  coreHook: string;
  recommendedChannels: string[];
  leadMagnetIdea: string;
  growthRoadmap: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
};

type BrandProfile = {
  businessName: string;
  industry: string;
  businessType: string;
  website: string;
  location: string;
  audience: string;
  offer: string;
  productService: string;
  priceRange: string;
  competitors: string;
  tone: string;
  language: string;
  goals: string;
  objections: string;
  brandVoice: string;
  bannedWords: string;
  rawBusinessDescription?: string;
  icp?: ICPData;
  gtm?: GTMData;
};

const defaultProfile: BrandProfile = {
  businessName: '',
  industry: '',
  businessType: 'SaaS',
  website: '',
  location: '',
  audience: '',
  offer: '',
  productService: '',
  priceRange: '',
  competitors: '',
  tone: 'Expert, practical, confident',
  language: 'English',
  goals: '',
  objections: '',
  brandVoice: '',
  bannedWords: '',
  rawBusinessDescription: '',
};

const fields: Array<{
  key: keyof Omit<BrandProfile, 'rawBusinessDescription' | 'icp' | 'gtm'>;
  label: string;
  placeholder: string;
  type?: 'input' | 'textarea' | 'select';
  options?: string[];
}> = [
  { key: 'businessName', label: 'Business Name', placeholder: 'Example: Najmol Growth Studio' },
  { key: 'industry', label: 'Industry', placeholder: 'Ecommerce, B2B SaaS, IT service, education, local business' },
  { key: 'businessType', label: 'Business Type', placeholder: 'Select business model', type: 'select', options: ['SaaS', 'Ecommerce', 'B2B', 'B2C', 'IT Service', 'Education', 'Agency', 'Local Service', 'Creator Business', 'Other'] },
  { key: 'website', label: 'Website', placeholder: 'https://example.com' },
  { key: 'location', label: 'Market / Location', placeholder: 'Bangladesh, USA, global English market' },
  { key: 'language', label: 'Default Language', placeholder: 'Select language', type: 'select', options: ['English', 'Bengali', 'Banglish'] },
  { key: 'audience', label: 'Target Audience', placeholder: 'Who buys? Include role, pain, awareness level, budget, and urgency.', type: 'textarea' },
  { key: 'productService', label: 'Product / Service', placeholder: 'What do you sell? What is included?', type: 'textarea' },
  { key: 'offer', label: 'Core Offer', placeholder: 'Main promise, guarantee, discount, free trial, consultation, or package.', type: 'textarea' },
  { key: 'priceRange', label: 'Price Range', placeholder: '$29/mo, 15,000 BDT package, custom quote' },
  { key: 'competitors', label: 'Competitors / Alternatives', placeholder: 'Direct competitors, manual workflow, agencies, freelancers', type: 'textarea' },
  { key: 'goals', label: 'Business Goals', placeholder: 'More demos, sales, leads, retention, content authority, launch demand', type: 'textarea' },
  { key: 'objections', label: 'Buyer Objections', placeholder: 'Too expensive, no trust, no time, tried before, not urgent', type: 'textarea' },
  { key: 'tone', label: 'Tone', placeholder: 'Expert, friendly, direct, premium, founder-led' },
  { key: 'brandVoice', label: 'Brand Voice Notes', placeholder: 'Words, beliefs, examples, story, personality, proof style', type: 'textarea' },
  { key: 'bannedWords', label: 'Avoid These', placeholder: 'AI-ish phrases, claims, competitor names, words you dislike', type: 'textarea' },
];

export default function BrandBrainPage() {
  const [profile, setProfile] = useState<BrandProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'cloud' | 'syncing' | 'error'>('local');

  // AI Auto-Fill & Ingestion state
  const [rawInput, setRawInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'icp' | 'gtm'>('profile');

  // Voice Recording / Speech-to-Text state (Bangla, Banglish, English)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    try {
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as Partial<BrandProfile>;
        setProfile({ ...defaultProfile, ...parsed });
        if (parsed.rawBusinessDescription) {
          setRawInput(parsed.rawBusinessDescription);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    async function loadCloudProfile() {
      if (!isSupabaseConfigured()) return;
      try {
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const response = await fetch('/api/brand-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (cancelled || !response.ok || !payload.success || !payload.profile) return;

        const cloudProfile = { ...defaultProfile, ...payload.profile as Partial<BrandProfile> };
        setProfile(cloudProfile);
        if (cloudProfile.rawBusinessDescription) {
          setRawInput(cloudProfile.rawBusinessDescription);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProfile));
        setSyncStatus('cloud');
      } catch {
        if (!cancelled) setSyncStatus('local');
      }
    }

    loadCloudProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const coreFieldsFilledCount = fields.filter(f => {
    const val = profile[f.key];
    return typeof val === 'string' && val.trim().length > 0;
  }).length;

  const hasIcp = Boolean(profile.icp?.personaName);
  const hasGtm = Boolean(profile.gtm?.coreHook);

  const totalPoints = fields.length + 2; // fields + ICP + GTM
  const currentPoints = coreFieldsFilledCount + (hasIcp ? 1 : 0) + (hasGtm ? 1 : 0);
  const completion = Math.min(100, Math.round((currentPoints / totalPoints) * 100));

  const updateField = (key: keyof BrandProfile, value: any) => {
    setProfile(current => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const updateIcpField = (key: keyof ICPData, value: any) => {
    setProfile(current => ({
      ...current,
      icp: {
        ...(current.icp || {
          personaName: '',
          roleAndContext: '',
          primaryPains: [],
          dreamOutcome: '',
          purchasingTriggers: '',
          keyObjections: [],
        }),
        [key]: value,
      },
    }));
    setSaved(false);
  };

  const updateGtmField = (key: keyof GTMData, value: any) => {
    setProfile(current => ({
      ...current,
      gtm: {
        ...(current.gtm || {
          coreHook: '',
          recommendedChannels: [],
          leadMagnetIdea: '',
          growthRoadmap: { phase1: '', phase2: '', phase3: '' },
        }),
        [key]: value,
      },
    }));
    setSaved(false);
  };

  // Trigger AI Auto-Fill Analysis
  const handleAiAutoFill = async () => {
    if (!rawInput.trim() || rawInput.trim().length < 5) {
      setAiErrorMsg('Please describe your business with at least a sentence or few keywords.');
      return;
    }

    setIsAnalyzing(true);
    setAiErrorMsg('');
    setAiSuccessMsg(false);

    try {
      const res = await fetch('/api/brand-profile/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDescription: rawInput }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Failed to auto-fill brand profile.');
      }

      const { profile: generatedProfile, icp: generatedIcp, gtm: generatedGtm } = payload.data;

      const mergedProfile: BrandProfile = {
        ...profile,
        ...generatedProfile,
        rawBusinessDescription: rawInput,
        icp: generatedIcp,
        gtm: generatedGtm,
      };

      setProfile(mergedProfile);
      setAiSuccessMsg(true);

      // Auto-save so user doesn't lose data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedProfile));
      syncToCloud(mergedProfile);

      setTimeout(() => setAiSuccessMsg(false), 5000);
    } catch (err: any) {
      setAiErrorMsg(err.message || 'Something went wrong while generating brand details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        setVoiceErrorMsg('Microphone access was denied. Please allow microphone permission in your browser.');
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
              setRawInput(prev => {
                const cleanedPrev = prev.trim();
                return cleanedPrev ? `${cleanedPrev}\n\n${transcribedText}` : transcribedText;
              });
              setVoiceSuccessMsg('Voice transcribed accurately! You can speak more or click Generate.');
              setTimeout(() => setVoiceSuccessMsg(''), 6000);
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

  const syncToCloud = async (profileToSync: BrandProfile) => {
    if (!isSupabaseConfigured()) return;
    try {
      setSyncStatus('syncing');
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/brand-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile: profileToSync }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Cloud sync failed.');
      setSyncStatus('cloud');
    } catch {
      setSyncStatus('error');
    }
  };

  const saveProfile = async () => {
    const profileToSave: BrandProfile = {
      ...profile,
      rawBusinessDescription: rawInput,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profileToSave));
    setSaved(true);
    setSyncStatus('local');

    await syncToCloud(profileToSave);
    setTimeout(() => setSaved(false), 2500);
  };

  // Sample prompt templates to inspire user
  const samplePrompts = [
    {
      label: 'SaaS Startup',
      text: 'We built an AI social media scheduling & analytics tool for small agencies. Price is $49/mo. Our main competitor is Buffer/Hootsuite. We solve slow manual posting and lack of automated hashtag insights.',
    },
    {
      label: 'Ecommerce Store',
      text: 'We run an online organic skincare and hair oil brand based in Dhaka. Products range from 800 BDT to 2,500 BDT. Women aged 20-35 buy from us. Our biggest issue is high ad spend and trust in authentic ingredients.',
    },
    {
      label: 'B2B Digital Agency',
      text: 'Performance marketing and SEO agency helping US ecommerce brands scale from $50k to $200k/mo. Retainer is $2,500/month. We guarantee ROAS improvement and full attribution tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkspaceHeader
        title="Brand Brain"
        crumbs={[{ label: 'Growth', href: '/dashboard' }]}
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Cloud size={13} />
              {syncStatus === 'cloud' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Saved locally'}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-[#FF5533] transition-all" style={{ width: `${completion}%` }} />
              </span>
              <span className="font-medium tabular-nums text-foreground">{completion}%</span>
            </span>
          </div>
        }
      />
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Panel
          title="Describe your business"
          actions={
            <>
              {samplePrompts.map((s, idx) => (
                <button key={idx} type="button" onClick={() => setRawInput(s.text)} className={ui.btnGhost}>
                  {s.label}
                </button>
              ))}
            </>
          }
          bodyClassName="space-y-3"
        >
          <div className="relative">
            <textarea
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              rows={5}
              placeholder="What you sell, price range, who buys it, and your biggest challenge. English, Bangla or Banglish."
              className={`${ui.textarea} pb-12`}
            />
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
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
              {rawInput && !isRecording && (
                <button type="button" onClick={() => setRawInput('')} className={ui.btnGhost}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {voiceSuccessMsg && <Notice tone="success">{voiceSuccessMsg}</Notice>}
          {voiceErrorMsg && <Notice>{voiceErrorMsg}</Notice>}
          {aiErrorMsg && <Notice>{aiErrorMsg}</Notice>}
          {aiSuccessMsg && <Notice tone="success">Profile, ICP and GTM strategy generated. Review them below.</Notice>}

          <div className="flex justify-end">
            <button type="button" onClick={handleAiAutoFill} disabled={isAnalyzing} className={ui.btnPrimary}>
              {isAnalyzing ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {isAnalyzing ? 'Analyzing…' : 'Build with AI'}
            </button>
          </div>
        </Panel>

        {/* NAVIGATION TABS FOR BRAIN SECTIONS */}
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
          {[
            { id: 'profile', label: 'Profile', icon: Brain, count: `${coreFieldsFilledCount}/16` },
            { id: 'icp', label: 'Customer (ICP)', icon: Target, badge: profile.icp?.personaName ? 'Ready' : 'Draft' },
            { id: 'gtm', label: 'Go-to-market', icon: Rocket, badge: profile.gtm?.coreHook ? 'Ready' : 'Draft' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex h-9 items-center gap-2 px-3.5 rounded-xl font-medium text-[13px] whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#FF5533] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.count && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 text-white font-mono">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SECTION 1: CORE BRAND PROFILE (THE 16 EDITABLE FIELDS) */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain size={16} className="text-[#FF5533]" />
                  Core Brand Parameters
                </h3>
              </div>
              <span className="text-xs text-white/40 font-mono">
                {coreFieldsFilledCount} of {fields.length} configured
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {fields.map(field => (
                <div key={field.key} className={field.type === 'textarea' ? 'lg:col-span-2' : ''}>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                    >
                      {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                    />
                  ) : (
                    <input
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: IDEAL CUSTOMER PROFILE (ICP) */}
        {activeTab === 'icp' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-violet-950/30 to-purple-950/20 border border-violet-500/20 p-5 rounded-2xl">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 block mb-1">
                  Target Audience Blueprint
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Target size={18} className="text-violet-400" />
                  Ideal Customer Profile (ICP)
                </h3>
                <p className="text-xs text-white/50 max-w-2xl mt-1">
                  Understanding your dream buyer's exact daily reality, primary emotional pains, and buying triggers gives your copy 10x higher conversion rates.
                </p>
              </div>

              {!profile.icp?.personaName && (
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Wand2 size={14} />
                  <span>Generate ICP with AI</span>
                </button>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Persona Name & Role */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-violet-300">
                  Target Buyer Persona
                </label>
                <input
                  value={profile.icp?.personaName || ''}
                  onChange={e => updateIcpField('personaName', e.target.value)}
                  placeholder="e.g. Scaling Ecommerce Founder, Head of Marketing, Working Professional"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
                />
              </div>

              {/* Dream Outcome */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Desired Dream Outcome
                </label>
                <input
                  value={profile.icp?.dreamOutcome || ''}
                  onChange={e => updateIcpField('dreamOutcome', e.target.value)}
                  placeholder="e.g. 3x revenue in 90 days with reliable automated lead flow"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {/* Daily Reality / Context */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Daily Context & Frustrations
                </label>
                <textarea
                  value={profile.icp?.roleAndContext || ''}
                  onChange={e => updateIcpField('roleAndContext', e.target.value)}
                  rows={3}
                  placeholder="What is their daily routine? What makes them feel stressed or overwhelmed before discovering your solution?"
                  className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-white outline-none focus:border-violet-500"
                />
              </div>

              {/* Primary Pains */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-rose-400">
                  Core Pain Points (One per line)
                </label>
                <textarea
                  value={(profile.icp?.primaryPains || []).join('\n')}
                  onChange={e => updateIcpField('primaryPains', e.target.value.split('\n').filter(Boolean))}
                  rows={4}
                  placeholder="Wasting thousands on bad marketing&#10;Slow manual client communication&#10;No predictable system to acquire new customers"
                  className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-rose-500"
                />
              </div>

              {/* Purchasing Triggers */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  Purchasing Triggers (Why buy now?)
                </label>
                <textarea
                  value={profile.icp?.purchasingTriggers || ''}
                  onChange={e => updateIcpField('purchasingTriggers', e.target.value)}
                  rows={3}
                  placeholder="What event or deadline forces them to make a buying decision immediately?"
                  className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* Key Objections & Counter-Reframes */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                  Top Objections & Reframe (One per line)
                </label>
                <textarea
                  value={(profile.icp?.keyObjections || []).join('\n')}
                  onChange={e => updateIcpField('keyObjections', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="Too expensive? -> Show ROI breakdown&#10;Will it work for me? -> Show case studies"
                  className="w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: GO-TO-MARKET (GTM) STRATEGY */}
        {activeTab === 'gtm' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-500/20 p-5 rounded-2xl">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                  Growth & Customer Acquisition Engine
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Rocket size={18} className="text-emerald-400" />
                  Go-To-Market (GTM) Strategy
                </h3>
                <p className="text-xs text-white/50 max-w-2xl mt-1">
                  The actionable playbook to attract, convert, and scale customers for your specific offer.
                </p>
              </div>

              {!profile.gtm?.coreHook && (
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Wand2 size={14} />
                  <span>Generate GTM with AI</span>
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Core Positioning Hook */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#FF5533]">
                  Core Positioning Statement / Hook
                </label>
                <textarea
                  value={profile.gtm?.coreHook || ''}
                  onChange={e => updateGtmField('coreHook', e.target.value)}
                  rows={2}
                  placeholder="Helping [Audience] achieve [Dream Outcome] without [Painful Mechanism] in [Timeframe]."
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#FF5533]"
                />
              </div>

              {/* Recommended Acquisition Channels */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Recommended Acquisition Channels (One per line)
                </label>
                <textarea
                  value={(profile.gtm?.recommendedChannels || []).join('\n')}
                  onChange={e => updateGtmField('recommendedChannels', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="High-intent SEO & Blog Strategy&#10;Cold Email & LinkedIn Outreach&#10;Shorts/Reels Organic Funnel"
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Lead Magnet Idea */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  High-Converting Lead Magnet / Entry Offer
                </label>
                <input
                  value={profile.gtm?.leadMagnetIdea || ''}
                  onChange={e => updateGtmField('leadMagnetIdea', e.target.value)}
                  placeholder="e.g. Free 15-Minute Funnel Audit, 30-Day Content Matrix Template, Calculator Sheet"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* 30-Day Growth Roadmap */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#FF5533]" />
                  30-Day Growth Execution Roadmap
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phase 1 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
                      Phase 1 (Days 1-10)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase1 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase1: e.target.value })}
                      rows={3}
                      placeholder="Offer clarity & validation"
                      className="w-full resize-y rounded-lg border border-border bg-background p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Phase 2 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                      Phase 2 (Days 11-20)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase2 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase2: e.target.value })}
                      rows={3}
                      placeholder="Channel launch & outbound pipeline"
                      className="w-full resize-y rounded-lg border border-border bg-background p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Phase 3 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                      Phase 3 (Days 21-30)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase3 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase3: e.target.value })}
                      rows={3}
                      placeholder="Conversion optimization & scaling"
                      className="w-full resize-y rounded-lg border border-border bg-background p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE & NAVIGATION BAR */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d0d12]/90 backdrop-blur-xl border border-border ">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Brand parameters sync automatically across your growth and content workspaces.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={saveProfile}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-6 py-3.5 text-xs sm:text-sm font-semibold text-white transition hover:brightness-110"
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? 'Saved to Brand Brain' : 'Save Brand Brain'}
            </button>

            <Link
              href="/dashboard/marketing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.04] px-4 py-3.5 text-xs sm:text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <span>Marketing Suite</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
