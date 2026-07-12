import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { extractOpenRouterJson, generateKeywordResearchJson, OPENROUTER_KEYWORD_MODEL } from '@/lib/openrouter';
import { extractJsonText, generateGeminiText, GEMINI_TEXT_MODEL } from '@/lib/gemini';

interface SocialBuzzItem {
  platform: string;
  icon: string;
  title?: string;
  link?: string;
  date?: string;
}

interface KeywordAiData {
  difficulty?: number;
  volume?: string;
  intent?: string;
  cpc?: string;
  trend?: string;
  strategy?: string;
  content_angles?: string[];
  social_media?: Record<string, string>;
  serp_features?: string[];
  target_audience?: string;
  monetization?: string;
  ai_prompts?: string[];
}

function keywordPrompt(
  keyword: string,
  location: string | undefined,
  language: string | undefined,
  businessType: string | undefined,
  purpose: string | undefined,
  searchQuestions: SearchQuestionsData,
) {
  return `Today: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
Keyword: "${keyword}". Location=${location || 'Global'}, Language=${language || 'English'}, Business=${businessType || 'Tech Blog'}, Purpose=${purpose || 'Content'}.
Public autocomplete question signals: ${searchQuestions.items.slice(0, 10).join(' | ') || 'No strong question signals found'}.
Use current public reasoning where available. Values such as search volume, CPC and difficulty must be clearly treated as practical estimates unless an accessible source establishes them. Never return "N/A".
Create five useful content angles. The strategy should be three concise sentences.
Create exactly 10 "ai_prompts" in ${language || 'English'}: short, natural questions a learner interested in this topic would plausibly ask ChatGPT, Gemini, or Claude. These are query ideas, not verified private platform search logs. They must be in question form, useful to beginners, distinct from one another, and must not ask the AI to write blog posts, SEO briefs, metadata, social posts, or content marketing material.
Return ONLY one JSON object using these exact keys:
{"difficulty":number,"volume":"string","intent":"string","cpc":"string","trend":"Rising|Stable|Declining","strategy":"string","content_angles":["string"],"social_media":{"twitter":"string","linkedin":"string","youtube":"string","tiktok":"string","facebook":"string"},"serp_features":["string"],"target_audience":"string","monetization":"string","ai_prompts":["string"]}`;
}

function normalizeAiData(value: unknown): KeywordAiData {
  if (!value || typeof value !== 'object') return {};
  const data = value as KeywordAiData;
  return {
    ...data,
    difficulty: typeof data.difficulty === 'number' ? Math.max(1, Math.min(100, Math.round(data.difficulty))) : undefined,
    content_angles: Array.isArray(data.content_angles) ? data.content_angles.map(String).filter(Boolean).slice(0, 8) : undefined,
    ai_prompts: Array.isArray(data.ai_prompts) ? data.ai_prompts.map(String).filter(Boolean).slice(0, 10) : undefined,
    serp_features: Array.isArray(data.serp_features) ? data.serp_features.map(String).filter(Boolean).slice(0, 8) : undefined,
    social_media: data.social_media && typeof data.social_media === 'object' ? data.social_media : undefined,
  };
}

interface SearchQuestionsData {
  items: string[];
  basis: string;
}

