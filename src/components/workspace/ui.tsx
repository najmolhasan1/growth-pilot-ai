'use client';

import Link from 'next/link';
import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

/*
 * Shared workspace primitives.
 * One visual language for every dashboard tool: quiet sticky top bar,
 * flat cards, theme tokens (works in light + dark), and a single
 * accent color used only for primary actions and active states.
 */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type IconType = ComponentType<{ size?: number; className?: string }>;

/* ---------- Class tokens ---------- */

export const ui = {
  input:
    'w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#FF5533]/60 focus:ring-2 focus:ring-[#FF5533]/15 disabled:opacity-60',
  inputIcon:
    'w-full h-10 rounded-xl border border-border bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#FF5533]/60 focus:ring-2 focus:ring-[#FF5533]/15 disabled:opacity-60',
  textarea:
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition resize-y focus:border-[#FF5533]/60 focus:ring-2 focus:ring-[#FF5533]/15',
  select:
    'w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-[#FF5533]/60 focus:ring-2 focus:ring-[#FF5533]/15 cursor-pointer',
  label: 'mb-1.5 block text-xs font-medium text-muted-foreground',
  btnPrimary:
    'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF5533] px-4 text-sm font-semibold text-white transition hover:bg-[#ff6a4d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
  btnSecondary:
    'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50 cursor-pointer',
  btnGhost:
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer',
  card: 'rounded-2xl border border-border bg-card',
  subtle: 'rounded-xl border border-border bg-muted',
};

/* ---------- Page shell ---------- */

export function WorkspaceHeader({
  title,
  crumbs,
  actions,
}: {
  title: string;
  crumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        {crumbs?.map(c => (
          <span key={c.label} className="hidden items-center gap-2 sm:flex">
            {c.href ? (
              <Link href={c.href} className="text-muted-foreground transition hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{c.label}</span>
            )}
            <ChevronRight size={14} className="text-muted-foreground" />
          </span>
        ))}
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function WorkspaceBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8', className)}>{children}</div>;
}

export function WorkspacePage({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

/* ---------- Tool switcher: many tools, one surface ---------- */

export type SwitcherItem<T extends string> = { id: T; label: string; icon?: IconType; href?: string };

export function ToolSwitcher<T extends string>({
  items,
  value,
  onChange,
}: {
  items: SwitcherItem<T>[];
  value: T;
  onChange?: (id: T) => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>('[data-active="true"]');
    if (!nav || !el) return;
    const left = el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [value]);

  return (
    <nav ref={navRef} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
      <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border bg-card p-1 sm:min-w-0">
        {items.map(item => {
          const active = item.id === value;
          const Icon = item.icon;
          const cls = cx(
            'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-[13px] font-medium transition cursor-pointer',
            active ? 'bg-[#FF5533] text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          );
          const inner = (
            <>
              {Icon && <Icon size={15} />}
              {item.label}
            </>
          );
          return item.href ? (
            <Link key={item.id} href={item.href} className={cls} data-active={active} aria-current={active ? 'page' : undefined}>
              {inner}
            </Link>
          ) : (
            <button key={item.id} type="button" onClick={() => onChange?.(item.id)} className={cls} data-active={active} aria-pressed={active}>
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('inline-flex gap-1 rounded-xl border border-border bg-background p-1', className)}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cx(
            'h-8 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition cursor-pointer',
            value === o.id ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Panels ---------- */

export function Panel({
  title,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  icon?: IconType;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx(ui.card, className)}>
      {(title || actions) && (
        <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {Icon && <Icon size={15} className="text-muted-foreground" />}
            {title}
          </h2>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={cx('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className={ui.label}>{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: IconType;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-xl border px-3.5 py-2.5 text-xs',
        tone === 'error'
          ? 'border-red-500/25 bg-red-500/10 text-red-500 dark:text-red-300'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
      )}
    >
      {children}
    </div>
  );
}
