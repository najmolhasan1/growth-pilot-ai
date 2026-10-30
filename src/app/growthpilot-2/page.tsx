import GrowthPilot2Website from '@/components/growthpilot-2/GrowthPilot2Website';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GrowthPilot 2.0 — Autonomous Ad & Retention Engine',
  description: 'Markopolo-grade autonomous media buying, cookieless Meta CAPI server-side tracking, 384-D vector intent scoring, and 5-channel recovery.',
};

export default function GrowthPilot2RootPage() {
  return <GrowthPilot2Website />;
}
