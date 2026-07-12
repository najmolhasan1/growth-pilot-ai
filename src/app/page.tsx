'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  FileText,
  Globe,
  Mail,
  Megaphone,
  PlayCircle,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react';
import PublicNavbar from '@/components/layout/PublicNavbar';

const productModules = [
  {
    icon: Brain,
    title: 'Brand Brain',
    desc: 'Capture your business, offer, audience, tone, and positioning once so every output stays on-brand.',
  },
  {
    icon: Search,
    title: 'Keyword & Search Research',
    desc: 'Find search questions, keyword clusters, content angles, and semantic gaps before you write.',
  },
  {
    icon: FileText,
    title: 'SEO Content Engine',
    desc: 'Generate long-form articles with outline, internal links, FAQs, meta, and NLP optimization.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Intelligence',
    desc: 'Surface daily trending topics and evergreen ideas across your industry and competitors.',
  },
  {
    icon: Video,
    title: 'Video Creator Kit',
    desc: 'Turn videos, audio, or transcripts into shorts, titles, descriptions, chapters, quotes, and thumbnails.',
  },
  {
    icon: Megaphone,
    title: 'Campaign & Launch Assets',
    desc: 'Create launch plans, social posts, emails, landing copy, ad variations, and checklists.',
  },
];

const workspaceRows = [
  { 
    id: 'trend',
    icon: TrendingUp, 
    title: 'Trend Research', 
    desc: 'Scan the market and surface rising topics.', 
    color: 'text-blue-500 dark:text-blue-400', 
    bg: 'bg-blue-500/10 dark:bg-blue-900/20 border border-blue-500/25 dark:border-blue-500/15' 
  },
  { 
    id: 'keyword',
    icon: Target, 
    title: 'Keyword Angle', 
    desc: 'Find high-intent keywords and content gaps.', 
    color: 'text-violet-500 dark:text-violet-400', 
    bg: 'bg-violet-500/10 dark:bg-violet-900/20 border border-violet-500/25 dark:border-violet-500/15', 
    metric: '76+' 
  },
  { 
    id: 'video',
    icon: Video, 
    title: 'Video Kit', 
    desc: 'Repurpose long videos into short-form assets.', 
    color: 'text-amber-500 dark:text-amber-400', 
    bg: 'bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/25 dark:border-amber-500/15' 
  },
  { 
    id: 'campaign',
    icon: Megaphone, 
    title: 'Campaign Assets', 
    desc: 'Create social posts, emails, ads, and more.', 
    color: 'text-cyan-500 dark:text-cyan-400', 
    bg: 'bg-cyan-500/10 dark:bg-cyan-900/20 border border-cyan-500/25 dark:border-cyan-500/15' 
  },
  { 
    id: 'next',
    icon: CheckCircle2, 
    title: 'Next Best Action', 
    desc: 'Publish, repurpose, and schedule with clarity.', 
    color: 'text-emerald-500 dark:text-emerald-400', 
    bg: 'bg-emerald-500/10 dark:bg-emerald-900/20 border border-emerald-500/25 dark:border-emerald-500/15', 
    ready: true 
  },
];

const proofCards = [
  { icon: Sparkles, value: '6+', title: 'Workflows', desc: 'Built for weekly execution' },
  { icon: ShieldCheck, value: '76+', title: 'SEO Checks', desc: 'On-page, content, and technical' },
  { icon: Rocket, value: '10x', title: 'Faster Planning', desc: 'From idea to publish-ready' },
  { icon: Globe, value: 'Bangla + English', title: 'Languages', desc: 'Create in your audience language' },
];

const workflow = [
  {
    icon: Target,
    title: 'Define the goal',
    desc: 'Pick SEO content, video repurpose, campaign launch, or research.',
  },
  {
    icon: Brain,
    title: 'AI thinks like a specialist',
    desc: 'It researches, plans, writes, optimizes, and structures.',
  },
  {
    icon: CheckCircle2,
    title: 'Publish-ready assets come out',
    desc: 'Review, tweak, and ship with confidence.',
  },
];

const outcomes = [
  ['Real-market research', 'Based on live trends and search data.'],
  ['SEO validation', 'On-page, content quality, and technical checks.'],
  ['YouTube ideas', 'From topics to titles, chapters, and hooks.'],
  ['Social, email & ad copy', 'Platform-ready variations that convert.'],
  ['Bangla & English output', 'Write naturally for both languages.'],
  ['Reusable brand memory', 'Consistent tone, messages, and positioning.'],
];

