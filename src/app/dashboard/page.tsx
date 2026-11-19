'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  ArrowUpRight,
  Brain,
  Camera,
  ClipboardList,
  Cpu,
  FileText,
  Gauge,
  Globe,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Plus,
  Rocket,
  Search,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Zap,
} from 'lucide-react';
import { WorkspaceHeader, WorkspacePage, WorkspaceBody, ui, cx } from '@/components/workspace/ui';

type Tool = {
  name: string;
  description: string;
  href: string;
  icon: typeof Zap;
};

const groups: Array<{ title: string; tools: Tool[] }> = [
  {
    title: 'SEO',
    tools: [
      { name: 'SEO Dashboard', description: 'Articles, words and live trends', href: '/dashboard/seo', icon: LayoutDashboard },
      { name: 'Generate Content', description: 'SEO articles from a keyword', href: '/dashboard/generate', icon: Zap },
      { name: 'Website Analyzer', description: 'Audit, compare, backlinks, AI optimizer', href: '/dashboard/website-analyzer', icon: Gauge },
      { name: 'Keyword Research', description: 'Intent, clusters and difficulty', href: '/dashboard/keywords', icon: Search },
      { name: 'Trend Tracker', description: 'Rising topics to write about', href: '/dashboard/trends', icon: TrendingUp },
      { name: 'Content Calendar', description: 'Plan and schedule posts', href: '/dashboard/calendar', icon: ClipboardList },
      { name: 'My Articles', description: 'Your generated reports', href: '/dashboard/articles', icon: FileText },
      { name: 'WordPress', description: 'Connect and publish', href: '/dashboard/wordpress', icon: Globe },
    ],
  },
  {
    title: 'Growth',
    tools: [
      { name: 'Brand Brain', description: 'Your audience, offer and voice', href: '/dashboard/brand', icon: Brain },
      { name: 'Social Workspace', description: 'Captions, carousels, scripts', href: '/dashboard/social-media', icon: Sparkles },
      { name: 'Strategy Audit', description: 'Positioning and funnel gaps', href: '/dashboard/marketing/strategy_audit', icon: Target },
      { name: 'Launch Pack', description: 'Landing, emails and ads in one', href: '/dashboard/marketing/launch_pack', icon: Rocket },
      { name: 'Campaign Planner', description: '7 / 14 / 30 day calendars', href: '/dashboard/marketing/campaign_planner', icon: ClipboardList },
      { name: 'Social Campaign', description: 'Platform-specific post sets', href: '/dashboard/marketing/social_campaign', icon: Share2 },
      { name: 'Product Copy', description: 'Descriptions that sell', href: '/dashboard/marketing/product_copy', icon: FileText },
      { name: 'Email Campaign', description: 'Promo and welcome sequences', href: '/dashboard/marketing/email_campaign', icon: Mail },
      { name: 'SMS Campaign', description: 'Short, action-first messages', href: '/dashboard/marketing/sms_campaign', icon: MessageSquare },
      { name: 'Landing Page', description: 'Hero, sections and CTAs', href: '/dashboard/marketing/landing_page', icon: Globe },
      { name: 'Product Photography', description: 'Shot briefs and product images', href: '/dashboard/marketing/product_photography', icon: Camera },
      { name: 'Video Content Kit', description: 'Titles, hooks and clips from video', href: '/dashboard/video-kit', icon: Video },
      { name: 'GrowthPilot 2.0', description: 'Store events, leads and recovery', href: '/dashboard/growthpilot-2', icon: Cpu },
    ],
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [userName, setUserName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUser() {
      if (!isSupabaseConfigured()) return;
      try {
        const { data } = await getSupabaseBrowserClient().auth.getUser();
        const user = data.user;
        if (user) {
          const metaName = user.user_metadata?.name || user.user_metadata?.full_name;
          setUserName(String(metaName || user.email?.split('@')[0] || ''));
        }
      } catch {
        /* name is cosmetic */
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map(g => ({
        ...g,
        tools: g.tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
      }))
      .filter(g => g.tools.length > 0);
  }, [query]);

  const firstMatch = filtered[0]?.tools[0];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Home"
        actions={
          <Link href="/dashboard/generate" className={cx(ui.btnPrimary, 'h-9 text-xs')}>
            <Plus size={15} /> New article
          </Link>
        }
      />

      <WorkspaceBody className="max-w-6xl space-y-10">
        <section className="space-y-5 pt-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {greeting()}
            {userName ? `, ${userName}` : ''}
          </h2>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (firstMatch) router.push(firstMatch.href);
            }}
            className="relative max-w-xl"
          >
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tools"
              className={cx(ui.inputIcon, 'h-11 pl-11 pr-16')}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
              Ctrl K
            </kbd>
          </form>
        </section>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No tools match “{query}”.</p>
        )}

        {filtered.map(group => (
          <section key={group.title} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <span className="text-xs text-muted-foreground">{group.tools.length} tools</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition hover:border-[#FF5533]/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition group-hover:bg-[#FF5533] group-hover:text-white">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{tool.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </WorkspaceBody>
    </WorkspacePage>
  );
}
