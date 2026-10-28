'use client';

import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  href?: string | null;
  collapsed?: boolean;
  priority?: boolean;
}

export default function BrandLogo({
  className = '',
  imgClassName = 'h-9 sm:h-10 md:h-11 w-auto',
  href = '/',
  collapsed = false,
}: BrandLogoProps) {
  const content = (
    <div className={`relative flex items-center select-none ${className}`}>
      {collapsed ? (
        <div className="w-8 h-8 overflow-hidden rounded-xl shrink-0 flex items-center justify-start">
          {/* Light Mode Collapsed Icon */}
          <img
            src="/images/black.png"
            alt="GrowthPilot AI"
            className="h-8 max-w-none object-cover object-left dark:hidden"
          />
          {/* Dark Mode Collapsed Icon */}
          <img
            src="/images/white.png"
            alt="GrowthPilot AI"
            className="h-8 max-w-none object-cover object-left hidden dark:block"
          />
        </div>
      ) : (
        <>
          {/* Light Mode Full Logo (black.png) */}
          <img
            src="/images/black.png"
            alt="GrowthPilot AI"
            className={`${imgClassName} object-contain dark:hidden`}
          />
          {/* Dark Mode Full Logo (white.png) */}
          <img
            src="/images/white.png"
            alt="GrowthPilot AI"
            className={`${imgClassName} object-contain hidden dark:block`}
          />
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
}
