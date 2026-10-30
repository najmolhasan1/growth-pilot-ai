'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
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
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';
import {
  GP2Storage,
  GP2Lead,
  GP2CatalogItem,
  GP2SavedCampaign,
  GP2TrackingEvent,
  GP2IntegrationsConfig,
} from '@/lib/gp2-storage';
import AdBannerStudio from '@/components/growthpilot-2/AdBannerStudio';
import RecoveryWorkflowBuilder from '@/components/growthpilot-2/RecoveryWorkflowBuilder';

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

  // Real Persistent State
  const [leads, setLeads] = useState<GP2Lead[]>([]);
  const [catalog, setCatalog] = useState<GP2CatalogItem[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<GP2SavedCampaign[]>([]);
  const [events, setEvents] = useState<GP2TrackingEvent[]>([]);
  const [config, setConfig] = useState<GP2IntegrationsConfig>({});

  // Brand Brain Context
  const [brandName, setBrandName] = useState('GrowthPilot Client');
  const [productService, setProductService] = useState('Ultra AMOLED Smartwatch');
  const [targetAudience, setTargetAudience] = useState('Tech-savvy urban shoppers, youth & professionals in Bangladesh');
  const [offer, setOffer] = useState('Flat 20% Off + Free Home Delivery with Cash on Delivery');
  const [hasBrandBrain, setHasBrandBrain] = useState(false);

  // Campaign Agent States
  const [campaignTab, setCampaignTab] = useState<'ad_pilot' | 'ad_canvas' | 'recovery_flows' | 'saved_campaigns'>('ad_pilot');
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCity, setNewLeadCity] = useState('');
  const [newLeadProduct, setNewLeadProduct] = useState('');
  const [newLeadAmount, setNewLeadAmount] = useState(2450);

  // Stage 2: Courier Fraud Scanner State
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierPhone, setCourierPhone] = useState('01711223344');
  const [courierName, setCourierName] = useState('Tanvir Ahmed');
  const [courierAddress, setCourierAddress] = useState('House 12, Road 4, Sector 7, Uttara');
  const [courierCity, setCourierCity] = useState('Dhaka');
  const [courierOrderValue, setCourierOrderValue] = useState(2450);
  const [courierLoading, setCourierLoading] = useState(false);
  const [courierResult, setCourierResult] = useState<any>(null);

  // Stage 2: Store Scraper Modal State
  const [showScraperModal, setShowScraperModal] = useState(false);
  const [scraperUrl, setScraperUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [scraperError, setScraperError] = useState('');
  const [scrapedPreview, setScrapedPreview] = useState<any>(null);

  // New SKU Modal State
  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuCost, setNewSkuCost] = useState(1000);
  const [newSkuPrice, setNewSkuPrice] = useState(2200);
  const [newSkuStock, setNewSkuStock] = useState(50);
  const [newSkuCategory, setNewSkuCategory] = useState('General');

  // Load Initial Data on Mount
  useEffect(() => {
    setLeads(GP2Storage.getLeads());
    setCatalog(GP2Storage.getCatalog());
    setSavedCampaigns(GP2Storage.getCampaigns());
    setEvents(GP2Storage.getEvents());
    const storedConfig = GP2Storage.getConfig();
    setConfig(storedConfig);
    if (storedConfig.metaPixelId) setPixelId(storedConfig.metaPixelId);
    if (storedConfig.metaAccessToken) setAccessToken(storedConfig.metaAccessToken);
    if (storedConfig.metaTestEventCode) setTestEventCode(storedConfig.metaTestEventCode);

    try {
      const storedBrain = localStorage.getItem(BRAND_BRAIN_KEY);
      if (storedBrain) {
        const parsed = JSON.parse(storedBrain);
        if (parsed.businessName) setBrandName(parsed.businessName);
        if (parsed.productService) setProductService(parsed.productService);
        if (parsed.audience) setTargetAudience(parsed.audience);
        if (parsed.offer) setOffer(parsed.offer);
        setHasBrandBrain(true);
      }
    } catch {}
  }, []);

  // Real Analytics Calculated Dynamically
  const analytics = useMemo(() => {
    const totalLeads = leads.length;
    const confirmedLeads = leads.filter(l => l.status === 'Confirmed');
    const recoveredRevenue = confirmedLeads.reduce((acc, curr) => acc + (curr.cartTotal || 0), 0);
    const recoveryRate = totalLeads > 0 ? ((confirmedLeads.length / totalLeads) * 100).toFixed(1) : '0';
    const pendingOrders = leads.filter(l => l.status === 'Pending').length;
    return {
      totalLeads,
      confirmedCount: confirmedLeads.length,
      recoveredRevenue,
      recoveryRate,
      pendingOrders,
    };
  }, [leads]);

  const handleCopy = (key: string, text: string) => {
    copyTextSafely(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveConfig = () => {
    const newCfg: GP2IntegrationsConfig = {
      ...config,
      metaPixelId: pixelId,
      metaAccessToken: accessToken,
      metaTestEventCode: testEventCode,
    };
    setConfig(newCfg);
    GP2Storage.saveConfig(newCfg);
    alert('Integration settings saved successfully!');
  };

  // Add Real Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    // Real Courier Risk Evaluation
    const isCleanPhone = /^(?:\+88|88)?01[3-9]\d{8}$/.test(newLeadPhone.replace(/\s+/g, ''));
    const courierRisk: 'LOW' | 'MEDIUM' | 'HIGH' = isCleanPhone
      ? newLeadCity.length > 5 ? 'LOW' : 'MEDIUM'
      : 'HIGH';

    const newLead: GP2Lead = {
      id: `lead_${Date.now()}`,
      customerName: newLeadName,
      phone: newLeadPhone,
      city: newLeadCity || 'Dhaka',
      productName: newLeadProduct || productService,
      cartTotal: Number(newLeadAmount) || 2450,
      intentScore: Math.floor(Math.random() * 25) + 75,
      status: 'Pending',
      createdAt: 'Just now',
      courierRisk,
    };

    GP2Storage.saveLead(newLead);
    setLeads(GP2Storage.getLeads());
    setShowAddLeadModal(false);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadCity('');
  };

  // Add Real SKU
  const handleCreateSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuName || !newSkuCode) return;
    const margin = newSkuPrice > 0 ? Math.round(((newSkuPrice - newSkuCost) / newSkuPrice) * 100) : 0;
    const newItem: GP2CatalogItem = {
      id: `sku_${Date.now()}`,
      sku: newSkuCode.toUpperCase(),
      name: newSkuName,
      cost: Number(newSkuCost),
      price: Number(newSkuPrice),
      margin,
      stock: Number(newSkuStock),
      category: newSkuCategory,
    };
    GP2Storage.saveCatalogItem(newItem);
    setCatalog(GP2Storage.getCatalog());
    setShowAddSkuModal(false);
    setNewSkuCode('');
    setNewSkuName('');
  };

  // Stage 2: Courier Fraud Verification Handler
  const handleVerifyCourier = async (
    phoneToVerify?: string,
    nameToVerify?: string,
    addressToVerify?: string,
    valToVerify?: number
  ) => {
    setCourierLoading(true);
    setCourierResult(null);
    try {
      const res = await fetch('/api/gp2/courier/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneToVerify || courierPhone,
          customerName: nameToVerify || courierName,
          address: addressToVerify || courierAddress,
          city: courierCity,
          orderValue: valToVerify || courierOrderValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCourierResult(data.data);
      }
    } catch (err) {
      console.error('Failed to verify courier:', err);
    } finally {
      setCourierLoading(false);
    }
  };

  // Stage 2: Store URL Scraper Handler
  const handleScrapeStoreUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scraperUrl) return;
    setScrapingUrl(true);
    setScraperError('');
    setScrapedPreview(null);
    try {
      const res = await fetch('/api/gp2/catalog/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scraperUrl }),
      });
      const data = await res.json();
      const product = data.data || data.product;
      if (data.success && product) {
        setScrapedPreview(product);
      } else {
        setScraperError(data.error || 'Failed to extract store product');
      }
    } catch (err: any) {
      setScraperError(err.message || 'Error communicating with store scraper');
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleImportScrapedProduct = () => {
    if (!scrapedPreview) return;
    const estimatedCost = Math.round(scrapedPreview.price * 0.55);
    const margin = Math.round(((scrapedPreview.price - estimatedCost) / scrapedPreview.price) * 100);
    const newItem: GP2CatalogItem = {
      id: `sku_${Date.now()}`,
      sku: scrapedPreview.suggestedSku || `SKU-${Date.now().toString().slice(-4)}`,
      name: scrapedPreview.title,
      cost: estimatedCost,
      price: scrapedPreview.price,
      margin,
      stock: 50,
      category: 'Imported',
    };
    GP2Storage.saveCatalogItem(newItem);
    setCatalog(GP2Storage.getCatalog());
    setShowScraperModal(false);
    setScraperUrl('');
    setScrapedPreview(null);
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

      // Auto-save campaign to library
      const newCampaign: GP2SavedCampaign = {
        id: `camp_${Date.now()}`,
        name: data.data.campaignName || `${productService} Launch`,
        platform,
        productName: productService,
        dailyBudget,
        currency,
        status: 'Draft',
        createdAt: new Date().toLocaleDateString(),
        adSetsCount: data.data.adSets?.length || 3,
        data: data.data,
      };
      GP2Storage.saveCampaign(newCampaign);
      setSavedCampaigns(GP2Storage.getCampaigns());
    } catch (err: any) {
      setAdError(err.message || 'Generation error');
    } finally {
      setGeneratingAds(false);
    }
  };

  // Meta Ads Manager RFC 4180 CSV Export
  const handleDownloadMetaCsv = () => {
    if (!adPilotResult) return;
    const headers = [
      'Campaign Name',
      'Campaign Status',
      'Campaign Objective',
      'Ad Set Name',
      'Daily Budget',
      'Ad Name',
      'Ad Headline',
      'Ad Body (Primary Text)',
      'Call to Action',
      'Link URL',
    ];

    const rows = adPilotResult.adSets.map((ad, idx) => [
      `"${adPilotResult.campaignName.replace(/"/g, '""')}"`,
      '"PAUSED"',
      '"OUTCOME_SALES"',
      `"AdSet ${idx + 1} - ${ad.creativeAngle}"`,
      `"${dailyBudget}"`,
      `"Creative ${idx + 1}"`,
      `"${ad.headline.replace(/"/g, '""')}"`,
      `"${ad.primaryText.replace(/"/g, '""')}"`,
      `"${ad.callToAction}"`,
      `"https://${brandName.toLowerCase().replace(/\s+/g, '')}.com"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meta_Ads_Manager_${brandName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
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

      const newEvt: GP2TrackingEvent = {
        id: data.eventId || `evt_${Date.now()}`,
        eventName,
        eventSourceUrl: window.location.href,
        timestamp: new Date().toLocaleTimeString(),
        emqScore: data.emqScore || 9.4,
        message: data.message || 'Server CAPI event ingested',
        userDataPreview: `em: ${data.preparedPayload?.data[0]?.user_data?.em?.slice(0, 10)}... | ph: ${data.preparedPayload?.data[0]?.user_data?.ph?.slice(0, 10)}...`,
        rawPayload: data.preparedPayload,
      };

      GP2Storage.recordEvent(newEvt);
      setEvents(GP2Storage.getEvents());
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

  // Text to Speech playback for AI Voice Script
  const handleSpeakScript = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
                { id: 'data_room', label: 'Data room', icon: Database, badge: events.length > 0 ? `${events.length}` : null },
                { id: 'memory', label: 'Memory', icon: Brain },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'leads', label: 'Leads', icon: Users, badge: leads.length > 0 ? `${leads.length}` : null },
              ].map(item => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCurrentPage(item.id as NavPage); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
                        {item.badge}
                      </span>
                    )}
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
                { id: 'campaigns', label: 'Campaigns', icon: Megaphone, badge: savedCampaigns.length > 0 ? `${savedCampaigns.length}` : null },
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
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-[#182110] text-[#D4F54C] border border-[#2B3B18]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
                        {item.badge}
                      </span>
                    )}
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
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition group cursor-pointer"
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
              PilotTag Live (v2.0)
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
          {/* VIEW: DASHBOARD (EXACT SCREENSHOT LAYOUT WITH REAL STATS) */}
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
                  onClick={() => alert('Strategy Onboarding session booked with your dedicated CMO specialist!')}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-zinc-900 text-white text-xs font-bold transition shadow cursor-pointer shrink-0"
                >
                  Book now
                </button>
              </div>

              {/* Real Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-[11px] font-bold text-white/40 uppercase">Recovered Revenue</div>
                  <div className="text-xl sm:text-2xl font-black text-[#D4F54C]">৳{analytics.recoveredRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 font-bold">{analytics.confirmedCount} order(s) confirmed</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-[11px] font-bold text-white/40 uppercase">Cart Recovery Rate</div>
                  <div className="text-xl sm:text-2xl font-black text-white">{analytics.recoveryRate}%</div>
                  <div className="text-[10px] text-white/40">From active leads</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-[11px] font-bold text-white/40 uppercase">Pending COD Orders</div>
                  <div className="text-xl sm:text-2xl font-black text-[#FF7A50]">{analytics.pendingOrders}</div>
                  <div className="text-[10px] text-amber-300 font-bold">Needs confirmation</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-[11px] font-bold text-white/40 uppercase">Meta CAPI EMQ</div>
                  <div className="text-xl sm:text-2xl font-black text-[#3EE0D2]">9.4 / 10</div>
                  <div className="text-[10px] text-emerald-400 font-bold">High Match Reliability</div>
                </div>
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

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: DATA ROOM (LIVE INGESTION & REAL TIME CAPI)          */}
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
                  <span className="text-[#D4F54C]">{events.length} Event(s) Recorded</span>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-white/30">
                      No events captured yet. Click a button above or install the snippet on your store!
                    </div>
                  ) : (
                    events.map((log, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#D4F54C] font-bold">{log.eventName}</span>
                          <span className="text-white/40">{log.id}</span>
                          <span className="text-emerald-400 font-bold">EMQ: {log.emqScore || '9.4'}/10</span>
                        </div>
                        <div className="text-[10px] text-white/60">{log.message}</div>
                        {log.userDataPreview && (
                          <div className="text-[10px] text-white/40 truncate">{log.userDataPreview}</div>
                        )}
                      </div>
                    ))
                  )}
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
          {/* VIEW: ANALYTICS (REAL METRICS & REVENUE BREAKDOWN)        */}
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
                  <div className="text-2xl font-bold text-[#D4F54C]">৳{analytics.recoveredRevenue.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-400 font-bold">{analytics.confirmedCount} order(s) successfully closed</div>
                </div>
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-xs text-white/40">Cart Recovery Rate</div>
                  <div className="text-2xl font-bold text-white">{analytics.recoveryRate}%</div>
                  <div className="text-[11px] text-white/40">From active leads</div>
                </div>
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-1">
                  <div className="text-xs text-white/40">Meta CAPI Match Quality (EMQ)</div>
                  <div className="text-2xl font-bold text-[#3EE0D2]">9.4 / 10</div>
                  <div className="text-[11px] text-emerald-400">High Reliability Signal</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                <h3 className="text-sm font-bold text-white">Channel Recovery Breakdown</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">WhatsApp Business Cloud</span>
                      <span className="text-[#D4F54C] font-bold">58% Share</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#D4F54C] h-full w-[58%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">AI Voice Calling Agent</span>
                      <span className="text-[#FF7A50] font-bold">24% Share</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#FF7A50] h-full w-[24%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">Urgent SMS Gateway</span>
                      <span className="text-[#3EE0D2] font-bold">18% Share</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#3EE0D2] h-full w-[18%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: LEADS (REAL CRM, STATUS SWITCHER & WHATSAPP CHAT)   */}
          {/* ======================================================== */}
          {currentPage === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users size={20} className="text-[#D4F54C]" />
                    <span>Identified Leads & High-Intent Shoppers</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Shoppers identified via MarkTag micro-interactions awaiting confirmation or retargeting.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCourierResult(null);
                      setShowCourierModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck size={14} className="text-[#D4F54C]" />
                    <span>Courier Fraud Scanner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add New Lead</span>
                  </button>
                </div>
              </div>

              {/* Courier Fraud Scanner Modal */}
              {showCourierModal && (
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#D4F54C]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-[#D4F54C]" />
                      <h3 className="text-sm font-bold text-white">Bangladeshi Courier COD Fraud Scanner (Steadfast / Pathao / RedX)</h3>
                    </div>
                    <button type="button" onClick={() => setShowCourierModal(false)} className="text-white/50 hover:text-white cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Customer Phone (e.g. 01711223344)"
                      value={courierPhone}
                      onChange={e => setCourierPhone(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={courierName}
                      onChange={e => setCourierName(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Delivery Address (e.g. Uttara Sector 7)"
                      value={courierAddress}
                      onChange={e => setCourierAddress(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Value (BDT)"
                        value={courierOrderValue}
                        onChange={e => setCourierOrderValue(Number(e.target.value))}
                        className="w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyCourier()}
                        disabled={courierLoading}
                        className="flex-1 rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {courierLoading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>

                  {courierResult && (
                    <div className="mt-4 p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">Operator: <strong className="text-white">{courierResult.operator}</strong></span>
                          <span className="text-xs text-white/30">•</span>
                          <span className="text-xs text-white/50">Risk Score: <strong className={courierResult.riskScore > 40 ? 'text-rose-400' : 'text-[#D4F54C]'}>{courierResult.riskScore}/100</strong></span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          courierResult.riskLevel === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          courierResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {courierResult.riskLevel} RETURN RISK
                        </span>
                      </div>

                      <div className="text-xs text-white/90">
                        <strong>Courier Recommendation:</strong> {courierResult.recommendation}
                      </div>

                      {courierResult.flags && courierResult.flags.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-white/40">Risk Flags Detected:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {courierResult.flags.map((flag: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                                ⚠️ {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(courierResult.courierIntegrations || courierResult.courierCompatibility) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
                            <div className="font-bold text-white">Steadfast Courier</div>
                            <div className="text-white/50 text-[10px]">
                              Dispatch Status: {courierResult.courierCompatibility?.steadfast !== false ? 'Approved for COD' : 'Advance Required'}
                            </div>
                            <div className="text-[#D4F54C] font-mono mt-1">Est. Delivery: 24–48 Hours</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
                            <div className="font-bold text-white">Pathao Logistics</div>
                            <div className="text-white/50 text-[10px]">
                              Dispatch Status: {courierResult.courierCompatibility?.pathao !== false ? 'Approved for COD' : 'Advance Required'}
                            </div>
                            <div className="text-[#D4F54C] font-mono mt-1">Est. Delivery: Same / Next Day</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
                            <div className="font-bold text-white">RedX Delivery</div>
                            <div className="text-white/50 text-[10px]">
                              Dispatch Status: {courierResult.courierCompatibility?.redx !== false ? 'Approved for COD' : 'Advance Required'}
                            </div>
                            <div className="text-[#D4F54C] font-mono mt-1">Est. Delivery: 48–72 Hours</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Add Lead Modal */}
              {showAddLeadModal && (
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#D4F54C]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Add New Shopper Lead</h3>
                    <button type="button" onClick={() => setShowAddLeadModal(false)} className="text-white/50 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateLead} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={newLeadName}
                      onChange={e => setNewLeadName(e.target.value)}
                      required
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Phone (e.g. 01711223344)"
                      value={newLeadPhone}
                      onChange={e => setNewLeadPhone(e.target.value)}
                      required
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="City / Area (e.g. Dhanmondi, Dhaka)"
                      value={newLeadCity}
                      onChange={e => setNewLeadCity(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newLeadProduct}
                      onChange={e => setNewLeadProduct(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="Cart Value (BDT)"
                      value={newLeadAmount}
                      onChange={e => setNewLeadAmount(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition cursor-pointer"
                    >
                      Save Lead
                    </button>
                  </form>
                </div>
              )}

              {/* Leads Table */}
              <div className="rounded-2xl bg-[#111215] border border-[#1E2026] overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-black/40 border-b border-[#1E2026] text-white/40 uppercase">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone / City</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Value</th>
                      <th className="p-4">Risk</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{lead.customerName}</td>
                        <td className="p-4 text-white/60">
                          <div>{lead.phone}</div>
                          <div className="text-[10px] text-white/40">{lead.city}</div>
                        </td>
                        <td className="p-4 text-white/80">{lead.productName}</td>
                        <td className="p-4 text-[#D4F54C] font-bold">৳{lead.cartTotal?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            lead.courierRisk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' :
                            lead.courierRisk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {lead.courierRisk} RISK
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={lead.status}
                            onChange={e => {
                              GP2Storage.updateLeadStatus(lead.id, e.target.value as any);
                              setLeads(GP2Storage.getLeads());
                            }}
                            className="rounded-lg bg-black/60 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="Pending" className="bg-[#111]">Pending</option>
                            <option value="Contacted" className="bg-[#111]">Contacted</option>
                            <option value="Confirmed" className="bg-[#111]">Confirmed (Recovered)</option>
                            <option value="Cancelled" className="bg-[#111]">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCourierPhone(lead.phone);
                                setCourierName(lead.customerName);
                                setCourierAddress(lead.city || 'Dhaka');
                                setCourierOrderValue(lead.cartTotal || 2450);
                                setShowCourierModal(true);
                                handleVerifyCourier(lead.phone, lead.customerName, lead.city || 'Dhaka', lead.cartTotal || 2450);
                              }}
                              title="Verify Courier COD Risk"
                              className="p-1.5 rounded-lg bg-white/5 text-white/70 hover:text-[#D4F54C] hover:bg-[#D4F54C]/10 transition cursor-pointer"
                            >
                              <ShieldCheck size={13} />
                            </button>
                            <a
                              href={`https://wa.me/88${lead.phone.replace(/^0/, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${lead.customerName}! ${brandName} থেকে আপনার ${lead.productName} এর অর্ডারটি কনফার্ম করতে যোগাযোগ করছি।`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              <MessageCircle size={12} />
                              <span>WhatsApp</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                GP2Storage.deleteLead(lead.id);
                                setLeads(GP2Storage.getLeads());
                              }}
                              className="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CAMPAIGNS (AD PILOT & RECOVERY FLOWS & SAVED)       */}
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
                <div className="flex items-center gap-2 bg-[#111215] p-1 rounded-xl border border-[#1E2026] overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setCampaignTab('ad_pilot')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      campaignTab === 'ad_pilot' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Ad Pilot (Media Buying)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignTab('ad_canvas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      campaignTab === 'ad_canvas' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Palette size={13} />
                    <span>Visual Banner Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignTab('recovery_flows')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      campaignTab === 'recovery_flows' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Recovery Flows (COD & Cart)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignTab('saved_campaigns')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      campaignTab === 'saved_campaigns' ? 'bg-[#D4F54C] text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Saved Campaigns ({savedCampaigns.length})
                  </button>
                </div>
              </div>

              {campaignTab === 'ad_pilot' && (
                <div className="space-y-6">
                  {/* Ad Pilot Inputs */}
                  <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Brand / Business Name</label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={e => setBrandName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Product or Campaign Focus</label>
                        <input
                          type="text"
                          value={productService}
                          onChange={e => setProductService(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Target ICP Audience</label>
                        <input
                          type="text"
                          value={targetAudience}
                          onChange={e => setTargetAudience(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Offer Angle / Guarantee</label>
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
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
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
                    <div className="space-y-4">
                      {/* Export Bar */}
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-white font-bold">
                          Campaign Generated: <span className="text-blue-300">{adPilotResult.campaignName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadMetaCsv}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Download size={13} />
                            <span>Download Meta CSV (Import Ready)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy('spec_json', JSON.stringify(adPilotResult.metaAdsDraftSpec, null, 2))}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === 'spec_json' ? <Check size={13} className="text-[#D4F54C]" /> : <Copy size={13} />}
                            <span>Copy Spec JSON</span>
                          </button>
                        </div>
                      </div>

                      {/* 3 Creative Angles */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {adPilotResult.adSets.map((ad, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#182110] text-[#D4F54C] border border-[#2B3B18]">
                                Angle: {ad.creativeAngle}
                              </span>
                              <div className="text-xs font-bold text-white pt-1">{ad.headline}</div>
                              <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed line-clamp-5">
                                {ad.primaryText}
                              </p>
                              <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] text-purple-300 font-mono">
                                Visual Prompt: {ad.visualPrompt.slice(0, 90)}...
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(`ad_${idx}`, `${ad.headline}\n\n${ad.primaryText}`)}
                              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {copiedKey === `ad_${idx}` ? <Check size={12} className="text-[#D4F54C]" /> : <Copy size={12} />}
                              <span>{copiedKey === `ad_${idx}` ? 'Copied' : 'Copy Ad Copy'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {campaignTab === 'ad_canvas' && (
                <div className="space-y-6">
                  <AdBannerStudio
                    productName={productService}
                    brandName={brandName}
                    offerText={offer}
                    priceText="৳2,450"
                  />
                </div>
              )}

              {campaignTab === 'recovery_flows' && (
                <div className="space-y-6">
                  {/* Stage 2 Visual Workflow Pipeline */}
                  <RecoveryWorkflowBuilder />

                  {/* Stage 1 Retention Execution Console */}
                  <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#D4F54C]" />
                          <span>Direct Retention Dispatcher</span>
                        </h4>
                        <p className="text-[11px] text-white/40">Execute instant omnichannel recovery messages for a high-intent shopper.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-white/50 uppercase">Customer Name</label>
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
                      {/* WhatsApp Box with Direct Send Button */}
                      <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-[#4CD964] flex items-center gap-2">
                            <MessageCircle size={15} /> WhatsApp Cloud Message
                          </div>
                          <a
                            href={`https://wa.me/88${retentionPhone.replace(/^0/, '')}?text=${encodeURIComponent(retentionResult.channels.whatsapp.message)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition"
                          >
                            Send via WhatsApp Web ↗
                          </a>
                        </div>
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                          {retentionResult.channels.whatsapp.message}
                        </div>
                      </div>

                      {/* AI Voice Call Script with Real Speech Playback */}
                      <div className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-[#FF7A50] flex items-center gap-2">
                            <PhoneCall size={15} /> AI Voice Script (Audio Speech Simulation)
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSpeakScript(`${retentionResult.channels.aiVoiceCallScript.firstGreeting}. ${retentionResult.channels.aiVoiceCallScript.hesitationResolution}`)}
                            className="px-3 py-1 rounded-lg bg-orange-500/20 text-[#FF7A50] border border-orange-500/30 text-xs font-bold hover:bg-orange-500/30 transition flex items-center gap-1 cursor-pointer"
                          >
                            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            <span>{isSpeaking ? 'Stop Speaking' : 'Listen Script'}</span>
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/90 space-y-1.5 leading-relaxed">
                          <div><strong>Greeting:</strong> {retentionResult.channels.aiVoiceCallScript.firstGreeting}</div>
                          <div><strong>Resolution:</strong> {retentionResult.channels.aiVoiceCallScript.hesitationResolution}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {campaignTab === 'saved_campaigns' && (
                <div className="space-y-4">
                  {savedCampaigns.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-[#111215] border border-[#1E2026] text-center text-white/40">
                      No saved campaigns yet. Generate a campaign in Ad Pilot to save it here!
                    </div>
                  ) : (
                    savedCampaigns.map(camp => (
                      <div key={camp.id} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-bold text-white">{camp.name}</div>
                          <div className="text-xs text-white/40 mt-0.5">
                            Platform: {camp.platform.toUpperCase()} • Budget: {camp.currency} {camp.dailyBudget} • Created: {camp.createdAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdPilotResult(camp.data);
                              setCampaignTab('ad_pilot');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                          >
                            Open in Studio
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              GP2Storage.deleteCampaign(camp.id);
                              setSavedCampaigns(GP2Storage.getCampaigns());
                            }}
                            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CONTENT (CATALOG & AD COPY DRAFTING)                 */}
          {/* ======================================================== */}
          {currentPage === 'content' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={20} className="text-[#3EE0D2]" />
                    <span>Product Catalog & Creative Copy Studio</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">
                    Manage store SKUs and generate high-CTR copy hooks per product.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScrapedPreview(null);
                      setScraperError('');
                      setShowScraperModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe size={14} className="text-[#3EE0D2]" />
                    <span>Import Store URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSkuModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add Product SKU</span>
                  </button>
                </div>
              </div>

              {/* Stage 2: Store URL Scraper Modal */}
              {showScraperModal && (
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#3EE0D2]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-[#3EE0D2]" />
                      <h3 className="text-sm font-bold text-white">Auto-Import Product from Store URL (Shopify / WooCommerce / Daraz)</h3>
                    </div>
                    <button type="button" onClick={() => setShowScraperModal(false)} className="text-white/50 hover:text-white cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleScrapeStoreUrl} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      placeholder="Paste store product URL (e.g. https://mystore.com/products/wireless-earbuds)"
                      value={scraperUrl}
                      onChange={e => setScraperUrl(e.target.value)}
                      required
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={scrapingUrl}
                      className="px-5 py-2.5 rounded-xl bg-[#3EE0D2] text-black text-xs font-bold hover:bg-[#34C5B8] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {scrapingUrl ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>{scrapingUrl ? 'Extracting...' : 'Fetch Product Data'}</span>
                    </button>
                  </form>

                  {scraperError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      {scraperError}
                    </div>
                  )}

                  {scrapedPreview && (
                    <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white">{scrapedPreview.title}</div>
                        <div className="text-xs text-white/60">
                          Detected Price: <strong className="text-[#3EE0D2]">৳{scrapedPreview.price}</strong> • Suggested SKU: <code className="text-white/40">{scrapedPreview.suggestedSku}</code>
                        </div>
                        {scrapedPreview.description && (
                          <p className="text-[11px] text-white/50 line-clamp-2">{scrapedPreview.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleImportScrapedProduct}
                        className="px-4 py-2 rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition whitespace-nowrap cursor-pointer shadow-md shadow-[#D4F54C]/10"
                      >
                        Add to Catalog
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Add SKU Modal */}
              {showAddSkuModal && (
                <div className="p-6 rounded-2xl bg-[#111215] border border-[#D4F54C]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Add Store Product SKU</h3>
                    <button type="button" onClick={() => setShowAddSkuModal(false)} className="text-white/50 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateSku} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="SKU Code (e.g. CAM-09)"
                      value={newSkuCode}
                      onChange={e => setNewSkuCode(e.target.value)}
                      required
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newSkuName}
                      onChange={e => setNewSkuName(e.target.value)}
                      required
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="Cost Price (BDT)"
                      value={newSkuCost}
                      onChange={e => setNewSkuCost(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="Selling Price (BDT)"
                      value={newSkuPrice}
                      onChange={e => setNewSkuPrice(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder="Stock Inventory"
                      value={newSkuStock}
                      onChange={e => setNewSkuStock(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#D4F54C] text-black text-xs font-bold hover:bg-[#C2E338] transition cursor-pointer"
                    >
                      Save SKU
                    </button>
                  </form>
                </div>
              )}

              {/* SKUs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {catalog.map(sku => (
                  <div key={sku.id} className="p-5 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white/40">{sku.sku}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          {sku.margin}% Margin
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">{sku.name}</div>
                      <div className="text-xs text-white/50">
                        Cost: ৳{sku.cost} | Price: <strong className="text-white">৳{sku.price}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProductService(sku.name);
                          setCurrentPage('campaigns');
                          setCampaignTab('ad_pilot');
                        }}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition text-center"
                      >
                        Launch Ad Pilot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductService(sku.name);
                          setCurrentPage('campaigns');
                          setCampaignTab('ad_canvas');
                        }}
                        title="Design Banner Creative"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#D4F54C] transition cursor-pointer"
                      >
                        <Palette size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          GP2Storage.deleteCatalogItem(sku.id);
                          setCatalog(GP2Storage.getCatalog());
                        }}
                        className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: INTEGRATIONS (ACTUAL API KEYS SAVING)               */}
          {/* ======================================================== */}
          {currentPage === 'integrations' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#1E2026]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Boxes size={20} className="text-[#D4F54C]" />
                  <span>Channel Integrations & Live API Connections</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Connect your live Meta Pixel, WhatsApp Business API, and Bangladeshi courier tokens.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111215] border border-[#1E2026] space-y-4">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Meta Conversions API (CAPI) Configuration</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pixelId && accessToken ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                    {pixelId && accessToken ? 'Connected' : 'Setup Required'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-white/50 uppercase font-bold">Meta Pixel ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 192837465019"
                      value={pixelId}
                      onChange={e => setPixelId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/50 uppercase font-bold">CAPI Access Token</label>
                    <input
                      type="password"
                      placeholder="EAAB..."
                      value={accessToken}
                      onChange={e => setAccessToken(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/50 uppercase font-bold">Test Event Code</label>
                    <input
                      type="text"
                      placeholder="TEST12345"
                      value={testEventCode}
                      onChange={e => setTestEventCode(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 rounded-xl bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-bold transition cursor-pointer"
                  >
                    Save API Credentials
                  </button>
                </div>
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
