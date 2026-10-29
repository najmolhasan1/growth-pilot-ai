'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Copy,
  Download,
  Loader2,
  Megaphone,
  Sparkles,
  Trash2,
  Wand2,
  Mic,
  MicOff,
  Square,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Layers,
  Flame,
  RefreshCw,
  Zap,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
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
  BusinessModelType,
  CAMPAIGN_PRESETS,
  CampaignPreset,
} from '../marketingUtils';
import {
  EmailExecutionStudio,
  SmsExecutionStudio,
  ProductCopyStudio,
  SocialCampaignStudio,
} from '../executionStudios';

const STORAGE_KEY = 'marketing_brand_profile';
const ASSET_STORAGE_KEY = 'marketing_saved_assets';

function ToolWorkspaceContent() {
  const router = useRouter();
  const params = useParams();
  const rawTool = params?.tool;
  const toolId = typeof rawTool === 'string' ? rawTool : Array.isArray(rawTool) ? rawTool[0] : '';
  const searchParams = useSearchParams();

  const [brandProfile, setBrandProfile] = useState<BrandProfile>({});
  const [businessModel, setBusinessModel] = useState<BusinessModelType>('fcommerce');
  const [language, setLanguage] = useState('Bengali');
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
  const [outputTab, setOutputTab] = useState<'canvas' | 'creatives' | 'closing' | 'phases' | 'economics'>('canvas');

  // Bilingual Voice Typing (Bangla / Banglish / English)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeTool = useMemo(() => tools.find(tool => tool.id === toolId), [toolId]);
  const hasBrandBrain = Object.values(brandProfile).some(value => typeof value === 'string' && value.trim().length > 0);

  // Filter saved assets for this tool specifically
  const toolSavedAssets = useMemo(() => {
    return savedAssets.filter(asset => asset.tool === toolId);
  }, [savedAssets, toolId]);

  // Cleanup audio stream and timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Load asset if query param loadAssetId is provided
  useEffect(() => {
    const loadAssetId = searchParams?.get('loadAssetId');
    if (loadAssetId && savedAssets.length > 0) {
      const asset = savedAssets.find(item => item.id === loadAssetId);
      if (asset) {
        setLanguage(asset.language);
        setInputs(asset.inputs || {});
        setResult(asset.result);
      }
    }
  }, [searchParams, savedAssets]);

  // If tool is invalid, redirect back only after toolId is resolved
  useEffect(() => {
    if (toolId && !activeTool) {
      router.replace('/dashboard/marketing');
    }
  }, [toolId, activeTool, router]);

  useEffect(() => {
    let cancelled = false;
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    try {
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as BrandProfile;
        setBrandProfile(parsed);
        setLanguage(parsed.language || 'Bengali');
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
            setLanguage(profile.language || 'Bengali');
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

  const applyPreset = (preset: CampaignPreset) => {
    setBusinessModel(preset.businessModel);
    setInputs(prev => ({ ...prev, ...preset.inputs }));
    setVoiceSuccessMsg(`Applied Preset: ${preset.label}`);
    setTimeout(() => setVoiceSuccessMsg(''), 3000);
  };

  const syncBrandBrain = () => {
    if (!hasBrandBrain) {
      setError('Brand Brain is currently empty. Please configure your business info in Brand Brain first.');
      return;
    }
    const synced: Record<string, string> = { ...inputs };
    if (brandProfile.businessName && !synced.topic && !synced.productName) {
      synced.topic = `${brandProfile.businessName} - ${brandProfile.productService || 'Official Campaign'}`;
    }
    if (brandProfile.productService && !synced.product && !synced.productName) {
      synced.product = brandProfile.productService;
      synced.productName = brandProfile.productService;
    }
    if (brandProfile.audience && !synced.audience) {
      synced.audience = brandProfile.audience;
    }
    if (brandProfile.offer && !synced.offer) {
      synced.offer = brandProfile.offer;
    }
    if (brandProfile.uniqueSellingPoint && !synced.proof) {
      synced.proof = brandProfile.uniqueSellingPoint;
    }
    setInputs(synced);
    setVoiceSuccessMsg('Brand Brain context synchronized into campaign fields!');
    setTimeout(() => setVoiceSuccessMsg(''), 3000);
  };

  // Voice recording handlers
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
            if (res.ok && data.text) {
              const transcribedText = data.text.trim();
              // Insert into the primary input or notes field
              setInputs(prev => {
                const targetKey = activeTool?.fields.find(f => f.textarea)?.key || activeTool?.fields[0]?.key || 'topic';
                const existing = prev[targetKey] || '';
                return {
                  ...prev,
                  [targetKey]: existing ? `${existing} ${transcribedText}` : transcribedText,
                };
              });
              setVoiceSuccessMsg('Voice transcribed successfully!');
              setTimeout(() => setVoiceSuccessMsg(''), 4000);
            } else {
              setVoiceErrorMsg(data.error || 'Failed to transcribe audio. Please try speaking again.');
            }
          } catch (transcribeErr: any) {
            console.error('Transcription error:', transcribeErr);
            setVoiceErrorMsg('Network error transcribing voice. Please try again.');
          } finally {
            setIsTranscribing(false);
          }
        };
      } catch (err: any) {
        console.error('File read error:', err);
        setVoiceErrorMsg('Could not process recorded audio.');
        setIsTranscribing(false);
      }
    };

    recorder.stop();
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
      const { data } = await getSupabaseBrowserClient().auth.refreshSession();
      isPlus = data.session?.user?.user_metadata?.plan === 'Plus';
    } catch (e) {
      console.warn(e);
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
        body: JSON.stringify({
          tool: toolId,
          language,
          businessModel,
          brandProfile,
          inputs
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Marketing generation failed.');
      }

      const generatedResult = payload.data as MarketingResult;
      setResult(generatedResult);
      setGeneratedImages([]);
      setImageError('');

      // Auto switch to appropriate tab if direct creatives or chat scripts are generated
      if (generatedResult.adCreatives && generatedResult.adCreatives.length > 0 && toolId === 'social_campaign') {
        setOutputTab('creatives');
      } else if (generatedResult.chatClosingScripts && generatedResult.chatClosingScripts.length > 0 && toolId === 'strategy_audit') {
        setOutputTab('canvas');
      } else {
        setOutputTab('canvas');
      }

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
      <div className="min-h-screen bg-[#030303] p-8 text-white/40 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF5533]" size={28} />
      </div>
    );
  }

  const modelPresets = CAMPAIGN_PRESETS.filter(p => p.businessModel === businessModel);

  return (
    <div className="min-h-screen bg-[#030303] p-4 sm:p-6 lg:p-10">
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
            <span>Growth Suite</span> <span className="mx-1.5">/</span> <span className="text-[#FF5533]">{activeTool.label}</span>
          </div>
        </div>

        {/* Workspace Title Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#FF5533]">
              {activeTool.category} • 40-Year Veteran CMO Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {activeTool.label}
            </h1>
            <p className="mt-2 max-w-2xl text-xs text-white/50">
              {activeTool.description} Generates battle-tested copy assets, Meta Ad angles, and closing scripts engineered for real cash flow.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={syncBrandBrain}
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-black text-[#FF7A45] hover:bg-orange-500/20 transition cursor-pointer"
              title="Auto-fill campaign inputs from your saved Brand Brain context"
            >
              <Zap size={14} /> Sync Brand Brain
            </button>
            <Link
              href="/dashboard/brand"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Brain size={14} /> {hasBrandBrain ? 'Edit Brand Brain' : 'Create Brand Brain'} <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Form and Result Display Columns */}
        <div className="grid gap-6 xl:grid-cols-[440px,1fr] items-start">
          <div className="space-y-6">
            {/* Input Form Starts Directly at Top */}
            <form onSubmit={generate} className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-4 sm:p-5 shadow-2xl">
              {/* Business Model Switcher */}
              <div className="mb-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7A45]">Target Business Archetype</span>
                  <span className="text-[10px] font-bold text-white/40">Select your model</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessModel('fcommerce')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black text-left flex items-center justify-between border transition cursor-pointer ${
                      businessModel === 'fcommerce'
                        ? 'border-[#FF5533] bg-[#FF5533]/15 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <span>🇧🇩 F-Commerce (COD)</span>
                    {businessModel === 'fcommerce' && <CheckCircle2 size={13} className="text-[#FF5533]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessModel('ecommerce')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black text-left flex items-center justify-between border transition cursor-pointer ${
                      businessModel === 'ecommerce'
                        ? 'border-[#FF5533] bg-[#FF5533]/15 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <span>🛍️ D2C Ecommerce</span>
                    {businessModel === 'ecommerce' && <CheckCircle2 size={13} className="text-[#FF5533]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessModel('b2b')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black text-left flex items-center justify-between border transition cursor-pointer ${
                      businessModel === 'b2b'
                        ? 'border-[#FF5533] bg-[#FF5533]/15 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <span>💼 B2B / Agency</span>
                    {businessModel === 'b2b' && <CheckCircle2 size={13} className="text-[#FF5533]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessModel('saas')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black text-left flex items-center justify-between border transition cursor-pointer ${
                      businessModel === 'saas'
                        ? 'border-[#FF5533] bg-[#FF5533]/15 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-white/60 hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <span>🚀 SaaS Product</span>
                    {businessModel === 'saas' && <CheckCircle2 size={13} className="text-[#FF5533]" />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Auto-fills */}
              <div className="mb-5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quick Battle-Tested Presets</span>
                  <span className="text-[10px] font-bold text-orange-400">1-Click Auto-Fill</span>
                </div>
                <div className="space-y-1.5">
                  {modelPresets.length > 0 ? (
                    modelPresets.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition flex items-center justify-between text-xs text-white/75 cursor-pointer group"
                      >
                        <span className="font-bold line-clamp-1 group-hover:text-white">{preset.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                          {preset.badge}
                        </span>
                      </button>
                    ))
                  ) : (
                    CAMPAIGN_PRESETS.slice(0, 2).map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition flex items-center justify-between text-xs text-white/75 cursor-pointer group"
                      >
                        <span className="font-bold line-clamp-1 group-hover:text-white">{preset.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                          {preset.badge}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Parameters Header with Voice Typing Toolbar */}
              <div className="mb-5 flex items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Parameters</p>
                  <h2 className="mt-0.5 text-base font-black text-white">Input Details</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Voice Typing Button */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={isTranscribing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-[#FF7A45] text-xs font-bold transition cursor-pointer"
                      title="Speak in Bangla, Banglish or English to auto-type"
                    >
                      {isTranscribing ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />}
                      <span>{isTranscribing ? 'Transcribing...' : 'Voice Type'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        {Math.floor(recordSeconds / 60).toString().padStart(2, '0')}:{(recordSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer"
                        title="Done Speaking"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                        title="Cancel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <select
                    value={language}
                    onChange={event => setLanguage(event.target.value)}
                    className="rounded-xl border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-[#FF5533]/50"
                  >
                    <option value="Bengali">Bangla (DHAKA)</option>
                    <option value="Banglish">Banglish</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              {/* Status messages for voice typing */}
              {voiceSuccessMsg && (
                <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{voiceSuccessMsg}</span>
                </div>
              )}
              {voiceErrorMsg && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{voiceErrorMsg}</span>
                </div>
              )}

              {/* Dynamic Tool Fields */}
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
                        className="w-full resize-y rounded-2xl border border-white/10 bg-[#030303] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                      />
                    ) : (
                      <input
                        value={inputs[field.key] || ''}
                        onChange={event => updateInput(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-white/10 bg-[#030303] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                      />
                    )}
                  </div>
                ))}
              </div>

              {!hasBrandBrain && (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100/80">
                  Tip: Brand Brain context is empty. Click "Create Brand Brain" at the top to save your company profile once and auto-power all campaigns.
                </div>
              )}

              <button
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-6 py-4 text-sm font-black text-white shadow-xl shadow-[#FF5533]/25 transition hover:from-[#FF5547] hover:to-[#FF9036] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                {loading ? 'Assembling 40-Yr CMO Assets...' : 'Generate Expert Growth Engine'}
              </button>
              {saveStatus !== 'idle' && (
                <p className="mt-3 text-center text-[11px] font-bold text-white/35">
                  {saveStatus === 'saved' ? 'Saved to cloud library.' : saveStatus === 'local' ? 'Saved locally.' : 'Saved locally, cloud sync error.'}
                </p>
              )}
            </form>

            {/* Focused Saved Outputs List For This Tool */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-5">
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
                <p className="rounded-2xl border border-dashed border-white/10 bg-[#030303] p-4 text-xs leading-5 text-white/35">
                  Saved outputs for {activeTool.label} will appear here.
                </p>
              ) : (
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                  {toolSavedAssets.map(asset => (
                    <div key={asset.id} className="rounded-2xl border border-white/10 bg-[#030303] p-4">
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
                          className="rounded-xl bg-orange-500/10 px-2.5 py-1.5 text-[#FF5533] hover:bg-orange-500/20 cursor-pointer"
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

          {/* Results Multi-Tab Execution Studio */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Execution Studio</p>
                <h2 className="mt-0.5 flex items-center gap-2 text-xl font-black text-white">
                  <Megaphone size={20} className="text-[#FF5533]" /> CMO Execution Command
                </h2>
              </div>
              {fullOutput && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyBlock('all', fullOutput)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
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
                          className="inline-flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-black uppercase text-white/60 transition hover:bg-orange-500/10 hover:text-[#FF5533] cursor-pointer"
                        >
                          <Download size={12} /> {format}
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
              <div className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#030303]/60 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5533] mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-black text-white">Veteran CMO Engine Ready</h3>
                <p className="mt-2 max-w-md text-xs leading-6 text-white/40">
                  Select your Business Model (F-Commerce COD, D2C Ecommerce, or B2B), pick a campaign preset or speak via Voice Type, and click Generate.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-white/50">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">🔥 Meta & UGC Video Ads</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">💬 Messenger & WhatsApp Closing</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">🛡️ Rider COD Risk-Reversals</span>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#030303]/60 p-8 text-center">
                <Loader2 className="mb-4 animate-spin text-[#FF5533]" size={36} />
                <h3 className="text-lg font-black text-white">Synthesizing 40-Year Veteran Growth Engine...</h3>
                <p className="mt-2 max-w-md text-xs leading-6 text-white/40">
                  Formulating conversion hooks, objection battlecards, Messenger closing scripts, and launch phase milestones for your {businessModel.toUpperCase()} business.
                </p>
              </div>
            )}

            {fullOutput && !loading && (
              <div className="space-y-6">
                {/* STUDIO NAVIGATION TABS */}
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                  <button
                    type="button"
                    onClick={() => setOutputTab('canvas')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                      outputTab === 'canvas'
                        ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white shadow-lg shadow-[#FF5533]/20'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Layers size={14} /> Master Studio Canvas
                  </button>

                  {result.adCreatives && result.adCreatives.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('creatives')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'creatives'
                          ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white shadow-lg shadow-[#FF5533]/20'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Flame size={14} className="text-orange-400" />
                      <span>Ad Creatives</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                        {result.adCreatives.length}
                      </span>
                    </button>
                  )}

                  {result.chatClosingScripts && result.chatClosingScripts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('closing')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'closing'
                          ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white shadow-lg shadow-[#FF5533]/20'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <MessageCircle size={14} className="text-emerald-400" />
                      <span>Sales & Chat Closing</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                        {result.chatClosingScripts.length}
                      </span>
                    </button>
                  )}

                  {result.campaignPhases && result.campaignPhases.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('phases')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'phases'
                          ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white shadow-lg shadow-[#FF5533]/20'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Zap size={14} className="text-amber-400" />
                      <span>4-Phase Roadmap</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                        {result.campaignPhases.length}
                      </span>
                    </button>
                  )}

                  {(result.guaranteeAndRiskReversal || result.unitEconomicsAdvice) && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('economics')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'economics'
                          ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white shadow-lg shadow-[#FF5533]/20'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <ShieldCheck size={14} className="text-teal-400" />
                      <span>CMO Economics & Guarantee</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: MASTER STUDIO CANVAS */}
                {outputTab === 'canvas' && (
                  <div className="space-y-6">
                    {/* Tool-specific Execution Studios */}
                    {toolId === 'email_campaign' ? (
                      <EmailExecutionStudio
                        primaryOutput={result.primaryOutput}
                        businessName={brandProfile.businessName}
                        result={result}
                      />
                    ) : toolId === 'sms_campaign' ? (
                      <div className="space-y-5">
                        <ResultCard title="Executive Summary" body={result.executiveSummary} />
                        <SmsExecutionStudio primaryOutput={result.primaryOutput} />
                        <ResultCard title="Strategy & Conversion Anchors" items={result.strategy} />
                        <ResultCard title="Variations" items={result.variations} />
                      </div>
                    ) : toolId === 'product_copy' ? (
                      <div className="space-y-5">
                        <ResultCard title="Executive Summary" body={result.executiveSummary} />
                        <ProductCopyStudio
                          primaryOutput={result.primaryOutput}
                          productName={inputs.product || inputs.productName || brandProfile.productService || 'Product'}
                        />
                        <ResultCard title="Strategy & Benefits" items={result.strategy} />
                        <ResultCard title="Variations" items={result.variations} />
                      </div>
                    ) : toolId === 'social_campaign' ? (
                      <div className="space-y-5">
                        <ResultCard title="Executive Summary" body={result.executiveSummary} />
                        <SocialCampaignStudio primaryOutput={result.primaryOutput} />
                        <ResultCard title="Strategy & Angles" items={result.strategy} />
                        <ResultCard title="Variations" items={result.variations} />
                      </div>
                    ) : (
                      <>
                        <ResultCard title="CMO Executive Summary" body={result.executiveSummary} />
                        <ResultCard title="Strategic Funnel Framework" items={result.strategy} />
                        <ResultCard title="Master Strategic Output" body={result.primaryOutput} large />

                        {toolId === 'product_photography' && (
                          <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#FF7A45]">
                                  AI Product Photography Studio
                                </h3>
                                <p className="mt-2 text-xs leading-5 text-white/55">
                                  Generate dynamic ecommerce assets, lifestyle frames, or ad visuals from this brief.
                                </p>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                  value={imageAspectRatio}
                                  onChange={event => setImageAspectRatio(event.target.value)}
                                  className="rounded-2xl border border-white/10 bg-[#0d0d0f] px-4 py-3 text-xs font-black text-white outline-none cursor-pointer"
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
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-5 py-3 text-xs font-black text-white shadow-lg shadow-[#FF5533]/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
                                  <div key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f]">
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

                        <ResultCard title="Campaign Variations & Angles" items={result.variations} />
                        <ResultCard title="Execution Checklist" items={result.checklist} />
                        <ResultCard title="Tactical Next Best Actions" items={result.nextBestActions} />
                      </>
                    )}
                  </div>
                )}

                {/* TAB 2: AD CREATIVES */}
                {outputTab === 'creatives' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-xs text-orange-200">
                      🔥 <strong>Direct Response Ads Manager:</strong> Copy-paste ready for Meta Ads Manager, TikTok Ads, or LinkedIn Sponsored Posts. Includes scroll-stopping hooks, psychological body copy, and visual storyboard directions.
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {result.adCreatives?.map((creative, idx) => (
                        <div
                          key={`ad-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 flex flex-col justify-between shadow-xl"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-[#FF7A45] border border-orange-500/30">
                                Angle {idx + 1}: {creative.angleName}
                              </span>
                              <span className="text-[10px] font-mono text-white/40">
                                {creative.platform}
                              </span>
                            </div>

                            {/* Hook */}
                            <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">First 3-Sec Hook</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`hook-${idx}`, creative.hook)}
                                  className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `hook-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `hook-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <p className="text-xs font-bold text-white leading-5">"{creative.hook}"</p>
                            </div>

                            {/* Body Copy */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Primary Ad Text</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`body-${idx}`, creative.bodyCopy)}
                                  className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `body-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `body-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap text-xs text-white/80 leading-6 bg-white/[0.02] border border-white/5 p-3 rounded-xl max-h-48 overflow-y-auto">
                                {creative.bodyCopy}
                              </div>
                            </div>

                            {/* Visual Direction */}
                            {creative.visualDirection && (
                              <div className="mb-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-purple-200/90 text-xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                                  🎬 Visual & Storyboard Note
                                </span>
                                {creative.visualDirection}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/40">
                              CTA: <span className="text-[#FF7A45] font-black">{creative.callToAction}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBlock(`full-${idx}`, `${creative.hook}\n\n${creative.bodyCopy}\n\n👉 ${creative.callToAction}`)}
                              className="px-3 py-1.5 rounded-xl bg-[#FF5533]/15 hover:bg-[#FF5533]/30 text-[#FF7A45] text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {copied === `full-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copied === `full-${idx}` ? 'Copied Complete Ad' : 'Copy Full Ad'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: CHAT & SALES CLOSING */}
                {outputTab === 'closing' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                      💬 <strong>Messenger & WhatsApp Sales Scripts:</strong> Pre-built objection handlers and conversion scripts. Train your customer support agents or load them directly into Facebook Page automated replies.
                    </div>

                    <div className="space-y-4">
                      {result.chatClosingScripts?.map((script, idx) => (
                        <div
                          key={`chat-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                                #{idx + 1}
                              </span>
                              <h4 className="text-sm font-black text-white">{script.customerTrigger}</h4>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-white/50 border border-white/5">
                              {script.psychologicalAngle}
                            </span>
                          </div>

                          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                Copy-Paste Reply Script
                              </span>
                              <button
                                type="button"
                                onClick={() => copyBlock(`script-${idx}`, script.salesScript)}
                                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                              >
                                {copied === `script-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copied === `script-${idx}` ? 'Copied' : 'Copy Script'}</span>
                              </button>
                            </div>
                            <p className="whitespace-pre-wrap text-xs text-white/90 leading-6 font-medium">
                              {script.salesScript}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
                            <span>Next Micro-Action:</span>
                            <span className="text-[#FF7A45] font-bold">{script.nextStepCta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: CAMPAIGN PHASES */}
                {outputTab === 'phases' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
                      🚀 <strong>4-Phase Omnichannel Launch Machine:</strong> Step-by-step roadmap from curiosity hype to the final 48-hour deadline push.
                    </div>

                    <div className="space-y-4">
                      {result.campaignPhases?.map((phase, idx) => (
                        <div
                          key={`phase-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-xl relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white">
                                {phase.phaseName}
                              </span>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Objective</span>
                              <p className="text-white/80 font-medium">{phase.objective}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block mb-1">Key Tactical Action</span>
                              <p className="text-white/80 font-medium">{phase.keyAction}</p>
                            </div>
                          </div>

                          {phase.copyOrScriptSnippet && (
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Broadcast Snippet</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`phase-${idx}`, phase.copyOrScriptSnippet)}
                                  className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `phase-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `phase-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <p className="text-xs text-white/85 leading-5 italic">
                                "{phase.copyOrScriptSnippet}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: CMO ECONOMICS & GUARANTEES */}
                {outputTab === 'economics' && (
                  <div className="space-y-6">
                    {result.guaranteeAndRiskReversal && (
                      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck size={20} className="text-teal-400" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-teal-300">
                            Ironclad Risk-Reversal Guarantee
                          </h3>
                        </div>
                        <p className="text-sm text-white/90 leading-7 font-medium">
                          {result.guaranteeAndRiskReversal}
                        </p>
                        <div className="mt-4 pt-3 border-t border-teal-500/20 flex justify-end">
                          <button
                            type="button"
                            onClick={() => copyBlock('guarantee', result.guaranteeAndRiskReversal || '')}
                            className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {copied === 'guarantee' ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copied === 'guarantee' ? 'Copied' : 'Copy Guarantee Statement'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {result.unitEconomicsAdvice && (
                      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp size={20} className="text-orange-400" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-orange-300">
                            Unit Economics, Margin & Scaling Architecture
                          </h3>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-white/90 leading-7 font-medium">
                          {result.unitEconomicsAdvice}
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
  );
}

function ResultCard({ title, body, items, large }: { title: string; body?: string; items?: string[]; large?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-lg">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#FF7A45]">{title}</h3>
      {body && (
        <div className={`whitespace-pre-wrap text-sm leading-7 text-white/80 ${large ? 'text-[15px]' : ''}`}>
          {body}
        </div>
      )}
      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3 text-sm leading-6 text-white/75">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5533]" />
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
    <Suspense fallback={<div className="min-h-screen bg-[#030303] p-8 text-white/40 flex items-center justify-center">Loading marketing workspace...</div>}>
      <ToolWorkspaceContent />
    </Suspense>
  );
}
