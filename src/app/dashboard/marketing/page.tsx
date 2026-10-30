'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  Download,
  Loader2,
  Sparkles,
  Trash2,
  Library,
  CheckCircle2,
  Search,
  Zap,
  Layers,
  Flame,
  X,
  Target,
  Megaphone,
  FileText,
  Video,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  tools,
  BrandProfile,
  SavedAsset,
  ExportFormat,
  fileBaseName,
  downloadBlob,
  resultToText,
  resultToMarkdown,
  resultToHtml,
} from './marketingUtils';

const STORAGE_KEY = 'marketing_brand_profile';
const ASSET_STORAGE_KEY = 'marketing_saved_assets';

function MarketingHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({});
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Strategy' | 'Campaigns' | 'Content' | 'Conversion'>('All');

  const hasBrandBrain = Object.values(brandProfile).some(value => typeof value === 'string' && value.trim().length > 0);

  useEffect(() => {
    let cancelled = false;
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    try {
      if (savedProfile) {
        setBrandProfile(JSON.parse(savedProfile) as BrandProfile);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    try {
      const localAssets = JSON.parse(localStorage.getItem(ASSET_STORAGE_KEY) || '[]') as SavedAsset[];
      setSavedAssets(localAssets);
    } catch {
      localStorage.removeItem(ASSET_STORAGE_KEY);
    }

    async function loadCloudData() {
      if (!isSupabaseConfigured()) return;
      try {
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const [profileResponse, assetsResponse] = await Promise.all([
          fetch('/api/brand-profile', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/marketing-assets', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (cancelled) return;

        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          if (profilePayload.success && profilePayload.profile) {
            const profile = profilePayload.profile as BrandProfile;
            setBrandProfile(profile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          }
        }

        if (assetsResponse.ok) {
          const assetsPayload = await assetsResponse.json();
          if (assetsPayload.success && Array.isArray(assetsPayload.assets)) {
            const assets = assetsPayload.assets as SavedAsset[];
            setSavedAssets(assets);
            localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
          }
        }
      } catch {
        console.warn('Marketing cloud data sync failed; falling back to local client memory.');
      }
    }

    loadCloudData();
    return () => {
      cancelled = true;
    };
  }, []);

  const getAccessToken = async () => {
    if (!isSupabaseConfigured()) return null;
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    return data.session?.access_token || null;
  };

  const deleteAsset = async (id: string) => {
    const updated = savedAssets.filter(asset => asset.id !== id);
    setSavedAssets(updated);
    localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(updated));

    try {
      const token = await getAccessToken();
      if (!token || id.startsWith('local-')) return;
      await fetch('/api/marketing-assets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
    } catch {
      console.warn('Marketing asset cloud delete sync failed.');
    }
  };

  const downloadAsset = (asset: SavedAsset, format: ExportFormat) => {
    const base = fileBaseName(asset.title);
    if (format === 'txt') {
      downloadBlob(`${base}.txt`, resultToText(asset), 'text/plain;charset=utf-8');
      return;
    }
    if (format === 'md') {
      downloadBlob(`${base}.md`, resultToMarkdown(asset), 'text/markdown;charset=utf-8');
      return;
    }
    if (format === 'html') {
      downloadBlob(`${base}.html`, resultToHtml(asset), 'text/html;charset=utf-8');
      return;
    }
    downloadBlob(`${base}.json`, JSON.stringify(asset, null, 2), 'application/json;charset=utf-8');
  };

  // Filter tools based on selected category and live search query
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesCategory = selectedCategoryFilter === 'All' || tool.category === selectedCategoryFilter;
      if (!matchesCategory) return false;

      if (!toolSearchQuery.trim()) return true;
      const query = toolSearchQuery.toLowerCase();
      const matchLabel = tool.label.toLowerCase().includes(query);
      const matchDesc = tool.description.toLowerCase().includes(query);
      const matchCategory = tool.category.toLowerCase().includes(query);
      return matchLabel || matchDesc || matchCategory;
    });
  }, [selectedCategoryFilter, toolSearchQuery]);

  // Group filtered tools by category
  const toolsByCategory = useMemo(() => {
    return filteredTools.reduce<Record<string, typeof tools>>((groups, tool) => {
      groups[tool.category] = [...(groups[tool.category] || []), tool];
      return groups;
    }, {});
  }, [filteredTools]);

  // Filtered Assets based on Search query
  const filteredAssets = useMemo(() => {
    return savedAssets.filter(asset => {
      if (!assetSearchQuery.trim()) return true;
      const query = assetSearchQuery.toLowerCase();
      const titleMatch = asset.title.toLowerCase().includes(query);
      const toolLabel = tools.find(t => t.id === asset.tool)?.label || '';
      const toolMatch = toolLabel.toLowerCase().includes(query);
      return titleMatch || toolMatch;
    });
  }, [savedAssets, assetSearchQuery]);

  const categories = [
    { id: 'All', label: 'All Engines', count: tools.length },
    { id: 'Strategy', label: 'Strategy', count: tools.filter(t => t.category === 'Strategy').length },
    { id: 'Campaigns', label: 'Campaigns', count: tools.filter(t => t.category === 'Campaigns').length },
    { id: 'Content', label: 'Content', count: tools.filter(t => t.category === 'Content').length },
    { id: 'Conversion', label: 'Conversion', count: tools.filter(t => t.category === 'Conversion').length },
  ] as const;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Workspace Breadcrumbs & Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white/40">
            <span>Growth Suite</span>
            <span className="text-white/20">/</span>
            <span className="text-white/80 font-black">All Marketing Tools</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#library"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-white/60 hover:text-white transition cursor-pointer"
            >
              <Library size={13} className="text-[#FF7A45]" />
              <span>Asset Library ({savedAssets.length})</span>
            </a>
          </div>
        </div>

        {/* Clean Hero Header */}
        <div className="mb-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#FF4D42]/15 via-[#FF8526]/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute left-10 -bottom-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5533]">
                <Sparkles size={11} />
                <span>40-Year Veteran CMO Growth Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Growth <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">Tools</span>
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm leading-6 text-white/60 max-w-2xl">
                Battle-tested marketing engines engineered for Bangladeshi <span className="text-white font-bold">F-Commerce (COD)</span>, <span className="text-white font-bold">D2C Ecommerce</span>, and <span className="text-white font-bold">B2B Agencies</span>. High-converting Meta Ad copies, Messenger closing scripts, and 4-phase launch systems.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/dashboard/brand"
                className={`inline-flex items-center justify-between sm:justify-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-black transition border shadow-lg ${
                  hasBrandBrain
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-orange-500/30 bg-orange-500/10 text-[#FF7A45] hover:bg-orange-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain size={15} />
                  <span>{hasBrandBrain ? `Brand: ${brandProfile.businessName || 'Configured'}` : 'Configure Brand Brain'}</span>
                </div>
                {hasBrandBrain ? <CheckCircle2 size={14} className="text-emerald-400" /> : <ChevronRight size={14} />}
              </Link>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35 block">Workspaces</span>
              <span className="text-base font-black text-white mt-0.5 block">{tools.length} Specialized Engines</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35 block">Target Archetypes</span>
              <span className="text-base font-black text-white mt-0.5 block">F-Com • D2C • B2B</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35 block">Voice Typing</span>
              <span className="text-base font-black text-emerald-400 mt-0.5 block">Bangla • Banglish • EN</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/35 block">Saved Outputs</span>
              <span className="text-base font-black text-orange-400 mt-0.5 block">{savedAssets.length} Assets in Cloud</span>
            </div>
          </div>
        </div>

        {/* Clean Interactive Toolbar: Category Segmented Pills & Instant Search */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0d0d0f] p-3 rounded-2xl border border-white/10 shadow-lg">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => {
              const isActive = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white shadow-md shadow-[#FF5533]/25'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Tool Search Bar */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              placeholder="Search tools by name or goal..."
              value={toolSearchQuery}
              onChange={e => setToolSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#030303] pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20 transition"
            />
            {toolSearchQuery && (
              <button
                type="button"
                onClick={() => setToolSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tools Catalog Categorized */}
        <div className="space-y-10">
          {Object.keys(toolsByCategory).length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#0d0d0f]/50 p-12 text-center">
              <Search size={32} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-base font-black text-white">No Growth Tools Found</h3>
              <p className="mt-1 text-xs text-white/40">
                No tools matched your search "{toolSearchQuery}". Try clearing the search or choosing another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setToolSearchQuery('');
                  setSelectedCategoryFilter('All');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            Object.entries(toolsByCategory).map(([category, categoryTools]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-3 rounded-full bg-[#FF5533]" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">{category}</h3>
                  <span className="text-[10px] text-white/30 font-bold">({categoryTools.length})</span>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {categoryTools.map(tool => {
                    const IconComponent = tool.icon;
                    return (
                      <Link
                        key={tool.id}
                        href={`/dashboard/marketing/${tool.id}`}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0d0f] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#FF5533]/50 hover:shadow-[0_12px_30px_rgba(255,85,51,0.12)] overflow-hidden text-left"
                      >
                        {/* Top specular hairline */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#FF6A3D]/70 transition-all duration-300" />

                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-[#FF5533] transition-transform duration-200 group-hover:scale-105">
                              <IconComponent size={20} />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/40 border border-white/[0.06]">
                                {tool.category}
                              </span>
                              {tool.featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 text-[#FF7A45] border border-orange-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                  Core
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-base font-black text-white group-hover:text-[#FF7A45] transition-colors">
                            {tool.label}
                          </h4>
                          <p className="mt-2 text-xs leading-5 text-white/50 line-clamp-2">
                            {tool.description}
                          </p>

                          {/* Quick features pill preview */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {tool.id === 'launch_pack' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Landing Hero</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Meta Ads</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Email Sequence</span>
                              </>
                            )}
                            {tool.id === 'strategy_audit' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">ICP Diagnosis</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Funnel Gaps</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">7-Day Action Plan</span>
                              </>
                            )}
                            {tool.id === 'social_campaign' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Meta Copy</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Closing Scripts</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">UGC Hooks</span>
                              </>
                            )}
                            {tool.id === 'product_photography' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">AI Image Generator</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Shot List</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Visual Prompts</span>
                              </>
                            )}
                            {tool.id === 'campaign_planner' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">30-Day Calendar</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">4 Content Pillars</span>
                              </>
                            )}
                            {tool.id === 'product_copy' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Sales Hook</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Feature-to-Benefit</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">COD Guarantee</span>
                              </>
                            )}
                            {tool.id === 'email_campaign' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Execution Studio</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">SMTP Send</span>
                              </>
                            )}
                            {tool.id === 'sms_campaign' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">160 Char GSM</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Flash Urgency</span>
                              </>
                            )}
                            {tool.id === 'landing_page' && (
                              <>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Hero & Flow</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 border border-white/5">Objection Crusher</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">
                            Open Studio
                          </span>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition-all group-hover:border-[#FF5533]/50 group-hover:bg-[#FF5533] group-hover:text-white group-hover:translate-x-0.5">
                            <ArrowRight size={13} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global Asset Library at Bottom */}
        <div id="library" className="mt-16 rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF5533]">
                <Library size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Asset Library</p>
                <h2 className="mt-0.5 text-xl font-black text-white">Saved Campaigns & Copies</h2>
              </div>
            </div>

            {/* Search saved assets */}
            <div className="relative w-full max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search saved outputs..."
                value={assetSearchQuery}
                onChange={e => setAssetSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#030303] pl-8 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FF5533]/50 focus:ring-1 focus:ring-[#FF5533]/20"
              />
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#030303]/60 p-8 text-center">
              <Library size={26} className="text-white/20 mb-2" />
              <p className="text-xs text-white/40 font-medium">
                {assetSearchQuery
                  ? 'No saved assets matched your search query.'
                  : 'You have not saved any marketing outputs yet. Generate any campaign above to save drafts.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAssets.map(asset => {
                const toolConfig = tools.find(t => t.id === asset.tool);
                return (
                  <div
                    key={asset.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-lg hover:border-white/20 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="rounded-full bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FF7A45]">
                          {toolConfig?.label || asset.tool}
                        </span>
                        <span className="text-[10px] text-white/35 flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-sm font-black text-white">{asset.title}</h4>
                      <p className="mt-1 text-[11px] text-white/40">Language: <span className="text-white/70">{asset.language}</span></p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                      <Link
                        href={`/dashboard/marketing/${asset.tool}?loadAssetId=${asset.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF5533]/15 hover:bg-[#FF5533]/30 px-3 py-2 text-xs font-black text-[#FF7A45] transition cursor-pointer"
                      >
                        <span>Open in Studio</span>
                        <ArrowRight size={12} />
                      </Link>
                      <div className="flex gap-1.5">
                        {(['md', 'txt'] as const).map(format => (
                          <button
                            key={format}
                            onClick={() => downloadAsset(asset, format)}
                            className="rounded-xl bg-white/5 px-2.5 py-2 text-[10px] font-black uppercase text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            title={`Download as .${format}`}
                          >
                            {format}
                          </button>
                        ))}
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="rounded-xl bg-red-500/10 px-2.5 py-2 text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                          aria-label={`Delete ${asset.title}`}
                          title="Delete draft"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketingHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303] p-8 text-white/40 flex items-center justify-center">Loading marketing workspace...</div>}>
      <MarketingHubContent />
    </Suspense>
  );
}
