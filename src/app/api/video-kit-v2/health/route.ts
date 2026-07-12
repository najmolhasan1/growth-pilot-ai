import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return NextResponse.json({
    status: 'healthy',
    geminiKeyConfigured: hasKey,
    timestamp: new Date().toISOString(),
  });
}
