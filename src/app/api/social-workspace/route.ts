import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { extractJsonText, generateGeminiText } from '@/lib/gemini';
import { generateOpenRouterTextWithModelFallback, OPENROUTER_WRITING_MODELS } from '@/lib/openrouter';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

export type SocialToolType =
  | 'viral_caption'
  | 'carousel_planner'
  | 'reels_shorts_script'
  | 'video_ideas'
  | 'social_article'
  | 'repurpose_pack';

interface SocialWorkspaceRequest {
  tool: SocialToolType;
  topic?: string;
  platform?: string;
  tone?: string;
  goal?: string;
  audience?: string;
  duration?: string;
  targetSlides?: number;
  sourceContent?: string;
  brandNotes?: string;
  language?: string;
  brandProfile?: Record<string, string>;
}

const ANTI_SLOP_DIRECTIVE = `
ANTI-AI SLOP & REAL-HUMAN STYLE RULES (STRICT ENFORCEMENT):
1. NO generic corporate AI clichés: BANNED phrases include "In today's fast-paced digital world", "game changer", "game-changing", "unleash", "delve into", "supercharge", "skyrocket", "embark on a journey", "a testament to", "revolutionize", "seamlessly", "dive deep", "unlock the power".
2. Write with human cadence: Mix punchy one-sentence lines with natural conversational paragraphs.
3. No fake emojis on every line. Use emojis sparingly and only if they naturally belong to the platform (e.g., 1-2 on Instagram/Facebook, none or minimal on LinkedIn).
4. Do not use em dashes (— or –). Use standard commas, periods, or clean line breaks.
5. Provide actionable specifics, concrete examples, and genuine audience psychology rather than surface-level fluff.
`;

function getLanguageQualityRule(language = 'English'): string {
  const isBengali = /bengali|bangla/i.test(language);
  if (!isBengali) {
    return `OUTPUT LANGUAGE: English. Write punchy, natural, conversion-driven copy that sounds like a skilled senior copywriter wrote it.`;
  }

  return `OUTPUT LANGUAGE: Natural colloquial Bangladeshi Bangla (Banglish/Modern Bangla style).
- Write in warm, human, conversational Bangla as spoken and written by marketers, founders, and creators in Bangladesh.
- AVOID stiff, bookish, or textbook "Sadhu/Shuddho" translation.
- Brand names, AI models, software/tool names, social platforms, programming languages, and tech acronyms (e.g., Claude, ChatGPT, Gemini, SEO, Facebook, Instagram, LinkedIn, TikTok, YouTube, Next.js, API) MUST STRICTLY remain in their original English script (write "Claude" and "ChatGPT", NOT "ক্লদ" or "চ্যাটজিপিটি").
- Common conversational English terms can be transliterated naturally into Bengali script (e.g., ক্যারিয়ার, রোডম্যাপ, কনটেন্ট, রিলস, মার্কেটিং, আপডেট, লিঙ্ক, ট্রাফিক, সেলস) or kept in English where it sounds most natural.`;
}

async function callAiWithFallback(prompt: string, maxTokens = 4000): Promise<string> {
  try {
    return await generateGeminiText(prompt);
  } catch (geminiErr) {
    console.warn('Gemini social generation failed, attempting OpenRouter fallback:', geminiErr);
    try {
      const result = await generateOpenRouterTextWithModelFallback(prompt, {
        models: OPENROUTER_WRITING_MODELS,
        maxCompletionTokens: maxTokens,
        temperature: 0.65,
        title: 'GrowthPilot Social Media Workspace',
        retries: 1,
      });
      return result.text;
    } catch (orErr) {
      console.error('All AI providers failed for social workspace:', orErr);
      throw new Error('AI generation temporarily unavailable.');
    }
  }
}

