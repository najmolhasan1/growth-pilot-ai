import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface AdPilotRequest {
  businessName: string;
  productService: string;
  targetAudience: string;
  offer: string;
  platform: 'meta' | 'google' | 'tiktok' | 'all';
  objective: 'sales' | 'leads' | 'traffic' | 'cod_orders';
  budgetDaily: number;
  currency: string;
  language: 'Bengali' | 'English' | 'Banglish';
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AdPilotRequest;
    const {
      businessName = 'My Brand',
      productService = 'Premium Product',
      targetAudience = 'Online Shoppers',
      offer = 'Special Discount',
      platform = 'meta',
      objective = 'cod_orders',
      budgetDaily = 1500,
      currency = 'BDT',
      language = 'Bengali',
    } = body;

    const ai = getGeminiClient();

    const prompt = `You are an elite, World-Class Media Buyer and Growth Architect specialized in Meta Ads Manager, Google Performance Max, and TikTok Ads. You are building an autonomous ad campaign for the following business:

Business Name: ${businessName}
Product / Service: ${productService}
Target Audience / ICP: ${targetAudience}
Irresistible Offer / Angle: ${offer}
Target Platform: ${platform.toUpperCase()}
Campaign Objective: ${objective.toUpperCase()}
Daily Budget: ${currency} ${budgetDaily}
Language: ${language}

Task:
Generate a complete, high-converting, Markopolo-level ad campaign structure with 3 distinct psychological angles (Pain-Point Solution, Social Proof / Case Study, and Urgency / FOMO Offer).

Respond with STRICT JSON format matching this schema:
{
  "campaignName": "string",
  "recommendedBidStrategy": "string",
  "suggestedAudienceInterests": ["string", "string", "string", "string"],
  "adSets": [
    {
      "name": "string",
      "targetPersona": "string",
      "dailyBudget": "string",
      "creativeAngle": "Pain-Point" | "Social Proof" | "FOMO Urgency",
      "primaryText": "string (high-converting persuasive ad body)",
      "headline": "string (punchy high CTR headline)",
      "description": "string (supporting subtext or guarantee)",
      "callToAction": "Order Now" | "Shop Now" | "Learn More" | "Send WhatsApp Message",
      "visualPrompt": "Detailed AI image generation prompt for Midjourney / Flux representing this ad creative",
      "hookVariation": "string (first 3 seconds video/copy hook)"
    }
  ],
  "autoPilotRules": [
    {
      "ruleName": "string",
      "condition": "string",
      "action": "string"
    }
  ],
  "metaAdsDraftSpec": {
    "campaign_objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "bid_strategy": "LOWEST_COST_WITH_BID_CAP",
    "targeting": {
      "geo_locations": ["BD"],
      "age_min": 21,
      "age_max": 52
    }
  }
}

Do NOT output markdown code blocks. Output pure JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('GP 2.0 Ad Pilot Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate autonomous ad campaign',
      },
      { status: 500 }
    );
  }
}
