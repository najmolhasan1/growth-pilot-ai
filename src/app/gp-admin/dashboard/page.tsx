'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Sliders, Activity, TrendingUp, Search, RefreshCw,
  Edit3, Trash2, Loader2, LogOut, ShieldCheck, Zap, Check,
  X, AlertCircle, CheckCircle2, UserPlus, Crown,
  Clock, BarChart3, Settings2, Globe, FileText, MessageSquare,
  ChevronRight, Menu, LayoutDashboard,
  Bell, HelpCircle, ExternalLink, Shield, Cpu,
} from 'lucide-react';

type TabKey = 'overview' | 'users' | 'limits' | 'activity';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  plan: string;
  role: string;
  created_at: string;
  last_sign_in?: string;
  stats: { words: number; keywords: number; marketing: number };
}

interface SystemConfig {
  trial_seo_word_limit: number;
  trial_keyword_limit: number;
  trial_marketing_limit: number;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  time: string;
  type: 'plan' | 'role' | 'limits' | 'delete' | 'create';
}

// ─── Sidebar nav config ────────────────────────────────────────────────────────
const NAV_ITEMS: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'overview',  label: 'Overview',        icon: <LayoutDashboard size={16} /> },
  { key: 'users',     label: 'User Management', icon: <Users size={16} /> },
  { key: 'limits',    label: 'System Limits',   icon: <Sliders size={16} /> },
  { key: 'activity',  label: 'Activity Log',    icon: <Activity size={16} /> },
];

