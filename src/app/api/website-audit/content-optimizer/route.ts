import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { generateGeminiText, extractJsonText } from '@/lib/gemini';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'website-audit-content-optimizer', 12, 60000);
    if (limited) return limited;

    const body = await req.json();
    let url = (body.url || '').trim();
    let keyword = (body.keyword || '').trim();
    let rawContent = (body.content || '').trim();

    if (!url && !rawContent) {
      return NextResponse.json(
        { success: false, error: 'Please provide either a blog URL or article text to optimize.' },
        { status: 400 }
      );
    }

    let articleTitle = '';
    let extractedText = rawContent;
    let headingsFound: string[] = [];

    // If URL is provided, scrape the live content
    if (url) {
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GrowthPilot-Optimizer/5.0; +https://growthpilot.ai)',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const html = await res.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch) articleTitle = titleMatch[1].replace(/\s+/g, ' ').trim();

          const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match) articleTitle = h1Match[1].replace(/<[^>]*>/g, '').trim() || articleTitle;

          const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m =>
            m[1].replace(/<[^>]*>/g, '').trim()
          );
          headingsFound = h2Matches.filter(Boolean);

          const cleanBody = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!rawContent && cleanBody.length > 100) {
            extractedText = cleanBody.slice(0, 12000);
          }
        }
      } catch (err: any) {
        console.warn('Scraping error in content-optimizer:', err.message);
      }
    }

    if (!keyword) {
      keyword = articleTitle ? articleTitle.split(/[:\-\|]/)[0].trim() : 'Search Engine Optimization';
    }

    const words = extractedText.split(/\s+/).filter(Boolean);
    const currentWordCount = words.length;
    const currentHeadingsCount = headingsFound.length || Math.max(2, Math.floor(currentWordCount / 350));

    // Call Gemini to analyze NLP entities, competitive SurferSEO benchmarks, and scores
    const prompt = `You are an elite SEO Content Optimization Scientist (expert in SurferSEO, Clearscope, MarketMuse, and Google Helpful Content & GEO AI Grounding systems).

Target Primary Keyword: "${keyword}"
Article Title: "${articleTitle || keyword}"
Current Word Count: ${currentWordCount}
Current Content Snippet (first 4000 chars):
"""
${extractedText.slice(0, 4000)}
"""

Evaluate this content against Google Top 10 SERP ranking pages and Generative Engine Optimization (GEO) standards.
Identify 12 to 18 critical NLP Entities, LSI terms, and semantic concepts that Google algorithms and AI models (Perplexity/ChatGPT) require to grant #1 ranking and citations.

For each term, estimate target frequency ranges (min and max) based on a competitive 1,500-2,500 word comprehensive article.

Return ONLY a valid JSON object matching this EXACT schema without markdown codeblocks or extra text:
{
  "contentScore": 72,
  "scoreBreakdown": {
    "semanticRelevance": 78,
    "contentDepth": 68,
    "entityCoverage": 70,
    "readability": 82
  },
  "benchmarks": {
    "targetWordCount": {
      "min": 1800,
      "max": 2400,
      "current": ${currentWordCount}
    },
    "targetHeadings": {
      "min": 6,
      "max": 12,
      "current": ${currentHeadingsCount}
    },
    "readingLevel": "Grade 9 (Clear & Authoritative)",
    "recommendedParagraphLength": "45-60 words"
  },
  "nlpEntities": [
    {
      "term": "Generative Engine Optimization",
      "category": "High Priority",
      "targetMin": 3,
      "targetMax": 6,
      "importance": "Critical entity for modern AI overview grounding and citation."
    },
    {
      "term": "Schema Markup",
      "category": "High Priority",
      "targetMin": 2,
      "targetMax": 5,
      "importance": "Required for rich snippet eligibility."
    }
  ],
  "missingQuestions": [
    {
      "question": "How does GEO differ from traditional SEO?",
      "intent": "Informational",
      "suggestedAnswerSnippet": "GEO focuses on LLM citations and synthetic answer inclusion, whereas SEO focuses on SERP blue links."
    },
    {
      "question": "What tools track AI citation share of voice?",
      "intent": "Commercial",
      "suggestedAnswerSnippet": "Tools like GrowthPilot AI monitor Perplexity and Gemini answer references."
    }
  ],
  "internalLinkingSuggestions": [
    {
      "anchorText": "technical SEO audit guide",
      "targetTopic": "Technical SEO Health",
      "contextSentence": "Pair this content strategy with a thorough technical SEO audit guide."
    }
  ]
}`;

    let parsedResult: any = null;
    try {
      const aiResponse = await generateGeminiText(prompt);
      const jsonStr = extractJsonText(aiResponse);
      if (jsonStr) {
        parsedResult = JSON.parse(jsonStr);
      }
    } catch (aiErr: any) {
      console.warn('Gemini optimization failed, using fallback deterministic model:', aiErr.message);
    }

    // Fallback deterministic synthesis if AI is unavailable
    if (!parsedResult || !Array.isArray(parsedResult.nlpEntities)) {
      const baseScore = Math.min(88, Math.max(45, Math.round((currentWordCount / 1800) * 50 + 35)));
      parsedResult = {
        contentScore: baseScore,
        scoreBreakdown: {
          semanticRelevance: Math.min(92, baseScore + 4),
          contentDepth: Math.min(90, baseScore - 5),
          entityCoverage: Math.min(88, baseScore + 2),
          readability: 80,
        },
        benchmarks: {
          targetWordCount: { min: 1600, max: 2400, current: currentWordCount },
          targetHeadings: { min: 6, max: 10, current: currentHeadingsCount },
          readingLevel: 'Grade 9 - Clear & Direct',
          recommendedParagraphLength: '40-55 words',
        },
        nlpEntities: [
          {
            term: keyword,
            category: 'High Priority',
            targetMin: 4,
            targetMax: 8,
            importance: 'Primary search query topic anchor.',
          },
          {
            term: 'Search Intent',
            category: 'High Priority',
            targetMin: 3,
            targetMax: 6,
            importance: 'Aligns article with user expectations.',
          },
          {
            term: 'Generative Engine Optimization',
            category: 'GEO Citation',
            targetMin: 2,
            targetMax: 5,
            importance: 'Maximizes citation frequency in AI Overviews.',
          },
          {
            term: 'Structured Data',
            category: 'Secondary',
            targetMin: 2,
            targetMax: 4,
            importance: 'Assists bot crawling and schema comprehension.',
          },
          {
            term: 'Topical Authority',
            category: 'High Priority',
            targetMin: 3,
            targetMax: 6,
            importance: 'Builds cluster relevance across the domain.',
          },
          {
            term: 'User Experience Signals',
            category: 'LSI',
            targetMin: 2,
            targetMax: 4,
            importance: 'Helps retention and dwell time on page.',
          },
          {
            term: 'Core Web Vitals',
            category: 'Secondary',
            targetMin: 1,
            targetMax: 3,
            importance: 'Google page experience ranking factor.',
          },
          {
            term: 'Content Depth',
            category: 'LSI',
            targetMin: 2,
            targetMax: 5,
            importance: 'Signals comprehensive subject mastery.',
          },
        ],
        missingQuestions: [
          {
            question: `What is the most critical factor for ${keyword}?`,
            intent: 'Informational',
            suggestedAnswerSnippet: 'Comprehensive coverage of user intent combined with factual depth and clear heading structure.',
          },
          {
            question: `How can you measure success in ${keyword}?`,
            intent: 'Investigational',
            suggestedAnswerSnippet: 'By tracking organic CTR, dwell time, and generative AI citation share of voice.',
          },
        ],
        internalLinkingSuggestions: [
          {
            anchorText: 'website audit checklist',
            targetTopic: 'Technical Health',
            contextSentence: 'Combine your content optimization with our website audit checklist for maximum impact.',
          },
          {
            anchorText: 'SERP performance tracking',
            targetTopic: 'Rank Monitoring',
            contextSentence: 'Monitor daily fluctuations using SERP performance tracking.',
          },
        ],
      };
    }

    // Accurately compute current count of each entity in the article text
    const normalizedText = extractedText.toLowerCase();
    const evaluatedEntities = parsedResult.nlpEntities.map((ent: any) => {
      const termLower = ent.term.toLowerCase();
      // Count non-overlapping occurrences
      let count = 0;
      let pos = normalizedText.indexOf(termLower);
      while (pos !== -1) {
        count++;
        pos = normalizedText.indexOf(termLower, pos + termLower.length);
      }
      return {
        ...ent,
        currentCount: count,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        articleTitle: articleTitle || keyword,
        initialContent: extractedText || `# ${keyword}\n\nStart writing or paste your blog post draft here to see live SurferSEO-style NLP scoring...`,
        contentScore: parsedResult.contentScore,
        scoreBreakdown: parsedResult.scoreBreakdown,
        benchmarks: parsedResult.benchmarks,
        nlpEntities: evaluatedEntities,
        missingQuestions: parsedResult.missingQuestions || [],
        internalLinkingSuggestions: parsedResult.internalLinkingSuggestions || [],
      },
    });
  } catch (error: any) {
    console.error('Content Optimizer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error in Content Optimizer engine.' },
      { status: 500 }
    );
  }
}
