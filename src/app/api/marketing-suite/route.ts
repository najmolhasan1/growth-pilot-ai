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

type MarketingRequest = {
  tool?: string;
  language?: string;
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

function normalizeResult(value: unknown, request: { tool: string; language: string; brandProfile?: BrandProfile; inputs?: Record<string, string> }): MarketingResult {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const label = toolLabels[request.tool] || 'marketing asset';
  const fallback = fallbackResult(request.tool, request.language, request.brandProfile, request.inputs);
  const primaryOutput = typeof data.primaryOutput === 'string' ? data.primaryOutput.trim() : '';
  const weakPrimaryOutput = primaryOutput.length < 120 || primaryOutput.toLowerCase().includes('draft a focused');

  return {
    executiveSummary: typeof data.executiveSummary === 'string' && data.executiveSummary.trim()
      ? data.executiveSummary.trim()
      : fallback.executiveSummary,
    assumptions: normalizeList(data.assumptions, fallback.assumptions),
    missingInputs: normalizeList(data.missingInputs, fallback.missingInputs),
    strategy: normalizeList(data.strategy, fallback.strategy),
    primaryOutput: primaryOutput && !weakPrimaryOutput
      ? primaryOutput
      : fallback.primaryOutput || `Create a focused ${label} around one clear buyer pain, one specific promise, and one next action.`,
    variations: normalizeList(data.variations, fallback.variations),
    checklist: normalizeList(data.checklist, fallback.checklist),
    nextBestActions: normalizeList(data.nextBestActions, fallback.nextBestActions),
  };
}

function fallbackResult(tool: string, language: string, brandProfile: BrandProfile = {}, inputs: Record<string, string> = {}): MarketingResult {
  const label = toolLabels[tool] || 'marketing asset';
  const isBengali = language.toLowerCase().includes('bang');
  const business = brandProfile.businessName || 'your business';
  const audience = brandProfile.audience || inputs.audience || 'your target audience';
  const offer = inputs.offer || brandProfile.offer || inputs.topic || inputs.product || 'your offer';
  const goal = inputs.goal || inputs.pageGoal || inputs.sequenceType || 'generate qualified action';
  const proof = inputs.proof || 'clear proof, customer outcomes, and practical examples';
  const duration = inputs.duration || '14 days';
  const channels = inputs.channels || inputs.platform || 'primary social, email, and owned channels';
  const launchName = inputs.launchName || inputs.campaignName || 'Campaign launch';
  const currentSituation = inputs.currentSituation || 'current traction and bottlenecks are not fully documented';
  const constraints = inputs.constraints || 'limited time, budget, or team capacity';
  const assets = inputs.assets || 'existing website, social presence, content, proof, or customer conversations';
  const market = inputs.priorityMarket || brandProfile.location || 'the priority market';
  const topic = inputs.topic || inputs.videoTitle || offer;
  const productName = inputs.productName || inputs.product || offer;
  const productDetails = inputs.productDetails || inputs.notes || brandProfile.productService || 'product details are not fully documented';
  const visualGoal = inputs.visualGoal || 'premium, conversion-focused product visuals';
  const platforms = inputs.platforms || inputs.platform || 'website, ecommerce gallery, social media, and ads';
  const productionNotes = inputs.constraints || inputs.notes || 'use clean lighting, accurate product representation, and practical production setup';
  const platform = inputs.platform || 'YouTube, Shorts, Reels, and social channels';
  const videoGoal = inputs.videoGoal || goal || 'increase views, watch time, and qualified action';
  const transcript = inputs.transcript || 'No full transcript was provided, so this plan uses the topic, link, and notes as the source.';
  const transcriptWarning = inputs.transcriptWarning || '';
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
      checklist: ['Clear goal', 'Channel mix selected', 'Offer visible', 'Proof included', 'CTA repeated'],
      nextBestActions: ['Turn day 1 into a social post.', 'Turn day 2 into an email.', 'Create one landing page for all CTAs.'],
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
    };
  }

  if (isBengali) {
    return {
      executiveSummary: `এই ${label} MVP output টি আপনার brand profile এবং campaign input ধরে তৈরি করা হয়েছে। আরও ভালো result পেতে audience pain, offer, proof, এবং target platform পূরণ করুন।`,
      assumptions: ['Audience already has the problem but needs trust before buying.', 'Offer should be positioned around a measurable business outcome.'],
      missingInputs: ['Customer proof or case study', 'Exact offer deadline or incentive'],
      strategy: ['একটি sharp pain দিয়ে শুরু করুন।', 'তারপর specific outcome, proof, এবং simple CTA দিন।', 'Generic AI tone বাদ দিয়ে customer language ব্যবহার করুন।'],
      primaryOutput: `Hook: ${audience} এখন দ্রুত result চায়, কিন্তু generic solution তাদের decision সহজ করে না.\n\nCore message: ${business} ${offer} দিয়ে buyer-er real problem solve করতে পারে, কারণ message, proof, objection, and CTA একসাথে clear করা হয়েছে.\n\nWhy it matters: ${goal} করতে হলে শুধু সুন্দর copy যথেষ্ট না. Audience-er pain, trust gap, and next step একই flow-তে আনতে হবে.\n\nProof angle: ${proof} ব্যবহার করে claim credible করুন.\n\nCTA: আজই ${offer} নিয়ে next step নিন, অথবা details share করুন যাতে exact campaign version তৈরি করা যায়।`,
      variations: ['Authority angle: expert guidance with practical execution.', 'ROI angle: save time and improve conversion quality.', 'Trust angle: clear proof, objections, and next step.'],
      checklist: ['Audience pain specific হয়েছে', 'Offer clear হয়েছে', 'One CTA আছে', 'No generic hype', 'Business tone matched'],
      nextBestActions: ['Brand Brain আরও বিস্তারিত করুন।', 'একটি real customer objection যোগ করুন।', 'Output থেকে 3টি platform version তৈরি করুন।'],
    };
  }

  return {
    executiveSummary: `This ${label} MVP output is built from the current brand profile and campaign input. Add buyer pain, proof, offer details, and target channel for stronger results.`,
    assumptions: ['The buyer understands the problem but needs a reason to trust the offer.', 'The best angle should connect a practical pain to a measurable outcome.'],
    missingInputs: ['Customer proof or case study', 'Exact offer deadline or incentive'],
    strategy: ['Open with a concrete buyer pain.', 'Move into the outcome, proof, and next action.', 'Use customer language instead of generic AI phrasing.'],
    primaryOutput: `Hook: ${audience} wants a better outcome, but generic solutions make the decision harder.\n\nCore message: ${business} can position ${offer} around a clear buyer pain, a believable promise, and one simple next step.\n\nWhy it matters: To ${goal}, the message needs more than polished copy. It needs the buyer pain, trust gap, proof, and CTA in one clean flow.\n\nProof angle: Use ${proof} to make the claim credible.\n\nCTA: Take the next step with ${offer}, or add more context so the campaign can become channel-ready.`,
    variations: ['Authority angle: expert guidance with practical execution.', 'ROI angle: save time and improve conversion quality.', 'Trust angle: clear proof, objections, and next step.'],
    checklist: ['Audience pain is specific', 'Offer is clear', 'One CTA is present', 'No generic hype', 'Tone matches the business'],
    nextBestActions: ['Complete the Brand Brain.', 'Add one real customer objection.', 'Turn this into 3 channel-specific versions.'],
  };
}

