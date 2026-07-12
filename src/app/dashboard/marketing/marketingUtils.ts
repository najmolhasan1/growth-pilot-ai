import { Brain, Search, FileText, TrendingUp, Video, Megaphone, Target, CheckCircle2, LucideIcon } from 'lucide-react';

export type BrandProfile = Record<string, string>;

export type MarketingResult = {
  executiveSummary: string;
  assumptions: string[];
  missingInputs: string[];
  strategy: string[];
  primaryOutput: string;
  variations: string[];
  checklist: string[];
  nextBestActions: string[];
};

export type GeneratedProductImage = {
  id: string;
  label: string;
  prompt: string;
  mimeType: string;
  dataUrl: string;
};

export type SavedAsset = {
  id: string;
  tool: string;
  title: string;
  language: string;
  inputs: Record<string, string>;
  brandSnapshot: BrandProfile;
  result: MarketingResult;
  createdAt: string;
};

export type ToolConfig = {
  id: string;
  label: string;
  description: string;
  category: 'Strategy' | 'Campaigns' | 'Content' | 'Conversion';
  featured?: boolean;
  icon: LucideIcon;
  fields: Array<{ key: string; label: string; placeholder: string; textarea?: boolean }>;
};

export type ExportFormat = 'txt' | 'md' | 'html' | 'json';

