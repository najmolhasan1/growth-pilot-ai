import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GrowthPilot — Admin',
  description: 'GrowthPilot Administration Panel',
  robots: 'noindex, nofollow',
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gp-admin-root">
      {children}
    </div>
  );
}