function buildPrompt(request: MarketingRequest): string {
  const tool = request.tool || 'social_campaign';
  const language = request.language || request.brandProfile?.language || 'English';
  const brandProfile = request.brandProfile || {};
  const inputs = sanitizeRecord(request.inputs);

  return `You are a 20-year senior marketing strategist, conversion copy chief, and growth operator.

Create a high-quality ${toolLabels[tool] || 'marketing asset'} for this business.

Operating rules:
- Output must be valid JSON only. No markdown fences.
- Write in ${language}. If Bengali or Banglish is requested, write in natural, conversational Bangla/Banglish as spoken and written colloquially in Bangladesh, not stiff textbook translation. Brand names, AI models, software/tool names, programming languages, and tech acronyms (e.g., Claude, ChatGPT, Gemini, SEO, API, Python, WordPress, React, HTML) MUST strictly remain in their original English script (e.g., write "Claude" and "ChatGPT", NOT "ক্লদ" or "চ্যাটজিপিটি"). Keep other common everyday English terms in English script or transliterate them into Bangla script (e.g., "মার্কেটিং", "বিজনেস", "ক্যাম্পেইন", "রোডম্যাপ", "টিপস", "টিউটোরিয়াল", "ক্যারিয়ার").
- Act like an expert for the selected industry, business model, and audience.
- If details are missing, make smart assumptions, list them, and still produce the best first result.
- Avoid generic AI phrasing, filler, fake certainty, em dash, excessive quotes, and robotic paragraph rhythm.
- Be specific about buyer pain, objections, proof, offer framing, and the next best action.
- The output should feel ready for a founder, marketer, or agency operator to use after light editing.

Tool-specific quality bar:
- Social campaign: include platform angle, hook depth, CTA, and 3 reusable post angles.
- Product copy: include pain, benefit, proof, objections, feature-to-benefit translation, and CTA.
- Product photography: create a conversion-focused product shoot plan. Include ecommerce shot list, lifestyle concepts, AI image prompts, background/prop ideas, composition rules, platform crops, thumbnail/ad overlay text, and a production checklist. Prompts must be realistic, product-accurate, and avoid generic AI-art language.
- Email campaign: include subject logic, sequence flow, objection handling, and conversion moment.
- SMS campaign: keep it concise, permission-friendly, urgent without being spammy.
- Landing page: include hero, sections, proof blocks, objections, CTA, and page flow.
- Video content optimization kit: include 5 viral but relevant title options, thumbnail text ideas, thumbnail direction, SEO optimized description, chapters/timestamps, shorts/reels hooks, hashtags, video tags, and social post versions. If exact timecodes are missing, create suggested timestamps from transcript structure and clearly call them suggested.
- For video content, also include 8-10 Reels/Shorts ideas with timestamps or suggested timestamps, plus 3 separate 3-5 minute video ideas with section-by-section timestamps.
- Campaign planner: create a practical 7/14/30 day calendar with channels, hooks, asset types, CTA, owner task, and conversion goal for each phase.
- Launch pack: produce a complete starter kit with landing hero/sections, 3 social posts, 3-email sequence, 1 SMS, 3 ad angles, and 1 image or thumbnail prompt.
- Growth strategy audit: diagnose ICP, positioning, offer strength, funnel gaps, channel priorities, risks, and a 7-day action plan.

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

User input:
${JSON.stringify(inputs, null, 2)}

Return this exact JSON shape:
{
  "executiveSummary": "one short expert summary",
  "assumptions": ["assumption 1", "assumption 2"],
  "missingInputs": ["input that would improve quality"],
  "strategy": ["strategic step 1", "strategic step 2", "strategic step 3"],
  "primaryOutput": "the main copy/asset, with useful line breaks",
  "variations": ["variation 1", "variation 2", "variation 3"],
  "checklist": ["quality checkpoint 1", "quality checkpoint 2"],
  "nextBestActions": ["next action 1", "next action 2"]
}`;
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
      const text = await withTimeout(generateGeminiText(buildPrompt({ ...body, tool, language, inputs: bodyInputs })), 25000);
      const parsed = JSON.parse(extractJsonText(text)) as unknown;
      return NextResponse.json({
        success: true,
        provider: 'gemini',
        data: normalizeResult(parsed, { tool, language, brandProfile: body.brandProfile, inputs: bodyInputs }),
      });
    } catch (error) {
      console.warn('Marketing suite AI generation failed, using local fallback.', error);
      return NextResponse.json({
        success: true,
        provider: 'local-fallback',
        warning: 'AI generation was unavailable, so a structured fallback was created.',
        data: fallbackResult(tool, language, body.brandProfile, bodyInputs),
      });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request payload.' }, { status: 400 });
  }
}
