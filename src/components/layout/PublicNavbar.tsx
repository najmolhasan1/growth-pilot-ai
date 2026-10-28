'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/layout/ThemeToggle';
import BrandLogo from '@/components/layout/BrandLogo';

export default function PublicNavbar() {
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Workflow', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed left-0 right-0 top-0 z-50 bg-background/60 backdrop-blur-xl border-none outline-none"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <BrandLogo href="/" imgClassName="h-9 sm:h-10 md:h-11 w-auto" />

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

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link 
            href="/auth?next=/dashboard" 
            className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Login
          </Link>
          <Link href="/auth?next=/dashboard">
            <button
              className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-5 sm:px-6 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Start Free Trial
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