function getLearnerPromptFallback(keyword: string, language: string): string[] {
  if (language === 'Bengali') {
    return [
      `${keyword} কী, একদম নতুন শিক্ষার্থীর জন্য সহজভাবে বুঝিয়ে বলো?`,
      `${keyword} বাস্তবে কীভাবে কাজ করে?`,
      `${keyword} শেখা কীভাবে ধাপে ধাপে শুরু করতে পারি?`,
      `${keyword} নিয়ে নতুনরা সাধারণত কী কী ভুল করে?`,
      `${keyword} শেখার জন্য আমার কোন টুল বা রিসোর্স দরকার?`,
      `${keyword}-এর একটি সহজ বাস্তব উদাহরণ দেখাতে পারো?`,
      `${keyword} বুঝতে বা ব্যবহার শিখতে সাধারণত কত সময় লাগে?`,
      `${keyword} এবং এর প্রচলিত বিকল্পগুলোর মধ্যে পার্থক্য কী?`,
      `${new Date().getFullYear()} সালে ${keyword} শেখা বা ব্যবহার করা কি লাভজনক?`,
      `${keyword}-এর বেসিক শেখার পরে আমার পরবর্তী কী শেখা উচিত?`
    ];
  }

  if (language === 'Hindi') {
    return [
      `${keyword} क्या है, इसे एक बिल्कुल नए विद्यार्थी के लिए आसान भाषा में समझाओ?`,
      `${keyword} असल जिंदगी में कैसे काम करता है?`,
      `मैं ${keyword} को चरण-दर-चरण सीखना कैसे शुरू करूं?`,
      `${keyword} में शुरुआती लोग आम तौर पर कौन सी गलतियां करते हैं?`,
      `${keyword} सीखने के लिए मुझे किन टूल्स या संसाधनों की जरूरत है?`,
      `क्या तुम ${keyword} का एक सरल व्यावहारिक उदाहरण दिखा सकते हो?`,
      `${keyword} समझने या इस्तेमाल करने में आम तौर पर कितना समय लगता है?`,
      `${keyword} और इसके सामान्य विकल्पों में क्या अंतर है?`,
      `क्या ${new Date().getFullYear()} में ${keyword} सीखना या इस्तेमाल करना उपयोगी है?`,
      `${keyword} की बुनियाद समझने के बाद मुझे आगे क्या सीखना चाहिए?`
    ];
  }

  return [
    `What is ${keyword}, explained simply for a complete beginner?`,
    `How does ${keyword} work in real life?`,
    `How can I get started with ${keyword} step by step?`,
    `What are the most common beginner mistakes with ${keyword}?`,
    `What tools or resources do I need to learn ${keyword}?`,
    `Can you show me a simple practical example of ${keyword}?`,
    `How long does it usually take to become comfortable with ${keyword}?`,
    `How is ${keyword} different from its common alternatives?`,
    `Is ${keyword} worth learning or using in ${new Date().getFullYear()}?`,
    `What should I learn next after I understand the basics of ${keyword}?`
  ];
}

function getSearchQuestionFallback(keyword: string, language: string): string[] {
  if (language === 'Bengali') {
    return [
      `${keyword} কী?`,
      `${keyword} কীভাবে কাজ করে?`,
      `${keyword} কীভাবে শুরু করবো?`,
      `${keyword} শেখার সেরা উপায় কী?`,
      `${keyword}-এর সুবিধা কী?`,
      `${keyword}-এর অসুবিধা কী?`,
      `${keyword} ব্যবহারের খরচ কত?`,
      `${keyword}-এর সেরা টুল কোনগুলো?`,
      `${keyword} নতুনদের জন্য ভালো কি?`,
      `${keyword}-এর বিকল্প কী কী?`
    ];
  }

  if (language === 'Hindi') {
    return [
      `${keyword} क्या है?`,
      `${keyword} कैसे काम करता है?`,
      `${keyword} शुरू कैसे करें?`,
      `${keyword} सीखने का सबसे अच्छा तरीका क्या है?`,
      `${keyword} के फायदे क्या हैं?`,
      `${keyword} के नुकसान क्या हैं?`,
      `${keyword} इस्तेमाल करने की लागत कितनी है?`,
      `${keyword} के लिए सबसे अच्छे टूल कौन से हैं?`,
      `क्या ${keyword} शुरुआती लोगों के लिए अच्छा है?`,
      `${keyword} के विकल्प क्या हैं?`
    ];
  }

  return [
    `What is ${keyword}?`,
    `How does ${keyword} work?`,
    `How to get started with ${keyword}?`,
    `What is the best way to learn ${keyword}?`,
    `What are the benefits of ${keyword}?`,
    `What are the disadvantages of ${keyword}?`,
    `How much does ${keyword} cost?`,
    `What are the best tools for ${keyword}?`,
    `Is ${keyword} good for beginners?`,
    `What are the alternatives to ${keyword}?`
  ];
}

// Google Autocomplete (FREE)
async function getSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    return data[1] || [];
  } catch { return []; }
}

async function getSearchQuestions(kw: string, language: string): Promise<SearchQuestionsData> {
  const px = ['what is', 'how to', 'why', 'when to', 'can I', 'is', 'does', 'how does', 'should I', 'which'];
  const r = await Promise.all(px.map(p => getSuggestions(`${p} ${kw}`)));
  const observed = [...new Set(r.flat())];
  const combined = [...observed];

  for (const fallbackQuestion of getSearchQuestionFallback(kw, language)) {
    if (combined.length >= 10) break;
    if (!combined.some(question => question.toLowerCase() === fallbackQuestion.toLowerCase())) {
      combined.push(fallbackQuestion);
    }
  }

  return {
    items: combined.slice(0, 15),
    basis: observed.length >= 10 ? 'Google autocomplete' : 'Google autocomplete + suggested questions'
  };
}

async function getRealComparisons(kw: string): Promise<string[]> {
  const sx = ['vs', 'or', 'alternatives', 'compared to', 'better than'];
  const r = await Promise.all(sx.map(s => getSuggestions(`${kw} ${s}`)));
  return [...new Set(r.flat())].slice(0, 10);
}

