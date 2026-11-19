'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  Download,
  Library,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import { WorkspacePage, WorkspaceHeader, WorkspaceBody, Segmented, Panel, EmptyState, ui } from '@/components/workspace/ui';
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
    <WorkspacePage>
      <WorkspaceHeader
        title="Growth tools"
        actions={
          <>
            <a href="#library" className={ui.btnGhost}>
              <Library size={14} />
              <span className="hidden sm:inline">Library</span>
              <span className="text-muted-foreground">{savedAssets.length}</span>
            </a>
            <Link href="/dashboard/brand" className={ui.btnSecondary}>
              <Brain size={14} />
              <span className="hidden sm:inline max-w-[160px] truncate">
                {hasBrandBrain ? brandProfile.businessName || 'Brand Brain' : 'Set up Brand Brain'}
              </span>
              {hasBrandBrain && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </Link>
          </>
        }
      />

      <WorkspaceBody className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Segmented
            className="overflow-x-auto"
            options={categories.map(c => ({ id: c.id, label: c.id === 'All' ? 'All' : c.label }))}
            value={selectedCategoryFilter}
            onChange={id => setSelectedCategoryFilter(id)}
          />
          <div className="relative w-full md:w-72">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools"
              value={toolSearchQuery}
              onChange={e => setToolSearchQuery(e.target.value)}
              className={ui.inputIcon}
            />
            {toolSearchQuery && (
              <button
                type="button"
                onClick={() => setToolSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {Object.keys(toolsByCategory).length === 0 ? (
          <EmptyState
            icon={Search}
            title="No tools found"
            action={
              <button
                type="button"
                onClick={() => {
                  setToolSearchQuery('');
                  setSelectedCategoryFilter('All');
                }}
                className={ui.btnSecondary}
              >
                Reset filters
              </button>
            }
          />
        ) : (
          Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <section key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map(tool => {
                  const IconComponent = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={`/dashboard/marketing/${tool.id}`}
                      className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 transition hover:border-[#FF5533]/40"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition group-hover:bg-[#FF5533] group-hover:text-white">
                        <IconComponent size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</span>
                      </span>
                      <ArrowRight size={15} className="mt-1 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Asset library */}
        <section id="library" className="scroll-mt-20">
          <Panel
            title="Library"
            icon={Library}
            actions={
              <div className="relative w-56">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search saved"
                  value={assetSearchQuery}
                  onChange={e => setAssetSearchQuery(e.target.value)}
                  className={`${ui.inputIcon} h-8 pl-8 text-xs`}
                />
              </div>
            }
            bodyClassName="p-0"
          >
            {filteredAssets.length === 0 ? (
              <EmptyState
                icon={Library}
                title={assetSearchQuery ? 'No matches' : 'No saved outputs yet'}
                className="py-12"
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {filteredAssets.map(asset => {
                  const toolConfig = tools.find(t => t.id === asset.tool);
                  return (
                    <li key={asset.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                      <Link href={`/dashboard/marketing/${asset.tool}?loadAssetId=${asset.id}`} className="group min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-[#FF5533]">{asset.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {toolConfig?.label || asset.tool} · {asset.language}
                          {asset.createdAt ? ` · ${new Date(asset.createdAt).toLocaleDateString()}` : ''}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1">
                        {(['md', 'txt'] as const).map(format => (
                          <button key={format} onClick={() => downloadAsset(asset, format)} className={ui.btnGhost} title={`Download .${format}`}>
                            <Download size={13} /> {format}
                          </button>
                        ))}
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className={`${ui.btnGhost} hover:text-red-500`}
                          aria-label={`Delete ${asset.title}`}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </section>
      </WorkspaceBody>
    </WorkspacePage>
  );
}

export default function MarketingHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MarketingHubContent />
    </Suspense>
  );
}
