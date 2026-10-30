'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Rocket,
  Zap,
  ShieldCheck,
  Cpu,
  Brain,
  Layers,
  Radio,
  Send,
  Sliders,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  PhoneCall,
  Mail,
  Smartphone,
  Globe,
  Bell,
  Code,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Target,
  Flame,
  UserCheck,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  Activity,
  PlayCircle
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';

const BRAND_BRAIN_KEY = 'marketing_brand_profile';

interface AdSetResult {
  name: string;
  targetPersona: string;
  dailyBudget: string;
  creativeAngle: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  visualPrompt: string;
  hookVariation: string;
}

interface AdPilotResponse {
  campaignName: string;
  recommendedBidStrategy: string;
  suggestedAudienceInterests: string[];
  adSets: AdSetResult[];
  autoPilotRules: Array<{ ruleName: string; condition: string; action: string }>;
  metaAdsDraftSpec: any;
}

interface RetentionResponse {
  retentionStrategySummary: string;
  marginGuardrailStatus: string;
  courierRiskAssessment: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number;
    verificationAdvice: string;
    fakeOrderProbability: string;
  };
  channels: {
    whatsapp: {
      triggerDelay: string;
      message: string;
      interactiveButtons: string[];
    };
    sms: {
      triggerDelay: string;
      text: string;
    };
    email: {
      subject: string;
      previewText: string;
      body: string;
    };
    webPush: {
      title: string;
      body: string;
    };
    aiVoiceCallScript: {
      agentName: string;
      firstGreeting: string;
      hesitationResolution: string;
      orderConfirmationClosing: string;
    };
  };
}