const QUICK_LINKS = [
  { label: 'Visit Workspace',  href: '/dashboard',         icon: <ExternalLink size={13} /> },
  { label: 'Auth Settings',    href: '#',                  icon: <Shield size={13} /> },
  { label: 'System Health',    href: '#',                  icon: <Cpu size={13} /> },
  { label: 'Notifications',    href: '#',                  icon: <Bell size={13} /> },
  { label: 'Help & Docs',      href: '#',                  icon: <HelpCircle size={13} /> },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]       = useState(true);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [isMock, setIsMock]         = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    trial_seo_word_limit: 5000,
    trial_keyword_limit: 3,
    trial_marketing_limit: 3,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved,  setConfigSaved]  = useState(false);
  const [configError,  setConfigError]  = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter,  setPlanFilter]  = useState('all');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isAddOpen,   setIsAddOpen]   = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState('');

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    { id: '1', action: 'Admin panel accessed', target: 'System', time: 'Just now', type: 'plan' },
  ]);

  // ── data fetchers ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) { router.replace('/gp-admin'); return; }
      const data = await res.json();
      if (data.success) { setUsers(data.users); setIsMock(data.isMock); }
    } catch { /* ignore */ }
  }, [router]);

  const fetchConfig = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig({
          trial_seo_word_limit:  Number(data.config.trial_seo_word_limit)  || 5000,
          trial_keyword_limit:   Number(data.config.trial_keyword_limit)   || 3,
          trial_marketing_limit: Number(data.config.trial_marketing_limit) || 3,
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/admin/verify')
      .then(r => r.json())
      .then(d => {
        if (!d.valid) { router.replace('/gp-admin'); return; }
        return Promise.all([fetchUsers(), fetchConfig()]);
      })
      .catch(() => router.replace('/gp-admin'))
      .finally(() => setLoading(false));
  }, [fetchUsers, fetchConfig, router]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const addLog = (action: string, target: string, type: ActivityLog['type']) => {
    setActivityLog(prev => [{
      id: Date.now().toString(), action, target, type,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev.slice(0, 49)]);
  };

  const showUserMsg = (msg: string) => {
    setUserActionMsg(msg);
    setTimeout(() => setUserActionMsg(''), 3500);
  };

  // ── user actions ─────────────────────────────────────────────────────────────
  const handleTogglePlan = async (user: AdminUser) => {
    const newPlan = user.plan === 'Plus' ? 'Trial' : 'Plus';
    setActionLoading(user.id + '_plan');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: newPlan, role: user.role }),
      });
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: newPlan } : u));
        addLog(`Plan changed: ${user.plan} → ${newPlan}`, user.email, 'plan');
        showUserMsg(`✅ ${user.full_name} plan updated to ${newPlan}`);
      } else { showUserMsg(`❌ Failed: ${d.error}`); }
    } catch { showUserMsg('❌ Connection error'); }
    finally { setActionLoading(null); }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoading(user.id + '_role');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: user.plan, role: newRole }),
      });
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        addLog(`Role changed: ${user.role} → ${newRole}`, user.email, 'role');
        showUserMsg(`✅ ${user.full_name} is now ${newRole}`);
      }
    } catch { } finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;
    setActionLoading(user.id + '_del');
    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        addLog('User deleted', user.email, 'delete');
        showUserMsg(`🗑️ ${user.full_name} removed`);
      }
    } catch { } finally { setActionLoading(null); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading('edit');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
        addLog('User profile updated', editingUser.email, 'create');
        showUserMsg(`✅ ${editingUser.full_name} updated`);
        setEditingUser(null);
      }
    } catch { } finally { setActionLoading(null); }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true); setConfigError('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (d.success) {
        setConfigSaved(true);
        addLog(`Limits: SEO=${config.trial_seo_word_limit}, KW=${config.trial_keyword_limit}, Mktg=${config.trial_marketing_limit}`, 'System Config', 'limits');
        setTimeout(() => setConfigSaved(false), 3000);
      } else { setConfigError(d.error || 'Failed to save'); }
    } catch { setConfigError('Connection error'); }
    finally { setConfigSaving(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.replace('/gp-admin');
  };

  // ── derived stats ─────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) &&
      (planFilter === 'all' || u.plan.toLowerCase().includes(planFilter.toLowerCase())) &&
      (roleFilter === 'all' || u.role === roleFilter)
    );
  });

  const plusCount  = users.filter(u => u.plan === 'Plus').length;
  const trialCount = users.filter(u => u.plan === 'Trial').length;
  const totalWords = users.reduce((s, u) => s + (u.stats?.words || 0), 0);
  const totalKw    = users.reduce((s, u) => s + (u.stats?.keywords || 0), 0);
  const totalMktg  = users.reduce((s, u) => s + (u.stats?.marketing || 0), 0);

  // ── loading screen ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-400 mx-auto mb-3" size={32} />
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  LEFT SIDEBAR                                            ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-60' : 'w-16'}
          bg-[#07090f] border-r border-white/[0.06]
        `}
      >
        {/* Sidebar header */}
        <div className={`h-14 flex items-center border-b border-white/[0.06] shrink-0 ${sidebarOpen ? 'px-4 gap-3' : 'justify-center px-0'}`}>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/40 shrink-0">
            <Zap className="text-white" fill="white" size={14} />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white tracking-tight leading-none">GrowthPilot</p>
              <p className="text-[8px] font-bold text-red-400/70 uppercase tracking-widest mt-0.5">Admin Console</p>
            </div>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6">

          {/* Main nav */}
          <nav className="px-2 space-y-0.5">
            {sidebarOpen && (
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.18em] px-3 pb-2">Navigation</p>
            )}
            {NAV_ITEMS.map(item => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 rounded-xl transition-all cursor-pointer group relative
                    ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-3'}
                    ${active
                      ? 'bg-indigo-600/15 text-indigo-400'
                      : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                    }
                  `}
                >
                  {/* active bar */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full" />
                  )}
                  <span className={`shrink-0 ${active ? 'text-indigo-400' : ''}`}>{item.icon}</span>
                  {sidebarOpen && (
                    <span className="text-xs font-bold truncate">{item.label}</span>
                  )}
                  {sidebarOpen && item.badge && (
                    <span className="ml-auto text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-4 border-t border-white/[0.05]" />

          {/* Quick links */}
          <nav className="px-2 space-y-0.5">
            {sidebarOpen && (
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.18em] px-3 pb-2">Quick Links</p>
            )}
            {QUICK_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                title={!sidebarOpen ? link.label : undefined}
                className={`
                  flex items-center gap-3 rounded-xl text-white/35 hover:bg-white/[0.04] hover:text-white/60 transition-all group relative
                  ${sidebarOpen ? 'px-3 py-2' : 'justify-center px-0 py-2.5'}
                `}
              >
                <span className="shrink-0">{link.icon}</span>
                {sidebarOpen && <span className="text-xs font-semibold truncate">{link.label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {link.label}
                  </div>
                )}
              </a>
            ))}
          </nav>

          {/* System status widget */}
          {sidebarOpen && (
            <div className="mx-3">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 space-y-2.5">
                <p className="text-[8px] font-black text-white/25 uppercase tracking-widest">System Status</p>
                {[
                  { label: 'API',      dot: 'bg-emerald-400', status: 'Operational' },
                  { label: 'Database', dot: 'bg-emerald-400', status: 'Connected' },
                  { label: 'Auth',     dot: isMock ? 'bg-amber-400' : 'bg-emerald-400', status: isMock ? 'Mock mode' : 'Live' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-white/35">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-sm`} />
                      <span className="text-[9px] font-bold text-white/50">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar footer — logout */}
        <div className={`shrink-0 border-t border-white/[0.06] p-3 space-y-1`}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : undefined}
            className={`
              w-full flex items-center gap-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer group relative
              ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center py-3'}
            `}
          >
            <LogOut size={15} className="shrink-0" />
            {sidebarOpen && <span className="text-xs font-bold">Logout</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  MAIN CONTENT AREA                                       ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#020617]/90 backdrop-blur-xl h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-lg border border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
              title="Toggle sidebar"
            >
              <Menu size={15} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-white/30">
              <ShieldCheck size={12} className="text-red-400/70" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400/70">gp-admin</span>
              <ChevronRight size={12} />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                {NAV_ITEMS.find(n => n.key === activeTab)?.label}
              </span>
            </div>

            {isMock && (
              <span className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded-full">
                Mock Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => Promise.all([fetchUsers(), fetchConfig()])}
              className="p-2 rounded-lg border border-white/[0.06] text-white/35 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw size={14} />
            </button>

            {/* Admin badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/8 border border-red-500/15 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <ShieldCheck size={11} className="text-red-400" />
              </div>
              <span className="text-[10px] font-black text-red-400/80 uppercase tracking-wider hidden sm:block">
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-6 lg:px-8 py-8 space-y-8">

          {/* Page title */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-white">
                {NAV_ITEMS.find(n => n.key === activeTab)?.label}
              </h1>
              <p className="text-xs text-white/35 mt-1">
                {activeTab === 'overview'  && 'Platform analytics and key metrics at a glance'}
                {activeTab === 'users'     && 'Manage user accounts, plans, and permissions'}
                {activeTab === 'limits'    && 'Configure global trial limits synced to all users instantly'}
                {activeTab === 'activity'  && 'Audit trail of all admin actions this session'}
              </p>
            </div>

            {/* Contextual action button */}
            {activeTab === 'users' && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <UserPlus size={14} />
                <span>Add User</span>
              </button>
            )}
          </div>

          {/* ── FLASH MESSAGE ─────────────────────────────────────────────────── */}
          {userActionMsg && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#0d1117] border border-white/10 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl">
              {userActionMsg}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: OVERVIEW
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users',      value: users.length,              sub: `${plusCount} Plus · ${trialCount} Trial`,                                      accent: 'from-indigo-500/10 to-indigo-500/0',  dot: 'bg-indigo-400' },
                  { label: 'Words Generated',  value: totalWords.toLocaleString(), sub: `Avg ${Math.round(totalWords / Math.max(1, users.length)).toLocaleString()} / user`, accent: 'from-blue-500/10 to-blue-500/0',      dot: 'bg-blue-400' },
                  { label: 'Keyword Reports',  value: totalKw,                   sub: `Across ${users.length} accounts`,                                              accent: 'from-emerald-500/10 to-emerald-500/0', dot: 'bg-emerald-400' },
                  { label: 'Marketing Assets', value: totalMktg,                 sub: `Avg ${(totalMktg / Math.max(1, users.length)).toFixed(1)} / user`,             accent: 'from-violet-500/10 to-violet-500/0',  dot: 'bg-violet-400' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-gradient-to-b ${stat.accent} border border-white/[0.06] rounded-2xl p-5 space-y-2 relative overflow-hidden`}>
                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${stat.dot}`} />
                    <p className="text-[9px] font-black text-white/35 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] font-semibold text-white/40">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Trend chart */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">Word Generation Trend</span>
                    </div>
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Last 7 Days</span>
                  </div>
                  <svg viewBox="0 0 500 140" className="w-full">
                    <defs>
                      <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[30, 75, 120].map(y => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
                    <path d="M0,140 L0,110 Q60,95 80,90 T160,100 T240,55 T320,70 T400,40 T480,28 L500,28 L500,140 Z" fill="url(#aGrad)" />
                    <path d="M0,110 Q60,95 80,90 T160,100 T240,55 T320,70 T400,40 T480,28 H500" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {[[80,90],[240,55],[400,40],[480,28]].map(([cx,cy]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="3.5" fill="white" stroke="#6366f1" strokeWidth="2" />)}
                    <text x="0"   y="135" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="inherit">Mon</text>
                    <text x="155" y="135" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="inherit">Thu</text>
                    <text x="460" y="135" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="inherit">Today</text>
                  </svg>
                </div>

                {/* Plan distribution */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Plan Distribution</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Plus',        count: plusCount,                                    color: 'bg-emerald-500' },
                      { label: 'Trial',       count: trialCount,                                   color: 'bg-indigo-500' },
                      { label: 'Ended',       count: users.length - plusCount - trialCount,         color: 'bg-red-500' },
                    ].map(item => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold text-white/50">
                          <span>{item.label}</span>
                          <span className="text-white">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.round((item.count / Math.max(1, users.length)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-white/[0.05] space-y-2">
                    {[
                      { label: 'Word Limit',    value: config.trial_seo_word_limit.toLocaleString(), icon: <FileText size={11} className="text-indigo-400" /> },
                      { label: 'Keyword Limit', value: `${config.trial_keyword_limit} searches`,     icon: <Globe size={11} className="text-emerald-400" /> },
                      { label: 'Mktg Limit',    value: `${config.trial_marketing_limit} assets`,     icon: <MessageSquare size={11} className="text-violet-400" /> },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-white/40 font-semibold">{item.icon}<span>{item.label}</span></div>
                        <span className="font-black text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: USERS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="text" placeholder="Search users..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 font-semibold"
                  />
                </div>
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold cursor-pointer">
                  <option value="all">All Plans</option>
                  <option value="Plus">Plus</option>
                  <option value="Trial">Trial</option>
                  <option value="ended">Ended</option>
                </select>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold cursor-pointer">
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Table */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[9px] font-black text-white/25 uppercase tracking-[0.14em]">
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5">Joined</th>
                        <th className="px-5 py-3.5">Usage</th>
                        <th className="px-5 py-3.5 text-center">Plan</th>
                        <th className="px-5 py-3.5 text-center">Role</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="px-5 py-12 text-center text-white/20 text-xs font-bold uppercase tracking-widest">No users found</td></tr>
                      ) : filteredUsers.map(user => {
                        const isPlus   = user.plan === 'Plus';
                        const isAdmin  = user.role === 'admin';
                        const joined   = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const initials = user.full_name.trim().split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase();
                        return (
                          <tr key={user.id} className="hover:bg-white/[0.015] transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0">{initials}</div>
                                <div>
                                  <div className="text-xs font-black text-white">{user.full_name}</div>
                                  <div className="text-[10px] text-white/30 mt-0.5">@{user.username} · {user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[10px] text-white/35 font-mono whitespace-nowrap">{joined}</td>
                            <td className="px-5 py-3.5 text-[10px] text-white/45 space-y-0.5">
                              <div>SEO <span className="text-white font-bold">{(user.stats?.words||0).toLocaleString()}</span>w</div>
                              <div>KW <span className="text-white font-bold">{user.stats?.keywords||0}</span> · Mktg <span className="text-white font-bold">{user.stats?.marketing||0}</span></div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button onClick={() => handleTogglePlan(user)} disabled={actionLoading === user.id+'_plan'} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border disabled:opacity-40 ${isPlus?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20':user.plan==='Trial ended'?'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20':'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'}`}>
                                {actionLoading===user.id+'_plan'?'...':user.plan}
                              </button>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button onClick={() => handleToggleRole(user)} disabled={actionLoading===user.id+'_role'} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border disabled:opacity-40 ${isAdmin?'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20':'bg-white/5 border-white/10 text-white/45 hover:bg-white/10'}`}>
                                {actionLoading===user.id+'_role'?'...':user.role}
                              </button>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setEditingUser({...user})} className="p-1.5 rounded-lg border border-white/5 text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer" title="Edit"><Edit3 size={12} /></button>
                                <button onClick={() => handleDeleteUser(user)} disabled={actionLoading===user.id+'_del'} className="p-1.5 rounded-lg border border-red-500/10 text-red-500/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-30" title="Delete">
                                  {actionLoading===user.id+'_del'?<Loader2 size={12} className="animate-spin"/>:<Trash2 size={12}/>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    {filteredUsers.length} of {users.length} users {isMock && '(mock)'}
                  </span>
                  <button onClick={() => fetchUsers()} className="text-[9px] font-bold text-indigo-400/50 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors">
                    <RefreshCw size={10} /> Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: LIMITS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'limits' && (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <form onSubmit={handleSaveConfig} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 space-y-6">
                  <div className="flex items-center gap-2">
                    <Settings2 size={15} className="text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Trial Limits Configuration</span>
                  </div>
                  <p className="text-[10px] text-white/35 leading-relaxed">Changes sync globally to the Supabase database — all trial users see new limits on their next page load.</p>
                  <hr className="border-white/[0.05]" />
                  {[
                    { label: 'SEO Article Word Limit',      key: 'trial_seo_word_limit'  as const, unit: 'words',   min: 500,  max: 500000 },
                    { label: 'Keyword Research Searches',   key: 'trial_keyword_limit'   as const, unit: 'searches', min: 1,    max: 1000 },
                    { label: 'Marketing Asset Runs',        key: 'trial_marketing_limit' as const, unit: 'assets',  min: 1,    max: 1000 },
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">{field.label}</label>
                      <div className="relative">
                        <input
                          type="number" min={field.min} max={field.max} required
                          value={config[field.key]}
                          onChange={e => setConfig(prev => ({ ...prev, [field.key]: parseInt(e.target.value)||0 }))}
                          className="w-full bg-[#0a0e1a] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/40 font-semibold pr-20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/25 uppercase">{field.unit}</span>
                      </div>
                    </div>
                  ))}
                  {configError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2"><AlertCircle size={13} className="text-red-400 shrink-0" /><span className="text-xs font-semibold text-red-400">{configError}</span></div>}
                  {configSaved && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-400 shrink-0" /><span className="text-xs font-semibold text-emerald-400">Limits saved and synced globally!</span></div>}
                  <button type="submit" disabled={configSaving} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20">
                    {configSaving ? <><Loader2 size={15} className="animate-spin" /> Saving & Syncing...</> : <><Check size={15} /> Save & Sync to All Users</>}
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block">How Sync Works</span>
                  {[
                    { step:'1', title:'Admin saves limits',    desc:'Written to Supabase system_config via service role key' },
                    { step:'2', title:'Global propagation',    desc:'All workspace pages fetch config on load' },
                    { step:'3', title:'Instant enforcement',   desc:'Trial users hit new limits on next attempt' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{s.step}</div>
                      <div>
                        <p className="text-xs font-bold text-white">{s.title}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[10px] text-amber-400/70 leading-relaxed">
                    ⚠️ Requires <code className="bg-amber-400/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="bg-amber-400/10 px-1 rounded">.env.local</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: ACTIVITY
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Session Activity Log</span>
                </div>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{activityLog.length} events</span>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
                {activityLog.map(log => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${log.type==='plan'?'bg-indigo-400':log.type==='role'?'bg-red-400':log.type==='limits'?'bg-emerald-400':log.type==='delete'?'bg-red-500':'bg-blue-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white/75 truncate">{log.action}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{log.target}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-white/20 shrink-0">
                      <Clock size={10} /><span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          EDIT USER MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d111d] border border-white/10 rounded-3xl p-7 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-black text-white">Edit User</span>
              <button onClick={() => setEditingUser(null)} className="text-white/40 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {[
                { label:'Full Name', key:'full_name', type:'text',  placeholder:'Full name' },
                { label:'Username',  key:'username',  type:'text',  placeholder:'username' },
                { label:'Email',     key:'email',     type:'email', placeholder:'email@example.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[9px] font-bold text-white/35 uppercase tracking-widest block mb-1">{f.label}</label>
                  <input type={f.type} value={(editingUser as any)[f.key]} onChange={e => setEditingUser(prev => prev ? { ...prev, [f.key]: e.target.value } : null)} placeholder={f.placeholder} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/40 font-semibold" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Plan', key:'plan', options:['Trial','Plus','Trial ended'] },
                  { label:'Role', key:'role', options:['user','admin'] },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[9px] font-bold text-white/35 uppercase tracking-widest block mb-1">{f.label}</label>
                    <select value={(editingUser as any)[f.key]} onChange={e => setEditingUser(prev => prev ? { ...prev, [f.key]: e.target.value } : null)} className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-semibold">
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button type="submit" disabled={actionLoading==='edit'} className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                {actionLoading==='edit' ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
