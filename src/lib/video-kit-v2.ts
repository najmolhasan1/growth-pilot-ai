import { GoogleGenAI, Type } from '@google/genai';

export const VIDEO_KIT_V2_MODEL = process.env.GEMINI_VIDEO_KIT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const CREATOR_PACKAGE_QUALITY_INSTRUCTIONS = `
Output quality standard:
- Act like a senior Bangladesh-market YouTube strategist, conversion copywriter, and content producer with 15+ years of practical experience.
- Write in the transcript's main language. If the transcript is Bangla, use natural, conversational Bangla/Banglish as spoken and written colloquially in Bangladesh, not translated AI text or stiff textbook language. Brand names, AI models, software/tool names, programming languages, and tech acronyms (e.g., Claude, ChatGPT, Gemini, SEO, API, Python, WordPress, React, HTML) MUST strictly remain in their original English script (e.g., write "Claude" and "ChatGPT", NOT "ক্লদ" or "চ্যাটজিপিটি"). Keep other common everyday English terms in English script or transliterate them into Bangla script (e.g., video to ভিডিও, content to কনটেন্ট, channel to চ্যানেল, roadmap to রোডম্যাপ, marketing to মার্কেটিং, subscriber to সাবস্ক্রাইবার, views to ভিউজ).
- Make every recommendation specific to the actual transcript, offer, audience, objections, and proof points. Do not create generic creator advice.
- Use only facts, numbers, dates, claims, names, and promises that appear in the transcript or summary. Do not invent proof.
- Avoid AI-sounding filler such as "ultimate", "game-changer", "unlock", "watch till the end", "in this video we dive deep", unless the transcript naturally supports it.
- Avoid emojis, excessive exclamation marks, quotation marks around every hook, and polished-but-empty corporate language.
- Titles should feel clickable but trustworthy: clear benefit, audience intent, and curiosity without misleading clickbait.
- Thumbnail text should be 2-5 short words, strong enough for a designer to use directly, and must not feel robotic.
- Return exactly 10 thumbnail text suggestions and exactly 10 title suggestions, ranked from strongest to weakest.
- For each title and thumbnail text, think like a real Bangladesh viewer before writing: would they stop, click, and continue watching based on this exact wording?
- Do not simply rephrase transcript lines. Package the real idea into viewer-facing curiosity, outcome, objection, proof, or urgency.
- Titles must be usable as final YouTube titles. Avoid random idea labels, vague topics, or weak classroom-style headings.
- Thumbnail text must work visually on a thumbnail: short, punchy, legible, and connected to the strongest emotional reason to click.
- The SEO description should read like a human-written YouTube description: warm, direct, specific, and conversion-aware.
- Viral reels and clip suggestions must explain why a real viewer would stop scrolling, not just say "high engagement".
- Prefer practical viewer psychology: fear, objection, aspiration, proof, urgency, credibility, and next step.
- The result should be strong enough that a small business or education company in Bangladesh could rely on it as a junior marketing resource replacement.
`.trim();

export function getVideoKitV2Client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

export function cleanJsonResponse(text?: string) {
  if (!text) throw new Error('Empty response received from the model.');
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  return JSON.parse(cleanText);
}

export function stripChaptersFromDescription(description?: string) {
  if (!description) return '';
  const chapterMarkers = [
    /\n\s*(?:video\s*)?chapters?\s*[:：]/i,
    /\n\s*time\s*stamps?\s*[:：]/i,
    /\n\s*ভিডিও\s*চ্যাপ্টার\s*[:：]/i,
    /\n\s*চ্যাপ্টার\s*[:：]/i,
  ];

  let cleanDescription = description.trim();
  for (const marker of chapterMarkers) {
    const match = cleanDescription.search(marker);
    if (match >= 0) {
      cleanDescription = cleanDescription.slice(0, match).trim();
    }
  }

  return cleanDescription
    .split('\n')
    .filter(line => !/^\s*\d{1,2}:\d{2}(?::\d{2})?\b/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanSuggestionText(text: unknown) {
  return String(text || '')
    .replace(/^\s*(?:\d+[\).:-]\s*|[-*]\s*)/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSuggestions(items: unknown, exactCount: number) {
  const source = Array.isArray(items) ? items : [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const item of source) {
    const value = cleanSuggestionText(item);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(value);
    if (cleaned.length === exactCount) break;
  }

  return cleaned;
}

export function normalizeCreatorPackage<T extends { seoDescription?: string; thumbnailTexts?: unknown; titles?: unknown }>(creatorPackage: T): T {
  return {
    ...creatorPackage,
    thumbnailTexts: normalizeSuggestions(creatorPackage.thumbnailTexts, 10),
    titles: normalizeSuggestions(creatorPackage.titles, 10),
    seoDescription: stripChaptersFromDescription(creatorPackage.seoDescription),
  };
}

export const creatorPackageSchema = {
  type: Type.OBJECT,
  properties: {
    thumbnailTexts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 10,
      maxItems: 10,
      description: 'Exactly 10 ranked short, human, high-curiosity thumbnail overlay texts. Use 2-5 words, no emojis, no generic AI phrasing. Every option must be usable directly on a Bangladesh-market thumbnail.',
    },
    titles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 10,
      maxItems: 10,
      description: 'Exactly 10 ranked clickable but trustworthy video titles based on the actual transcript, Bangladesh audience intent, viewer psychology, and proof points. Every title must be usable directly on YouTube.',
    },
    seoDescription: {
      type: Type.STRING,
      description: 'Human-written SEO-friendly video description only. Do not include chapters, timestamps, time ranges, hashtags, or video tags in this field.',
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 5 relevant hashtags with # symbol.',
    },
    videoTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '10 to 15 search keywords for video tags.',
    },
    viralReels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          peakHook: { type: Type.STRING, description: 'A natural short-form hook based on the real transcript moment.' },
          whyViral: { type: Type.STRING, description: 'A concrete reason tied to viewer psychology, not generic engagement language.' },
        },
        required: ['timestamp', 'peakHook', 'whyViral'],
      },
    },
    clipSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          timestamp: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ['title', 'timestamp', 'summary'],
      },
    },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          title: { type: Type.STRING },
        },
        required: ['timestamp', 'title'],
      },
    },
  },
  required: ['thumbnailTexts', 'titles', 'seoDescription', 'hashtags', 'videoTags', 'viralReels', 'clipSuggestions', 'chapters'],
} as const;

export const transcriptionSchema = {
  type: Type.OBJECT,
  properties: {
    originalLanguage: { type: Type.STRING },
    transcript: { type: Type.STRING },
    summary: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start: { type: Type.STRING },
          end: { type: Type.STRING },
          speaker: { type: Type.STRING },
          text: { type: Type.STRING },
        },
        required: ['start', 'end', 'speaker', 'text'],
      },
    },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    creatorPackage: creatorPackageSchema,
  },
  required: ['originalLanguage', 'transcript', 'summary', 'segments', 'topics', 'creatorPackage'],
} as const;

export const translationSchema = {
  type: Type.OBJECT,
  properties: {
    fullTranscript: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          segmentId: { type: Type.STRING },
          translatedText: { type: Type.STRING },
        },
        required: ['segmentId', 'translatedText'],
      },
    },
  },
  required: ['fullTranscript', 'segments'],
} as const;
