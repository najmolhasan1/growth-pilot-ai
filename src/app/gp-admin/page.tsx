'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Loader2, Lock, AlertCircle } from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    fetch('/api/admin/verify')
      .then(r => r.json())
      .then(d => {
        if (d.valid) router.replace('/gp-admin/dashboard');
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace('/gp-admin/dashboard');
      } else {
        setError(data.error || 'Invalid credentials. Access denied.');
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF5533]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#FF5533]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[#FF8A00]/8 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-[#FF4D42]/8 rounded-full blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <BrandLogo href="/gp-admin" imgClassName="h-10 w-auto" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
              <ShieldCheck size={16} className="text-[#FF5533]" />
            </div>
            <span className="text-[10px] font-bold text-[#FF5533] uppercase tracking-[0.2em]">Restricted Admin Access</span>
          </div>

          <h1 className="text-2xl font-black text-white">Administration Panel</h1>
          <p className="text-xs text-white/40 mt-2 font-medium">
            Enter your admin credentials to access the control center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Password field */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#0d0d0f] border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-[#FF5533]/50 focus:outline-none focus:ring-1 focus:ring-[#FF5533]/20 transition-all font-semibold tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 flex items-center gap-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs font-semibold text-red-400">{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:from-[#FF5547] hover:to-[#FF9036] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#FF5533]/25 hover:shadow-[#FF5533]/35 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>

          </form>

          {/* Security notice */}
          <p className="text-center text-[10px] text-white/20 mt-6 leading-relaxed font-medium">
            🔒 This panel is for authorized administrators only.<br />
            All access attempts are logged for security purposes.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-[9px] text-white/15 mt-6 uppercase tracking-widest font-bold">
          GrowthPilot AI © 2026 — Admin Console v2.0
        </p>
      </div>
    </div>
  );
}