export default function GrowthPilot2Website() {
  const [activeTab, setActiveTab] = useState<'ad_pilot' | 'pilot_tag' | 'intent_engine' | 'retention_matrix' | 'catalog_sync'>('ad_pilot');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  // Brand Brain Context
  const [brandName, setBrandName] = useState('GrowthPilot Client');
  const [productService, setProductService] = useState('Premium Smart Watch & Fitness Tracker');
  const [targetAudience, setTargetAudience] = useState('Tech-savvy urban shoppers, youth & professionals in Bangladesh');
  const [offer, setOffer] = useState('Flat 20% Off + Free Home Delivery with Cash on Delivery');
  const [hasBrandBrain, setHasBrandBrain] = useState(false);

  // Tab 1: Ad Pilot States
  const [platform, setPlatform] = useState<'meta' | 'google' | 'tiktok'>('meta');
  const [objective, setObjective] = useState<'cod_orders' | 'sales' | 'leads'>('cod_orders');
  const [dailyBudget, setDailyBudget] = useState(1500);
  const [currency, setCurrency] = useState('BDT');
  const [adLanguage, setAdLanguage] = useState<'Bengali' | 'English' | 'Banglish'>('Bengali');
  const [generatingAds, setGeneratingAds] = useState(false);
  const [adPilotResult, setAdPilotResult] = useState<AdPilotResponse | null>(null);
  const [adError, setAdError] = useState('');

  // Tab 2: PilotTag & CAPI States
  const [siteId, setSiteId] = useState('GP_STORE_99X');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [simulatingCapi, setSimulatingCapi] = useState(false);
  const [capiLog, setCapiLog] = useState<any[]>([]);

  // Tab 3: Intent & Margin Engine States
  const [grossMargin, setGrossMargin] = useState(38);
  const [intentScore, setIntentScore] = useState(82);

  // Tab 4: Autonomous Retention States
  const [retentionCustomer, setRetentionCustomer] = useState('Tanvir Ahmed');
  const [retentionPhone, setRetentionPhone] = useState('01711223344');
  const [cartAmount, setCartAmount] = useState(2850);
  const [retentionStage, setRetentionStage] = useState<'cart' | 'checkout' | 'pending_cod_confirmation'>('pending_cod_confirmation');
  const [generatingRetention, setGeneratingRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<RetentionResponse | null>(null);
  const [retentionError, setRetentionError] = useState('');

  // Tab 5: Catalog Demo SKUs
  const [catalog] = useState([
    { sku: 'WAT-01', name: 'Ultra AMOLED Smartwatch', cost: 1200, price: 2450, margin: 51, stock: 45 },
    { sku: 'AUD-02', name: 'ANC Wireless Earbuds Pro', cost: 850, price: 1890, margin: 55, stock: 80 },
    { sku: 'PWR-03', name: '20000mAh 65W Fast Powerbank', cost: 1400, price: 2600, margin: 46, stock: 22 },
  ]);

  // Load Brand Brain on Mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRAND_BRAIN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.businessName) setBrandName(parsed.businessName);
        if (parsed.productService) setProductService(parsed.productService);
        if (parsed.audience) setTargetAudience(parsed.audience);
        if (parsed.offer) setOffer(parsed.offer);
        setHasBrandBrain(true);
      }
    } catch {}
  }, []);

  const handleCopy = (key: string, text: string) => {
    copyTextSafely(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const syncBrandBrain = () => {
    try {
      const stored = localStorage.getItem(BRAND_BRAIN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.businessName) setBrandName(parsed.businessName);
        if (parsed.productService) setProductService(parsed.productService);
        if (parsed.audience) setTargetAudience(parsed.audience);
        if (parsed.offer) setOffer(parsed.offer);
        setHasBrandBrain(true);
        alert('Brand Brain context synchronized into GrowthPilot 2.0!');
      } else {
        alert('No Brand Brain found. Please configure your business profile first.');
      }
    } catch {}
  };

  const scrollToConsole = (tabKey: typeof activeTab) => {
    setActiveTab(tabKey);
    consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Generate Ad Campaign (Ad Pilot)
  const handleGenerateAds = async () => {
    setGeneratingAds(true);
    setAdError('');
    try {
      const res = await fetch('/api/gp2/generate-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: brandName,
          productService,
          targetAudience,
          offer,
          platform,
          objective,
          budgetDaily: dailyBudget,
          currency,
          language: adLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate campaign');
      setAdPilotResult(data.data);
    } catch (err: any) {
      setAdError(err.message || 'Generation error');
    } finally {
      setGeneratingAds(false);
    }
  };

  // Simulate CAPI Dispatch
  const handleSimulateCapi = async (eventName: 'Purchase' | 'AddToCart' | 'InitiateCheckout' | 'PageView') => {
    setSimulatingCapi(true);
    try {
      const res = await fetch('/api/gp2/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : 'https://growthpilot.ai',
          user: {
            email: 'customer.test@gmail.com',
            phone: '8801711223344',
            firstName: 'Tanvir',
            city: 'Dhaka',
            country: 'BD',
          },
          customData: {
            value: eventName === 'Purchase' ? 2450 : 1850,
            currency: 'BDT',
            contentName: productService,
            contentIds: ['SKU_GP2_001'],
          },
          pixelId: pixelId || undefined,
          accessToken: accessToken || undefined,
          testEventCode: testEventCode || undefined,
        }),
      });
      const data = await res.json();
      setCapiLog(prev => [data, ...prev.slice(0, 9)]);
    } catch (err: any) {
      alert('CAPI Simulation error: ' + err.message);
    } finally {
      setSimulatingCapi(false);
    }
  };

  // Generate Retention Matrix
  const handleGenerateRetention = async () => {
    setGeneratingRetention(true);
    setRetentionError('');
    try {
      const res = await fetch('/api/gp2/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: retentionCustomer,
          customerPhone: retentionPhone,
          productName: productService,
          cartTotal: cartAmount,
          currency,
          abandonedStage: retentionStage,
          grossMarginPercent: grossMargin,
          language: adLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate retention matrix');
      setRetentionResult(data.data);
    } catch (err: any) {
      setRetentionError(err.message || 'Retention generation error');
    } finally {
      setGeneratingRetention(false);
    }
  };

  const tagSnippet = `<!-- GrowthPilot 2.0 PilotTag -->\n<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://growthpilot.ai'}/pilot-tag.js" data-site-id="${siteId}" async></script>`;

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-[#FF5533]/30 font-sans relative overflow-x-hidden">
      
      {/* ======================================================== */}
      {/* 1. BESPOKE GROWTHPILOT 2.0 STANDALONE WEBSITE NAVBAR    */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050507]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Sub-Brand Badge */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/growthpilot-2" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF473A] via-[#FF622E] to-[#FF8526] p-0.5 shadow-lg shadow-[#FF5533]/25 group-hover:scale-105 transition-transform flex items-center justify-center">
                <Cpu size={22} className="text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-[#FF7A45] transition-colors">
                    GROWTHPILOT
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-[10px] font-black text-white tracking-widest uppercase shadow-sm">
                    2.0
                  </span>
                </div>
                <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
                  Autonomous Ad & Retention CEP
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-white/70">
            <button
              type="button"
              onClick={() => scrollToConsole('ad_pilot')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'ad_pilot' ? 'text-[#FF7A45] bg-white/[0.04]' : 'hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Ad Pilot
            </button>
            <button
              type="button"
              onClick={() => scrollToConsole('pilot_tag')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'pilot_tag' ? 'text-[#FF7A45] bg-white/[0.04]' : 'hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              PilotTag & CAPI
            </button>
            <button
              type="button"
              onClick={() => scrollToConsole('intent_engine')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'intent_engine' ? 'text-[#FF7A45] bg-white/[0.04]' : 'hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Vector Intent
            </button>
            <button
              type="button"
              onClick={() => scrollToConsole('retention_matrix')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'retention_matrix' ? 'text-[#FF7A45] bg-white/[0.04]' : 'hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Retention & COD Guard
            </button>
            <button
              type="button"
              onClick={() => scrollToConsole('catalog_sync')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'catalog_sync' ? 'text-[#FF7A45] bg-white/[0.04]' : 'hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Catalog Sync
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Athena 2.0 LEM Online</span>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <span>Classic Dashboard</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SHOWCASE (MARKOPOLO.AI LEVEL SOPHISTICATION)      */}
      {/* ======================================================== */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-white/[0.06]">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-gradient-to-b from-[#FF5533]/20 via-purple-500/10 to-transparent blur-3xl opacity-80" />
        <div className="pointer-events-none absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#FF7A45] shadow-inner">
            <Sparkles size={14} className="text-[#FF5533]" />
            <span>Markopolo 1.0 & 2.0 Leapfrog Technology</span>
            <span className="w-1 h-1 rounded-full bg-orange-400" />
            <span className="text-white/80">Built for High-Velocity D2C & F-Commerce</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            The First Autonomous Media Buying &{' '}
            <span className="bg-gradient-to-r from-[#FF473A] via-[#FF7A45] to-[#FFA845] bg-clip-text text-transparent">
              Customer Engagement Platform
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-white/60 leading-relaxed font-normal">
            Eliminate fragmented tools and wasted ad spend. GrowthPilot 2.0 fuses cookieless server-side Meta CAPI tracking, 384-D vector intent scoring, and 5-channel recovery with specialized Bangladeshi COD fraud verification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <button
              type="button"
              onClick={() => scrollToConsole('ad_pilot')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:brightness-110 text-white text-xs sm:text-sm font-black shadow-xl shadow-[#FF5533]/30 transition cursor-pointer"
            >
              <Rocket size={16} />
              <span>Launch Autonomous Console</span>
            </button>

            <button
              type="button"
              onClick={syncBrandBrain}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Zap size={16} className="text-[#FF7A45]" />
              <span>{hasBrandBrain ? 'Sync Brand Brain' : 'Connect Brand Brain'}</span>
            </button>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-left space-y-1">
              <div className="text-xl font-black text-white">~3.8KB</div>
              <div className="text-xs font-bold text-white/50">PilotTag Tracking Snippet</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-left space-y-1">
              <div className="text-xl font-black text-emerald-400">9.4/10</div>
              <div className="text-xs font-bold text-white/50">Meta CAPI Event Match (EMQ)</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-left space-y-1">
              <div className="text-xl font-black text-blue-400">384-D</div>
              <div className="text-xs font-bold text-white/50">Vector Intent Embeddings</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-left space-y-1">
              <div className="text-xl font-black text-amber-400">-52%</div>
              <div className="text-xs font-bold text-white/50">F-Commerce Courier Returns</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. THE AUTONOMOUS APP CONSOLE (5 INTEGRATED ENGINES)    */}
      {/* ======================================================== */}
      <section ref={consoleRef} className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Console Header & Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-[#FF5533]">
                Live Command Console
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Autonomous Growth Architecture
              </h2>
            </div>

            {/* Segmented 5-Tab Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'ad_pilot', label: 'Ad Pilot', icon: Rocket, tag: 'Meta/Google' },
                { id: 'pilot_tag', label: 'PilotTag & CAPI', icon: Radio, tag: 'Tracking' },
                { id: 'intent_engine', label: 'Vector Intent', icon: Brain, tag: '384-D' },
                { id: 'retention_matrix', label: 'Autonomous Retention', icon: MessageCircle, tag: '5-Channel' },
                { id: 'catalog_sync', label: 'Catalog Sync', icon: ShoppingBag, tag: 'SKU' },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 border ${
                      active
                        ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white border-transparent shadow-lg shadow-[#FF5533]/20'
                        : 'bg-[#0d0d10] text-white/60 border-white/10 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ENGINE 1: AD PILOT (MARKOPOLO 1.0 MEDIA BUYING) */}
          {activeTab === 'ad_pilot' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Rocket size={18} className="text-[#FF5533]" />
                      <span>Multi-Platform Ad Launcher & Meta Draft Spec Generator</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                      Generates 3 psychological angles, creative copy variations, and import-ready Meta Ads Manager specs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['meta', 'google', 'tiktok'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition ${
                          platform === p ? 'bg-[#FF5533] text-white border-transparent' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Business / Brand Name</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Product / Service / Offer</label>
                    <input
                      type="text"
                      value={productService}
                      onChange={e => setProductService(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Target ICP Audience</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={e => setTargetAudience(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Irresistible Offer / Guarantee</label>
                    <input
                      type="text"
                      value={offer}
                      onChange={e => setOffer(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Daily Budget</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="number"
                        value={dailyBudget}
                        onChange={e => setDailyBudget(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                      />
                      <span className="text-xs font-bold text-white/60">{currency}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Campaign Objective</label>
                    <select
                      value={objective}
                      onChange={e => setObjective(e.target.value as any)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    >
                      <option value="cod_orders" className="bg-[#111]">F-Commerce COD Orders</option>
                      <option value="sales" className="bg-[#111]">Website Purchase (Sales)</option>
                      <option value="leads" className="bg-[#111]">Messenger / WhatsApp Leads</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Copywriting Language</label>
                    <select
                      value={adLanguage}
                      onChange={e => setAdLanguage(e.target.value as any)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-[#FF5533] focus:outline-none"
                    >
                      <option value="Bengali" className="bg-[#111]">বাংলা (High Converting BD)</option>
                      <option value="Banglish" className="bg-[#111]">Banglish (Colloquial Youth)</option>
                      <option value="English" className="bg-[#111]">English (Global D2C)</option>
                    </select>
                  </div>
                </div>

                {adError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {adError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateAds}
                    disabled={generatingAds}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:brightness-110 text-white shadow-xl shadow-[#FF5533]/25 transition cursor-pointer disabled:opacity-50"
                  >
                    {generatingAds ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Generating Campaign Specs...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Launch Autonomous Ad Pilot</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Ad Sets Result */}
              {adPilotResult && (
                <div className="space-y-6">
                  {/* Meta Spec Export Bar */}
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                        M
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Meta Ads Manager Spec (One-Click Ready)</h4>
                        <p className="text-xs text-white/50">Compatible with Meta Graph API & Bulk CSV Import</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy('meta_json', JSON.stringify(adPilotResult.metaAdsDraftSpec, null, 2))}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'meta_json' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedKey === 'meta_json' ? 'Copied' : 'Copy Meta Spec'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(adPilotResult, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `meta_campaign_${Date.now()}.json`;
                          a.click();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-xs font-black text-white transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Download size={14} />
                        <span>Download JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Creative Angles */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {adPilotResult.adSets.map((ad, idx) => (
                      <div key={idx} className="rounded-3xl border border-white/10 bg-[#0d0d10] p-5 sm:p-6 space-y-4 relative flex flex-col justify-between shadow-xl">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-[#FF5533] border border-orange-500/20">
                              Angle {idx + 1}: {ad.creativeAngle}
                            </span>
                            <span className="text-[10px] font-bold text-white/40">{ad.dailyBudget}</span>
                          </div>

                          <div>
                            <div className="text-[11px] font-bold text-white/40">3-Sec Video / Copy Hook:</div>
                            <div className="mt-1 text-xs font-black text-[#FF7A45] p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15">
                              "{ad.hookVariation}"
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-bold text-white/40">Primary Ad Body:</div>
                            <p className="mt-1 text-xs text-white/80 leading-relaxed whitespace-pre-wrap line-clamp-6">
                              {ad.primaryText}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="text-[11px] font-black text-white">{ad.headline}</div>
                            <div className="text-[10px] text-white/50">{ad.description}</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                            <span className="text-[10px] font-black uppercase text-white/40">Midjourney / Flux Visual Prompt:</span>
                            <p className="text-[10px] font-mono text-purple-300 leading-normal">
                              {ad.visualPrompt}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                            CTA: {ad.callToAction}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`ad_${idx}`, `${ad.headline}\n\n${ad.primaryText}\n\nCTA: ${ad.callToAction}`)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `ad_${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedKey === `ad_${idx}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENGINE 2: PILOTTAG & SERVER CAPI */}
          {activeTab === 'pilot_tag' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Radio size={18} className="text-emerald-400" />
                    <span>PilotTag Client Tracker & Server Meta CAPI Hub</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    First-party cookieless tracking bypassing Apple iOS 14.5+ ATT and ad-blockers.
                  </p>
                </div>

                {/* Embed snippet */}
                <div className="relative rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
                  <pre>{tagSnippet}</pre>
                  <button
                    type="button"
                    onClick={() => handleCopy('snippet', tagSnippet)}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'snippet' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>

                {/* Event Simulator */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-white/60">
                    Test Live Server CAPI Events:
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSimulateCapi('PageView')}
                      disabled={simulatingCapi}
                      className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition cursor-pointer"
                    >
                      Send PageView
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCapi('AddToCart')}
                      disabled={simulatingCapi}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
                    >
                      Send AddToCart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCapi('Purchase')}
                      disabled={simulatingCapi}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                    >
                      Send Purchase Event (৳2,450)
                    </button>
                  </div>
                </div>

                {/* Terminal logs */}
                <div className="rounded-2xl bg-black/80 border border-white/5 p-4 max-h-72 overflow-y-auto space-y-2.5 font-mono text-xs">
                  {capiLog.length === 0 ? (
                    <div className="text-white/30 text-center py-6">
                      Terminal listening. Click a button above to dispatch a test CAPI payload.
                    </div>
                  ) : (
                    capiLog.map((log, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-bold">{log.eventName}</span>
                          <span className="text-blue-400 font-bold">EMQ Match: {log.emqScore}/10</span>
                        </div>
                        <div className="text-[10px] text-white/60">{log.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ENGINE 3: INTENT & VECTOR ENGINE */}
          {activeTab === 'intent_engine' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Brain size={18} className="text-purple-400" />
                    <span>384-D Vector Intent Scoring & Margin Guardrails</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Evaluates micro-interaction vectors (mouse hesitation, scroll velocity, comparison rate) and protects profit margins before automated offers are unlocked.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white/60">Real-Time Buyer Intent Score</span>
                      <span className="text-xl font-black text-emerald-400">{intentScore}/100</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={intentScore}
                      onChange={e => setIntentScore(Number(e.target.value))}
                      className="w-full accent-[#FF5533]"
                    />

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      {intentScore > 75
                        ? '🎯 High-Intent Checkout Drop: Immediate WhatsApp / SMS recovery triggered.'
                        : intentScore > 40
                        ? '👀 Comparison Browser: Gentle social proof push via Web Push / Email.'
                        : '🤖 Casual Scroller or Low Intent: No aggressive discounts offered.'}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white/60">Product Gross Margin Guardrail</span>
                      <span className="text-xl font-black text-[#FF7A45]">{grossMargin}%</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={grossMargin}
                      onChange={e => setGrossMargin(Number(e.target.value))}
                      className="w-full accent-[#FF5533]"
                    />

                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                      Max Safe Discount Allowed: <strong className="text-white">{Math.floor(grossMargin * 0.35)}%</strong>
                      <div className="text-[10px] text-white/50 mt-0.5">
                        Protects net business cash flow. Autonomous agents will NEVER offer discounts exceeding this threshold.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGINE 4: RETENTION & COD GUARD */}
          {activeTab === 'retention_matrix' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <MessageCircle size={18} className="text-emerald-400" />
                      <span>5-Channel Autonomous Retention Matrix & COD Anti-Fraud Agent</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-1">
                      Multi-channel abandoned checkout recovery with specialized Bangladeshi Cash on Delivery (COD) courier verification.
                    </p>
                  </div>

                  <select
                    value={retentionStage}
                    onChange={e => setRetentionStage(e.target.value as any)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="pending_cod_confirmation" className="bg-[#111]">Pending COD Order Confirmation</option>
                    <option value="checkout" className="bg-[#111]">Checkout Drop-off</option>
                    <option value="cart" className="bg-[#111]">Cart Abandonment</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Customer Name</label>
                    <input
                      type="text"
                      value={retentionCustomer}
                      onChange={e => setRetentionCustomer(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Phone (BD Number)</label>
                    <input
                      type="text"
                      value={retentionPhone}
                      onChange={e => setRetentionPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-white/60">Cart Value ({currency})</label>
                    <input
                      type="number"
                      value={cartAmount}
                      onChange={e => setCartAmount(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {retentionError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {retentionError}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleGenerateRetention}
                    disabled={generatingRetention}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white shadow-xl shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
                  >
                    {generatingRetention ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Orchestrating Retention Signals...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Run Retention & COD Agent</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {retentionResult && (
                <div className="space-y-6">
                  {/* Courier Anti-Fraud Scorecard */}
                  <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">
                          F-Commerce COD Courier Fraud Assessment
                        </h4>
                        <p className="text-xs text-white/60 mt-0.5">
                          {retentionResult.courierRiskAssessment.verificationAdvice}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase text-white/40">Risk Level</div>
                        <div className="text-sm font-black text-amber-300">
                          {retentionResult.courierRiskAssessment.riskLevel} ({retentionResult.courierRiskAssessment.fakeOrderProbability})
                        </div>
                      </div>
                      <div className="h-10 w-px bg-white/10" />
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase text-white/40">Margin Status</div>
                        <div className="text-sm font-black text-emerald-400">
                          {retentionResult.marginGuardrailStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Channels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                          <MessageCircle size={15} /> WhatsApp Cloud Trigger
                        </span>
                        <span className="text-[10px] text-white/40">{retentionResult.channels.whatsapp.triggerDelay}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                        {retentionResult.channels.whatsapp.message}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-2">
                          <Smartphone size={15} /> Urgent SMS Gateway
                        </span>
                        <span className="text-[10px] text-white/40">{retentionResult.channels.sms.triggerDelay}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                        {retentionResult.channels.sms.text}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 space-y-3">
                      <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-2">
                        <Mail size={15} /> Email Sequence
                      </span>
                      <div className="text-xs font-bold text-white">{retentionResult.channels.email.subject}</div>
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/80 whitespace-pre-wrap leading-relaxed line-clamp-6">
                        {retentionResult.channels.email.body}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 space-y-3">
                      <span className="text-xs font-black uppercase text-[#FF7A45] flex items-center gap-2">
                        <PhoneCall size={15} /> AI Conversational Voice Script
                      </span>
                      <div className="text-xs font-bold text-white">Agent: {retentionResult.channels.aiVoiceCallScript.agentName}</div>
                      <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/15 text-xs text-white/90 space-y-2">
                        <div><strong className="text-orange-300">Greeting:</strong> {retentionResult.channels.aiVoiceCallScript.firstGreeting}</div>
                        <div><strong className="text-orange-300">Resolution:</strong> {retentionResult.channels.aiVoiceCallScript.hesitationResolution}</div>
                        <div><strong className="text-orange-300">Closing:</strong> {retentionResult.channels.aiVoiceCallScript.orderConfirmationClosing}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENGINE 5: CATALOG SYNC */}
          {activeTab === 'catalog_sync' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-amber-400" />
                    <span>Product Catalog Ingestion & SKU Margin Engine</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Connect Shopify, WooCommerce, or direct CSV. Analyzes profit margins and launches ad sets per SKU.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {catalog.map(item => (
                    <div key={item.sku} className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white/50">{item.sku}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.margin}% Margin
                        </span>
                      </div>

                      <div className="text-sm font-black text-white">{item.name}</div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white/[0.03] rounded-xl border border-white/5">
                        <div>
                          <div className="text-[10px] text-white/40">Cost</div>
                          <div className="font-bold">৳{item.cost}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40">Price</div>
                          <div className="font-bold text-[#FF5533]">৳{item.price}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40">Stock</div>
                          <div className="font-bold text-white">{item.stock}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProductService(item.name);
                          scrollToConsole('ad_pilot');
                        }}
                        className="w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#FF7A45] text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border border-orange-500/20"
                      >
                        <Rocket size={13} />
                        <span>Launch Ad for this SKU</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. MARKOPOLO VS GROWTHPILOT 2.0 COMPARISON TABLE          */}
      {/* ======================================================== */}
      <section className="py-16 border-t border-white/[0.06] bg-black/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF5533]">Platform Showdown</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Why GrowthPilot 2.0 Outperforms Markopolo in Real Markets
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d0d10] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-4 text-white/50 font-black uppercase">Capability</th>
                    <th className="p-4 text-white/70 font-black">Markopolo AI</th>
                    <th className="p-4 text-[#FF7A45] font-black bg-orange-500/5">GrowthPilot 2.0</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-4 font-bold text-white">Meta & Google CAPI Tracking</td>
                    <td className="p-4 text-white/70">✅ Supported</td>
                    <td className="p-4 text-emerald-400 font-bold bg-orange-500/5">✅ Supported (9.4/10 EMQ)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">F-Commerce COD Courier Anti-Fraud</td>
                    <td className="p-4 text-rose-400">❌ Not Supported (Zero COD Context)</td>
                    <td className="p-4 text-emerald-400 font-bold bg-orange-500/5">✅ Pathao / Steadfast / RedX Integration</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Language & Cultural Tone</td>
                    <td className="p-4 text-white/70">English Only</td>
                    <td className="p-4 text-emerald-400 font-bold bg-orange-500/5">✅ Bengali, Banglish & Global English</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">1-Click Meta Ads Manager Draft Spec</td>
                    <td className="p-4 text-white/70">Locked in Enterprise Plan</td>
                    <td className="p-4 text-emerald-400 font-bold bg-orange-500/5">✅ Built-in JSON & API Dispatch</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Margin Protection Guardrail</td>
                    <td className="p-4 text-white/70">Basic rule checks</td>
                    <td className="p-4 text-emerald-400 font-bold bg-orange-500/5">✅ Real-time profit safety algorithm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. BESPOKE WEBSITE FOOTER                                 */}
      {/* ======================================================== */}
      <footer className="border-t border-white/[0.08] bg-[#050507] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF473A] to-[#FF8526] p-0.5 flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white">GrowthPilot 2.0</span>
              <p className="text-[10px] text-white/40">Next-Gen Autonomous Media Buying & CEP</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-white/60">
            <Link href="/dashboard" className="hover:text-white transition">Classic Dashboard</Link>
            <span>•</span>
            <button type="button" onClick={() => scrollToConsole('pilot_tag')} className="hover:text-white transition cursor-pointer">
              Install PilotTag
            </button>
            <span>•</span>
            <Link href="/dashboard/brand" className="hover:text-white transition">Brand Brain</Link>
          </div>

          <div className="text-[11px] text-white/40">
            © {new Date().getFullYear()} GrowthPilot AI. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
