'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  FileSpreadsheet
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

export default function GrowthPilot2Page() {
  const [activeTab, setActiveTab] = useState<'ad_pilot' | 'pilot_tag' | 'intent_engine' | 'retention_matrix' | 'catalog_sync'>('ad_pilot');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
  const [catalog, setCatalog] = useState([
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
          eventSourceUrl: window.location.href,
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
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 lg:p-10 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* TOP STATUS HERO HEADER */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF5533]/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 -bottom-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-[#FF7A45]">
                <Cpu size={14} className="animate-pulse" />
                <span>GrowthPilot 2.0 Autonomous Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400">Markopolo-Grade CEP & Media Buying</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Autonomous Ad Pilot & Retention Hub
              </h1>

              <p className="max-w-2xl text-xs sm:text-sm text-white/60 leading-relaxed">
                Full-stack media buying, cookieless Meta CAPI tracking, 384-D vector intent scoring, and 5-channel recovery (including Bangladeshi COD courier fraud prevention).
              </p>

              {/* Real-time Status Badges */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  PilotTag: Active (~3.8KB)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Radio size={12} />
                  Meta CAPI: Ready (EMQ: 9.2/10)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck size={12} />
                  F-Commerce COD Guard: Armed
                </span>
              </div>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={syncBrandBrain}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs font-black text-[#FF7A45] hover:bg-orange-500/20 transition cursor-pointer"
              >
                <Zap size={15} />
                <span>Sync Brand Brain Context</span>
              </button>

              <Link
                href="/dashboard/marketing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/70 hover:text-white transition"
              >
                <ChevronRight size={15} />
                <span>Classic Growth Tools</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 5-TAB SEGMENTED CONTROLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar">
          {[
            { id: 'ad_pilot', label: '1. Ad Pilot (Media Buying)', icon: Rocket, badge: 'Meta/Google' },
            { id: 'pilot_tag', label: '2. PilotTag & Meta CAPI', icon: Radio, badge: 'Server Tracking' },
            { id: 'intent_engine', label: '3. Intent & Vector Brain', icon: Brain, badge: '384-D' },
            { id: 'retention_matrix', label: '4. Autonomous Retention', icon: MessageCircle, badge: 'COD Protected' },
            { id: 'catalog_sync', label: '5. Catalog & Margin Sync', icon: ShoppingBag, badge: 'SKU Intelligence' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition cursor-pointer shrink-0 border ${
                  active
                    ? 'bg-gradient-to-r from-[#FF473A] to-[#FF8526] text-white border-transparent shadow-lg shadow-[#FF5533]/25'
                    : 'bg-[#0d0d0f] text-white/60 border-white/10 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-black/20 text-white' : 'bg-white/10 text-white/50'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT AREAS */}

        {/* ======================================================== */}
        {/* TAB 1: AD PILOT (MARKOPOLO 1.0 MEDIA BUYING ENGINE)      */}
        {/* ======================================================== */}
        {activeTab === 'ad_pilot' && (
          <div className="space-y-8">
            {/* Input Config Card */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Rocket size={18} className="text-[#FF5533]" />
                    <span>Ad Campaign Launcher & Meta Draft Engine</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Auto-generates 3 distinct psychological hooks, ad copy variations, and 1-click exportable Meta Ads Manager JSON specs.
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
                  <label className="text-[11px] font-black uppercase text-white/60">Product or Offer Angle</label>
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

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleGenerateAds}
                  disabled={generatingAds}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:brightness-110 text-white shadow-xl shadow-[#FF5533]/25 transition cursor-pointer disabled:opacity-50"
                >
                  {generatingAds ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating Markopolo-Grade Campaign...</span>
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

            {/* Ad Pilot Output Showcase */}
            {adPilotResult && (
              <div className="space-y-6">
                {/* Meta Ads Manager Export Bar */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                      M
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Meta Ads Manager Ready Spec</h4>
                      <p className="text-xs text-white/50">One-click copy or download formatted for Meta Marketing API</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy('meta_json', JSON.stringify(adPilotResult.metaAdsDraftSpec, null, 2))}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'meta_json' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedKey === 'meta_json' ? 'Copied Spec' : 'Copy Meta Spec'}</span>
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
                      <span>Download Campaign JSON</span>
                    </button>
                  </div>
                </div>

                {/* 3 Creative Angles Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {adPilotResult.adSets.map((ad, idx) => (
                    <div key={idx} className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-5 sm:p-6 space-y-4 relative flex flex-col justify-between shadow-xl">
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
                          <div className="text-[11px] font-bold text-white/40">Primary Ad Copy:</div>
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
                          <span>{copiedKey === `ad_${idx}` ? 'Copied' : 'Copy Ad'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Autonomous Rules Display */}
                {adPilotResult.autoPilotRules && (
                  <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-4">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Sliders size={16} className="text-[#FF5533]" />
                      <span>Autonomous Budget Auto-Pilot Rules</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {adPilotResult.autoPilotRules.map((rule, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                          <div className="text-xs font-black text-white">{rule.ruleName}</div>
                          <div className="text-[11px] text-amber-400 font-mono">IF: {rule.condition}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">THEN: {rule.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PILOTTAG & META CONVERSIONS API (CAPI) HUB        */}
        {/* ======================================================== */}
        {activeTab === 'pilot_tag' && (
          <div className="space-y-8">
            {/* Script Tag Snippet Box */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Radio size={18} className="text-emerald-400" />
                    <span>PilotTag Client Tracker & Server CAPI Hub</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Cookieless first-party tracking snippet capturing scroll depth, exit intent, and button hesitation patterns.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/50">Site ID:</span>
                  <input
                    type="text"
                    value={siteId}
                    onChange={e => setSiteId(e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white font-mono w-32 focus:outline-none"
                  />
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{tagSnippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy('snippet', tagSnippet)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'snippet' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy Script Tag'}</span>
                </button>
              </div>

              {/* Live Meta CAPI Configuration (Optional live dispatch) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-black uppercase text-white/60">Meta Pixel ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 192837465019"
                    value={pixelId}
                    onChange={e => setPixelId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-white/60">Meta Conversions API Token</label>
                  <input
                    type="password"
                    placeholder="EAA..."
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-white/60">Meta Test Event Code</label>
                  <input
                    type="text"
                    placeholder="TEST12345"
                    value={testEventCode}
                    onChange={e => setTestEventCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Event Simulator Triggers */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-white/60">
                  Simulate Real-Time Server CAPI Events:
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSimulateCapi('PageView')}
                    disabled={simulatingCapi}
                    className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition cursor-pointer"
                  >
                    Send PageView Event
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCapi('AddToCart')}
                    disabled={simulatingCapi}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    Send AddToCart Event
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
            </div>

            {/* Live Terminal Log */}
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <Code size={15} className="text-emerald-400" />
                  <span>Real-Time CAPI Dispatch Terminal & SHA-256 Inspector</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-400">
                  {capiLog.length} Event(s) Captured
                </span>
              </div>

              <div className="rounded-2xl bg-black/80 border border-white/5 p-4 max-h-80 overflow-y-auto space-y-3 font-mono text-xs">
                {capiLog.length === 0 ? (
                  <div className="text-white/30 text-center py-6">
                    No events sent yet. Click any simulation button above to dispatch a test payload.
                  </div>
                ) : (
                  capiLog.map((log, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">{log.eventName}</span>
                        <span className="text-white/40">{log.eventId}</span>
                        <span className="text-blue-400 font-bold">EMQ Match: {log.emqScore}/10</span>
                      </div>
                      <div className="text-[10px] text-white/60">{log.message}</div>
                      <div className="text-[10px] text-white/40 truncate">
                        Hashed User Identity: em: {log.preparedPayload?.data[0]?.user_data?.em?.slice(0, 16)}... | ph: {log.preparedPayload?.data[0]?.user_data?.ph?.slice(0, 16)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: INTENT & 384-D VECTOR ENGINE                      */}
        {/* ======================================================== */}
        {activeTab === 'intent_engine' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  <span>384-D Vector Intent Scoring & Margin Guardrails</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Evaluates micro-interaction vectors (mouse hesitation, scroll velocity, comparison rate) and protects profit margins before automated offers are unlocked.
                </p>
              </div>

              {/* Intent Meter & Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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

        {/* ======================================================== */}
        {/* TAB 4: AUTONOMOUS RETENTION MATRIX (MARKOPOLO 2.0 CEP)   */}
        {/* ======================================================== */}
        {activeTab === 'retention_matrix' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <MessageCircle size={18} className="text-emerald-400" />
                    <span>5-Channel Autonomous Retention Matrix & COD Anti-Fraud Agent</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Multi-channel abandoned checkout recovery with specialized Bangladeshi Cash on Delivery (COD) courier verification.
                  </p>
                </div>

                <div className="flex items-center gap-2">
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
                      <span>Orchestrating 5-Channel Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Run Autonomous Retention Engine</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Retention Results Display */}
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

                {/* 5-Channel Recovery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Channel 1: WhatsApp */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                        <MessageCircle size={15} /> WhatsApp Cloud Trigger
                      </span>
                      <span className="text-[10px] text-white/40">{retentionResult.channels.whatsapp.triggerDelay}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                      {retentionResult.channels.whatsapp.message}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {retentionResult.channels.whatsapp.interactiveButtons.map((btn, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Button: {btn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Channel 2: Urgent SMS */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-2">
                        <Smartphone size={15} /> Urgent SMS Gateway
                      </span>
                      <span className="text-[10px] text-white/40">{retentionResult.channels.sms.triggerDelay}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                      {retentionResult.channels.sms.text}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">
                      Length: {retentionResult.channels.sms.text.length} chars (1 SMS credit)
                    </div>
                  </div>

                  {/* Channel 3: Email */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-3">
                    <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-2">
                      <Mail size={15} /> Email Sequence
                    </span>
                    <div className="text-xs font-bold text-white">{retentionResult.channels.email.subject}</div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/80 whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {retentionResult.channels.email.body}
                    </div>
                  </div>

                  {/* Channel 4: AI Voice Call Script */}
                  <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 space-y-3">
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

        {/* ======================================================== */}
        {/* TAB 5: CATALOG & MARGIN SYNC                             */}
        {/* ======================================================== */}
        {activeTab === 'catalog_sync' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-amber-400" />
                    <span>Product Catalog Ingestion & SKU Margin Engine</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Connect Shopify, WooCommerce, or direct CSV. Analyzes profit margins and launches ad sets per SKU.
                  </p>
                </div>
              </div>

              {/* Catalog Table */}
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
                        setActiveTab('ad_pilot');
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
    </div>
  );
}
