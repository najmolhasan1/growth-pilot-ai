'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, CheckCircle2, Cloud, Save, Sparkles } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEY = 'marketing_brand_profile';

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
};

const fields: Array<{
  key: keyof BrandProfile;
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

  useEffect(() => {
    let cancelled = false;
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    try {
      if (savedProfile) {
        // Hydrate browser-local brand context after client mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile({ ...defaultProfile, ...JSON.parse(savedProfile) as Partial<BrandProfile> });
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

  const completion = Math.round(
    (Object.values(profile).filter(value => value.trim().length > 0).length / Object.keys(profile).length) * 100
  );

  const updateField = (key: keyof BrandProfile, value: string) => {
    setProfile(current => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const saveProfile = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setSyncStatus('local');

    if (isSupabaseConfigured()) {
      try {
        setSyncStatus('syncing');
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Login session not found.');

        const response = await fetch('/api/brand-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Cloud sync failed.');
        setSyncStatus('cloud');
      } catch {
        setSyncStatus('error');
      }
    }

    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#030712] p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              <Brain size={12} /> Business Context Engine
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Brand <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">Brain</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Save your business, audience, offer, objections, and voice once. The Marketing Suite will use this context so outputs feel specific instead of generic.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Profile Strength</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-indigo-400" style={{ width: `${completion}%` }} />
              </div>
              <span className="text-sm font-black text-white">{completion}%</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-white/35">
              <Cloud size={13} />
              {syncStatus === 'cloud' ? 'Synced to account' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Saved locally, cloud sync failed' : 'Saved locally'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className={field.type === 'textarea' ? 'lg:col-span-2' : ''}>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={profile[field.key]}
                  onChange={event => updateField(field.key, event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-400/70"
                >
                  {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={profile[field.key]}
                  onChange={event => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/70"
                />
              ) : (
                <input
                  value={profile[field.key]}
                  onChange={event => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/70"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={saveProfile}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition hover:bg-indigo-500"
          >
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? 'Saved' : 'Save Brand Brain'}
          </button>
          <Link
            href="/dashboard/marketing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Sparkles size={18} /> Open Marketing Suite <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
