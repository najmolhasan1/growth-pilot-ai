'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Sliders, 
  Search, 
  Activity, 
  TrendingUp, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Sparkles, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  AlertCircle, 
  Database, 
  UserPlus, 
  ShieldCheck, 
  Zap, 
  Key, 
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

// High-fidelity fallback users to populate local storage if not initialized
const DEFAULT_MOCK_USERS = [
  {
    id: 'u-1',
    email: 'najmol@growthpilot.com',
    full_name: 'NAJMOL HASAN',
    username: 'najmolhasan',
    plan: 'Plus',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 12500, keywords: 15, marketing: 12 }
  },
  {
    id: 'u-2',
    email: 'sarah.c@design.co',
    full_name: 'Sarah Connor',
    username: 'sarah_designer',
    plan: 'Trial',
    role: 'user',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 3200, keywords: 2, marketing: 1 }
  },
  {
    id: 'u-3',
    email: 'john.doe@gmail.com',
    full_name: 'John Doe',
    username: 'johndoe',
    plan: 'Trial ended',
    role: 'user',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 5000, keywords: 3, marketing: 3 }
  },
  {
    id: 'u-4',
    email: 'alice.smith@growth.io',
    full_name: 'Alice Smith',
    username: 'alicesmith',
    plan: 'Plus',
    role: 'user',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 24300, keywords: 28, marketing: 19 }
  },
  {
    id: 'u-5',
    email: 'bob.johnson@partner.com',
    full_name: 'Bob Johnson',
    username: 'bobjohnson',
    plan: 'Trial',
    role: 'user',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    stats: { words: 800, keywords: 1, marketing: 0 }
  }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'limits'>('overview');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSandboxBypassed, setIsSandboxBypassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isMockMode, setIsMockMode] = useState(true);

  // Limit States
  const [seoWordLimit, setSeoWordLimit] = useState(5000);
  const [keywordLimit, setKeywordLimit] = useState(3);
  const [marketingLimit, setMarketingLimit] = useState(3);
  const [limitsSaved, setLimitsSaved] = useState(false);

  // Modals / Edit states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    full_name: '',
    username: '',
    plan: 'Trial',
    role: 'user'
  });

  // Load config & credentials
  useEffect(() => {
    // 1. Check sandbox override
    const sandboxState = localStorage.getItem('sandbox_admin_bypass') === 'true';
    setIsSandboxBypassed(sandboxState);

    // 2. Load trial limits
    const storedSeo = localStorage.getItem('trial_seo_word_limit');
    const storedKeyword = localStorage.getItem('trial_keyword_limit');
    const storedMarketing = localStorage.getItem('trial_marketing_limit');
    if (storedSeo) setSeoWordLimit(parseInt(storedSeo, 10));
    if (storedKeyword) setKeywordLimit(parseInt(storedKeyword, 10));
    if (storedMarketing) setMarketingLimit(parseInt(storedMarketing, 10));

    // 3. Load users database from localStorage or API
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem('mock_users_db');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        localStorage.setItem('mock_users_db', JSON.stringify(DEFAULT_MOCK_USERS));
        setUsers(DEFAULT_MOCK_USERS);
      }
    }

    // 4. Fetch Supabase session details
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          const user = data.session.user;
          setCurrentUser(user);
          const userRole = user.user_metadata?.role;
          if (userRole === 'admin' || sandboxState) {
            setIsAdmin(true);
          }
        } else if (sandboxState) {
          setIsAdmin(true);
        }
        setLoading(false);
      });
    } else {
      if (sandboxState) {
        setIsAdmin(true);
      }
      setLoading(false);
    }
  }, []);

  // Fetch actual or mock user profiles from API
  const refreshUsersList = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setIsMockMode(data.isMock);
        if (data.isMock) {
          // Sync from local storage
          const stored = localStorage.getItem('mock_users_db');
          if (stored) {
            setUsers(JSON.parse(stored));
          } else {
            setUsers(data.users);
          }
        } else {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.warn('API error fetching admin users:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refreshUsersList();
    }
  }, [isAdmin]);

  // Sync users back to localStorage when changed (if in mock mode)
  const saveUsersList = (updatedUsers: any[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('mock_users_db', JSON.stringify(updatedUsers));
  };

  const handleToggleSandbox = () => {
    const nextState = !isSandboxBypassed;
    setIsSandboxBypassed(nextState);
    if (nextState) {
      localStorage.setItem('sandbox_admin_bypass', 'true');
      setIsAdmin(true);
    } else {
      localStorage.removeItem('sandbox_admin_bypass');
      // If supabase is configured, recheck real role
      if (isSupabaseConfigured() && currentUser) {
        setIsAdmin(currentUser.user_metadata?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    }
    window.location.reload();
  };

  // User Actions (Create, Update, Delete)
  const handleTogglePlan = async (user: any) => {
    const newPlan = user.plan === 'Plus' ? 'Trial' : 'Plus';
    if (isMockMode) {
      const updated = users.map(u => u.id === user.id ? { ...u, plan: newPlan } : u);
      saveUsersList(updated);
    } else {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, plan: newPlan, role: user.role })
        });
        const d = await res.json();
        if (d.success && !d.isMock) {
          refreshUsersList();
        } else {
          // If updates failed or were mock-level updates
          const updated = users.map(u => u.id === user.id ? { ...u, plan: newPlan } : u);
          saveUsersList(updated);
        }
      } catch {
        const updated = users.map(u => u.id === user.id ? { ...u, plan: newPlan } : u);
        saveUsersList(updated);
      }
    }
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (isMockMode) {
      const updated = users.map(u => u.id === user.id ? { ...u, role: newRole } : u);
      saveUsersList(updated);
    } else {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, plan: user.plan, role: newRole })
        });
        const d = await res.json();
        if (d.success && !d.isMock) {
          refreshUsersList();
        } else {
          const updated = users.map(u => u.id === user.id ? { ...u, role: newRole } : u);
          saveUsersList(updated);
        }
      } catch {
        const updated = users.map(u => u.id === user.id ? { ...u, role: newRole } : u);
        saveUsersList(updated);
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'u-' + Math.random().toString(36).substr(2, 9);
    const createdUser = {
      id: newId,
      email: newUserForm.email.trim(),
      full_name: newUserForm.full_name.trim(),
      username: newUserForm.username.trim().toLowerCase(),
      plan: newUserForm.plan,
      role: newUserForm.role,
      created_at: new Date().toISOString(),
      stats: { words: 0, keywords: 0, marketing: 0 }
    };

    saveUsersList([createdUser, ...users]);
    setIsAddModalOpen(false);
    setNewUserForm({
      email: '',
      full_name: '',
      username: '',
      plan: 'Trial',
      role: 'user'
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map(u => u.id === editingUser.id ? editingUser : u);
    saveUsersList(updated);
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== userId);
      saveUsersList(updated);
    }
  };

  const handleResetStats = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, stats: { words: 0, keywords: 0, marketing: 0 } } : u);
    saveUsersList(updated);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('trial_seo_word_limit', seoWordLimit.toString());
    localStorage.setItem('trial_keyword_limit', keywordLimit.toString());
    localStorage.setItem('trial_marketing_limit', marketingLimit.toString());
    
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 3000);
  };

  // Filters logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = 
      planFilter === 'all' || 
      (planFilter === 'Plus' && user.plan === 'Plus') ||
      (planFilter === 'Trial' && (user.plan === 'Trial' || user.plan === 'Free Trial')) ||
      (planFilter === 'Ended' && user.plan === 'Trial ended');

    const matchesRole = 
      roleFilter === 'all' || 
      (roleFilter === 'admin' && user.role === 'admin') ||
      (roleFilter === 'user' && user.role === 'user');

    return matchesSearch && matchesPlan && matchesRole;
  });

  // Statistics summaries
  const totalUsers = users.length;
  const plusUsers = users.filter(u => u.plan === 'Plus').length;
  const activeTrialUsers = users.filter(u => u.plan === 'Trial' || u.plan === 'Free Trial').length;
  const totalWordsGenerated = users.reduce((sum, u) => sum + (u.stats?.words || 0), 0);
  const totalKeywordReports = users.reduce((sum, u) => sum + (u.stats?.keywords || 0), 0);
  const totalMarketingAssets = users.reduce((sum, u) => sum + (u.stats?.marketing || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 animate-spin text-primary" size={32} />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Loading Admin Dashboard</p>
        </div>
      </div>
    );
  }

  // Access Denied Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#0b0f19]/80 border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center backdrop-blur-xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
          
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>

          <h2 className="text-xl font-black text-white">Access Denied</h2>
          <p className="text-xs text-white/50 leading-relaxed mt-2.5 px-4">
            The resource you are attempting to access requires administrator privileges.
          </p>

          <hr className="border-white/5 my-6" />

          {/* Sandbox Toggle Mode */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
              <Key size={12} />
              <span>Developer Sandbox Bypass</span>
            </div>
            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
              Enable the simulation mode to bypass authentication restrictions and examine administrative layout options in this preview environment.
            </p>
            <button
              type="button"
              onClick={handleToggleSandbox}
              className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs bg-red-500 hover:bg-red-500/90 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all"
            >
              <Unlock size={14} />
              <span>Enable Sandbox Bypass</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title & Sandbox Bypass Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-lg shadow-red-500/5">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                GrowthPilot Admin
              </h1>
              <p className="text-sm text-white/40 mt-1">Configure workspace limits, monitor users, and inspect API stats</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSandboxBypassed && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Database size={10} />
                <span>Sandbox Bypass Active</span>
              </div>
            )}
            
            <button
              onClick={handleToggleSandbox}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Lock size={12} />
              <span>Disable Sandbox</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tabs list selectors */}
        <div className="flex border-b border-white/5 gap-6 select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'text-primary' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors ${
              activeTab === 'users' ? 'text-primary' : 'text-white/40 hover:text-white/60'
            }`}
          >
            User Access Manager
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest relative cursor-pointer transition-colors ${
              activeTab === 'limits' ? 'text-primary' : 'text-white/40 hover:text-white/60'
            }`}
          >
            System Limits
            {activeTab === 'limits' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Tab content conditional rendering */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col gap-1.5 shadow-xl">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Accounts</span>
                <span className="text-3xl font-black text-white mt-1">{totalUsers}</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-2 leading-none">
                  {plusUsers} Premium Plus • {activeTrialUsers} Trial
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col gap-1.5 shadow-xl">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">SEO Words Generated</span>
                <span className="text-3xl font-black text-white mt-1">{totalWordsGenerated.toLocaleString()}</span>
                <span className="text-[10px] text-white/40 font-semibold flex items-center gap-0.5 mt-2 leading-none">
                  Avg. {(totalWordsGenerated / Math.max(1, totalUsers)).toFixed(0)} words / user
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col gap-1.5 shadow-xl">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Keyword Planners</span>
                <span className="text-3xl font-black text-white mt-1">{totalKeywordReports}</span>
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5 mt-2 leading-none">
                  Avg. {(totalKeywordReports / Math.max(1, totalUsers)).toFixed(1)} reports / user
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col gap-1.5 shadow-xl">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Marketing runs</span>
                <span className="text-3xl font-black text-white mt-1">{totalMarketingAssets}</span>
                <span className="text-[10px] text-violet-400 font-semibold flex items-center gap-0.5 mt-2 leading-none">
                  Avg. {(totalMarketingAssets / Math.max(1, totalUsers)).toFixed(1)} assets / user
                </span>
              </div>
            </div>

            {/* Graphs / Analytics segment */}
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Daily word count (Line chart) */}
              <div className="lg:col-span-3 bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 lg:p-8 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Daily Activity Volume</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Words Generated (7 Days)</span>
                </div>
                
                {/* SVG Visual line chart */}
                <div className="w-full h-48 mt-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 500 150">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    {/* Area Graph */}
                    <path
                      d="M 0,150 L 0,120 L 80,105 L 160,115 L 240,65 L 320,80 L 400,45 L 480,35 L 500,35 L 500,150 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Trend Line */}
                    <path
                      d="M 0,120 Q 40,112.5 80,105 T 160,115 T 240,65 T 320,80 T 400,45 T 480,35 H 500"
                      fill="none"
                      stroke="rgb(99, 102, 241)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    
                    {/* Value dots */}
                    <circle cx="80" cy="105" r="4" fill="white" stroke="rgb(99, 102, 241)" strokeWidth="2" />
                    <circle cx="240" cy="65" r="4" fill="white" stroke="rgb(99, 102, 241)" strokeWidth="2" />
                    <circle cx="400" cy="45" r="4" fill="white" stroke="rgb(99, 102, 241)" strokeWidth="2" />
                    <circle cx="480" cy="35" r="4" fill="white" stroke="rgb(99, 102, 241)" strokeWidth="2" />
                  </svg>
                  
                  {/* Axis values */}
                  <div className="absolute left-0 bottom-0 right-0 flex justify-between px-1 text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 pt-2 border-t border-white/5">
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                    <span>Mon (Today)</span>
                  </div>
                </div>
              </div>

              {/* Action Usage comparison (Bar chart) */}
              <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 lg:p-8 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-violet-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Features Popularity</span>
                </div>
                
                {/* SVG Visual bar chart */}
                <div className="space-y-4 mt-6">
                  {/* Bar 1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <span>Article Writer</span>
                      <span className="text-white">65% usage</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  {/* Bar 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <span>Keywords Planner</span>
                      <span className="text-white">45% usage</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  {/* Bar 3 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      <span>Marketing Suite</span>
                      <span className="text-white">35% usage</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                </div>

                <hr className="border-white/5 my-2" />
                <div className="text-[10px] text-white/30 leading-relaxed text-center font-semibold uppercase">
                  Data updated just now from active session caches.
                </div>
              </div>
            </div>

            {/* Recent activities stack */}
            <div className="bg-[#0b0f19]/45 border border-white/5 rounded-3xl p-6 lg:p-8 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Recent Administrative Audits</span>
              <div className="divide-y divide-white/5">
                <div className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-semibold">User @najmolhasan updated trial configuration word limit</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/35">2 mins ago</span>
                </div>
                <div className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-semibold">System cached mock user values from local store</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/35">10 mins ago</span>
                </div>
                <div className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-semibold">User @sarah_designer plan status changed to Trial</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/35">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Search, Filter menu & Add Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search query input */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, handle, email..."
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Plan filter */}
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="all">All Plans</option>
                  <option value="Plus">Plus Subscription</option>
                  <option value="Trial">Active Trial</option>
                  <option value="Ended">Trial Ended</option>
                </select>

                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="user">Standard User</option>
                </select>
              </div>

              {/* Add New Mock User */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap self-start md:self-auto"
              >
                <UserPlus size={14} />
                <span>Add Mock User</span>
              </button>

            </div>

            {/* Users Table */}
            <div className="bg-[#0b0f19]/45 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-white/40 uppercase tracking-widest select-none">
                      <th className="px-6 py-4 font-black">User Profile</th>
                      <th className="px-6 py-4 font-black">Join Date</th>
                      <th className="px-6 py-4 font-black">Usage stats</th>
                      <th className="px-6 py-4 font-black text-center">Subscription Plan</th>
                      <th className="px-6 py-4 font-black text-center">Admin Rights</th>
                      <th className="px-6 py-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/30 uppercase tracking-widest font-bold">
                          No matching users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isPlus = user.plan === 'Plus';
                        const isUserAdmin = user.role === 'admin';
                        const joinDate = new Date(user.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                            {/* User details */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase font-black">
                                  {user.full_name.trim().split(' ').map((n:any)=>n[0]).slice(0,2).join('') || 'U'}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white font-black">{user.full_name}</span>
                                  <span className="text-white/40 text-[10px] mt-0.5 font-semibold">@{user.username} • {user.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Join date */}
                            <td className="px-6 py-4 text-white/50 font-mono whitespace-nowrap">
                              {joinDate}
                            </td>

                            {/* Usage stats */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5 text-[10px] text-white/60">
                                <span>SEO: <strong className="text-white font-bold">{user.stats?.words?.toLocaleString() || 0}</strong> words</span>
                                <span>Keywords: <strong className="text-white font-bold">{user.stats?.keywords || 0}</strong> runs</span>
                                <span>Marketing: <strong className="text-white font-bold">{user.stats?.marketing || 0}</strong> assets</span>
                              </div>
                            </td>

                            {/* Plan Toggle */}
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleTogglePlan(user)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                                  isPlus 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                    : user.plan === 'Trial ended'
                                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                                }`}
                              >
                                {user.plan}
                              </button>
                            </td>

                            {/* Role Toggle */}
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleToggleRole(user)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                                  isUserAdmin 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {user.role}
                              </button>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsEditModalOpen(true);
                                  }}
                                  title="Edit Profile Card Details"
                                  className="p-1.5 rounded-lg border border-white/5 text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => handleResetStats(user.id)}
                                  title="Reset Usage Metrics"
                                  className="p-1.5 rounded-lg border border-white/5 text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                >
                                  <RefreshCw size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Delete Account"
                                  disabled={user.id === 'u-1'}
                                  className="p-1.5 rounded-lg border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="grid lg:grid-cols-5 gap-8">
            
            {/* Settings Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSaveLimits} className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
                
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-primary" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Configure Free Trial Restraints</span>
                </div>

                <p className="text-xs text-white/40 leading-relaxed font-semibold">
                  These boundary conditions restrict content writers on the active free trial tier. Plus subscribers are bypassed automatically.
                </p>

                <hr className="border-white/5" />

                <div className="space-y-5">
                  {/* SEO word limit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block pl-1">
                      Trial SEO Word Limit
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="500"
                        max="100000"
                        value={seoWordLimit}
                        onChange={(e) => setSeoWordLimit(parseInt(e.target.value, 10))}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/35 uppercase">words</span>
                    </div>
                  </div>

                  {/* Keywords research count limit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block pl-1">
                      Trial Keywords Search Count
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={keywordLimit}
                        onChange={(e) => setKeywordLimit(parseInt(e.target.value, 10))}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/35 uppercase">searches</span>
                    </div>
                  </div>

                  {/* Marketing runs limit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block pl-1">
                      Trial Marketing Suite Assets
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={marketingLimit}
                        onChange={(e) => setMarketingLimit(parseInt(e.target.value, 10))}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/35 uppercase">assets</span>
                    </div>
                  </div>
                </div>

                {limitsSaved && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3.5 flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span className="font-semibold">Limits saved successfully and applied globally.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/10 hover:scale-[1.01]"
                >
                  <Check size={14} />
                  <span>Apply Limit Adjustments</span>
                </button>

              </form>
            </div>

            {/* Explanation card */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest block pl-2">Scale and Boundary Analysis</h3>
              <div className="bg-[#0b0f1a]/85 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                
                <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                  <Layers size={14} />
                  <span>Adaptive Limit Enforcement</span>
                </div>
                
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Adjusting these numbers dynamically writes properties to global local storage indices, which are queried during active writing operations.
                </p>

                <hr className="border-white/5" />

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">1</div>
                    <p className="text-[10px] text-white/60 leading-normal mt-0.5">
                      SEO generators evaluate total word consumption from browser history indices.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">2</div>
                    <p className="text-[10px] text-white/60 leading-normal mt-0.5">
                      Keyword Planner checks local report tables against configured max searches limit.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">3</div>
                    <p className="text-[10px] text-white/60 leading-normal mt-0.5">
                      Marketing runs look up generated assets and compare with current parameters.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/90 rounded-xl p-3 text-[10px] leading-relaxed">
                  ⚠️ Lowering thresholds below active user counts blocks non-Plus users immediately on the corresponding workspaces.
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d111d] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Add Mock Account</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  placeholder="e.g. NAJMOL HASAN"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Username handle</label>
                <input
                  type="text"
                  required
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="e.g. najmol"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. user@domain.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Plan status</label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Trial">Trial</option>
                    <option value="Plus">Plus</option>
                    <option value="Trial ended">Trial ended</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Administrative Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle size={14} />
                <span>Create User</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d111d] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Edit User Details</span>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }} className="text-white/40 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Username Handle</label>
                <input
                  type="text"
                  required
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="username"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Subscription Plan</label>
                  <select
                    value={editingUser.plan}
                    onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Trial">Trial</option>
                    <option value="Plus">Plus</option>
                    <option value="Trial ended">Trial ended</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Administrative Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check size={14} />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
