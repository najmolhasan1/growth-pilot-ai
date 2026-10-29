import { NextResponse } from 'next/server';
import { extractJsonText, generateGeminiText } from '@/lib/gemini';

type BrandProfile = {
  businessName?: string;
  industry?: string;
  businessType?: string;
  website?: string;
  location?: string;
  audience?: string;
  offer?: string;
  productService?: string;
  priceRange?: string;
  competitors?: string;
  tone?: string;
  language?: string;
  goals?: string;
  objections?: string;
  brandVoice?: string;
  bannedWords?: string;
};

type AdCreativeItem = {
  angleName: string;
  platform: string;
  hook: string;
  bodyCopy: string;
  callToAction: string;
  visualDirection?: string;
};

type ChatClosingScript = {
  customerTrigger: string;
  psychologicalAngle: string;
  salesScript: string;
  nextStepCta: string;
};

type CampaignPhase = {
  phaseName: string;
  objective: string;
  keyAction: string;
  copyOrScriptSnippet: string;
};

type MarketingRequest = {
  tool?: string;
  language?: string;
  businessModel?: string; // 'fcommerce' | 'ecommerce' | 'b2b' | 'saas'
  brandProfile?: BrandProfile;
  inputs?: Record<string, string>;
};

type MarketingResult = {
  executiveSummary: string;
  assumptions: string[];
  missingInputs: string[];
  strategy: string[];
  primaryOutput: string;
  variations: string[];
  checklist: string[];
  nextBestActions: string[];
  adCreatives?: AdCreativeItem[];
  chatClosingScripts?: ChatClosingScript[];
  campaignPhases?: CampaignPhase[];
  guaranteeAndRiskReversal?: string;
  unitEconomicsAdvice?: string;
};

type VideoSourceInsight = {
  title?: string;
  transcript?: string;
  warning?: string;
};

const toolLabels: Record<string, string> = {
  social_campaign: 'social media campaign',
  product_copy: 'product page copy',
  product_photography: 'product photography creative direction',
  email_campaign: 'email campaign',
  sms_campaign: 'SMS campaign',
  landing_page: 'landing page copy',
  video_repurpose: 'video content optimization kit',
  campaign_planner: 'multi-channel campaign plan',
  launch_pack: 'complete launch campaign pack',
  strategy_audit: 'growth strategy audit',
};

function sanitizeRecord(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object') return {};
  return Object.entries(input as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value.slice(0, 5000) : '';
    return acc;
  }, {});
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function youtubeIdFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null;
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null;
      return url.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

function secondsToTimestamp(secondsValue: number) {
  const seconds = Math.max(0, Math.floor(secondsValue));
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

async function fetchWithTimeout(url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 SEO-Automation' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getVideoSourceInsight(sourceLink?: string): Promise<VideoSourceInsight> {
  if (!sourceLink) return {};
  const videoId = youtubeIdFromUrl(sourceLink);
  if (!videoId) {
    return { warning: 'Drive/private links need a transcript or accessible captions for exact timestamps.' };
  }

  const insight: VideoSourceInsight = {};
  try {
    const oembed = await fetchWithTimeout(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembed.ok) {
      const data = await oembed.json() as { title?: string };
      insight.title = data.title;
    }
  } catch {
    // Metadata is helpful but not required.
  }

  try {
    const watch = await fetchWithTimeout(`https://www.youtube.com/watch?v=${videoId}`);
    if (!watch.ok) return insight;
    const html = await watch.text();
    const captionMatch = html.match(/"captionTracks":(\[.*?\])[,}]/);
    if (!captionMatch?.[1]) {
      return { ...insight, warning: 'No public YouTube captions were found. Output uses title/link context and suggested timestamps.' };
    }

    const tracks = JSON.parse(captionMatch[1].replace(/\\"/g, '"')) as Array<{ baseUrl?: string; languageCode?: string; name?: { simpleText?: string } }>;
    const track = tracks.find(item => item.languageCode?.startsWith('en')) || tracks[0];
    if (!track?.baseUrl) return insight;

    const transcriptResponse = await fetchWithTimeout(decodeHtml(track.baseUrl));
    if (!transcriptResponse.ok) return insight;
    const transcriptXml = await transcriptResponse.text();
    const transcript = Array.from(transcriptXml.matchAll(/<text start="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g))
      .map(match => `${secondsToTimestamp(Number(match[1]))} ${decodeHtml(match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())}`)
      .filter(line => line.trim().length > 6)
      .join('\n')
      .slice(0, 12000);
    if (transcript) insight.transcript = transcript;
  } catch {
    return { ...insight, warning: 'Transcript could not be loaded automatically. Output uses available context and suggested timestamps.' };
  }

  return insight;
}

function normalizeList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const clean = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  return clean.length ? clean : fallback;
}

function normalizeAdCreatives(value: unknown, fallback: AdCreativeItem[] = []): AdCreativeItem[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const items = value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      angleName: String(item.angleName || item.angle || 'Direct Hook'),
      platform: String(item.platform || 'Meta / Facebook & Instagram'),
      hook: String(item.hook || '').trim(),
      bodyCopy: String(item.bodyCopy || item.body || item.primaryText || '').trim(),
      callToAction: String(item.callToAction || item.cta || 'Order Now / Send Message').trim(),
      visualDirection: item.visualDirection ? String(item.visualDirection).trim() : undefined,
    }))
    .filter(item => item.hook.length > 0 || item.bodyCopy.length > 0)
    .slice(0, 6);
  return items.length ? items : fallback;
}

function normalizeChatScripts(value: unknown, fallback: ChatClosingScript[] = []): ChatClosingScript[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const items = value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      customerTrigger: String(item.customerTrigger || item.trigger || 'Inquiry').trim(),
      psychologicalAngle: String(item.psychologicalAngle || item.angle || 'Value framing').trim(),
      salesScript: String(item.salesScript || item.script || item.response || '').trim(),
      nextStepCta: String(item.nextStepCta || item.cta || 'অর্ডার কনফার্ম করতে নাম ও মোবাইল নম্বর দিন').trim(),
    }))
    .filter(item => item.salesScript.length > 0)
    .slice(0, 6);
  return items.length ? items : fallback;
}

function normalizeCampaignPhases(value: unknown, fallback: CampaignPhase[] = []): CampaignPhase[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const items = value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      phaseName: String(item.phaseName || item.name || 'Campaign Phase').trim(),
      objective: String(item.objective || '').trim(),
      keyAction: String(item.keyAction || item.action || '').trim(),
      copyOrScriptSnippet: String(item.copyOrScriptSnippet || item.copy || item.snippet || '').trim(),
    }))
    .filter(item => item.phaseName.length > 0)
    .slice(0, 6);
  return items.length ? items : fallback;
}

function normalizeResult(value: unknown, request: { tool: string; language: string; businessModel?: string; brandProfile?: BrandProfile; inputs?: Record<string, string> }): MarketingResult {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const label = toolLabels[request.tool] || 'marketing asset';
  const fallback = fallbackResult(request.tool, request.language, request.businessModel, request.brandProfile, request.inputs);
  const primaryOutput = typeof data.primaryOutput === 'string' ? data.primaryOutput.trim() : '';
  const weakPrimaryOutput = primaryOutput.length < 120 || primaryOutput.toLowerCase().includes('draft a focused');

  return {
    executiveSummary: typeof data.executiveSummary === 'string' && data.executiveSummary.trim()
      ? data.executiveSummary.trim()
      : fallback.executiveSummary,
    assumptions: normalizeList(data.assumptions, fallback.assumptions || []),
    missingInputs: normalizeList(data.missingInputs, fallback.missingInputs || []),
    strategy: normalizeList(data.strategy, fallback.strategy || []),
    primaryOutput: primaryOutput && !weakPrimaryOutput
      ? primaryOutput
      : fallback.primaryOutput || `Create a focused ${label} around one clear buyer pain, one specific promise, and one next action.`,
    variations: normalizeList(data.variations, fallback.variations || []),
    checklist: normalizeList(data.checklist, fallback.checklist || []),
    nextBestActions: normalizeList(data.nextBestActions, fallback.nextBestActions || []),
    adCreatives: normalizeAdCreatives(data.adCreatives, fallback.adCreatives),
    chatClosingScripts: normalizeChatScripts(data.chatClosingScripts, fallback.chatClosingScripts),
    campaignPhases: normalizeCampaignPhases(data.campaignPhases, fallback.campaignPhases),
    guaranteeAndRiskReversal: typeof data.guaranteeAndRiskReversal === 'string' && data.guaranteeAndRiskReversal.trim()
      ? data.guaranteeAndRiskReversal.trim()
      : fallback.guaranteeAndRiskReversal,
    unitEconomicsAdvice: typeof data.unitEconomicsAdvice === 'string' && data.unitEconomicsAdvice.trim()
      ? data.unitEconomicsAdvice.trim()
      : fallback.unitEconomicsAdvice,
  };
}