async function getRelatedKeywords(kw: string): Promise<string[]> {
  const letters = ['a', 'b', 'c', 'f', 'i', 'p', 'r', 's', 't', 'w'];
  const r = await Promise.all(letters.map(l => getSuggestions(`${kw} ${l}`)));
  return [...new Set(r.flat())].slice(0, 20);
}

// Social Media Buzz (FREE - Google News search per platform)
async function getSocialBuzz(kw: string): Promise<SocialBuzzItem[]> {
  const platforms = [
    { name: 'Reddit', query: `${kw} site:reddit.com`, icon: 'reddit' },
    { name: 'YouTube', query: `${kw} site:youtube.com`, icon: 'youtube' },
    { name: 'LinkedIn', query: `${kw} site:linkedin.com`, icon: 'linkedin' },
    { name: 'Twitter/X', query: `${kw} twitter OR tweet`, icon: 'twitter' },
  ];

  const results = await Promise.all(platforms.map(async (p) => {
    try {
      const Parser = (await import('rss-parser')).default;
      const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
      const feed = await parser.parseURL(
        `https://news.google.com/rss/search?q=${encodeURIComponent(p.query)}+when:7d&hl=en-US&gl=US&ceid=US:en`
      );
      return feed.items.slice(0, 3).map(item => ({
        platform: p.name,
        icon: p.icon,
        title: item.title,
        link: item.link,
        date: item.pubDate
      }));
    } catch { return []; }
  }));

  return results.flat();
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'keywords', 10, 60_000);
    if (limited) return limited;

    const { keyword, location, language, businessType, purpose } = await req.json();
    if (!keyword) return NextResponse.json({ success: false, error: 'Please enter a keyword' }, { status: 400 });

    // Step 1: ALL free data in parallel
    const [directSuggestions, searchQuestions, comparisons, relatedKeywords, socialBuzz] = await Promise.all([
      getSuggestions(keyword),
      getSearchQuestions(keyword, language || 'English'),
      getRealComparisons(keyword),
      getRelatedKeywords(keyword),
      getSocialBuzz(keyword)
    ]);

    // Step 2: Web-grounded OpenRouter analysis with strict structured output
    let aiData: KeywordAiData = {};
    let aiError = '';
    let aiProvider = '';
    let aiModel = '';
    const prompt = keywordPrompt(keyword, location, language, businessType, purpose, searchQuestions);
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const content = await generateKeywordResearchJson(prompt);
        aiData = normalizeAiData(JSON.parse(extractOpenRouterJson(content)));
        aiProvider = 'OpenRouter';
        aiModel = OPENROUTER_KEYWORD_MODEL;
      } catch (error: unknown) {
        aiError = error instanceof Error ? error.message : 'OpenRouter API error';
        console.error('AI error:', aiError);
      }
    } else {
      aiError = 'OPENROUTER_API_KEY is not configured.';
    }

    if (aiError && process.env.GEMINI_API_KEY) {
      try {
        const content = await generateGeminiText(prompt);
        aiData = normalizeAiData(JSON.parse(extractJsonText(content)));
        aiProvider = 'Gemini fallback';
        aiModel = GEMINI_TEXT_MODEL;
        aiError = '';
      } catch (error: unknown) {
        const geminiError = error instanceof Error ? error.message : 'Gemini API error';
        console.error('Gemini keyword fallback error:', geminiError);
      }
    }

    const aiPrompts = aiData.ai_prompts?.length === 10
      ? aiData.ai_prompts
      : getLearnerPromptFallback(keyword, language || 'English');

    return NextResponse.json({
      success: true,
      data: {
        difficulty: aiData.difficulty || 50,
        volume: aiData.volume || '~1K+',
        intent: aiData.intent || 'Informational',
        cpc: aiData.cpc || '$0.30',
        trend: aiData.trend || 'Stable',
        strategy: aiData.strategy || '',
        content_angles: aiData.content_angles || [],
        social_media: aiData.social_media || {},
        ai_prompts: aiPrompts,
        ai_prompts_basis: aiData.ai_prompts?.length === 10
          ? 'Likely learner questions generated from topic and public search signals'
          : 'Suggested learner questions based on this topic',
        serp_features: aiData.serp_features || [],
        target_audience: aiData.target_audience || '',
        monetization: aiData.monetization || '',
        ai_error: aiError,
        ai_provider: aiError ? 'fallback estimates' : aiProvider,
        ai_model: aiError ? '' : aiModel,
        social_buzz: socialBuzz,
        keyword_ideas: directSuggestions,
        questions: searchQuestions.items,
        questions_basis: searchQuestions.basis,
        comparisons,
        related_keywords: relatedKeywords
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
