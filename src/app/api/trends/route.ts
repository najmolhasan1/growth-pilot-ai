import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { enforceRateLimit } from '@/lib/rate-limit';
import { extractOpenRouterJson, generateOpenRouterText, OPENROUTER_RESEARCH_MODEL } from '@/lib/openrouter';

interface TrendItem {
  title: string;
  proposedTitle?: string;
  targetKeyword?: string;
  opportunityType?: 'Trending' | 'Evergreen' | 'Hybrid';
  searchIntent?: string;
  reason?: string;
  link: string;
  pubDate: string;
  sourceName: string;
  sourceCategory: string;
  sourceIcon: string;
  language: string;
  topic: string;
  score: number;
  isSmartPick?: boolean;
}

interface RecommendationPick {
  index: number;
  proposedTitle: string;
  targetKeyword: string;
  opportunityType: 'Trending' | 'Evergreen' | 'Hybrid';
  searchIntent: string;
  reason: string;
  score: number;
}

const parser = new Parser({
  headers: {
    'User-Agent': 'GrowthPilotAI-Content-Intelligence/1.0',
  },
  timeout: 15000,
});

const FEEDS = [
  { name: 'AI Product Radar', url: 'https://news.google.com/rss/search?q=Claude+OR+ChatGPT+OR+Gemini+OR+Cursor+AI+OR+Copilot+OR+Windsurf+when:7d&hl=en-US&gl=US&ceid=US:en', category: 'Tech Update', icon: 'zap' },
  { name: 'Web Dev Radar', url: 'https://news.google.com/rss/search?q=Next.js+OR+React+OR+TypeScript+OR+Tailwind+OR+Vite+when:7d&hl=en-US&gl=US&ceid=US:en', category: 'Web Development', icon: 'layout' },
  { name: 'DevOps Radar', url: 'https://news.google.com/rss/search?q=Docker+OR+Kubernetes+OR+AWS+OR+GitHub+Actions+OR+Vercel+when:7d&hl=en-US&gl=US&ceid=US:en', category: 'DevOps & Tools', icon: 'cpu' },
  { name: 'Programming Radar', url: 'https://news.google.com/rss/search?q=Python+OR+JavaScript+OR+DSA+OR+coding+interview+OR+programming+roadmap+when:7d&hl=en-US&gl=US&ceid=US:en', category: 'Programming', icon: 'code' },
  { name: 'Learner Search Radar', url: 'https://news.google.com/rss/search?q=%22web+development+roadmap%22+OR+%22learn+React%22+OR+%22Python+tutorial%22+OR+%22full+stack+developer%22+when:30d&hl=en-US&gl=US&ceid=US:en', category: 'Programming', icon: 'code' },
  { name: 'Vercel Blog', url: 'https://vercel.com/blog/feed', category: 'Web Development', icon: 'layout' },
  { name: 'React Blog', url: 'https://react.dev/rss.xml', category: 'Web Development', icon: 'code' },
  { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/rss/', category: 'Programming', icon: 'code' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'Programming', icon: 'code' },
  { name: 'BD Education', url: 'https://news.google.com/rss/search?q=SSC+OR+HSC+OR+NU+Result+OR+Admission+Bangladesh+when:7d&hl=en&gl=BD&ceid=BD:en', category: 'Education BD', icon: 'graduation' },
] as const;

const TOPIC_DICTIONARY: Record<string, string[]> = {
  'Web Development': ['react', 'next.js', 'nextjs', 'tailwind', 'typescript', 'vite', 'frontend', 'mern', 'full stack', 'web development'],
  Programming: ['python', 'rust', 'golang', 'javascript', 'java programming', 'dsa', 'data structures', 'coding interview', 'leetcode', 'python tutorial', 'javascript tutorial', 'programming roadmap', 'coding roadmap', 'developer roadmap'],
  'DevOps & Tools': ['docker', 'kubernetes', 'aws', 'vercel', 'git', 'github actions', 'cloudflare', 'deployment', 'devops'],
  'Tech Update': ['claude', 'anthropic', 'openai', 'chatgpt', 'gemini', 'grok', 'copilot', 'cursor', 'agent', 'mcp'],
  'Education BD': ['ssc', 'hsc', 'admission', 'admit card', 'result 2026', 'national university', 'nu result', 'bcs'],
};

const authoritySources = new Set(['Vercel Blog', 'React Blog', 'freeCodeCamp', 'Hacker News']);
const searchIntentTerms = /\b(how to|tutorial|guide|roadmap|best|vs\.?|comparison|learn|career|release|new|update|migration|setup)\b/i;
const offTopicNoise = /\b(nba|knicks|lakers|football|cricket|match highlights?|celebrity|box office|election poll|warhammer|gaming?|playable|xbox|playstation|steam|breach(?:ed)?|stolen|malware|supply chain worm|hacked|cyberattack|coinbase|crypto|wallets?|defi)\b/i;
const audienceNoise = /\b(telugu|hindi|gmail|outlook|email app|smartphone|iphone|shopping|consumer gadget)\b/i;
const reactTechnicalContext = /\b(react\.?js|next\.?js|javascript|typescript|frontend|web dev(?:elopment)?|component|framework|npm|vercel)\b/i;
const priorityCategories = ['Web Development', 'Programming', 'DevOps & Tools', 'Tech Update', 'Education BD'];
const EVERGREEN_STARTERS: Record<string, Array<{
  title: string;
  keyword: string;
  reason: string;
  link: string;
  source: string;
}>> = {
  'Web Development': [
    { title: 'HTML, CSS and JavaScript Roadmap for Beginners: Build and Deploy Your First Website', keyword: 'web development roadmap for beginners', reason: 'Beginners repeatedly need an end-to-end starting path; MDN provides durable foundational reference material.', link: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', source: 'MDN Web Docs' },
    { title: 'React Tutorial for Beginners: Components, State and Your First Real Project', keyword: 'react tutorial for beginners', reason: 'React learning intent remains evergreen and the official learning guide supports accurate practical instruction.', link: 'https://react.dev/learn', source: 'React Documentation' },
    { title: 'Next.js App Router Tutorial: Build a Full-Stack Application Step by Step', keyword: 'next.js app router tutorial', reason: 'Implementation-focused full-stack tutorials match learner intent and can be grounded in official Next.js curriculum.', link: 'https://nextjs.org/learn', source: 'Next.js Documentation' },
    { title: 'TypeScript for Web Developers: Types, React Props and Safer API Data', keyword: 'typescript for web developers', reason: 'Type-safety is a recurring skill gap for frontend learners and the official handbook is a stable authority source.', link: 'https://www.typescriptlang.org/docs/handbook/intro.html', source: 'TypeScript Handbook' },
    { title: 'Core Web Vitals Guide for Developers: Improve LCP, INP and CLS', keyword: 'core web vitals for developers', reason: 'Performance optimization has durable developer search intent and web.dev maintains authoritative guidance.', link: 'https://web.dev/articles/vitals', source: 'web.dev' },
  ],
  Programming: [
    { title: 'JavaScript Tutorial for Beginners: Variables, Functions, Arrays and Projects', keyword: 'javascript tutorial for beginners', reason: 'Foundational JavaScript questions recur year-round and MDN offers trustworthy source material.', link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', source: 'MDN JavaScript Guide' },
    { title: 'Python Tutorial for Beginners: From Syntax to Your First Automation Script', keyword: 'python tutorial for beginners', reason: 'Python beginner intent remains durable and can be taught against the official Python tutorial.', link: 'https://docs.python.org/3/tutorial/', source: 'Python Documentation' },
    { title: 'Data Structures and Algorithms Roadmap: What to Learn for Coding Interviews', keyword: 'data structures and algorithms roadmap', reason: 'Interview preparation is evergreen learner demand and requires structured, genuinely useful coverage.', link: 'https://cs50.harvard.edu/x/', source: 'CS50' },
    { title: 'Git and GitHub for Beginners: Branches, Pull Requests and Collaboration', keyword: 'git and github tutorial for beginners', reason: 'Version-control workflow is an essential repeated beginner need supported by official Git documentation.', link: 'https://git-scm.com/doc', source: 'Git Documentation' },
    { title: 'Java Programming Roadmap: OOP, Collections and Building Real Applications', keyword: 'java programming roadmap', reason: 'Java learning paths attract sustained educational intent and can rely on official learning resources.', link: 'https://dev.java/learn/', source: 'dev.java' },
  ],
};

function ageInDays(pubDate: string): number {
  const timestamp = new Date(pubDate).getTime();
  if (!Number.isFinite(timestamp)) return 365;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

function scoreCandidate(item: Omit<TrendItem, 'score'>): number {
  const age = ageInDays(item.pubDate);
  const freshness = age <= 1 ? 30 : age <= 7 ? 22 : age <= 30 ? 10 : 0;
  const relevance = item.topic === 'GENERAL' ? 0 : 30;
  const authority = authoritySources.has(item.sourceName) ? 18 : 10;
  const intent = searchIntentTerms.test(item.title) ? 15 : 4;
  return Math.min(100, freshness + relevance + authority + intent);
}

function normalTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, ' ').trim();
}

function fallbackRecommendation(item: TrendItem, index: number): TrendItem {
  const recent = ageInDays(item.pubDate) <= 7;
  const type: 'Trending' | 'Evergreen' | 'Hybrid' = recent && searchIntentTerms.test(item.title)
    ? 'Hybrid'
    : recent ? 'Trending' : 'Evergreen';
  return {
    ...item,
    proposedTitle: item.title.split(' - ')[0].trim(),
    targetKeyword: item.topic === 'GENERAL' ? item.title.split(' - ')[0].trim() : item.topic.toLowerCase(),
    opportunityType: type,
    searchIntent: type === 'Trending' ? 'Fresh update' : 'Informational search',
    reason: type === 'Hybrid'
      ? 'Recent source coverage with a reusable learner-focused search angle.'
      : type === 'Trending'
        ? 'Fresh update from a relevant stream with timely audience interest.'
        : 'Durable learning intent that can keep attracting search visits.',
    score: Math.max(item.score, 70 - index),
    isSmartPick: true,
  };
}

function starterIdea(category: string, starter: { title: string; keyword: string; reason: string; link: string; source: string }): TrendItem {
  return {
    title: starter.title,
    proposedTitle: starter.title,
    targetKeyword: starter.keyword,
    opportunityType: 'Evergreen',
    searchIntent: 'Evergreen learner search',
    reason: starter.reason,
    link: starter.link,
    pubDate: new Date().toISOString(),
    sourceName: starter.source,
    sourceCategory: category,
    sourceIcon: 'search',
    language: 'English',
    topic: starter.keyword.toUpperCase(),
    score: 82,
    isSmartPick: true,
  };
}

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, 'trends', 15, 60_000);
    if (limited) return limited;

    const itemsByFeed = await Promise.all(FEEDS.map(async source => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.map((item): TrendItem | null => {
          const title = item.title?.trim() || '';
          const searchableText = `${title} ${item.contentSnippet || ''}`.toLowerCase();
          let sourceCategory: string = source.category;
          let topic = 'GENERAL';
          for (const [category, terms] of Object.entries(TOPIC_DICTIONARY)) {
            const match = terms.find(term => searchableText.includes(term));
            if (match) {
              sourceCategory = category;
              topic = match.toUpperCase();
              break;
            }
          }
          const baseItem: Omit<TrendItem, 'score'> = {
            title,
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            sourceName: source.name,
            sourceCategory,
            sourceIcon: source.icon,
            language: /[\u0980-\u09FF]/.test(title) ? 'Bengali' : 'English',
            topic,
          };
          if (offTopicNoise.test(searchableText) || audienceNoise.test(searchableText)) return null;
          if (topic === 'REACT' && !reactTechnicalContext.test(searchableText)) return null;
          return { ...baseItem, score: scoreCandidate(baseItem) };
        }).filter((item): item is TrendItem =>
          item !== null
          && item.title.length > 0
          && item.link.length > 0
          && (!(source.name.includes('Radar') || source.name === 'BD Education') || item.topic !== 'GENERAL'),
        );
      } catch {
        return [] as TrendItem[];
      }
    }));

    const seenTitles = new Set<string>();
    const curatedStreams = itemsByFeed
      .flat()
      .sort((left, right) => right.score - left.score || new Date(right.pubDate).getTime() - new Date(left.pubDate).getTime())
      .filter(item => {
        const titleKey = normalTitle(item.title);
        if (!titleKey || seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return item.score >= 42;
      })
      .slice(0, 60);

    let recommendations: TrendItem[] = [];
    if (curatedStreams.length > 0 && process.env.OPENROUTER_API_KEY) {
      try {
        const publishingDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Dhaka',
        });
        const prompt = `You are the content intelligence editor for a technology learning blog.
Today is ${publishingDate}. From the sourced candidate stream below, choose exactly 10 blog opportunities most likely to combine current attention with durable organic search interest.

Selection rules:
- Include a balanced mix across Web Development, Programming, DevOps & Tools, Tech Update, and Education BD where quality candidates exist.
- Select no more than three picks from any one category; choose at least one Programming pick when a relevant candidate exists, and choose Education BD only for real learner intent such as admission, exams or results.
- Prefer Hybrid opportunities: a current trigger attached to an evergreen learner problem, tutorial, roadmap, comparison, career decision or implementation query.
- Avoid duplicate subjects, vague product announcements with no learner angle, sensational headlines, and unsupported search-volume claims.
- Audience fit is essential: prioritize full-stack learners, coding careers, web development skills, practical AI developer workflows and Bangladesh student search needs. Reject peripheral sports/news, non-Bengali regional-language tutorials, consumer productivity apps, obscure integrations and security incidents without a useful developer learning angle.
- Do not claim measured search volume; describe search-demand potential from intent and freshness signals only.
- Keep sourceIndex tied to a supplied candidate. Scores must be reasoned editorial priority scores from 1-100.
- Create titles that a real learner would search for and click, not generic news rewrites.

Candidates:
${curatedStreams.slice(0, 45).map((item, index) => `${index}: [${item.sourceCategory}] [quality ${item.score}] [${item.pubDate}] ${item.title} | ${item.sourceName}`).join('\n')}

Return ONLY JSON in this shape:
{"picks":[{"index":0,"proposedTitle":"string","targetKeyword":"string","opportunityType":"Trending|Evergreen|Hybrid","searchIntent":"string","reason":"string","score":90}]}`;

        const response = await generateOpenRouterText(prompt, {
          model: OPENROUTER_RESEARCH_MODEL,
          maxCompletionTokens: 3200,
          temperature: 0.15,
          title: 'GrowthPilot AI Daily Content Intelligence',
          retries: 2,
        });
        const parsed = JSON.parse(extractOpenRouterJson(response)) as { picks?: RecommendationPick[] };
        const pickedIndexes = new Set<number>();
        recommendations = (parsed.picks || [])
          .filter(pick => Number.isInteger(pick.index) && curatedStreams[pick.index] && !pickedIndexes.has(pick.index))
          .slice(0, 10)
          .map(pick => {
            pickedIndexes.add(pick.index);
            const original = curatedStreams[pick.index];
            return {
              ...original,
              proposedTitle: pick.proposedTitle,
              targetKeyword: pick.targetKeyword,
              opportunityType: pick.opportunityType,
              searchIntent: pick.searchIntent,
              reason: pick.reason,
              score: Math.min(100, Math.max(original.score, Number(pick.score) || original.score)),
              isSmartPick: true,
            };
          });
      } catch (error) {
        console.error('Content intelligence ranking unavailable:', error);
      }
    }

    const minimumCategoryIdeas = 5;
    const sparseCategories = priorityCategories
      .map(category => ({
        category,
        existingCount: curatedStreams.filter(item => item.sourceCategory === category && item.score >= 55).length,
      }))
      .filter(item => item.existingCount < minimumCategoryIdeas);
    const discoveredIdeas: TrendItem[] = [];
    if (sparseCategories.length > 0 && process.env.OPENROUTER_API_KEY) {
      try {
        const supplementaryText = await generateOpenRouterText(
          `You are researching durable content opportunities for a technology learning blog on ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka' })}.
The live curated stream needs more writeable article ideas in these categories:
${sparseCategories.map(item => `- ${item.category}: currently ${item.existingCount}; supply ${minimumCategoryIdeas - item.existingCount} additional ideas`).join('\n')}
Find the requested number of distinct learner-focused evergreen or hybrid organic-search content ideas for each category above.
Use a real authoritative supporting HTTPS source URL discovered during research, such as official documentation, a recognized survey, or an official education notice. Never invent measured search volume, and reject entertainment, finance/crypto and incident-only topics.
Return ONLY JSON:
{"ideas":[{"sourceCategory":"one exact requested category","proposedTitle":"string","targetKeyword":"string","opportunityType":"Evergreen|Hybrid","searchIntent":"string","reason":"why learners repeatedly search this and what source supports it","sourceUrl":"https://...","sourceName":"string","score":80}]}`,
          {
            model: OPENROUTER_RESEARCH_MODEL,
            maxCompletionTokens: 4500,
            temperature: 0.1,
            title: 'GrowthPilot AI Evergreen Gap Discovery',
            retries: 2,
          },
        );
        const supplement = JSON.parse(extractOpenRouterJson(supplementaryText)) as {
          ideas?: Array<{
            sourceCategory?: string;
            proposedTitle?: string;
            targetKeyword?: string;
            opportunityType?: 'Evergreen' | 'Hybrid';
            searchIntent?: string;
            reason?: string;
            sourceUrl?: string;
            sourceName?: string;
            score?: number;
          }>;
        };
        const requestedCounts = new Map(sparseCategories.map(item => [item.category, minimumCategoryIdeas - item.existingCount]));
        const addedCounts = new Map<string, number>();
        for (const idea of supplement.ideas || []) {
          if (
            !idea.sourceCategory
            || !requestedCounts.has(idea.sourceCategory)
            || (addedCounts.get(idea.sourceCategory) || 0) >= (requestedCounts.get(idea.sourceCategory) || 0)
            || !idea.proposedTitle
            || !idea.targetKeyword
            || !idea.reason
            || !idea.sourceUrl?.startsWith('https://')
            || offTopicNoise.test(`${idea.proposedTitle} ${idea.reason}`)
            || audienceNoise.test(`${idea.proposedTitle} ${idea.reason}`)
          ) continue;
          const discoveredIdea: TrendItem = {
            title: idea.proposedTitle,
            proposedTitle: idea.proposedTitle,
            targetKeyword: idea.targetKeyword,
            opportunityType: idea.opportunityType || 'Evergreen',
            searchIntent: idea.searchIntent || 'Informational search',
            reason: idea.reason,
            link: idea.sourceUrl,
            pubDate: new Date().toISOString(),
            sourceName: idea.sourceName || 'Authority research',
            sourceCategory: idea.sourceCategory,
            sourceIcon: 'search',
            language: 'English',
            topic: idea.targetKeyword.toUpperCase(),
            score: Math.min(95, Math.max(70, Number(idea.score) || 80)),
            isSmartPick: true,
          };
          discoveredIdeas.push(discoveredIdea);
          recommendations.push(discoveredIdea);
          addedCounts.set(idea.sourceCategory, (addedCounts.get(idea.sourceCategory) || 0) + 1);
        }
      } catch (error) {
        console.error('Evergreen gap discovery unavailable:', error);
      }
    }

    const categoryIdeas = [...curatedStreams, ...discoveredIdeas].filter((item, index, all) =>
      all.findIndex(candidate => candidate.link === item.link || normalTitle(candidate.title) === normalTitle(item.title)) === index,
    );
    for (const [category, starters] of Object.entries(EVERGREEN_STARTERS)) {
      let categoryCount = categoryIdeas.filter(item => item.sourceCategory === category).length;
      for (const starter of starters) {
        if (categoryCount >= minimumCategoryIdeas) break;
        if (categoryIdeas.some(item => item.link === starter.link || normalTitle(item.title) === normalTitle(starter.title))) continue;
        categoryIdeas.push(starterIdea(category, starter));
        categoryCount += 1;
      }
    }
    const balancedRecommendations: TrendItem[] = [];
    const selectedLinks = new Set<string>();
    const categoryCounts = new Map<string, number>();
    const addPick = (item: TrendItem) => {
      if (selectedLinks.has(item.link) || (categoryCounts.get(item.sourceCategory) || 0) >= 3) return;
      selectedLinks.add(item.link);
      categoryCounts.set(item.sourceCategory, (categoryCounts.get(item.sourceCategory) || 0) + 1);
      balancedRecommendations.push(item);
    };
    priorityCategories.forEach(category => {
      const pick = recommendations.find(item => item.sourceCategory === category)
        || categoryIdeas.find(item => item.sourceCategory === category && item.score >= 70);
      if (pick) addPick(pick.isSmartPick ? pick : fallbackRecommendation(pick, balancedRecommendations.length));
    });
    recommendations.forEach(addPick);
    categoryIdeas.map(fallbackRecommendation).forEach(addPick);
    recommendations = balancedRecommendations.slice(0, 10);

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      provider: process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'Curated feeds',
      model: process.env.OPENROUTER_API_KEY ? OPENROUTER_RESEARCH_MODEL : null,
      methodology: 'Ranked by freshness, niche relevance, source strength and learner search-intent potential. Demand scores are editorial signals, not measured keyword volume.',
      trends: categoryIdeas,
      recommendations,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to refresh content intelligence.' }, { status: 500 });
  }
}
