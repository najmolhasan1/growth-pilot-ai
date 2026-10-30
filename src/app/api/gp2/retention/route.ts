import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface RetentionRequest {
  customerName: string;
  customerPhone?: string;
  productName: string;
  cartTotal: number;
  currency: string;
  abandonedStage: 'cart' | 'checkout' | 'pending_cod_confirmation';
  grossMarginPercent: number; // e.g. 35%
  language: 'Bengali' | 'English' | 'Banglish';
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RetentionRequest;
    const {
      customerName = 'Tanvir Ahmed',
      customerPhone = '01711000000',
      productName = 'Wireless ANC Headphone',
      cartTotal = 2450,
      currency = 'BDT',
      abandonedStage = 'pending_cod_confirmation',
      grossMarginPercent = 35,
      language = 'Bengali',
    } = body;

    const ai = getGeminiClient();

    // Guardrail calculation
    const maxSafeDiscountPercent = Math.max(0, Math.floor(grossMarginPercent * 0.35)); // Allow max 35% of gross margin as discount
    const safeDiscountAmount = Math.floor((cartTotal * maxSafeDiscountPercent) / 100);

    const prompt = `You are the Lead Autonomous Retention Architect & F-Commerce COD Optimization Officer for GrowthPilot 2.0 (equivalent to Markopolo 2.0's Autonomous CEP).

Context:
- Customer Name: ${customerName}
- Customer Phone: ${customerPhone}
- Product: ${productName}
- Cart Total: ${currency} ${cartTotal}
- Stage: ${abandonedStage}
- Gross Margin: ${grossMarginPercent}%
- Max Safe Margin Discount: ${maxSafeDiscountPercent}% (${currency} ${safeDiscountAmount})
- Target Language: ${language}

Task:
Generate a 5-channel recovery orchestration matrix and a Bangladeshi F-Commerce COD Anti-Return Fraud assessment.

Respond with STRICT JSON format matching this schema:
{
  "retentionStrategySummary": "string",
  "marginGuardrailStatus": "Protected (Max allowable discount: ${maxSafeDiscountPercent}%)",
  "courierRiskAssessment": {
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "riskScore": number (1 to 100, where higher is riskier),
    "verificationAdvice": "string (action to take before parcel dispatch)",
    "fakeOrderProbability": "string (e.g. 8% Low Risk)"
  },
  "channels": {
    "whatsapp": {
      "triggerDelay": "15 minutes after drop-off",
      "message": "string (friendly, conversational, with 1-tap COD confirmation prompt)",
      "interactiveButtons": ["Confirm Order", "Need Info First", "Cancel Order"]
    },
    "sms": {
      "triggerDelay": "45 minutes after drop-off",
      "text": "string (concise, high urgency, with branded short link under 160 chars)"
    },
    "email": {
      "subject": "string (high open-rate curiosity subject)",
      "previewText": "string",
      "body": "string (persuasive email addressing checkout hesitation and COD assurance)"
    },
    "webPush": {
      "title": "string",
      "body": "string"
    },
    "aiVoiceCallScript": {
      "agentName": "GrowthPilot Voice Assistant",
      "firstGreeting": "string (natural Bangladeshi spoken Bengali/English polite greeting)",
      "hesitationResolution": "string (addressing COD delivery time and product quality guarantee)",
      "orderConfirmationClosing": "string (confirming delivery address and packing status)"
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
    console.error('GP 2.0 Retention Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate autonomous retention matrix',
      },
      { status: 500 }
    );
  }
}
