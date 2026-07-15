'use client';

import { useEffect, useState } from 'react';
import { 
  Globe, 
  Search, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Smartphone, 
  Laptop, 
  List, 
  FileText, 
  Image as ImageIcon, 
  Link2,
  Trash2,
  Loader2,
  HelpCircle,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';

interface AuditReport {
  url: string;
  domain: string;
  scannedAt: string;
  crawled: {
    title: string;
    description: string;
    robots: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    h1Count: number;
    h1s: string[];
    headings: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      h5: number;
      h6: number;
    };
    images: {
      total: number;
      missingAlt: number;
    };
    links: {
      total: number;
      internal: number;
      external: number;
    };
    wordCount: number;
    loadTimeMs: number;
    isHttps: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
  };
  audit: {
    scores: {
      seo: number;
      speed: number;
      security: number;
      mobile: number;
    };
    summary: string;
    seoAudit: {
      titleEvaluation: string;
      descriptionEvaluation: string;
      headingsEvaluation: string;
      contentEvaluation: string;
    };
    uxCroAudit: {
      evaluation: string;
      strengths: string[];
      weaknesses: string[];
    };
    checklist: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
      status: 'fail' | 'warning' | 'pass';
    }>;
    copywritingSuggestions: {
      headlineTweaks: Array<{
        original: string;
        suggested: string;
        reason: string;
      }>;
      valueProposition: string;
      localMarketAdvice: string;
    };
  };
}

interface StoredAsset {
  id: string;
  title: string;
  created_at: string;
  result: AuditReport;
}

