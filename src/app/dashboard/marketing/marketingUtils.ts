import { Brain, Search, FileText, TrendingUp, Video, Megaphone, Target, CheckCircle2, LucideIcon } from 'lucide-react';

export type BrandProfile = Record<string, string>;

export type BusinessModelType = 'fcommerce' | 'ecommerce' | 'b2b' | 'saas';

export type AdCreativeItem = {
  angleName: string;
  platform: string;
  hook: string;
  bodyCopy: string;
  callToAction: string;
  visualDirection?: string;
};

export type ChatClosingScript = {
  customerTrigger: string;
  psychologicalAngle: string;
  salesScript: string;
  nextStepCta: string;
};

export type CampaignPhase = {
  phaseName: string;
  objective: string;
  keyAction: string;
  copyOrScriptSnippet: string;
};

export type MarketingResult = {
  executiveSummary: string;
  assumptions: string[];
  missingInputs: string[];
  strategy: string[];
  primaryOutput: string;
  variations: string[];
  checklist: string[];
  nextBestActions: string[];
  // 🌟 Real-World 40-Year CMO Battle-Tested Structures:
  adCreatives?: AdCreativeItem[];
  chatClosingScripts?: ChatClosingScript[];
  campaignPhases?: CampaignPhase[];
  guaranteeAndRiskReversal?: string;
  unitEconomicsAdvice?: string;
};