export const tools: ToolConfig[] = [
  {
    id: 'social_campaign',
    label: 'Social Campaign',
    description: 'LinkedIn, Facebook, Instagram, X post angles and campaign copy.',
    category: 'Campaigns',
    icon: Megaphone,
    fields: [
      { key: 'goal', label: 'Campaign Goal', placeholder: 'Leads, awareness, launch, webinar signup, sales' },
      { key: 'platform', label: 'Platform', placeholder: 'LinkedIn, Facebook, Instagram, X, TikTok' },
      { key: 'topic', label: 'Topic / Offer', placeholder: 'What should the campaign promote?' },
      { key: 'notes', label: 'Extra Notes', placeholder: 'Proof, audience insight, deadline, examples', textarea: true },
    ],
  },
  {
    id: 'product_copy',
    label: 'Product Copy',
    description: 'Product page, feature copy, benefit bullets, objections, CTA.',
    category: 'Conversion',
    icon: FileText,
    fields: [
      { key: 'product', label: 'Product / Service', placeholder: 'Name and short description' },
      { key: 'buyerPain', label: 'Buyer Pain', placeholder: 'What problem does the buyer feel?' },
      { key: 'proof', label: 'Proof', placeholder: 'Results, testimonial, guarantee, case study' },
      { key: 'notes', label: 'Extra Notes', placeholder: 'Features, pricing, delivery, differentiators', textarea: true },
    ],
  },
  {
    id: 'product_photography',
    label: 'Product Photography',
    description: 'Shot list, background ideas, AI image prompts, ecommerce frames, and social visual directions.',
    category: 'Content',
    icon: Video,
    featured: true,
    fields: [
      { key: 'productName', label: 'Product Name', placeholder: 'Example: premium leather wallet, skincare serum, online course bundle' },
      { key: 'productDetails', label: 'Product Details', placeholder: 'Material, size, color, features, packaging, price point', textarea: true },
      { key: 'audience', label: 'Buyer / Audience', placeholder: 'Who should feel attracted to this product?' },
      { key: 'visualGoal', label: 'Visual Goal', placeholder: 'Premium, clean ecommerce, lifestyle, festive, trust-building, conversion' },
      { key: 'platforms', label: 'Use Cases', placeholder: 'Website hero, ecommerce gallery, Facebook ads, Instagram, thumbnails' },
      { key: 'constraints', label: 'Brand / Production Notes', placeholder: 'Brand colors, props, background, avoid list, local market context', textarea: true },
    ],
  },
  {
    id: 'email_campaign',
    label: 'Email Campaign',
    description: 'Nurture, promo, launch, follow-up, and reactivation sequences.',
    category: 'Campaigns',
    icon: FileText,
    fields: [
      { key: 'sequenceType', label: 'Sequence Type', placeholder: 'Welcome, launch, promo, reactivation, follow-up' },
      { key: 'offer', label: 'Offer', placeholder: 'What should readers act on?' },
      { key: 'audienceStage', label: 'Audience Stage', placeholder: 'Cold, warm, trial, lead, customer' },
      { key: 'notes', label: 'Extra Notes', placeholder: 'Objections, proof, deadline, brand voice', textarea: true },
    ],
  },
  {
    id: 'sms_campaign',
    label: 'SMS Campaign',
    description: 'Short, direct, permission-friendly SMS copy with urgency.',
    category: 'Campaigns',
    icon: Megaphone,
    fields: [
      { key: 'offer', label: 'Offer', placeholder: 'Discount, reminder, booking, launch, renewal' },
      { key: 'audience', label: 'Audience', placeholder: 'Who receives this SMS?' },
      { key: 'urgency', label: 'Urgency', placeholder: 'Deadline, stock, event date, limited slots' },
      { key: 'notes', label: 'Extra Notes', placeholder: 'Compliance notes, opt-out text, tone', textarea: true },
    ],
  },
  {
    id: 'landing_page',
    label: 'Landing Page',
    description: 'Hero, page flow, sections, proof, objection handling, CTA.',
    category: 'Conversion',
    icon: Target,
    fields: [
      { key: 'pageGoal', label: 'Page Goal', placeholder: 'Book call, buy, join waitlist, download, signup' },
      { key: 'offer', label: 'Offer', placeholder: 'What is the main offer?' },
      { key: 'proof', label: 'Proof', placeholder: 'Numbers, reviews, demos, case study, clients' },
      { key: 'notes', label: 'Extra Notes', placeholder: 'Sections needed, objections, competitor angle', textarea: true },
    ],
  },
  {
    id: 'campaign_planner',
    label: 'Campaign Planner',
    description: '7/14/30 day campaign calendar with channels, hooks, CTAs, and execution tasks.',
    category: 'Strategy',
    icon: TrendingUp,
    featured: true,
    fields: [
      { key: 'campaignName', label: 'Campaign Name', placeholder: 'Example: Summer launch, Eid offer, free trial push' },
      { key: 'duration', label: 'Duration', placeholder: '7 days, 14 days, 30 days' },
      { key: 'goal', label: 'Primary Goal', placeholder: 'Leads, sales, demos, webinar signup, retention, waitlist' },
      { key: 'channels', label: 'Channels', placeholder: 'LinkedIn, Facebook, email, SMS, YouTube, blog, ads' },
      { key: 'offer', label: 'Offer', placeholder: 'What are you promoting?' },
      { key: 'notes', label: 'Context / Constraints', placeholder: 'Budget, team size, time, content capacity, sales process, tech stack', textarea: true },
    ],
  },
  {
    id: 'launch_pack',
    label: 'Launch Pack',
    description: 'One input to generate a landing section, social posts, emails, SMS, ad angles, and visual prompts.',
    category: 'Campaigns',
    icon: Brain,
    featured: true,
    fields: [
      { key: 'launchName', label: 'Launch / Campaign Name', placeholder: 'Example: AI course launch, winter collection, agency audit offer' },
      { key: 'offer', label: 'Offer', placeholder: 'What exactly are you selling or promoting?' },
      { key: 'goal', label: 'Primary Goal', placeholder: 'Sales, demos, leads, waitlist, downloads, bookings' },
      { key: 'audience', label: 'Audience Segment', placeholder: 'Who is this launch for?' },
      { key: 'channels', label: 'Channels', placeholder: 'Landing page, email, LinkedIn, Facebook, SMS, ads, YouTube' },
      { key: 'proof', label: 'Proof / Differentiator', placeholder: 'Results, testimonials, guarantee, unique method, data' },
      { key: 'notes', label: 'Launch Context', placeholder: 'Deadline, price, bonus, objections, tone, constraints, examples', textarea: true },
    ],
  },
  {
    id: 'strategy_audit',
    label: 'Growth Strategy Audit',
    description: 'Diagnose ICP, positioning, offer strength, funnel gaps, channel priorities, and next actions.',
    category: 'Strategy',
    icon: Target,
    featured: true,
    fields: [
      { key: 'goal', label: 'Main Business Goal', placeholder: 'More qualified leads, online sales, demos, retention, launch demand' },
      { key: 'currentSituation', label: 'Current Situation', placeholder: 'What is working, what is stuck, current traffic/sales/leads?', textarea: true },
      { key: 'constraints', label: 'Constraints', placeholder: 'Budget, team size, time, content capacity, sales process, tech stack', textarea: true },
      { key: 'assets', label: 'Existing Assets', placeholder: 'Website, email list, social pages, product photos, videos, case studies', textarea: true },
      { key: 'priorityMarket', label: 'Priority Market', placeholder: 'Bangladesh, USA, local city, global English, niche segment' },
    ],
  },
];

