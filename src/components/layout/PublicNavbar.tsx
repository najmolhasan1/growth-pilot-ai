'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/layout/ThemeToggle';

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
      className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/70 backdrop-blur-md shadow-sm"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-300">
            <Zap className="text-white relative z-10" fill="white" size={18} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:to-foreground transition-all duration-300">
            GrowthPilot AI
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="relative text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground py-2 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-600 group-hover:w-full transition-all duration-300" />
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
              className="relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Start Free Trial
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
