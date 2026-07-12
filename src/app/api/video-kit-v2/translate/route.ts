import { NextResponse } from 'next/server';
import { cleanJsonResponse, getVideoKitV2Client, translationSchema, VIDEO_KIT_V2_MODEL } from '@/lib/video-kit-v2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { segments, targetLanguage } = await request.json();
    if (!segments || !Array.isArray(segments) || !targetLanguage) {
      return NextResponse.json({ error: 'Invalid request payload. Please specify segments and targetLanguage.' }, { status: 400 });
    }

    const ai = getVideoKitV2Client();
    const response = await ai.models.generateContent({
      model: VIDEO_KIT_V2_MODEL,
      contents: `Translate these subtitle timeline segments into ${targetLanguage}. Preserve meaning, tone, humor, proper nouns, and technical jargon. Keep segment IDs identical.\n\n${JSON.stringify(segments, null, 2)}`,
      config: {
        systemInstruction: `You are a subtitle translation specialist. Translate into ${targetLanguage} and output strictly valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: translationSchema,
      },
    });

    return NextResponse.json(cleanJsonResponse(response.text));
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to translate transcript segments.',
    }, { status: 500 });
  }
}
