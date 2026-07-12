'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  Search,
  Zap,
  Brain,
  Target,
  Rocket,
  ClipboardList,
  Video,
  Camera,
  Share2,
  FileText,
  Mail,
  MessageSquare,
  Globe,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Command,
  Play,
} from 'lucide-react';

type ToolCard = {
  name: string;
  description: string;
  useCase: string;
  href: string;
  category: 'SEO Workspace' | 'Growth Suite';
  icon: any;
  tag?: string;
  color: string;
  bg: string;
};

const allTools: ToolCard[] = [
  // SEO Workspace Tools
  {
    name: 'Generate Content',
    description: 'Write SEO-optimized articles with keywords, meta tags, and structured headers.',
    useCase: 'Best for publishing high-quality long-form blogs to WordPress or exports.',
    href: '/dashboard/generate',
    category: 'SEO Workspace',
    icon: Zap,
    tag: 'Popular',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    name: 'Trend Tracker',
    description: 'Monitor daily search trends and evergreen keyword intelligence.',
    useCase: 'Best for tracking rising queries and planning monthly content topics.',
    href: '/dashboard/trends',
    category: 'SEO Workspace',
    icon: TrendingUp,
    tag: 'Hot',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    name: 'Keyword Research',
    description: 'Find search intent, semantic groups, and competitiveness metrics.',
    useCase: 'Best for structuring content pillars and picking target keywords.',
    href: '/dashboard/keywords',
    category: 'SEO Workspace',
    icon: Search,
    tag: 'New',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    name: 'Content Calendar',
    description: 'Plan, outline, and schedule upcoming content workflows.',
    useCase: 'Best for keeping publication deadlines organized for your team.',
    href: '/dashboard/calendar',
    category: 'SEO Workspace',
    icon: ClipboardList,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    name: 'WordPress Sync',
    description: 'Connect self-hosted WordPress sites and publish directly.',
    useCase: 'Best for instantly shipping generated articles without manual copy-paste.',
    href: '/dashboard/settings',
    category: 'SEO Workspace',
    icon: Globe,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    name: 'My Articles',
    description: 'Manage and review your generated article reports.',
    useCase: 'Best for tracking word count, keyword densities, and active exports.',
    href: '/dashboard/articles',
    category: 'SEO Workspace',
    icon: FileText,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },

  // Growth Suite Tools
  {
    name: 'Brand Brain',
    description: 'Save business positioning, target audience profile, and tone of voice.',
    useCase: 'Best for standardizing inputs so every output stays strictly on-brand.',
    href: '/dashboard/brand',
    category: 'Growth Suite',
    icon: Brain,
    tag: 'Core',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
  },
  {
    name: 'Strategy Audit',
    description: 'Formulate messaging matrices, offer structures, and priority funnels.',
    useCase: 'Best for assessing current business gaps and positioning your offer.',
    href: '/dashboard/marketing/strategy_audit',
    category: 'Growth Suite',
    icon: Target,
    tag: 'Core',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    name: 'Launch Pack',
    description: 'Generate high-converting landing copies, emails, and campaign assets in one click.',
    useCase: 'Best for launching new products, webinar registrations, or digital assets.',
    href: '/dashboard/marketing/launch_pack',
    category: 'Growth Suite',
    icon: Rocket,
    tag: 'Popular',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    name: 'Campaign Planner',
    description: 'Create multi-channel launch calendars (LinkedIn, Facebook, Email).',
    useCase: 'Best for organizing 7/14/30 day campaign sequences with hooks and CTAs.',
    href: '/dashboard/marketing/campaign_planner',
    category: 'Growth Suite',
    icon: ClipboardList,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    name: 'Video Content Kit',
    description: 'Analyze transcripts and extract titles, short hook structures, and highlights.',
    useCase: 'Best for converting YouTube/audio clips into short-form social formats.',
    href: '/dashboard/video-kit',
    category: 'Growth Suite',
    icon: Video,
    tag: 'New',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    name: 'Product Photography',
    description: 'Structure photography briefs and generate high-fidelity product images.',
    useCase: 'Best for Shopify listings, Instagram lifestyle posts, or web banner assets.',
    href: '/dashboard/marketing/product_photography',
    category: 'Growth Suite',
    icon: Camera,
    tag: 'MVP',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    name: 'Social Campaign',
    description: 'Generate angles and copy variations tailored for specific social handles.',
    useCase: 'Best for building engagement and community trust on LinkedIn, Facebook, and X.',
    href: '/dashboard/marketing/social_campaign',
    category: 'Growth Suite',
    icon: Share2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    name: 'Product Copy',
    description: 'Write conversion-focused copy highlighting features and handling objections.',
    useCase: 'Best for Shopify descriptions, Amazon copy, and service benefits tables.',
    href: '/dashboard/marketing/product_copy',
    category: 'Growth Suite',
    icon: FileText,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    name: 'Email Campaign',
    description: 'Structure promo and welcome email sequence flows.',
    useCase: 'Best for newsletters, lead magnet deliveries, and subscriber updates.',
    href: '/dashboard/marketing/email_campaign',
    category: 'Growth Suite',
    icon: Mail,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
  {
    name: 'SMS Campaign',
    description: 'Generate compact, high-action SMS notifications.',
    useCase: 'Best for order updates, discount codes, or event bookings reminders.',
    href: '/dashboard/marketing/sms_campaign',
    category: 'Growth Suite',
    icon: MessageSquare,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
  },
  {
    name: 'Landing Page Copy',
    description: 'Structure hero headings, primary copy, and CTAs for optimal conversion.',
    useCase: 'Best for lead generation, course sales, or waitlist signups.',
    href: '/dashboard/marketing/landing_page',
    category: 'Growth Suite',
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'SEO Workspace' | 'Growth Suite'>('All');
  const [userName, setUserName] = useState('Najmol');

  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      if (!isSupabaseConfigured()) return;
      try {
        // refreshSession() fetches fresh user_metadata from server
        const { data } = await getSupabaseBrowserClient().auth.refreshSession();
        const user = data.session?.user;
        if (user) {
          const metaName = user.user_metadata?.name;
          const emailName = user.email?.split('@')[0];
          setUserName(String(metaName || emailName || 'Najmol'));
        }
      } catch {
        try {
          const { data } = await getSupabaseBrowserClient().auth.getUser();
          const metaName = data.user?.user_metadata?.name;
          const emailName = data.user?.email?.split('@')[0];
          setUserName(String(metaName || emailName || 'Najmol'));
        } catch {
          setUserName('Najmol');
        }
      }
    }
    loadUser();
  }, []);

  // Filter tools for autocomplete list
  const suggestedTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools; // Show all tools when query is empty
    return allTools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Click outside suggestions logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCards = useMemo(() => {
    return allTools.filter(tool => {
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
      const matchesSearch = !searchQuery.trim() ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Main Container */}
      <div className="space-y-10 p-6 lg:p-10 max-w-7xl mx-auto">
        
        {/* Banner Section matching the requested design */}
        <section className="relative rounded-[2.5rem] border border-white/10 bg-black min-h-[340px] flex flex-col items-center justify-center text-center p-8 lg:p-12 shadow-2xl">
          {/* Background image & glows wrapper with overflow-hidden to clip them inside rounded corners */}
          <div className="absolute inset-0 z-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
            {/* Banner Collage Background Image */}
            <div className="absolute inset-0 opacity-40">
              <Image
                src="/images/banner_collage.png"
                alt="Workspace banner graphic collage"
                fill
                priority
                className="object-cover"
              />
            </div>
            {/* Ambient Glows */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-indigo-500/20 blur-[100px]" />
          </div>

          {/* Banner Content Layer */}
          <div className="relative z-20 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
              <Sparkles size={12} className="animate-pulse" /> Welcome back, {userName}!
            </div>
            
            <h1 className="text-3xl font-black leading-tight sm:text-5xl tracking-tight text-white">
              Find growth tools that{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                speak to you
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed text-white/70">
              Access the complete SEO planner, daily trend tracker, and growth workspaces. Jump into any workflow immediately.
            </p>

            {/* Premium Autocomplete Search Bar Component */}
            <div ref={suggestionsRef} className="relative max-w-xl mx-auto mt-4 w-full">
              <div className="flex items-center gap-3 rounded-full border border-white/15 bg-[#090d16]/90 p-1.5 shadow-2xl backdrop-blur-md focus-within:border-fuchsia-400/50 focus-within:ring-2 focus-within:ring-fuchsia-400/10 transition-all">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50">
                  <Command size={15} />
                </div>
                <input
                  type="text"
                  placeholder="Search, navigate, or launch tools..."
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-white/35 text-white"
                />
                <button 
                  onClick={() => setShowSuggestions(current => !current)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Search size={15} />
                </button>
              </div>

              {/* Suggestions Overlay Dropdown */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#0d1117]/95 p-3 shadow-2xl backdrop-blur-xl text-left max-h-[320px] overflow-y-auto custom-scrollbar">
                  <p className="mb-2 px-3.5 text-[9px] font-black uppercase tracking-widest text-white/30">Suggestions</p>
                  
                  {suggestedTools.length === 0 ? (
                    <p className="px-3.5 py-4 text-xs text-white/40">No tools found matching &quot;{searchQuery}&quot;</p>
                  ) : (
                    <div className="space-y-1">
                      {suggestedTools.map(tool => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.name}
                            onClick={() => {
                              router.push(tool.href);
                              setShowSuggestions(false);
                            }}
                            className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left hover:bg-white/5 transition-all group cursor-pointer"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tool.bg} ${tool.color}`}>
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-white group-hover:text-fuchsia-300 transition-colors">{tool.name}</h4>
                              <p className="truncate text-[10px] text-white/40 mt-0.5">{tool.description}</p>
                            </div>
                            <ArrowRight size={13} className="text-white/10 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Tools Catalog Categorized */}
        <section className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase tracking-wider">Workspace Catalog</h2>
              <p className="text-xs text-white/40 mt-1">Access advanced content generators, strategic campaign briefs, and intelligence tools.</p>
            </div>
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(['All', 'SEO Workspace', 'Growth Suite'] as const).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-1.5 text-xs font-black transition cursor-pointer ${
                    activeCategory === category
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map(tool => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover-glow-card transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tool.bg} ${tool.color}`}>
                        <Icon size={20} />
                      </div>
                      {tool.tag && (
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                          {tool.tag}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-base font-black text-white group-hover:text-fuchsia-200 transition-colors">
                      {tool.name}
                    </h3>
                    
                    <p className="mt-2 text-xs leading-relaxed text-white/50 group-hover:text-white/60 transition-colors">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Use Case</p>
                    <p className="mt-1 text-[11px] text-white/45 leading-relaxed group-hover:text-white/60 transition-colors">
                      {tool.useCase}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-fuchsia-300/80 group-hover:text-fuchsia-250 transition-all">
                      Launch workspace <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
