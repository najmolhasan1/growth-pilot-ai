'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Edit3
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
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#FF5533]">
              <Brain size={12} /> Real Business Context Engine
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Brand <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">Brain & Strategy Hub</span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-white/50">
              One central memory for your business. Describe what you sell in your own words, and AI will extract all brand parameters, build your Ideal Customer Profile (ICP), and formulate your Go-To-Market (GTM) plan.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 self-start lg:self-auto backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Brain Completeness</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 w-36 overflow-hidden rounded-full bg-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#FF4D42] to-[#FF8A00] transition-all duration-500" 
                  style={{ width: `${completion}%` }} 
                />
              </div>
              <span className="text-sm font-black text-white">{completion}%</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-white/40">
              <Cloud size={13} />
              {syncStatus === 'cloud' ? 'Synced to Cloud' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Saved locally (cloud sync retry)' : 'Saved locally'}
            </p>
          </div>
        </div>

        {/* 🌟 SMART AI BUSINESS INGESTION HUB ("TELL ABOUT YOUR BUSINESS") */}
        <div className="relative overflow-hidden rounded-3xl border border-[#FF5533]/30 bg-gradient-to-br from-[#0e0a0d] via-[#140e14] to-[#0a0a0f] p-5 sm:p-7 shadow-2xl shadow-[#FF5533]/5">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5533]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#FF4D42] to-[#FF8A00] flex items-center justify-center text-white shadow-md">
                  <Wand2 size={16} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Tell AI About Your Business
                  </h2>
                  <p className="text-xs text-white/45">
                    Write in plain English, Bangla, or Banglish. AI will structure everything, create your ICP, and formulate your GTM strategy.
                  </p>
                </div>
              </div>

              {/* Sample Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-white/30 hidden md:inline">Quick Samples:</span>
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawInput(s.text)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              rows={4}
              placeholder="Example: We run an online organic skincare shop in Dhaka. We sell natural hair oils and aloe serums priced between 600 - 1800 BDT. Target audience is working women and students who care about natural ingredients. Our biggest challenge is competing against cheap chemical brands and building authentic trust..."
              className="w-full resize-y rounded-2xl border border-white/10 bg-[#070709] px-4 py-3.5 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533] focus:ring-2 focus:ring-[#FF5533]/20"
            />

            {aiErrorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                <AlertCircle size={15} className="shrink-0" />
                <span>{aiErrorMsg}</span>
              </div>
            )}

            {aiSuccessMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>AI has structured your business! Your Core Profile, ICP, and GTM strategy have been generated and saved below. Review and edit any field as needed.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#FF5533]" />
                Auto-generates 16 Core Fields + Ideal Customer Profile + GTM Playbook.
              </p>

              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-[#FF5533]/25 transition hover:brightness-110 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing & Structuring...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Generate Brand Brain with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS FOR BRAIN SECTIONS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto">
          {[
            { id: 'profile', label: '1. Core Brand Profile (16 Fields)', icon: Brain, count: `${coreFieldsFilledCount}/16` },
            { id: 'icp', label: '2. Ideal Customer Profile (ICP)', icon: Target, badge: profile.icp?.personaName ? 'Ready' : 'AI Suggested' },
            { id: 'gtm', label: '3. Go-To-Market (GTM) Strategy', icon: Rocket, badge: profile.gtm?.coreHook ? 'Ready' : 'AI Suggested' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#FF5533] text-white shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
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
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
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
                <p className="text-xs text-white/40">
                  You can freely modify any value. Changes are automatically fed into the Marketing Suite & SEO generators.
                </p>
              </div>
              <span className="text-xs text-white/40 font-mono">
                {coreFieldsFilledCount} of {fields.length} configured
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {fields.map(field => (
                <div key={field.key} className={field.type === 'textarea' ? 'lg:col-span-2' : ''}>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm text-white outline-none transition-all focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                    >
                      {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                    />
                  ) : (
                    <input
                      value={profile[field.key] as string}
                      onChange={event => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
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
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-400 block mb-1">
                  Target Audience Blueprint
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
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
                  className="w-full rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-violet-500"
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
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-rose-500"
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
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-amber-500"
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
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-cyan-500"
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
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                  Growth & Customer Acquisition Engine
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
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
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0d0d0f] space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#FF5533]">
                  Core Positioning Statement / Hook
                </label>
                <textarea
                  value={profile.gtm?.coreHook || ''}
                  onChange={e => updateGtmField('coreHook', e.target.value)}
                  rows={2}
                  placeholder="Helping [Audience] achieve [Dream Outcome] without [Painful Mechanism] in [Timeframe]."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#070709] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#FF5533]"
                />
              </div>

              {/* Recommended Acquisition Channels */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0d0d0f] space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Recommended Acquisition Channels (One per line)
                </label>
                <textarea
                  value={(profile.gtm?.recommendedChannels || []).join('\n')}
                  onChange={e => updateGtmField('recommendedChannels', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="High-intent SEO & Blog Strategy&#10;Cold Email & LinkedIn Outreach&#10;Shorts/Reels Organic Funnel"
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#070709] px-4 py-3 text-sm font-mono leading-relaxed text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Lead Magnet Idea */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0d0d0f] space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  High-Converting Lead Magnet / Entry Offer
                </label>
                <input
                  value={profile.gtm?.leadMagnetIdea || ''}
                  onChange={e => updateGtmField('leadMagnetIdea', e.target.value)}
                  placeholder="e.g. Free 15-Minute Funnel Audit, 30-Day Content Matrix Template, Calculator Sheet"
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* 30-Day Growth Roadmap */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0d0d0f] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#FF5533]" />
                  30-Day Growth Execution Roadmap
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phase 1 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
                      Phase 1 (Days 1-10)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase1 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase1: e.target.value })}
                      rows={3}
                      placeholder="Offer clarity & validation"
                      className="w-full resize-y rounded-lg border border-white/10 bg-[#030303] p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Phase 2 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                      Phase 2 (Days 11-20)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase2 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase2: e.target.value })}
                      rows={3}
                      placeholder="Channel launch & outbound pipeline"
                      className="w-full resize-y rounded-lg border border-white/10 bg-[#030303] p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Phase 3 */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                      Phase 3 (Days 21-30)
                    </span>
                    <textarea
                      value={profile.gtm?.growthRoadmap?.phase3 || ''}
                      onChange={e => updateGtmField('growthRoadmap', { ...(profile.gtm?.growthRoadmap || { phase1: '', phase2: '', phase3: '' }), phase3: e.target.value })}
                      rows={3}
                      placeholder="Conversion optimization & scaling"
                      className="w-full resize-y rounded-lg border border-white/10 bg-[#030303] p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE & NAVIGATION BAR */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Profile is automatically loaded across all 12+ AI marketing tools.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={saveProfile}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl shadow-[#FF5533]/25 transition hover:brightness-110"
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? 'Saved to Brand Brain' : 'Save Brand Brain'}
            </button>

            <Link
              href="/dashboard/marketing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-xs sm:text-sm font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
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