export interface CampaignPreset {
  id: string;
  label: string;
  businessModel: BusinessModelType;
  badge: string;
  description: string;
  inputs: Record<string, string>;
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'fcom_clothing_drop',
    label: '👗 F-Commerce Collection Drop (BD COD)',
    businessModel: 'fcommerce',
    badge: 'Popular in BD',
    description: 'Festive/seasonal fashion collection with Cash On Delivery & delivery risk reversal.',
    inputs: {
      topic: 'Premium Cotton Panjabi & Kurti Festive Collection Drop',
      productName: 'Handcrafted Combed Cotton Panjabi & Kurti Set',
      offer: 'Buy 2 get Free Shipping all over Bangladesh + Cash on Delivery (check in front of rider)',
      goal: 'Direct Messenger orders, WhatsApp queries, and COD confirmations',
      audience: 'Fashion-conscious youth, professionals, and gift buyers aged 20-40 in BD',
      notes: 'Price range 1450 - 2800 BDT. Deliver via Steadfast / Pathao within 48 hours. Include "delivery man er samne check kore payment korun" trust line.',
      product: 'Festive Panjabi & Kurti Set',
      buyerPain: 'Fear of low-quality fabric, mismatched size, and online fake photo scams',
      proof: 'Over 12,000+ happy buyers, real video review clips, 7-day hassle-free size replacement',
      sequenceType: 'Festive Flash Launch Sequence',
      urgency: 'Only 150 pieces per design, stock running out fast',
      pageGoal: 'Direct WhatsApp/Messenger Order Button with instant COD form',
      campaignName: 'Boishakh / Eid Festive Collection Mega Drop',
      duration: '14 days multi-touch',
      channels: 'Facebook, Instagram Reels, Messenger, WhatsApp, SMS Broadcast',
      launchName: 'Festive Premium Drop 2026',
    }
  },
  {
    id: 'fcom_skincare_trust',
    label: '🧴 Organic Skincare / Beauty (F-Commerce)',
    businessModel: 'fcommerce',
    badge: 'High Conversion',
    description: 'Chemical-free natural hair oil & aloe serums overcoming low trust and cheap chemical competitors.',
    inputs: {
      topic: '100% Pure Organic Cold-Pressed Hair Oil & Glowing Aloe Serum',
      productName: 'Organic Rosemary & Onion Hair Growth Elixir',
      offer: 'Starter Duo Pack at 1,350 BDT (Save 350 BDT) + Free Scalp Massager',
      goal: 'High-trust Messenger inquiries and repeat customer orders',
      audience: 'Women and men aged 18-38 suffering from hair fall and dull skin due to pollution and hard water',
      notes: 'No harsh chemicals, BSTI lab certified, visible difference in 21 days or money-back assurance. Cash on delivery available nationwide.',
      product: 'Organic Rosemary Hair Growth Oil',
      buyerPain: 'Severe hair fall, hair thinning, tried chemical brands that worsened scalp damage',
      proof: 'Dermatologist tested, 4.9/5 star ratings from 3,500+ real verified customers with before/after photos',
      sequenceType: 'Educational 3-step hair recovery sequence',
      urgency: 'Fresh cold-pressed batch of only 300 bottles prepared this week',
      pageGoal: 'Direct order form with COD & courier delivery tracking',
      campaignName: '21-Day Hair Transformation Challenge',
      duration: '21 days',
      channels: 'Facebook Page, Instagram Reels, Messenger, TikTok UGC, SMS',
      launchName: 'Organic Scalp Elixir 2.0 Launch',
    }
  },
  {
    id: 'ecom_d2c_gadget',
    label: '⚡ D2C Ecommerce Gadget / Tech (Shopify / Web)',
    businessModel: 'ecommerce',
    badge: 'AOV Booster',
    description: 'High-converting electronic gadget with 1-year replacement warranty and bundle upsells.',
    inputs: {
      topic: 'Ultra-Compact 65W GaN Fast Charger & Multi-Device Charging Station',
      productName: 'PulseCharge 65W GaN Dual-Port Smart Charger',
      offer: 'Bundle 2 cables + Charger for $49 / 3,200 BDT (Save 25%) + 1-Year Official Replacement Guarantee',
      goal: 'Direct online Shopify checkouts, add-to-cart velocity, and cart recovery',
      audience: 'Tech enthusiasts, remote workers, students, and gadget lovers with multiple devices',
      notes: 'Compact pocket size, charges laptop + phone simultaneously, surge protection certified.',
      product: 'PulseCharge 65W GaN Station',
      buyerPain: 'Carrying 3 bulky chargers, slow charging, fake imitation chargers that heat up dangerously',
      proof: 'CE & FCC safety certified, over 25,000 units sold globally with 1-year instant replacement policy',
      sequenceType: 'Product Unboxing & Feature Breakdown',
      urgency: 'Flash Sale: Free Braided Type-C Cable for the first 100 orders only',
      pageGoal: 'Shopify Product Page with 1-Click Buy Now button and customer video reviews',
      campaignName: 'Summer Tech Gear Upgrade',
      duration: '7 days',
      channels: 'Meta Ads, Google Search, TikTok, Instagram Carousel, Email Cart Recovery',
      launchName: 'PulseCharge GaN Station Drop',
    }
  },
  {
    id: 'b2b_agency_retainer',
    label: '🤝 B2B Performance Agency / High-Ticket Services',
    businessModel: 'b2b',
    badge: 'High Ticket',
    description: 'Client acquisition engine for digital agencies and consultants offering retainers ($1,500 - $5,000/mo).',
    inputs: {
      topic: 'Full-Funnel Meta Ads & CRO Scaling for 7-Figure Ecommerce Brands',
      productName: 'Performance Growth Engine Retainer',
      offer: 'Free 30-Minute Growth Audit & Creative Ad Leak Diagnostic (No Pitch Guarantee)',
      goal: 'Book qualified discovery calls with e-commerce brand owners and founders',
      audience: 'Ecommerce founders and marketing directors doing $20k - $100k/mo looking to scale profitably',
      notes: 'Retainer pricing $2,500/mo + revenue share. Minimum $10k/mo ad spend requirement to qualify.',
      product: 'Ecommerce Performance Marketing Retainer',
      buyerPain: 'Rising ad costs, ROAS dropping below 2.0, burned by cheap agencies who delivered poor vanity metrics',
      proof: 'Generated over $14M in verified client revenue with average 3.8x blended ROAS across 42 brands',
      sequenceType: '4-Step Outbound Cold Outreach & LinkedIn Authority Campaign',
      urgency: 'Only taking 2 new brands this quarter for dedicated senior focus',
      pageGoal: 'Book a Strategy Audit Call on Calendly after viewing VSL breakdown',
      campaignName: 'Q2 Ecommerce Scale Sprint',
      duration: '30 days',
      channels: 'LinkedIn Outbound, Cold Email, Meta Video Retargeting, Case Study Carousels',
      launchName: 'Agency Client Acquisition Machine',
    }
  },
  {
    id: 'b2b_saas_trial',
    label: '🚀 B2B SaaS Product Launch & Free Trial',
    businessModel: 'saas',
    badge: 'Product Led',
    description: 'Product-led growth campaign driving free trial signups and friction-free onboarding.',
    inputs: {
      topic: 'AI Marketing Automation & Multi-Channel Social Hub for SMEs',
      productName: 'GrowthPilot AI Social Suite',
      offer: '14-Day Full Feature Free Trial (No Credit Card Required) + 5 Free Viral Scripts',
      goal: 'Free trial signups, active daily users, and paid upgrade conversions',
      audience: 'Small business owners, digital marketing agencies, content creators, and startup founders',
      notes: 'Replaces 4 fragmented tools (Buffer, Copy.ai, Hootsuite, Canva prompts) into 1 unified workspace.',
      product: 'GrowthPilot AI Marketing Suite',
      buyerPain: 'Spending 15 hours a week writing repetitive posts, hiring costly copywriters, inconsistent posting',
      proof: 'Used by 8,000+ marketers and business owners to produce over 120,000 published content assets',
      sequenceType: 'Trial Onboarding & Activation Email Sequence',
      urgency: 'Early Adopter pricing locked for life during this launch window',
      pageGoal: 'Direct Free Trial Signup Page with interactive live demo preview',
      campaignName: 'Version 2.0 Global Launch',
      duration: '14 days',
      channels: 'Product Hunt, LinkedIn, Twitter/X, Email Newsletter, Meta Retargeting',
      launchName: 'GrowthPilot 2.0 Product Launch',
    }
  }
];

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
  adCreatives: [],
  chatClosingScripts: [],
  campaignPhases: [],
  guaranteeAndRiskReversal: '',
  unitEconomicsAdvice: '',
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
  const sections: string[] = [
    asset.title,
    `Tool: ${asset.tool}`,
    `Language: ${asset.language}`,
    asset.createdAt ? `Created: ${new Date(asset.createdAt).toLocaleString()}` : '',
    '',
    'Executive Summary',
    resultValue.executiveSummary,
  ];

  if (resultValue.adCreatives && resultValue.adCreatives.length > 0) {
    sections.push('', '--- AD CREATIVES & DIRECT COPY ---');
    resultValue.adCreatives.forEach((c, idx) => {
      sections.push(
        `\n[Angle ${idx + 1}: ${c.angleName} (${c.platform})]`,
        `Hook: ${c.hook}`,
        `Body:\n${c.bodyCopy}`,
        `CTA: ${c.callToAction}`,
        c.visualDirection ? `Visual Direction: ${c.visualDirection}` : ''
      );
    });
  }

  if (resultValue.chatClosingScripts && resultValue.chatClosingScripts.length > 0) {
    sections.push('', '--- MESSENGER & WHATSAPP CLOSING SCRIPTS ---');
    resultValue.chatClosingScripts.forEach((s, idx) => {
      sections.push(
        `\n[Trigger: "${s.customerTrigger}"]`,
        `Angle: ${s.psychologicalAngle}`,
        `Script:\n${s.salesScript}`,
        `Next Action: ${s.nextStepCta}`
      );
    });
  }

  if (resultValue.campaignPhases && resultValue.campaignPhases.length > 0) {
    sections.push('', '--- CAMPAIGN PHASES & ROADMAP ---');
    resultValue.campaignPhases.forEach((p) => {
      sections.push(
        `\n[${p.phaseName}]`,
        `Objective: ${p.objective}`,
        `Key Action: ${p.keyAction}`,
        `Copy/Script:\n${p.copyOrScriptSnippet}`
      );
    });
  }

  if (resultValue.guaranteeAndRiskReversal) {
    sections.push('', 'Guarantee & Risk Reversal', resultValue.guaranteeAndRiskReversal);
  }

  if (resultValue.unitEconomicsAdvice) {
    sections.push('', 'Unit Economics & Pricing Advice', resultValue.unitEconomicsAdvice);
  }

  sections.push(
    '',
    'Primary Output',
    resultValue.primaryOutput,
    '',
    'Strategy',
    ...(resultValue.strategy || []).map(item => `- ${item}`),
    '',
    'Variations',
    ...(resultValue.variations || []).map(item => `- ${item}`),
    '',
    'Quality Checklist',
    ...(resultValue.checklist || []).map(item => `- ${item}`),
    '',
    'Next Best Actions',
    ...(resultValue.nextBestActions || []).map(item => `- ${item}`),
    '',
    'Inputs',
    JSON.stringify(asset.inputs || {}, null, 2)
  );

  return sections.filter(line => line !== undefined).join('\n');
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