function fallbackResult(tool: string, language: string, businessModel: string = 'fcommerce', brandProfile: BrandProfile = {}, inputs: Record<string, string> = {}): MarketingResult {
  const label = toolLabels[tool] || 'marketing asset';
  const isBengali = language.toLowerCase().includes('bang');
  const business = brandProfile.businessName || 'আপনার বিজনেস';
  const audience = brandProfile.audience || inputs.audience || 'টার্গেট অডিয়েন্স';
  const offer = inputs.offer || brandProfile.offer || inputs.topic || inputs.product || 'স্পেশাল অফার';
  const goal = inputs.goal || inputs.pageGoal || inputs.sequenceType || 'অর্ডার ও সেলস বৃদ্ধি';
  const proof = inputs.proof || '১০০% অরিজিনাল কোয়ালিটি ও কাস্টমার রিভিউ';
  const duration = inputs.duration || '১৪ দিন';
  const channels = inputs.channels || inputs.platform || 'Facebook, Instagram & Messenger';
  const launchName = inputs.launchName || inputs.campaignName || 'Campaign Launch';
  const currentSituation = inputs.currentSituation || 'বর্তমানে রেগুলার সেলস হচ্ছে কিন্তু অ্যাড খরচ বেশি ও রিটার্ন রেশিও কমাতে হবে';
  const constraints = inputs.constraints || 'সীমিত বাজেট ও ডেলিভারি কুরিয়ার চ্যালেঞ্জ';
  const assets = inputs.assets || 'Facebook Page, WhatsApp Business & Customer Reviews';
  const market = inputs.priorityMarket || brandProfile.location || 'Bangladesh';
  const topic = inputs.topic || inputs.videoTitle || offer;
  const productName = inputs.productName || inputs.product || offer;
  const productDetails = inputs.productDetails || inputs.notes || brandProfile.productService || 'প্রোডাক্ট ডিটেইলস ও স্পেসিফিকেশন';
  const visualGoal = inputs.visualGoal || 'প্রিমিয়াম কনভার্সন-ফোকাসড প্রডাক্ট ভিজ্যুয়াল';
  const platforms = inputs.platforms || inputs.platform || 'Facebook, Instagram & Website';
  const productionNotes = inputs.constraints || inputs.notes || 'ন্যাচারাল লাইটিং ও ক্লিয়ার ডিটেইল শোকেস';
  const platform = inputs.platform || 'YouTube Shorts, Meta Reels & TikTok';
  const videoGoal = inputs.videoGoal || goal || 'ভিউয়ারদের কাস্টমারে কনভার্ট করা';
  const transcript = inputs.transcript || 'No full transcript was provided, so this plan uses the topic, link, and notes as the source.';
  const transcriptWarning = inputs.transcriptWarning || '';

  // Generate real-world CMO assets tailored to the Business Model
  const isFcom = businessModel === 'fcommerce';
  const isB2B = businessModel === 'b2b';
  const isSaas = businessModel === 'saas';

  const adCreatives: AdCreativeItem[] = isFcom ? [
    {
      angleName: 'রিস্ক-ফ্রি ক্যাশ অন ডেলিভারি অ্যাঙ্গেল (High Trust COD)',
      platform: 'Meta Ads (Facebook & Instagram Feed/Reels)',
      hook: `🔥 অনলাইনে কেনাকাটায় ছবি একরকম আর ডেলিভারিতে অন্যরকম পাওয়ার ভয় পাচ্ছেন?`,
      bodyCopy: `আমরা দিচ্ছি ১০০% নিশ্চিত সমাধান! 
${business}-এ আপনি পাচ্ছেন প্রিমিয়াম কোয়ালিটির ${productName}। সবচেয়ে বড় সুবিধা—আমাদের পার্সেল হাতে পেয়ে ডেলিভারি ম্যানের সামনে খুলে চেক করে তারপর মূল্য পরিশোধ করতে পারবেন।

✅ কোনো অগ্রিম টাকা ছাড়াই ক্যাশ অন ডেলিভারিতে অর্ডার করুন।
✅ কোয়ালিটি ১০০% পছন্দ না হলে সাথে সাথে রাইডারকে ফেরত দেওয়ার সুযোগ।
✅ সারা বাংলাদেশে ৩-৫ দিনে সুপার ফাস্ট ডেলিভারি।

স্টক দ্রুত শেষ হয়ে যাচ্ছে! এখনই "Send Message" বাটনে ক্লিক করে আপনার সাইজ ও পছন্দের কালার বুক করুন।`,
      callToAction: 'অর্ডার করতে ইনবক্স করুন / Send Message',
      visualDirection: 'উন্মুক্ত লাইভ প্রোডাক্ট আনবক্সিং ভিডিও, ডেলিভারি বক্স থেকে প্রোডাক্ট বের করে ডিটেইল ফেব্রিক/ম্যাটেরিয়াল ক্লোজআপ দেখানো।'
    },
    {
      angleName: 'পেইন পয়েন্ট ও লাইফস্টাইল সলিউশন (Agitation & Fix)',
      platform: 'Meta Ads (Reels 9:16 Video Ad)',
      hook: `প্রতিদিনের এই বিরক্তিকর সমস্যায় আপনিও কি ভুগছেন?`,
      bodyCopy: `${audience}-দের জন্য তৈরি বিশেষ ${productName}। যা দেবে ১০০% আরাম ও স্থায়ী সমাধান। নকল পণ্যের ভিড়ে অরিজিনাল কোয়ালিটি বেছে নিন।

👉 আজই অর্ডার করলে পাচ্ছেন বিশেষ ডিসকাউন্ট + ক্যাশ অন ডেলিভারি সুবিধা!`,
      callToAction: 'Order Now / শপ করুন',
      visualDirection: 'প্রথম ৩ সেকেন্ডে কাস্টমারের সমস্যা ও বিরক্তি মুখের এক্সপ্রেশন, ৪ নম্বর সেকেন্ডে প্রোডাক্ট সমাধান ও স্মাইল।'
    },
    {
      angleName: 'বান্ডেল অফার ও ফ্রি ডেলিভারি (AOV Maximizer)',
      platform: 'Facebook Carousel / Image Ad',
      hook: `১টি কিনলে ডেলিভারি চার্জ প্রযোজ্য, কিন্তু যেকোনো ২টি নিলে ডেলিভারি সম্পূর্ণ ফ্রি! 🚚`,
      bodyCopy: `আপনার নিজের জন্য অথবা প্রিয়জনকে উপহার দিতে এখনই বেছে নিন আমাদের বেস্ট সেলিং ${productName} প্যাকেজ। 

📦 লিমিটেড এডিশন স্টক। অফারটি শুধুমাত্র চলতি সপ্তাহের জন্য প্রযোজ্য।`,
      callToAction: 'মেসেজ পাঠিয়ে অফার বুক করুন',
      visualDirection: '২টি কালার ভ্যারিয়েন্ট একসাথে সাজানো, সাথে লাল রঙের "FREE DELIVERY" ব্যাজ স্টিকার।'
    }
  ] : isB2B ? [
    {
      angleName: 'ফাউন্ডার পেইন ও ROI কিলার অ্যাঙ্গেল',
      platform: 'LinkedIn Sponsored Post & Meta B2B Ad',
      hook: `Are you still burning \$3,000+/mo on generic marketing that yields unqualified leads?`,
      bodyCopy: `If you are running a B2B company, your biggest bottleneck isn't traffic—it's predictable pipeline velocity.

At ${business}, we install a battle-tested acquisition architecture for ${audience}. No junior retainers, no fluff metrics—just qualified decision-maker conversations booked on your calendar.

Here is what we deliver:
- 100% ICP-aligned outbound engine
- High-converting VSL & objection-proof landing page
- Guaranteed qualified discovery calls or milestone refund

Stop guessing your monthly pipeline. Claim our Free 15-Minute Growth Audit breakdown.`,
      callToAction: 'Book Free Growth Audit (Calendly)',
      visualDirection: 'Clean screenshot of real client pipeline dashboard, zero stock photos, minimalist high-contrast typography.'
    },
    {
      angleName: 'কেস স্টাডি ব্রেকডাউন (Proof-First)',
      platform: 'LinkedIn Carousel & Twitter/X Thread Ad',
      hook: `How we took a struggling agency from zero outbound to \$45,000 MRR in 90 days.`,
      bodyCopy: `Most founders make the same 3 mistakes when trying to scale:
1. Selling features instead of guaranteed business outcomes.
2. Pitching on cold messages without prior value framing.
3. Lack of a unified CRM closing workflow.

Read the full teardown of the exact framework we used:`,
      callToAction: 'Get the Free 5-Page Case Study Teardown',
      visualDirection: 'Founder desk setup, Notion document breakdown snapshot with blurred proprietary data highlights.'
    }
  ] : [
    {
      angleName: 'D2C Unboxing & Social Proof Transformation',
      platform: 'Meta & TikTok Video Ad (9:16)',
      hook: `I tested 5 different brands so you don't have to... and this one completely shocked me!`,
      bodyCopy: `Meet ${productName} by ${business}. Designed specifically for ${audience}. 

Over 10,000+ happy customers can't be wrong. Try it 100% risk-free with our 30-day money-back guarantee.`,
      callToAction: 'Shop Now (Get 15% Off Your First Order)',
      visualDirection: 'UGC creator holding the phone casually, showing honest reaction and immediate product application.'
    },
    {
      angleName: 'Comparison & Objection Crusher (Us vs Them)',
      platform: 'Instagram Carousel Ad',
      hook: `Stop settling for cheap alternatives that break after 2 weeks.`,
      bodyCopy: `Here is why thousands are switching to ${productName}:
❌ Regular Market Alternatives: Cheap build, zero warranty, slow support.
✅ ${business} Standard: Premium grade, backed by 1-year replacement warranty, 2-day delivery.`,
      callToAction: 'Claim Your Special Price Today',
      visualDirection: 'Side-by-side split comparison table with clean green checkmarks and red crosses.'
    }
  ];

  const chatClosingScripts: ChatClosingScript[] = isFcom ? [
    {
      customerTrigger: 'কাস্টমার মেসেজ: "ভাইয়া দাম কত?" বা "Price please?"',
      psychologicalAngle: 'Value-First Anchoring (দাম বলার আগে পণ্যের প্রিমিয়াম ভ্যালু ও ডেলিভারি নিরাপত্তা নিশ্চিত করা)',
      salesScript: `আসসালামু আলাইকুম স্যার/ম্যাম! ❤️ আমাদের প্রিমিয়াম কোয়ালিটির ${productName}-এর রেগুলার প্রাইস ছিল [রেগুলার প্রাইস] টাকা, তবে আজকের স্পেশাল অফারে আপনি পাচ্ছেন মাত্র [অফার প্রাইস] টাকায়! 

সবচেয়ে বড় সুবিধা—আপনাকে আগে ১ টাকাও অগ্রিম দিতে হবে না। পার্সেল হাতে পেয়ে ডেলিভারি ম্যানের সামনে চেক করে তারপর পেমেন্ট করতে পারবেন। আপনি কি [কালার/সাইজ]-টি নিতে চাচ্ছেন?`,
      nextStepCta: 'পছন্দের সাইজ বা কালার কনফার্ম করুন'
    },
    {
      customerTrigger: 'কাস্টমার মেসেজ: "ডেলিভারি চার্জ কি ফ্রি দেওয়া যাবে?"',
      psychologicalAngle: 'Order Value Bump (AOV বৃদ্ধি করার কৌশল)',
      salesScript: `স্যার, সাধারণত কুরিয়ার কোম্পানির ডেলিভারি চার্জ প্রযোজ্য থাকে। তবে আপনার জন্য একটি দারুণ স্পেশাল অফার আছে! আপনি যদি নিজের জন্য অথবা গিফটের জন্য একসাথে যেকোনো ২টি প্রডাক্ট অর্ডার করেন, তবে কোম্পানি থেকে সম্পূর্ণ ডেলিভারি চার্জ একদম ফ্রি করে দেওয়া হবে! 🎁

আপনি কি ২টি অফার প্যাকেজে নিয়ে ডেলিভারি ফ্রি করে দিতে বলব?`,
      nextStepCta: '২টি অর্ডার করে ফ্রি ডেলিভারি একটিভ করুন'
    },
    {
      customerTrigger: 'কাস্টমার মেসেজ: "অরিজিনাল তো? ছবি আর প্রোডাক্ট এক হবে তো?"',
      psychologicalAngle: 'Risk-Elimination & Ironclad Trust (ক্যাশ অন ডেলিভারি ট্রাস্ট)',
      salesScript: `আপনার এই চিন্তাটি একদম যৌক্তিক স্যার। অনলাইনে এমন অভিজ্ঞতা অনেকেরই হয়। আর এই কারণেই আমরা কাস্টমারকে ১০০% নিরাপত্তা দিই—

আমাদের পণ্য হাতে পেয়ে ডেলিভারি রাইডারের সামনে প্যাকেট খুলে কোয়ালিটি স্বচক্ষে যাচাই করবেন। যদি ছবির সাথে বা বর্ণনার সাথে ১% অমিল পান, তবে ডেলিভারি ম্যানের কাছেই পার্সেলটি রিটার্ন করে দিতে পারবেন, কোনো চার্জ ছাড়াই! 

আমরা কি আপনার অর্ডারটি কনফার্ম করে প্রডাক্টটি হোল্ড করব? অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা দিন।`,
      nextStepCta: 'নাম, মোবাইল ও ডেলিভারি ঠিকানা পাঠিয়ে অর্ডার কনফার্ম করুন'
    },
    {
      customerTrigger: 'কাস্টমার মেসেজ: "একটু ভেবে জানাচ্ছি" বা সিন করে রিপ্লাই দেয়নি (Follow-up)',
      psychologicalAngle: 'Gentle Scarcity & Reservation Hold',
      salesScript: `স্যার, আপনি যে ${productName}-টি পছন্দ করেছিলেন, সেটির স্টক খুবই সীমিত হয়ে এসেছে এবং আজকের স্পেশাল অফারটি আর অল্প কিছুক্ষণ থাকবে। আপনার জন্য কি ১ পিস সাইড করে আলাদা রেখে দেব? জানালে আমরা প্যাকেজিং প্রসেস করে রাখব।`,
      nextStepCta: 'রিজার্ভ করতে "হ্যাঁ" লিখে জানান'
    }
  ] : isB2B ? [
    {
      customerTrigger: 'Prospect: "How much do you charge / What is your pricing?"',
      psychologicalAngle: 'Diagnosis & Scope Anchoring (Never quote a price before scoping)',
      salesScript: `Great question! Our pricing is completely tied to your current pipeline volume and target outcome—we offer fixed milestone models ranging from \$1,500 to \$5,000/mo with a guaranteed ROI clause. 

To give you an exact no-surprise number: Are you looking to generate net-new outbound pipeline, or optimize your current conversion funnel? Let's take 10 minutes on Zoom to run through your numbers.`,
      nextStepCta: 'Send Calendly link or propose 2 specific meeting slots'
    },
    {
      customerTrigger: 'Prospect: "We already have an in-house team / current agency."',
      psychologicalAngle: 'Non-Threatening Coexistence & Audit Offer',
      salesScript: `That makes total sense! Most companies we partner with already have an internal team or media buyer. 

We don't replace them—we plug into their blind spots by providing the proprietary outbound architecture and VSL closing script that doubles their booked call efficiency. Would you be open to a 10-minute video audit of your current outbound cadence to share with your team? No pitch, just raw insights.`,
      nextStepCta: 'Offer free 5-minute Loom audit'
    },
    {
      customerTrigger: 'Prospect: "Send me some information/proposal over email."',
      psychologicalAngle: 'Value Filter & Micro-Commitment',
      salesScript: `I'd love to! Rather than sending a bloated 30-page generic PDF, I want to make sure I only send what is 100% relevant to ${business}. 

What is your single biggest customer acquisition priority for the next quarter? Once you let me know, I'll send over the exact 1-page case study matching that scenario.`,
      nextStepCta: 'Identify the primary bottleneck'
    }
  ] : [
    {
      customerTrigger: 'Cart Abandonment SMS / WhatsApp: Buyer left at checkout',
      psychologicalAngle: 'Friction Removal + 10% Immediate Incentive',
      salesScript: `Hey {{name}}, noticed you left your ${productName} behind in your bag! 🛒

We saved your items, but stock is reserved for only 2 more hours. Use code SAVE10 at checkout right now for an extra 10% off + free express shipping: [Link]`,
      nextStepCta: 'Complete checkout link'
    },
    {
      customerTrigger: 'Customer Ask: "What if it doesn\'t fit / What if I don\'t like it?"',
      psychologicalAngle: 'Zero-Risk Return Assurance',
      salesScript: `We offer a 100% hassle-free 30-day return & exchange policy! If you are not completely in love with your ${productName}, simply message us here and our courier will pick it up directly from your doorstep with an instant refund. Zero stress.`,
      nextStepCta: 'Order safely with 30-day money-back guarantee'
    }
  ];

  const campaignPhases: CampaignPhase[] = [
    {
      phaseName: 'Phase 1: Pre-Launch Hype & Curiosity (Days 1–3)',
      objective: 'অডিয়েন্সের মধ্যে আগ্রহ ও কৌতূহল তৈরি করা, লিড বা ওয়েটিং লিস্টে যুক্ত করা।',
      keyAction: 'টিজার পোস্ট, বিহাইন্ড দ্য সিন ভিডিও রিলস, এবং ভিআইপি প্রি-বুকিং ইনবক্স ওপেন।',
      copyOrScriptSnippet: `🔥 বড় কিছু আসতে যাচ্ছে ${audience}-দের জন্য! আগামী শুক্রবার ড্রপ হচ্ছে আমাদের নতুন কালেকশন। যারা আগে বুক করবেন তাদের জন্য থাকছে সারপ্রাইজ গিফট।`
    },
    {
      phaseName: 'Phase 2: Launch Drop & VIP Offer (Days 4–7)',
      objective: 'সর্বোচ্চ ভলিউমে ডিরেক্ট সেলস কনভার্সন এবং প্রথম ৪০০-৫০০ অর্ডার নিশ্চিত করা।',
      keyAction: 'ফুল মেটা অ্যাড স্কেলিং, ম্যাসেঞ্জার অটোমেশন এক্টিভেশন, এবং ফ্রি ডেলিভারি অফার লঞ্চ।',
      copyOrScriptSnippet: `🎉 ফাইনালি ড্রপ হলো বহুল প্রতীক্ষিত ${productName}! ১ম ১০০ জন ক্রেতা পাচ্ছেন ফ্রি হোম ডেলিভারি ও বিশেষ ছাড়। এখনই ইনবক্সে মেসেজ পাঠিয়ে সাইজ কনফার্ম করুন!`
    },
    {
      phaseName: 'Phase 3: Social Proof & Customer Reviews (Days 8–11)',
      objective: 'যারা দ্বিধাদ্বন্দ্বে ছিল তাদের রিয়েল কাস্টমার রিভিউ ও আনবক্সিং ভিডিও দেখিয়ে ক্লোজ করা।',
      keyAction: 'কাস্টমার ফিডব্যাক স্ক্রিনশট, আনবক্সিং রিলস ও রাইডারের সামনে চেক করার ভিডিও পাবলিশ।',
      copyOrScriptSnippet: `⭐ "ছবিতে যেমন দেখেছি সামনাসামনি তার চেয়েও সুন্দর!" শুনুন আমাদের সন্তুষ্ট কাস্টমারদের অভিমত। ডেলিভারি ম্যানের সামনে চেক করে নেওয়ার সুযোগ তো থাকছেই।`
    },
    {
      phaseName: 'Phase 4: 48-Hour Scarcity & Stock Clearance (Days 12–14)',
      objective: 'লাস্ট চান্স কল টু অ্যাকশন দিয়ে ক্যাম্পেইনের সর্বোচ্চ সেলস বের করে আনা।',
      keyAction: 'কাউন্টডাউন নোটিশ, লাস্ট ৩০ পিস রিমাইন্ডার এবং স্পেশাল বান্ডেল পুশ।',
      copyOrScriptSnippet: `⚠️ শেষ সুযোগ! আর মাত্র [সংখ্যা] পিস অবশিষ্ট আছে। অফার প্রাইস শেষ হতে মাত্র ৪৮ ঘণ্টা বাকি। আপনার পিসটি আজই নিশ্চিত করুন!`
    }
  ];

  const guaranteeAndRiskReversal = isFcom
    ? `🛡️ রাইডারের সামনে প্রোডাক্ট চেক করার ১০০% গ্যারান্টি: ডেলিভারি ম্যানের সামনে পার্সেল খুলে কোয়ালিটি ও সাইজ স্বচক্ষে দেখে বুঝে নিন। পছন্দ না হলে বা ১% অমিল থাকলেও কোনো ঝামেলা ছাড়াই তৎক্ষণাৎ রিটার্ন করুন।`
    : isB2B
    ? `🛡️ 100% Outcome-Based Risk Reversal: If we don't deliver the qualified pipeline milestones within the agreed 60-day window, we work for free until you hit the numbers, or refund your retainer in full.`
    : `🛡️ 30-Day Hassle-Free Money Back Guarantee: Test ${productName} for a full 30 days. If you aren't completely thrilled, we pick it up from your door and refund every penny. No questions asked.`;

  const unitEconomicsAdvice = isFcom
    ? `📊 F-Commerce Unit Economics Playbook:
1. মার্জিন টার্গেট: প্রোডাক্টের সোর্সিং খরচের ওপর নূন্যতম ৫০%–৬০% গ্রস মার্জিন নিশ্চিত করুন।
2. কুরিয়ার রিটার্ন রেট কন্ট্রোল: ডেলিভারি ফেইল্ড বা রিটার্ন রেট ১০% এর নিচে রাখতে পার্সেল ডিসপ্যাচ করার আগে প্রতি কাস্টমারকে ভেরিফিকেশন কল করুন।
3. AOV বুস্টিং: একাধিক প্রোডাক্ট অর্ডারে 'ফ্রি ডেলিভারি' বা 'বান্ডেল ছাড়' অফার করুন। এতে ফেসবুক অ্যাড খরচের (CAC) উপর প্রতি অর্ডারের লাভ ৪০% বৃদ্ধি পায়।`
    : isB2B
    ? `📊 B2B High-Ticket Economics:
1. CAC to LTV Ratio: টার্গেট নূন্যতম 4:1। \$500 খরচ করে \$2,500+ এলটিভি ক্লায়েন্ট সাইন করা।
2. Discovery to Close Rate: নূন্যতম 25% ক্লোজিং রেট নিশ্চিত করতে প্রতি কলে ফিক্সড অবজেকশন স্ক্রিপ্ট ব্যবহার করুন।`
    : `📊 D2C Ecommerce Health Check:
1. Target ROAS: নূন্যতম 2.8x blended ROAS।
2. Post-Purchase Upsell: থ্যাঙ্ক ইউ পেজে ওয়ান-ক্লিক আপসেল যোগ করে Average Order Value (AOV) ১৫-২৫% বাড়ান।`;

  if (tool === 'video_repurpose') {
    const primaryOutput = isBengali
      ? `Video Content Kit\nTopic: ${topic}\nAudience: ${audience}\nPlatforms: ${platform}\nGoal: ${videoGoal}\n${transcriptWarning ? `Note: ${transcriptWarning}\n` : ''}\n1. Viral but Relevant Title Options\n- ${topic}: Beginner der jonno clear roadmap\n- ${topic} niye sobcheye boro mistake gulo\n- ${topic} shuru korar age ei 7 ta jinis janun\n- 2026 e ${topic}: ki change hocche and ki korte hobe\n- ${topic} explained with real practical steps\n\n2. Thumbnail Text Ideas\n- START HERE\n- STOP DOING THIS\n- 2026 ROADMAP\n- REAL STRATEGY\n- BEFORE YOU START\n\n3. SEO Optimized Description\nIn this video, we break down ${topic} for ${audience}. You will learn the main mistakes, practical steps, and how to use this topic to move closer to ${videoGoal}. Watch till the end for a simple action checklist.\n\n4. Chapters / Timestamps\n00:00 Intro and promise\n00:45 Why ${topic} matters\n02:00 Main mistake or problem\n04:00 Practical framework\n07:00 Example or breakdown\n09:00 Action checklist\n10:30 Final advice and CTA\n\n5. Reels / Shorts Ideas With Timestamps\n- 00:00-00:30 Hook: why most people misunderstand ${topic}\n- 00:45-01:15 Quick context: why it matters now\n- 02:00-02:30 Mistake clip: what to avoid\n- 04:00-04:45 Framework clip: 3-step explanation\n- 07:00-07:30 Example clip: practical breakdown\n- 09:00-09:30 Checklist clip: save-worthy advice\n- 10:00-10:30 CTA clip: what to do next\n\n6. 3-5 Minute Video Ideas With Timestamps\nIdea 1: ${topic} Beginner Roadmap\n00:00 Hook\n00:25 Problem\n01:00 3-step roadmap\n03:30 Example\n04:30 CTA\n\nIdea 2: ${topic} Mistakes to Avoid\n00:00 Bold mistake hook\n00:30 Mistake 1\n01:30 Mistake 2\n02:30 Mistake 3\n04:00 Fix and CTA\n\nIdea 3: ${topic} Practical Checklist\n00:00 Promise\n00:30 Checklist item 1\n01:30 Checklist item 2\n02:30 Checklist item 3\n03:45 Summary\n04:30 CTA\n\n7. Hashtags\n#${topic.replace(/[^a-zA-Z0-9]+/g, '')} #MarketingTips #BusinessGrowth #ContentStrategy #YouTubeGrowth #DigitalMarketing #CreatorTips #LearnOnline #GrowthStrategy #BanglaBusiness\n\n8. Video Tags\n${topic}, ${topic} tutorial, ${topic} guide, ${topic} for beginners, ${topic} strategy, ${topic} 2026, video marketing, content marketing, business growth, YouTube SEO, thumbnail ideas, video title ideas\n\n9. Source Notes Used\n${transcript.slice(0, 1500)}`
      : `Video Content Kit\nTopic: ${topic}\nAudience: ${audience}\nPlatforms: ${platform}\nGoal: ${videoGoal}\n${transcriptWarning ? `Note: ${transcriptWarning}\n` : ''}\n1. Viral but Relevant Title Options\n- ${topic}: The Clear Roadmap for Beginners\n- The Biggest Mistakes People Make With ${topic}\n- Before You Start ${topic}, Watch This\n- ${topic} in 2026: What Changed and What To Do\n- ${topic} Explained With Practical Steps\n\n2. Thumbnail Text Ideas\n- START HERE\n- STOP DOING THIS\n- 2026 ROADMAP\n- REAL STRATEGY\n- BEFORE YOU START\n\n3. SEO Optimized Description\nIn this video, we break down ${topic} for ${audience}. You will learn the main mistakes, practical steps, and how to use this topic to move closer to ${videoGoal}. Watch until the end for a simple action checklist.\n\n4. Chapters / Timestamps\n00:00 Intro and promise\n00:45 Why ${topic} matters\n02:00 Main mistake or problem\n04:00 Practical framework\n07:00 Example or breakdown\n09:00 Action checklist\n10:30 Final advice and CTA\n\n5. Reels / Shorts Ideas With Timestamps\n- 00:00-00:30 Hook: why most people misunderstand ${topic}\n- 00:45-01:15 Quick context: why it matters now\n- 02:00-02:30 Mistake clip: what to avoid\n- 04:00-04:45 Framework clip: 3-step explanation\n- 07:00-07:30 Example clip: practical breakdown\n- 09:00-09:30 Checklist clip: save-worthy advice\n- 10:00-10:30 CTA clip: what to do next\n\n6. 3-5 Minute Video Ideas With Timestamps\nIdea 1: ${topic} Beginner Roadmap\n00:00 Hook\n00:25 Problem\n01:00 3-step roadmap\n03:30 Example\n04:30 CTA\n\nIdea 2: ${topic} Mistakes to Avoid\n00:00 Bold mistake hook\n00:30 Mistake 1\n01:30 Mistake 2\n02:30 Mistake 3\n04:00 Fix and CTA\n\nIdea 3: ${topic} Practical Checklist\n00:00 Promise\n00:30 Checklist item 1\n01:30 Checklist item 2\n02:30 Checklist item 3\n03:45 Summary\n04:30 CTA\n\n7. Hashtags\n#${topic.replace(/[^a-zA-Z0-9]+/g, '')} #MarketingTips #BusinessGrowth #ContentStrategy #YouTubeGrowth #DigitalMarketing #CreatorTips #LearnOnline #GrowthStrategy #VideoMarketing\n\n8. Video Tags\n${topic}, ${topic} tutorial, ${topic} guide, ${topic} for beginners, ${topic} strategy, ${topic} 2026, video marketing, content marketing, business growth, YouTube SEO, thumbnail ideas, video title ideas\n\n9. Source Notes Used\n${transcript.slice(0, 1500)}`;

    return {
      executiveSummary: isBengali
        ? `${topic} video-er jonno title, thumbnail, SEO description, timestamps, hashtags, tags, and repurpose hooks ready.`
        : `A complete video optimization kit for ${topic}: titles, thumbnails, SEO description, timestamps, hashtags, tags, and repurpose hooks.`,
      assumptions: ['The transcript may be incomplete, so timestamps are suggested when exact timecodes are missing.', 'The video needs search relevance and clickable packaging, not misleading clickbait.'],
      missingInputs: ['Exact transcript with timecodes', 'Video length', 'Primary keyword and competitor videos'],
      strategy: ['Lead with search intent in the title.', 'Use thumbnail text that creates curiosity in 2-4 words.', 'Use chapters to improve viewer navigation and perceived quality.'],
      primaryOutput,
      variations: ['Search-first title route', 'Curiosity-first thumbnail route', 'Shorts-first repurpose route'],
      checklist: ['5 title options', 'Thumbnail text included', 'SEO description included', 'Timestamps included', 'Hashtags included', 'Video tags included', 'Shorts hooks included'],
      nextBestActions: ['Use auto captions or paste transcript for exact timestamps.', 'A/B test 2 thumbnail text options.', 'Turn 3 timestamp ideas into Shorts/Reels this week.'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  if (tool === 'strategy_audit') {
    const primaryOutput = isBengali
      ? `Business: ${business}\nMarket: ${market}\nGoal: ${goal}\nAudience: ${audience}\nCurrent situation: ${currentSituation}\nConstraints: ${constraints}\nExisting assets: ${assets}\n\n1. ICP Diagnosis\n- Best buyer: oi segment jara problem ta already feel kore and faster decision nite pare.\n- Avoid: low-budget, unclear need, or only free information seeker.\n- Trigger: time loss, revenue gap, operational pain, or missed opportunity.\n\n2. Positioning\n- Core message: ${business} helps ${audience} get closer to ${goal} through ${offer}.\n- Differentiator: make the promise believable with ${proof}.\n- Risk: generic messaging will make the business look like every alternative.\n\n3. Offer Strength\n- Strong part: ${offer} gives the campaign a clear center.\n- Improve: add proof, guarantee, deadline, bonus, or a sharper outcome.\n- Best CTA: one low-friction next step such as audit, demo, consultation, trial, or quote.\n\n4. Funnel Gaps\n- Awareness: publish pain-aware posts and useful education.\n- Trust: add case study, testimonial, process breakdown, or founder POV.\n- Conversion: use one landing page with objection handling and repeated CTA.\n\n5. Channel Priority\n- Primary: choose the channel where ${audience} already spends attention.\n- Secondary: email/SMS retargeting for warm leads.\n- Support: short video or carousel to explain the offer quickly.\n\n6. Next 7 Days\n- Day 1: clarify ICP and one strongest pain.\n- Day 2: write one landing page hero and CTA.\n- Day 3: create proof asset.\n- Day 4: publish educational post.\n- Day 5: publish objection-handling post.\n- Day 6: send email or DM follow-up.\n- Day 7: review responses and improve the offer angle.`
      : `Business: ${business}\nMarket: ${market}\nGoal: ${goal}\nAudience: ${audience}\nCurrent situation: ${currentSituation}\nConstraints: ${constraints}\nExisting assets: ${assets}\n\n1. ICP Diagnosis\n- Best buyer: the segment already feeling the problem and able to make a faster decision.\n- Avoid: low-budget, unclear-need, or free-information-only prospects.\n- Trigger: time loss, revenue gap, operational pain, or missed opportunity.\n\n2. Positioning\n- Core message: ${business} helps ${audience} move closer to ${goal} through ${offer}.\n- Differentiator: make the promise believable with ${proof}.\n- Risk: generic messaging will make the business look like every alternative.\n\n3. Offer Strength\n- Strong part: ${offer} gives the campaign a clear center.\n- Improve: add proof, guarantee, deadline, bonus, or a sharper outcome.\n- Best CTA: one low-friction next step such as audit, demo, consultation, trial, or quote.\n\n4. Funnel Gaps\n- Awareness: publish pain-aware posts and useful education.\n- Trust: add case study, testimonial, process breakdown, or founder point of view.\n- Conversion: use one landing page with objection handling and repeated CTA.\n\n5. Channel Priority\n- Primary: choose the channel where ${audience} already spends attention.\n- Secondary: email/SMS retargeting for warm leads.\n- Support: short video or carousel to explain the offer quickly.\n\n6. Next 7 Days\n- Day 1: clarify ICP and the strongest pain.\n- Day 2: write one landing page hero and CTA.\n- Day 3: create one proof asset.\n- Day 4: publish one educational post.\n- Day 5: publish one objection-handling post.\n- Day 6: send email or DM follow-up.\n- Day 7: review responses and improve the offer angle.`;

    return {
      executiveSummary: isBengali
        ? `${business} er jonno ICP, positioning, offer, funnel, and channel priority audit ready.`
        : `A practical ICP, positioning, offer, funnel, and channel priority audit for ${business}.`,
      assumptions: ['The business has at least one clear product or service.', 'The goal can be improved by tightening positioning and conversion path.'],
      missingInputs: ['Recent conversion data', 'Customer interview notes', 'Top competitor offers'],
      strategy: ['Narrow the ICP before scaling content.', 'Make the offer more believable with proof.', 'Create one conversion path before adding more channels.'],
      primaryOutput,
      variations: ['Premium positioning route', 'Volume lead generation route', 'Authority-building route'],
      checklist: ['ICP selected', 'Offer sharpened', 'Proof gap identified', 'Primary channel selected', '7-day action plan ready'],
      nextBestActions: ['Update Brand Brain with the chosen ICP.', 'Generate a Launch Pack from this audit.', 'Create one proof asset before running ads.'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  if (tool === 'product_photography') {
    const primaryOutput = isBengali
      ? `Product Photography MVP Plan\nProduct: ${productName}\nAudience: ${audience}\nVisual goal: ${visualGoal}\nUse cases: ${platforms}\nProduction notes: ${productionNotes}\n\n1. Creative Direction\n- Main promise: product ta dekhlei buyer jeno quality, use-case, and trust bujhte pare.\n- Visual feeling: clean, premium, believable, and local-market friendly.\n- Avoid: over-edited AI look, fake shadows, unrealistic hands, random props, and confusing background.\n\n2. Must-Have Shot List\n1. Hero clean packshot: product centered, soft shadow, neutral background.\n2. Lifestyle use shot: product real-life context-e, audience-er daily situation match kore.\n3. Detail macro shot: material, texture, label, stitching, ingredients, or feature close-up.\n4. Benefit shot: product use korle buyer-er outcome visually show kore.\n5. Scale/context shot: hand, desk, bag, room, or environment diye size and use clear kore.\n6. Bundle/packaging shot: box, accessories, bonus, or full set together.\n7. Social ad shot: strong contrast, empty space for headline, thumb-stopping composition.\n8. Trust shot: warranty, ingredients, certificate, review card, or proof element.\n\n3. AI Image Prompt Pack\nPrompt 1 - Ecommerce hero:\nCreate a realistic premium product photo of ${productName}. Product details: ${productDetails}. Use a clean studio setup, soft diffused lighting, natural shadow, accurate proportions, crisp focus, neutral background, ecommerce-ready composition, no text, no watermark, no distorted product.\n\nPrompt 2 - Lifestyle:\nCreate a realistic lifestyle product photo of ${productName} for ${audience}. Show the product in a natural use environment that supports this goal: ${visualGoal}. Use believable props, soft daylight, warm premium tone, realistic human context if needed, no fake labels, no extra fingers, no distorted product.\n\nPrompt 3 - Social ad creative:\nCreate a scroll-stopping product photo of ${productName} for ${platforms}. Composition should leave clean negative space for ad copy, use strong but tasteful contrast, premium lighting, clear product visibility, and conversion-focused visual hierarchy. No text in image.\n\nPrompt 4 - Feature close-up:\nCreate a macro detail shot of ${productName}, highlighting the most valuable feature from these details: ${productDetails}. Use shallow depth of field, realistic texture, premium lighting, and accurate product shape.\n\n4. Background and Prop Ideas\n- Neutral studio: white, off-white, light gray, or soft gradient.\n- Premium: marble, matte black, glass reflection, satin cloth, walnut wood.\n- Local lifestyle: desk, home, study table, dressing table, kitchen, gym bag, office setup.\n- Seasonal/campaign: Eid, New Year, winter, back-to-school, launch day, gift context.\n\n5. Ecommerce Gallery Order\n1. Hero packshot\n2. Lifestyle context\n3. Feature close-up\n4. Benefit/usage shot\n5. Scale shot\n6. Packaging/bundle shot\n7. Trust/proof shot\n\n6. Thumbnail / Ad Text Overlay Ideas\n1. PREMIUM QUALITY\n2. BUILT FOR DAILY USE\n3. CLEAN LOOK\n4. SMART CHOICE\n5. GIFT READY\n6. REAL VALUE\n7. LIMITED STOCK\n8. BEST FOR ${audience}\n9. SEE THE DETAIL\n10. TRY IT TODAY\n\n7. Production Checklist\n- Product clean, dust-free, label readable.\n- Same lighting style across all photos.\n- 1 hero angle, 2 lifestyle angles, 2 close-ups minimum.\n- Background does not overpower product.\n- Export square, portrait, and website hero versions.`
      : `Product Photography MVP Plan\nProduct: ${productName}\nAudience: ${audience}\nVisual goal: ${visualGoal}\nUse cases: ${platforms}\nProduction notes: ${productionNotes}\n\n1. Creative Direction\n- Main promise: the buyer should understand quality, use case, and trust within seconds.\n- Visual feeling: clean, premium, believable, and market-specific.\n- Avoid: over-edited AI look, fake shadows, unrealistic hands, random props, and confusing backgrounds.\n\n2. Must-Have Shot List\n1. Hero clean packshot: product centered, soft shadow, neutral background.\n2. Lifestyle use shot: product in a real context that matches the buyer's daily situation.\n3. Detail macro shot: material, texture, label, stitching, ingredients, or feature close-up.\n4. Benefit shot: visually show the outcome the buyer wants.\n5. Scale/context shot: hand, desk, bag, room, or environment to clarify size and use.\n6. Bundle/packaging shot: box, accessories, bonus, or full set together.\n7. Social ad shot: strong contrast, empty space for headline, thumb-stopping composition.\n8. Trust shot: warranty, ingredients, certificate, review card, or proof element.\n\n3. AI Image Prompt Pack\nPrompt 1 - Ecommerce hero:\nCreate a realistic premium product photo of ${productName}. Product details: ${productDetails}. Use a clean studio setup, soft diffused lighting, natural shadow, accurate proportions, crisp focus, neutral background, ecommerce-ready composition, no text, no watermark, no distorted product.\n\nPrompt 2 - Lifestyle:\nCreate a realistic lifestyle product photo of ${productName} for ${audience}. Show the product in a natural use environment that supports this goal: ${visualGoal}. Use believable props, soft daylight, warm premium tone, realistic human context if needed, no fake labels, no extra fingers, no distorted product.\n\nPrompt 3 - Social ad creative:\nCreate a scroll-stopping product photo of ${productName} for ${platforms}. Composition should leave clean negative space for ad copy, use strong but tasteful contrast, premium lighting, clear product visibility, and conversion-focused visual hierarchy. No text in image.\n\nPrompt 4 - Feature close-up:\nCreate a macro detail shot of ${productName}, highlighting the most valuable feature from these details: ${productDetails}. Use shallow depth of field, realistic texture, premium lighting, and accurate product shape.\n\n4. Background and Prop Ideas\n- Neutral studio: white, off-white, light gray, or soft gradient.\n- Premium: marble, matte black, glass reflection, satin cloth, walnut wood.\n- Lifestyle: desk, home, study table, dressing table, kitchen, gym bag, office setup.\n- Seasonal/campaign: Eid, New Year, winter, back-to-school, launch day, gift context.\n\n5. Ecommerce Gallery Order\n1. Hero packshot\n2. Lifestyle context\n3. Feature close-up\n4. Benefit/usage shot\n5. Scale shot\n6. Packaging/bundle shot\n7. Trust/proof shot\n\n6. Thumbnail / Ad Text Overlay Ideas\n1. PREMIUM QUALITY\n2. BUILT FOR DAILY USE\n3. CLEAN LOOK\n4. SMART CHOICE\n5. GIFT READY\n6. REAL VALUE\n7. LIMITED STOCK\n8. BEST FOR ${audience}\n9. SEE THE DETAIL\n10. TRY IT TODAY\n\n7. Production Checklist\n- Product clean, dust-free, label readable.\n- Same lighting style across all photos.\n- 1 hero angle, 2 lifestyle angles, 2 close-ups minimum.\n- Background does not overpower product.\n- Export square, portrait, and website hero versions.`;

    return {
      executiveSummary: isBengali
        ? `${productName} er jonno ecommerce, lifestyle, ad, and social-ready product photography plan ready.`
        : `A practical product photography plan for ${productName}, covering ecommerce, lifestyle, ad, and social-ready visuals.`,
      assumptions: ['The product should look realistic and conversion-focused, not like generic AI art.', 'The user may use either real photography or AI image generation from the prompts.'],
      missingInputs: ['Reference product photo', 'Brand color palette', 'Exact product dimensions', 'Competitor product photo examples'],
      strategy: ['Start with a clean ecommerce hero shot before lifestyle creative.', 'Use visual hierarchy so the product remains the main focus.', 'Create platform-specific crops from the same creative direction.'],
      primaryOutput,
      variations: ['Premium studio route', 'Lifestyle trust route', 'Scroll-stopping social ad route'],
      checklist: ['Hero shot included', 'Lifestyle shot included', 'Macro/detail shot included', 'Ad prompt included', 'Background ideas included', 'Overlay text ideas included', 'Export formats covered'],
      nextBestActions: ['Upload one real product photo as reference when image editing is added.', 'Generate the hero packshot first, then create lifestyle variations.', 'Use the best 2 visuals in an ecommerce gallery and one ad creative.'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  if (tool === 'campaign_planner') {
    const primaryOutput = isBengali
      ? `Campaign focus: ${offer}\nGoal: ${goal}\nDuration: ${duration}\nChannels: ${channels}\n\nPhase 1 - Positioning and trust\n- Day 1: Pain-aware post or email. Hook: ${audience} je problem ta daily feel kore oita diye start korun. CTA: comment/reply or learn more.\n- Day 2: Proof asset. Use ${proof}. CTA: see example or book a call.\n- Day 3: Objection handling. Address price, trust, time, or risk.\n\nPhase 2 - Demand and education\n- Day 4: Practical checklist or carousel. Teach one useful step around ${offer}.\n- Day 5: Founder/expert point of view. Explain why old alternatives are not enough.\n- Day 6: Customer scenario. Show before/after situation.\n\nPhase 3 - Conversion push\n- Day 7: Direct offer post, email, or SMS. Keep one clear CTA and one reason to act now.\n\nWeekly operating rule: review best hook, best channel, and strongest objection. Double down on the winning angle.`
      : `Campaign focus: ${offer}\nGoal: ${goal}\nDuration: ${duration}\nChannels: ${channels}\n\nPhase 1 - Positioning and trust\n- Day 1: Pain-aware post or email. Hook: open with the problem ${audience} already feels. CTA: reply, comment, or learn more.\n- Day 2: Proof asset. Use ${proof}. CTA: see the example or book a call.\n- Day 3: Objection handling. Address price, trust, time, or risk.\n\nPhase 2 - Demand and education\n- Day 4: Practical checklist or carousel. Teach one useful step connected to ${offer}.\n- Day 5: Founder/expert point of view. Explain why old alternatives are no longer enough.\n- Day 6: Customer scenario. Show the before/after situation.\n\nPhase 3 - Conversion push\n- Day 7: Direct offer post, email, or SMS. Keep one clear CTA and one reason to act now.\n\nWeekly operating rule: review the best hook, best channel, and strongest objection. Double down on the winning angle.`;

    return {
      executiveSummary: isBengali
        ? `${duration} campaign plan ${channels} channel-e ${goal} drive korar jonno structured kora hoyeche.`
        : `A ${duration} campaign plan structured to drive ${goal} across ${channels}.`,
      assumptions: ['The business has at least one active offer.', 'The campaign can use organic content first and add paid distribution later.'],
      missingInputs: ['Exact launch date', 'Available proof assets', 'Budget and team owner'],
      strategy: ['Lead with buyer pain before pitching.', 'Use proof and objection handling before conversion posts.', 'Measure hook performance and repeat the strongest angle.'],
      primaryOutput,
      variations: ['Authority-led campaign', 'Problem-solution campaign', 'Offer-deadline campaign'],
      checklist: ['Clear goal defined', 'Channel mix selected', 'Offer headline visible', 'Proof asset included', 'Call to action repeated'],
      nextBestActions: ['Turn day 1 into a social post.', 'Turn day 2 into an email broadcast.', 'Create one dedicated landing page for all CTAs.'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  if (tool === 'launch_pack') {
    const primaryOutput = isBengali
      ? `Launch: ${launchName}\nOffer: ${offer}\nGoal: ${goal}\nAudience: ${audience}\nChannels: ${channels}\n\n1. Landing Page Hero\nHeadline: ${audience}-er jonno ${offer} jeita decision easy kore.\nSubheadline: Generic option-er bodole clear proof, simple next step, and practical outcome.\nCTA: Start now / Book a call / Claim the offer.\nTrust line: Backed by ${proof}.\n\n2. Landing Page Sections\n- Problem: buyer ki niye stuck ache.\n- Promise: ${offer} kon outcome dibe.\n- Proof: ${proof}.\n- How it works: 3 simple steps.\n- Objections: price, trust, time, risk.\n- CTA repeat: one clear action.\n\n3. Social Posts\nPost 1 Hook: Most ${audience} ei mistake kore: solution khuje, but buying reason clear kore na.\nPost 2 Hook: ${offer} useful hobe jodi apni ${goal} korte chan without extra confusion.\nPost 3 Hook: Here is the simple decision checklist before choosing ${offer}.\n\n4. Email Mini Sequence\nEmail 1: Problem and opportunity. CTA: learn more.\nEmail 2: Proof and objection handling. CTA: see details.\nEmail 3: Direct offer. CTA: take action today.\n\n5. SMS\n${offer} niye ready? ${goal} start korte ekta simple next step nin. Details: [link]\n\n6. Ad Angles\n- Pain angle: old way costs too much time.\n- Proof angle: credible reason to trust.\n- Outcome angle: clear next result.\n\n7. Visual / Thumbnail Prompt\nCreate a clean conversion-focused visual for ${launchName}. Show the core problem and promised outcome. Use premium business style, strong contrast, simple text area, and no clutter.`
      : `Launch: ${launchName}\nOffer: ${offer}\nGoal: ${goal}\nAudience: ${audience}\nChannels: ${channels}\n\n1. Landing Page Hero\nHeadline: ${offer} for ${audience} who need a clearer path to ${goal}.\nSubheadline: Replace generic advice with a practical offer, credible proof, and one simple next step.\nCTA: Start now / Book a call / Claim the offer.\nTrust line: Backed by ${proof}.\n\n2. Landing Page Sections\n- Problem: the buyer is stuck with an old way that feels slow, risky, or unclear.\n- Promise: ${offer} helps them move toward ${goal} with less friction.\n- Proof: ${proof}.\n- How it works: explain the process in 3 simple steps.\n- Objections: handle price, trust, time, and risk.\n- CTA repeat: one clear action.\n\n3. Social Posts\nPost 1 Hook: Most ${audience} do not need more options. They need a better reason to choose.\nPost 2 Hook: If ${goal} matters this month, ${offer} should make the next step easier.\nPost 3 Hook: Use this simple checklist before choosing ${offer}.\n\n4. Email Mini Sequence\nEmail 1: Problem and opportunity. CTA: learn more.\nEmail 2: Proof and objection handling. CTA: see details.\nEmail 3: Direct offer. CTA: take action today.\n\n5. SMS\nReady to move on ${offer}? Take the next step toward ${goal} here: [link]\n\n6. Ad Angles\n- Pain angle: the old way costs too much time.\n- Proof angle: a credible reason to trust the offer.\n- Outcome angle: the next result the buyer wants.\n\n7. Visual / Thumbnail Prompt\nCreate a clean conversion-focused visual for ${launchName}. Show the core problem and promised outcome. Use premium business style, strong contrast, simple text area, and no clutter.`;

    return {
      executiveSummary: isBengali
        ? `${launchName} er jonno ekta full starter campaign pack ready kora hoyeche.`
        : `A complete starter campaign pack for ${launchName}.`,
      assumptions: ['The offer has a destination link or landing page.', 'The campaign can reuse one core message across channels.'],
      missingInputs: ['Exact CTA link', 'Launch deadline', 'Customer testimonial or proof asset'],
      strategy: ['Create one clear conversion path.', 'Reuse the same message across page, email, social, SMS, and ads.', 'Use proof before asking for action.'],
      primaryOutput,
      variations: ['Urgency-led launch pack', 'Proof-led launch pack', 'Founder-story launch pack'],
      checklist: ['Landing hero included', 'Social posts included', 'Email sequence included', 'SMS included', 'Ad angles included', 'Visual prompt included'],
      nextBestActions: ['Paste the landing copy into a page builder.', 'Turn social hooks into posts.', 'Schedule the 3-email sequence.'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  if (isBengali) {
    return {
      executiveSummary: `এই ${label} এক্সিকিউটিভ গ্রোথ প্ল্যানটি আপনার ${businessModel.toUpperCase()} বিজনেস মডেল ও অডিয়েন্স অনুসারে তৈরি করা হয়েছে।`,
      assumptions: ['Audience already has the problem but needs trust before buying.', 'Offer should be positioned around a measurable business outcome.'],
      missingInputs: ['Customer proof or case study', 'Exact offer deadline or incentive'],
      strategy: ['একটি sharp pain দিয়ে শুরু করুন।', 'তারপর specific outcome, proof, এবং simple CTA দিন।', 'Generic AI tone বাদ দিয়ে customer language ব্যবহার করুন।'],
      primaryOutput: `Hook: ${audience} এখন দ্রুত result চায়, কিন্তু generic solution তাদের decision সহজ করে না.\n\nCore message: ${business} ${offer} দিয়ে buyer-er real problem solve করতে পারে, কারণ message, proof, objection, and CTA একসাথে clear করা হয়েছে.\n\nWhy it matters: ${goal} করতে হলে শুধু সুন্দর copy যথেষ্ট না. Audience-er pain, trust gap, and next step একই flow-তে আনতে হবে.\n\nProof angle: ${proof} ব্যবহার করে claim credible করুন.\n\nCTA: আজই ${offer} নিয়ে next step নিন, অথবা details share করুন যাতে exact campaign version তৈরি করা যায়।`,
      variations: ['Authority angle: expert guidance with practical execution.', 'ROI angle: save time and improve conversion quality.', 'Trust angle: clear proof, objections, and next step.'],
      checklist: ['Audience pain specific হয়েছে', 'Offer clear হয়েছে', 'One CTA আছে', 'No generic hype', 'Business tone matched'],
      nextBestActions: ['Brand Brain আরও বিস্তারিত করুন।', 'একটি real customer objection যোগ করুন।', 'Output থেকে 3টি platform version তৈরি করুন।'],
      adCreatives,
      chatClosingScripts,
      campaignPhases,
      guaranteeAndRiskReversal,
      unitEconomicsAdvice,
    };
  }

  return {
    executiveSummary: `This ${label} strategic plan is built for your ${businessModel.toUpperCase()} business model and campaign parameters.`,
    assumptions: ['The buyer understands the problem but needs a reason to trust the offer.', 'The best angle should connect a practical pain to a measurable outcome.'],
    missingInputs: ['Customer proof or case study', 'Exact offer deadline or incentive'],
    strategy: ['Open with a concrete buyer pain.', 'Move into the outcome, proof, and next action.', 'Use customer language instead of generic AI phrasing.'],
    primaryOutput: `Hook: ${audience} wants a better outcome, but generic solutions make the decision harder.\n\nCore message: ${business} can position ${offer} around a clear buyer pain, a believable promise, and one simple next step.\n\nWhy it matters: To ${goal}, the message needs more than polished copy. It needs the buyer pain, trust gap, proof, and CTA in one clean flow.\n\nProof angle: Use ${proof} to make the claim credible.\n\nCTA: Take the next step with ${offer}, or add more context so the campaign can become channel-ready.`,
    variations: ['Authority angle: expert guidance with practical execution.', 'ROI angle: save time and improve conversion quality.', 'Trust angle: clear proof, objections, and next step.'],
    checklist: ['Audience pain is specific', 'Offer is clear', 'One CTA is present', 'No generic hype', 'Tone matches the business'],
    nextBestActions: ['Complete the Brand Brain.', 'Add one real customer objection.', 'Turn this into 3 channel-specific versions.'],
    adCreatives,
    chatClosingScripts,
    campaignPhases,
    guaranteeAndRiskReversal,
    unitEconomicsAdvice,
  };
}

function buildPrompt(request: MarketingRequest): string {
  const tool = request.tool || 'social_campaign';
  const language = request.language || request.brandProfile?.language || 'English';
  const businessModel = request.businessModel || 'fcommerce';
  const brandProfile = request.brandProfile || {};
  const inputs = sanitizeRecord(request.inputs);

  return `You are a 40-year veteran Chief Marketing Officer (CMO), Direct Response Copy Chief, and Battle-Tested Growth Architect.
You do NOT generate academic textbooks or toy marketing responses. You generate ready-to-run, high-converting copy assets, battle-tested ad angles, Messenger/WhatsApp closing scripts, and campaign launch machines that generate actual cash flow.

SELECTED BUSINESS MODEL: ${businessModel.toUpperCase()}
- 'fcommerce': Bangladeshi Facebook Page/Messenger Direct Sales store. Key realities: Cash on Delivery (COD) trust, delivery rider inspection, Pathao/Steadfast couriers, 45-60% margin rules, return-rate minimization, and high-converting colloquial Bengali/Banglish conversational copy.
- 'ecommerce': D2C Web Store (Shopify/WooCommerce). Key realities: UGC video ad hooks, AOV bundling, unboxing psychology, checkout abandonment recovery, 30-day money-back guarantee, and 2.8x+ ROAS scaling.
- 'b2b': High-Ticket B2B & Agency Client Acquisition. Key realities: Cold outbound messaging, VSL scripts, qualification filters, objection battlecards ('already have a team', 'too expensive'), and Calendly booked calls.
- 'saas': Software / Digital Products. Key realities: Product-led onboarding, activation velocity, trial-to-paid conversion triggers, churn reduction.

Create an elite, professional ${toolLabels[tool] || 'marketing asset'} for this business.

OPERATING RULES:
- Output must be strictly valid JSON only. No markdown wrapping fences around the JSON object.
- Write in ${language}. If Bengali or Banglish is requested: write in natural, engaging, high-converting conversational Bangla/Banglish as spoken and written by top marketing agencies in Dhaka/Bangladesh, NOT stiff textbook translation. Technical terms, brand names, software/tool names, programming languages, and tech acronyms (e.g., Meta, Facebook, Instagram, TikTok, Reels, Shopify, Pathao, Steadfast, COD, AOV, ROAS, CRM, Calendly, Claude, ChatGPT, Gemini, SEO, API, WordPress) MUST strictly remain in their original English script.
- Be razor-sharp about customer psychology, objections, pricing trust, and frictionless call-to-actions.
- Do NOT provide generic fluff or empty placeholders. Provide complete, ready-to-copy-paste copy.

MANDATORY OUTPUT JSON STRUCTURE:
Return a JSON object with EXACTLY these keys:
{
  "executiveSummary": "Concise 2-sentence veteran CMO diagnosis and campaign summary",
  "assumptions": ["strategic assumption 1", "strategic assumption 2"],
  "missingInputs": ["critical input that would unlock even higher conversion"],
  "strategy": ["tactical pillar 1", "tactical pillar 2", "tactical pillar 3"],
  "primaryOutput": "The complete master copy asset formatted cleanly with rich whitespace, headline anchors, and clear structural sections",
  "variations": ["angle variation 1", "angle variation 2", "angle variation 3"],
  "checklist": ["quality checkpoint 1", "quality checkpoint 2", "quality checkpoint 3"],
  "nextBestActions": ["exact tactical action 1", "exact tactical action 2", "exact tactical action 3"],
  "adCreatives": [
    {
      "angleName": "Name of Angle (e.g. Risk-Free COD Proof / Problem-Agitate-Solve)",
      "platform": "Meta Ads / TikTok / LinkedIn",
      "hook": "Scroll-stopping first 3 seconds hook",
      "bodyCopy": "Full persuasive body text with formatting and bullet points",
      "callToAction": "Direct action link / message prompt",
      "visualDirection": "Detailed visual storyboard / camera angle / creator prompt"
    }
  ],
  "chatClosingScripts": [
    {
      "customerTrigger": "Customer prompt or objection (e.g. 'Price koto?', 'Delivery charge free hobe?', 'Original kina?')",
      "psychologicalAngle": "Underlying sales psychology strategy",
      "salesScript": "Word-for-word copy-paste message response to send to customer",
      "nextStepCta": "Next micro-action to close the sale"
    }
  ],
  "campaignPhases": [
    {
      "phaseName": "Phase 1: Pre-Launch Hype / Phase 2: Launch Drop / Phase 3: Social Proof / Phase 4: Scarcity",
      "objective": "Phase primary goal",
      "keyAction": "Specific marketing task executed",
      "copyOrScriptSnippet": "Ready-to-use broadcast post or SMS/Email snippet for this phase"
    }
  ],
  "guaranteeAndRiskReversal": "An unbeatable risk-reversal guarantee tailored to the business model (e.g. check before paying COD, 30-day refund, milestone performance guarantee)",
  "unitEconomicsAdvice": "Tactical CMO guidance on gross margin target, ROAS threshold, and AOV expansion techniques"
}

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

User input:
${JSON.stringify(inputs, null, 2)}`;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('Marketing generation timed out.')), timeoutMs);
  });

  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as MarketingRequest;
    const tool = body.tool || 'social_campaign';
    const language = body.language || body.brandProfile?.language || 'English';
    const businessModel = body.businessModel || 'fcommerce';
    const bodyInputs = sanitizeRecord(body.inputs);

    if (!Object.prototype.hasOwnProperty.call(toolLabels, tool)) {
      return NextResponse.json({ success: false, error: 'Unsupported marketing tool.' }, { status: 400 });
    }

    if (tool === 'video_repurpose' && bodyInputs.sourceLink) {
      const sourceInsight = await getVideoSourceInsight(bodyInputs.sourceLink);
      if (!bodyInputs.transcript && sourceInsight.transcript) {
        bodyInputs.transcript = sourceInsight.transcript;
      }
      if (!bodyInputs.topic && sourceInsight.title) {
        bodyInputs.topic = sourceInsight.title;
        bodyInputs.videoTitle = sourceInsight.title;
      }
      if (sourceInsight.warning) {
        bodyInputs.transcriptWarning = sourceInsight.warning;
      }
    }

    try {
      const text = await withTimeout(generateGeminiText(buildPrompt({ ...body, businessModel, tool, language, inputs: bodyInputs })), 25000);
      const parsed = JSON.parse(extractJsonText(text)) as unknown;
      return NextResponse.json({
        success: true,
        provider: 'gemini',
        data: normalizeResult(parsed, { tool, language, businessModel, brandProfile: body.brandProfile, inputs: bodyInputs }),
      });
    } catch (error) {
      console.warn('Marketing suite AI generation failed, using local fallback.', error);
      return NextResponse.json({
        success: true,
        provider: 'local-fallback',
        warning: 'AI generation was unavailable, so a structured fallback was created.',
        data: fallbackResult(tool, language, businessModel, body.brandProfile, bodyInputs),
      });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request payload.' }, { status: 400 });
  }
}
