'use client';

import NextLink from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Globe,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  PlayCircle,
  Rocket,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Video,
  XCircle,
  Zap,
  Camera,
  Calendar,
  Layers,
  X as XIcon,
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';
import BrandLogo from '@/components/layout/BrandLogo';
import { useTheme } from '@/components/layout/ThemeProvider';
import { PredictiveArcCanvas } from '@/shaders/predictive-arc/PredictiveArcCanvas';
import '@/shaders/threeui.css';

/* ── Smooth Animated Counter with Cubic-Bezier Easing ── */
function SmoothCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let animationFrameId: number;

    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setCount(Math.round(easedProgress * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix && <span className="text-[#FF5533] ml-0.5">{suffix}</span>}
    </span>
  );
}

type HeroStatItem = {
  value: number;
  suffix?: string;
  label: string;
  subtext: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

/* ── Interactive Spotlight Stat Card ── */
function StatCard({ stat }: { stat: HeroStatItem }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const Icon = stat.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      variants={fadeUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-3xl border border-neutral-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#08080a]/85 backdrop-blur-xl p-6 sm:p-7 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-[#FF5533]/45 shadow-lg shadow-neutral-200/50 dark:shadow-[0_22px_45px_-12px_rgba(255,85,51,0.25)] overflow-hidden"
    >
      {/* Dynamic Cursor Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 85, 51, 0.18), transparent 70%)`,
        }}
      />

      {/* Top Rim Shimmer Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5533]/30 to-transparent group-hover:via-[#FF5533]/80 transition-all duration-500" />

      {/* Ambient Top Corner Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#FF5533]/25 via-[#FF8A00]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header Row: Micro Icon & Pill Badge */}
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF5533]/15 to-[#FF8A00]/5 border border-[#FF5533]/25 flex items-center justify-center text-[#FF5533] shadow-sm shadow-[#FF5533]/10 group-hover:scale-105 group-hover:border-[#FF5533]/50 group-hover:bg-gradient-to-r group-hover:from-[#FF473A] group-hover:to-[#FF8526] group-hover:text-white transition-all duration-300">
          <Icon size={18} />
        </div>
        <span className="rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-100/80 dark:bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 group-hover:border-[#FF5533]/30 group-hover:text-[#FF7A45] transition-colors">
          {stat.badge}
        </span>
      </div>

      {/* Large Metric Number */}
      <div className="relative z-10">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-neutral-900 dark:group-hover:from-white group-hover:via-[#FF622E] dark:group-hover:via-[#FFF0EC] group-hover:to-[#FF8A00] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          <SmoothCounter value={stat.value} suffix={stat.suffix} />
        </div>

        {/* Primary Title */}
        <h4 className="mt-2 text-base font-black text-neutral-900 dark:text-white tracking-wide transition-colors">
          {stat.label}
        </h4>

        {/* Subtext description */}
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium group-hover:text-neutral-800 dark:group-hover:text-neutral-300 transition-colors">
          {stat.subtext}
        </p>
      </div>

      {/* Bottom Subtle Indicator Bar */}
      <div className="relative z-10 mt-5 h-1 w-full rounded-full bg-neutral-200/80 dark:bg-white/[0.04] overflow-hidden">
        <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] transition-all duration-700 ease-out rounded-full" />
      </div>
    </motion.div>
  );
}

/* ── Hero Stats Data ── */
const heroStats: HeroStatItem[] = [
  {
    value: 12,
    suffix: '+',
    label: 'AI Tools',
    subtext: 'Growth & SEO Workflows',
    badge: 'Full Suite',
    icon: Sparkles,
  },
  {
    value: 1,
    suffix: '',
    label: 'Workplace',
    subtext: 'Strategy to execution hub',
    badge: 'All-in-One',
    icon: Layers,
  },
  {
    value: 10,
    suffix: 'x',
    label: 'Faster Output',
    subtext: 'High-velocity AI engine',
    badge: 'Velocity',
    icon: Zap,
  },
  {
    value: 100,
    suffix: '%',
    label: 'Ultimate Growth',
    subtext: 'Visibility, traffic & scale',
    badge: 'Results',
    icon: TrendingUp,
  },
];

/* ── Business Burning Problems vs GrowthPilot Solutions ── */
type BusinessProblemItem = {
  id: string;
  category: string;
  painMetric: string;
  solutionMetric: string;
  painTitle: string;
  painDescription: string;
  painPoints: string[];
  painTakeaway: string;
  solutionTitle: string;
  solutionDescription: string;
  solutionPoints: string[];
  solutionTakeaway: string;
  icon: typeof DollarSign;
};

const businessProblems: BusinessProblemItem[] = [
  {
    id: 'agency-bleed',
    category: 'Agency Retainers & Cash Burn',
    painMetric: '-$4,500/mo Burn',
    painTitle: 'Agency & Freelancer Money Pit',
    painDescription: 'Paying bloated monthly retainers for slow drafts that deliver flat traffic and zero direct pipeline ROI.',
    painPoints: [
      '2–3 weeks turnaround lag for a single draft',
      'High monthly invoices with zero revenue accountability',
    ],
    painTakeaway: 'High invoices, slow turnaround, flat organic traffic.',
    solutionTitle: 'Autonomous In-House Engine',
    solutionMetric: 'Save $40,000+/yr',
    solutionDescription: 'Execute publish-ready SEO articles & multi-channel campaigns in under 60 seconds at 95% lower cost.',
    solutionPoints: [
      'Publish 10x faster with unlimited runs & zero delays',
      '100% on-brand voice via permanent Brand Brain memory',
    ],
    solutionTakeaway: '10x velocity at 5% of agency cost with Brand Brain memory.',
    icon: DollarSign,
  },
  {
    id: 'algorithm-slap',
    category: 'Google HCU & Search Risk',
    painMetric: 'De-indexing Risk',
    painTitle: 'Google HCU & Core Algorithm Penalties',
    painDescription: 'Raw ChatGPT prompts produce low-effort slop that gets flagged and de-indexed, crashing your traffic.',
    painPoints: [
      'Devastating traffic drops after Google Core Updates',
      'Surface-level fluff lacking genuine EEAT authority & schema',
    ],
    painTakeaway: 'Generic AI text gets penalized by search engines.',
    solutionTitle: '76+ Semantic SEO & EEAT Engine',
    solutionMetric: '76+ SEO Checks',
    solutionDescription: 'Engineered against 76+ on-page SEO factors and NLP clusters to rank on Page 1 and withstand algorithm updates.',
    solutionPoints: [
      '76+ automated technical and on-page SEO compliance checks',
      'Deep semantic NLP keyword clusters built for real search intent',
    ],
    solutionTakeaway: 'Rank on Page 1 with algorithm-proof authority.',
    icon: ShieldAlert,
  },
  {
    id: 'tool-sprawl',
    category: 'Subscription Sprawl & Fatigue',
    painMetric: '8 Apps • $1,200/mo',
    painTitle: '8 Fragmented Subscriptions & Lost Hours',
    painDescription: 'Juggling 8 separate subscriptions and wasting 20+ hours a week context-switching between disconnected tabs.',
    painPoints: [
      '20+ hours wasted weekly copy-pasting across disconnected tools',
      'Every tool starts from zero and forgets your business context',
    ],
    painTakeaway: 'Scattered tools, bloated bills, and constant context switching.',
    solutionTitle: 'Single Unified Brand Brain Workplace',
    solutionMetric: '1 Hub • 0 Fatigue',
    solutionDescription: 'Replace 5+ subscriptions with 1 unified command center synchronized with your unique Brand Brain.',
    solutionPoints: [
      'Store brand voice once — automatically applied everywhere',
      'Seamless workflow from keyword research to live publishing',
    ],
    solutionTakeaway: 'One unified stack with permanent brand memory.',
    icon: Layers,
  },
  {
    id: 'video-graveyard',
    category: 'Dead Media & Lost Distribution',
    painMetric: '1 Video = 40 Views',
    painTitle: 'The "Post & Pray" Creative Graveyard',
    painDescription: 'Spending thousands producing podcasts and videos, only to post once and watch them die with 40 views.',
    painPoints: [
      'Expensive media recordings sit neglected on hard drives',
      'Zero bandwidth to manually cut 10+ platform-specific clips',
    ],
    painTakeaway: 'Expensive content abandoned without distribution.',
    solutionTitle: '1-to-15 Omnichannel Repurposer',
    solutionMetric: '15x Amplification',
    solutionDescription: 'Paste any video link or audio to instantly generate 15+ platform-tailored viral assets in seconds.',
    solutionPoints: [
      '1 raw video generates 2 weeks of multi-channel content',
      'Viral hooks, short scripts, carousels, emails & blog posts',
    ],
    solutionTakeaway: 'Turn 1 recording into an automated compounding pipeline.',
    icon: TrendingUp,
  },
];

/* ── Clean Horizontal Lightning Connector Between Cards ── */
function HorizontalLightningBeam() {
  return (
    <>
      {/* Desktop Horizontal Line Connector between cards */}
      <div className="hidden md:flex items-center justify-center relative w-12 lg:w-16 shrink-0 z-10 self-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-red-500/40 via-amber-400 to-[#FF5533] relative overflow-hidden shadow-[0_0_8px_rgba(255,170,0,0.6)]">
          <div className="electric-runner-x" />
        </div>
        <div className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/60 bg-white dark:bg-[#0c0c0e] shadow-[0_0_10px_rgba(255,170,0,0.4)]">
          <Zap size={11} className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 animate-pulse" />
        </div>
      </div>

      {/* Mobile Connector */}
      <div className="md:hidden flex items-center justify-center my-3 relative w-full">
        <div className="w-full h-[1.5px] bg-gradient-to-r from-red-500/40 via-amber-400 to-[#FF5533] relative overflow-hidden shadow-[0_0_6px_rgba(255,170,0,0.4)]">
          <div className="electric-runner-x" />
        </div>
        <div className="absolute flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/60 bg-white dark:bg-[#0c0c0e]">
          <Zap size={9} className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
        </div>
      </div>
    </>
  );
}


const featureCategories = [
  {
    id: 'seo',
    badge: 'SEO & Content',
    headline: 'WRITE CONTENT THAT ACTUALLY RANKS',
    title: 'Write content that actually ranks',
    desc: 'From keyword discovery to publish-ready articles — the full SEO workflow, automated.',
    color: 'from-[#FF4D42] to-[#FF8526]',
    lightBg: 'bg-orange-500/5 dark:bg-orange-500/10',
    icon: Search,
    capsules: [
      { title: 'Keyword & Search Intent Discovery', icon: Search },
      { title: 'AI Long-Form SEO Article Generator', icon: FileText },
      { title: 'Trend Intelligence & Competitor Angles', icon: TrendingUp },
      { title: 'Website Analyzer & 76+ SEO Checks', icon: Globe },
      { title: 'Content Pipeline & Visual Calendar', icon: Calendar },
    ],
    features: [
      {
        icon: Search,
        title: 'Keyword & Search Research',
        desc: 'Find high-intent keywords, content gaps, question clusters, and semantic opportunities. Powered by real search data — not guesswork.',
        highlight: 'Finds 50+ keyword angles per topic',
      },
      {
        icon: FileText,
        title: 'AI SEO Article Generator',
        desc: 'Generate long-form articles with smart outlines, H2/H3 structure, internal links, FAQ schema, meta tags, and NLP-optimized content. Choose from 6 writing modes.',
        highlight: '2,000–5,000 word articles in minutes',
      },
      {
        icon: TrendingUp,
        title: 'Trend Intelligence',
        desc: 'Surface daily trending topics, evergreen angles, and competitor content ideas. Stay ahead of the market — not behind.',
        highlight: 'Real-time trend tracking across niches',
      },
      {
        icon: Globe,
        title: 'Website Analyzer & SEO Audit',
        desc: '76+ on-page SEO checks, backlink analysis, sitemap scanning, content optimization scoring, and Google Search Console integration.',
        highlight: '76+ technical & content SEO checks',
      },
      {
        icon: Calendar,
        title: 'Content Calendar',
        desc: 'Plan, schedule, and visualize your entire content pipeline. Never miss a publishing deadline again.',
        highlight: 'Visual monthly planning board',
      },
    ],
  },
  {
    id: 'marketing',
    badge: 'Marketing Suite',
    headline: 'LAUNCH CAMPAIGNS IN MINUTES, NOT WEEKS',
    title: 'Launch campaigns in minutes, not weeks',
    desc: 'Social posts, emails, SMS, landing pages, ad copy — generate everything from one brief.',
    color: 'from-[#FF473A] to-[#FF6A3D]',
    lightBg: 'bg-red-500/5 dark:bg-red-500/10',
    icon: Rocket,
    capsules: [
      { title: 'Launch Pack (6 Channels from 1 Brief)', icon: Rocket },
      { title: 'Growth Strategy & Funnel Audit', icon: Target },
      { title: 'Multi-Platform Social Campaign Builder', icon: Share2 },
      { title: 'High-Converting Email Sequences', icon: Mail },
      { title: 'Conversion-Optimized Landing Page Copy', icon: MousePointerClick },
      { title: 'Urgency-Driven SMS Campaign Engine', icon: MessageSquare },
    ],
    features: [
      {
        icon: Rocket,
        title: 'Launch Pack',
        desc: 'One input generates landing page copy, social posts, email sequences, SMS, ad angles, and visual direction. The fastest way to go from idea to market.',
        highlight: '6 channel assets from 1 brief',
      },
      {
        icon: Target,
        title: 'Growth Strategy Audit',
        desc: 'AI diagnoses your ICP, positioning, offer strength, funnel gaps, and channel priorities. Get a real strategy — not vague advice.',
        highlight: 'Full strategic analysis in 60 seconds',
      },
      {
        icon: Share2,
        title: 'Social Campaign Builder',
        desc: 'Create platform-specific posts for LinkedIn, Facebook, Instagram, X, and TikTok. Each post is angle-driven and conversion-optimized.',
        highlight: 'Multi-platform campaign copy',
      },
      {
        icon: Mail,
        title: 'Email Campaign Engine',
        desc: 'Welcome sequences, launch emails, promo blasts, reactivation flows — with subject lines, body copy, and CTAs ready to send.',
        highlight: 'Full email sequences in minutes',
      },
      {
        icon: MessageSquare,
        title: 'SMS Campaign',
        desc: 'Short, permission-friendly, urgency-driven SMS copy. Perfect for flash sales, reminders, and event notifications.',
        highlight: 'Compliance-ready SMS templates',
      },
      {
        icon: MousePointerClick,
        title: 'Landing Page Copy',
        desc: 'Hero sections, feature blocks, proof sections, objection handling, and CTA copy — structured for conversion.',
        highlight: 'High-converting page structure',
      },
    ],
  },
  {
    id: 'creative',
    badge: 'Creative Studio',
    headline: 'TURN 1 ASSET INTO 20 ASSETS',
    title: 'Turn one asset into twenty',
    desc: 'Repurpose videos, create product visuals, and build a content engine that scales.',
    color: 'from-[#FF6A3D] to-[#FF8C38]',
    lightBg: 'bg-amber-500/5 dark:bg-amber-500/10',
    icon: Video,
    capsules: [
      { title: 'Video Creator Kit & URL Repurposer', icon: Video },
      { title: 'Product Photography & Visual Direction AI', icon: Camera },
      { title: 'Brand Brain Unified Tone Memory', icon: Brain },
      { title: 'Multi-Format Viral Hooks & Scripts', icon: Sparkles },
      { title: 'Automated Social Frames & Ad Angles', icon: Layers },
    ],
    features: [
      {
        icon: Video,
        title: 'Video Creator Kit',
        desc: 'Paste a YouTube URL or upload audio. Get AI-generated titles, descriptions, chapters, timestamps, hooks, shorts scripts, quotes, and thumbnail ideas.',
        highlight: '15+ video assets from one URL',
      },
      {
        icon: Camera,
        title: 'Product Photography AI',
        desc: 'Generate shot lists, background concepts, AI image prompts, ecommerce frames, and social visual directions for any product.',
        highlight: 'Complete visual direction in seconds',
      },
      {
        icon: Brain,
        title: 'Brand Brain Memory',
        desc: 'Store your business context, audience, tone, positioning, and proof points once. Every AI output automatically stays on-brand.',
        highlight: 'Set once, consistent forever',
      },
    ],
  },
];

const workflowSteps = [
  {
    step: '01',
    icon: Brain,
    title: 'Set up your Brand Brain',
    desc: 'Tell GrowthPilot your business, audience, tone, and goals. It remembers everything so every output is contextualized.',
    time: '5 min setup',
  },
  {
    step: '02',
    icon: Target,
    title: 'Pick your workflow',
    desc: 'Choose from SEO content, keyword research, video repurpose, campaign launch, strategy audit, or any of the 12+ tools.',
    time: 'Instant',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'AI does the heavy work',
    desc: 'The AI researches, plans, writes, optimizes, and structures — like having a full marketing team working in the background.',
    time: '30-90 seconds',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Review, tweak & ship',
    desc: 'Get publish-ready assets. Export as HTML, Markdown, or plain text. Publish directly to WordPress. Copy and paste anywhere.',
    time: 'You\'re in control',
  },
];

const comparisonData = [
  { task: 'Keyword research & search intent', manual: '2–4 hours', growthpilot: '30 seconds', speed: '98% faster', icon: Search },
  { task: 'Write 3,000-word rank-ready article', manual: '6–10 hours', growthpilot: '2 minutes', speed: '99% faster', icon: FileText },
  { task: 'Full website SEO & technical audit', manual: '1–2 days', growthpilot: '45 seconds', speed: '99% faster', icon: Globe },
  { task: 'Launch campaign across 6 channels', manual: '3–5 days', growthpilot: '3 minutes', speed: '99% faster', icon: Rocket },
  { task: 'Video repurpose & multi-format clips', manual: '4–6 hours', growthpilot: '90 seconds', speed: '98% faster', icon: Video },
  { task: 'Complete monthly content calendar', manual: '1 full day', growthpilot: '2 minutes', speed: '99% faster', icon: Calendar },
];

const testimonials = [
  {
    quote: 'GrowthPilot AI cut our content planning time by 80%. The SEO checks and topic ideas are genuinely useful — not generic AI fluff.',
    name: 'Rahat Ahmed',
    role: 'Head of Growth, Nexora',
    avatar: 'RA',
    rating: 5,
  },
  {
    quote: 'The video kit is a game changer. We turn one long video into a full week of content in minutes. The hooks and shorts scripts are surprisingly good.',
    name: 'Farzana Haque',
    role: 'Marketing Lead, BrightPath',
    avatar: 'FH',
    rating: 5,
  },
  {
    quote: 'We love the Bangla and English support. Our campaigns feel local and our brand stays consistent. Launch Pack saved us 20+ hours on our last product drop.',
    name: 'Tanvir Rahman',
    role: 'Founder, ShopNest',
    avatar: 'TR',
    rating: 5,
  },
  {
    quote: 'Strategy Audit gave us clarity we never had. It diagnosed our funnel gaps and told us exactly what to fix. Like hiring a consultant for \$49/mo.',
    name: 'Anika Islam',
    role: 'CEO, EduSpark',
    avatar: 'AI',
    rating: 5,
  },
];

const logos = ['Nexora', 'BrightPath', 'ShopNest', 'EduSpark', 'Paymate', 'Brandify', 'CodeCraft', 'LaunchHub'];

const plans = [
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    desc: 'For solo creators and small teams validating content ideas.',
    features: [
      'SEO article generation',
      'Keyword research',
      'Trend tracker',
      'Article exports (HTML, MD, TXT)',
      'Basic content calendar',
      'Bangla + English output',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/mo',
    desc: 'For businesses that need repeatable marketing output every week.',
    features: [
      'Everything in Starter',
      'Video Creator Kit',
      'Campaign Planner (7/14/30 day)',
      'Launch Pack (6-channel)',
      'Social Campaign Builder',
      'Email & SMS Campaigns',
      'Landing Page Copy',
      'Product Photography AI',
      'Brand Brain memory',
      'Strategy Audit',
      'WordPress publishing',
      'Priority generation speed',
    ],
    cta: 'Start Free Trial',
    highlight: true,
    popular: true,
  },
  {
    name: 'Scale',
    price: '$99',
    period: '/mo',
    desc: 'For agencies, education companies, and content teams at scale.',
    features: [
      'Everything in Growth',
      'Unlimited workflows',
      'Team members & roles',
      'Website Analyzer (76+ checks)',
      'Google Search Console integration',
      'Backlink analysis',
      'Advanced SEO reports',
      'Bulk content generation',
      'Asset library & history',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    q: 'What exactly is GrowthPilot AI?',
    a: 'GrowthPilot AI is an AI-powered growth workspace. It combines SEO content creation, keyword research, trend intelligence, video repurposing, campaign planning, and marketing asset generation — all in one platform. Think of it as your AI growth team.',
  },
  {
    q: 'Is this just another AI writing tool?',
    a: 'No. GrowthPilot AI is built for marketing execution, not just writing. It does keyword research, SEO audits, video repurposing, campaign planning, landing page copy, email sequences, SMS, social posts, and strategy audits. Writing is just one of 12+ workflows.',
  },
  {
    q: 'Will the output feel generic?',
    a: 'The Brand Brain feature stores your business context, audience, tone, proof points, and positioning. Every output is generated with your specific context — so it reads like your team wrote it, not a generic AI.',
  },
  {
    q: 'Does it support Bangla and English?',
    a: 'Yes. GrowthPilot AI is tuned for both Bangla and English content and campaigns. This makes it especially powerful for Bangladesh-focused businesses that need to create content in both languages.',
  },
  {
    q: 'Can it work for my industry?',
    a: 'It works for ecommerce, B2B, B2C, IT, SaaS, education, creator businesses, agencies, and service companies. The workflows are designed to be industry-agnostic but context-aware through Brand Brain.',
  },
  {
    q: 'How does the Video Creator Kit work?',
    a: 'Paste a YouTube URL or upload audio. The AI transcribes and analyzes the content, then generates titles, descriptions, chapter breakdowns, timestamps, hooks, shorts scripts, quotes, and thumbnail concept ideas.',
  },
  {
    q: 'Can I publish directly to WordPress?',
    a: 'Yes. GrowthPilot AI has built-in WordPress integration. You can publish articles directly from the platform without copy-pasting. Your formatting, headings, and meta tags are preserved.',
  },
  {
    q: 'What AI models does it use?',
    a: 'GrowthPilot AI uses Google Gemini and Anthropic Claude for different workflows, selecting the best model for each task. You get the best of both worlds without managing API keys.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every new account gets 7 days of free access — no credit card required. You can try every tool and workflow before deciding on a plan.',
  },
];

const footerGroups = [
  { title: 'Product', links: ['Features', 'Workflow', 'Pricing', 'Changelog'] },
  { title: 'Resources', links: ['Blog', 'Guides', 'Case Studies', 'API Docs'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Affiliate', 'Contact'] },
  { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security'] },
];

/* ── Animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ── Component ── */
export default function LandingPage() {
  const { theme } = useTheme();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('seo');
  const [problemView, setProblemView] = useState<'split' | 'deep-dive'>('split');
  const [activeProblemId, setActiveProblemId] = useState<string>('agency-bleed');
  const [textMouse, setTextMouse] = useState({ x: 0, y: 0 });
  const [isTextHovered, setIsTextHovered] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const suiteSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: suiteScrollProgress } = useScroll({
    target: suiteSectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(suiteScrollProgress, 'change', (progress) => {
    if (progress < 0.33) {
      setActiveCategory('seo');
    } else if (progress < 0.67) {
      setActiveCategory('marketing');
    } else {
      setActiveCategory('creative');
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      <PublicNavbar />

      <main className="relative z-10">

        {/* ═══════════════════════════════════════════════════
            HERO SECTION — Predictive Arc Canvas & Value Prop
        ═══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-28 sm:pt-40 pb-24 bg-background dark:bg-[#030303] text-foreground dark:text-white transition-colors duration-300">
          {/* Predictive Arc Background Canvas (mode: dark, theme hue: 115) */}
          <div className="absolute inset-x-0 top-0 h-[680px] sm:h-[820px] lg:h-full pointer-events-none select-none overflow-hidden">
            <PredictiveArcCanvas
              mode={theme === 'light' ? 'light' : 'dark'}
              speed={1.00}
              hue={theme === 'light' ? 0 : 115}
              saturation={theme === 'light' ? 1.0 : 1.25}
              brightness={0.95}
            />
            {/* Top vignette to blend smoothly under fixed navbar */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background dark:from-[#030303] via-background/60 dark:via-[#030303]/60 to-transparent pointer-events-none" />
            {/* Ambient struggle theme radial accent */}
            <div className="absolute left-1/2 top-14 sm:top-10 h-[280px] sm:h-[380px] w-[340px] sm:w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF4D42]/18 dark:from-[#FF4D42]/20 via-[#FF6A3D]/20 dark:via-[#FF6A3D]/25 to-[#FF8A00]/18 dark:to-[#FF8A00]/20 blur-[70px] sm:blur-[120px] pointer-events-none" />
            {/* Bottom transition fade to page background */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background dark:from-[#030303] via-background/80 dark:via-[#030303]/80 to-transparent pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative max-w-4xl mx-auto text-center"
            >
              {/* Soft radial contrast veil directly behind the text for superior readability */}
              <div className="absolute inset-0 -top-8 -bottom-8 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(250,250,250,0.95)_0%,rgba(250,250,250,0.75)_55%,transparent_85%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(3,3,3,0.75)_0%,rgba(3,3,3,0.45)_55%,transparent_80%)] blur-xl pointer-events-none -z-10" />

              {/* Badge */}
              <motion.div
                variants={fadeUp}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-md px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#FF7A45] shadow-xs"
              >
                <Sparkles size={13} className="animate-pulse text-[#FF6A3D]" /> AI-Powered Growth Workspace
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[66px] text-neutral-900 dark:text-white drop-shadow-xs dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
              >
                From strategy to execution.{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  All in one place.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-2xl mx-auto text-base leading-8 text-neutral-700 dark:text-neutral-200 font-medium sm:text-lg lg:text-xl lg:leading-9 drop-shadow-none dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              >
                GrowthPilot AI is your all-in-one workspace for SEO content, keyword research, trend intelligence, video repurposing, and campaign assets — powered by AI that understands your brand.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <NextLink href="/auth?next=/dashboard" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex h-[54px] w-full sm:w-auto sm:min-w-[210px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#E6392D] hover:to-[#E57118] px-8 text-[15px] font-black text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer"
                  >
                    Start Free — 7 Days <ArrowRight size={18} />
                  </motion.button>
                </NextLink>
                <a
                  href="#features"
                  className="inline-flex h-[54px] w-full sm:w-auto sm:min-w-[200px] items-center justify-center gap-2.5 rounded-2xl border border-neutral-300 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur-md px-8 text-[15px] font-bold text-neutral-800 dark:text-white transition-all hover:bg-neutral-100 dark:hover:bg-white/10 hover:border-neutral-400 dark:hover:border-white/30 active:scale-[0.98] shadow-sm dark:shadow-none"
                >
                  See All Features <PlayCircle size={18} />
                </a>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeUp}
                className="mt-7 flex flex-wrap justify-center gap-6 text-xs font-semibold text-neutral-600 dark:text-neutral-400"
              >
                {['No credit card required', 'Cancel anytime', 'Full access for 7 days'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Stats Showcase Row */}
            <div className="relative mx-auto mt-20 max-w-5xl">
              {/* Soft Ambient Sunset Glow behind stats */}
              <div className="pointer-events-none absolute -inset-x-6 top-1/2 -translate-y-1/2 h-36 bg-gradient-to-r from-[#FF4D42]/15 via-[#FF6A3D]/15 to-[#FF8A00]/15 blur-3xl opacity-70 -z-10" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                {heroStats.map((stat) => (
                  <StatCard key={stat.label} stat={stat} />
                ))}
              </motion.div>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            THE STRUGGLE VS THE BREAKTHROUGH — Business Reality Check
        ═══════════════════════════════════════════════════ */}
        <section 
          className="px-6 py-28 sm:py-36 relative overflow-hidden bg-background dark:bg-[#030303] transition-colors duration-300"
          style={{
            backgroundImage: `
              linear-gradient(225deg, rgba(255, 106, 61, 0.08) 0%, rgba(255, 71, 58, 0.03) 35%, transparent 65%, rgba(255, 85, 51, 0.06) 100%),
              radial-gradient(ellipse 700px 500px at 85% 15%, rgba(255, 138, 0, 0.10) 0%, transparent 70%),
              radial-gradient(ellipse 700px 500px at 15% 85%, rgba(255, 71, 58, 0.08) 0%, transparent 70%)
            `,
          }}
        >
          {/* Top seamless transition: 100% blends with Hero section above */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-background dark:from-[#030303] via-background/90 dark:via-[#030303]/90 to-transparent z-10" />

          {/* Bottom seamless transition: 100% blends with section below */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background dark:from-[#030303] via-background/90 dark:via-[#030303]/90 to-transparent z-10" />

          {/* Subtle Ambient Mesh Grid */}
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

          <div className="mx-auto max-w-7xl relative z-20">
            {/* Section Eyebrow, Heading & Value Proposition */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-14"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 shadow-sm shadow-red-500/10">
                <AlertTriangle size={13} className="text-[#FF4D42]" />
                <span>The Burning Reality</span>
              </motion.div>

              <motion.h2 variants={fadeUp} className="mt-5 text-3xl font-black tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.12]">
                Why 90% of content strategies{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  bleed money & fail to rank.
                </span>
              </motion.h2>

              <motion.p variants={fadeUp} className="mt-5 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Retainer agencies are bloated and slow. Raw ChatGPT prompts produce low-effort slop that gets penalized by Google. Here is what happens when you replace marketing chaos with an autonomous growth engine.
              </motion.p>

              {/* View Switcher Pills */}
              <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setProblemView('split')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all cursor-pointer border ${
                    problemView === 'split'
                      ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white border-transparent shadow-lg shadow-orange-500/25'
                      : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/50 border-neutral-300 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Zap size={14} />
                  <span>Side-by-Side Reality Check</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProblemView('deep-dive')}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all cursor-pointer border ${
                    problemView === 'deep-dive'
                      ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white border-transparent shadow-lg shadow-orange-500/25'
                      : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/50 border-neutral-300 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Layers size={14} />
                  <span>Interactive Problem Breakdown (4 Leaks)</span>
                </button>
              </motion.div>
            </motion.div>

            {/* View 1: Clean Side-by-Side Horizontal Cards Connected by Line */}
            {problemView === 'split' ? (
              <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
                {businessProblems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-0"
                  >
                    {/* Left: Clean Problem Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.1 }}
                      className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0e0c0d]/85 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-neutral-200/50 dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-red-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/5">
                          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-500">
                            0{idx + 1} · THE PROBLEM
                          </span>
                          <span className="text-xs font-mono font-bold text-red-500 dark:text-red-400">
                            {item.painMetric}
                          </span>
                        </div>

                        <h4 className="mt-4 text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                          {item.painTitle}
                        </h4>

                        <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {item.painDescription}
                        </p>
                      </div>
                    </motion.div>

                    {/* Middle: Horizontal Connecting Line */}
                    <HorizontalLightningBeam />

                    {/* Right: Clean Solution Card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.15 }}
                      className="rounded-2xl border border-orange-500/30 dark:border-[#FF5533]/30 bg-white/95 dark:bg-[#100d0b]/85 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-orange-500/10 dark:shadow-[0_4px_35px_-5px_rgba(255,85,51,0.18)] hover:border-[#FF5533]/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-white/5">
                          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#FF7A45]">
                            GROWTHPILOT SOLUTION
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.solutionMetric}
                          </span>
                        </div>

                        <h4 className="mt-4 text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                          {item.solutionTitle}
                        </h4>

                        <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {item.solutionDescription}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* View 2: Deep-Dive Interactive Bento Cards (4 Core Business Leaks) */
              <div className="space-y-6">
                {/* Horizontal Problem Selector Pills */}
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  {businessProblems.map((prob) => (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => setActiveProblemId(prob.id)}
                      className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                        activeProblemId === prob.id
                          ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white border-transparent shadow-md shadow-orange-500/25'
                          : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/50 border-neutral-300 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{prob.category}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Deep-Dive Card */}
                {(() => {
                  const current = businessProblems.find((p) => p.id === activeProblemId) || businessProblems[0];
                  return (
                    <motion.div
                      key={current.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white/95 dark:bg-[#09090b]/90 backdrop-blur-2xl p-7 sm:p-10 shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-6 mb-8">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF7A45]">
                            Deep-Dive Business Bottleneck
                          </span>
                          <h3 className="mt-1 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                            {current.category}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-mono font-bold text-red-500 dark:text-red-400">
                            {current.painMetric}
                          </span>
                          <span className="text-neutral-400 dark:text-white/30 font-bold">➔</span>
                          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {current.solutionMetric}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-8 lg:grid-cols-2 items-start">
                        {/* Old Way Side */}
                        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] dark:bg-red-950/15 p-6">
                          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 mb-4">
                            <XCircle size={13} /> The Burning Bottleneck
                          </div>
                          <h4 className="text-lg font-black text-neutral-900 dark:text-white">{current.painTitle}</h4>
                          <p className="mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {current.painDescription}
                          </p>
                          <ul className="mt-4 space-y-2 border-t border-red-500/20 pt-4">
                            {current.painPoints.map((pt, i) => (
                              <li key={i} className="text-xs text-neutral-700 dark:text-red-200/80 flex items-start gap-2.5">
                                <XIcon size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* GrowthPilot Side */}
                        <div className="rounded-2xl border-2 border-[#FF5533]/40 bg-orange-500/[0.04] dark:bg-orange-950/20 p-6 shadow-xl shadow-orange-500/10">
                          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#FF5533] mb-4">
                            <CheckCircle2 size={13} /> The GrowthPilot Standard
                          </div>
                          <h4 className="text-lg font-black text-neutral-900 dark:text-white">{current.solutionTitle}</h4>
                          <p className="mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-200 leading-relaxed">
                            {current.solutionDescription}
                          </p>
                          <ul className="mt-4 space-y-2 border-t border-orange-500/20 pt-4">
                            {current.solutionPoints.map((pt, i) => (
                              <li key={i} className="text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2.5">
                                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            )}

            {/* Bottom Strategic Comparison Ticker Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-14 rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white/80 dark:bg-white/[0.02] p-6 sm:p-7 backdrop-blur-xl shadow-lg shadow-neutral-200/40 dark:shadow-none"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-white/10">
                <div className="pt-4 md:pt-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Agency Cost</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-red-500 dark:text-red-400 line-through decoration-red-400/50">$4,500 / month</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-neutral-900 dark:text-white">from $19 / mo</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Publish Velocity</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-red-500 dark:text-red-400 line-through decoration-red-400/50">14–21 Days Lag</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-neutral-900 dark:text-white">&lt; 60 Seconds</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Software Stack</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-red-500 dark:text-red-400 line-through decoration-red-400/50">8 Fragmented Apps</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-neutral-900 dark:text-white">1 Workplace</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Algorithm Security</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-red-500 dark:text-red-400 line-through decoration-red-400/50">High HCU Risk</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-[#FF5533]">76+ SEO Checks</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            FEATURES — Glassmorphic Pinned Scroll Suite
        ═══════════════════════════════════════════════════ */}
        <section id="features" ref={suiteSectionRef} className="relative h-[280vh] bg-gradient-to-b from-[#fff8f5] via-[#fff4f0] to-[#fff8f5] dark:from-[#070709] dark:via-[#09080e] dark:to-[#050507] text-neutral-900 dark:text-white transition-colors duration-300">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute -left-20 top-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-r from-[#FF4D42]/12 dark:from-[#FF4D42]/16 via-[#FF6A3D]/8 dark:via-[#FF6A3D]/10 to-transparent blur-[160px]" />
          <div className="pointer-events-none absolute -right-20 top-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#FF4D42]/10 dark:from-[#FF4D42]/14 via-[#FF8526]/6 dark:via-[#FF8526]/8 to-transparent blur-[150px]" />

          {/* Sticky Fullscreen Viewport */}
          <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-x-clip pt-16 sm:pt-18 pb-2 sm:pb-3">
            {/* Header */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-3 sm:mb-4 px-4 relative z-10"
            >
              <motion.p variants={fadeUp} className="mb-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-[#FF5533]">
                Product Suite
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.12]">
                <span className="block text-neutral-900 dark:text-white">12+ AI tools, 1 workspace</span>
                <span className="block mt-1 sm:mt-1.5 bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  Save time, Grow Faster.
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-2 text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
                Stop juggling disconnected AI chat tabs. Access 12+ structured marketing workflows in one unified workspace to eliminate manual execution and scale your business faster.
              </motion.p>
            </motion.div>

            {/* Interactive Stage: Half-Circle Flush at Left 0 + 3-Suite Carousel + Blurred Stacked Cards */}
            {(() => {
              const activeIndex = featureCategories.findIndex((c) => c.id === activeCategory);
              const currentSuite = featureCategories[activeIndex] || featureCategories[0];
              const prevSuite = featureCategories[(activeIndex + 2) % featureCategories.length];
              const nextSuite = featureCategories[(activeIndex + 1) % featureCategories.length];

              return (
                <div className="relative w-full flex items-center justify-center min-h-[500px] lg:min-h-[520px] px-4 sm:px-6">
                  {/* ── Left Side: Half-Circle Flush at screen left: 0 (R=270, cx=0, cy=280) ── */}
                  <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-[320px] h-[560px] select-none z-20 items-center justify-start pointer-events-auto">
                    {/* SVG Half-Circle Arc (R=270, cx=0, cy=280, 180° visible semicircle flush with screen edge) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="halfCircleAura" cx="0%" cy="50%" r="85%">
                          <stop offset="0%" stopColor="#FF4D42" stopOpacity="0.45" />
                          <stop offset="55%" stopColor="#FF8526" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#FF4D42" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="halfCircleStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FF4D42" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#FF7A30" stopOpacity="1" />
                          <stop offset="100%" stopColor="#FFAA00" stopOpacity="1" />
                        </linearGradient>
                      </defs>

                      {/* Outer glow blur path */}
                      <path
                        d="M 0 10 A 270 270 0 0 1 0 550"
                        fill="none"
                        stroke="#FF5533"
                        strokeWidth="8"
                        opacity="0.30"
                        filter="blur(8px)"
                      />

                      {/* Outer subtle concentric arc */}
                      <path d="M 0 -25 A 305 305 0 0 1 0 585" fill="none" stroke="currentColor" className="text-neutral-300 dark:text-white/10" strokeDasharray="6 8" />

                      {/* Main Prominent Half-Circle Arc (r=270) */}
                      <path
                        d="M 0 10 A 270 270 0 0 1 0 550"
                        fill="url(#halfCircleAura)"
                        stroke="url(#halfCircleStrokeGrad)"
                        strokeWidth="3.5"
                        filter="drop-shadow(0 0 16px rgba(255,85,51,0.85))"
                      />

                      {/* Inner subtle concentric arcs */}
                      <path d="M 0 80 A 200 200 0 0 1 0 480" fill="none" stroke="currentColor" className="text-neutral-300 dark:text-white/10" strokeDasharray="4 6" />
                      <path d="M 0 145 A 135 135 0 0 1 0 415" fill="none" stroke="currentColor" className="text-orange-500/30 dark:text-[#FF5533]/30" strokeDasharray="2 3" />

                      {/* Radial center guideline */}
                      <line x1="0" y1="280" x2="270" y2="280" stroke="currentColor" className="text-orange-500/30 dark:text-[#FF5533]/35" strokeDasharray="3 3" />

                      {/* Orbit Anchor Points (R=270, cy=280) */}
                      <circle cx="213" cy="114" r="3.5" fill="currentColor" className="text-neutral-500 dark:text-white/80" filter="drop-shadow(0 0 4px rgba(255,85,51,0.5))" />
                      <circle cx="270" cy="280" r="5" fill="#FFAA00" filter="drop-shadow(0 0 8px #FFAA00)" />
                      <circle cx="213" cy="446" r="3.5" fill="currentColor" className="text-neutral-500 dark:text-white/80" filter="drop-shadow(0 0 4px rgba(255,85,51,0.5))" />
                    </svg>

                    {/* Ambient Radial Spotlight */}
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-[#FF4D42]/28 via-[#FF8A00]/16 to-transparent blur-[85px] pointer-events-none" />

                    {/* 3 Rotating Suite Pills Aligned on the Half-Circle (All 3 always visible in rotating carousel) */}
                    {featureCategories.map((cat, idx) => {
                      // Carousel relative index (0 = Center Apex, 1 = Bottom, 2 = Top)
                      const rel = (idx - activeIndex + featureCategories.length) % featureCategories.length;
                      const isActive = rel === 0;

                      // R=270, cx=0, cy=280:
                      // rel = 0 (Center Apex): x = 270, y = 280
                      // rel = 1 (Bottom Arc): x = 213, y = 446
                      // rel = 2 (Top Arc): x = 213, y = 114
                      let targetX = 270;
                      let targetY = 280;

                      if (rel === 0) {
                        targetX = 270;
                        targetY = 280;
                      } else if (rel === 1) {
                        targetX = 213;
                        targetY = 446;
                      } else if (rel === 2) {
                        targetX = 213;
                        targetY = 114;
                      }

                      return (
                        <motion.button
                          key={cat.id}
                          initial={false}
                          animate={{
                            left: `${targetX}px`,
                            top: `${targetY}px`,
                            x: '-50%',
                            y: '-50%',
                            scale: isActive ? 1.05 : 0.90,
                          }}
                          style={{
                            zIndex: isActive ? 30 : 20,
                          }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`absolute cursor-pointer flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 select-none whitespace-nowrap shadow-md group ${
                            isActive
                              ? 'bg-gradient-to-r from-[#FF4D42] via-[#FF622E] to-[#FF8A00] text-white shadow-[0_0_28px_rgba(255,85,51,0.7),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/40 ring-1 ring-[#FF8A00]/40'
                              : 'bg-white/95 dark:bg-[#180e0d]/90 hover:bg-white dark:hover:bg-[#251512] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-300/80 dark:border-white/10 hover:border-[#FF5533]/40 backdrop-blur-xl'
                          }`}
                        >
                          <cat.icon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#FF8526] group-hover:text-neutral-900 dark:group-hover:text-white'}`} />
                          <span className={`text-xs sm:text-[13px] font-semibold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white'}`}>
                            {cat.badge}
                          </span>
                        </motion.button>
                      );
                    })}

                    {/* Horizontal Laser Pointer Line connecting Apex Button Center to Card */}
                    <div className="absolute top-[280px] -translate-y-1/2 left-[270px] w-[288px] flex items-center z-[15] pointer-events-none">
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-[#FF5533] via-[#FFAA00] to-[#FF8526] relative shadow-[0_0_12px_rgba(255,170,0,0.9)]">
                        <div className="absolute inset-0 bg-amber-200/40 animate-pulse" />
                      </div>
                      <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-[#FF8526] shrink-0 drop-shadow-[0_0_8px_rgba(255,133,38,1)]" />
                    </div>
                  </div>

                  {/* ── Right Side: Brand Orange Glassmorphic 3D Stacked Deck (Inactive Cards Blurred) ── */}
                  <div className="w-full max-w-[660px] mx-auto lg:ml-[540px] lg:mr-auto relative flex items-center justify-center min-h-[520px]">
                    {/* Desktop Stacked View */}
                    <div className="hidden lg:flex relative w-full items-center justify-center">
                      {featureCategories.map((s, idx) => {
                        const offset = (idx - activeIndex + featureCategories.length) % featureCategories.length;

                        // Active Card (Front, Center, Crisp, Full Brand Orange Glassmorphism)
                        if (offset === 0) {
                          return (
                            <motion.div
                              key={s.id}
                              layout
                              initial={false}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              style={{ zIndex: 20 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className={`relative w-full rounded-3xl px-7 py-5 sm:px-8 sm:py-5.5 text-neutral-900 dark:text-white border overflow-hidden ${
                                theme === 'dark'
                                  ? 'bg-[#140807] bg-gradient-to-br from-[#1c0e0e] via-[#160a09] to-[#0e0706] border-[#FF5533]/45 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,170,0,0.2),0_0_35px_rgba(255,85,51,0.22)]'
                                  : 'bg-white bg-gradient-to-br from-white via-[#fff8f5] to-[#fff1eb] border-orange-500/30 shadow-[0_20px_50px_rgba(255,85,51,0.12)]'
                              }`}
                            >
                              {/* Left Pointer Notch Aligning with Laser */}
                              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-[#FF8526]" />

                              {/* Glowing orange top highlight rim */}
                              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF8526] to-transparent pointer-events-none shadow-[0_0_8px_#FF8526]" />

                              {/* Ambient internal glass flame aura */}
                              <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-gradient-to-br from-[#FF4D42]/20 dark:from-[#FF4D42]/30 via-[#FF8526]/12 dark:via-[#FF8526]/18 to-transparent blur-[55px] pointer-events-none" />

                              {/* Category Badge */}
                              <div className="mb-1.5">
                                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#fff1ed] dark:bg-[#FF5533]/20 text-[#FF5533] dark:text-[#FFAA00] border border-orange-500/25 dark:border-[#FF5533]/40 text-[11px] font-mono font-black tracking-widest uppercase shadow-xs backdrop-blur-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF622E] animate-pulse" />
                                  {s.badge}
                                </span>
                              </div>

                              {/* Headline */}
                              <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mb-3 leading-snug drop-shadow-xs">
                                {s.headline}
                              </h3>

                              {/* Tool Capsules - Outline-free solid soft background aligned with card palette */}
                              <div className="space-y-2">
                                {s.capsules.map((cap) => (
                                  <div
                                    key={cap.title}
                                    className="flex items-center gap-3.5 sm:gap-4 rounded-2xl bg-[#fff1ed] dark:bg-[#241311] hover:bg-[#ffe7e0] dark:hover:bg-[#2d1815] border-0 pl-5 sm:pl-6 pr-4 sm:pr-5 py-2.5 transition-all duration-200 group cursor-pointer shadow-xs"
                                  >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4D42] via-[#FF622E] to-[#FF8526] text-white shadow-md border-0 group-hover:scale-105 transition-all">
                                      <cap.icon size={15} />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white tracking-normal">
                                      {cap.title}
                                    </span>
                                    <ArrowRight size={14} className="text-[#FF8526] group-hover:text-[#FFAA00] group-hover:translate-x-1 transition-all ml-auto shrink-0 mr-1 sm:mr-1.5" />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        }

                        // Next Card (Peeked Below - Blurred)
                        if (offset === 1) {
                          return (
                            <motion.div
                              key={s.id}
                              layout
                              onClick={() => setActiveCategory(s.id)}
                              initial={false}
                              animate={{ opacity: 0.4, scale: 0.92, y: 0 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className={`absolute -bottom-8 sm:-bottom-10 inset-x-0 z-10 w-full rounded-3xl border px-7 py-4 sm:px-8 sm:py-4.5 text-neutral-700 dark:text-neutral-300 cursor-pointer hover:opacity-75 hover:border-[#FF5533]/60 transition-all select-none overflow-hidden shadow-lg dark:shadow-2xl ${
                                theme === 'dark'
                                  ? 'bg-[#150a09] border-[#FF5533]/25'
                                  : 'bg-[#fff8f5] border-orange-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-mono font-black uppercase text-[#FF5533] dark:text-[#FFAA00]">
                                  {s.badge}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/35">
                                  Click to expand
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-tight uppercase line-clamp-1">
                                {s.headline}
                              </h4>
                              <div className="mt-2 space-y-1.5 opacity-65">
                                {s.capsules.slice(0, 2).map((cap) => (
                                  <div key={cap.title} className="flex items-center gap-2.5 rounded-xl bg-[#fff1ed] dark:bg-[#221312] border-0 pl-4 pr-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                    <cap.icon size={12} className="shrink-0 text-[#FFAA00]" />
                                    <span>{cap.title}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        }

                        // Previous Card (Peeked Above - Blurred)
                        if (offset === 2) {
                          return (
                            <motion.div
                              key={s.id}
                              layout
                              onClick={() => setActiveCategory(s.id)}
                              initial={false}
                              animate={{ opacity: 0.4, scale: 0.92, y: 0 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className={`absolute -top-8 sm:-top-10 inset-x-0 z-10 w-full rounded-3xl border px-7 py-4 sm:px-8 sm:py-4.5 text-neutral-700 dark:text-neutral-300 cursor-pointer hover:opacity-75 hover:border-[#FF5533]/60 transition-all select-none overflow-hidden shadow-lg dark:shadow-2xl ${
                                theme === 'dark'
                                  ? 'bg-[#150a09] border-[#FF5533]/25'
                                  : 'bg-[#fff8f5] border-orange-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-mono font-black uppercase text-[#FF5533] dark:text-[#FFAA00]">
                                  {s.badge}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/35">
                                  Click to expand
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-tight uppercase line-clamp-1">
                                {s.headline}
                              </h4>
                              <div className="mt-2 space-y-1.5 opacity-65">
                                {s.capsules.slice(0, 2).map((cap) => (
                                  <div key={cap.title} className="flex items-center gap-2.5 rounded-xl bg-[#fff1ed] dark:bg-[#221312] border-0 pl-4 pr-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                    <cap.icon size={12} className="shrink-0 text-[#FFAA00]" />
                                    <span>{cap.title}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        }

                        return null;
                      })}
                    </div>

                    {/* Mobile / Tablet View (Responsive single active card) */}
                    <div className="lg:hidden w-full max-w-lg">
                      <motion.div
                        key={currentSuite.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`rounded-3xl p-6 text-neutral-900 dark:text-white border border-orange-500/30 dark:border-[#FF5533]/40 shadow-xl dark:shadow-2xl ${
                          theme === 'dark' ? 'bg-[#150a09]' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-mono font-black uppercase bg-[#fff1ed] dark:bg-[#FF5533]/20 text-[#FF5533] dark:text-[#FFAA00] px-3 py-1 rounded-full border border-orange-500/25 dark:border-[#FF5533]/35">
                            {currentSuite.badge}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setActiveCategory(prevSuite.id)}
                              className="h-7 px-2.5 rounded-lg bg-neutral-100 dark:bg-white/20 border border-neutral-300 dark:border-white/30 text-neutral-800 dark:text-white text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/30"
                            >
                              ‹ Prev
                            </button>
                            <button
                              onClick={() => setActiveCategory(nextSuite.id)}
                              className="h-7 px-2.5 rounded-lg bg-neutral-100 dark:bg-white/20 border border-neutral-300 dark:border-white/30 text-neutral-800 dark:text-white text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/30"
                            >
                              Next ›
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight uppercase mb-4">
                          {currentSuite.headline}
                        </h3>
                        <div className="space-y-2.5">
                          {currentSuite.capsules.map((cap) => (
                            <div
                              key={cap.title}
                              className="flex items-center gap-3.5 rounded-2xl bg-[#fff1ed] dark:bg-[#241311] border-0 pl-4 sm:pl-5 pr-3.5 sm:pr-4 py-2.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium"
                            >
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF4D42] to-[#FF8526] flex items-center justify-center text-white shrink-0 border-0">
                                <cap.icon size={13} />
                              </div>
                              <span>{cap.title}</span>
                              <ArrowRight size={13} className="text-[#FF8526] ml-auto shrink-0 mr-1" />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Scroll Sequence Indicator */}
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 text-center relative z-10">
              <div className="flex items-center gap-2">
                {featureCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`transition-all duration-300 rounded-full ${
                      activeCategory === c.id
                        ? 'w-7 h-2 bg-gradient-to-r from-[#FF473A] to-[#FF8526] shadow-[0_0_8px_rgba(255,85,51,0.6)]'
                        : 'w-2 h-2 bg-neutral-300 dark:bg-white/20 hover:bg-neutral-400 dark:hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tracking-wider hidden sm:inline-block">
                Scroll down to cycle through suites
              </span>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            HOW IT WORKS — 4-Step Workflow Timeline
        ═══════════════════════════════════════════════════ */}
        <section id="process" className="px-6 py-24 relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-gradient-to-r from-[#FF4D42]/10 via-[#FF8526]/8 to-transparent rounded-full blur-[130px] pointer-events-none" />

          <div className="mx-auto max-w-6xl relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-20"
            >
              <motion.p variants={fadeUp} className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#FF5533]">
                How It Works
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
                From zero to{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  publish-ready
                </span>{' '}
                in 4 steps
              </motion.h2>
            </motion.div>

            {/* 4 Workflow Step Cards Grid — Left-to-Right Cascading Entry */}
            <div className="relative">
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
                {workflowSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      delay: index * 0.18,
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group relative rounded-3xl bg-gradient-to-b from-white/95 via-[#fff8f5]/95 to-[#fff2ed]/95 dark:from-[#1c0e0e]/95 dark:via-[#150a09]/95 dark:to-[#0e0605] border border-neutral-200/90 dark:border-[#FF5533]/25 hover:border-orange-500/60 dark:hover:border-[#FF622E]/70 shadow-[0_15px_40px_rgba(255,85,51,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 sm:p-7 pt-7 sm:pt-8 flex flex-col items-center text-center backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(255,85,51,0.15)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(255,85,51,0.25)]"
                  >
                    {/* Glowing orange top highlight rim */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF8526]/60 to-transparent pointer-events-none" />

                    {/* Ambient subtle inside card aura */}
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-[#FF4D42]/10 blur-[30px] pointer-events-none group-hover:bg-[#FF4D42]/20 transition-all" />

                    {/* Timeline Forward Connector Arrow between cards (Desktop) */}
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 items-center justify-center pointer-events-none">
                        <div className="w-7 h-[2px] bg-gradient-to-r from-[#FF5533] to-[#FFAA00] relative shadow-[0_0_8px_rgba(255,170,0,0.9)]">
                          <div className="absolute inset-0 bg-white/70 animate-pulse" />
                        </div>
                        <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-[#FFAA00] drop-shadow-[0_0_6px_rgba(255,170,0,1)]" />
                      </div>
                    )}

                    {/* Vibrant Gradient Icon Container */}
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4D42] via-[#FF622E] to-[#FF8A00] text-white shadow-[0_8px_25px_rgba(255,85,51,0.5)] border border-white/30 group-hover:scale-110 group-hover:shadow-[0_12px_35px_rgba(255,85,51,0.7)] transition-all duration-300">
                      <step.icon size={26} className="text-white drop-shadow-md" />
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight leading-snug mb-2.5">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300/85 mb-6 flex-1">
                      {step.desc}
                    </p>

                    {/* Time pill at bottom */}
                    <div className="mt-auto inline-flex items-center gap-1.5 rounded-full bg-[#fff1ed] dark:bg-[#241311] border border-orange-500/25 dark:border-[#FF5533]/25 px-3 py-1.5 text-[11px] font-semibold text-[#FF5533] dark:text-[#FFAA00] shadow-xs">
                      <Clock size={12} className="text-[#FF8526]" /> {step.time}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            TIME COMPARISON TABLE
        ═══════════════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-r from-[#FF4D42]/10 via-[#FF8526]/8 to-transparent rounded-full blur-[130px] pointer-events-none" />

          <div className="mx-auto max-w-5xl relative z-10">
            {/* Header */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-10 sm:mb-14"
            >
              <motion.p variants={fadeUp} className="mb-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-[#FF5533]">
                Time Saved
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
                Hours of work →{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  minutes
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto text-xs sm:text-base leading-relaxed">
                Real time savings from real marketing tasks. This is not hypothetical — these are actual workflow comparisons.
              </motion.p>
            </motion.div>

            {/* Glassmorphic Obsidian Comparison Table Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-gradient-to-b dark:from-[#1c0e0e]/95 dark:via-[#140908]/95 dark:to-[#0d0505] border border-neutral-200/90 dark:border-[#FF5533]/30 shadow-[0_20px_50px_rgba(255,85,51,0.08)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden"
            >
              {/* Glowing orange top highlight rim */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF8526] to-transparent pointer-events-none" />

              {/* ─── Mobile View: Compact Benchmarks (Below sm) ─── */}
              <div className="sm:hidden px-4 py-3 bg-neutral-100/90 dark:bg-[#200f0d]/80 border-b border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5533] animate-pulse" />
                  <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                    Workflow Benchmark
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF4D42] via-[#FF622E] to-[#FF8A00] text-white text-[10px] font-black tracking-wide uppercase shadow-xs">
                  <Zap size={11} className="fill-white" />
                  <span>Up to 99% Faster</span>
                </div>
              </div>

              {/* Mobile Rows */}
              <div className="sm:hidden divide-y divide-neutral-200/70 dark:divide-white/[0.06]">
                {comparisonData.map((row, i) => (
                  <div
                    key={i}
                    className={`p-3.5 transition-colors duration-200 ${
                      i % 2 === 1 ? 'bg-neutral-50/70 dark:bg-white/[0.02]' : 'bg-transparent'
                    }`}
                  >
                    {/* Top: Icon + Full Task Title + Speed % badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-[#281310] border border-orange-500/20 dark:border-[#FF5533]/25 flex items-center justify-center text-[#FF5533] dark:text-[#FF8526] shrink-0">
                          <row.icon size={14} />
                        </div>
                        <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {row.task}
                        </span>
                      </div>
                      <span className="inline-flex text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                        {row.speed}
                      </span>
                    </div>

                    {/* Bottom: Side-by-side comparison tiles */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Manual Box */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-red-500/[0.06] border border-red-500/15 dark:border-red-500/20">
                        <span className="text-[10px] font-bold text-red-600/80 dark:text-red-400/80 uppercase tracking-tight flex items-center gap-1">
                          <Clock size={11} className="text-red-500" />
                          Manual
                        </span>
                        <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-300 line-through decoration-red-400/60">
                          {row.manual}
                        </span>
                      </div>

                      {/* GrowthPilot Box */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#fff2ee] dark:bg-[#261311] border border-orange-500/25 dark:border-[#FF5533]/35 shadow-xs">
                        <span className="text-[10px] font-black text-[#FF5533] dark:text-[#FF8526] uppercase tracking-tight flex items-center gap-1">
                          <Zap size={11} className="text-[#FF8526] fill-[#FF8526]" />
                          AI
                        </span>
                        <span className="text-xs font-mono font-black text-[#FF5533] dark:text-[#FFAA00]">
                          {row.growthpilot}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Desktop / Tablet View (sm and up) ─── */}
              <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-4 px-6 sm:px-8 py-5 bg-neutral-100/90 dark:bg-[#200f0d]/80 border-b border-neutral-200/80 dark:border-white/[0.08] items-center">
                <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Marketing Workflow
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-3 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                    <Clock size={12} className="text-red-500 dark:text-red-400" />
                    <span>Manual Work</span>
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-4 flex justify-center sm:justify-end sm:pr-4">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF4D42] via-[#FF622E] to-[#FF8A00] text-white text-[11px] sm:text-xs font-black tracking-wide uppercase shadow-[0_0_20px_rgba(255,85,51,0.6)] border border-white/30">
                    <Zap size={13} className="fill-white" />
                    <span>GrowthPilot AI</span>
                  </div>
                </div>
              </div>

              {/* Desktop Rows */}
              <div className="hidden sm:block divide-y divide-neutral-200/70 dark:divide-white/[0.05]">
                {comparisonData.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-12 gap-3 sm:gap-4 px-6 sm:px-8 py-4 sm:py-4.5 items-center transition-colors duration-200 hover:bg-orange-500/[0.04] dark:hover:bg-white/[0.03] ${
                      i % 2 === 1 ? 'bg-neutral-50/60 dark:bg-white/[0.015]' : ''
                    }`}
                  >
                    {/* Task Column */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-[#281310] border border-orange-500/20 dark:border-[#FF5533]/20 flex items-center justify-center text-[#FF5533] dark:text-[#FF8526] shrink-0">
                        <row.icon size={15} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 tracking-normal line-clamp-1">
                        {row.task}
                      </span>
                    </div>

                    {/* Manual Column */}
                    <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-red-500/[0.06] border border-red-500/15 text-red-600 dark:text-red-300/80 text-xs sm:text-sm font-mono font-medium line-through decoration-red-400/50">
                        {row.manual}
                      </span>
                    </div>

                    {/* GrowthPilot AI Column */}
                    <div className="col-span-3 sm:col-span-4 flex items-center justify-center sm:justify-end sm:pr-4 gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fff1ed] dark:bg-[#241311] border border-orange-500/25 dark:border-[#FF5533]/30 text-[#FF5533] dark:text-[#FFAA00] font-black text-xs sm:text-sm shadow-xs group-hover:border-[#FF5533] transition-colors">
                        <Zap size={13} className="text-[#FF8526] fill-[#FF8526]" />
                        {row.growthpilot}
                      </span>
                      <span className="hidden sm:inline-flex text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                        {row.speed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Footer Summary Banner */}
              <div className="px-4 sm:px-8 py-3.5 bg-neutral-100/90 dark:bg-gradient-to-r dark:from-[#200f0d] dark:via-[#1a0c0a] dark:to-[#200f0d] border-t border-neutral-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-[#FFAA00] shrink-0" />
                  <span>Average user saves <strong>35–40 hours</strong> every month across workflows</span>
                </div>
                <div className="text-[#FF5533] dark:text-[#FF8526] font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <span>Included in All Plans</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            TESTIMONIALS & SOCIAL PROOF
        ═══════════════════════════════════════════════════ */}
        <section className="px-6 py-24 bg-muted/[0.03] relative">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.p variants={fadeUp} className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#FF5533] dark:text-[#FF7A45]">
                Trusted By Growth Teams
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                Real teams.{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  Real results.
                </span>
              </motion.h2>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-3xl border border-foreground/[0.05] dark:border-white/[0.06] bg-card/40 backdrop-blur-md p-7 shadow-xs hover-glow-card flex flex-col"
                >
                  <div className="flex text-amber-500 dark:text-amber-400 mb-4">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star key={idx} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm leading-7 text-foreground/80 italic flex-1">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 pt-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF473A] to-[#FF8526] text-white text-xs font-black shadow-md shadow-orange-500/20">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Logo strip */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-base font-black text-muted-foreground/40 tracking-wider">
              {logos.map((logo) => (
                <span key={logo} className="hover:text-foreground transition-colors duration-300 cursor-default">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════════════ */}
        <section id="pricing" className="px-6 py-24 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute left-1/2 bottom-[-100px] h-[500px] w-[750px] -translate-x-1/2 rounded-full bg-orange-500/8 dark:bg-orange-600/12 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.p variants={fadeUp} className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#FF5533] dark:text-[#FF7A45]">
                Pricing
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                Start small. Scale when it becomes{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  your growth engine
                </span>
                .
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-muted-foreground text-sm max-w-xl mx-auto">
                Every plan includes a 7-day free trial. No credit card required.
              </motion.p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3 items-stretch">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-[2rem] border p-8 flex flex-col justify-between ${
                    plan.highlight
                      ? 'border-orange-500/35 bg-card/90 shadow-2xl dark:shadow-orange-500/10 hover-glow-card scale-[1.02] z-10'
                      : 'border-foreground/[0.06] dark:border-white/[0.06] bg-card/40 hover-glow-card'
                  }`}
                >
                  <div>
                    {plan.popular && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-5 py-1.5 text-[10px] font-black text-white shadow-md shadow-orange-500/30 border border-white/20 uppercase tracking-widest">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
                    <p className="mt-3 min-h-[48px] text-xs leading-6 text-muted-foreground">{plan.desc}</p>
                    <div className="mt-6 flex items-end gap-1 pb-4">
                      <span className="text-5xl font-black text-foreground tracking-tight">{plan.price}</span>
                      <span className="mb-1 text-muted-foreground font-bold">{plan.period}</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-xs font-medium text-foreground/85">
                          <CheckCircle2 size={15} className="text-[#FF5533] dark:text-[#FF7A45] shrink-0 mt-0.5" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <NextLink href="/auth?next=/dashboard" className="w-full mt-8 block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`inline-flex h-12 sm:h-13 w-full items-center justify-center rounded-xl sm:rounded-2xl text-sm font-black transition-all cursor-pointer ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#E6392D] hover:to-[#E57118] text-white shadow-lg shadow-orange-500/25'
                          : 'border border-foreground/[0.06] dark:border-white/[0.06] bg-muted/60 hover:bg-muted text-foreground'
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </NextLink>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            EXPANDED FAQ (2-Column Split with Left Visual)
        ═══════════════════════════════════════════════════ */}
        <section id="faq" className="px-6 py-24 max-w-6xl mx-auto relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-gradient-to-br from-[#FF4D42]/12 via-[#FF8526]/8 to-transparent rounded-full blur-[140px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start relative z-10">
            {/* ── Left Side: What people usually ask + Big Stylized Question Mark Visual ── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col"
            >
              <motion.p variants={fadeUp} className="mb-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-[#FF5533]">
                FAQ & Help
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.12]">
                What people{' '}
                <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                  usually ask
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed">
                Everything you need to know about GrowthPilot AI workflows, setup, and how it automates your weekly marketing execution.
              </motion.p>

              {/* Big Luminous Question Mark Visual Card */}
              <motion.div
                variants={fadeUp}
                className="mt-8 relative rounded-3xl bg-white/95 dark:bg-gradient-to-b dark:from-[#1c0e0e]/95 dark:via-[#150a09]/95 dark:to-[#0e0605] border border-neutral-200/90 dark:border-[#FF5533]/25 shadow-[0_20px_50px_rgba(255,85,51,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] p-7 overflow-hidden text-center backdrop-blur-2xl group"
              >
                {/* Glowing top rim highlight */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF8526] to-transparent pointer-events-none" />

                {/* Ambient internal flame aura */}
                <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-[#FF4D42]/15 dark:bg-[#FF4D42]/20 blur-[50px] pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-[#FF8526]/12 dark:bg-[#FF8526]/18 blur-[50px] pointer-events-none" />

                {/* Concentric decorative background circles */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50%" cy="45%" r="70" fill="none" stroke="#FF5533" strokeDasharray="3 4" />
                  <circle cx="50%" cy="45%" r="115" fill="none" stroke="currentColor" className="text-neutral-400 dark:text-white" strokeDasharray="4 6" />
                </svg>

                {/* Big Stylized 3D Glowing Question Mark */}
                <div className="relative z-10 py-4 flex flex-col items-center justify-center">
                  <div className="relative select-none">
                    <span className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-[#FF5533] via-[#FFAA00] to-[#FF8526] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,85,51,0.7)] group-hover:scale-105 transition-transform duration-300 inline-block">
                      ?
                    </span>
                    {/* Glowing highlight orb behind the question mark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-[#FFAA00]/25 blur-[30px] pointer-events-none -z-10" />
                  </div>

                  <p className="mt-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Still have questions or need custom onboarding?
                  </p>

                  <a
                    href="mailto:support@growthpilot.ai"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff1ed] dark:bg-[#241311] border border-orange-500/25 dark:border-[#FF5533]/30 px-4 py-2 text-xs font-bold text-[#FF5533] dark:text-[#FFAA00] hover:bg-[#ffe7e0] dark:hover:bg-[#2e1714] hover:text-[#E6392D] dark:hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare size={13} className="text-[#FF8526]" />
                    <span>Talk to Founder / Team</span>
                    <ArrowRight size={12} className="text-[#FFAA00]" />
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* ── Right Side: FAQ Accordion List ── */}
            <div className="lg:col-span-7 space-y-3.5">
              {faqs.map((faq, index) => {
                const isOpen = faqOpen === index;
                return (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-2xl ${
                      isOpen
                        ? 'bg-[#fff7f4] dark:bg-gradient-to-b dark:from-[#22110f] dark:via-[#1a0c0a] dark:to-[#120706] border-orange-500/50 dark:border-[#FF622E]/70 shadow-lg shadow-orange-500/10 dark:shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(255,85,51,0.2)]'
                        : 'bg-white/90 dark:bg-gradient-to-b dark:from-[#180c0a]/90 dark:via-[#130807]/90 dark:to-[#0e0605] border-neutral-200/80 dark:border-[#FF5533]/20 hover:border-orange-500/40 dark:hover:border-[#FF5533]/50 shadow-sm dark:shadow-[0_8px_25px_rgba(0,0,0,0.6)]'
                    }`}
                  >
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : index)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition group select-none"
                    >
                      <span className={`text-sm sm:text-base font-bold transition-colors ${isOpen ? 'text-[#FF5533] dark:text-[#FFAA00]' : 'text-neutral-800 dark:text-neutral-100 group-hover:text-[#FF5533] dark:group-hover:text-white'}`}>
                        {faq.q}
                      </span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isOpen
                          ? 'bg-gradient-to-br from-[#FF4D42] to-[#FF8526] text-white shadow-[0_0_15px_rgba(255,85,51,0.6)]'
                          : 'bg-[#fff1ed] dark:bg-[#241311] border border-orange-500/20 dark:border-[#FF5533]/20 text-neutral-600 dark:text-neutral-400 group-hover:text-[#FF5533] dark:group-hover:text-white'
                      }`}>
                        <ChevronDown
                          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          size={16}
                        />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-6 pb-6 pt-1 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300/85 border-t border-neutral-200/70 dark:border-white/[0.04]">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            FINAL CTA — Strong Close
        ═══════════════════════════════════════════════════ */}
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] border border-foreground/[0.05] dark:border-white/[0.07] bg-gradient-to-r from-orange-500/10 via-red-500/10 to-amber-500/5 dark:from-orange-700/20 dark:via-red-700/20 dark:to-amber-600/15 p-8 sm:p-14 shadow-xl"
          >
            {/* Background spotlight */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/12 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#FF473A]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-start gap-6">
                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-orange-500/20 text-[#FF5533] dark:bg-white/10 dark:text-white sm:flex border border-orange-500/15">
                  <Sparkles size={30} className="animate-pulse text-[#FF6A3D]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    Ready to build your{' '}
                    <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">
                      AI growth engine
                    </span>
                    ?
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                    12+ AI tools. SEO, content, video, campaigns, and strategy — all in one workspace. Start with the 7-day free trial and see the difference in your first session.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <NextLink href="/auth?next=/dashboard" className="block w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex h-[54px] w-full sm:w-auto sm:min-w-[220px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#E6392D] hover:to-[#E57118] px-9 text-[15px] font-black text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer"
                  >
                    Start Free Trial <ArrowRight size={18} />
                  </motion.button>
                </NextLink>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> No credit card required
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Cancel anytime
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════
            NEWSLETTER — Placed Above Footer (Temporarily Commented Out)
        ═══════════════════════════════════════════════════ */}
        {/*
        <section className="px-6 pb-24 max-w-4xl mx-auto">
          <div className="rounded-[2.5rem] border border-foreground/[0.05] dark:border-white/[0.06] bg-card/40 backdrop-blur-md p-8 sm:p-14 text-center shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 w-72 h-72 bg-orange-500/8 rounded-full blur-[90px] pointer-events-none" />
            <div className="relative z-10 max-w-lg mx-auto">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#FF5533] dark:text-[#FF7A45]">Newsletter</p>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Stay in the loop</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-7">Get practical AI growth strategies, SEO insights, and product updates delivered weekly.</p>
              
              <div className="mt-8 flex h-[52px] w-full overflow-hidden rounded-2xl border border-foreground/[0.08] dark:border-white/[0.08] bg-card/70 shadow-xs focus-within:border-orange-500/50 transition-colors">
                <input placeholder="Enter your email" className="h-full min-w-0 flex-1 bg-transparent px-5 text-sm outline-none placeholder:text-muted-foreground/45 text-foreground" />
                <button className="flex h-full w-14 items-center justify-center bg-gradient-to-r from-[#FF473A] to-[#FF8526] hover:from-[#E6392D] hover:to-[#E57118] text-white transition-colors cursor-pointer shrink-0">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
        */}
      </main>


      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="px-6 pt-16 pb-12 bg-muted/[0.03] relative z-10 overflow-hidden">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-10 lg:gap-16 justify-between relative z-10">
          <div className="lg:max-w-xs shrink-0">
            <div className="mb-4">
              <BrandLogo href="/" imgClassName="h-8 w-auto" />
            </div>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">
              AI-powered workspace for SEO content, keyword research, trend intelligence, video repurposing, and campaign assets.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Bangla + English • Gemini + Claude powered
            </p>
          </div>

          {/* Footer Link Groups: 2 rows with 2 columns each on mobile, 4 columns on tablet & desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 flex-1 lg:max-w-3xl justify-between">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 text-sm font-black text-foreground">{group.title}</h4>
                <div className="space-y-3">
                  {group.links.map((link) => (
                    <a key={link} href="#" className="block text-sm text-muted-foreground transition hover:text-foreground">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modern High-Impact Brand Signature with LED Dot-Matrix Texture & Spotlight (ONLY TEXT, NO BORDER, NO BACKGROUND) ── */}
        <div className="mx-auto max-w-[1440px] mt-12 pt-4 relative z-10">
          <div
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTextMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseEnter={() => setIsTextHovered(true)}
            onMouseLeave={() => setIsTextHovered(false)}
            className="group relative flex items-center justify-center select-none py-10 sm:py-16 md:py-20 px-2 sm:px-4 cursor-default overflow-hidden"
          >
            {/* Pure LED Dot-Matrix Brand Typography — Truly Massive Display Size */}
            <div className="relative flex items-center justify-center w-full">
              {/* Base Muted Dot-Matrix Typography Layer */}
              <h2
                className="font-black tracking-[-0.04em] text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[155px] 2xl:text-[185px] text-slate-400/35 dark:text-[#6a5a7d]/65 select-none leading-none text-center whitespace-nowrap"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                  WebkitMaskSize: '5.5px 5.5px',
                  maskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                  maskSize: '5.5px 5.5px',
                }}
              >
                GrowthPilot AI
              </h2>

              {/* Interactive Spotlight Reveal Layer — Illuminates ONLY the text dots under cursor */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: isTextHovered ? 1 : 0.25,
                  WebkitMaskImage: isTextHovered
                    ? `radial-gradient(380px circle at ${textMouse.x}px ${textMouse.y}px, black 35%, transparent 75%)`
                    : `radial-gradient(520px circle at 50% 50%, black 20%, transparent 70%)`,
                  maskImage: isTextHovered
                    ? `radial-gradient(380px circle at ${textMouse.x}px ${textMouse.y}px, black 35%, transparent 75%)`
                    : `radial-gradient(520px circle at 50% 50%, black 20%, transparent 70%)`,
                }}
              >
                <h2
                  aria-hidden="true"
                  className="font-black tracking-[-0.04em] text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[155px] 2xl:text-[185px] bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent select-none leading-none text-center whitespace-nowrap"
                  style={{
                    WebkitMaskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                    WebkitMaskSize: '5.5px 5.5px',
                    maskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                    maskSize: '5.5px 5.5px',
                  }}
                >
                  GrowthPilot AI
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-4 pt-6 text-sm text-muted-foreground/60 sm:flex-row relative z-10">
          <p>© 2026 GrowthPilot AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-[#FF5533] dark:hover:text-[#FF7A45] transition-colors cursor-pointer"
            >
              Back to top <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </footer>

      {/* ── Floating Bottom-to-Top Button ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="fixed bottom-7 right-7 z-50 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#E6392D] hover:to-[#E57118] text-white shadow-2xl shadow-orange-500/35 hover:shadow-orange-500/50 cursor-pointer border border-white/20 transition-shadow"
          >
            <ArrowUp size={22} className="stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
