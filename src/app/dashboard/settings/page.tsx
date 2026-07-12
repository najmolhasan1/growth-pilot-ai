'use client';

import { useState, useEffect } from 'react';
import { User, Image, Save, CheckCircle2, AlertCircle, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

const AVATAR_PRESETS = [
  { name: 'Felix (Tech Pro)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Sara (Designer)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sara' },
  { name: 'Jack (Marketing)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { name: 'Oliver (Developer)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver' },
  { name: 'Aneka (Analyst)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
  { name: 'Toby (Executive)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Toby' },
  { name: 'Buster (Creator)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster' },
  { name: 'Milo (Mascot)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
];

export default function ProfileSettings() {
  const [name, setName] = useState('NAJMOL HASAN');
  const [username, setUsername] = useState('najmolhasan');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setInitialized(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata;
        if (meta?.full_name || meta?.name) {
          setName(meta.full_name || meta.name);
        }
        if (meta?.username) {
          setUsername(meta.username);
        }
        if (meta?.avatar_url) {
          setAvatarUrl(meta.avatar_url);
          // If the avatar is not in the presets list, it is a custom url
          const isPreset = AVATAR_PRESETS.some(p => p.url === meta.avatar_url);
          if (!isPreset) {
            setCustomAvatarUrl(meta.avatar_url);
          }
        }
      }
      setInitialized(false);
      // Wait for a small layout shift delay to avoid flashing loading text
      setTimeout(() => setInitialized(true), 200);
    });
  }, []);

  const getInitials = (fullName: string) => {
    return fullName
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NH';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setStatus('idle');

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      setStatus('error');
      setSaving(false);
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername) {
      setErrorMessage('Username is required.');
      setStatus('error');
      setSaving(false);
      return;
    }

    const finalAvatar = customAvatarUrl.trim() || avatarUrl;

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: name.trim(),
            username: cleanUsername,
            avatar_url: finalAvatar
          }
        });

        if (error) throw error;
      }
      
      setStatus('saved');
      setTimeout(() => {
        setStatus('idle');
        window.location.reload();
      }, 1000);
      
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile. Please try again.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-blue-400" size={32} />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Loading Profile Details</p>
        </div>
      </div>
    );
  }

  const currentDisplayAvatar = customAvatarUrl.trim() || avatarUrl;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Profile Settings</h1>
            <p className="text-sm text-white/40 mt-1">Manage your identity and profile card visuals</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          
          {/* Form and Avatar grid (Left) */}
          <div className="lg:col-span-3 space-y-6">
            <form onSubmit={handleSave} className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 lg:p-8 space-y-6">
              
              <div className="space-y-4">
                {/* Full Name input */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Username input */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                    Username Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/30">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="username"
                      required
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Avatar Preset Grid selector */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3">
                    Choose Avatar Preset
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url && !customAvatarUrl;
                      return (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setCustomAvatarUrl('');
                          }}
                          className={`relative aspect-square rounded-2xl bg-black/40 border-2 overflow-hidden flex items-center justify-center transition-all p-1 cursor-pointer hover:border-primary/50 ${
                            isSelected ? 'border-primary shadow-lg shadow-primary/20 scale-[1.03]' : 'border-white/5'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                          {isSelected && (
                            <div className="absolute right-1 top-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle2 size={8} fill="currentColor" className="text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Avatar URL */}
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                    Custom Avatar Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/your-avatar.jpg"
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <p className="text-[9px] text-white/30 mt-1 ml-1">
                    Or paste a link to any public image URL (PNG, JPG, or SVG).
                  </p>
                </div>
              </div>

              {/* Status errors feedback */}
              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 flex items-center gap-2.5 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{errorMessage || 'An error occurred.'}</span>
                </div>
              )}

              {status === 'saved' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3.5 flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="font-semibold">Profile updated successfully! Refreshing...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  status === 'saved' ? 'bg-emerald-500 text-white' :
                  saving ? 'bg-primary/50 text-white/60 cursor-not-allowed' :
                  'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                <span>{saving ? 'Saving changes...' : 'Save Profile Details'}</span>
              </button>

            </form>
          </div>

          {/* Profile Card Mockup Live Preview (Right) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest block pl-2">Profile Card Preview</h3>
            
            <div className="bg-[#0b0f1a]/85 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5">
              <div className="absolute right-4 top-4 bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Preview
              </div>

              {/* Avatar and Info grid */}
              <div className="flex items-center gap-4">
                {currentDisplayAvatar ? (
                  <img src={currentDisplayAvatar} alt="Preview Avatar" className="w-12 h-12 rounded-full object-cover shadow-md border border-white/10 select-none bg-black/35" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-md select-none">
                    {getInitials(name)}
                  </div>
                )}
                <div className="min-w-0 flex flex-col">
                  <span className="text-base font-black text-white truncate">{name || 'NAJMOL HASAN'}</span>
                  <span className="text-[11px] text-white/40 font-semibold truncate mt-0.5">@{username || 'username'}</span>
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Card visual status stats */}
              <div className="grid grid-cols-2 gap-2 text-center select-none">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-white/35 uppercase tracking-wider">Plan Status</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-primary">
                    <Sparkles size={10} />
                    <span className="text-xs font-bold text-white">Trial Account</span>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-white/35 uppercase tracking-wider">Active Workspace</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-emerald-400">
                    <UserCheck size={10} />
                    <span className="text-xs font-bold text-white">Personal</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-[10px] text-blue-400/90 leading-relaxed">
                ✏️ This card displays in your sidebar footer. Save edits to make them public across your dashboard sessions.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