export const defaultResult: MarketingResult = {
  executiveSummary: '',
  assumptions: [],
  missingInputs: [],
  strategy: [],
  primaryOutput: '',
  variations: [],
  checklist: [],
  nextBestActions: [],
};

export function fileBaseName(value: string) {
  return (value || 'marketing-asset')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'marketing-asset';
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resultToText(asset: Pick<SavedAsset, 'title' | 'tool' | 'language' | 'inputs' | 'result' | 'createdAt'>) {
  const resultValue = asset.result;
  return [
    asset.title,
    `Tool: ${asset.tool}`,
    `Language: ${asset.language}`,
    asset.createdAt ? `Created: ${new Date(asset.createdAt).toLocaleString()}` : '',
    '',
    'Executive Summary',
    resultValue.executiveSummary,
    '',
    'Strategy',
    ...resultValue.strategy.map(item => `- ${item}`),
    '',
    'Primary Output',
    resultValue.primaryOutput,
    '',
    'Variations',
    ...resultValue.variations.map(item => `- ${item}`),
    '',
    'Quality Checklist',
    ...resultValue.checklist.map(item => `- ${item}`),
    '',
    'Assumptions',
    ...resultValue.assumptions.map(item => `- ${item}`),
    '',
    'Missing Inputs',
    ...resultValue.missingInputs.map(item => `- ${item}`),
    '',
    'Next Best Actions',
    ...resultValue.nextBestActions.map(item => `- ${item}`),
    '',
    'Inputs',
    JSON.stringify(asset.inputs || {}, null, 2),
  ].filter(line => line !== undefined).join('\n');
}

export function resultToMarkdown(asset: Pick<SavedAsset, 'title' | 'tool' | 'language' | 'inputs' | 'result' | 'createdAt'>) {
  const text = resultToText(asset);
  return text
    .replace(/^Executive Summary$/m, '## Executive Summary')
    .replace(/^Strategy$/m, '## Strategy')
    .replace(/^Primary Output$/m, '## Primary Output')
    .replace(/^Variations$/m, '## Variations')
    .replace(/^Quality Checklist$/m, '## Quality Checklist')
    .replace(/^Assumptions$/m, '## Assumptions')
    .replace(/^Missing Inputs$/m, '## Missing Inputs')
    .replace(/^Next Best Actions$/m, '## Next Best Actions')
    .replace(/^Inputs$/m, '## Inputs')
    .replace(asset.title, `# ${asset.title}`);
}

export function resultToHtml(asset: Pick<SavedAsset, 'title' | 'tool' | 'language' | 'inputs' | 'result' | 'createdAt'>) {
  const markdown = resultToMarkdown(asset);
  const body = markdown
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith('- ')) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (!line.trim()) return '';
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(asset.title)}</title>
  <style>body{font-family:Arial,sans-serif;line-height:1.65;max-width:860px;margin:40px auto;padding:0 20px;color:#111827}h1,h2{line-height:1.2}li{margin:6px 0}pre{white-space:pre-wrap;background:#f3f4f6;padding:16px;border-radius:12px}</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
