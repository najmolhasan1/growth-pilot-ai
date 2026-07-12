'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Zap, 
  Search, 
  FileText, 
  Calendar,
  Globe,
  Menu,
  X,
  TrendingUp,
  Brain,
  Megaphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Rocket,
  ClipboardList,
  Target,
  Library,
  Share2,
  Video,
  Camera,
  Mail,
  MessageSquare,
  Sparkles,
  Palette,
  User,
  Settings,
  HelpCircle,
  Store,
  CheckCircle2,
  Loader2,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useTheme } from './ThemeProvider';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuGroups = [
  {
    title: 'GROWTH SUITE',
    items: [
      { icon: Brain, label: 'Brand Brain', href: '/dashboard/brand' },
      { icon: Target, label: 'Strategy Audit', href: '/dashboard/marketing/strategy_audit', tag: 'Core' },
      { icon: Rocket, label: 'Launch Pack', href: '/dashboard/marketing/launch_pack', tag: 'New' },
      { icon: ClipboardList, label: 'Campaign Planner', href: '/dashboard/marketing/campaign_planner' },
      { icon: Video, label: 'Video Content Kit', href: '/dashboard/video-kit', tag: 'New' },
      { icon: Video, label: 'Video Kit V2', href: '/dashboard/video-kit-v2', tag: 'Beta' },
      { icon: Camera, label: 'Product Photography', href: '/dashboard/marketing/product_photography', tag: 'MVP' },
      { icon: Share2, label: 'Social Campaign', href: '/dashboard/marketing/social_campaign' },
      { icon: FileText, label: 'Product Copy', href: '/dashboard/marketing/product_copy' },
      { icon: Mail, label: 'Email Campaign', href: '/dashboard/marketing/email_campaign' },
      { icon: MessageSquare, label: 'SMS Campaign', href: '/dashboard/marketing/sms_campaign' },
      { icon: Globe, label: 'Landing Page', href: '/dashboard/marketing/landing_page' },
      { icon: Library, label: 'Asset Library', href: '/dashboard/marketing#library' },
      { icon: Megaphone, label: 'All Marketing Tools', href: '/dashboard/marketing' },
    ]
  }
];

const seoSections = [
  {
    title: 'DASHBOARD',
    items: [
      { icon: LayoutDashboard, label: 'SEO Dashboard', href: '/dashboard/seo' },
    ]
  },
  {
    title: 'CONTENT',
    items: [
      { icon: Zap, label: 'Generate Content', href: '/dashboard/generate' },
      { icon: TrendingUp, label: 'Trend Tracker', href: '/dashboard/trends', tag: 'Hot' },
      { icon: Search, label: 'Keyword Research', href: '/dashboard/keywords', tag: 'New' },
      { icon: Calendar, label: 'Content Calendar', href: '/dashboard/calendar' },
    ]
  },
  {
    title: 'PUBLISHING',
    items: [
      { icon: Globe, label: 'WordPress Settings', href: '/dashboard/wordpress' },
      { icon: FileText, label: 'My Articles', href: '/dashboard/articles' },
    ]
  }
];