function buildPrompt(req: SocialWorkspaceRequest): string {
  const langRule = getLanguageQualityRule(req.language);
  const platform = req.platform || 'All Social Platforms';
  const tone = req.tone || 'Conversational & Engaging';
  const audience = req.audience || req.brandProfile?.audience || 'Target buyers and followers';
  const topic = req.topic || req.sourceContent || 'Brand Growth & Value';
  const goal = req.goal || 'Drive Engagement & Leads';
  const brandContext = req.brandProfile
    ? `Business Name: ${req.brandProfile.businessName || 'Business'}\nIndustry: ${req.brandProfile.industry || 'General'}\nUSP/Offer: ${req.brandProfile.offer || ''}\nTone: ${req.brandProfile.tone || tone}`
    : `Brand notes: ${req.brandNotes || 'General creator/business'}`;

  const baseContext = `
${ANTI_SLOP_DIRECTIVE}
${langRule}

CONTEXT & INPUTS:
- Topic / Concept: ${topic}
- Target Platform: ${platform}
- Desired Tone: ${tone}
- Primary Goal: ${goal}
- Target Audience: ${audience}
- Brand Information:
${brandContext}
`;

  switch (req.tool) {
    case 'viral_caption':
      return `${baseContext}
TASK: Generate a complete, ready-to-publish social media caption kit for ${platform}.
Return strictly a valid JSON object matching this schema:
{
  "headline": "A short summary title for this caption set",
  "hookVariations": [
    { "type": "Curiosity Gap", "hook": "..." },
    { "type": "Contrarian / Pattern Interrupt", "hook": "..." },
    { "type": "Problem-Agitate", "hook": "..." },
    { "type": "Bold Proof / Outcome", "hook": "..." },
    { "type": "Story / Relatable Hook", "hook": "..." }
  ],
  "primaryCaption": "The full, high-converting primary caption formatted with clean line breaks, engaging body copy, and a single high-conversion CTA (e.g., 'Comment X to get Y' or 'Share your view below').",
  "alternativeCaptions": [
    { "label": "Short & Punchy", "caption": "..." },
    { "label": "Question-Led Engagement", "caption": "..." },
    { "label": "Direct Conversion / Offer", "caption": "..." }
  ],
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "engagementTip": "One practical, platform-specific tip to increase reach on ${platform}."
}`;

    case 'carousel_planner':
      return `${baseContext}
TASK: Plan a complete, high-save 5 to 8 slide social carousel for ${platform}.
Return strictly a valid JSON object matching this schema:
{
  "theme": "Core theme and hook promise of the carousel",
  "targetAudience": "${audience}",
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "Cover / Hook",
      "headline": "...",
      "body": "...",
      "visualDirection": "Clear visual notes for the designer or Canva layout (e.g. bold high-contrast text, arrows, avatar)"
    },
    {
      "slideNumber": 2,
      "slideType": "Context / The Big Problem",
      "headline": "...",
      "body": "...",
      "visualDirection": "..."
    },
    {
      "slideNumber": 3,
      "slideType": "Step 1: Core Insight",
      "headline": "...",
      "body": "...",
      "visualDirection": "..."
    },
    {
      "slideNumber": 4,
      "slideType": "Step 2: Practical Application",
      "headline": "...",
      "body": "...",
      "visualDirection": "..."
    },
    {
      "slideNumber": 5,
      "slideType": "Summary & Save Prompt",
      "headline": "...",
      "body": "...",
      "visualDirection": "..."
    },
    {
      "slideNumber": 6,
      "slideType": "Final CTA Slide",
      "headline": "...",
      "body": "...",
      "visualDirection": "..."
    }
  ],
  "postCaption": "Accompanying caption to post with this carousel, directing people to swipe and save.",
  "designTips": "Quick color, font, or spacing recommendations to maximize read-through."
}`;

    case 'reels_shorts_script':
      return `${baseContext}
TASK: Write a retention-focused, short-form video script for ${platform} (${req.duration || '30-60s'}).
Return strictly a valid JSON object matching this schema:
{
  "videoTitle": "Catchy working title",
  "estimatedDuration": "${req.duration || '45-60 seconds'}",
  "targetEmotion": "e.g. Relieved, Curious, Amused, Inspired",
  "scriptSections": [
    {
      "timeRange": "0:00 - 0:03",
      "sectionName": "The 3-Second Hook",
      "speakerText": "Exact words speaker says",
      "visualCue": "What happens visually on camera (action, prop, movement)",
      "onScreenText": "Short bold overlay text (max 4-5 words)"
    },
    {
      "timeRange": "0:03 - 0:12",
      "sectionName": "Agitation & Context",
      "speakerText": "...",
      "visualCue": "...",
      "onScreenText": "..."
    },
    {
      "timeRange": "0:12 - 0:35",
      "sectionName": "The Core Solution / 3 Steps",
      "speakerText": "...",
      "visualCue": "B-roll or demonstration guidance",
      "onScreenText": "..."
    },
    {
      "timeRange": "0:35 - 0:45",
      "sectionName": "Payoff & Direct CTA",
      "speakerText": "...",
      "visualCue": "...",
      "onScreenText": "..."
    }
  ],
  "audioMusicDirection": "Recommended sound/track style, pacing, and vibe",
  "caption": "Short-form video description and comment trigger for the algorithm."
}`;

    case 'video_ideas':
      return `${baseContext}
TASK: Generate 8-10 high-retention video ideas tailored for ${platform}.
Return strictly a valid JSON object matching this schema:
{
  "strategySummary": "Short explanation of the audience psychological trigger used in these concepts.",
  "ideas": [
    {
      "title": "Clickable, high-CTR video title",
      "hook": "Opening 3-second hook line",
      "format": "Talking head / Tutorial / Story / Skit / Behind the scenes",
      "angle": "Curiosity / Contrarian / Step-by-step / Mistake avoidance",
      "talkingPoints": [
        "Point 1",
        "Point 2",
        "Point 3"
      ],
      "retentionCTA": "Specific question or keyword to ask viewers to comment."
    }
  ]
}`;

    case 'social_article':
      return `${baseContext}
TASK: Write an insightful, authoritative social article or newsletter for ${platform} (e.g. LinkedIn Pulse, Facebook Note, or Newsletter).
Return strictly a valid JSON object matching this schema:
{
  "articleTitle": "Compelling, thought-leadership headline",
  "subtitle": "Short hook or teaser sentence",
  "readTime": "3-4 min read",
  "contentMarkdown": "Full article written in clean GitHub-flavored markdown with ## subheadings, bullet points where helpful, concrete stories or breakdowns, and zero corporate buzzwords.",
  "keyTakeaways": [
    "Takeaway 1",
    "Takeaway 2",
    "Takeaway 3"
  ],
  "discussionPrompt": "A thoughtful closing question to spark high-level comments in the feed."
}`;

    case 'repurpose_pack':
      return `${baseContext}
SOURCE CONTENT TO REPURPOSE:
${req.sourceContent || topic}

TASK: Repurpose the source content into a 5-channel content pack.
Return strictly a valid JSON object matching this schema:
{
  "summary": "Core theme extracted from source",
  "storyPost": {
    "platform": "Facebook / Instagram",
    "headline": "Story Hook",
    "content": "Personal, relatable narrative post."
  },
  "carouselOutline": {
    "platform": "Instagram / LinkedIn",
    "title": "5-Slide Educational Breakdown",
    "slides": [
      { "slide": 1, "text": "Cover hook" },
      { "slide": 2, "text": "The hidden problem" },
      { "slide": 3, "text": "The core shift" },
      { "slide": 4, "text": "Step-by-step fix" },
      { "slide": 5, "text": "Summary & Save CTA" }
    ]
  },
  "shortVideoScript": {
    "platform": "TikTok / Reels / YouTube Shorts",
    "duration": "30-45s",
    "hook": "Opening punchline",
    "body": "Rapid-fire 3 points",
    "cta": "Comment trigger"
  },
  "authorityPost": {
    "platform": "LinkedIn",
    "hook": "Thought-leadership hook",
    "content": "Structured professional post with practical framework and lessons."
  },
  "tweetThread": {
    "platform": "X / Twitter",
    "tweets": [
      "Tweet 1 (Hook + thread starter)",
      "Tweet 2",
      "Tweet 3",
      "Tweet 4",
      "Tweet 5 (Summary + RT CTA)"
    ]
  }
}`;

    default:
      throw new Error(`Unsupported tool: ${req.tool}`);
  }
}

