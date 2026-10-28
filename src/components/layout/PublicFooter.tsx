'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Workflow', href: '/#process' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Changelog', href: '/#faq' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Case Studies', href: '#' },
      { label: 'API Docs', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Affiliate', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
];

export default function PublicFooter() {
  const [textMouse, setTextMouse] = useState({ x: 0, y: 0 });
  const [isTextHovered, setIsTextHovered] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full px-6 pt-16 pb-12 bg-muted/[0.03] dark:bg-black/20 border-t border-border/40 relative z-10 overflow-hidden">
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-10 lg:gap-16 justify-between relative z-10">
        <div className="lg:max-w-xs shrink-0">
          <div className="mb-4">
            <BrandLogo href="/" imgClassName="h-8 w-auto" />
          </div>
          <p className="max-w-xs text-sm leading-7 text-muted-foreground">
            AI-powered workspace for SEO content, keyword research, trend intelligence, video repurposing, and campaign assets.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Bangla + English • Gemini + Claude powered
          </p>
        </div>

        {/* Footer Link Groups: 2 rows with 2 columns each on mobile, 4 columns on tablet & desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 flex-1 lg:max-w-3xl justify-between">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-black text-foreground">{group.title}</h4>
              <div className="space-y-3">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern High-Impact Brand Signature with LED Dot-Matrix Texture & Spotlight */}
      <div className="mx-auto max-w-[1440px] mt-12 pt-4 relative z-10">
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTextMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseEnter={() => setIsTextHovered(true)}
          onMouseLeave={() => setIsTextHovered(false)}
          className="group relative flex items-center justify-center select-none py-10 sm:py-16 md:py-20 px-2 sm:px-4 cursor-default overflow-hidden"
        >
          {/* Base Muted Dot-Matrix Typography Layer */}
          <div className="relative flex items-center justify-center w-full">
            <h2
              className="font-black tracking-[-0.04em] text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[155px] 2xl:text-[185px] text-slate-400/35 dark:text-[#6a5a7d]/65 select-none leading-none text-center whitespace-nowrap"
              style={{
                WebkitMaskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                WebkitMaskSize: '5.5px 5.5px',
                maskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                maskSize: '5.5px 5.5px',
              }}
            >
              GrowthPilot AI
            </h2>

            {/* Interactive Spotlight Reveal Layer */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
              style={{
                opacity: isTextHovered ? 1 : 0.25,
                WebkitMaskImage: isTextHovered
                  ? `radial-gradient(380px circle at ${textMouse.x}px ${textMouse.y}px, black 35%, transparent 75%)`
                  : `radial-gradient(520px circle at 50% 50%, black 20%, transparent 70%)`,
                maskImage: isTextHovered
                  ? `radial-gradient(380px circle at ${textMouse.x}px ${textMouse.y}px, black 35%, transparent 75%)`
                  : `radial-gradient(520px circle at 50% 50%, black 20%, transparent 70%)`,
              }}
            >
              <h2
                aria-hidden="true"
                className="font-black tracking-[-0.04em] text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[155px] 2xl:text-[185px] bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent select-none leading-none text-center whitespace-nowrap"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                  WebkitMaskSize: '5.5px 5.5px',
                  maskImage: 'radial-gradient(circle at center, black 1.8px, transparent 1.8px)',
                  maskSize: '5.5px 5.5px',
                }}
              >
                GrowthPilot AI
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright row */}
      <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-4 pt-6 text-sm text-muted-foreground/60 sm:flex-row relative z-10">
        <p>© 2026 GrowthPilot AI. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-6 font-medium">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Security</a>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-[#FF5533] dark:hover:text-[#FF7A45] transition-colors cursor-pointer"
          >
            Back to top <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
