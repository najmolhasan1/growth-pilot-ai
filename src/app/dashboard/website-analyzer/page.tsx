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
  Sparkle,
  Copy,
  Check,
  Printer,
  Code,
  Share2,
  TrendingUp,
  Tag,
  Gauge,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  Swords,
  Network,
  Download,
  FileCode,
  Trophy,
  ArrowRight,
  RefreshCw,
  Edit3,
  Wand2,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';

interface IssueItem {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  howToFix: string;
  codeFix?: string;
}

interface OrganicKeyword {
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  kd: number;
  estimatedVolume: string;
  relevanceScore: number;
}

interface ContentGapItem {
  topic: string;
  reason: string;
}

interface PageAuditSummary {
  url: string;
  status: number;
  title: string;
  hasH1: boolean;
  metaDescription: string;
  loadTimeMs: number;
  score: number;
  issues: string[];
}

interface SitemapScanResult {
  foundSitemap: boolean;
  sitemapUrl: string;
  totalPagesDiscovered: number;
  sampleSize: number;
  overallScore: number;
  totalIssuesCount: number;
  pages: PageAuditSummary[];
}

interface CompetitorComparisonResult {
  target: {
    url: string;
    domain: string;
    loadTimeMs: number;
    title: string;
    description: string;
    h1Count: number;
    h1Text: string;
    h2Count: number;
    h3Count: number;
    hasSchema: boolean;
    schemaCount: number;
    wordCount: number;
  };
  competitor: {
    url: string;
    domain: string;
    loadTimeMs: number;
    title: string;
    description: string;
    h1Count: number;
    h1Text: string;
    h2Count: number;
    h3Count: number;
    hasSchema: boolean;
    schemaCount: number;
    wordCount: number;
  };
  analysis: {
    targetHealthScore: number;
    competitorHealthScore: number;
    overallVerdict: string;
    winners: {
      speed: 'target' | 'competitor' | 'tie';
      seo: 'target' | 'competitor' | 'tie';
      content: 'target' | 'competitor' | 'tie';
      technical: 'target' | 'competitor' | 'tie';
    };
    contentGap: Array<{
      topic: string;
      competitorAngle: string;
      actionForTarget: string;
    }>;
    outrankBlueprint: Array<{
      priority: string;
      title: string;
      details: string;
      impact: string;
    }>;
  };
}

interface BacklinksResult {
  domainRating: number;
  authorityScore: number;
  estimatedBacklinks: string;
  referringDomains: number;
  dofollowRatio: string;
  toxicScore: string;
  toxicRisk: string;
  linkProfileSummary: string;
  topReferringCategories: Array<{
    category: string;
    percentage: string;
    impact: string;
  }>;
  anchorTextDistribution: Array<{
    anchor: string;
    share: string;
  }>;
  linkBuildingRoadmap: Array<{
    priority: string;
    strategy: string;
    targetProspects: string;
    estimatedImpact: string;
    pitchAngle: string;
  }>;
}

interface BlogSerpResult {
  title: string;
  url: string;
  serp: {
    averageRank: number;
    estimatedMonthlyClicks: number;
    estimatedMonthlyImpressions: number;
    averageCtr: string;
    serpHealthScore: number;
    rankingQueries: Array<{
      query: string;
      position: number;
      volume: string;
      clicks: string;
      intent: string;
    }>;
  };
  aiCitation: {
    status: string;
    isCited: boolean;
    citationReadinessScore: number;
    shareOfVoice: string;
    aiEnginesCited: string[];
    citationSnippet: string;
    geoActionPlan: Array<{
      priority: string;
      title: string;
      details: string;
      impact: string;
    }>;
  };
}

interface NlpEntityItem {
  term: string;
  category: 'High Priority' | 'Secondary' | 'GEO Citation' | 'LSI';
  targetMin: number;
  targetMax: number;
  currentCount: number;
  importance?: string;
}

interface MissingQuestionItem {
  question: string;
  intent: string;
  suggestedAnswerSnippet: string;
}

interface InternalLinkSuggestion {
  anchorText: string;
  targetTopic: string;
  contextSentence: string;
}

interface ContentOptimizerResult {
  keyword: string;
  articleTitle: string;
  initialContent: string;
  contentScore: number;
  scoreBreakdown: {
    semanticRelevance: number;
    contentDepth: number;
    entityCoverage: number;
    readability: number;
  };
  benchmarks: {
    targetWordCount: { min: number; max: number; current: number };
    targetHeadings: { min: number; max: number; current: number };
    readingLevel: string;
    recommendedParagraphLength: string;
  };
  nlpEntities: NlpEntityItem[];
  missingQuestions: MissingQuestionItem[];
  internalLinkingSuggestions: InternalLinkSuggestion[];
}

interface SingleBlogSummaryItem {
  title: string;
  url: string;
  slug: string;
  rank: number;
  monthlyClicks: number;
  monthlyImpressions: number;
  ctr: string;
  topQuery: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  isAiCited: boolean;
  aiCitationScore: number;
  publishDate: string;
}

interface AllBlogsResult {
  domain: string;
  dataSource: 'crawler_mode' | 'gsc_live';
  discoveredCount: number;
  summary: {
    totalBlogs: number;
    totalClicks: number;
    totalImpressions: number;
    averageCtr: string;
    aiCitedPercentage: number;
    topRankingBlog: { title: string; rank: number; clicks: number } | null;
  };
  blogs: SingleBlogSummaryItem[];
}

interface AuditReport {
  url: string;
  domain: string;
  scannedAt: string;
  crawled: {
    title: string;
    description: string;
    robots: string;
    canonical: string;
    hasViewport?: boolean;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterImage?: string;
    schemas?: string[];
    hasSchema?: boolean;
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
    scriptCount?: number;
    stylesheetCount?: number;
    pageSizeKb?: number;
    wordCount: number;
    loadTimeMs: number;
    isHttps: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    vitals?: {
      ttfbMs: number;
      lcpSec: number;
      cls: number;
      inpMs: number;
    };
  };
  audit: {
    healthScore?: number;
    scores: {
      seo: number;
      speed: number;
      security: number;
      mobile: number;
    };
    summary: string;
    issues?: {
      errors: IssueItem[];
      warnings: IssueItem[];
      notices: IssueItem[];
    };
    checklist?: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
      status: 'fail' | 'warning' | 'pass';
      codeFix?: string;
    }>;
    organicKeywords?: OrganicKeyword[];
    contentGaps?: ContentGapItem[];
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
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'keywords' | 'vitals' | 'social' | 'copywriting'>('overview');
  const [issueFilter, setIssueFilter] = useState<'all' | 'errors' | 'warnings' | 'notices'>('all');
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'linkedin' | 'twitter'>('facebook');
  
  // UI state
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [recentAudits, setRecentAudits] = useState<StoredAsset[]>([]);

  // Mode Switcher: single | compare | sitemap | backlinks | blog-serp | optimizer
  const [auditMode, setAuditMode] = useState<'single' | 'compare' | 'sitemap' | 'backlinks' | 'blog-serp' | 'optimizer'>('single');

  // Competitor Comparison state
  const [competitorUrlInput, setCompetitorUrlInput] = useState('');
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<CompetitorComparisonResult | null>(null);

  // Sitemap Deep Scan state
  const [sitemapScanning, setSitemapScanning] = useState(false);
  const [sitemapResult, setSitemapResult] = useState<SitemapScanResult | null>(null);

  // Backlink Equity & Off-Page Audit state
  const [backlinkScanning, setBacklinkScanning] = useState(false);
  const [backlinkResult, setBacklinkResult] = useState<BacklinksResult | null>(null);

  // Blog SERP & AI Citation state
  const [blogSerpScanning, setBlogSerpScanning] = useState(false);
  const [blogSerpResult, setBlogSerpResult] = useState<BlogSerpResult | null>(null);

  // Phase 5: Live AI Content Optimizer state
  const [optimizerKeyword, setOptimizerKeyword] = useState('');
  const [optimizerInputMode, setOptimizerInputMode] = useState<'url' | 'raw'>('url');
  const [optimizerScanning, setOptimizerScanning] = useState(false);
  const [optimizerAutoFixing, setOptimizerAutoFixing] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState<ContentOptimizerResult | null>(null);
  const [liveArticleText, setLiveArticleText] = useState('');
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [liveHeadingsCount, setLiveHeadingsCount] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [liveEntities, setLiveEntities] = useState<NlpEntityItem[]>([]);
  const [entityFilter, setEntityFilter] = useState<'all' | 'missing' | 'optimal' | 'high'>('all');
  const [copiedOptimizerText, setCopiedOptimizerText] = useState(false);

