'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import BrandLogo from '@/components/layout/BrandLogo';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Workflow', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

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
      className="fixed left-0 right-0 top-0 z-50 bg-background/85 dark:bg-[#030303]/85 backdrop-blur-xl border-b border-border/30 dark:border-white/[0.06] transition-colors"
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
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
            className="md:hidden border-b border-border/60 dark:border-white/[0.08] bg-background/95 dark:bg-[#08080a]/95 backdrop-blur-2xl overflow-hidden px-4 pt-2 pb-5 shadow-2xl"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
