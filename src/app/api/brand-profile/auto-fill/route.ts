import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { generateGeminiText, extractJsonText } from '@/lib/gemini';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rateLimit = enforceRateLimit(req, 'brand-auto-fill', 15, 60000);
    if (rateLimit) return rateLimit;

    const { businessDescription } = await req.json();
    if (!businessDescription || typeof businessDescription !== 'string' || businessDescription.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Please provide at least a few words describing your business.',
      }, { status: 400 });
    }

    const cleanInput = businessDescription.trim();

    const prompt = `You are a World-Class Chief Marketing Officer, Brand Strategist, and Go-To-Market Architect (combining April Dunford's Positioning, Alex Hormozi's Grand Slam Offers, and modern SaaS/Ecommerce growth frameworks).

A business owner has shared the following raw description, notes, or website text about their business:
"""
${cleanInput}
"""

YOUR MISSION:
Analyze this business context deeply. Even if the owner's input is brief, messy, conversational, or incomplete (in English, Bengali, or Banglish), extract and formulate a structured, professional, and highly actionable Brand Brain, Ideal Customer Profile (ICP), and Go-To-Market (GTM) strategy.

Make the output specific, commercial, and practical—avoid generic fluff.

Return strictly a valid JSON object matching this schema:
{
  "profile": {
    "businessName": "Clear brand name (extracted or thoughtfully suggested)",
    "industry": "Specific industry (e.g., B2B SaaS, Health & Wellness Ecommerce, EdTech, Digital Agency)",
    "businessType": "One of: SaaS | Ecommerce | B2B | B2C | IT Service | Education | Agency | Local Service | Creator Business | Other",
    "website": "Extracted website URL if mentioned, else empty string",
    "location": "Primary target market / location (e.g., Global English Market, Bangladesh, North America)",
    "language": "English | Bengali | Banglish",
    "audience": "Rich, specific ICP description: who buys, their company stage or personal role, urgent pain, and budget authority",
    "productService": "Clear breakdown of what is sold, delivered, and how it solves the customer's bottleneck",
    "offer": "Irresistible core offer: main promise, guarantee, risk-reversal, bonus, or free consultation/trial hook",
    "priceRange": "Pricing tier or model (e.g. $49-$199/mo, 25,000 BDT package, custom enterprise quote)",
    "competitors": "Key direct competitors, indirect alternatives, or manual DIY workflows customers currently use",
    "goals": "Core 6-12 month business objectives (e.g. scale MRR to $20k, 50 qualified inbound leads/month, launch authority)",
    "objections": "Top 3 buyer hesitations and doubts (price, trust, implementation time, prior bad experience)",
    "tone": "Ideal voice (e.g. 'Authoritative, practical, founder-led, high-energy, empathetic')",
    "brandVoice": "Core beliefs, communication style, proof mechanisms, and distinct personality",
    "bannedWords": "Clichés and buzzwords to avoid (e.g. 'synergy, game-changer, revolutionary, cutting-edge, cheap')"
  },
  "icp": {
    "personaName": "Memorable title for the primary buyer (e.g., 'Scaling Ecommerce Founder' or 'Overworked Head of Operations')",
    "roleAndContext": "Daily reality, responsibilities, and emotional stress they experience before finding this solution",
    "primaryPains": [
      "Pain point 1: Financial or operational friction",
      "Pain point 2: Time loss or manual inefficiency",
      "Pain point 3: Emotional anxiety or fear of falling behind"
    ],
    "dreamOutcome": "The tangible 'after-state' they desire (e.g., '3x revenue with automated client onboarding without hiring 5 more staff')",
    "purchasingTriggers": "What triggers them to seek a solution right now (e.g. seasonal launch, failed agency, lost key staff)",
    "keyObjections": [
      "Objection 1 with instant counter-reframe",
      "Objection 2 with instant counter-reframe"
    ]
  },
  "gtm": {
    "coreHook": "A punchy, memorable one-sentence positioning statement (Who you help + What outcome you deliver + How you do it differently)",
    "recommendedChannels": [
      "Channel 1 (e.g. SEO Content Clusters targeting high-intent commercial keywords)",
      "Channel 2 (e.g. Cold Email / LinkedIn Outbound to verified decision-makers)",
      "Channel 3 (e.g. Meta / Google Direct-Response Ads with value-packed lead magnet)"
    ],
    "leadMagnetIdea": "A high-converting free tool, audit, template, or mini-class that attracts ready-to-buy prospects",
    "growthRoadmap": {
      "phase1": "Days 1-10: Offer clarity, landing page hook optimization, and customer interview validation",
      "phase2": "Days 11-20: Launch primary outbound channel and high-intent SEO content engine",
      "phase3": "Days 21-30: Retargeting, case study distribution, and conversion funnel optimization"
    }
  }
}`;

    try {
      const responseText = await generateGeminiText(prompt);
      const cleanedJson = extractJsonText(responseText);
      const parsedData = JSON.parse(cleanedJson);

      return NextResponse.json({
        success: true,
        data: parsedData,
      });
    } catch (aiError) {
      console.warn('AI Brand auto-fill fallback triggered:', aiError);

      // Deterministic fallback based on input keywords
      const isBengali = /[\u0980-\u09FF]/.test(cleanInput);
      const words = cleanInput.split(/\s+/);
      const detectedName = words.slice(0, 3).join(' ').replace(/[,.!]/g, '');

      const fallbackData = {
        profile: {
          businessName: detectedName || 'My Growth Business',
          industry: cleanInput.toLowerCase().includes('agency') ? 'Digital Agency' :
                    cleanInput.toLowerCase().includes('saas') || cleanInput.toLowerCase().includes('software') ? 'B2B SaaS' :
                    cleanInput.toLowerCase().includes('shop') || cleanInput.toLowerCase().includes('ecommerce') ? 'Ecommerce' : 'Professional Services',
          businessType: cleanInput.toLowerCase().includes('agency') ? 'Agency' :
                        cleanInput.toLowerCase().includes('saas') ? 'SaaS' :
                        cleanInput.toLowerCase().includes('shop') ? 'Ecommerce' : 'B2B',
          website: '',
          location: isBengali ? 'Bangladesh & South Asia' : 'Global Market',
          language: isBengali ? 'Bengali' : 'English',
          audience: `Decision-makers and consumers looking for reliable solutions in: ${cleanInput.slice(0, 120)}`,
          productService: cleanInput,
          offer: 'High-quality delivery with guaranteed satisfaction and direct support.',
          priceRange: 'Competitive market rates tailored to customer requirements.',
          competitors: 'Traditional manual methods, generic competitors, and overseas alternatives.',
          goals: 'Accelerate qualified customer acquisition, boost brand trust, and maximize customer retention.',
          objections: 'Price comparison, proof of past results, and onboarding turnaround time.',
          tone: 'Professional, trustworthy, results-driven, and approachable.',
          brandVoice: 'Transparent, clear, practical, and focused on tangible customer wins.',
          bannedWords: 'Cheap, revolutionary, synergy, best in the world, fake guarantees',
        },
        icp: {
          personaName: 'Primary Target Decision Maker',
          roleAndContext: 'Responsible for growth, operational efficiency, and choosing dependable service providers.',
          primaryPains: [
            'Wasting time on unreliable, inconsistent providers or manual execution',
            'Difficulty measuring clear ROI on marketing and business investments',
            'Frustration with slow communication and lack of transparent deliverables'
          ],
          dreamOutcome: 'Predictable, streamlined results delivered reliably without constant micromanagement.',
          purchasingTriggers: 'Current provider underdelivering or upcoming business growth milestone.',
          keyObjections: [
            'Is this worth the investment? -> Highlight quantifiable outcomes and proof.',
            'Will this take too long to implement? -> Emphasize fast onboarding and turnkey delivery.'
          ]
        },
        gtm: {
          coreHook: `Helping businesses achieve reliable growth through proven ${cleanInput.slice(0, 50)} solutions.`,
          recommendedChannels: [
            'High-intent SEO and targeted content marketing to capture active searchers',
            'Direct outreach via LinkedIn, email, or social communities with value-first case studies',
            'Referral incentives and partnership flywheels with complementary non-competing businesses'
          ],
          leadMagnetIdea: 'Free 15-Minute Strategy Audit or Step-by-Step Implementation Checklist',
          growthRoadmap: {
            phase1: 'Days 1-10: Refine value proposition, social proof assets, and core offer messaging',
            phase2: 'Days 11-20: Activate content pipeline and direct outreach campaign to qualified leads',
            phase3: 'Days 21-30: Analyze conversion rates, gather client feedback, and scale winning channels'
          }
        }
      };

      return NextResponse.json({
        success: true,
        data: fallbackData,
      });
    }
  } catch (error: any) {
    console.error('Brand auto-fill route error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to auto-fill brand profile.',
    }, { status: 500 });
  }
}