export default function WebsiteAnalyzerPage() {
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // History lists
  const [history, setHistory] = useState<StoredAsset[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Active UI tabs
  const [activeTab, setActiveTab] = useState<'checklist' | 'structure' | 'copywriting' | 'preview'>('checklist');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const scanSteps = [
    'Connecting to website host...',
    'Fetching HTML layout structure...',
    'Auditing meta keywords and tags...',
    'Reviewing image alt attributes & links...',
    'Consulting Gemini AI engine for optimization checklist...'
  ];

  useEffect(() => {
    loadScanHistory();
  }, []);

  async function loadScanHistory() {
    if (!isSupabaseConfigured()) return;
    setLoadingHistory(true);
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/marketing-assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (response.ok && payload.success && Array.isArray(payload.assets)) {
        const scannerAssets = payload.assets
          .filter((a: any) => a.tool === 'website_analyzer')
          .map((a: any) => ({
            id: a.id,
            title: a.title,
            created_at: a.createdAt,
            result: a.result as AuditReport
          }));
        setHistory(scannerAssets);
      }
    } catch (e) {
      console.warn('Failed to load past scanner audits', e);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setScanning(true);
    setReport(null);
    setErrorMsg('');
    setScanStep(0);

    // Animate loader steps
    const stepInterval = setInterval(() => {
      setScanStep(prev => {
        if (prev < scanSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const { data: authData } = isSupabaseConfigured() 
        ? await getSupabaseBrowserClient().auth.getSession() 
        : { data: { session: null } };
      
      const token = authData.session?.access_token;
      
      const response = await fetch('/api/website-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: urlInput })
      });

      clearInterval(stepInterval);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to complete analysis');
      }

      setReport(payload.report);
      // Reload history to show the newly saved asset
      loadScanHistory();
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan from your history?')) return;

    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/marketing-assets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (report && report.url === history.find(h => h.id === id)?.result.url) {
          setReport(null);
        }
      }
    } catch (err) {
      console.warn('Failed to delete past scan', err);
    }
  };

  const selectPastScan = (item: StoredAsset) => {
    setReport(item.result);
    setUrlInput(item.result.url);
    setErrorMsg('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { stroke: 'stroke-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', glow: 'bg-emerald-500/20' };
    if (score >= 60) return { stroke: 'stroke-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', glow: 'bg-amber-500/20' };
    return { stroke: 'stroke-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', glow: 'bg-rose-500/20' };
  };

  return (
    <div className="min-h-screen bg-[#030712] p-6 lg:p-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              <Globe size={12} className="animate-spin-slow" /> Website SEO Auditor
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Website <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Analyzer</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Perform deep HTML audits, speed diagnostics, and AI copywriting analysis. Uncover marketing opportunities and conversion hooks in seconds.
            </p>
          </div>
          {report && (
            <button
              onClick={() => { setReport(null); setUrlInput(''); }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-xs font-bold text-white/70 transition hover:bg-white/[0.08]"
            >
              <RotateCcw size={14} /> Scan Another Site
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Workspace Column */}
          <div className="lg:col-span-3 space-y-8">
            {/* Input Bar */}
            {!report && !scanning && (
              <div className="relative rounded-[2rem] border border-white/5 bg-[#0d1117]/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
                <h3 className="text-lg font-bold text-white mb-2">Scan a new website</h3>
                <p className="text-xs text-white/40 mb-6">Enter any page domain or full URL path. We will analyze keywords, titles, responsiveness, and AI content metrics.</p>
                
                <form onSubmit={handleStartScan} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input
                      type="text"
                      placeholder="e.g. najmolgrowth.com or https://example.com"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070b12] pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    <Search size={16} /> Run Diagnostics
                  </button>
                </form>
                {errorMsg && (
                  <p className="mt-4 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <XCircle size={14} /> {errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* Scanning Loader State */}
            {scanning && (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0d1117]/80 p-16 text-center shadow-2xl backdrop-blur-xl min-h-[380px]">
                <div className="relative flex items-center justify-center w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 animate-pulse" />
                  <Loader2 className="text-emerald-400 animate-spin" size={36} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Analyzing Site Architecture</h3>
                <p className="text-xs text-white/40 max-w-sm mb-8">This crawls page tags, evaluates speed benchmarks, and structures SEO gaps.</p>
                
                {/* Steps tracker */}
                <div className="w-full max-w-md space-y-2.5 text-left">
                  {scanSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      {scanStep > idx ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : scanStep === idx ? (
                        <Loader2 size={14} className="text-emerald-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" />
                      )}
                      <span className={scanStep === idx ? 'text-white font-bold' : scanStep > idx ? 'text-white/60' : 'text-white/20'}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics Report Dashboard */}
            {report && (
              <div className="space-y-8 animate-fadeIn">
                {/* Quick Info Grid */}
                <div className="rounded-[2.2rem] border border-white/5 bg-[#0d1117] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/5 blur-[80px]" />
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 mb-8">
                    <div>
                      <h2 className="text-lg font-black text-white truncate max-w-md flex items-center gap-2">
                        {report.domain} <ArrowUpRight size={16} className="text-white/40" />
                      </h2>
                      <span className="text-[10px] text-white/30 tracking-wider font-semibold uppercase mt-1 block">Scanned on {new Date(report.scannedAt).toLocaleString()}</span>
                    </div>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline hover:text-emerald-300 font-bold"
                    >
                      Visit site <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Radial Score Rings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'seo', label: 'SEO Metrics', val: report.audit.scores.seo },
                      { key: 'speed', label: 'Speed Score', val: report.audit.scores.speed },
                      { key: 'security', label: 'Security SSL', val: report.audit.scores.security },
                      { key: 'mobile', label: 'Mobile Friendly', val: report.audit.scores.mobile }
                    ].map(ring => {
                      const colors = getScoreColor(ring.val);
                      const radius = 30;
                      const circ = 2 * Math.PI * radius;
                      const offset = circ - (ring.val / 100) * circ;
                      return (
                        <div key={ring.key} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all">
                          <div className="relative flex items-center justify-center w-20 h-20">
                            <div className={`absolute inset-0 rounded-full blur-md opacity-10 ${colors.glow}`} />
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle cx="40" cy="40" r={radius} className="stroke-white/5 fill-transparent" strokeWidth="6" />
                              <circle 
                                cx="40" 
                                cy="40" 
                                r={radius} 
                                className={`fill-transparent transition-all duration-1000 ease-out ${colors.stroke}`} 
                                strokeWidth="6" 
                                strokeDasharray={circ} 
                                strokeDashoffset={offset} 
                                strokeLinecap="round" 
                              />
                            </svg>
                            <span className="absolute text-base font-black text-white">{ring.val}</span>
                          </div>
                          <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40 text-center">{ring.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Text block */}
                  <div className="mt-8 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-5 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Sparkles size={12} /> AI Summary & Strategy
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">{report.audit.summary}</p>
                  </div>
                </div>

                {/* Tab selector */}
                <div className="flex border-b border-white/5 pb-0.5 overflow-x-auto gap-6">
                  {[
                    { id: 'checklist', label: 'Action Checklist', icon: List },
                    { id: 'structure', label: 'Page Structure', icon: FileText },
                    { id: 'copywriting', label: 'AI Copywriting Audit', icon: Sparkle },
                    { id: 'preview', label: 'Google Search Preview', icon: Globe }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 pb-4 text-xs font-bold transition-all relative border-none bg-transparent shrink-0 cursor-pointer ${
                        activeTab === tab.id 
                          ? 'text-emerald-400' 
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT: ACTION CHECKLIST */}
                {activeTab === 'checklist' && (
                  <div className="space-y-4">
                    {report.audit.checklist.length === 0 ? (
                      <p className="text-xs text-white/40 py-8 text-center bg-[#0d1117] border border-white/5 rounded-2xl">All checklist audits passed successfully!</p>
                    ) : (
                      report.audit.checklist
                        .sort((a, b) => {
                          const priorityMap = { High: 3, Medium: 2, Low: 1 };
                          return priorityMap[b.priority] - priorityMap[a.priority];
                        })
                        .map(item => {
                          const isFail = item.status === 'fail';
                          const isWarning = item.status === 'warning';
                          const statusIcon = isFail ? (
                            <XCircle className="text-rose-400" size={18} />
                          ) : isWarning ? (
                            <AlertTriangle className="text-amber-400" size={18} />
                          ) : (
                            <CheckCircle2 className="text-emerald-400" size={18} />
                          );

                          const priorityBadge = item.priority === 'High' ? (
                            <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/10">High priority</span>
                          ) : item.priority === 'Medium' ? (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/10">Medium priority</span>
                          ) : (
                            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/10">Low priority</span>
                          );

                          return (
                            <div key={item.id} className="group rounded-2xl border border-white/5 bg-[#0d1117] p-5 hover:bg-white/[0.03] transition-all">
                              <div className="flex gap-4 items-start">
                                <div className="shrink-0 mt-0.5">{statusIcon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                    <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">{item.category}</span>
                                    {priorityBadge}
                                  </div>
                                  <p className="mt-2 text-xs text-white/50 leading-relaxed leading-5">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* TAB CONTENT: PAGE STRUCTURE */}
                {activeTab === 'structure' && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* HTML tags metadata */}
                    <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-6">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">HTML Metadata</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title Tag ({report.crawled.title.length} chars)</span>
                          <p className="text-xs font-semibold text-white/90 bg-[#070b12] p-3 rounded-xl border border-white/5 mt-1">{report.crawled.title || 'Missing'}</p>
                          <p className="text-[10px] text-white/30 mt-1.5">{report.audit.seoAudit.titleEvaluation}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Meta Description ({report.crawled.description.length} chars)</span>
                          <p className="text-xs font-semibold text-white/90 bg-[#070b12] p-3 rounded-xl border border-white/5 mt-1 leading-relaxed">{report.crawled.description || 'Missing'}</p>
                          <p className="text-[10px] text-white/30 mt-1.5">{report.audit.seoAudit.descriptionEvaluation}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Robots Directive</span>
                            <p className="text-xs font-semibold text-white/90 bg-[#070b12] p-3 rounded-xl border border-white/5 mt-1 truncate">{report.crawled.robots || 'None specified'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Canonical Link</span>
                            <p className="text-xs font-semibold text-white/90 bg-[#070b12] p-3 rounded-xl border border-white/5 mt-1 truncate" title={report.crawled.canonical}>{report.crawled.canonical ? 'Specified' : 'Missing'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headings & Crawled elements summary */}
                    <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-6">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">SEO Technical Elements</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#070b12] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Load Time</span>
                            <Clock size={12} className="text-emerald-400" />
                          </div>
                          <p className="text-lg font-black text-white">{report.crawled.loadTimeMs} ms</p>
                        </div>
                        <div className="bg-[#070b12] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Total Words</span>
                            <FileText size={12} className="text-emerald-400" />
                          </div>
                          <p className="text-lg font-black text-white">{report.crawled.wordCount.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#070b12] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Robots.txt</span>
                            {report.crawled.hasRobotsTxt ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : (
                              <XCircle size={12} className="text-rose-400" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-white mt-1">{report.crawled.hasRobotsTxt ? 'Configured' : 'Missing'}</p>
                        </div>
                        <div className="bg-[#070b12] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Sitemap.xml</span>
                            {report.crawled.hasSitemap ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : (
                              <XCircle size={12} className="text-rose-400" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-white mt-1">{report.crawled.hasSitemap ? 'Configured' : 'Missing'}</p>
                        </div>
                      </div>

                      {/* Heading tags breakdown */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Heading Tags Structure</span>
                        <div className="grid grid-cols-6 gap-2">
                          {Object.entries(report.crawled.headings).map(([tag, count]) => (
                            <div key={tag} className="bg-[#070b12] p-2 rounded-lg border border-white/5 text-center">
                              <p className="text-[9px] font-bold uppercase text-white/30">{tag}</p>
                              <p className="text-sm font-black text-white mt-0.5">{count}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-white/30 mt-1">{report.audit.seoAudit.headingsEvaluation}</p>
                      </div>

                      {/* Image assets & Link audits */}
                      <div className="space-y-4 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-white/60">
                            <ImageIcon size={14} className="text-white/40" /> Alt attributes:
                          </span>
                          <span className="font-bold">
                            {report.crawled.images.total - report.crawled.images.missingAlt} / {report.crawled.images.total} images
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-white/60">
                            <Link2 size={14} className="text-white/40" /> Internal / External links:
                          </span>
                          <span className="font-bold">
                            {report.crawled.links.internal} int / {report.crawled.links.external} ext
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* H1 tags list */}
                    <div className="md:col-span-2 rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Crawled H1 Heading Tags</h3>
                      {report.crawled.h1s.length === 0 ? (
                        <p className="text-xs text-rose-400 bg-rose-500/5 p-3.5 border border-rose-500/10 rounded-xl">No H1 tags detected! Having a title in an H1 tag is critical for Google crawlers.</p>
                      ) : (
                        <div className="space-y-2">
                          {report.crawled.h1s.map((h1, i) => (
                            <p key={i} className="text-xs font-semibold bg-[#070b12] p-3 rounded-xl border border-white/5 flex gap-2 items-center">
                              <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">H1 #{i+1}</span>
                              {h1}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: AI COPYWRITING AUDIT */}
                {activeTab === 'copywriting' && (
                  <div className="space-y-6">
                    {/* Value proposition audit */}
                    <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <Sparkle className="text-emerald-400" size={16} /> Brand Value Proposition Analysis
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed leading-5">{report.audit.copywritingSuggestions.valueProposition}</p>
                    </div>

                    {/* Headline tweaks */}
                    <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <Zap className="text-emerald-400" size={16} /> High-Converting Headline Suggestions
                      </h3>
                      
                      {report.audit.copywritingSuggestions.headlineTweaks.length === 0 ? (
                        <p className="text-xs text-white/40">No headline tweaks generated.</p>
                      ) : (
                        <div className="space-y-4">
                          {report.audit.copywritingSuggestions.headlineTweaks.map((tweak, i) => (
                            <div key={i} className="bg-[#070b12] p-5 rounded-2xl border border-white/5 space-y-3">
                              <div>
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Original Page Element</span>
                                <p className="text-xs font-medium text-white/60 line-clamp-1 italic mt-1">&quot;{tweak.original}&quot;</p>
                              </div>
                              <div className="border-t border-white/5 pt-2">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">AI Suggestion Hook</span>
                                <p className="text-sm font-black text-emerald-300 mt-1">&quot;{tweak.suggested}&quot;</p>
                              </div>
                              <p className="text-[11px] text-white/45 leading-relaxed leading-4 mt-2"><strong>Reasoning:</strong> {tweak.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Localization / Local Market advice */}
                    <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <Globe className="text-emerald-400" size={16} /> Audience Optimization & Localization
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed leading-5">{report.audit.copywritingSuggestions.localMarketAdvice}</p>
                    </div>

                    {/* CRO Strengths vs Weaknesses */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 pb-2 border-b border-white/5">UX / Conversion Strengths</h3>
                        <ul className="space-y-2">
                          {report.audit.uxCroAudit.strengths.map((str, i) => (
                            <li key={i} className="flex gap-2 text-xs text-white/75 items-start">
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-6 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 pb-2 border-b border-white/5">UX / Conversion Gaps</h3>
                        <ul className="space-y-2">
                          {report.audit.uxCroAudit.weaknesses.map((weak, i) => (
                            <li key={i} className="flex gap-2 text-xs text-white/75 items-start">
                              <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: GOOGLE PREVIEW */}
                {activeTab === 'preview' && (
                  <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">Google Search Results Snippet</h3>
                        <p className="text-[11px] text-white/40 mt-1">Simulate how Google displays this page in search outcomes.</p>
                      </div>
                      <div className="flex gap-2 rounded-xl bg-[#070b12] p-1 border border-white/15">
                        <button
                          onClick={() => setPreviewDevice('desktop')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer transition-all ${
                            previewDevice === 'desktop' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Laptop size={12} /> Desktop
                        </button>
                        <button
                          onClick={() => setPreviewDevice('mobile')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer transition-all ${
                            previewDevice === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Smartphone size={12} /> Mobile
                        </button>
                      </div>
                    </div>

                    {/* Google Simulator styling */}
                    <div className="flex justify-center p-6 bg-[#070b12] rounded-2xl border border-white/5">
                      <div className={previewDevice === 'mobile' ? 'max-w-[360px] w-full bg-white text-black p-4 rounded-xl border border-gray-200 font-sans shadow-md' : 'max-w-2xl w-full bg-white text-black p-5 rounded-xl border border-gray-200 font-sans shadow-md'}>
                        {/* Domain url */}
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500 font-normal">
                          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                            G
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] leading-none text-gray-800 truncate">{report.domain}</span>
                            <span className="text-[9px] leading-none text-gray-400 truncate mt-0.5">{report.url}</span>
                          </div>
                        </div>

                        {/* Title link */}
                        <h4 className="text-[#1a0dab] hover:underline font-normal text-lg sm:text-xl leading-tight truncate cursor-pointer font-medium mb-1">
                          {report.crawled.title || 'Untitled search element'}
                        </h4>

                        {/* Description snippet */}
                        <p className="text-[#4d5156] text-xs sm:text-[13px] leading-relaxed line-clamp-2">
                          {report.crawled.description || 'Provide a meta description in your website header tags to control what search engine crawlers show in queries.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scan History Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[2rem] border border-white/5 bg-[#0d1117] p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-3">Scan History</h3>
              
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 text-white/30">
                  <Loader2 className="mr-2 animate-spin" size={16} /> Loading assets...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-white/20 flex flex-col items-center">
                  <Globe className="mb-2 opacity-50" size={32} />
                  <p className="text-xs uppercase tracking-wider font-bold">No past scans</p>
                  <p className="text-[10px] mt-1">Previous analyses will be listed here.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto custom-scrollbar">
                  {history.map(item => {
                    const active = report && report.url === item.result.url;
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectPastScan(item)}
                        className={`group w-full rounded-xl border p-3.5 text-left transition-all flex justify-between items-start gap-2 relative ${
                          active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${active ? 'text-emerald-400' : 'group-hover:text-emerald-300'}`}>
                            {item.result.domain}
                          </h4>
                          <span className="text-[9px] text-white/35 block mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={e => handleDeleteHistory(e, item.id)}
                          className="text-white/10 hover:text-rose-400 transition-colors p-1"
                          title="Delete Scan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
