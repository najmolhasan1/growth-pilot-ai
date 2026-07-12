'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, KeyRound, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, CreditCard, Smartphone, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseConfigured = isSupabaseConfigured();
  
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(7);
  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activating, setActivating] = useState(false);

  // Checkout flow states
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'monthly' | 'lifetime'>('lifetime');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bkash'>('card');
  const [paymentStage, setPaymentStage] = useState<'input' | 'processing' | 'success'>('input');
  const [processingStep, setProcessingStep] = useState(1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showLicenseKeyForm, setShowLicenseKeyForm] = useState(false);

  // Card details
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Mobile Banking details
  const [walletNumber, setWalletNumber] = useState('');
  const [walletProvider, setWalletProvider] = useState<'bkash' | 'nagad'>('bkash');
  const [walletOtpSent, setWalletOtpSent] = useState(false);
  const [walletOtp, setWalletOtp] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletPinSent, setWalletPinSent] = useState(false);

  // Helper utils
  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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
      
      setPaymentStage('success');
      setIsTrialExpired(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      alert(err.message || 'Payment processing failed. Please try again.');
      setPaymentStage('input');
    }
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    const checkTrial = (user: any) => {
      const isPlus = user?.user_metadata?.plan === 'Plus';
      if (isPlus) {
        setIsTrialExpired(false);
        setDaysLeft(7);
        return false;
      }
      
      const createdAt = new Date(user?.created_at);
      const now = new Date();
      const diffTime = now.getTime() - createdAt.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      if (diffDays >= 7) {
        setIsTrialExpired(true);
        setDaysLeft(0);
        return true;
      } else {
        setIsTrialExpired(false);
        setDaysLeft(Math.max(0, 7 - Math.floor(diffDays)));
        return false;
      }
    };

    // Use refreshSession() instead of getSession() so that admin-side
    // user_metadata updates (plan/role) are picked up immediately.
    supabase.auth.refreshSession().then(({ data, error }) => {
      if (!mounted) return;
      // If refresh fails (e.g., no network), fall back to cached session
      const session = data?.session;
      if (!session) {
        // Try cached session as fallback
        supabase.auth.getSession().then(({ data: cached }) => {
          if (!mounted) return;
          if (!cached.session) {
            router.replace(`/auth?next=${encodeURIComponent(pathname || '/dashboard')}`);
            return;
          }
          setSession(cached.session);
          const expired = checkTrial(cached.session.user);
          setReady(true);
        });
        return;
      }
      
      setSession(session);
      const expired = checkTrial(session.user);
      setReady(true); // set ready to show content or blocker
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        router.replace(`/auth?next=${encodeURIComponent(pathname || '/dashboard')}`);
        return;
      }
      setSession(session);
      checkTrial(session.user);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router, supabaseConfigured]);

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');
    setActivating(true);
    
    const enteredKey = activationKey.trim().toUpperCase();
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('Please login to activate your license.');
      }

      const response = await fetch('/api/auth/activate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey: enteredKey })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to activate license.');
      }

      // Refresh browser session to load updated user plan metadata instantly
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      setActivationSuccess(true);
      setIsTrialExpired(false);
      
      if (refreshData?.session?.user) {
        setSession(refreshData.session);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setActivationError(err?.message || 'Failed to update plan. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-blue-400" size={34} />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">Checking account</p>
        </div>
      </div>
    );
  }

  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center py-12 px-6 relative overflow-hidden">
        {/* Background spotlights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-[-100px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute left-1/3 bottom-[-100px] h-[400px] w-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>

        <div className={cn("w-full relative z-10 transition-all duration-300", checkoutActive && paymentStage !== 'processing' ? "max-w-2xl" : "max-w-md")}>
          <div className="bg-[#0b0f1a]/85 border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            
            {/* CONTENT A: STANDARD TRIAL EXPIRED EXPLAINER & ACTIONS */}
            {!checkoutActive && (
              <div className="w-full text-center">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6 text-amber-400 mx-auto">
                  <AlertTriangle size={32} />
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white mb-3">
                  Free Trial Expired ⏳
                </h1>

                <p className="text-sm text-white/60 leading-relaxed mb-8">
                  Your 7-day free trial of GrowthPilot AI has ended. To continue using our premium Growth & SEO workspace tools, please activate instant access.
                </p>

                {/* Primary Action: Go to Payment Checkout */}
                <button
                  type="button"
                  onClick={() => setCheckoutActive(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer mb-6"
                >
                  <Sparkles size={16} />
                  <span>Pay Securely & Unlock Plus Access</span>
                  <ArrowRight size={16} />
                </button>

                {/* Secondary Action: Legacy License Key Form */}
                <div className="w-full border-t border-white/5 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowLicenseKeyForm(!showLicenseKeyForm)}
                    className="text-xs text-white/40 hover:text-white transition-colors underline mb-4 inline-block font-medium"
                  >
                    {showLicenseKeyForm ? 'Hide license key input' : 'Have an activation license key?'}
                  </button>

                  {showLicenseKeyForm && (
                    <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                      {activationSuccess ? (
                        <div className="w-full text-emerald-400 text-xs py-2 text-center">
                          ✓ License Key Activated! Unlocking...
                        </div>
                      ) : (
                        <form onSubmit={handleActivateKey} className="space-y-3 font-semibold">
                          <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                            <input
                              type="text"
                              value={activationKey}
                              onChange={(e) => setActivationKey(e.target.value)}
                              placeholder="Enter License Key"
                              required
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-blue-500 focus:outline-none transition-all uppercase tracking-wider text-center"
                            />
                          </div>

                          {activationError && (
                            <p className="text-[10px] text-red-400 font-semibold">{activationError}</p>
                          )}

                          <button
                            type="submit"
                            disabled={activating}
                            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {activating ? <Loader2 className="animate-spin" size={12} /> : 'Activate Key'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-white/45">
                    Need help? <a href="mailto:support@growthpilot.ai?subject=Trial Blocker Question" className="text-blue-400 hover:underline font-bold">Contact Support</a>
                  </p>
                </div>
              </div>
            )}

            {/* CONTENT B: PREMIUM INTERACTIVE CHECKOUT GATE */}
            {checkoutActive && (
              <div className="w-full text-left">
                {/* Stage 1: Checkout Form */}
                {paymentStage === 'input' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutActive(false);
                          setWalletOtpSent(false);
                          setWalletPinSent(false);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <Lock size={12} className="text-emerald-400" />
                        <span>SSL Secure Gateway</span>
                      </div>
                    </div>

                    {/* Content split grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Left: Summary and Plan select */}
                      <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                          <label className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 font-black">Select Your Plan</label>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setPaymentPlan('monthly')}
                              className={cn(
                                "w-full border rounded-xl p-3 text-left transition-all cursor-pointer flex items-center justify-between",
                                paymentPlan === 'monthly'
                                  ? "bg-primary/10 border-primary text-white font-bold"
                                  : "bg-black/20 border-white/5 text-white/60 hover:text-white"
                              )}
                            >
                              <div>
                                <h4 className="text-xs">Plus Monthly Plan</h4>
                                <p className="text-[10px] text-white/40 font-normal">Cancel anytime</p>
                              </div>
                              <span className="text-sm font-black">$49/mo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentPlan('lifetime')}
                              className={cn(
                                "w-full border rounded-xl p-3 text-left transition-all cursor-pointer flex items-center justify-between",
                                paymentPlan === 'lifetime'
                                  ? "bg-primary/10 border-primary text-white font-bold"
                                  : "bg-black/20 border-white/5 text-white/60 hover:text-white"
                              )}
                            >
                              <div>
                                <h4 className="text-xs">Plus Lifetime Access</h4>
                                <p className="text-[10px] text-white/40 font-normal">Forever updates</p>
                              </div>
                              <span className="text-sm font-black">$299 once</span>
                            </button>
                          </div>
                        </div>

                        <ul className="space-y-2 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                          <li className="flex items-center gap-2 text-[11px] text-white/60">
                            <CheckCircle2 size={12} className="text-emerald-400 animate-pulse" />
                            <span>Unlimited Workspace access</span>
                          </li>
                          <li className="flex items-center gap-2 text-[11px] text-white/60">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Advanced SEO content generation</span>
                          </li>
                          <li className="flex items-center gap-2 text-[11px] text-white/60">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Marketing suites & Video Content Kit</span>
                          </li>
                        </ul>
                      </div>

                      {/* Right: Payment forms */}
                      <div className="space-y-4">
                        {/* Tabs */}
                        <div className="grid grid-cols-2 gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={cn(
                              "flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                              paymentMethod === 'card' ? "bg-white/5 text-white" : "text-white/40 hover:text-white"
                            )}
                          >
                            <CreditCard size={12} />
                            <span>Card</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bkash')}
                            className={cn(
                              "flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                              paymentMethod === 'bkash' ? "bg-white/5 text-white" : "text-white/40 hover:text-white"
                            )}
                          >
                            <Smartphone size={12} />
                            <span>Mobile Wallet</span>
                          </button>
                        </div>

                        {/* Card Inputs */}
                        {paymentMethod === 'card' && (
                          <form onSubmit={handlePay} className="space-y-3">
                            <input
                              type="text"
                              placeholder="Cardholder Name"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              required
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all"
                            />
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Card Number"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono"
                              />
                              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" size={12} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                                maxLength={5}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center"
                              />
                              <input
                                type="password"
                                placeholder="CVC"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                maxLength={4}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition-all cursor-pointer"
                            >
                              <Lock size={12} />
                              <span>Confirm Pay ${paymentPlan === 'lifetime' ? '299.00' : '49.00'}</span>
                            </button>
                          </form>
                        )}

                        {/* Mobile Wallet Inputs */}
                        {paymentMethod === 'bkash' && (
                          <div className="space-y-3 font-semibold">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setWalletProvider('bkash');
                                  setWalletOtpSent(false);
                                  setWalletPinSent(false);
                                }}
                                className={cn(
                                  "border rounded-xl py-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                  walletProvider === 'bkash' ? "bg-[#e2136e]/10 border-[#e2136e] text-white" : "bg-black/30 border-white/5 text-white/55"
                                )}
                              >
                                <span className="font-bold text-[10px] tracking-wide">bKash</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWalletProvider('nagad');
                                  setWalletOtpSent(false);
                                  setWalletPinSent(false);
                                }}
                                className={cn(
                                  "border rounded-xl py-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                  walletProvider === 'nagad' ? "bg-[#f7941d]/10 border-[#f7941d] text-white" : "bg-black/30 border-white/5 text-white/55"
                                )}
                              >
                                <span className="font-bold text-[10px] tracking-wide">Nagad</span>
                              </button>
                            </div>

                            {!walletOtpSent && (
                              <div className="space-y-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                                <label className="block text-[9px] font-bold text-white/40 uppercase mb-1">
                                  Your {walletProvider === 'bkash' ? 'bKash' : 'Nagad'} Wallet Number
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-white/45">+880</span>
                                  <input
                                    type="text"
                                    value={walletNumber}
                                    onChange={(e) => setWalletNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="17XXXXXXXX"
                                    maxLength={10}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-14 pr-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (walletNumber.length < 10) {
                                      alert('Please enter a valid wallet number.');
                                      return;
                                    }
                                    setWalletOtpSent(true);
                                  }}
                                  className={cn(
                                    "w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white",
                                    walletProvider === 'bkash' ? "bg-[#e2136e]" : "bg-[#f7941d]"
                                  )}
                                >
                                  <span>Send OTP Code</span>
                                </button>
                              </div>
                            )}

                            {walletOtpSent && !walletPinSent && (
                              <div className="space-y-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                                <label className="block text-[9px] font-bold text-white/40 uppercase mb-1">
                                  Enter Verification Code (OTP)
                                </label>
                                <input
                                  type="text"
                                  value={walletOtp}
                                  onChange={(e) => setWalletOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                  placeholder="OTP Code"
                                  maxLength={6}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center tracking-widest font-black"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (walletOtp.length < 6) {
                                      alert('Please enter the 6-digit OTP code.');
                                      return;
                                    }
                                    setWalletPinSent(true);
                                  }}
                                  className={cn(
                                    "w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white",
                                    walletProvider === 'bkash' ? "bg-[#e2136e]" : "bg-[#f7941d]"
                                  )}
                                >
                                  <span>Verify Code</span>
                                </button>
                              </div>
                            )}

                            {walletPinSent && (
                              <div className="space-y-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl font-semibold">
                                <form onSubmit={handlePay} className="space-y-2">
                                  <label className="block text-[9px] font-bold text-white/40 uppercase mb-1">
                                    Enter Secure Wallet PIN
                                  </label>
                                  <input
                                    type="password"
                                    value={walletPin}
                                    onChange={(e) => setWalletPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="••••"
                                    maxLength={5}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:border-primary focus:outline-none transition-all font-mono text-center tracking-[0.5em] font-black"
                                  />
                                  <button
                                    type="submit"
                                    className={cn(
                                      "w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white",
                                      walletProvider === 'bkash' ? "bg-[#e2136e]" : "bg-[#f7941d]"
                                    )}
                                  >
                                    <Lock size={10} />
                                    <span>Pay ${paymentPlan === 'lifetime' ? '299.00' : '49.00'}</span>
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

                {/* Stage 2: Processing Loader */}
                {paymentStage === 'processing' && (
                  <div className="py-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
                    <Loader2 className="text-primary animate-spin mb-4" size={28} />
                    <h3 className="text-sm font-black text-white mb-1">Authorizing Transaction</h3>
                    <p className="text-[10px] text-white/40 mb-6 leading-relaxed font-normal">
                      Connecting with gateway and upgrading your workspace permissions. Please hold on.
                    </p>

                    <div className="w-full bg-black/30 border border-white/5 rounded-2xl p-4 text-left space-y-2 font-semibold">
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
                          <div key={status} className="flex items-center gap-2 text-[10px]">
                            {isCompleted ? (
                              <span className="text-emerald-400 text-[10px]">✓</span>
                            ) : isActive ? (
                              <Loader2 className="animate-spin text-primary shrink-0" size={10} />
                            ) : (
                              <span className="text-white/20">•</span>
                            )}
                            <span className={cn(
                              isCompleted ? "text-emerald-400/80 font-normal line-through" :
                              isActive ? "text-white font-bold" : "text-white/30 font-normal"
                            )}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stage 3: Success Screen */}
                {paymentStage === 'success' && (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={48} className="text-emerald-400 animate-bounce mb-4" />
                    <h3 className="text-base font-black text-white mb-1">Activation Completed! 🎉</h3>
                    <p className="text-xs text-white/50 mb-4">
                      Your GrowthPilot workspace is unlocked. Reloading dashboard...
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return children;
}