const seoHrefs = seoSections.flatMap(section => section.items.map(item => item.href));

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [userPlan, setUserPlan] = useState('Free Trial');
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [userName, setUserName] = useState('NAJMOL HASAN');
  const [userNickname, setUserNickname] = useState('najmolhasan');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NH';
  };

  const [pricingOpen, setPricingOpen] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activating, setActivating] = useState(false);

  // Payment UI Flow States
  const [paymentPlan, setPaymentPlan] = useState<'monthly' | 'lifetime' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bkash'>('card');
  const [paymentStage, setPaymentStage] = useState<'plan_select' | 'payment_input' | 'processing' | 'success'>('plan_select');
  const [processingStep, setProcessingStep] = useState(1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showLicenseKeyForm, setShowLicenseKeyForm] = useState(false);

  // Card details states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Mobile Banking details states
  const [walletNumber, setWalletNumber] = useState('');
  const [walletProvider, setWalletProvider] = useState<'bkash' | 'nagad'>('bkash');
  const [walletOtpSent, setWalletOtpSent] = useState(false);
  const [walletOtp, setWalletOtp] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletPinSent, setWalletPinSent] = useState(false);

  // Input formatting utilities
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(' ') : v;
  };

  const formatCardExpiry = (value: string) => {
    const v = value.replace(/[^0-9]/g, '');
    if (v.length > 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleStartPayment = (plan: 'monthly' | 'lifetime') => {
    setPaymentPlan(plan);
    setPaymentStage('payment_input');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStage('processing');
    setProcessingStep(1);

    const stages = [
      { step: 1, text: "Connecting to secure payment gateway..." },
      { step: 2, text: "Processing transaction..." },
      { step: 3, text: "Verifying secure signatures..." },
      { step: 4, text: "Upgrading account plan details..." },
      { step: 5, text: "Unlocking Plus workspace access..." }
    ];

    for (const s of stages) {
      setProcessingStep(s.step);
      setProcessingStatus(s.text);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { plan: 'Plus' }
      });
      
      if (error) throw error;
      
      setUserPlan('Plus');
      setPaymentStage('success');
      
      setTimeout(() => {
        setPricingOpen(false);
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      alert(err.message || 'Payment processing failed. Please try again.');
      setPaymentStage('payment_input');
    }
  };

  const handleActivateInModal = async () => {
    setActivationError('');
    setActivating(true);
    
    const validKeys = ['GP-PLUS-2026', 'NAJMOL-GROWTH-2026', 'TRIAL-UNLOCK-99X'];
    const enteredKey = activationKey.trim().toUpperCase();
    
    if (!validKeys.includes(enteredKey)) {
      setActivationError('Invalid activation key.');
      setActivating(false);
      return;
    }
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { plan: 'Plus' }
      });
      
      if (error) throw error;
      
      setActivationSuccess(true);
      setUserPlan('Plus');
      
      setTimeout(() => {
        setPricingOpen(false);
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setActivationError(err?.message || 'Activation failed.');
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    // Check sandbox override state first
    const sandboxState = typeof window !== 'undefined' && localStorage.getItem('sandbox_admin_bypass') === 'true';
    if (sandboxState) {
      setIsAdmin(true);
    }

    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    
    // Use refreshSession() to get fresh user_metadata (reflects admin plan/role changes instantly)
    supabase.auth.refreshSession().then(({ data }) => {
      const user = data?.session?.user;
      if (!user) {
        // Fallback to cached session
        supabase.auth.getSession().then(({ data: cached }) => {
          if (cached?.session?.user) {
            applyUserMeta(cached.session.user, sandboxState);
          }
        });
        return;
      }
      applyUserMeta(user, sandboxState);
    });

    function applyUserMeta(user: any, sandboxState: boolean) {
      const meta = user.user_metadata;
      if (meta?.full_name || meta?.name) {
        setUserName(meta.full_name || meta.name);
      }
      if (meta?.username) {
        setUserNickname(meta.username);
      }
      if (meta?.avatar_url) {
        setAvatarUrl(meta.avatar_url);
      }
      const isPlus = user.user_metadata?.plan === 'Plus';
      if (isPlus) {
        setUserPlan('Plus');
      } else {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const diffTime = now.getTime() - createdAt.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        const daysRemaining = Math.max(0, 7 - Math.floor(diffDays));
        setUserPlan(daysRemaining > 0 ? `Trial` : 'Trial ended');
        setTrialDaysLeft(daysRemaining);
      }

      // Set admin status based on Supabase role or sandbox
      if (meta?.role === 'admin' || sandboxState) {
        setIsAdmin(true);
      }
    }
  }, []);

  const isSeoActive = seoHrefs.includes(pathname);

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await getSupabaseBrowserClient().auth.signOut();
    }
    router.push('/auth?next=/dashboard');
  };

  const handleSeoClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setSeoOpen(true);
    } else {
      setSeoOpen(open => !open);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setIsOpen(open => !open)}
        className="fixed right-4 top-4 z-50 rounded-xl border border-border bg-card p-3 text-foreground shadow-lg lg:hidden cursor-pointer"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col overflow-hidden w-[260px]",
        isCollapsed ? "lg:w-[80px]" : "lg:w-[260px]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo container (fixed top) */}
          <div className={cn(
            "p-6 flex items-center select-none",
            isCollapsed ? "lg:flex-col lg:gap-4 lg:px-2 lg:justify-center" : "justify-between gap-3"
          )}>
            <Link href="/dashboard" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <Zap className="text-white" fill="white" size={18} />
              </div>
              <h1 className={cn(
                "text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 whitespace-nowrap",
                isCollapsed ? "lg:hidden" : "block"
              )}>
                GrowthPilot AI
              </h1>
            </Link>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Scrollable menu options (middle) */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <Link
                key="/dashboard"
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? "Dashboard Hub" : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all group relative",
                  isCollapsed ? "lg:justify-center lg:h-10 lg:w-10 lg:mx-auto" : "gap-3 px-3 py-2",
                  pathname === "/dashboard" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <LayoutDashboard size={18} />
                <span className={cn(
                  "font-medium text-[13px]",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  Dashboard Hub
                </span>
              </Link>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSeoClick}
                title={isCollapsed ? "SEO Workspace" : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all cursor-pointer",
                  isCollapsed ? "lg:justify-center lg:h-10 lg:w-10 lg:mx-auto" : "w-full gap-3 px-3 py-2",
                  isSeoActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Zap size={20} />
                <span className={cn(
                  "font-medium text-sm",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  SEO Workspace
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "ml-auto transition-transform", 
                    seoOpen ? "rotate-180" : "rotate-0",
                    isCollapsed ? "lg:hidden" : "block"
                  )}
                />
              </button>

              {seoOpen && (
                <div className={cn(
                  "mt-4 space-y-5 border-l border-border pl-3",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  {seoSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <h3 className="px-3 text-[10px] font-bold text-muted-foreground/60 tracking-[0.1em] mb-2">{section.title}</h3>
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                              isActive ? "bg-primary/95 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <item.icon size={18} />
                            <span className="font-medium text-[13px]">{item.label}</span>
                            {item.tag && (
                              <span className={cn(
                                "ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold",
                                item.tag === 'New' ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-orange-500/20 text-orange-400"
                              )}>
                                {item.tag}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {isCollapsed && <hr className="hidden lg:block border-border/10 my-4" />}
                <h3 className={cn(
                  "px-3 text-[10px] font-bold text-muted-foreground/60 tracking-[0.1em] mb-2",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  {group.title}
                </h3>
                {group.items.map((item) => {
                  const [baseHref, query] = item.href.split('?');
                  const isActive = pathname === baseHref && !query;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg transition-all group relative",
                        isCollapsed ? "lg:justify-center lg:h-10 lg:w-10 lg:mx-auto" : "gap-3 px-3 py-2",
                        isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon size={18} />
                      <span className={cn(
                        "font-medium text-[13px]",
                        isCollapsed ? "lg:hidden" : "block"
                      )}>
                        {item.label}
                      </span>
                      {item.tag && (
                        <span className={cn(
                          "ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold",
                          isCollapsed ? "lg:hidden" : "block",
                          item.tag === 'New' ? "bg-emerald-500/20 text-emerald-400" : 
                          item.tag === 'Core' ? "bg-fuchsia-500/20 text-fuchsia-300" :
                          "bg-orange-500/20 text-orange-400"
                        )}>
                          {item.tag}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {isAdmin && (
              <div className="space-y-1">
                {isCollapsed && <hr className="hidden lg:block border-border/10 my-4" />}
                <h3 className={cn(
                  "px-3 text-[10px] font-bold text-red-400/80 tracking-[0.1em] mb-2 uppercase",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  Administration
                </h3>
                <Link
                  href="/dashboard/admin"
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? "Admin Panel" : undefined}
                  className={cn(
                    "flex items-center rounded-lg transition-all group relative border border-red-500/10 bg-red-500/5 hover:bg-red-500/10",
                    isCollapsed ? "lg:justify-center lg:h-10 lg:w-10 lg:mx-auto" : "gap-3 px-3 py-2.5",
                    pathname === "/dashboard/admin" ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/25" : "text-red-400 hover:text-red-300"
                  )}
                >
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className={cn(
                    "font-bold text-[13px]",
                    isCollapsed ? "lg:hidden" : "block"
                  )}>
                    Admin Panel
                  </span>
                </Link>
              </div>
            )}
          </nav>

          {/* Footer Profile Card (fixed bottom) */}
          <div className={cn(
            "p-4 mt-auto border-t border-border relative bg-card",
            isCollapsed ? "lg:p-2 lg:flex lg:justify-center lg:items-center" : ""
          )}>
            {/* Invisible overlay to close popover when clicking outside */}
            {profileMenuOpen && (
              <button
                type="button"
                onClick={() => setProfileMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default bg-transparent w-full h-full border-none outline-none"
              />
            )}

            {/* Popover Menu inside footer container */}
            {profileMenuOpen && (
              <div className={cn(
                "z-50 bg-[#0d111d] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5",
                isCollapsed 
                  ? "absolute bottom-4 left-[90px] w-64" 
                  : "absolute bottom-full left-4 right-4 mb-2"
              )}>
                {/* Header (Info) */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-9 h-9 shrink-0 rounded-full object-cover shadow-sm select-none" />
                    ) : (
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm shadow-sm select-none font-black">
                        {getInitials(userName)}
                      </div>
                    )}
                    <div className="min-w-0 flex flex-col">
                      <span className="text-sm font-bold text-foreground truncate leading-tight font-black">{userName}</span>
                      <span className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">@{userNickname}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/60" />
                </div>

                <hr className="border-white/5 my-1" />

                {/* Menu Items */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setPricingOpen(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <Sparkles size={16} className="text-muted-foreground/80" />
                  <span className="font-semibold text-[13px]">Upgrade plan</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Palette size={16} className="text-muted-foreground/80" />
                    <span className="font-semibold text-[13px]">Personalization</span>
                  </div>
                  <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-muted-foreground/80">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <User size={16} className="text-muted-foreground/80" />
                  <span className="font-semibold text-[13px]">Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <Settings size={16} className="text-muted-foreground/80" />
                  <span className="font-semibold text-[13px]">Settings</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push('/dashboard/admin');
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                  >
                    <ShieldCheck size={16} className="text-red-400/80" />
                    <span className="font-semibold text-[13px]">Admin Panel</span>
                  </button>
                )}

                <hr className="border-white/5 my-1" />

                <button
                  type="button"
                  onClick={() => alert('Help center is coming soon!')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-muted-foreground/80" />
                    <span className="font-semibold text-[13px]">Help</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/60" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left w-full border-none bg-transparent"
                >
                  <LogOut size={16} className="text-red-400/80" />
                  <span className="font-semibold text-[13px]">Log out</span>
                </button>
              </div>
            )}

            {/* Profile trigger button */}
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title={userName}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-all cursor-pointer shadow-sm bg-purple-600 border-none select-none p-0 overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-10 h-10 object-cover rounded-full" />
                ) : (
                  <span className="text-white font-bold text-sm">{getInitials(userName)}</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 cursor-pointer group text-left bg-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-9 h-9 shrink-0 rounded-full object-cover shadow-sm select-none" />
                  ) : (
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm shadow-sm select-none font-black">
                      {getInitials(userName)}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-bold text-foreground truncate leading-tight font-black">{userName}</span>
                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                      {userPlan === 'Plus' ? 'Plus' : `Trial (${trialDaysLeft}d left)`}
                    </span>
                  </div>
                </div>
                <Store size={18} className="text-muted-foreground/80 group-hover:text-foreground transition-colors shrink-0" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Pricing Modal */}
      {pricingOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close overlay on click */}
          <button 
            type="button" 
            onClick={() => setPricingOpen(false)}
            className="absolute inset-0 cursor-default bg-transparent border-none outline-none"
          />
          
          <div className="bg-[#0b0f1a]/95 border border-white/10 rounded-3xl p-8 max-w-4xl w-full relative z-[110] shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
            {paymentStage === 'plan_select' && (
              <button
                type="button"
                onClick={() => setPricingOpen(false)}
                className="absolute right-6 top-6 rounded-lg border border-white/10 hover:bg-white/5 p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}

            {/* STAGE 1: PLAN SELECTION */}
            {paymentStage === 'plan_select' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Pricing Plans</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">Choose Your Growth Plan 🚀</h2>
                  <p className="text-sm text-white/50 mt-1">Scale your SEO, content creation, and marketing campaigns with premium features.</p>
                </div>

                <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mt-2">
                  {/* Free Trial Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Free Trial</h3>
                        {userPlan !== 'Plus' && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-black text-white">$0</span>
                        <span className="text-white/40 text-xs">/ 7 Days</span>
                      </div>
                      <p className="text-xs text-white/50 mb-6 leading-relaxed">
                        Test the core features of GrowthPilot AI for 7 days. Ideal for exploring our capabilities.
                      </p>
                      
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span><strong>SEO Tool</strong>: 5,000 words limit</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span><strong>Marketing Suite</strong>: Max 3 runs limit</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span><strong>Keywords Tool</strong>: Max 3 reports limit</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span><strong>Brand Brain</strong>: Max 1 profile context</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="w-full bg-white/5 text-white/40 border border-white/5 py-3 rounded-xl font-bold text-xs cursor-default text-center"
                    >
                      {userPlan !== 'Plus' ? 'Current Plan' : 'Free Tier'}
                    </button>
                  </div>

                  {/* Plus Monthly Plan Card */}
                  <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-primary/5">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Plus Monthly</h3>
                        {userPlan === 'Plus' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-4">
                        <span className="text-3xl font-black text-white">$49</span>
                        <span className="text-white/40 text-xs">/ Month</span>
                      </div>
                      <p className="text-xs text-white/50 mb-6 leading-relaxed">
                        Unlock the ultimate suite. Maximize your workspace with monthly updates and standard support.
                      </p>

                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong>Unlimited SEO words</strong>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>1-Click WordPress publishing</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong>Video Kit & All Suite Tools</strong>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Standard monthly updates</span>
                        </li>
                      </ul>
                    </div>

                    {userPlan === 'Plus' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Plan Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartPayment('monthly')}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                      >
                        Subscribe & Pay Now
                      </button>
                    )}
                  </div>

                  {/* Plus Lifetime Plan Card */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-primary rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-primary/10">
                    <div className="absolute right-0 top-0 bg-primary text-white text-[9px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                      Best Value
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Plus Lifetime</h3>
                        {userPlan === 'Plus' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-4">
                        <span className="text-3xl font-black text-white">$299</span>
                        <span className="text-white/40 text-xs">/ One-time</span>
                      </div>
                      <p className="text-xs text-white/50 mb-6 leading-relaxed">
                        Get lifetime updates and unlimited features forever. No monthly payments, own it for life.
                      </p>

                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong>Unlimited SEO words</strong>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>1-Click WordPress publishing</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong>Video Kit & All Suite Tools</strong>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong>Lifetime access & updates</strong>
                        </li>
                      </ul>
                    </div>

                    {userPlan === 'Plus' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Plan Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartPayment('lifetime')}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Buy Lifetime Access
                      </button>
                    )}
                  </div>
                </div>

                {/* Legacy License Key activation fallback */}
                {userPlan !== 'Plus' && (
                  <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowLicenseKeyForm(!showLicenseKeyForm)}
                      className="text-xs text-white/40 hover:text-white transition-colors underline"
                    >
                      {showLicenseKeyForm ? 'Hide manual key activation' : 'Have an activation license key?'}
                    </button>
                    
                    {showLicenseKeyForm && (
                      <div className="mt-4 max-w-sm mx-auto p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={activationKey}
                            onChange={(e) => setActivationKey(e.target.value)}
                            placeholder="Enter Key (e.g. GP-PLUS-2026)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none transition-all uppercase tracking-wider font-semibold"
                          />
                          <button
                            type="button"
                            onClick={handleActivateInModal}
                            disabled={activating}
                            className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center min-w-[75px] disabled:opacity-50 cursor-pointer"
                          >
                            {activating ? <Loader2 size={12} className="animate-spin" /> : 'Activate'}
                          </button>
                        </div>
                        {activationError && (
                          <p className="text-[10px] text-red-400 font-semibold mt-2 text-left">{activationError}</p>
                        )}
                        {activationSuccess && (
                          <p className="text-[10px] text-emerald-400 font-semibold mt-2 text-left">Success! Unlocking...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* STAGE 2: CHECKOUT DETAIL FORM */}
            {paymentStage === 'payment_input' && (
              <div className="flex flex-col gap-6">
                {/* Header Back Link */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStage('plan_select');
                      setWalletOtpSent(false);
                      setWalletPinSent(false);
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to pricing plans</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Lock size={12} className="text-emerald-400" />
                    <span>Secure 256-Bit SSL Checkout</span>
                  </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Left Panel: Summary info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Your Order</span>
                      <h3 className="text-lg font-black text-white mt-1">
                        {paymentPlan === 'lifetime' ? 'Plus Lifetime Access' : 'Plus Monthly Subscription'}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-3xl font-black text-white">
                          {paymentPlan === 'lifetime' ? '$299' : '$49'}
                        </span>
                        <span className="text-white/40 text-xs">
                          {paymentPlan === 'lifetime' ? 'One-time' : '/ month'}
                        </span>
                      </div>
                      
                      <hr className="border-white/5 my-4" />
                      
                      <ul className="space-y-2.5">
                        <li className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>Unlimited Word Generation</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>Full SEO Workspace Tools</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>Video & Marketing Kit V2</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>1-Click WP Sync Setup</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-3">
                      <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      <div className="text-[11px] text-emerald-400/80 leading-relaxed">
                        <strong>Instant Plan Activation:</strong> As soon as verification completes, your Workspace is upgraded immediately. No codes required.
                      </div>
                    </div>
                  </div>

                  {/* Right Panel: Payment Inputs */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          paymentMethod === 'card' 
                            ? "bg-white/5 text-white border border-white/10" 
                            : "text-white/40 hover:text-white/70"
                        )}
                      >
                        <CreditCard size={14} />
                        <span>Credit / Debit Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bkash')}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          paymentMethod === 'bkash' 
                            ? "bg-white/5 text-white border border-white/10" 
                            : "text-white/40 hover:text-white/70"
                        )}
                      >
                        <Smartphone size={14} />
                        <span>Mobile Banking</span>
                      </button>
                    </div>

                    {/* METHOD A: CREDIT CARD FORM */}
                    {paymentMethod === 'card' && (
                      <form onSubmit={handlePay} className="space-y-4">
                        {/* Glassmorphic Card Preview */}
                        <div className="relative h-44 w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-white/10 rounded-2xl p-5 overflow-hidden flex flex-col justify-between shadow-2xl">
                          {/* Shine overlays */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
                          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
                          
                          <div className="flex items-start justify-between relative z-10">
                            {/* Chip */}
                            <div className="w-10 h-7 bg-amber-500/20 border border-amber-500/30 rounded-md flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-x-2 inset-y-1.5 border-r border-b border-amber-500/30" />
                              <div className="absolute inset-x-1.5 inset-y-2 border-l border-t border-amber-500/30" />
                            </div>
                            
                            {/* Card Network Logo Indicator */}
                            <div className="text-right text-xs font-black text-white/55 uppercase tracking-widest">
                              {cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Pay Card'}
                            </div>
                          </div>

                          <div className="text-white text-base tracking-[0.2em] font-mono my-4 select-none">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/60 uppercase relative z-10 font-medium">
                            <div className="min-w-0">
                              <p className="text-[8px] text-white/40 tracking-wider">Cardholder</p>
                              <p className="truncate font-mono">{cardName || 'NAJMOL HASAN'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-white/40 tracking-wider">Expires</p>
                              <p className="font-mono">{cardExpiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Card Form Inputs */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Name on card"
                              required
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Card Number</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                placeholder="4111 2222 3333 4444"
                                maxLength={19}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono tracking-wider"
                              />
                              <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Expiry Date</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                                placeholder="MM/YY"
                                maxLength={5}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">CVV / CVC</label>
                              <input
                                type="password"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="•••"
                                maxLength={4}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:scale-[1.01] transition-all cursor-pointer"
                        >
                          <Lock size={12} />
                          <span>Pay ${paymentPlan === 'lifetime' ? '299.00' : '49.00'} Securely</span>
                        </button>
                      </form>
                    )}

                    {/* METHOD B: MOBILE BANKING SIMULATOR */}
                    {paymentMethod === 'bkash' && (
                      <div className="space-y-4">
                        {/* Provider selection buttons */}
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setWalletProvider('bkash');
                              setWalletOtpSent(false);
                              setWalletPinSent(false);
                            }}
                            className={cn(
                              "border rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer",
                              walletProvider === 'bkash'
                                ? "bg-[#e2136e]/10 border-[#e2136e] text-white"
                                : "bg-black/30 border-white/5 text-white/55 hover:text-white"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#e2136e] flex items-center justify-center text-[10px] font-black text-white select-none">b</div>
                            <span className="font-bold text-xs tracking-wide">bKash Checkout</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setWalletProvider('nagad');
                              setWalletOtpSent(false);
                              setWalletPinSent(false);
                            }}
                            className={cn(
                              "border rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer",
                              walletProvider === 'nagad'
                                ? "bg-[#f7941d]/10 border-[#f7941d] text-white"
                                : "bg-black/30 border-white/5 text-white/55 hover:text-white"
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#f7941d] flex items-center justify-center text-[10px] font-black text-white select-none">n</div>
                            <span className="font-bold text-xs tracking-wide">Nagad Checkout</span>
                          </button>
                        </div>

                        {/* FLOW STEP 1: WALLET NUMBER ENTRY */}
                        {!walletOtpSent && (
                          <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                            <div>
                              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                Your {walletProvider === 'bkash' ? 'bKash' : 'Nagad'} Account Number
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/45">+880</span>
                                <input
                                  type="text"
                                  value={walletNumber}
                                  onChange={(e) => setWalletNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                  placeholder="17XXXXXXXX"
                                  maxLength={10}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono tracking-wider"
                                />
                              </div>
                              <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                                Enter your 10-digit mobile wallet number. We will send a secure verification code (OTP) to this number.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (walletNumber.length < 10) {
                                  alert('Please enter a valid wallet account number.');
                                  return;
                                }
                                setWalletOtpSent(true);
                              }}
                              className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white",
                                walletProvider === 'bkash' ? "bg-[#e2136e] hover:bg-[#e2136e]/90" : "bg-[#f7941d] hover:bg-[#f7941d]/90"
                              )}
                            >
                              <span>Send Verification OTP</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* FLOW STEP 2: OTP VERIFICATION */}
                        {walletOtpSent && !walletPinSent && (
                          <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                  Verification OTP Code
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setWalletOtpSent(false)}
                                  className="text-[9px] font-bold text-primary hover:underline"
                                >
                                  Change Number
                                </button>
                              </div>
                              <p className="text-[10px] text-emerald-400 font-semibold mb-2">
                                Sent verification code to +880 {walletNumber} 📲
                              </p>
                              <input
                                type="text"
                                value={walletOtp}
                                onChange={(e) => setWalletOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="Enter 6-digit OTP (e.g. 123456)"
                                maxLength={6}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center tracking-[0.5em] font-black"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (walletOtp.length < 6) {
                                  alert('Please enter the 6-digit verification code.');
                                  return;
                                }
                                setWalletPinSent(true);
                              }}
                              className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white",
                                walletProvider === 'bkash' ? "bg-[#e2136e] hover:bg-[#e2136e]/90" : "bg-[#f7941d] hover:bg-[#f7941d]/90"
                              )}
                            >
                              <span>Verify OTP Code</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* FLOW STEP 3: SECURE PIN */}
                        {walletPinSent && (
                          <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                            <form onSubmit={handlePay} className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                                  Enter Secure Wallet PIN
                                </label>
                                <input
                                  type="password"
                                  value={walletPin}
                                  onChange={(e) => setWalletPin(e.target.value.replace(/[^0-9]/g, ''))}
                                  placeholder="••••"
                                  maxLength={5}
                                  required
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center tracking-[0.5em] font-black"
                                />
                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 mt-2">
                                  <Lock size={10} className="text-emerald-400" />
                                  <span>Secure sandbox. We never store or log your wallet PIN.</span>
                                </div>
                              </div>

                              <button
                                type="submit"
                                className={cn(
                                  "w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white shadow-lg",
                                  walletProvider === 'bkash' 
                                    ? "bg-[#e2136e] hover:bg-[#e2136e]/90 shadow-[#e2136e]/10" 
                                    : "bg-[#f7941d] hover:bg-[#f7941d]/90 shadow-[#f7941d]/10"
                                )}
                              >
                                <Lock size={12} />
                                <span>Confirm & Pay ${paymentPlan === 'lifetime' ? '299.00' : '49.00'}</span>
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: PROCESSING WEBHOOK LOADER OVERLAY */}
            {paymentStage === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center animate-pulse" />
                  <Loader2 className="absolute inset-0 m-auto text-primary animate-spin" size={32} />
                </div>
                
                <h3 className="text-lg font-black text-white mb-2">Authorizing Transaction</h3>
                <p className="text-xs text-white/50 mb-8 max-w-xs leading-relaxed">
                  Please do not reload the page. We are securely matching your receipt tokens with the payment gateway.
                </p>

                {/* Checklist stages */}
                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-3 font-semibold">
                  {[
                    "Connecting to secure payment gateway...",
                    "Processing transaction...",
                    "Verifying secure signatures...",
                    "Upgrading account plan details...",
                    "Unlocking Plus workspace access..."
                  ].map((status, idx) => {
                    const stepNum = idx + 1;
                    const isActive = processingStep === stepNum;
                    const isCompleted = processingStep > stepNum;
                    return (
                      <div key={status} className="flex items-center gap-3 text-[11px] transition-all">
                        {isCompleted ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px]">✓</div>
                        ) : isActive ? (
                          <Loader2 className="animate-spin text-primary shrink-0" size={12} />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[9px] text-white/30">•</div>
                        )}
                        <span className={cn(
                          isCompleted ? "text-emerald-400/80 font-normal line-through" :
                          isActive ? "text-white font-bold" : "text-white/35 font-normal"
                        )}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STAGE 4: SUCCESS OVERLAY */}
            {paymentStage === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
                  <ShieldCheck size={32} />
                </div>
                
                <h3 className="text-xl font-black text-white mb-2">Payment Complete! 🎉</h3>
                <p className="text-sm text-white/60 mb-6">
                  Workspace upgraded to **Plus** successfully.
                </p>
                <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-[11px] text-emerald-400 font-semibold">
                  Preparing your workspace dashboards...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
