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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Target,
  ListChecks,
  Compass,
  Lightbulb,
  Clock,
  Send,
  User,
  Bot,
  Video,
  SlidersHorizontal,
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';
import { WorkspaceHeader, ToolSwitcher, ui } from '@/components/workspace/ui';
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

const TOOL_ORDER = ['strategy_audit', 'launch_pack', 'campaign_planner', 'social_campaign', 'product_copy', 'email_campaign', 'sms_campaign', 'landing_page', 'product_photography'];

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
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const outputRef = useRef<HTMLDivElement | null>(null);

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
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
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
    setVoiceSuccessMsg(`Loaded preset: ${preset.label}`);
    setShowPresets(false);
    setTimeout(() => setVoiceSuccessMsg(''), 3500);
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

    // Scroll smoothly to output container so user sees generation progress
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

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

      // Re-scroll gently to output to show results
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

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
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
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
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF5533]" size={28} />
      </div>
    );
  }

  const modelPresets = CAMPAIGN_PRESETS.filter(p => p.businessModel === businessModel);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkspaceHeader
        title={activeTool.label}
        crumbs={[{ label: 'Growth', href: '/dashboard/marketing' }]}
        actions={
          <>
            <button type="button" onClick={syncBrandBrain} className={ui.btnGhost} title="Fill inputs from Brand Brain">
              <Zap size={14} />
              <span className="hidden sm:inline">Sync brand</span>
            </button>
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
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <ToolSwitcher
          items={[...tools]
            .sort((a, b) => TOOL_ORDER.indexOf(a.id) - TOOL_ORDER.indexOf(b.id))
            .map(t => ({ id: t.id, label: t.label, icon: t.icon, href: `/dashboard/marketing/${t.id}` }))}
          value={activeTool.id}
        />

        {/* Modern 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT PANEL: Parameters & Configuration                  */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            <form onSubmit={generate} className="rounded-2xl border border-border bg-card p-5 space-y-5">
              {/* Top Bar of Input Card: Configuration + Voice Typing + Language */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-foreground">Inputs</h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Voice Typing Button */}
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={isTranscribing}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs font-medium transition cursor-pointer"
                      title="Speak in Bangla or English to auto-type"
                    >
                      {isTranscribing ? <Loader2 size={12} className="animate-spin text-[#FF7A45]" /> : <Mic size={12} className="text-[#FF7A45]" />}
                      <span>{isTranscribing ? 'Transcribing...' : 'Voice Type'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/20 text-rose-300 text-xs font-mono font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {Math.floor(recordSeconds / 60).toString().padStart(2, '0')}:{(recordSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="p-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer"
                        title="Done"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                        title="Cancel"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  <select
                    value={language}
                    onChange={event => setLanguage(event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white outline-none cursor-pointer focus:border-[#FF5533]/50"
                  >
                    <option value="Bengali">Bangla</option>
                    <option value="Banglish">Banglish</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              {/* Status messages for voice typing */}
              {voiceSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>{voiceSuccessMsg}</span>
                </div>
              )}
              {voiceErrorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{voiceErrorMsg}</span>
                </div>
              )}

              {/* Business Model Clean Segmented Control */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground block">
                  Business Model
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/5">
                  {[
                    { id: 'fcommerce', label: 'F-Commerce' },
                    { id: 'ecommerce', label: 'D2C E-Com' },
                    { id: 'b2b', label: 'B2B / Agency' },
                    { id: 'saas', label: 'SaaS' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBusinessModel(item.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                        businessModel === item.id
                          ? 'bg-[#FF5533] text-white shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Quick Presets (Autofill templates) */}
              {modelPresets.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/60 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#FF7A45]" />
                      <span>Templates</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {modelPresets.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#FF5533]/30 border border-white/5 text-[11px] font-medium text-white/70 hover:text-white transition cursor-pointer truncate max-w-[220px]"
                        title={preset.description}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Input Fields */}
              <div className="space-y-3.5">
                {activeTool.fields.map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      {field.label}
                    </label>
                    {field.textarea ? (
                      <textarea
                        value={inputs[field.key] || ''}
                        onChange={event => updateInput(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className={ui.textarea}
                      />
                    ) : (
                      <input
                        value={inputs[field.key] || ''}
                        onChange={event => updateInput(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className={ui.input}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button & Brand Brain Indicator */}
              <div className="pt-3 space-y-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-white/50">
                  {hasBrandBrain ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 size={13} /> Brand Brain active
                    </span>
                  ) : (
                    <span />
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                      <Check size={11} /> Saved
                    </span>
                  )}
                </div>

                <button
                  disabled={loading}
                  className={`${ui.btnPrimary} h-11 w-full`}
                >
                  {loading ? <Loader2 className="animate-spin" size={15} /> : <Wand2 size={15} />}
                  <span>{loading ? 'Generating…' : 'Generate'}</span>
                </button>
              </div>
            </form>

            {/* Collapsible History Section */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-white/70 hover:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-white/40" />
                  <span>History</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50 border border-white/5">
                    {toolSavedAssets.length}
                  </span>
                </div>
                {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showHistory && (
                <div className="p-3 pt-0 space-y-2 border-t border-white/5 max-h-64 overflow-y-auto">
                  {toolSavedAssets.length === 0 ? (
                    <p className="text-xs text-white/30 text-center py-4">No drafts saved yet for this tool.</p>
                  ) : (
                    toolSavedAssets.map(asset => (
                      <div key={asset.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => loadAsset(asset)}
                          className="text-left flex-1 min-w-0 group"
                        >
                          <h4 className="line-clamp-1 font-bold text-white group-hover:text-[#FF7A45] transition-colors">{asset.title}</h4>
                          <span className="text-[10px] text-white/30">{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => loadAsset(asset)}
                            className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAsset(asset.id)}
                            className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT PANEL: Output Studio & Execution Canvas            */}
          {/* ======================================================== */}
          <div ref={outputRef} id="execution-output" className="lg:col-span-7 xl:col-span-7 rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 min-h-[550px]">
            {/* Studio Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Output</h2>
              </div>

              {fullOutput && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copyBlock('all', fullOutput)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-white/80 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                  >
                    {copied === 'all' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied === 'all' ? 'Copied' : 'Copy All'}</span>
                  </button>

                  {currentAsset && (
                    <div className="flex items-center gap-1">
                      {(['txt', 'md', 'html'] as ExportFormat[]).map(format => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => downloadAsset(currentAsset, format)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.03] text-[10px] font-bold uppercase text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-200 flex items-center gap-2.5">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && !fullOutput && (
              <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <div className="w-11 h-11 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground mb-4">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Nothing generated yet</h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Fill in the inputs or start from a template.
                </p>
                {modelPresets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => applyPreset(modelPresets[0])}
                    className={`${ui.btnSecondary} mt-5`}
                  >
                    <Sparkles size={13} />
                    <span>Load "{modelPresets[0].label}"</span>
                  </button>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <Loader2 className="mb-3 animate-spin text-[#FF7A45]" size={28} />
                <p className="text-sm text-muted-foreground">Generating…</p>
              </div>
            )}

            {/* Active Result Deck */}
            {fullOutput && !loading && (
              <div className="space-y-6">
                {/* STUDIO NAVIGATION TABS (Apple/Linear Segmented Style) */}
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-background border border-border">
                  <button
                    type="button"
                    onClick={() => setOutputTab('canvas')}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                      outputTab === 'canvas'
                        ? 'bg-[#FF5533] text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Campaign Assets</span>
                  </button>

                  {result.adCreatives && result.adCreatives.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('creatives')}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'creatives'
                          ? 'bg-[#FF5533] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Flame size={13} className="text-orange-400" />
                      <span>Ad Creatives ({result.adCreatives.length})</span>
                    </button>
                  )}

                  {result.chatClosingScripts && result.chatClosingScripts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('closing')}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'closing'
                          ? 'bg-[#FF5533] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <MessageCircle size={13} className="text-emerald-400" />
                      <span>Chat Closing ({result.chatClosingScripts.length})</span>
                    </button>
                  )}

                  {result.campaignPhases && result.campaignPhases.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('phases')}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'phases'
                          ? 'bg-[#FF5533] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <Zap size={13} className="text-amber-400" />
                      <span>Launch Roadmap ({result.campaignPhases.length})</span>
                    </button>
                  )}

                  {(result.guaranteeAndRiskReversal || result.unitEconomicsAdvice) && (
                    <button
                      type="button"
                      onClick={() => setOutputTab('economics')}
                      className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                        outputTab === 'economics'
                          ? 'bg-[#FF5533] text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <ShieldCheck size={13} className="text-teal-400" />
                      <span>Pricing & Guarantee</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: MASTER STUDIO CANVAS */}
                {outputTab === 'canvas' && (
                  <div className="space-y-5">
                    {/* Dedicated Execution Studios */}
                    {toolId === 'email_campaign' ? (
                      <EmailExecutionStudio
                        primaryOutput={result.primaryOutput}
                        businessName={brandProfile.businessName}
                        result={result}
                      />
                    ) : toolId === 'sms_campaign' ? (
                      <div className="space-y-4">
                        <ResultCard
                          title="Executive Summary"
                          body={result.executiveSummary}
                          icon={<Brain size={15} />}
                          onCopy={() => copyBlock('summary', result.executiveSummary)}
                          isCopied={copied === 'summary'}
                        />
                        <SmsExecutionStudio primaryOutput={result.primaryOutput} />
                        <ResultCard
                          title="Strategy & Conversion Anchors"
                          items={result.strategy}
                          icon={<Target size={15} />}
                          onCopy={() => copyBlock('strategy', result.strategy.join('\n'))}
                          isCopied={copied === 'strategy'}
                        />
                        <ResultCard
                          title="Campaign Variations"
                          items={result.variations}
                          icon={<Lightbulb size={15} />}
                          onCopy={() => copyBlock('variations', result.variations.join('\n'))}
                          isCopied={copied === 'variations'}
                        />
                      </div>
                    ) : toolId === 'product_copy' ? (
                      <div className="space-y-4">
                        <ResultCard
                          title="Executive Summary"
                          body={result.executiveSummary}
                          icon={<Brain size={15} />}
                          onCopy={() => copyBlock('summary', result.executiveSummary)}
                          isCopied={copied === 'summary'}
                        />
                        <ProductCopyStudio
                          primaryOutput={result.primaryOutput}
                          productName={inputs.product || inputs.productName || brandProfile.productService || 'Product'}
                        />
                        <ResultCard
                          title="Strategic Value Anchors"
                          items={result.strategy}
                          icon={<Target size={15} />}
                          onCopy={() => copyBlock('strategy', result.strategy.join('\n'))}
                          isCopied={copied === 'strategy'}
                        />
                        <ResultCard
                          title="Variations"
                          items={result.variations}
                          icon={<Lightbulb size={15} />}
                          onCopy={() => copyBlock('variations', result.variations.join('\n'))}
                          isCopied={copied === 'variations'}
                        />
                      </div>
                    ) : toolId === 'social_campaign' ? (
                      <div className="space-y-4">
                        <ResultCard
                          title="Executive Summary"
                          body={result.executiveSummary}
                          icon={<Brain size={15} />}
                          onCopy={() => copyBlock('summary', result.executiveSummary)}
                          isCopied={copied === 'summary'}
                        />
                        <SocialCampaignStudio primaryOutput={result.primaryOutput} />
                        <ResultCard
                          title="Strategic Angles"
                          items={result.strategy}
                          icon={<Target size={15} />}
                          onCopy={() => copyBlock('strategy', result.strategy.join('\n'))}
                          isCopied={copied === 'strategy'}
                        />
                        <ResultCard
                          title="Variations"
                          items={result.variations}
                          icon={<Lightbulb size={15} />}
                          onCopy={() => copyBlock('variations', result.variations.join('\n'))}
                          isCopied={copied === 'variations'}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <ResultCard
                            title="Executive Summary"
                            body={result.executiveSummary}
                            icon={<Brain size={15} />}
                            onCopy={() => copyBlock('summary', result.executiveSummary)}
                            isCopied={copied === 'summary'}
                          />
                          <ResultCard
                            title="Funnel Strategy"
                            items={result.strategy}
                            icon={<Target size={15} />}
                            onCopy={() => copyBlock('strategy', result.strategy.join('\n'))}
                            isCopied={copied === 'strategy'}
                          />
                        </div>

                        <ResultCard
                          title="Generated Content & Copy"
                          body={result.primaryOutput}
                          icon={<FileText size={15} />}
                          large
                          onCopy={() => copyBlock('primary', result.primaryOutput)}
                          isCopied={copied === 'primary'}
                        />

                        {toolId === 'product_photography' && (
                          <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#FF7A45] flex items-center gap-2">
                                  <Video size={14} /> AI Product Photography Studio
                                </h3>
                                <p className="mt-1 text-xs text-white/55">
                                  Generate studio packshots, lifestyle frames, or ad visuals from this brief.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={imageAspectRatio}
                                  onChange={event => setImageAspectRatio(event.target.value)}
                                  className="rounded-xl border border-white/10 bg-[#0d0d0f] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
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
                                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF473A] to-[#FF8526] px-4 py-2 text-xs font-black text-white shadow-md transition hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
                                >
                                  {imageLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                  <span>{imageLoading ? 'Rendering...' : 'Render Images'}</span>
                                </button>
                              </div>
                            </div>

                            {imageError && (
                              <p className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-200">
                                {imageError}
                              </p>
                            )}

                            {generatedImages.length > 0 && (
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                {generatedImages.map(image => (
                                  <div key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#030303]">
                                    <Image
                                      src={image.dataUrl}
                                      alt={image.label}
                                      width={1024}
                                      height={1024}
                                      unoptimized
                                      className="aspect-square w-full object-cover"
                                    />
                                    <div className="p-3.5 flex items-center justify-between gap-2 border-t border-white/5">
                                      <h4 className="text-xs font-black text-white truncate">{image.label}</h4>
                                      <button
                                        type="button"
                                        onClick={() => downloadGeneratedImage(image)}
                                        className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                                      >
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <ResultCard
                            title="Campaign Variations"
                            items={result.variations}
                            icon={<Lightbulb size={15} />}
                            onCopy={() => copyBlock('variations', result.variations.join('\n'))}
                            isCopied={copied === 'variations'}
                          />
                          <ResultCard
                            title="Execution Checklist"
                            items={result.checklist}
                            icon={<ListChecks size={15} />}
                            onCopy={() => copyBlock('checklist', result.checklist.join('\n'))}
                            isCopied={copied === 'checklist'}
                          />
                          <ResultCard
                            title="Next Best Actions"
                            items={result.nextBestActions}
                            icon={<Compass size={15} />}
                            onCopy={() => copyBlock('actions', result.nextBestActions.join('\n'))}
                            isCopied={copied === 'actions'}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 2: AD CREATIVES (Meta & TikTok Simulator) - Wide Responsive Grid */}
                {outputTab === 'creatives' && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-xs text-orange-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame size={15} className="text-orange-400 shrink-0" />
                        <span>Ready-to-deploy ad copies with scroll-stopping hooks and visual directions.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {result.adCreatives?.map((creative, idx) => (
                        <div
                          key={`ad-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 flex flex-col justify-between shadow-xl relative overflow-hidden"
                        >
                          <div>
                            {/* Ad Card Top Bar */}
                            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-[#FF7A45] border border-orange-500/30">
                                Angle {idx + 1}: {creative.angleName}
                              </span>
                              <span className="text-[10px] font-mono text-white/40">{creative.platform}</span>
                            </div>

                            {/* Hook Section */}
                            <div className="mb-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">First 3-Sec Hook</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`hook-${idx}`, creative.hook)}
                                  className="text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `hook-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `hook-${idx}` ? 'Copied' : 'Copy Hook'}</span>
                                </button>
                              </div>
                              <p className="text-xs font-bold text-white leading-5">"{creative.hook}"</p>
                            </div>

                            {/* Body Copy Section */}
                            <div className="mb-3.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Primary Ad Copy</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`body-${idx}`, creative.bodyCopy)}
                                  className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `body-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `body-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap text-xs text-white/80 leading-6 bg-white/[0.02] border border-white/5 p-3 rounded-xl max-h-56 overflow-y-auto">
                                {creative.bodyCopy}
                              </div>
                            </div>

                            {/* Visual Direction Section */}
                            {creative.visualDirection && (
                              <div className="mb-3.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                                  🎬 Storyboard & Visual Direction
                                </span>
                                <p className="leading-5">{creative.visualDirection}</p>
                              </div>
                            )}
                          </div>

                          {/* Card Footer CTA */}
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white/50">
                              CTA: <span className="text-[#FF7A45] font-black">{creative.callToAction}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBlock(`full-${idx}`, `${creative.hook}\n\n${creative.bodyCopy}\n\n👉 ${creative.callToAction}`)}
                              className="px-3 py-1.5 rounded-xl bg-[#FF5533]/15 hover:bg-[#FF5533]/30 text-[#FF7A45] text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {copied === `full-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copied === `full-${idx}` ? 'Copied Ad' : 'Copy Ad'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: CHAT & SALES CLOSING - Wide Responsive 2-Column Grid */}
                {outputTab === 'closing' && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={15} className="text-emerald-400 shrink-0" />
                        <span>Ready-to-use Messenger and WhatsApp objection closing scripts for customer care agents.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {result.chatClosingScripts?.map((script, idx) => (
                        <div
                          key={`chat-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-xl space-y-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                              <span className="text-xs font-black text-white flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">
                                  {idx + 1}
                                </span>
                                <span>Scenario: {script.customerTrigger}</span>
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                                {script.psychologicalAngle}
                              </span>
                            </div>

                            {/* Chat Conversation Simulation */}
                            <div className="p-4 rounded-2xl bg-[#09090c] border border-white/5 space-y-3">
                              {/* Customer Incoming Bubble (Left) */}
                              <div className="flex items-start gap-2.5 max-w-[85%]">
                                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 shrink-0">
                                  <User size={14} />
                                </div>
                                <div className="p-3 rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/5 text-xs text-white/90">
                                  <span className="text-[9px] font-black text-white/40 uppercase block mb-0.5">Customer Inquiry</span>
                                  {script.customerTrigger}
                                </div>
                              </div>

                              {/* Agent Closing Bubble (Right) */}
                              <div className="flex items-start justify-end gap-2.5 ml-auto max-w-[92%]">
                                <div className="p-3.5 rounded-2xl rounded-tr-sm bg-emerald-950/40 border border-emerald-500/30 text-xs text-white/95 space-y-2 shadow-lg">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                      <Bot size={11} /> High-Converting Response
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyBlock(`script-${idx}`, script.salesScript)}
                                      className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      {copied === `script-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                      <span>{copied === `script-${idx}` ? 'Copied' : 'Copy Script'}</span>
                                    </button>
                                  </div>
                                  <p className="whitespace-pre-wrap leading-6 font-medium">{script.salesScript}</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                  <Send size={13} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
                            <span>Recommended Next Step:</span>
                            <span className="text-[#FF7A45] font-black">{script.nextStepCta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: 4-PHASE ROADMAP - Wide 4-Column Stepper */}
                {outputTab === 'phases' && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-200 flex items-center gap-2">
                      <Zap size={15} className="text-amber-400 shrink-0" />
                      <span>Step-by-step launch schedule from pre-launch buzz to final deadline push.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {result.campaignPhases?.map((phase, idx) => (
                        <div
                          key={`phase-${idx}`}
                          className="rounded-2xl border border-white/10 bg-[#030303] p-5 shadow-xl space-y-3 relative overflow-hidden flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-2">
                              <span className="w-7 h-7 rounded-xl bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white flex items-center justify-center text-xs font-black shrink-0">
                                0{idx + 1}
                              </span>
                              <h4 className="text-xs font-black text-white line-clamp-1">{phase.phaseName}</h4>
                            </div>

                            <div className="space-y-2 text-xs mb-3">
                              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-0.5">Objective</span>
                                <p className="text-white/80 font-medium leading-4 text-[11px]">{phase.objective}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 block mb-0.5">Action</span>
                                <p className="text-white/80 font-medium leading-4 text-[11px]">{phase.keyAction}</p>
                              </div>
                            </div>
                          </div>

                          {phase.copyOrScriptSnippet && (
                            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">Snippet</span>
                                <button
                                  type="button"
                                  onClick={() => copyBlock(`phase-${idx}`, phase.copyOrScriptSnippet)}
                                  className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  {copied === `phase-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copied === `phase-${idx}` ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-white/85 leading-4 italic line-clamp-3">
                                "{phase.copyOrScriptSnippet}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: CMO ECONOMICS & GUARANTEES - 2-Column Responsive */}
                {outputTab === 'economics' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {result.guaranteeAndRiskReversal && (
                      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={18} className="text-teal-400" />
                              <h3 className="text-xs font-black uppercase tracking-wider text-teal-300">
                                Risk-Reversal Guarantee
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyBlock('guarantee', result.guaranteeAndRiskReversal || '')}
                              className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              {copied === 'guarantee' ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copied === 'guarantee' ? 'Copied' : 'Copy Guarantee'}</span>
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-white/90 leading-6 font-medium">
                            {result.guaranteeAndRiskReversal}
                          </p>
                        </div>
                      </div>
                    )}

                    {result.unitEconomicsAdvice && (
                      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp size={18} className="text-orange-400" />
                              <h3 className="text-xs font-black uppercase tracking-wider text-orange-300">
                                Unit Economics & Margin Strategy
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyBlock('economics', result.unitEconomicsAdvice || '')}
                              className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              {copied === 'economics' ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copied === 'economics' ? 'Copied' : 'Copy Strategy'}</span>
                            </button>
                          </div>
                          <div className="whitespace-pre-wrap text-xs sm:text-sm text-white/90 leading-6 font-medium">
                            {result.unitEconomicsAdvice}
                          </div>
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

function ResultCard({
  title,
  body,
  items,
  large,
  icon,
  onCopy,
  isCopied,
}: {
  title: string;
  body?: string;
  items?: string[];
  large?: boolean;
  icon?: React.ReactNode;
  onCopy?: () => void;
  isCopied?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 [&>svg]:text-muted-foreground">
          {icon}
          <span>{title}</span>
        </h3>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      {body && (
        <div className={`whitespace-pre-wrap text-xs sm:text-sm leading-6 sm:leading-7 text-white/85 ${large ? 'font-medium' : ''}`}>
          {body}
        </div>
      )}

      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2.5 text-xs sm:text-sm leading-6 text-white/80">
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF5533]" size={24} /></div>}>
      <ToolWorkspaceContent />
    </Suspense>
  );
}
