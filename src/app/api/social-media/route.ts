import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { extractJsonText, generateGeminiText } from '@/lib/gemini';

function cleanSnippet(text: string) {
  return text
    .replace(/[—–]/g, ',')
    .replace(/[“”]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/\*\*/g, '')
    .replace(/"([^"\n]{1,140})"/g, '$1')
    .replace(/\s#[A-Za-z0-9_]+/g, '')
    .replace(/\[Link to Article\]|\[link\]|\[read more\]/gi, 'Read the full article when it is published.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getArticleSignals(title: string, summary: string, articleText: string) {
  const source = `${title}\n${summary}\n${articleText}`.replace(/\s+/g, ' ').trim();
  const sentences = source
    .split(/(?<=[.!?।])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 40 && sentence.length < 220);

  return {
    hook: sentences[0] || summary || title,
    insight: sentences[1] || sentences[0] || summary || title,
    action: sentences[2] || sentences[1] || 'Turn the idea into a clear action plan before you publish or practice it.',
  };
}

function fallbackSnippets(title: string, summary: string, language: string, articleText = '') {
  const isBengali = /bengali|bangla/i.test(language) || /[\u0980-\u09FF]/.test(`${title} ${summary}`);
  const signals = getArticleSignals(title, summary, articleText);
  if (isBengali) {
    return {
      linkedin: cleanSnippet(`${title}

এই বিষয়টা নিয়ে অনেকেই দ্রুত সিদ্ধান্তে চলে যায়। কিন্তু আসল কাজটা শুরু হয় যখন আমরা প্রশ্ন করি, এটা আমার শেখা, ক্যারিয়ার বা কনটেন্ট প্ল্যানে কীভাবে কাজে লাগবে?

এই আর্টিকেলে আমি তিনটা জিনিস পরিষ্কার করেছি:

1. ${signals.hook}
2. ${signals.insight}
3. ${signals.action}

যারা শুধু তথ্য না, বাস্তবে ব্যবহার করার মতো একটা পরিষ্কার ধারণা চান, তাদের জন্য পোস্টটা কাজে লাগবে।

আপনি হলে এই বিষয়টা শেখার সময় প্রথমে কোন প্রশ্নটা করতেন?`),
      facebook: cleanSnippet(`${title}

অনেক সময় আমরা একটা বিষয় নিয়ে পড়ি, কিন্তু শেষে কী করব সেটা পরিষ্কার হয় না।

এই লেখাটার লক্ষ্য সেটাই ঠিক করা। সহজ ভাষায় বিষয়টা বোঝানো, কোথায় ভুল হওয়ার সম্ভাবনা আছে সেটা দেখানো, আর শেষে কীভাবে এগোতে হবে তার একটা বাস্তব পথ দেওয়া।

বিশেষ করে যারা শেখা শুরু করছেন বা কনটেন্ট বানাতে চান, তাদের জন্য এটা একটা ভালো রেফারেন্স হতে পারে।

আপনার মনে হলে কারও কাজে লাগবে, শেয়ার করে দিতে পারেন।`),
      twitter: [
        cleanSnippet(`${title}\n\nবিষয়টা বুঝতে হলে আগে একটা জিনিস পরিষ্কার করতে হবে, মানুষ আসলে কোন সমস্যার উত্তর খুঁজছে।`),
        cleanSnippet(`শুধু তথ্য দিলেই ভালো কনটেন্ট হয় না। ভালো কনটেন্ট পাঠককে সিদ্ধান্ত নিতে সাহায্য করে।`),
        cleanSnippet(`${signals.action}`),
        cleanSnippet('শেষ কথা, শেখার সময় ছোট ছোট ধাপে এগোন। আগে ধারণা, তারপর উদাহরণ, তারপর বাস্তব প্রয়োগ।'),
      ].map(cleanSnippet),
    };
  }

  return {
    linkedin: cleanSnippet(`${title}

Most people do not need another surface level explanation. They need a clear way to understand the topic, judge what matters, and decide what to do next.

This article focuses on three useful angles:

1. ${signals.hook}
2. ${signals.insight}
3. ${signals.action}

The goal is not to sound clever. The goal is to make the topic easier to use in real work, learning, or content planning.

What is the first question you would ask before applying this?`),
    facebook: cleanSnippet(`${title}

I wrote this for people who want the topic explained without fluff.

The article breaks down what matters, where beginners usually get stuck, and how to turn the idea into a practical next step.

If you are learning, planning content, or trying to make a better decision, this should give you a clearer starting point.

What part of this topic feels most confusing to you right now?`),
    twitter: [
      cleanSnippet(`${title}\n\nA useful way to approach this topic is to start with the reader problem, not the keyword.`),
      cleanSnippet('Good content does more than explain. It helps someone make a better decision.'),
      cleanSnippet(`${signals.action}`),
      cleanSnippet('Simple rule, explain the idea, show the tradeoffs, then give the reader a next step.'),
    ].map(cleanSnippet),
  };
}

function normalizeSnippets(value: unknown, title: string, summary: string, language: string, articleText: string) {
  const fallback = fallbackSnippets(title, summary, language, articleText);
  if (!value || typeof value !== 'object') return fallback;
  const data = value as Record<string, unknown>;
  return {
    linkedin: typeof data.linkedin === 'string' && data.linkedin.trim() ? cleanSnippet(data.linkedin) : fallback.linkedin,
    facebook: typeof data.facebook === 'string' && data.facebook.trim() ? cleanSnippet(data.facebook) : fallback.facebook,
    twitter: Array.isArray(data.twitter) && data.twitter.length > 0
      ? data.twitter.map(item => cleanSnippet(String(item))).filter(Boolean)
      : fallback.twitter,
  };
}

export async function POST(req: Request) {
  let title = '';
  let summary = '';
  let language = 'English';
  let articleText = '';

  try {
    const limited = enforceRateLimit(req, 'social-media', 10, 60_000);
    if (limited) return limited;

    const body = await req.json();
    title = typeof body.title === 'string' ? body.title : 'Generated Article';
    summary = typeof body.summary === 'string' ? body.summary : '';
    language = typeof body.language === 'string' ? body.language : 'English';
    articleText = typeof body.articleText === 'string' ? body.articleText.slice(0, 5000) : '';

    const prompt = `You are a senior social media editor for a tech education brand.
Write posts that feel human, thoughtful, specific and useful. Avoid generic AI wording.

Article title: ${title}
Meta summary: ${summary}
Article excerpt:
${articleText || summary}

Output language: ${language}

Style rules:
- No em dash. Do not use — or –.
- Do not wrap the title or key phrases in quotation marks.
- Avoid hype words such as game changing, ultimate, unlock, boost, skyrocket, crush, dominate.
- Avoid placeholder text such as [link], read the full article here, or link in comments.
- Do not sound like a generic AI assistant.
- Do not use hashtags.
- Do not use decorative emojis unless the article topic explicitly needs one.
- Do not use Markdown bold, italic, headings, or decorative formatting.
- Use short human paragraphs with natural rhythm.
- Use bullets only where they add clarity.
- If the output language is Bengali or Banglish, write in natural, conversational Bangla/Banglish as spoken and written colloquially by people in Bangladesh. Avoid stiff, textbook "Shuddho" Bangla. Brand names, AI models, software/tool names, programming languages, and tech acronyms (e.g., Claude, ChatGPT, Gemini, SEO, API, Python, WordPress, React, HTML) MUST strictly remain in their original English script (e.g., write "Claude" and "ChatGPT", NOT "ক্লদ" or "চ্যাটজিপিটি"). Keep other common everyday English terms in English script or transliterate them into Bangla script (e.g., using "ক্যারিয়ার", "ভিডিও", "সাবস্ক্রাইব", "চ্যানেল", "কনটেন্ট", "মার্কেটিং", "আপডেট", "টিউটোরিয়াল", "টিপস").
- Make each post specific to the article excerpt.
- Give one concrete insight, one practical takeaway, and one natural question.

Platform requirements:
1. linkedin: 140-220 words. Reflective professional tone. Strong hook, 3 numbered points, grounded ending question.
2. facebook: 90-150 words. Warm and conversational. No corporate tone.
3. twitter: array of 4 posts. Each post under 260 characters. Natural thread, no numbering unless it feels necessary.

Format the output as a clean JSON object with keys: linkedin, facebook, twitter (array for thread).
Return ONLY the JSON.`;

    const text = await generateGeminiText(prompt);
    const snippets = normalizeSnippets(JSON.parse(extractJsonText(text)), title, summary, language, articleText);

    return NextResponse.json({ success: true, snippets });
  } catch (error) {
    console.error('Social Media API Error:', error);
    return NextResponse.json({
      success: true,
      snippets: fallbackSnippets(title || 'Generated Article', summary, language, articleText),
      warning: 'AI social snippet generation failed, so safe fallback snippets were returned.',
    });
  }
}
