'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import BrandLogo from '@/components/layout/BrandLogo';

export default function PublicNavbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { label: 'Features', href: '/#features' },
    { label: 'Workflow', href: '/#process' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ];

  // Detect scroll to enrich glassmorphic depth dynamically
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/55 dark:bg-[#030305]/55 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-black/[0.08] dark:border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'bg-background/35 dark:bg-[#030305]/35 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.04] dark:border-white/[0.05]'
      }`}
    >
      {/* Subtle top glass optical highlight sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/[0.15] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 dark:from-white/[0.03] to-transparent" />

      <div className="relative z-10 mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo href="/" imgClassName="h-7 sm:h-9 md:h-10 w-auto" />

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="relative text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground py-2 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF473A] to-[#FF8526] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <ThemeToggle />
          
          {isAuthPage ? (
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 hover:bg-muted px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-foreground transition-all duration-200 shadow-xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
          ) : (
            <>
              <Link 
                href="/auth?next=/dashboard" 
                className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Login
              </Link>

              <Link href="/auth?next=/dashboard">
                <button
                  className="relative inline-flex h-9 sm:h-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-3.5 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  <span>Start Free Trial</span>
                </button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-foreground md:hidden hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-border/40 dark:border-white/[0.08] bg-background/80 dark:bg-[#06060a]/80 backdrop-blur-2xl backdrop-saturate-150 overflow-hidden px-4 pt-2 pb-5 shadow-2xl"
          >
            <div className="flex flex-col space-y-1 mb-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-foreground/85 hover:text-foreground hover:bg-orange-500/10 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={14} className="text-muted-foreground/60" />
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-border/40 dark:border-white/[0.06] flex flex-col gap-2">
              {isAuthPage ? (
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <button className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/50 text-foreground font-semibold text-sm">
                    <ArrowLeft size={15} />
                    <span>Back to Home</span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth?next=/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log in to Account
                  </Link>
                  <Link
                    href="/auth?next=/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <button className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] text-white font-bold text-sm shadow-md shadow-orange-500/30">
                      <span>Start Free Trial</span>
                      <ArrowRight size={15} />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
