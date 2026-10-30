'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Database,
  Brain,
  BarChart3,
  Users,
  Megaphone,
  FileText,
  Boxes,
  CreditCard,
  Palette,
  Settings,
  HelpCircle,
  Menu,
  X,
  Zap,
  Radio,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  PhoneCall,
  Mail,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Download,
  Loader2,
  Sparkles,
  ArrowRight,
  Code,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Bell,
  Search,
  User,
  Plus
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';

const BRAND_BRAIN_KEY = 'marketing_brand_profile';

type NavPage = 
  | 'dashboard'
  | 'data_room'
  | 'memory'
  | 'analytics'
  | 'leads'
  | 'campaigns'
  | 'content'
  | 'integrations'
  | 'billing'
  | 'brand_kit'
  | 'settings'
  | 'support';

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
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // User Profile
  const userName = 'Najmol';
  const fullName = 'Najmol Hasan';
  const userEmail = 'najmol@growthpilot.ai';

  // Brand Brain Context
  const [brandName, setBrandName] = useState('GrowthPilot Client');
  const [productService, setProductService] = useState('Premium Smart Watch & Fitness Tracker');
  const [targetAudience, setTargetAudience] = useState('Tech-savvy urban shoppers, youth & professionals in Bangladesh');
  const [offer, setOffer] = useState('Flat 20% Off + Free Home Delivery with Cash on Delivery');
  const [hasBrandBrain, setHasBrandBrain] = useState(false);

  // Campaign Agent States
  const [campaignTab, setCampaignTab] = useState<'ad_pilot' | 'recovery_flows'>('ad_pilot');
  const [platform, setPlatform] = useState<'meta' | 'google' | 'tiktok'>('meta');
  const [objective, setObjective] = useState<'cod_orders' | 'sales' | 'leads'>('cod_orders');
  const [dailyBudget, setDailyBudget] = useState(1500);
  const [currency, setCurrency] = useState('BDT');
  const [adLanguage, setAdLanguage] = useState<'Bengali' | 'English' | 'Banglish'>('Bengali');
  const [generatingAds, setGeneratingAds] = useState(false);
  const [adPilotResult, setAdPilotResult] = useState<AdPilotResponse | null>(null);
  const [adError, setAdError] = useState('');

  // PilotTag & CAPI States
  const [siteId, setSiteId] = useState('GP_STORE_99X');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [simulatingCapi, setSimulatingCapi] = useState(false);
  const [capiLog, setCapiLog] = useState<any[]>([
    {
      eventName: 'PageView',
      eventId: 'gp2_evt_init_01',
      emqScore: 9.2,
      message: 'Verified server-side hit via PilotTag proxy',
      timestamp: 'Just now'
    },
    {
      eventName: 'CheckoutHesitation',
      eventId: 'gp2_evt_init_02',
      emqScore: 9.4,
      message: 'Detected 1,840ms hesitation on "অর্ডার করুন" button',
      timestamp: '2 mins ago'
    }
  ]);

  // Memory & Intent States
  const [intentScore, setIntentScore] = useState(84);
  const [grossMargin, setGrossMargin] = useState(42);

  // Retention States
  const [retentionCustomer, setRetentionCustomer] = useState('Tanvir Ahmed');
  const [retentionPhone, setRetentionPhone] = useState('01711223344');
  const [cartAmount, setCartAmount] = useState(2450);
  const [retentionStage, setRetentionStage] = useState<'cart' | 'checkout' | 'pending_cod_confirmation'>('pending_cod_confirmation');
  const [generatingRetention, setGeneratingRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<RetentionResponse | null>(null);
  const [retentionError, setRetentionError] = useState('');

  // Catalog Demo SKUs
  const [catalog] = useState([
    { sku: 'WAT-01', name: 'Ultra AMOLED Smartwatch', cost: 1200, price: 2450, margin: 51, stock: 45 },
    { sku: 'AUD-02', name: 'ANC Wireless Earbuds Pro', cost: 850, price: 1890, margin: 55, stock: 80 },
    { sku: 'PWR-03', name: '20000mAh 65W Fast Powerbank', cost: 1400, price: 2600, margin: 46, stock: 22 },
  ]);

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
    <div className="min-h-screen bg-[#070708] text-white flex flex-col lg:flex-row font-sans selection:bg-[#D4F54C] selection:text-black">
      
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (EXACT MARKOPOLO DESIGN SYSTEM)         */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-[240px] shrink-0 bg-[#000000] border-r border-[#1B1B1E] flex flex-col justify-between select-none">
        <div>
          {/* Brand Wordmark Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#151518]">
            <Link href="/dashboard/growthpilot-2" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#D4F54C] transition-colors">
                markopolo
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#1B2510] text-[#D4F54C] border border-[#2D3E18]">
                2.0
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className={`p-3 space-y-6 lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            
            {/* Top Single Item: Dashboard */}
            <div>
              <button
                type="button"
                onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  currentPage === 'dashboard'
                    ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Group 1: Marktag */}
            <div className="space-y-1">
              <div className="px-3.5 pb-1 text-[11px] font-medium text-white/35 tracking-wider">
                Marktag
              </div>
              {[
                { id: 'data_room', label: 'Data room', icon: Database },
                { id: 'memory', label: 'Memory', icon: Brain },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'leads', label: 'Leads', icon: Users },
              ].map(item => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCurrentPage(item.id as NavPage); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Group 2: Campaign agent */}
            <div className="space-y-1">
              <div className="px-3.5 pb-1 text-[11px] font-medium text-white/35 tracking-wider">
                Campaign agent
              </div>
              {[
                { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'integrations', label: 'Integrations', icon: Boxes },
              ].map(item => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCurrentPage(item.id as NavPage); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Group 3: Others */}
            <div className="space-y-1">
              <div className="px-3.5 pb-1 text-[11px] font-medium text-white/35 tracking-wider">
                Others
              </div>
              {[
                { id: 'billing', label: 'Plan and billing', icon: CreditCard },
                { id: 'brand_kit', label: 'Brand Kit', icon: Palette },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'support', label: 'Support', icon: HelpCircle },
              ].map(item => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCurrentPage(item.id as NavPage); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#151518]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition group"
            title="Return to Classic GrowthPilot Dashboard"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4F54C] to-emerald-400 text-black flex items-center justify-center font-black text-xs shrink-0">
              NH
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-[#D4F54C] transition-colors">
                NAJMOL HA...
              </div>
              <div className="text-[10px] text-white/40 truncate">
                najmol@progra...
              </div>
            </div>
            <ChevronRight size={14} className="text-white/30 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE / CONTENT CANVAS                     */}
      {/* ======================================================== */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        
        {/* Top Floating App Bar */}
        <header className="h-16 px-6 lg:px-10 border-b border-[#151518] bg-[#070708]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white/40 capitalize">
              {currentPage.replace('_', ' ')}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-xs font-bold text-[#D4F54C] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4F54C] animate-pulse" />
              PilotTag v2.0 Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Classic Dashboard ↗
            </Link>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="flex-1 p-6 sm:p-8 lg:p-12 max-w-6xl w-full mx-auto space-y-8">
          
          {/* ======================================================== */}
          {/* VIEW: DASHBOARD (EXACT SCREENSHOT LAYOUT)                 */}
          {/* ======================================================== */}
          {currentPage === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Header Titles */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                  Welcome back, {userName}!
                </h1>
                <p className="text-sm text-white/60 font-sans">
                  Let's recover your lost revenue, automatically.
                </p>
              </div>

              {/* Electric Lime Banner Bar */}
              <div className="w-full rounded-2xl bg-[#D6F752] text-black px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-[#D6F752]/10">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="fill-black text-black shrink-0" />
                  <span className="text-sm font-extrabold tracking-tight">
                    Book a 1:1 session with our team to get started!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('1:1 Strategy Onboarding booked with GrowthPilot CMO specialist!')}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-900 text-white text-xs font-bold transition shadow cursor-pointer shrink-0"
                >
                  Book now
                </button>
              </div>

              {/* Resources Header */}
              <div className="space-y-1 pt-2">
                <div className="text-xs font-medium text-white/45">
                  Need help getting set up?
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Browse our most helpful resources
                </h2>
              </div>

              {/* 6 Help Resource Cards Grid (From Screenshot) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Card 1 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('data_room')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#1C2016] text-[#D4F54C] flex items-center justify-center">
                      <Radio size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#D4F54C] transition-colors leading-snug">
                      How to verify MarkTag is tracking correctly?
                    </h3>
                    <p className="text-xs text-white/40">Data & Tracking</p>
                  </div>
                </button>

                {/* Card 2 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('campaigns')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#251A18] text-[#FF7A50] flex items-center justify-center">
                      <ShoppingBag size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#FF7A50] transition-colors leading-snug">
                      Browse vs Cart vs Checkout abandonment: which to start with?
                    </h3>
                    <p className="text-xs text-white/40">Preset Campaigns</p>
                  </div>
                </button>

                {/* Card 3 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('content')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#142323] text-[#3EE0D2] flex items-center justify-center">
                      <Boxes size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#3EE0D2] transition-colors leading-snug">
                      How recovery sequences work (timing, channels, fallbacks)?
                    </h3>
                    <p className="text-xs text-white/40">Campaigns</p>
                  </div>
                </button>

                {/* Card 4 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('content')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#21182B] text-[#BF7AF0] flex items-center justify-center">
                      <PhoneCall size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#BF7AF0] transition-colors leading-snug">
                      Setting up Voice AI for your first recovery campaign!
                    </h3>
                    <p className="text-xs text-white/40">Voice AI</p>
                  </div>
                </button>

                {/* Card 5 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('integrations')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#162518] text-[#4CD964] flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#4CD964] transition-colors leading-snug">
                      WhatsApp Business approval: what you need to know?
                    </h3>
                    <p className="text-xs text-white/40">Channels</p>
                  </div>
                </button>

                {/* Card 6 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('analytics')}
                  className="p-6 rounded-2xl bg-[#111215] hover:bg-[#15161A] border border-[#1E2026] text-left space-y-4 transition group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#22182B] text-[#DA77F2] flex items-center justify-center">
                      <BarChart3 size={18} />
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#DA77F2] transition-colors leading-snug">
                      How Markopolo attributes recovered revenue?
                    </h3>
                    <p className="text-xs text-white/40">Analytics</p>
                  </div>
                </button>

              </div>

              {/* Quick Launchpad Action Bar */}
              <div className="rounded-3xl bg-[#111215] border border-[#1E2026] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase text-[#D4F54C] tracking-widest flex items-center gap-2">
                    <Sparkles size={14} /> Quick Execution
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Ready to launch an autonomous recovery or ad set?
                  </h3>
                  <p className="text-xs text-white/50">
                    Use our Ad Pilot to push to Meta Ads or run WhatsApp/SMS retention on high-intent carts.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage('campaigns')}
                    className="px-5 py-3 rounded-xl bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#D4F54C]/10"
                  >
                    <Rocket size={15} />
                    <span>Launch Campaign Agent</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: DATA ROOM (MARKTANG PIXEL & LIVE CAPI INSPECTOR)    */}
          {/* ======================================================== */}
          {currentPage === 'data_room' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database size={20} className="text-[#D4F54C]" />
                    <span>MarkTag Data Room & Real-Time Event Ingestion</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Inspect live micro-interactions, scroll depths, and SHA-256 encrypted server payloads.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('snippet', tagSnippet)}
                    className="px-3.5 py-2 rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'snippet' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey === 'snippet' ? 'Copied Snippet' : 'Copy MarkTag JS'}</span>
                  </button>
                </div>
              </div>

              {/* Embed Box */}
              <div className="p-4 rounded-2xl bg-black border border-[#1E2026] font-mono text-xs text-[#D4F54C] overflow-x-auto">
                <pre>{tagSnippet}</pre>
              </div>

              {/* Event Simulator Bar */}
              <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3">
                <div className="text-xs font-bold text-white/60">
                  Simulate Client & Server Conversions API Events:
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSimulateCapi('PageView')}
                    disabled={simulatingCapi}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
                  >
                    PageView
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCapi('AddToCart')}
                    disabled={simulatingCapi}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    AddToCart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCapi('Purchase')}
                    disabled={simulatingCapi}
                    className="px-4 py-2 rounded-xl bg-[#D4F54C]/10 text-[#D4F54C] border border-[#D4F54C]/25 text-xs font-medium hover:bg-[#D4F54C]/20 transition cursor-pointer"
                  >
                    Purchase Event (৳2,450)
                  </button>
                </div>
              </div>

              {/* Live Terminal */}
              <div className="p-5 rounded-2xl bg-[#0B0C0E] border border-[#1E2026] space-y-3">
                <div className="text-xs font-bold text-white/50 flex items-center justify-between">
                  <span>Live Event Pipeline</span>
                  <span className="text-[#D4F54C]">{capiLog.length} Event(s) Recorded</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
                  {capiLog.map((log, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#D4F54C] font-bold">{log.eventName}</span>
                        <span className="text-white/40">{log.eventId}</span>
                        <span className="text-emerald-400 font-bold">EMQ: {log.emqScore || '9.4'}/10</span>
                      </div>
                      <div className="text-[10px] text-white/60">{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: MEMORY (ATHENA LARGE EVENT MODEL & INTENT VECTORS)   */}
          {/* ======================================================== */}
          {currentPage === 'memory' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Brain size={20} className="text-[#BF7AF0]" />
                  <span>Athena 2.0 Large Event Model & Vector Memory</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Processes 384-dimensional behavioral vectors in sub-50ms to classify shopper intent without third-party cookies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60">Shopper Intent Score</span>
                    <span className="text-xl font-bold text-[#D4F54C]">{intentScore}/100</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={intentScore}
                    onChange={e => setIntentScore(Number(e.target.value))}
                    className="w-full accent-[#D4F54C]"
                  />
                  <div className="p-3 rounded-xl bg-[#D4F54C]/10 border border-[#D4F54C]/20 text-xs text-[#D4F54C]">
                    {intentScore > 75
                      ? '🎯 High-Intent Drop: Automated WhatsApp / Voice AI order confirmation triggered.'
                      : '👀 Active Comparison: Web push & social proof trigger.'}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60">Gross Margin Safety Guard</span>
                    <span className="text-xl font-bold text-[#FF7A50]">{grossMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={grossMargin}
                    onChange={e => setGrossMargin(Number(e.target.value))}
                    className="w-full accent-[#FF7A50]"
                  />
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                    Max Safe Discount Allowed: <strong>{Math.floor(grossMargin * 0.35)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ANALYTICS (ATTRIBUTED REVENUE & RECOVERY METRICS)    */}
          {/* ======================================================== */}
          {currentPage === 'analytics' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#3EE0D2]" />
                  <span>Attributed Revenue & Recovery Analytics</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  First-party server attribution tracking real recovered cash flow across channels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-xs text-white/40">Recovered Revenue</div>
                  <div className="text-2xl font-bold text-[#D4F54C]">৳১,৪৬,৫০০</div>
                  <div className="text-[11px] text-emerald-400">+28.4% from last week</div>
                </div>
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-xs text-white/40">Abandoned Cart Recovery Rate</div>
                  <div className="text-2xl font-bold text-white">21.8%</div>
                  <div className="text-[11px] text-white/40">Benchmark: 8-12%</div>
                </div>
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-xs text-white/40">Meta CAPI Match Quality (EMQ)</div>
                  <div className="text-2xl font-bold text-[#3EE0D2]">9.4 / 10</div>
                  <div className="text-[11px] text-emerald-400">High Reliability Signal</div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: LEADS (IDENTIFIED SHOPPERS & COD ORDERS)           */}
          {/* ======================================================== */}
          {currentPage === 'leads' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-[#D4F54C]" />
                  <span>Identified Leads & High-Intent Shoppers</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Shoppers identified via MarkTag micro-interactions awaiting confirmation or retargeting.
                </p>
              </div>

              <div className="rounded-2xl bg-[#111215] border border-[#1E2026] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 border-b border-[#1E2026] text-white/40 uppercase">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone / City</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Value</th>
                      <th className="p-4">Intent</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="p-4 font-bold text-white">Tanvir Ahmed</td>
                      <td className="p-4 text-white/60">01711223344 (Dhaka)</td>
                      <td className="p-4 text-white/80">Ultra AMOLED Smartwatch</td>
                      <td className="p-4 text-[#D4F54C] font-bold">৳2,450</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">92 High</span></td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setCurrentPage('campaigns')}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
                        >
                          Send WhatsApp ↗
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-white">Nusrat Jahan</td>
                      <td className="p-4 text-white/60">01822334455 (Chittagong)</td>
                      <td className="p-4 text-white/80">ANC Wireless Earbuds Pro</td>
                      <td className="p-4 text-[#D4F54C] font-bold">৳1,890</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">78 Med</span></td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setCurrentPage('campaigns')}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
                        >
                          Send SMS ↗
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CAMPAIGNS (AD PILOT & RECOVERY FLOWS)               */}
          {/* ======================================================== */}
          {currentPage === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Megaphone size={20} className="text-[#FF7A50]" />
                    <span>Autonomous Campaign Agent (Ad Pilot & Retention)</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Deploy multi-platform media buying and automated cart recovery sequences.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#111215] p-1 rounded-xl border border-[#1E2026]">
                  <button
                    type="button"
                    onClick={() => setCampaignTab('ad_pilot')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      campaignTab === 'ad_pilot' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Ad Pilot (Media Buying)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignTab('recovery_flows')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      campaignTab === 'recovery_flows' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Recovery Flows (COD & Cart)
                  </button>
                </div>
              </div>

              {campaignTab === 'ad_pilot' ? (
                <div className="space-y-6">
                  {/* Ad Pilot Inputs */}
                  <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Brand / Product</label>
                        <input
                          type="text"
                          value={productService}
                          onChange={e => setProductService(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Offer Angle</label>
                        <input
                          type="text"
                          value={offer}
                          onChange={e => setOffer(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-white/40">Platform:</span>
                        {(['meta', 'google', 'tiktok'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPlatform(p)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                              platform === p ? 'bg-[#D4F54C] text-black' : 'bg-white/5 text-white/60 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAds}
                        disabled={generatingAds}
                        className="px-6 py-2.5 rounded-xl bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#D4F54C]/10"
                      >
                        {generatingAds ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                        <span>Generate Ad Pilot Campaign</span>
                      </button>
                    </div>
                  </div>

                  {/* Ad Pilot Results */}
                  {adPilotResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {adPilotResult.adSets.map((ad, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182110] text-[#D4F54C] border border-[#2B3B18]">
                              Angle: {ad.creativeAngle}
                            </span>
                            <div className="text-xs font-bold text-white pt-1">{ad.headline}</div>
                            <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed line-clamp-4">
                              {ad.primaryText}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`ad_${idx}`, `${ad.headline}\n\n${ad.primaryText}`)}
                            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 transition flex items-center justify-center gap-1.5"
                          >
                            {copiedKey === `ad_${idx}` ? <Check size={12} className="text-[#D4F54C]" /> : <Copy size={12} />}
                            <span>{copiedKey === `ad_${idx}` ? 'Copied' : 'Copy Ad Copy'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Recovery Flows Tab */
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Customer</label>
                        <input
                          type="text"
                          value={retentionCustomer}
                          onChange={e => setRetentionCustomer(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={retentionPhone}
                          onChange={e => setRetentionPhone(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Cart Amount (BDT)</label>
                        <input
                          type="number"
                          value={cartAmount}
                          onChange={e => setCartAmount(Number(e.target.value))}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateRetention}
                      disabled={generatingRetention}
                      className="px-6 py-2.5 rounded-xl bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#D4F54C]/10"
                    >
                      {generatingRetention ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>Orchestrate Retention Sequences</span>
                    </button>
                  </div>

                  {retentionResult && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-2">
                        <div className="text-xs font-bold text-[#4CD964] flex items-center gap-2">
                          <MessageCircle size={15} /> WhatsApp Cloud Message
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/90 whitespace-pre-wrap">
                          {retentionResult.channels.whatsapp.message}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-2">
                        <div className="text-xs font-bold text-[#FF7A50] flex items-center gap-2">
                          <PhoneCall size={15} /> AI Voice Script (COD Confirmation)
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/90 space-y-1">
                          <div><strong>Greeting:</strong> {retentionResult.channels.aiVoiceCallScript.firstGreeting}</div>
                          <div><strong>Resolution:</strong> {retentionResult.channels.aiVoiceCallScript.hesitationResolution}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CONTENT (CREATIVE & MESSAGING STUDIO)               */}
          {/* ======================================================== */}
          {currentPage === 'content' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText size={20} className="text-[#3EE0D2]" />
                  <span>AI Content & Copywriting Studio</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Generate cross-channel captions, headlines, and visual Midjourney prompts tailored to your brand assets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {catalog.map(sku => (
                  <div key={sku.sku} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3">
                    <div className="text-xs font-mono text-white/40">{sku.sku}</div>
                    <div className="text-sm font-bold text-white">{sku.name}</div>
                    <div className="text-xs text-[#D4F54C] font-bold">Margin: {sku.margin}%</div>
                    <button
                      type="button"
                      onClick={() => {
                        setProductService(sku.name);
                        setCurrentPage('campaigns');
                      }}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition"
                    >
                      Draft Content for SKU
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: INTEGRATIONS                                       */}
          {/* ======================================================== */}
          {currentPage === 'integrations' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Boxes size={20} className="text-[#D4F54C]" />
                  <span>Connected Channels & Gateways</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Connect Meta, Shopify, WhatsApp Cloud, and local courier verification APIs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Meta Conversions API (CAPI)', status: 'Connected', desc: 'Server-side pixel attribution' },
                  { name: 'Shopify Storefront', status: 'Connected', desc: 'Syncs products, stock & cart drops' },
                  { name: 'WhatsApp Business API', status: 'Ready', desc: 'Cloud API for 1-tap COD recovery' },
                  { name: 'Bangladeshi Courier Hub (Pathao/Steadfast)', status: 'Active', desc: 'Anti-fraud COD verification' },
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{item.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#182110] text-[#D4F54C] border border-[#2B3B18]">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: BRAND KIT                                          */}
          {/* ======================================================== */}
          {currentPage === 'brand_kit' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette size={20} className="text-[#D4F54C]" />
                  <span>Brand Kit & Memory Context</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Synchronized with Brand Brain for coherent tone of voice, USP, and pricing rules.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                <div className="text-sm font-bold text-white">Brand Name: {brandName}</div>
                <div className="text-xs text-white/70">Product / Service: {productService}</div>
                <div className="text-xs text-white/70">Target Audience: {targetAudience}</div>
                <div className="text-xs text-[#D4F54C]">Active Offer: {offer}</div>
                <Link
                  href="/dashboard/brand"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4F54C] hover:underline pt-2"
                >
                  <span>Edit in Brand Brain Hub</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: SETTINGS & BILLING & SUPPORT                        */}
          {/* ======================================================== */}
          {(currentPage === 'settings' || currentPage === 'billing' || currentPage === 'support') && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white capitalize">
                  {currentPage.replace('_', ' ')}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Manage your Markopolo-grade autonomous setup, tracking tags, and preferences.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3">
                <div className="text-sm font-bold text-white">Account Plan: Markopolo Pro Tier (GrowthPilot 2.0)</div>
                <p className="text-xs text-white/60">
                  Unlimited MarkTag tracking, 384-D vector intent inference, and Meta CAPI server dispatch.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4F54C] hover:underline"
                  >
                    <span>Back to Classic Dashboard Hub</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Floating Support Chat Widget (Lime-green bubble from screenshot) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setCurrentPage('support')}
          title="Open Markopolo Support Chat"
          className="w-12 h-12 rounded-2xl bg-[#D6F752] hover:bg-[#C2E338] text-black shadow-xl shadow-[#D6F752]/20 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        >
          <MessageCircle size={22} className="fill-black" />
        </button>
      </div>

    </div>
  );
}
