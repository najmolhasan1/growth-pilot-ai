'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Brain, Check, Copy, Download, Loader2, Megaphone, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import { fetchSystemConfig } from '@/lib/admin-config';
import {
  tools,
  defaultResult,
  BrandProfile,
  MarketingResult,
  SavedAsset,
  GeneratedProductImage,
  ExportFormat,
  fileBaseName,
  resultToText,
  resultToMarkdown,
  resultToHtml,
  downloadBlob,
} from '../marketingUtils';

const STORAGE_KEY = 'marketing_brand_profile';
const ASSET_STORAGE_KEY = 'marketing_saved_assets';

function ToolWorkspaceContent() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.tool as string;
  const searchParams = useSearchParams();

  const [brandProfile, setBrandProfile] = useState<BrandProfile>({});
  const [language, setLanguage] = useState('English');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<MarketingResult>(defaultResult);
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'local' | 'error'>('idle');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedProductImage[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');

  const activeTool = useMemo(() => tools.find(tool => tool.id === toolId), [toolId]);
  const hasBrandBrain = Object.values(brandProfile).some(value => value.trim().length > 0);

  // Filter saved assets for this tool specifically
  const toolSavedAssets = useMemo(() => {
    return savedAssets.filter(asset => asset.tool === toolId);
  }, [savedAssets, toolId]);

  // Load asset if query param loadAssetId is provided
  useEffect(() => {
    const loadAssetId = searchParams.get('loadAssetId');
    if (loadAssetId && savedAssets.length > 0) {
      const asset = savedAssets.find(item => item.id === loadAssetId);
      if (asset) {
        setLanguage(asset.language);
        setInputs(asset.inputs || {});
        setResult(asset.result);
      }
    }
  }, [searchParams, savedAssets]);

  // If tool is invalid, redirect back
  useEffect(() => {
    if (!activeTool) {
      router.replace('/dashboard/marketing');
    }
  }, [activeTool, router]);

  useEffect(() => {
    let cancelled = false;
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    try {
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as BrandProfile;
        setBrandProfile(parsed);
        setLanguage(parsed.language || 'English');
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
            setLanguage(profile.language || 'English');
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
        console.warn('Marketing cloud data unavailable; using browser-local data.');
      }
    }

    loadCloudData();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateInput = (key: string, value: string) => {
    setInputs(current => ({ ...current, [key]: value }));
  };

  const getAccessToken = async () => {
    if (!isSupabaseConfigured()) return null;
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    return data.session?.access_token || null;
  };

  const makeTitle = (id: string, requestInputs: Record<string, string>) => {
    const label = tools.find(tool => tool.id === id)?.label || 'Marketing Asset';
    const topic = requestInputs.launchName || requestInputs.campaignName || requestInputs.productName || requestInputs.topic || requestInputs.offer || requestInputs.product || requestInputs.pageGoal || requestInputs.sequenceType || requestInputs.sourceLink || requestInputs.goal || '';
    return topic ? `${label}: ${topic.slice(0, 70)}` : `${label}: ${new Date().toLocaleDateString()}`;
  };

  const persistAsset = async (asset: SavedAsset) => {
    const localAssets = [asset, ...savedAssets.filter(item => item.id !== asset.id)].slice(0, 100);
    setSavedAssets(localAssets);
    localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(localAssets));
    setSaveStatus('local');

    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/marketing-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(asset),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Asset cloud save failed.');

      const cloudAsset = payload.asset as SavedAsset;
      const syncedAssets = [cloudAsset, ...localAssets.filter(item => item.id !== asset.id)].slice(0, 100);
      setSavedAssets(syncedAssets);
      localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(syncedAssets));
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(defaultResult);

    // Enforce trial limit for marketing assets (dynamic config — synced from Admin Panel)
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
      let limitValue = 3;
      try {
        const sysConfig = await fetchSystemConfig();
        limitValue = sysConfig.trial_marketing_limit;
      } catch (e) {
        console.warn(e);
      }

      if (savedAssets.length >= limitValue) {
        setError(`Free Trial Asset Limit Reached: You have generated the maximum of ${limitValue} marketing outputs allowed in the trial. Upgrade to GrowthPilot Plus to write unlimited marketing assets!`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/marketing-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolId, language, brandProfile, inputs }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Marketing generation failed.');
      }

      const generatedResult = payload.data as MarketingResult;
      setResult(generatedResult);
      setGeneratedImages([]);
      setImageError('');

      const asset: SavedAsset = {
        id: `local-${Date.now()}`,
        tool: toolId,
        title: makeTitle(toolId, inputs),
        language,
        inputs,
        brandSnapshot: brandProfile,
        result: generatedResult,
        createdAt: new Date().toISOString(),
      };
      await persistAsset(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Marketing generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyBlock = async (key: string, text: string) => {
    const success = await copyTextSafely(text);
    if (!success) {
      setError('Copy permission was blocked by the browser. Please select and copy manually.');
      return;
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const fullOutput = [
    result.executiveSummary,
    result.strategy.join('\n'),
    result.primaryOutput,
    result.variations.join('\n'),
    result.nextBestActions.join('\n'),
  ].filter(Boolean).join('\n\n');

  const currentAsset = fullOutput ? {
    title: makeTitle(toolId, inputs),
    tool: toolId,
    language,
    inputs,
    result,
    createdAt: new Date().toISOString(),
  } : null;

  const downloadAsset = (asset: Pick<SavedAsset, 'title' | 'tool' | 'language' | 'inputs' | 'result' | 'createdAt'>, format: ExportFormat) => {
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

  const downloadGeneratedImage = (image: GeneratedProductImage) => {
    const extension = image.mimeType.includes('jpeg') ? 'jpg' : image.mimeType.includes('webp') ? 'webp' : 'png';
    const anchor = document.createElement('a');
    anchor.href = image.dataUrl;
    anchor.download = `${fileBaseName(`${makeTitle(toolId, inputs)}-${image.label}`)}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const generateProductImages = async () => {
    setImageLoading(true);
    setImageError('');
    setGeneratedImages([]);

    try {
      const response = await fetch('/api/marketing-suite/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          brandProfile,
          inputs,
          aspectRatio: imageAspectRatio,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Image generation failed.');
      }
      setGeneratedImages(payload.images as GeneratedProductImage[]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Image generation failed.');
    } finally {
      setImageLoading(false);
    }
  };

  const loadAsset = (asset: SavedAsset) => {
    setLanguage(asset.language);
    setInputs(asset.inputs || {});
    setResult(asset.result);
    setError('');
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
      console.warn('Marketing asset cloud delete failed.');
    }
  };

  if (!activeTool) {
    return (
      <div className="min-h-screen bg-[#030712] p-8 text-white/40 flex items-center justify-center">
        <Loader2 className="animate-spin text-fuchsia-400" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Back and Breadcrumbs Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard/marketing"
            className="inline-flex items-center gap-2 text-xs font-black text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Marketing Suite
          </Link>
          <div className="text-xs font-bold text-white/30">
            <span>Marketing Suite</span> <span className="mx-1.5">/</span> <span className="text-fuchsia-300">{activeTool.label}</span>
          </div>
        </div>

        {/* Workspace Title Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">
              {activeTool.category}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {activeTool.label}
            </h1>
            <p className="mt-2 max-w-2xl text-xs text-white/50">
              {activeTool.description} Brand Brain parameters are active.
            </p>
          </div>
          <Link
            href="/dashboard/brand"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Brain size={15} /> {hasBrandBrain ? 'Edit Brand Brain' : 'Create Brand Brain'} <ArrowRight size={13} />
          </Link>
        </div>

        {/* Form and Result Display Columns */}
        <div className="grid gap-6 xl:grid-cols-[420px,1fr] items-start">
          <div className="space-y-6">
            {/* Input Form Starts Directly at Top */}
            <form onSubmit={generate} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Parameters</p>
                  <h2 className="mt-0.5 text-base font-black text-white">Input Details</h2>
                </div>
                <select
                  value={language}
                  onChange={event => setLanguage(event.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option>English</option>
                  <option>Bengali</option>
                  <option>Banglish</option>
                </select>
              </div>

              <div className="space-y-4">
                {activeTool.fields.map(field => (
                  <div key={field.key}>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {field.label}
                    </label>
                    {field.textarea ? (
                      <textarea
                        value={inputs[field.key] || ''}
                        onChange={event => updateInput(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/70"
                      />
                    ) : (
                      <input
                        value={inputs[field.key] || ''}
                        onChange={event => updateInput(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/70"
                      />
                    )}
                  </div>
                ))}
              </div>

              {!hasBrandBrain && (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100/80">
                  Brand Brain context is empty. For stronger outputs, configure your brand context.
                </div>
              )}

              <button
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-fuchsia-500/20 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {loading ? 'Generating Expert Output...' : 'Generate Expert Output'}
              </button>
              {saveStatus !== 'idle' && (
                <p className="mt-3 text-center text-[11px] font-bold text-white/35">
                  {saveStatus === 'saved' ? 'Saved to cloud library.' : saveStatus === 'local' ? 'Saved locally.' : 'Saved locally, cloud sync error.'}
                </p>
              )}
            </form>

            {/* Focused Saved Outputs List For This Tool */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Tool History</p>
                  <h2 className="mt-0.5 text-base font-black text-white">Previous Drafts</h2>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/50">
                  {toolSavedAssets.length}
                </span>
              </div>

              {toolSavedAssets.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-[#0d1117] p-4 text-xs leading-5 text-white/35">
                  Saved outputs for {activeTool.label} will appear here.
                </p>
              ) : (
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                  {toolSavedAssets.map(asset => (
                    <div key={asset.id} className="rounded-2xl border border-white/10 bg-[#0d1117] p-4">
                      <button
                        type="button"
                        onClick={() => loadAsset(asset)}
                        className="block w-full text-left"
                      >
                        <h3 className="line-clamp-2 text-xs font-black text-white">{asset.title}</h3>
                        <p className="mt-1 text-[10px] text-white/35">
                          {asset.language} • {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : ''}
                        </p>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadAsset(asset)}
                          className="flex-1 rounded-xl bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-white/55 transition hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadAsset(asset, 'md')}
                          className="rounded-xl bg-indigo-500/10 px-2.5 py-1.5 text-indigo-250 hover:bg-indigo-500/20 cursor-pointer"
                          aria-label={`Download ${asset.title}`}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAsset(asset.id)}
                          className="rounded-xl bg-red-500/10 px-2.5 py-1.5 text-red-300 hover:bg-red-500/20 cursor-pointer"
                          aria-label={`Delete ${asset.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Workspace Panel */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Output</p>
                <h2 className="mt-0.5 flex items-center gap-2 text-xl font-black text-white">
                  <Megaphone size={20} className="text-fuchsia-300" /> Expert Draft Workspace
                </h2>
              </div>
              {fullOutput && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyBlock('all', fullOutput)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
                  >
                    {copied === 'all' ? <Check size={14} /> : <Copy size={14} />} {copied === 'all' ? 'Copied' : 'Copy All'}
                  </button>
                  {currentAsset && (
                    <>
                      {(['txt', 'md', 'html', 'json'] as ExportFormat[]).map(format => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => downloadAsset(currentAsset, format)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-black uppercase text-white/60 transition hover:bg-indigo-500/10 hover:text-indigo-200 cursor-pointer"
                        >
                          <Download size={13} /> {format}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {!loading && !fullOutput && (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0d1117]/60 p-8 text-center">
                <Sparkles size={34} className="mb-4 text-fuchsia-300" />
                <h3 className="text-lg font-black text-white">Ready for Generation</h3>
                <p className="mt-2 max-w-md text-xs leading-6 text-white/40">
                  Fill in the parameters on the left and click generate. GrowthPilot AI will assemble the strategy, content templates, and checklists instantly.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d1117]/60 p-8 text-center">
                <Loader2 className="mb-4 animate-spin text-fuchsia-300" size={34} />
                <h3 className="text-lg font-black text-white">Analyzing & Planning Output...</h3>
                <p className="mt-2 max-w-md text-xs leading-6 text-white/40">
                  Formulating messaging, hooks, CTA angles, and quality reviews based on your target segment.
                </p>
              </div>
            )}

            {fullOutput && !loading && (
              <div className="space-y-5">
                <ResultCard title="Executive Summary" body={result.executiveSummary} />
                <ResultCard title="Strategy" items={result.strategy} />
                <ResultCard title="Primary Output" body={result.primaryOutput} large />
                
                {toolId === 'product_photography' && (
                  <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-fuchsia-200/80">
                          Product Image Generator
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-white/55">
                          Generate dynamic ecommerce assets, lifestyle frames, or ad visuals from this brief.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          value={imageAspectRatio}
                          onChange={event => setImageAspectRatio(event.target.value)}
                          className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-xs font-black text-white outline-none cursor-pointer"
                        >
                          <option value="1:1">Square 1:1</option>
                          <option value="4:3">Landscape 4:3</option>
                          <option value="3:4">Portrait 3:4</option>
                          <option value="16:9">Wide 16:9</option>
                          <option value="9:16">Story 9:16</option>
                        </select>
                        <button
                          type="button"
                          onClick={generateProductImages}
                          disabled={imageLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                          {imageLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                          {imageLoading ? 'Generating Images...' : 'Generate Product Images'}
                        </button>
                      </div>
                    </div>

                    {imageError && (
                      <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                        {imageError}
                      </p>
                    )}

                    {generatedImages.length > 0 && (
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {generatedImages.map(image => (
                          <div key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]">
                            <Image
                              src={image.dataUrl}
                              alt={image.label}
                              width={1024}
                              height={1024}
                              unoptimized
                              className="aspect-square w-full object-cover"
                            />
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-black text-white">{image.label}</h4>
                                <button
                                  type="button"
                                  onClick={() => downloadGeneratedImage(image)}
                                  className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white cursor-pointer"
                                >
                                  Download
                                </button>
                              </div>
                              <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/35">{image.prompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
                
                <ResultCard title="Variations" items={result.variations} />
                <ResultCard title="Quality Checklist" items={result.checklist} />
                <ResultCard title="Assumptions" items={result.assumptions} />
                <ResultCard title="Missing Inputs That Would Improve It" items={result.missingInputs} />
                <ResultCard title="Next Best Actions" items={result.nextBestActions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, body, items, large }: { title: string; body?: string; items?: string[]; large?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1117] p-5">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-fuchsia-200/70">{title}</h3>
      {body && (
        <div className={`whitespace-pre-wrap text-sm leading-7 text-white/80 ${large ? 'text-[15px]' : ''}`}>
          {body}
        </div>
      )}
      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3 text-sm leading-6 text-white/75">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ToolWorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] p-8 text-white/40 flex items-center justify-center">Loading marketing workspace...</div>}>
      <ToolWorkspaceContent />
    </Suspense>
  );
}