const testimonials = [
  {
    quote: 'GrowthPilot AI cut our content planning time by 80%. The SEO checks and topic ideas are spot on.',
    name: 'Rahat Ahmed',
    role: 'Head of Growth, Nexora',
  },
  {
    quote: 'The video kit is a game changer. We turn one long video into a week of content in minutes.',
    name: 'Farzana Haque',
    role: 'Marketing Lead, BrightPath',
  },
  {
    quote: 'We love the Bangla and English support. Our campaigns feel local and our brand stays consistent.',
    name: 'Tanvir Rahman',
    role: 'Founder, ShopNest',
  },
];

const logos = ['Nexora', 'BrightPath', 'ShopNest', 'EduSpark', 'Paymate', 'Brandify'];

const plans = [
  {
    name: 'Starter',
    price: '$19',
    desc: 'For solo creators and small teams validating content ideas.',
    features: ['SEO article generation', 'Keyword research', 'Basic trend tracker', 'Article exports'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    price: '$49',
    desc: 'For businesses that need repeatable marketing output.',
    features: ['Everything in Starter', 'Video Creator Kit', 'Campaign planner', 'Brand Brain memory', 'Priority generation'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Scale',
    price: '$99',
    desc: 'For agencies, education companies, and content teams.',
    features: ['Unlimited workflows', 'Team members and roles', 'WordPress publishing', 'Advanced reports', 'Dedicated support'],
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    q: 'Is GrowthPilot AI only for SEO writing?',
    a: 'No. SEO content is one workflow. It also supports keyword research, trend research, video creator kits, social campaigns, launch packs, and marketing assets.',
  },
  {
    q: 'Can it work for different industries?',
    a: 'Yes. It is built for ecommerce, B2B, B2C, IT, SaaS, education, creator businesses, agencies, and service companies.',
  },
  {
    q: 'Will the output feel generic?',
    a: 'The workflows use business context, audience intent, transcript details, proof points, and market-specific prompts so output is more specific than a blank chat prompt.',
  },
  {
    q: 'Does it support Bangla and English?',
    a: 'Yes. GrowthPilot AI is tuned for both Bangla and English marketing output, especially for Bangladesh-focused content and campaigns.',
  },
];

const footerGroups = [
  { title: 'Product', links: ['Features', 'Workflow', 'Pricing'] },
  { title: 'Resources', links: ['Blog', 'Guides', 'Case studies'] },
  { title: 'Company', links: ['About us', 'Affiliate', 'Contact'] },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 bg-grid-pattern relative">
      <PublicNavbar />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-6 pb-20 pt-28 sm:pt-36 max-w-7xl mx-auto">
          {/* Ambient Glows */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute left-1/2 top-[-100px] h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[120px]" />
            <div className="absolute right-[5%] top-[150px] h-[350px] w-[350px] rounded-full bg-violet-500/12 dark:bg-violet-600/20 blur-[100px]" />
            <div className="absolute left-[5%] top-[40%] h-[300px] w-[300px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[90px]" />
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_0.98fr] items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/5 dark:bg-blue-400/8 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-300 shadow-xs"
              >
                <Sparkles size={12} className="animate-pulse" /> AI Growth Workspace
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[62px]"
              >
                Your{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  AI-powered growth team
                </span>{' '}
                for content, SEO, video, and campaigns.
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg"
              >
                Discover trends, find keywords, create SEO content, repurpose videos, plan campaigns, and launch with
                scroll-stopping assets, all in one intelligent workspace.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="mt-9 flex flex-col gap-4 sm:flex-row"
              >
                <NextLink href="/auth?next=/dashboard" className="w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-8 py-4 text-sm font-black text-white shadow-2xl shadow-blue-500/25 cursor-pointer"
                  >
                    Start Free Trial <ArrowRight size={17} />
                  </motion.button>
                </NextLink>
                <a
                  href="#process"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 backdrop-blur-xs px-8 py-4 text-sm font-bold text-foreground transition hover:bg-muted hover:border-muted-foreground/35"
                >
                  Explore Workflow <PlayCircle size={17} />
                </a>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground/80"
              >
                {['No credit card required', 'Cancel anytime', '7-day free access'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400" /> {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Visual Hero Mockup - Clean Redesign without vertical sidebar and without click expansion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full"
            >
              {/* Radial gradient background accent behind mockup */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-400/8 dark:from-blue-500/15 dark:via-violet-500/18 dark:to-cyan-400/12 blur-3xl" />
              
              <div className="relative mx-auto w-full max-w-[620px] rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-md hover-glow-card">
                {/* Board Header */}
                <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-md">
                      <Zap fill="white" size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight text-foreground">Growth Workspace</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">Live planning board</p>
                    </div>
                  </div>
                  <button className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground/65 hover:text-foreground hover:border-muted-foreground transition-colors cursor-pointer text-xs font-bold">+</button>
                </div>

                {/* Card Stack Layout (Full Width, No Sidebar, Clean Design) */}
                <div className="space-y-3 flex flex-col justify-between">
                  {workspaceRows.map((row) => (
                    <motion.div 
                      whileHover={{ y: -2 }}
                      key={row.title} 
                      className="rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm hover-glow-card relative"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${row.bg}`}>
                          <row.icon size={18} className={row.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-[13px] font-black text-foreground">{row.title}</p>
                            {row.metric && <span className="text-sm font-black text-foreground">{row.metric}</span>}
                            {row.ready && <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">Ready</span>}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{row.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Social Proof Numbers */}
          <div className="mx-auto mt-20 grid gap-4 rounded-3xl border border-border bg-card/50 backdrop-blur-md p-6 shadow-xl sm:grid-cols-2 lg:grid-cols-4">
            {proofCards.map((card, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={card.title} 
                className="flex items-center gap-4 rounded-2xl p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/65 text-indigo-600 dark:text-blue-400">
                  <card.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground leading-none">{card.value}</p>
                  <p className="text-xs font-black text-foreground/80 mt-1">{card.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="px-6 py-20 relative">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-blue-400">Product Suite</p>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  One workspace
                </span>{' '}
                for the marketing work teams repeat weekly
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {productModules.map((module, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  key={module.title}
                  className="rounded-3xl border border-border bg-card/60 backdrop-blur-md p-8 hover-glow-card shadow-sm"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/70 text-indigo-600 dark:text-blue-400 shadow-xs">
                    <module.icon size={24} />
                  </div>
                  <h3 className="text-lg font-black text-foreground">{module.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{module.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow steps */}
        <section id="process" className="px-6 py-20 bg-muted/10 relative">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-blue-400">How it works</p>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                From idea to{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  publish-ready assets
                </span>{' '}
                in 3 steps
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {workflow.map((step, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={step.title} 
                  className="relative rounded-3xl border border-border bg-card/60 backdrop-blur-md p-8 pt-10 hover-glow-card shadow-sm"
                >
                  <span className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black text-white shadow-lg border border-white/10">
                    {index + 1}
                  </span>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/70 text-indigo-600 dark:text-blue-400">
                    <step.icon size={20} />
                  </div>
                  <h3 className="text-base font-black text-foreground">{step.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes & Testimonials */}
        <section className="border-y border-border bg-muted/5 px-6 py-24 relative">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-blue-400">Why teams use it</p>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Built for{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  real business output
                </span>
                , not blank-prompt AI.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground">
                GrowthPilot AI is trained for marketing work that creates visibility, drives traffic, and converts.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {outcomes.map(([title, desc], i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  key={title} 
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs hover-glow-card"
                >
                  <CheckCircle2 size={20} className="mb-3 text-emerald-500 dark:text-emerald-400" />
                  <p className="text-sm font-black text-foreground">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-24 max-w-7xl">
            <p className="mb-10 text-center text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-blue-400">Trusted by growth teams</p>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={item.name} 
                  className="rounded-3xl border border-border bg-card/70 backdrop-blur-md p-8 shadow-xs hover-glow-card"
                >
                  <p className="text-5xl leading-none text-indigo-500 dark:text-blue-400/80 font-serif">&ldquo;</p>
                  <p className="mt-2 text-sm leading-7 text-foreground/80 italic">{item.quote}</p>
                  <div className="mt-5 flex text-amber-500 dark:text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => <Star key={idx} size={15} fill="currentColor" />)}
                  </div>
                  <p className="mt-5 text-sm font-black text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-10 text-base font-black text-muted-foreground/50 tracking-wider">
              {logos.map((logo) => <span key={logo} className="hover:text-foreground transition-colors duration-300 cursor-default">{logo}</span>)}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute left-1/2 bottom-[-100px] h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-amber-300">Pricing</p>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                Start small. Scale when it becomes{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  your growth desk
                </span>
                .
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 items-stretch">
              {plans.map((plan, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  key={plan.name}
                  className={`relative rounded-[2rem] border p-8 flex flex-col justify-between ${
                    plan.highlight
                      ? 'border-indigo-500/40 bg-card shadow-2xl dark:shadow-blue-500/10 hover-glow-card scale-[1.02] z-10'
                      : 'border-border bg-card/60 hover-glow-card'
                  }`}
                >
                  <div>
                    {plan.highlight && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-1.5 text-[10px] font-black text-white shadow-md border border-white/10 uppercase tracking-widest">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
                    <p className="mt-3 min-h-[48px] text-xs leading-6 text-muted-foreground">{plan.desc}</p>
                    <div className="mt-6 flex items-end gap-1 border-b border-border/40 pb-6">
                      <span className="text-5xl font-black text-foreground tracking-tight">{plan.price}</span>
                      <span className="mb-1 text-muted-foreground font-bold">/mo</span>
                    </div>
                    <ul className="mt-6 space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-xs font-medium text-foreground/85">
                          <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <NextLink href="/auth?next=/dashboard" className="w-full mt-8">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full rounded-2xl py-4 text-xs font-black transition cursor-pointer ${
                        plan.highlight ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25' : 'border border-border bg-muted hover:bg-muted/80 text-foreground'
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

        {/* FAQs Redesigned Accordions */}
        <section id="faq" className="px-6 pb-24 max-w-3xl mx-auto relative">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600 dark:text-amber-300">FAQ</p>
            <h2 className="text-3xl font-black text-foreground tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                Questions
              </span>{' '}
              before you start?
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md">
                <button 
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-sm font-bold transition hover:bg-muted/50 text-foreground"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`shrink-0 text-muted-foreground transition-transform duration-300 ${faqOpen === index ? 'rotate-180' : ''}`} size={16} />
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <p className="px-6 pb-6 text-sm leading-7 text-muted-foreground border-t border-border/50 pt-3">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-20 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-8 overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-500/5 dark:from-violet-700/20 dark:via-blue-700/20 dark:to-cyan-600/15 p-8 sm:p-14 lg:grid-cols-[1fr_auto] lg:items-center relative"
          >
            {/* Spotlights in CTA */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex items-start gap-6 relative z-10">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-indigo-500/20 text-indigo-600 dark:bg-white/10 dark:text-white sm:flex border border-indigo-500/20">
                <Sparkles size={30} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  Give your business a focused{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                    AI growth desk
                  </span>
                  .
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Start with content, video, keyword research, or campaign planning. Keep what works, improve what does not.
                </p>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              <NextLink href="/auth?next=/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-650 dark:bg-white px-8 py-4 text-sm font-black text-white dark:text-blue-700 transition shadow-xl cursor-pointer"
                >
                  Start Free Trial <ArrowRight size={17} />
                </motion.button>
              </NextLink>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> No credit card required</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-16 bg-muted/10 relative z-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
                <Zap className="text-white" fill="white" size={16} />
              </div>
              <span className="text-xl font-black text-foreground tracking-tight">GrowthPilot AI</span>
            </div>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">AI workspace for trend research, SEO content, video, and campaigns.</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-black text-foreground">{group.title}</h4>
              <div className="space-y-3.5">
                {group.links.map((link) => <a key={link} href="#" className="block text-sm text-muted-foreground transition hover:text-foreground">{link}</a>)}
              </div>
            </div>
          ))}
          <div>
            <h4 className="mb-3 text-sm font-black text-foreground">Stay in the loop</h4>
            <p className="mb-4 text-xs leading-6 text-muted-foreground">Get growth tips and product updates.</p>
            <div className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <input placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/45 text-foreground" />
              <button className="flex w-12 items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer">
                <Mail size={17} />
              </button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground/60 sm:flex-row">
          <p>2026 GrowthPilot AI. All rights reserved.</p>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
