'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Brain, Download, Loader2, Sparkles, Trash2, Library, CheckCircle } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Strategy' | 'Campaigns' | 'Content' | 'Conversion'>('All');

  const hasBrandBrain = Object.values(brandProfile).some(value => value.trim().length > 0);

  // Group tools by category for structured display
  const toolsByCategory = useMemo(() => {
    return tools.reduce<Record<string, typeof tools>>((groups, tool) => {
      groups[tool.category] = [...(groups[tool.category] || []), tool];
      return groups;
    }, {});
  }, []);

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

  // Filtered Assets based on Search query
  const filteredAssets = useMemo(() => {
    return savedAssets.filter(asset => {
      const titleMatch = asset.title.toLowerCase().includes(searchQuery.toLowerCase());
      const toolLabel = tools.find(t => t.id === asset.tool)?.label || '';
      const toolMatch = toolLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || toolMatch;
    });
  }, [savedAssets, searchQuery]);

  return (
    <div className="min-h-screen bg-[#030712] p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Workspace Title Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">
              <Sparkles size={12} /> MVP Growth Workspace
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Marketing <span className="bg-gradient-to-r from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Suite</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Select any growth workflow to launch its dedicated workspace. Brand Brain is shared across all tools to guarantee on-brand execution.
            </p>
          </div>
          <Link
            href="/dashboard/brand"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Brain size={16} /> {hasBrandBrain ? 'Edit Brand Brain' : 'Create Brand Brain'} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Dashboard Grid Catalog Categorized */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Growth Workspaces</h2>
            <div className="flex gap-2">
              {(['All', 'Strategy', 'Campaigns', 'Content', 'Conversion'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(toolsByCategory)
              .filter(([category]) => selectedCategoryFilter === 'All' || selectedCategoryFilter === category)
              .map(([category, categoryTools]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-1">{category}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map(tool => {
                      const IconComponent = tool.icon;
                      return (
                        <Link
                          key={tool.id}
                          href={`/dashboard/marketing/${tool.id}`}
                          className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover-glow-card transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] text-left"
                        >
                          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-350 shadow-md">
                            <IconComponent size={20} />
                          </div>
                          {tool.featured && (
                            <span className="absolute right-6 top-6 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-350 border border-indigo-500/10">
                              Core
                            </span>
                          )}
                          <h4 className="text-base font-black text-white group-hover:text-fuchsia-200 transition-colors">
                            {tool.label}
                          </h4>
                          <p className="mt-2 text-xs leading-relaxed text-white/40 group-hover:text-white/50 transition-colors">
                            {tool.description}
                          </p>
                          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-fuchsia-300/80 group-hover:text-fuchsia-250 transition-colors">
                            Launch workspace <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Global Asset Library at Bottom */}
        <div id="library" className="mt-16 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <Library size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Asset Library</p>
                <h2 className="mt-0.5 text-xl font-black text-white">Saved Campaigns & Copies</h2>
              </div>
            </div>
            {/* Search inputs */}
            <input
              type="text"
              placeholder="Search by title or tool..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0d1117] px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400/50"
            />
          </div>

          {filteredAssets.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d1117]/30 p-8 text-center">
              <p className="text-sm text-white/35">
                {searchQuery ? 'No matching assets found.' : 'You have not saved any marketing outputs yet. Generate some tools to see history.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAssets.map(asset => {
                const toolConfig = tools.find(t => t.id === asset.tool);
                return (
                  <div key={asset.id} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d1117] p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-white/40">
                          {toolConfig?.label || asset.tool}
                        </span>
                        <span className="text-[10px] text-white/25">
                          {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h4 className="mt-2.5 line-clamp-1 text-sm font-black text-white">{asset.title}</h4>
                      <p className="mt-1 text-[11px] text-white/35">Language: {asset.language}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/marketing/${asset.tool}?loadAssetId=${asset.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-fuchsia-600/10 px-3.5 py-2 text-[11px] font-black text-fuchsia-300 transition hover:bg-fuchsia-600 hover:text-white"
                      >
                        Load Workspace <ArrowRight size={12} />
                      </Link>
                      <div className="flex gap-1.5">
                        {(['md', 'txt'] as const).map(format => (
                          <button
                            key={format}
                            onClick={() => downloadAsset(asset, format)}
                            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black uppercase text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
                          >
                            {format}
                          </button>
                        ))}
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="rounded-xl bg-red-500/10 px-3 py-2 text-red-300 hover:bg-red-500/20 cursor-pointer"
                          aria-label={`Delete ${asset.title}`}
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
    <Suspense fallback={<div className="min-h-screen bg-[#030712] p-8 text-white/40 flex items-center justify-center">Loading marketing workspace...</div>}>
      <MarketingHubContent />
    </Suspense>
  );
}