  // Phase 6: All Blogs SERP Directory & GSC state
  const [blogSubTab, setBlogSubTab] = useState<'single' | 'directory'>('directory');
  const [allBlogsScanning, setAllBlogsScanning] = useState(false);
  const [allBlogsResult, setAllBlogsResult] = useState<AllBlogsResult | null>(null);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogRankFilter, setBlogRankFilter] = useState<'all' | 'top3' | 'top10' | 'low' | 'cited'>('all');
  const [blogSortBy, setBlogSortBy] = useState<'clicks' | 'impressions' | 'rank' | 'ctr'>('clicks');

  // GSC Connect Modal state
  const [showGscModal, setShowGscModal] = useState(false);
  const [gscSiteUrl, setGscSiteUrl] = useState('');
  const [gscAccessToken, setGscAccessToken] = useState('');
  const [gscServiceAccountJson, setGscServiceAccountJson] = useState('');
  const [gscConnecting, setGscConnecting] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gscStatusMessage, setGscStatusMessage] = useState('');

  // Robots.txt generator modal/state
  const [showRobotsModal, setShowRobotsModal] = useState(false);
  const [customSitemapPath, setCustomSitemapPath] = useState('');
  const [disallowedPaths, setDisallowedPaths] = useState('/admin/\n/wp-admin/\n/private/');

  // Schema & Security Headers Modals
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Historical score delta calculation
  const getScoreDelta = () => {
    if (!report || recentAudits.length < 2) return null;
    const previous = recentAudits.find(a => a.result?.domain === report.domain && a.result?.scannedAt !== report.scannedAt);
    if (!previous || !previous.result?.audit) return null;
    const prevScore = previous.result.audit.healthScore ?? 
      Math.round((previous.result.audit.scores.seo + previous.result.audit.scores.speed + previous.result.audit.scores.security + previous.result.audit.scores.mobile) / 4);
    const currentScore = report.audit.healthScore ?? 
      Math.round((report.audit.scores.seo + report.audit.scores.speed + report.audit.scores.security + report.audit.scores.mobile) / 4);
    return currentScore - prevScore;
  };

  // Handle Competitor Comparison Scan
  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !competitorUrlInput.trim()) return;

    setComparing(true);
    setErrorMsg('');
    setComparisonResult(null);

    try {
      const res = await fetch('/api/website-audit/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: urlInput.trim(),
          competitorUrl: competitorUrlInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to compare competitor.');
      }
      setComparisonResult(data.comparison);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during competitor comparison.');
    } finally {
      setComparing(false);
    }
  };

  // Handle Sitemap Deep Scan
  const handleSitemapScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setSitemapScanning(true);
    setErrorMsg('');
    setSitemapResult(null);

    try {
      const res = await fetch('/api/website-audit/sitemap-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan sitemap.');
      }
      setSitemapResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during sitemap deep scan.');
    } finally {
      setSitemapScanning(false);
    }
  };

  // Handle Backlink Profile Audit
  const handleBacklinkAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setBacklinkScanning(true);
    setErrorMsg('');
    setBacklinkResult(null);

    try {
      const res = await fetch('/api/website-audit/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze backlink equity.');
      }
      setBacklinkResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during backlink analysis.');
    } finally {
      setBacklinkScanning(false);
    }
  };

  // Handle Blog SERP & AI Citation Analysis
  const handleBlogSerpAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setBlogSerpScanning(true);
    setErrorMsg('');
    setBlogSerpResult(null);

    try {
      const res = await fetch('/api/website-audit/blog-serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze blog SERP and AI Citation.');
      }
      setBlogSerpResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during Blog SERP analysis.');
    } finally {
      setBlogSerpScanning(false);
    }
  };

  // Helper to dynamically calculate live metrics and SurferSEO score as user types
  const recalculateLiveMetrics = (
    text: string,
    entities: NlpEntityItem[],
    benchmarks?: any
  ) => {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const headingMatches = text.match(/^#{1,4}\s+.+$/gm) || [];
    const headingCount = headingMatches.length;

    const lowerText = text.toLowerCase();
    let coveredEntitiesCount = 0;

    const updatedEntities = entities.map((ent) => {
      const termLower = ent.term.toLowerCase();
      let count = 0;
      let pos = lowerText.indexOf(termLower);
      while (pos !== -1) {
        count++;
        pos = lowerText.indexOf(termLower, pos + termLower.length);
      }
      if (count >= ent.targetMin) coveredEntitiesCount++;
      return { ...ent, currentCount: count };
    });

    const entityRatio = entities.length > 0 ? coveredEntitiesCount / entities.length : 0.5;
    const targetMinWords = benchmarks?.targetWordCount?.min || 1500;
    const wordRatio = Math.min(1, wordCount / targetMinWords);
    const targetMinHeadings = benchmarks?.targetHeadings?.min || 6;
    const headingRatio = Math.min(1, headingCount / targetMinHeadings);

    const calculatedScore = Math.round(
      (entityRatio * 55) + (wordRatio * 30) + (headingRatio * 15)
    );

    return {
      wordCount,
      headingCount,
      updatedEntities,
      score: Math.min(100, Math.max(15, calculatedScore)),
    };
  };

  // Handle Content Optimization Audit submit
  const handleContentOptimization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (optimizerInputMode === 'url' && !urlInput.trim()) return;
    if (optimizerInputMode === 'raw' && !liveArticleText.trim()) return;

    setOptimizerScanning(true);
    setErrorMsg('');
    setOptimizerResult(null);

    try {
      const res = await fetch('/api/website-audit/content-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: optimizerInputMode === 'url' ? urlInput.trim() : '',
          content: optimizerInputMode === 'raw' ? liveArticleText.trim() : '',
          keyword: optimizerKeyword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to optimize content.');
      }

      const optData: ContentOptimizerResult = data.data;
      setOptimizerResult(optData);
      setOptimizerKeyword(optData.keyword);
      const textToUse = optData.initialContent || liveArticleText;
      setLiveArticleText(textToUse);

      const metrics = recalculateLiveMetrics(textToUse, optData.nlpEntities, optData.benchmarks);
      setLiveWordCount(metrics.wordCount);
      setLiveHeadingsCount(metrics.headingCount);
      setLiveEntities(metrics.updatedEntities);
      setLiveScore(optData.contentScore || metrics.score);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during Content Optimization.');
    } finally {
      setOptimizerScanning(false);
    }
  };

  // Live text change listener in editor
  const handleLiveTextChange = (newText: string) => {
    setLiveArticleText(newText);
    if (optimizerResult) {
      const metrics = recalculateLiveMetrics(newText, optimizerResult.nlpEntities, optimizerResult.benchmarks);
      setLiveWordCount(metrics.wordCount);
      setLiveHeadingsCount(metrics.headingCount);
      setLiveEntities(metrics.updatedEntities);
      setLiveScore(metrics.score);
    } else {
      setLiveWordCount(newText.split(/\s+/).filter(Boolean).length);
    }
  };

  // 1-Click AI Auto-Optimize
  const handleAutoOptimize = async () => {
    if (!liveArticleText.trim() || !optimizerResult) return;

    setOptimizerAutoFixing(true);
    setErrorMsg('');

    try {
      const missing = liveEntities.filter(e => e.currentCount < e.targetMin);
      const res = await fetch('/api/website-audit/content-optimizer/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: liveArticleText,
          keyword: optimizerKeyword || optimizerResult.keyword,
          missingEntities: missing,
          missingQuestions: optimizerResult.missingQuestions || []
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to auto-optimize article.');
      }

      const enriched = data.data.enrichedContent;
      setLiveArticleText(enriched);
      const metrics = recalculateLiveMetrics(enriched, optimizerResult.nlpEntities, optimizerResult.benchmarks);
      setLiveWordCount(metrics.wordCount);
      setLiveHeadingsCount(metrics.headingCount);
      setLiveEntities(metrics.updatedEntities);
      setLiveScore(Math.max(88, metrics.score));
    } catch (err: any) {
      setErrorMsg(err.message || 'Error auto-optimizing content.');
    } finally {
      setOptimizerAutoFixing(false);
    }
  };

  const insertTermIntoEditor = (term: string) => {
    const updated = liveArticleText ? `${liveArticleText} ${term}` : term;
    handleLiveTextChange(updated);
  };

  // Handle All-Blogs Directory Audit
  const handleAllBlogsScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setAllBlogsScanning(true);
    setErrorMsg('');
    setAllBlogsResult(null);

    try {
      const res = await fetch('/api/website-audit/all-blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to inspect blog directory.');
      }
      setAllBlogsResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while scanning all blogs.');
    } finally {
      setAllBlogsScanning(false);
    }
  };

  // Handle Google Search Console Connection test / query
  const handleGscConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gscSiteUrl.trim()) return;

    setGscConnecting(true);
    setGscStatusMessage('');

    try {
      const res = await fetch('/api/website-audit/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: gscSiteUrl.trim(),
          accessToken: gscAccessToken.trim(),
          serviceAccountJson: gscServiceAccountJson.trim(),
          action: gscAccessToken.trim() ? 'query' : 'test',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'GSC connection failed.');
      }

      setGscConnected(true);
      setGscStatusMessage(data.message || 'Google Search Console synced successfully!');
      if (data.data?.blogs) {
        setAllBlogsResult(data.data);
        setShowGscModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect Google Search Console.');
    } finally {
      setGscConnecting(false);
    }
  };

  // Export blogs performance to CSV
  const exportBlogsToCsv = () => {
    if (!allBlogsResult || allBlogsResult.blogs.length === 0) return;
    const headers = ['Article Title', 'URL', 'SERP Rank', 'Monthly Clicks', 'Monthly Impressions', 'CTR', 'Top Query', 'Search Intent', 'AI Citation', 'AI Score'];
    const rows = allBlogsResult.blogs.map(b => [
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.url}"`,
      b.rank,
      b.monthlyClicks,
      b.monthlyImpressions,
      `"${b.ctr}"`,
      `"${b.topQuery.replace(/"/g, '""')}"`,
      `"${b.intent}"`,
      b.isAiCited ? 'Cited' : 'Uncited',
      b.aiCitationScore
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${allBlogsResult.domain}_all_blogs_serp.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send single blog directly to SurferSEO Content Optimizer
  const handleSendToOptimizer = (blogItem: SingleBlogSummaryItem) => {
    setAuditMode('optimizer');
    setOptimizerInputMode('url');
    setUrlInput(blogItem.url);
    setOptimizerKeyword(blogItem.topQuery);
  };

  // Scanning progress simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanning) {
      setScanStep(1);
      timer = setInterval(() => {
        setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1800);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(timer);
  }, [scanning]);

  // Load past audits from Supabase / localStorage
  useEffect(() => {
    async function loadPastAudits() {
      if (!isSupabaseConfigured()) {
        const local = localStorage.getItem('website_audit_history');
        if (local) {
          try { setRecentAudits(JSON.parse(local)); } catch {}
        }
        return;
      }
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getSession();
        if (!auth.session?.access_token) return;

        const res = await fetch('/api/marketing-assets', {
          headers: { Authorization: `Bearer ${auth.session.access_token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.assets)) {
          const audits = data.assets
            .filter((a: any) => a.tool === 'website_analyzer' && a.result?.audit)
            .slice(0, 5);
          setRecentAudits(audits);
        }
      } catch (e) {
        console.warn('Could not load past audits:', e);
      }
    }
    loadPastAudits();
  }, [report]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setScanning(true);
    setErrorMsg('');
    setReport(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;

      const res = await fetch('/api/website-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze website.');
      }

      setReport(data.report);
      setActiveTab('overview');

      // Cache locally
      const updated = [
        { id: `local-${Date.now()}`, title: `Audit - ${data.report.domain}`, created_at: new Date().toISOString(), result: data.report },
        ...recentAudits.slice(0, 4)
      ];
      setRecentAudits(updated);
      localStorage.setItem('website_audit_history', JSON.stringify(updated));

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while scanning the website.');
    } finally {
      setScanning(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2200);
  };

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compile issues list from 3-tier structure or legacy checklist
  const allErrors = report?.audit.issues?.errors || [];
  const allWarnings = report?.audit.issues?.warnings || [];
  const allNotices = report?.audit.issues?.notices || [];

  const filteredIssues = () => {
    if (issueFilter === 'errors') return allErrors;
    if (issueFilter === 'warnings') return allWarnings;
    if (issueFilter === 'notices') return allNotices;
    return [...allErrors, ...allWarnings, ...allNotices];
  };

  const healthScore = report?.audit.healthScore ?? (
    report ? Math.round((report.audit.scores.seo + report.audit.scores.speed + report.audit.scores.security + report.audit.scores.mobile) / 4) : 0
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                SEO Intelligence Suite
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enterprise Diagnostic &amp; Content Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Website SEO &amp; Speed Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Deep crawler inspection, SERP performance, backlink authority, and generative AI optimization.
            </p>
          </div>

          {/* Quick Technical Toolset */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setShowRobotsModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                Robots.txt
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

              <button
                onClick={() => setShowSchemaModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <Code className="w-3.5 h-3.5 text-indigo-500" />
                Schema
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

              <button
                onClick={() => setShowSecurityModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Security
              </button>
            </div>

            {report && (
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Modern Segmented Mode Navigation Bar */}
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-900/90 rounded-2xl border border-slate-300/60 dark:border-slate-800 shadow-sm">
            
            {/* Mode 1: Single URL */}
            <button
              onClick={() => setAuditMode('single')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'single'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Globe className="w-4 h-4 flex-shrink-0 text-indigo-500" />
              <span>Site Audit</span>
            </button>

            {/* Mode 2: Competitor Battle */}
            <button
              onClick={() => setAuditMode('compare')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'compare'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Swords className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>Competitor VS</span>
            </button>

            {/* Mode 3: Sitemap Crawl */}
            <button
              onClick={() => setAuditMode('sitemap')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'sitemap'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Network className="w-4 h-4 flex-shrink-0 text-sky-500" />
              <span>Sitemap Crawl</span>
            </button>

            {/* Mode 4: Backlinks */}
            <button
              onClick={() => setAuditMode('backlinks')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'backlinks'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Link2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>Backlinks</span>
            </button>

            {/* Mode 5: Blog SERP & AI Citation */}
            <button
              onClick={() => setAuditMode('blog-serp')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'blog-serp'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0 text-purple-500" />
              <span>Blog SERP &amp; GEO</span>
            </button>

            {/* Mode 6: Content Optimizer */}
            <button
              onClick={() => setAuditMode('optimizer')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                auditMode === 'optimizer'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <span>AI Optimizer</span>
            </button>
          </div>
        </div>

        {/* Unified Enterprise Input Card */}
        <div className="mt-5 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Card Context Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {auditMode === 'single' && <Globe className="w-4 h-4 text-indigo-500" />}
                {auditMode === 'compare' && <Swords className="w-4 h-4 text-rose-500" />}
                {auditMode === 'sitemap' && <Network className="w-4 h-4 text-sky-500" />}
                {auditMode === 'backlinks' && <Link2 className="w-4 h-4 text-emerald-500" />}
                {auditMode === 'blog-serp' && <TrendingUp className="w-4 h-4 text-purple-500" />}
                {auditMode === 'optimizer' && <Sparkles className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {auditMode === 'single' && 'Website Technical & SEO Diagnostic'}
                  {auditMode === 'compare' && 'Head-to-Head Competitor Benchmark'}
                  {auditMode === 'sitemap' && 'Multi-Page Sitemap Deep Crawler'}
                  {auditMode === 'backlinks' && 'Off-Page Backlink Authority & Equity'}
                  {auditMode === 'blog-serp' && 'Blog SERP Rankings & AI Citation (GEO)'}
                  {auditMode === 'optimizer' && 'SurferSEO-Style Live Content Optimizer'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {auditMode === 'single' && 'Scan site health score, Core Web Vitals, Schema markup, and 1-click code fixes.'}
                  {auditMode === 'compare' && 'Compare your site side-by-side with a competitor to find ranking & content gaps.'}
                  {auditMode === 'sitemap' && 'Crawl your entire sitemap.xml to find broken links, slow pages, and missing tags.'}
                  {auditMode === 'backlinks' && 'Analyze Domain Rating (DR), referring domains, anchor text safety, and outreach blueprint.'}
                  {auditMode === 'blog-serp' && 'Inspect Google SERP ranks, monthly clicks, impressions, and generative AI citations.'}
                  {auditMode === 'optimizer' && 'Write or paste blog drafts to optimize NLP entity coverage and rank #1 on Google.'}
                </p>
              </div>
            </div>

            {/* Contextual Sub-Tab Selector for Mode 5 */}
            {auditMode === 'blog-serp' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBlogSubTab('directory')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      blogSubTab === 'directory'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Blogs Directory{allBlogsResult?.blogs?.length ? ` (${allBlogsResult.blogs.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlogSubTab('single')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      blogSubTab === 'single'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Single Blog Scan
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGscModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 text-indigo-700 dark:text-indigo-300 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className={`w-2 h-2 rounded-full ${gscConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {gscConnected ? 'GSC Connected' : 'Connect GSC'}
                </button>
              </div>
            )}

            {/* Contextual Sub-Tab Selector for Mode 6 */}
            {auditMode === 'optimizer' && (
              <div className="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOptimizerInputMode('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    optimizerInputMode === 'url'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Scrape Live URL
                </button>
                <button
                  type="button"
                  onClick={() => setOptimizerInputMode('raw')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    optimizerInputMode === 'raw'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Paste Raw Draft
                </button>
              </div>
            )}
          </div>

          {/* MODE 1: SINGLE URL AUDIT */}
          {auditMode === 'single' && (
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter domain or webpage URL (e.g. yourwebsite.com or https://site.com/blog)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={scanning}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={scanning || !urlInput.trim()}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Auditing Site...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Audit Website
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: COMPETITOR HEAD-TO-HEAD */}
          {auditMode === 'compare' && (
            <form onSubmit={handleCompare} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-indigo-500" />
                <input
                  type="text"
                  placeholder="Your Website URL (e.g. yourbrand.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={comparing}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-400">
                VS
              </div>

              <div className="relative flex-1 w-full">
                <Swords className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-500" />
                <input
                  type="text"
                  placeholder="Competitor URL (e.g. competitor.com)"
                  value={competitorUrlInput}
                  onChange={(e) => setCompetitorUrlInput(e.target.value)}
                  disabled={comparing}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={comparing || !urlInput.trim() || !competitorUrlInput.trim()}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {comparing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Simulating Battle...
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    Launch Battle
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: SITEMAP DEEP SCAN */}
          {auditMode === 'sitemap' && (
            <form onSubmit={handleSitemapScan} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Network className="absolute left-3.5 top-3.5 w-4 h-4 text-sky-500" />
                <input
                  type="text"
                  placeholder="Enter domain for full sitemap crawl (e.g. yourwebsite.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={sitemapScanning}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                disabled={sitemapScanning || !urlInput.trim()}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sitemapScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Crawling Sitemap...
                  </>
                ) : (
                  <>
                    <Network className="w-4 h-4" />
                    Deep Scan Sitemap
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 4: BACKLINK EQUITY & OFF-PAGE AUDIT */}
          {auditMode === 'backlinks' && (
            <form onSubmit={handleBacklinkAudit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Enter target domain or URL for Backlink Analysis (e.g. yourwebsite.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={backlinkScanning}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={backlinkScanning || !urlInput.trim()}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {backlinkScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Backlinks...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Audit Backlinks
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 5: BLOG SERP & AI CITATION (GEO) AUDIT + ALL-BLOGS DIRECTORY */}
          {auditMode === 'blog-serp' && (
            blogSubTab === 'directory' ? (
              <form onSubmit={handleAllBlogsScan} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    placeholder="Enter blog domain or sitemap to list all blogs (e.g. site.com or site.com/blog)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={allBlogsScanning}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={allBlogsScanning || !urlInput.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {allBlogsScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning All Blogs &amp; SERP...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-white" />
                      Analyze All Blogs
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBlogSerpAudit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <TrendingUp className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    placeholder="Enter specific blog post URL (e.g. yourwebsite.com/blog/best-seo-tips)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={blogSerpScanning}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={blogSerpScanning || !urlInput.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {blogSerpScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking SERP &amp; AI Citations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Analyze Single Blog
                    </>
                  )}
                </button>
              </form>
            )
          )}

          {/* MODE 6: LIVE CONTENT OPTIMIZER (SURFERSEO STYLE) */}
          {auditMode === 'optimizer' && (
            <form onSubmit={handleContentOptimization} className="flex flex-col md:flex-row gap-3">
              {optimizerInputMode === 'url' ? (
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    placeholder="Enter blog article URL to score & optimize (e.g. domain.com/blog/seo-guide)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={optimizerScanning}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <textarea
                    rows={2}
                    placeholder="Paste your blog draft / raw markdown text here..."
                    value={liveArticleText}
                    onChange={(e) => handleLiveTextChange(e.target.value)}
                    disabled={optimizerScanning}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              <div className="w-full md:w-64">
                <input
                  type="text"
                  placeholder="Primary Keyword (e.g. AI SEO Tools)"
                  value={optimizerKeyword}
                  onChange={(e) => setOptimizerKeyword(e.target.value)}
                  disabled={optimizerScanning}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={optimizerScanning || (optimizerInputMode === 'url' ? !urlInput.trim() : !liveArticleText.trim())}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {optimizerScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing NLP &amp; SERP...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Optimize Content
                  </>
                )}
              </button>
            </form>
          )}

          {/* Scanning Progress Timeline */}
          {scanning && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-medium text-slate-500">
                <span className={`flex items-center gap-1.5 ${scanStep >= 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                  {scanStep > 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  1. Crawling DOM & Headers
                </span>
                <span className={`flex items-center gap-1.5 ${scanStep >= 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                  {scanStep > 2 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : scanStep === 2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '2. Measuring Web Vitals'}
                </span>
                <span className={`flex items-center gap-1.5 ${scanStep >= 3 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                  {scanStep > 3 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : scanStep === 3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '3. Schema & Keywords Gap'}
                </span>
                <span className={`flex items-center gap-1.5 ${scanStep >= 4 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                  {scanStep >= 4 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '4. Compiling Health Score'}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Quick Recent Audits History Bar */}
          {recentAudits.length > 0 && !scanning && !comparing && !sitemapScanning && !backlinkScanning && !blogSerpScanning && !optimizerScanning && !allBlogsScanning && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Recent Scans:
              </span>
              {recentAudits.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setUrlInput(item.result.url);
                    setReport(item.result);
                    setAuditMode('single');
                  }}
                  className="group px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm"
                >
                  <Globe className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span>{item.result.domain}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                    (item.result.audit.healthScore ?? 80) >= 80 
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}>
                    {item.result.audit.healthScore ?? 80}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Report View */}
      {report && (
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top SEMrush Health & KPI Summary Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Site Health Dial */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800 stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${getHealthColor(healthScore)} transition-all duration-1000 ease-out`}
                    strokeWidth="3.5"
                    strokeDasharray={`${healthScore}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {healthScore}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Health
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Overall Site Status
                  </span>
                  {(() => {
                    const delta = getScoreDelta();
                    if (delta === null) return null;
                    const isPositive = delta >= 0;
                    return (
                      <span className={`inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {isPositive ? `+${delta}%` : `${delta}%`} vs prev scan
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {healthScore >= 80 ? 'Excellent Technical Health' : healthScore >= 60 ? 'Moderate SEO & Vitals Gap' : 'Critical Action Needed'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {report.audit.summary}
                </p>
              </div>
            </div>

            {/* Quick 3-Tier Issues Count */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                SEMrush Issue Hierarchy
              </span>

              <div className="grid grid-cols-3 gap-2 my-2">
                <div 
                  onClick={() => { setActiveTab('issues'); setIssueFilter('errors'); }}
                  className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 cursor-pointer hover:border-rose-500 transition-all text-center"
                >
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {allErrors.length}
                  </div>
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    Errors
                  </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('issues'); setIssueFilter('warnings'); }}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 cursor-pointer hover:border-amber-500 transition-all text-center"
                >
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {allWarnings.length}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Warnings
                  </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('issues'); setIssueFilter('notices'); }}
                  className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/60 cursor-pointer hover:border-sky-500 transition-all text-center"
                >
                  <div className="text-xl font-black text-sky-600 dark:text-sky-400">
                    {allNotices.length}
                  </div>
                  <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                    Notices
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Click any badge to view fixes</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer" onClick={() => setActiveTab('issues')}>
                  View all &rarr;
                </span>
              </div>
            </div>

            {/* 4 Core Pillars Score Card */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                4 Pillars Diagnostic
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">On-Page SEO</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getScoreBg(report.audit.scores.seo)}`}>
                    {report.audit.scores.seo}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Speed & Vitals</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getScoreBg(report.audit.scores.speed)}`}>
                    {report.audit.scores.speed}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Security & SSL</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getScoreBg(report.audit.scores.security)}`}>
                    {report.audit.scores.security}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Mobile & UX</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getScoreBg(report.audit.scores.mobile)}`}>
                    {report.audit.scores.mobile}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Executive Overview', icon: Layers },
              { id: 'issues', label: `Issues & Fixes (${allErrors.length + allWarnings.length + allNotices.length})`, icon: AlertTriangle },
              { id: 'keywords', label: 'Keywords & Gap (SEMrush)', icon: TrendingUp, badge: 'Popular' },
              { id: 'vitals', label: 'Core Web Vitals & Tech', icon: Zap },
              { id: 'social', label: 'Social Card Simulator', icon: Share2 },
              { id: 'copywriting', label: 'Copywriting & Market', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Signal Checkpoints */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">HTTPS Status</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {report.crawled.isHttps ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    {report.crawled.isHttps ? 'Secure SSL' : 'Insecure'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Schema.org</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {report.crawled.hasSchema ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {report.crawled.hasSchema ? `${report.crawled.schemas?.length} Detected` : 'Missing'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Robots.txt</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {report.crawled.hasRobotsTxt ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    {report.crawled.hasRobotsTxt ? 'Present' : 'Not Found'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Sitemap.xml</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    {report.crawled.hasSitemap ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {report.crawled.hasSitemap ? 'Present' : 'Missing'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Page Load (TTFB)</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {report.crawled.loadTimeMs} ms
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Word Count</span>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    {report.crawled.wordCount} words
                  </div>
                </div>
              </div>

              {/* Headings & Meta Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" /> Meta Tags Inspection
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Title Tag ({report.crawled.title.length} chars)</span>
                      <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
                        {report.crawled.title || <span className="text-rose-500 italic">Missing Title Tag</span>}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Meta Description ({report.crawled.description.length} chars)</span>
                      <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {report.crawled.description || <span className="text-amber-500 italic">No Meta Description Tag Configured</span>}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400">Canonical: </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{report.crawled.canonical ? 'Specified' : 'Self/Missing'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Robots: </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{report.crawled.robots || 'index, follow'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4 text-indigo-600" /> Heading Hierarchy & Content Signals
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        H1 Tag: {report.crawled.h1Count === 1 ? '1 Tag (Optimal)' : `${report.crawled.h1Count} Tags`}
                      </span>
                      {report.crawled.h1s.length > 0 ? (
                        report.crawled.h1s.map((h1, i) => (
                          <p key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white mb-1">
                            "{h1}"
                          </p>
                        ))
                      ) : (
                        <p className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold">
                          No H1 heading found on page.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 pt-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">H2</span>
                        <span className="font-black text-xs">{report.crawled.headings.h2}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">H3</span>
                        <span className="font-black text-xs">{report.crawled.headings.h3}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">H4</span>
                        <span className="font-black text-xs">{report.crawled.headings.h4}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Images</span>
                        <span className="font-black text-xs">{report.crawled.images.total}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Links</span>
                        <span className="font-black text-xs">{report.crawled.links.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ISSUES & 1-CLICK CODE FIXES */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIssueFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      issueFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Issues ({allErrors.length + allWarnings.length + allNotices.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter('errors')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      issueFilter === 'errors'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-rose-200 text-rose-600 dark:border-rose-900/60 dark:text-rose-400'
                    }`}
                  >
                    Critical Errors ({allErrors.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter('warnings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      issueFilter === 'warnings'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-amber-200 text-amber-600 dark:border-amber-900/60 dark:text-amber-400'
                    }`}
                  >
                    Warnings ({allWarnings.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter('notices')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      issueFilter === 'notices'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'border-sky-200 text-sky-600 dark:border-sky-900/60 dark:text-sky-400'
                    }`}
                  >
                    Notices ({allNotices.length})
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  Showing {filteredIssues().length} issue(s)
                </span>
              </div>

              {/* Issue Cards */}
              <div className="space-y-3">
                {filteredIssues().map((issue, idx) => {
                  const isExpanded = expandedIssues[issue.id || `issue-${idx}`];
                  const isError = allErrors.some(e => e.id === issue.id);
                  const isWarning = allWarnings.some(w => w.id === issue.id);

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isError ? (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            ) : isWarning ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Info className="w-5 h-5 text-sky-500" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isError ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                                isWarning ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                                'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                              }`}>
                                {isError ? 'CRITICAL ERROR' : isWarning ? 'WARNING' : 'NOTICE'}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {issue.category}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {issue.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {issue.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleExpand(issue.id || `issue-${idx}`)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expanded Section: How to fix & 1-Click Code */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              💡 How to Fix:
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {issue.howToFix}
                            </p>
                          </div>

                          {issue.codeFix && (
                            <div className="p-3 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-sans font-semibold flex items-center gap-1.5">
                                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                                  1-Click Code Fix (Paste into &lt;head&gt;):
                                </span>
                                <button
                                  onClick={() => copyCode(issue.codeFix!, issue.id || `code-${idx}`)}
                                  className="text-[11px] font-sans font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                >
                                  {copiedCodeId === (issue.id || `code-${idx}`) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy Code
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="overflow-x-auto text-[11px] p-2 rounded bg-slate-900/80 text-emerald-400">
                                <code>{issue.codeFix}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SEMRUSH ORGANIC KEYWORDS & CONTENT GAP */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              {/* Organic Keywords Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Page Target Keywords (SEMrush Keyword Extractor)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Keywords detected from the page content, headings, and semantic relevance.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {report.audit.organicKeywords?.length || 0} Keywords
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Keyword</th>
                        <th className="pb-3">Search Intent</th>
                        <th className="pb-3">Est. KD %</th>
                        <th className="pb-3">Volume Bracket</th>
                        <th className="pb-3">Relevance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.audit.organicKeywords?.map((kw, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            {kw.keyword}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              kw.intent === 'Transactional' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                              kw.intent === 'Commercial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                              kw.intent === 'Informational' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {kw.intent}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${kw.kd > 60 ? 'bg-rose-500' : kw.kd > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${kw.kd}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{kw.kd}%</span>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                            {kw.estimatedVolume}
                          </td>
                          <td className="py-3">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {kw.relevanceScore}/100
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Content Gap Opportunities */}
              {report.audit.contentGaps && report.audit.contentGaps.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Content Gap Opportunities (Topics Competitors Rank For)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Covering these missing subtopics can boost this page's semantic topical authority.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.audit.contentGaps.map((gap, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                          <span className="text-indigo-600 font-black">•</span>
                          {gap.topic}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {gap.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CORE WEB VITALS & TECHNICALS */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              {/* Web Vitals Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    LCP (Largest Contentful Paint)
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                    {report.crawled.vitals?.lcpSec ?? 1.8}s
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    (report.crawled.vitals?.lcpSec ?? 1.8) < 2.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {(report.crawled.vitals?.lcpSec ?? 1.8) < 2.5 ? 'Good (<2.5s)' : 'Needs Improvement'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Measures main content loading speed.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    CLS (Cumulative Layout Shift)
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                    {report.crawled.vitals?.cls ?? 0.05}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    (report.crawled.vitals?.cls ?? 0.05) <= 0.1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {(report.crawled.vitals?.cls ?? 0.05) <= 0.1 ? 'Good (<=0.1)' : 'Poor'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Visual stability during page load.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    TTFB (Time to First Byte)
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                    {report.crawled.vitals?.ttfbMs ?? report.crawled.loadTimeMs}ms
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    (report.crawled.vitals?.ttfbMs ?? report.crawled.loadTimeMs) < 800 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {(report.crawled.vitals?.ttfbMs ?? report.crawled.loadTimeMs) < 800 ? 'Fast (<800ms)' : 'Slow Response'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Initial server connection latency.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Page Weight & Assets
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                    {report.crawled.pageSizeKb ?? 85} KB
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {report.crawled.scriptCount ?? 12} Scripts • {report.crawled.stylesheetCount ?? 4} CSS
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2">
                    HTML payload without deferred assets.
                  </p>
                </div>
              </div>

              {/* Schema.org Validator */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Schema.org (JSON-LD) Structured Data Inspector
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    report.crawled.hasSchema ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {report.crawled.hasSchema ? 'Structured Data Active' : 'Missing Schema'}
                  </span>
                </div>

                {report.crawled.schemas && report.crawled.schemas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {report.crawled.schemas.map((schema, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                        @{schema}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
                    No JSON-LD structured data detected. Add <code className="font-mono">WebSite</code> or <code className="font-mono">Organization</code> schema to qualify for Google Rich Snippets.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE SOCIAL CARD SIMULATOR */}
          {activeTab === 'social' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Social Share Card Simulator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preview how your webpage displays when shared across social channels.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(['facebook', 'linkedin', 'twitter'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSocialPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        socialPlatform === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Card Mockup */}
              <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
                {/* Image Area */}
                <div className="w-full h-56 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                  {report.crawled.ogImage ? (
                    <img 
                      src={report.crawled.ogImage} 
                      alt="Open Graph preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-medium">No og:image configured</span>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                    {report.domain}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {report.crawled.ogTitle || report.crawled.title || report.domain}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {report.crawled.ogDescription || report.crawled.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COPYWRITING & REGIONAL MARKET */}
          {activeTab === 'copywriting' && (
            <div className="space-y-6">
              {/* Value Proposition */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Value Proposition & Positioning Critique
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {report.audit.copywritingSuggestions.valueProposition}
                </p>
              </div>

              {/* Headline Tweaks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Conversion-Focused Headline Rewrites
                </h4>
                {report.audit.copywritingSuggestions.headlineTweaks.map((hw, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-slate-400 line-through mb-1">
                      Original: "{hw.original}"
                    </div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      Suggested: "{hw.suggested}"
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Why it converts: </span>
                      {hw.reason}
                    </p>
                  </div>
                ))}
              </div>

              {/* Local Market Advice */}
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">
                  Regional & Local Market Optimization (Bangladesh / South Asia)
                </h4>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  {report.audit.copywritingSuggestions.localMarketAdvice}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODE 2 VIEW: COMPETITOR HEAD-TO-HEAD BATTLE BOARD */}
      {auditMode === 'compare' && comparisonResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Battle Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-rose-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-wider">
                  🥊 SEO Battle Arena
                </span>
                <h2 className="text-2xl font-black mt-2">
                  {comparisonResult.target.domain} <span className="text-slate-400 font-light">vs</span> {comparisonResult.competitor.domain}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {comparisonResult.analysis.overallVerdict}
                </p>
              </div>

              {/* Head to Head Health Dials */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs font-bold text-indigo-300 mb-1 truncate max-w-[120px]">
                    {comparisonResult.target.domain}
                  </div>
                  <div className="text-3xl font-black text-indigo-400">
                    {comparisonResult.analysis.targetHealthScore}%
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Health</div>
                </div>

                <div className="text-xl font-black text-slate-500">VS</div>

                <div className="text-center">
                  <div className="text-xs font-bold text-rose-300 mb-1 truncate max-w-[120px]">
                    {comparisonResult.competitor.domain}
                  </div>
                  <div className="text-3xl font-black text-rose-400">
                    {comparisonResult.analysis.competitorHealthScore}%
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Health</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Winners Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { category: 'Speed & Latency', key: 'speed', icon: Zap },
              { category: 'On-Page SEO', key: 'seo', icon: Search },
              { category: 'Content Depth', key: 'content', icon: FileText },
              { category: 'Schema Markup', key: 'technical', icon: Code },
            ].map((cat) => {
              const Icon = cat.icon;
              const winner = comparisonResult.analysis.winners[cat.key as keyof typeof comparisonResult.analysis.winners];
              const isTargetWinner = winner === 'target';
              const isTie = winner === 'tie';

              return (
                <div key={cat.key} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {cat.category}
                    </span>
                    <Trophy className={`w-3.5 h-3.5 ${isTargetWinner ? 'text-indigo-500' : isTie ? 'text-amber-500' : 'text-rose-500'}`} />
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                    {isTie ? 'Draw / Tie' : isTargetWinner ? `🏆 ${comparisonResult.target.domain}` : `🏆 ${comparisonResult.competitor.domain}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {cat.key === 'speed' && `${comparisonResult.target.loadTimeMs}ms vs ${comparisonResult.competitor.loadTimeMs}ms`}
                    {cat.key === 'content' && `${comparisonResult.target.wordCount} words vs ${comparisonResult.competitor.wordCount} words`}
                    {cat.key === 'seo' && `H1: ${comparisonResult.target.h1Count} vs ${comparisonResult.competitor.h1Count}`}
                    {cat.key === 'technical' && `Schema: ${comparisonResult.target.hasSchema ? 'Yes' : 'No'} vs ${comparisonResult.competitor.hasSchema ? 'Yes' : 'No'}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyword & Content Gap Analysis */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Content & Keyword Gap (Competitor Advantage)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Topics and search intents your competitor is capitalizing on that your page currently misses:
            </p>

            <div className="space-y-3">
              {comparisonResult.analysis.contentGap.map((gap, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {gap.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 w-fit">
                      Gap Opportunity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Competitor Strategy: </span>
                    {gap.competitorAngle}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <span className="font-semibold">Counter-Action: </span>
                    {gap.actionForTarget}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Outrank This Competitor Roadmap */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              "How to Outrank This Competitor" Tactical Action Plan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Prioritized high-leverage steps designed to overtake this competitor in organic search results:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonResult.analysis.outrankBlueprint.map((plan, i) => (
                <div key={i} className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        {plan.priority} Priority
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {plan.impact}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {plan.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3 VIEW: SITEMAP DEEP SCAN RESULTS */}
      {auditMode === 'sitemap' && sitemapResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                  🗺️ Multi-Page Sitemap Crawl
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Discovered {sitemapResult.totalPagesDiscovered} URLs across {sitemapResult.sitemapUrl}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sampled top {sitemapResult.sampleSize} core pages concurrently for technical SEO signals.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {sitemapResult.overallScore}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Site Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-rose-500">
                    {sitemapResult.totalIssuesCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Issues Found</div>
                </div>
              </div>
            </div>

            {/* Sitemap Multi-Page Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 px-3">Page URL</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Title Tag</th>
                    <th className="pb-3 px-3">H1 Heading</th>
                    <th className="pb-3 px-3">Load Time</th>
                    <th className="pb-3 px-3">Score</th>
                    <th className="pb-3 px-3">Detected Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {sitemapResult.pages.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="py-3 px-3 max-w-[200px] truncate font-medium text-slate-900 dark:text-white">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          {p.url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.status === 200 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[220px] truncate text-slate-600 dark:text-slate-300">
                        {p.title}
                      </td>
                      <td className="py-3 px-3">
                        {p.hasH1 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {p.loadTimeMs}ms
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getScoreBg(p.score)}`}>
                          {p.score}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.issues.length === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Clean</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.issues.slice(0, 2).map((iss, iIdx) => (
                              <span key={iIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                {iss}
                              </span>
                            ))}
                            {p.issues.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{p.issues.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4 VIEW: BACKLINK PROFILE & OFF-PAGE EQUITY (Ahrefs / SEMrush) */}
      {auditMode === 'backlinks' && backlinkResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  🔗 Off-Page Authority & Link Equity
                </span>
                <h2 className="text-2xl font-black mt-2">
                  Backlink Profile & Equity: {urlInput.replace(/^https?:\/\//, '')}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {backlinkResult.linkProfileSummary}
                </p>
              </div>

              {/* Authority Metrics */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-400">
                    {backlinkResult.domainRating}/100
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Domain Rating (DR)</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-400">
                    {backlinkResult.referringDomains}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ref Domains</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-black text-sky-400">
                    {backlinkResult.dofollowRatio}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Dofollow Ratio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Estimated Backlinks
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {backlinkResult.estimatedBacklinks}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active Index Signals
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Authority Score
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {backlinkResult.authorityScore}%
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Organic Search Weight
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Toxic Link Risk
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-1">
                {backlinkResult.toxicScore}
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                Risk Level: {backlinkResult.toxicRisk}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Link Quality Rating
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {backlinkResult.domainRating >= 60 ? 'Tier A (High)' : backlinkResult.domainRating >= 40 ? 'Tier B (Moderate)' : 'Tier C (Growing)'}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Competitive Standing
              </span>
            </div>
          </div>

          {/* Referring Domain Categories & Anchor Text Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-600" />
                Referring Website Industries & Niches
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Distribution of industry niches linking back to this domain.
              </p>

              <div className="space-y-3">
                {backlinkResult.topReferringCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{cat.percentage}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cat.impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {cat.impact} Impact
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anchors */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Anchor Text Profile (Anti-Spam Safety)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Proportion of branded vs commercial keyword anchors to verify Google Penguin algorithm safety.
              </p>

              <div className="space-y-3">
                {backlinkResult.anchorTextDistribution.map((anc, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{anc.anchor}</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{anc.share}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: anc.share }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* High-Impact Link Building Outreach Roadmap */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Strategic Link Building & Outreach Blueprint (How to Build High-DA Links)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tailored outreach campaigns to safely acquire authoritative editorial backlinks and accelerate organic ranking:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {backlinkResult.linkBuildingRoadmap.map((road, i) => (
                <div key={i} className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        {road.priority} Priority
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        {road.estimatedImpact}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {road.strategy}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Target Prospects: </span>
                      {road.targetProspects}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/80 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Outreach Angle: </span>
                      {road.pitchAngle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 5.B: ALL-BLOGS DIRECTORY & PERFORMANCE HUB (PHASE 6) */}
      {auditMode === 'blog-serp' && blogSubTab === 'directory' && allBlogsResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Summary & KPI Top Card */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500 text-white uppercase tracking-wider">
                    📑 All-Blogs Directory Intelligence
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {allBlogsResult.dataSource === 'gsc_live' ? '⚡ Google Search Console Synced' : '🌐 Crawler + SERP Mode'}
                  </span>
                </div>
                <h2 className="text-2xl font-black mt-2">
                  {allBlogsResult.domain} — Full Blog Portfolio
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Discovered {allBlogsResult.summary.totalBlogs} indexed blog posts across the domain. Track rankings, organic clicks, impressions, and generative AI citations.
                </p>
              </div>

              {/* KPI Dials */}
              <div className="flex flex-wrap items-center gap-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">
                    {allBlogsResult.summary.totalBlogs}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Blogs</div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-400">
                    {allBlogsResult.summary.totalClicks.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Clicks</div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-3xl font-black text-sky-400">
                    {allBlogsResult.summary.totalImpressions.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Impressions</div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-3xl font-black text-amber-400">
                    {allBlogsResult.summary.averageCtr}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Average CTR</div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-400">
                    {allBlogsResult.summary.aiCitedPercentage}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">AI Cited</div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by article title, slug, or top keyword..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Action Buttons & Export */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportBlogsToCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export to CSV
                </button>

                <button
                  type="button"
                  onClick={() => setShowGscModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync GSC
                </button>
              </div>
            </div>

            {/* Filter Pills & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBlogRankFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    blogRankFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All ({allBlogsResult.blogs.length})
                </button>

                <button
                  type="button"
                  onClick={() => setBlogRankFilter('top3')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    blogRankFilter === 'top3'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  🥇 Top 3 Rank ({allBlogsResult.blogs.filter(b => b.rank <= 3).length})
                </button>

                <button
                  type="button"
                  onClick={() => setBlogRankFilter('top10')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    blogRankFilter === 'top10'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-600'
                  }`}
                >
                  🎯 Top 10 Rank ({allBlogsResult.blogs.filter(b => b.rank <= 10).length})
                </button>

                <button
                  type="button"
                  onClick={() => setBlogRankFilter('low')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    blogRankFilter === 'low'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600'
                  }`}
                >
                  ⚠️ Needs Work (#11+) ({allBlogsResult.blogs.filter(b => b.rank > 10).length})
                </button>

                <button
                  type="button"
                  onClick={() => setBlogRankFilter('cited')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    blogRankFilter === 'cited'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600'
                  }`}
                >
                  🤖 AI Cited ({allBlogsResult.blogs.filter(b => b.isAiCited).length})
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 text-[11px]">Sort By:</span>
                <select
                  value={blogSortBy}
                  onChange={(e: any) => setBlogSortBy(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="clicks">Highest Clicks</option>
                  <option value="impressions">Highest Impressions</option>
                  <option value="rank">Best Rank (#1 First)</option>
                  <option value="ctr">Highest CTR%</option>
                </select>
              </div>
            </div>

            {/* Performance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Blog Article</th>
                    <th className="p-3.5 text-center">Google Rank</th>
                    <th className="p-3.5 text-right">Clicks</th>
                    <th className="p-3.5 text-right">Impressions</th>
                    <th className="p-3.5 text-center">CTR</th>
                    <th className="p-3.5">Top Query</th>
                    <th className="p-3.5 text-center">AI Citation</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {allBlogsResult.blogs
                    .filter(b => {
                      if (blogRankFilter === 'top3') return b.rank <= 3;
                      if (blogRankFilter === 'top10') return b.rank <= 10;
                      if (blogRankFilter === 'low') return b.rank > 10;
                      if (blogRankFilter === 'cited') return b.isAiCited;
                      return true;
                    })
                    .filter(b => {
                      if (!blogSearchQuery.trim()) return true;
                      const q = blogSearchQuery.toLowerCase();
                      return b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || b.topQuery.toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      if (blogSortBy === 'clicks') return b.monthlyClicks - a.monthlyClicks;
                      if (blogSortBy === 'impressions') return b.monthlyImpressions - a.monthlyImpressions;
                      if (blogSortBy === 'rank') return a.rank - b.rank;
                      if (blogSortBy === 'ctr') return parseFloat(b.ctr) - parseFloat(a.ctr);
                      return 0;
                    })
                    .map((blog, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/50 transition-colors">
                        {/* Title & URL */}
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {blog.title}
                          </div>
                          <a
                            href={blog.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline truncate block flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{blog.url.replace(/^https?:\/\//, '')}</span>
                          </a>
                        </td>

                        {/* Rank */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                            blog.rank <= 3
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : blog.rank <= 10
                              ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          }`}>
                            #{blog.rank}
                          </span>
                        </td>

                        {/* Clicks */}
                        <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                          {blog.monthlyClicks.toLocaleString()}
                        </td>

                        {/* Impressions */}
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-300 font-mono">
                          {blog.monthlyImpressions.toLocaleString()}
                        </td>

                        {/* CTR */}
                        <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {blog.ctr}
                        </td>

                        {/* Top Query */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                            {blog.topQuery}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {blog.intent}
                          </span>
                        </td>

                        {/* AI Citation */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            blog.isAiCited
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {blog.isAiCited ? `Cited (${blog.aiCitationScore}%)` : 'Uncited'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendToOptimizer(blog)}
                              title="Optimize in SurferSEO Workbench"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm flex items-center gap-1"
                            >
                              <Wand2 className="w-3 h-3" />
                              Optimize
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUrlInput(blog.url);
                                setBlogSubTab('single');
                              }}
                              title="Audit SERP in detail"
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 5.A VIEW: SINGLE BLOG SERP & AI CITATION (GEO) BOARD */}
      {auditMode === 'blog-serp' && blogSubTab === 'single' && blogSerpResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500 text-white uppercase tracking-wider">
                    📊 Blog SERP & Generative AI Citation (GEO)
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    blogSerpResult.aiCitation.isCited 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {blogSerpResult.aiCitation.status}
                  </span>
                </div>
                <h2 className="text-2xl font-black mt-2">
                  {blogSerpResult.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {blogSerpResult.aiCitation.citationSnippet}
                </p>
              </div>

              {/* Core SERP & GEO Dials */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">
                    #{blogSerpResult.serp.averageRank}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Est. Google Rank</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-400">
                    {blogSerpResult.serp.estimatedMonthlyClicks.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Monthly Clicks</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-black text-sky-400">
                    {blogSerpResult.serp.estimatedMonthlyImpressions.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Impressions</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-black text-amber-400">
                    {blogSerpResult.aiCitation.citationReadinessScore}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">AI Citation Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Average CTR%
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {blogSerpResult.serp.averageCtr}
              </div>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                Click-Through Rate
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                SERP Health
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {blogSerpResult.serp.serpHealthScore}/100
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Competitive Stability
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                AI Share of Voice
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                {blogSerpResult.aiCitation.shareOfVoice}
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Conversational Queries
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                AI Engines Citing
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white my-1 truncate">
                {blogSerpResult.aiCitation.aiEnginesCited.length > 0 
                  ? blogSerpResult.aiCitation.aiEnginesCited.join(', ')
                  : 'Needs Optimization'}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Perplexity / Gemini / ChatGPT
              </span>
            </div>
          </div>

          {/* Ranking Queries Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-600" />
                  Target Google SERP Ranking Queries & Clicks
                </h3>
                <p className="text-xs text-slate-500">
                  Search phrases for which this blog post ranks in Google SERP with projected clicks and search intent.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {blogSerpResult.serp.rankingQueries.length} Queries Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 px-3">Search Query</th>
                    <th className="pb-3 px-3">SERP Rank</th>
                    <th className="pb-3 px-3">Est. Monthly Volume</th>
                    <th className="pb-3 px-3">Projected Clicks</th>
                    <th className="pb-3 px-3">Search Intent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {blogSerpResult.serp.rankingQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {q.query}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          q.position <= 3 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : q.position <= 10 
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          #{q.position}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {q.volume}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {q.clicks} clicks/mo
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {q.intent}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GEO (Generative Engine Optimization) Action Blueprint */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Generative Engine Optimization (GEO) Blueprint: How to Become the #1 AI Cited Source
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Implement these structured tweaks so Perplexity AI, ChatGPT Search, and Gemini Grounding reliably reference your blog:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blogSerpResult.aiCitation.geoActionPlan.map((plan, i) => (
                <div key={i} className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        {plan.priority} Priority
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {plan.impact}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {plan.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 6 VIEW: LIVE AI CONTENT OPTIMIZER & NLP SCORER (SURFERSEO STYLE) */}
      {auditMode === 'optimizer' && optimizerResult && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    SurferSEO-Style NLP Content Optimizer
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Target: &quot;{optimizerResult.keyword}&quot;
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                    {optimizerResult.benchmarks.readingLevel}
                  </span>
                </div>
                <h2 className="text-2xl font-black mt-2">
                  {optimizerResult.articleTitle}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Real-time entity frequency tracking, Google #1 SERP benchmark modeling, and 1-click generative AI optimization.
                </p>
              </div>

              {/* Dynamic Score & Core Targets */}
              <div className="flex items-center gap-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-center">
                  <div className={`text-4xl font-black ${
                    liveScore >= 80 ? 'text-emerald-400' : liveScore >= 65 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {liveScore}
                    <span className="text-sm font-bold text-slate-400">/100</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mt-0.5">
                    Content Score
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">
                    {liveWordCount.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400">
                      {' '}/ {optimizerResult.benchmarks.targetWordCount.min}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mt-0.5">
                    Word Count
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-800" />

                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">
                    {liveHeadingsCount}
                    <span className="text-xs font-normal text-slate-400">
                      {' '}/ {optimizerResult.benchmarks.targetHeadings.min}+
                    </span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-slate-400 mt-0.5">
                    Headings
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Split Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT / CENTER: Interactive Writing Studio (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                {/* Editor Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Live Content Studio
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • {Math.ceil(liveWordCount / 200)} min read
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoOptimize}
                      disabled={optimizerAutoFixing}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {optimizerAutoFixing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          AI Auto-Optimizing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                          Auto-Fix with AI
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(liveArticleText);
                        setCopiedOptimizerText(true);
                        setTimeout(() => setCopiedOptimizerText(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
                    >
                      {copiedOptimizerText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Markdown
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Writing Textarea */}
                <div>
                  <textarea
                    rows={22}
                    value={liveArticleText}
                    onChange={(e) => handleLiveTextChange(e.target.value)}
                    placeholder="Write or edit your article here... The NLP score and entity frequencies update dynamically as you type!"
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                    <span>Markdown formatting supported (# H1, ## H2, - lists, &gt; blockquotes)</span>
                    <span>{liveWordCount} words • {liveArticleText.length} characters</span>
                  </div>
                </div>
              </div>

              {/* People Also Ask & Missing Questions Accordion */}
              {optimizerResult.missingQuestions && optimizerResult.missingQuestions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-sky-500" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Questions to Cover (Google PAA & Perplexity AI Intent)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Essential for Rich Snippets & AI Citations
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {optimizerResult.missingQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {q.question}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                              {q.intent}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                            {q.suggestedAnswerSnippet}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const addition = `\n\n### ${q.question}\n${q.suggestedAnswerSnippet}`;
                            handleLiveTextChange(liveArticleText + addition);
                          }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 whitespace-nowrap self-start md:self-center"
                        >
                          + Append Section
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Linking Recommendations */}
              {optimizerResult.internalLinkingSuggestions && optimizerResult.internalLinkingSuggestions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Recommended Internal Links (PageRank Silo Architecture)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {optimizerResult.internalLinkingSuggestions.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                            [{link.anchorText}]
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {link.targetTopic}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                          &quot;{link.contextSentence}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`[${link.anchorText}](/${link.anchorText.toLowerCase().replace(/\\s+/g, '-')})`);
                            alert(`Anchor copied: [${link.anchorText}]`);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Anchor Markdown
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: Live SurferSEO-Style NLP Inspector (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Score Breakdown Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-500" />
                    Score Breakdown
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    liveScore >= 80 ? 'bg-emerald-100 text-emerald-700' : liveScore >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {liveScore >= 80 ? '🏆 Rank-Ready' : liveScore >= 65 ? '👍 Good' : '⚠️ Under-Optimized'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span>Semantic Relevance</span>
                      <span className="font-mono">{optimizerResult.scoreBreakdown.semanticRelevance}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${optimizerResult.scoreBreakdown.semanticRelevance}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span>Entity Coverage</span>
                      <span className="font-mono">
                        {Math.round((liveEntities.filter(e => e.currentCount >= e.targetMin).length / Math.max(1, liveEntities.length)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((liveEntities.filter(e => e.currentCount >= e.targetMin).length / Math.max(1, liveEntities.length)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span>Content Depth</span>
                      <span className="font-mono">
                        {Math.min(100, Math.round((liveWordCount / optimizerResult.benchmarks.targetWordCount.min) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((liveWordCount / optimizerResult.benchmarks.targetWordCount.min) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span>Readability Index</span>
                      <span className="font-mono">{optimizerResult.scoreBreakdown.readability}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${optimizerResult.scoreBreakdown.readability}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* NLP Entities & LSI Terms Inspector */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      NLP Entities &amp; LSI Terms
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500">
                      {liveEntities.filter(e => e.currentCount >= e.targetMin).length} / {liveEntities.length} optimal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Include these semantic terms to match Google #1 SERP patterns.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setEntityFilter('all')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      entityFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({liveEntities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityFilter('missing')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      entityFilter === 'missing'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    Missing ({liveEntities.filter(e => e.currentCount === 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityFilter('optimal')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      entityFilter === 'optimal'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    Optimal ({liveEntities.filter(e => e.currentCount >= e.targetMin && e.currentCount <= e.targetMax).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityFilter('high')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      entityFilter === 'high'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    High ({liveEntities.filter(e => e.category === 'High Priority' || e.category === 'GEO Citation').length})
                  </button>
                </div>

                {/* Entity Cards List */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {liveEntities
                    .filter((ent) => {
                      if (entityFilter === 'missing') return ent.currentCount === 0;
                      if (entityFilter === 'optimal') return ent.currentCount >= ent.targetMin && ent.currentCount <= ent.targetMax;
                      if (entityFilter === 'high') return ent.category === 'High Priority' || ent.category === 'GEO Citation';
                      return true;
                    })
                    .map((ent, idx) => {
                      const isOptimal = ent.currentCount >= ent.targetMin && ent.currentCount <= ent.targetMax;
                      const isMissing = ent.currentCount === 0;
                      const isOver = ent.currentCount > ent.targetMax;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                            isOptimal
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                              : isMissing
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                              : isOver
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {ent.term}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold">{ent.category}</span>
                              {ent.importance && <span>• {ent.importance.slice(0, 32)}...</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                isOptimal
                                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                  : isMissing
                                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                                  : isOver
                                  ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                                  : 'bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200'
                              }`}
                            >
                              {ent.currentCount} / {ent.targetMin}-{ent.targetMax}
                            </span>

                            <button
                              type="button"
                              title="Append this entity to content"
                              onClick={() => insertTermIntoEditor(ent.term)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold transition-all text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK ROBOTS.TXT GENERATOR MODAL */}
      {showRobotsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Technical SEO: 1-Click Robots.txt Generator
                </h3>
              </div>
              <button
                onClick={() => setShowRobotsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Generate an optimized, search-engine-friendly <code className="text-indigo-600">robots.txt</code> file tailored for your domain to stop search crawlers from wasting crawl budget on private paths.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Sitemap URL:
                </label>
                <input
                  type="text"
                  placeholder="https://yourdomain.com/sitemap.xml"
                  value={customSitemapPath || (report?.domain ? `https://${report.domain}/sitemap.xml` : '')}
                  onChange={(e) => setCustomSitemapPath(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Disallowed Paths (one per line):
                </label>
                <textarea
                  rows={3}
                  value={disallowedPaths}
                  onChange={(e) => setDisallowedPaths(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Generated Output:
                </label>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto">
{`User-agent: *
${disallowedPaths.split('\n').filter(Boolean).map(p => `Disallow: ${p.trim()}`).join('\n')}
Allow: /

Sitemap: ${customSitemapPath || (report?.domain ? `https://${report.domain}/sitemap.xml` : 'https://example.com/sitemap.xml')}
`}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const sitemap = customSitemapPath || (report?.domain ? `https://${report.domain}/sitemap.xml` : 'https://example.com/sitemap.xml');
                  const content = `User-agent: *\n${disallowedPaths.split('\n').filter(Boolean).map(p => `Disallow: ${p.trim()}`).join('\n')}\nAllow: /\n\nSitemap: ${sitemap}\n`;
                  navigator.clipboard.writeText(content);
                  alert('Robots.txt content copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Robots.txt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK SCHEMA.ORG JSON-LD GENERATOR MODAL */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  1-Click Schema.org (JSON-LD) Generator
                </h3>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ready-to-paste <code className="text-indigo-600 font-mono">Organization</code> and <code className="text-indigo-600 font-mono">WebSite</code> structured data markup to unlock Google Rich Results and Knowledge Graph badges.
            </p>

            <div className="space-y-3">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                Structured Data Markup (JSON-LD):
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto max-h-64">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://${report?.domain || 'yourdomain.com'}/#organization",
      "name": "${report?.crawled.ogTitle || report?.domain || 'Your Brand'}",
      "url": "https://${report?.domain || 'yourdomain.com'}",
      "logo": "${report?.crawled.ogImage || 'https://' + (report?.domain || 'yourdomain.com') + '/logo.png'}"
    },
    {
      "@type": "WebSite",
      "@id": "https://${report?.domain || 'yourdomain.com'}/#website",
      "url": "https://${report?.domain || 'yourdomain.com'}",
      "name": "${report?.crawled.title || report?.domain || 'Your Site'}",
      "publisher": {
        "@id": "https://${report?.domain || 'yourdomain.com'}/#organization"
      }
    }
  ]
}
</script>`}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const schemaSnippet = `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": "Organization",\n      "@id": "https://${report?.domain || 'yourdomain.com'}/#organization",\n      "name": "${report?.crawled.ogTitle || report?.domain || 'Your Brand'}",\n      "url": "https://${report?.domain || 'yourdomain.com'}",\n      "logo": "${report?.crawled.ogImage || 'https://' + (report?.domain || 'yourdomain.com') + '/logo.png'}"\n    },\n    {\n      "@type": "WebSite",\n      "@id": "https://${report?.domain || 'yourdomain.com'}/#website",\n      "url": "https://${report?.domain || 'yourdomain.com'}",\n      "name": "${report?.crawled.title || report?.domain || 'Your Site'}",\n      "publisher": {\n        "@id": "https://${report?.domain || 'yourdomain.com'}/#organization"\n      }\n    }\n  ]\n}\n</script>`;
                  navigator.clipboard.writeText(schemaSnippet);
                  alert('Schema.org JSON-LD copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Schema JSON-LD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK SECURITY HEADERS GENERATOR MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Technical Security Headers Config
                </h3>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Paste these production headers into your web server (<code className="font-mono text-amber-600">next.config.js</code>, Nginx, or Cloudflare) to protect your domain from Clickjacking and XSS.
            </p>

            <div className="space-y-3">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                Next.js / Nginx Recommended Headers:
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-amber-300 font-mono text-[11px] overflow-x-auto max-h-60">
{`// next.config.js security headers
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  }
};`}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const headersConfig = `// Security Headers\nconst securityHeaders = [\n  { key: 'X-Frame-Options', value: 'DENY' },\n  { key: 'X-Content-Type-Options', value: 'nosniff' },\n  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },\n  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }\n];`;
                  navigator.clipboard.writeText(headersConfig);
                  alert('Security headers copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Headers Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE SEARCH CONSOLE CONNECT MODAL (PHASE 6) */}
      {showGscModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                  G
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Connect Google Search Console (GSC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGscModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect your verified Google Search Console property to pull 100% genuine Google organic search impressions, clicks, CTR, and average position for all blog posts.
            </p>

            <form onSubmit={handleGscConnect} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Search Console Property URL:
                </label>
                <input
                  type="text"
                  placeholder="https://yourdomain.com/ or sc-domain:yourdomain.com"
                  value={gscSiteUrl || (report?.domain ? `https://${report.domain}/` : '')}
                  onChange={(e) => setGscSiteUrl(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Must exactly match the site URL property defined in your Google Search Console.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google OAuth 2.0 Access Token (Recommended for Instant Sync):
                </label>
                <input
                  type="password"
                  placeholder="ya29.a0AfH6SM..."
                  value={gscAccessToken}
                  onChange={(e) => setGscAccessToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Token requires scope: <code className="text-indigo-600 font-mono">https://www.googleapis.com/auth/webmasters.readonly</code>
                </span>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Or Service Account JSON</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google Cloud Service Account Key (JSON):
                </label>
                <textarea
                  rows={3}
                  placeholder='{"type": "service_account", "project_id": "...", "client_email": "...", "private_key": "..."}'
                  value={gscServiceAccountJson}
                  onChange={(e) => setGscServiceAccountJson(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Add the Service Account <code className="text-indigo-600 font-mono">client_email</code> as a &quot;Viewer&quot; in Google Search Console Settings.
                </span>
              </div>

              {gscStatusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{gscStatusMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput(gscSiteUrl || report?.domain || '');
                    setBlogSubTab('directory');
                    setShowGscModal(false);
                    handleAllBlogsScan();
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline"
                >
                  Use Instant Crawler Mode (No Credentials)
                </button>

                <button
                  type="submit"
                  disabled={gscConnecting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {gscConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting GSC...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Verify &amp; Fetch GSC Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
