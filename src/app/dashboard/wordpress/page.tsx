'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { Settings, Globe, User, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WordPressSettings() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const savedUrl = sessionStorage.getItem('wp_url') || '';
    const savedUser = sessionStorage.getItem('wp_user') || '';
    const savedPass = sessionStorage.getItem('wp_pass') || '';
    setUrl(savedUrl);
    setUsername(savedUser);
    setAppPassword(savedPass);
  }, []);

  const handleSave = () => {
    if (!url || !username || !appPassword) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    sessionStorage.setItem('wp_url', url);
    sessionStorage.setItem('wp_user', username);
    sessionStorage.setItem('wp_pass', appPassword);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-transparent">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
            <Settings className="text-[#FF5533]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">WordPress Integration</h1>
            <p className="text-sm text-white/40 mt-1">Connect your site for one-click publishing</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <Globe size={14} className="text-[#FF5533]" /> WordPress Site URL
              </label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-white/20 mt-1.5 ml-1">Make sure to include https://</p>
            </div>

            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <User size={14} className="text-emerald-400" /> WordPress Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500/60 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <Lock size={14} className="text-[#FF8A00]" /> Application Password
              </label>
              <input 
                type="password" 
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#FF8A00]/60 focus:outline-none transition-all"
              />
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-4">
                <p className="text-[11px] text-[#FF7A45] leading-relaxed font-medium">
                  <strong>How to get this?</strong> Go to your WordPress Dashboard → Users → Profile. Scroll down to "Application Passwords", give it a name like "GrowthPilot AI" and click "Add New". Copy the generated password here.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              status === 'saved' ? 'bg-emerald-500 text-white' : 
              status === 'error' ? 'bg-red-500 text-white' : 
              'bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#FF5547] hover:to-[#FF9036] text-white shadow-xl shadow-[#FF5533]/25'
            }`}
          >
            {status === 'saved' ? <CheckCircle2 size={18} /> : status === 'error' ? <AlertCircle size={18} /> : <Save size={18} />}
            {status === 'saved' ? 'Connection Saved!' : status === 'error' ? 'Please fill all fields' : 'Save Connection'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/20">Credentials stay in this browser tab and are sent through the app server only when publishing.</p>
        </div>
      </div>
    </div>
  );
}