function getFallbackData(req: SocialWorkspaceRequest): unknown {
  const isBengali = /bengali|bangla/i.test(req.language || '');
  const topic = req.topic || 'Social Growth';

  if (req.tool === 'viral_caption') {
    return {
      headline: isBengali ? `${topic} নিয়ে ভাইরাল ক্যাপশন প্যাক` : `Viral Caption Kit for ${topic}`,
      hookVariations: [
        { type: "Curiosity Gap", hook: isBengali ? `অধিকাংশ মানুষ ${topic} নিয়ে যেটা ভাবে, আসল সত্যটা তার সম্পূর্ণ উল্টো...` : `Most people completely misunderstand ${topic}. Here is what actually happens...` },
        { type: "Contrarian", hook: isBengali ? `যদি আপনি ${topic} এ সফল হতে চান, তাহলে এই সাধারণ ভুলটা আজই বন্ধ করুন:` : `Stop making this standard mistake if you want real results with ${topic}:` },
        { type: "Problem-Agitate", hook: isBengali ? `${topic} নিয়ে কাজ করতে গিয়ে বারবার হতাশ হচ্ছেন? সমস্যাটা এখানে:` : `Feeling stuck with ${topic}? Here is why your current approach isn't working:` },
        { type: "Bold Proof", hook: isBengali ? `কোনো জটিলতা ছাড়াই কীভাবে ${topic} এর সেরা ফলাফল বের করবেন:` : `How we simplified ${topic} to achieve consistent, scalable outcomes:` },
        { type: "Story Hook", hook: isBengali ? `৬ মাস আগে ${topic} নিয়ে একটা বড় ধাক্কা খাওয়ার পর যা শিখলাম:` : `A few months ago, a crucial lesson changed how I view ${topic}:` }
      ],
      primaryCaption: isBengali
        ? `আমরা অনেকেই ${topic} নিয়ে শুরুতেই অতিরিক্ত জটিল করে ফেলি।\n\nকিন্তু বাস্তবতা হলো, আপনি যদি ৩টি বিষয় পরিষ্কার রাখেন:\n১. আপনার অডিয়েন্সের প্রধান সমস্যা ঠিক কী\n২. সমাধানটি কত সহজে ডেলিভার করা যায়\n৩. কাস্টমারকে পরবর্তী কোন কাজটি করতে হবে\n\nতাহলে অপ্রয়োজনীয় হ্যাপা ছাড়াই আপনি কাঙ্ক্ষিত রেজাল্ট পাবেন।\n\nআপনি কি বর্তমানে ${topic} নিয়ে কোনো নতুন ক্যাম্পেইন শুরু করার কথা ভাবছেন? নিচে কমেন্টে জানান!`
        : `Most people overcomplicate ${topic}.\n\nWhen you cut through the noise, winning comes down to three basic fundamentals:\n1. Knowing the exact friction point your audience feels\n2. Making your solution frictionless and believable\n3. Giving one clear, high-intent next step\n\nNo buzzwords. Just practical execution.\n\nWhat is your biggest bottleneck with ${topic} right now? Drop a comment below.`,
      alternativeCaptions: [
        { label: "Short & Punchy", caption: isBengali ? `${topic} এ রেজাল্ট পেতে বড় বাজেট লাগে না, দরকার সঠিক ফোকাস আর ধারাবাহিকতা। একমত হলে শেয়ার করুন!` : `You don't need complicated tactics for ${topic}. You just need clear positioning and relentless consistency.` },
        { label: "Question-Led", caption: isBengali ? `${topic} নিয়ে আপনার সবচেয়ে বড় চ্যালেঞ্জ কোনটি? কমেন্টে জানান, সেরা সমাধান শেয়ার করছি।` : `What is the single hardest part about ${topic} for your team right now? Let's discuss below.` },
        { label: "Direct Offer", caption: isBengali ? `${topic} এ আরও বেটার আউটপুট পেতে চান? আমাদের বিস্তারিত গাইড পেতে ইনবক্সে 'INFO' মেসেজ দিন।` : `Ready to level up your ${topic} strategy? Drop 'GUIDE' below and we'll send the full roadmap.` }
      ],
      hashtags: ["#ContentStrategy", "#MarketingTips", "#BusinessGrowth", "#CreatorEconomy", "#SocialGrowth"],
      engagementTip: isBengali ? "পোস্টের প্রথম ২ লাইনে পাঞ্চি হুক দিন এবং কমেন্টে সবার প্রশ্নের দ্রুত উত্তর দিন।" : "Keep the first two lines under 120 characters to win the 'See More' click."
    };
  }

  if (req.tool === 'reels_shorts_script') {
    return {
      videoTitle: `${topic}: 45-Second Action Blueprint`,
      estimatedDuration: "45 seconds",
      targetEmotion: "High Curiosity & Clarity",
      scriptSections: [
        {
          timeRange: "0:00 - 0:03",
          sectionName: "The 3-Second Hook",
          speakerText: isBengali ? `${topic} নিয়ে এই ভুলটা আপনিও করছেন না তো?` : `Are you still making this mistake with ${topic}?`,
          visualCue: "Speaker leans towards camera with confident eye contact",
          onScreenText: "STOP DOING THIS"
        },
        {
          timeRange: "0:03 - 0:15",
          sectionName: "Agitation",
          speakerText: isBengali ? `বেশিরভাগ মানুষ মনে করে শুধু চেষ্টা করলেই হবে, কিন্তু সঠিক স্ট্র্যাটেজি ছাড়া পুরো সময়টাই নষ্ট হয়।` : `Most creators focus on vanity tactics and wonder why engagement stays flat.`,
          visualCue: "Quick cut / screen recording demonstration",
          onScreenText: "The Real Problem"
        },
        {
          timeRange: "0:15 - 0:35",
          sectionName: "The Solution",
          speakerText: isBengali ? `আজ থেকেই এই ৩টি স্টেপ ফলো করুন: প্রথমত নিশ ক্লিয়ার করুন, দ্বিতীয়ত প্র্যাকটিক্যাল ভ্যালু দিন, আর তৃতীয়ত সহজ CTA রাখুন।` : `Here are the 3 non-negotiables: clarify your core hook, give one actionable takeaway, and remove all fluff.`,
          visualCue: "Hands gesturing 1, 2, 3 with on-screen popups",
          onScreenText: "3 Steps to Win"
        },
        {
          timeRange: "0:35 - 0:45",
          sectionName: "Payoff & CTA",
          speakerText: isBengali ? `ভিডিওটি সেভ করে রাখুন যাতে পরে কাজে লাগাতে পারেন। আর পরের পার্ট দেখতে ফলো করুন!` : `Save this reel so you don't lose it, and drop 'ROADMAP' below for the breakdown!`,
          visualCue: "Speaker points down to save icon",
          onScreenText: "SAVE THIS REEL"
        }
      ],
      audioMusicDirection: "Upbeat, low-frequency lo-fi or modern tech ambient beat",
      caption: isBengali ? `${topic} নিয়ে আপনার কি কোনো প্রশ্ন আছে? কমেন্টে জানান!` : `Save this before you plan your next campaign on ${topic}.`
    };
  }

  // Generic fallback
  return {
    title: `${topic} Workspace Asset`,
    summary: `Structured social media asset generated for ${topic}.`,
    details: `Content successfully framed for ${req.platform || 'Social Platforms'}.`
  };
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'social-workspace', 20, 60_000);
    if (limited) return limited;

    const body = (await req.json()) as SocialWorkspaceRequest;
    if (!body.tool) {
      return NextResponse.json({ success: false, error: 'Missing required field: tool' }, { status: 400 });
    }

    const prompt = buildPrompt(body);

    try {
      const rawText = await callAiWithFallback(prompt);
      const cleaned = extractJsonText(rawText);
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        success: true,
        provider: 'ai',
        tool: body.tool,
        data: parsed,
      });
    } catch (aiError) {
      console.warn('AI Social Workspace generation failed, serving structured fallback:', aiError);
      return NextResponse.json({
        success: true,
        provider: 'fallback',
        tool: body.tool,
        data: getFallbackData(body),
        warning: 'AI took longer than expected; generated a structured blueprint locally.',
      });
    }
  } catch (err: unknown) {
    console.error('Social Workspace API Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
