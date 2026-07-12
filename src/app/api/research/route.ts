import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  extractOpenRouterJson,
  generateOpenRouterTextWithModelFallback,
  OPENROUTER_RESEARCH_MODELS,
} from '@/lib/openrouter';

function fallbackResearch(keyword: string, language: string, researchedAt: string) {
  return {
    statistics: [],
    solutions: [
      `Identify the newest framework, tooling, hiring, and learner-demand changes around "${keyword}".`,
      'Use official documentation and recent platform release notes for technical claims.',
      'Explain practical next steps without inventing unsourced statistics.',
    ],
    insights: [
      `Current research provider fallback is active; write conservatively about "${keyword}" and avoid unsupported numerical claims.`,
      'Prefer evergreen technical guidance, clear examples, and source links over fake trend numbers.',
    ],
    lsiKeywords: [
      keyword,
      `${keyword} roadmap`,
      `${keyword} trends`,
      `${keyword} skills`,
      `${keyword} examples`,
    ],
    researchedAt,
    sources: [
      'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      'https://schema.org/Article',
    ],
    warning: `Live research provider was unavailable; generated fallback research for ${language}.`,
  };
}

export async function POST(req: Request) {
  let keyword = '';
  let language = 'English';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Dhaka',
  });

  try {
    const limited = enforceRateLimit(req, 'research', 10, 60_000);
    if (limited) return limited;

    const body = await req.json();
    keyword = typeof body.keyword === 'string' ? body.keyword : '';
    language = typeof body.language === 'string' ? body.language : 'English';

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const prompt = `You are a web-grounded professional technical researcher.
Current date: ${currentDate}. Current year: ${currentYear}.
Conduct current research on the following topic for a high-quality tech blog article.
Topic: "${keyword}"
Output language for explanatory text: ${typeof language === 'string' ? language : 'English'}. Keep source URLs unchanged.

Find and provide:
1. 3-5 newest verifiable statistics or data points available as of ${currentDate}; prefer ${currentYear} sources. If the exact phrase has no survey, use a directly relevant industry, developer, labor-market or platform survey and explain its relevance. Include a measured number, the measurement year, publication/update date when available, and source URL in every item.
2. 3 Key technical challenges or "pain points" this topic solves.
3. 2 current expert-level insights, each with a source URL.
4. A list of 5 LSI (Latent Semantic Indexing) keywords that must be used.

Freshness rules:
- Do not use 2024 or older data for current claims.
- If a 2025 study is still the newest available evidence, it may be used only when explicitly labelled "latest available 2025 evidence" with a source URL.
- If no recent verifiable statistic is available, return fewer statistics rather than inventing a number.

Format the output as a clean JSON object with keys: statistics (array), solutions (array), insights (array), lsiKeywords (array), researchedAt (string), sources (array).
Return ONLY the JSON.`;

    const researchResult = await generateOpenRouterTextWithModelFallback(prompt, {
      models: OPENROUTER_RESEARCH_MODELS,
      maxCompletionTokens: 2400,
      temperature: 0.1,
      title: 'GrowthPilot AI Current Research',
      retries: 1,
    });
    const text = researchResult.text;
    const rawResearch = JSON.parse(extractOpenRouterJson(text)) as {
      statistics?: unknown[];
      solutions?: unknown[];
      insights?: unknown[];
      lsiKeywords?: unknown[];
      sources?: unknown[];
    };
    const toAsciiDigits = (value: string) => value.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
    const staleYear = /\b20(?:0\d|1\d|2[0-4])\b/;
    const usableRecentYear = /\b202[56]\b/;
    const safeStrings = (items: unknown[] | undefined) => (items || [])
      .filter((item): item is string => typeof item === 'string' && !staleYear.test(toAsciiDigits(item)));
    const researchData = {
      statistics: safeStrings(rawResearch.statistics).filter(item =>
        usableRecentYear.test(toAsciiDigits(item)) && /\d|[০-৯]/.test(item),
      ),
      solutions: safeStrings(rawResearch.solutions),
      insights: safeStrings(rawResearch.insights),
      lsiKeywords: safeStrings(rawResearch.lsiKeywords),
      sources: safeStrings(rawResearch.sources),
      researchedAt: currentDate,
    };
    if (researchData.statistics.length === 0) {
      const evidenceResult = await generateOpenRouterTextWithModelFallback(
        `Find 2-3 recent numerical data points that can responsibly support an article about "${keyword}".
Current date: ${currentDate}. Search for directly relevant developer, technology adoption, labor-market or platform survey evidence when an exact-topic statistic does not exist.
Only use 2026 evidence, or evidence explicitly labelled "latest available 2025 evidence".
Each item must contain a number, a year (2025 or 2026), and a complete HTTPS source URL.
Write each item in ${typeof language === 'string' ? language : 'English'} and return ONLY JSON: {"statistics":["..."],"sources":["..."]}.`,
        {
          models: OPENROUTER_RESEARCH_MODELS,
          maxCompletionTokens: 1200,
          temperature: 0.05,
          title: 'GrowthPilot AI Evidence Retrieval',
          retries: 1,
        },
      );
      const evidenceText = evidenceResult.text;
      const evidence = JSON.parse(extractOpenRouterJson(evidenceText)) as {
        statistics?: unknown[];
        sources?: unknown[];
      };
      researchData.statistics = safeStrings(evidence.statistics).filter(item =>
        usableRecentYear.test(toAsciiDigits(item)) && /\d|[০-৯]/.test(item),
      );
      researchData.sources = Array.from(new Set([
        ...researchData.sources,
        ...safeStrings(evidence.sources),
      ]));
    }
    if (researchData.sources.length === 0) {
      researchData.statistics = [];
    }

    return NextResponse.json({
      success: true,
      provider: 'OpenRouter',
      model: researchResult.model,
      research: researchData,
    });
  } catch (error) {
    console.error('Research API Error:', error);
    if (keyword) {
      return NextResponse.json({
        success: true,
        provider: 'Fallback research',
        model: null,
        research: fallbackResearch(keyword, language, currentDate),
        warning: 'Live research provider is unavailable, so a conservative fallback was used.',
      });
    }
    return NextResponse.json({ success: false, error: 'Research provider is unavailable.' }, { status: 503 });
  }
}
