import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { enforceRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rateLimit = enforceRateLimit(req, 'voice-transcribe', 20, 60000);
    if (rateLimit) return rateLimit;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.',
      }, { status: 500 });
    }

    const body = await req.json();
    const { audioBase64, mimeType } = body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Audio data is required.',
      }, { status: 400 });
    }

    // Clean mimeType (remove codecs=opus, etc.)
    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!cleanMime.startsWith('audio/')) {
      cleanMime = 'audio/webm';
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are an elite bilingual Speech-to-Text transcription AI with deep expertise in Bangladeshi spoken dialects, colloquial Banglish (code-mixed Bengali and English), and international business English.

The speaker is a founder, marketer, or business owner describing their business context, services, audience, pricing, or challenges.

CRITICAL INSTRUCTIONS:
1. Accurately transcribe everything spoken with natural punctuation (periods, commas, question marks).
2. Code-Switching & Vocabulary:
   - For Bengali speech, write in clear natural Bengali script (বাংলা).
   - For English words, brand names, software, financial terms, and technical phrases, preserve them strictly in English script (e.g. write "ecommerce", "SaaS", "digital agency", "Meta ads", "TikTok", "Pathao", "bKash", "Shopify", "WordPress", "BDT", "USD", "ROI", "CAC", "leads", "funnel", "landing page", "retainer").
   - If the speaker speaks entirely in Banglish (English letters used for Bangla words), transcribe into natural Bangla script with English terms in English, or faithful colloquial Banglish.
3. Clean output: Output ONLY the transcribed text. Do NOT add any preamble, explanation, intro, or wrapping quotes.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: cleanMime,
          data: audioBase64,
        },
      },
      systemPrompt,
    ]);

    const transcript = result.response.text().trim();

    return NextResponse.json({
      success: true,
      text: transcript,
    });
  } catch (error: any) {
    console.error('Voice transcription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to transcribe audio.',
    }, { status: 500 });
  }
}
