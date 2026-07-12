import { NextResponse } from 'next/server';
import { cleanJsonResponse, CREATOR_PACKAGE_QUALITY_INSTRUCTIONS, creatorPackageSchema, getVideoKitV2Client, normalizeCreatorPackage, VIDEO_KIT_V2_MODEL } from '@/lib/video-kit-v2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { transcript, summary, topics, fileName } = await request.json();
    if (!transcript) {
      return NextResponse.json({ error: 'Missing transcript data for content extraction.' }, { status: 400 });
    }

    const ai = getVideoKitV2Client();
    const prompt =
      `Analyze this media transcript and produce a viral YouTube Creator Package.\n\n` +
      `File Name: ${fileName || 'video.mp4'}\n` +
      `Topics: ${JSON.stringify(topics || [])}\n\n` +
      `Summary:\n${summary || ''}\n\n` +
      `Transcript:\n${transcript}\n\n` +
      `${CREATOR_PACKAGE_QUALITY_INSTRUCTIONS}\n\n` +
      `Generate thumbnailTexts, titles, seoDescription, hashtags, videoTags, viralReels, clipSuggestions, and chapters.\n` +
      `Thumbnail/title rules:\n` +
      `- thumbnailTexts must contain exactly 10 options, ranked best first.\n` +
      `- titles must contain exactly 10 options, ranked best first.\n` +
      `- Judge each option against Bangladesh audience behavior: click curiosity, trust, relevance, clear benefit, and whether the video can actually satisfy the promise.\n` +
      `- Do not create random ideas from text. Package the strongest real viewer reasons from the transcript.\n` +
      `- Each title must be final-publish usable, not a draft label.\n` +
      `Important seoDescription rules:\n` +
      `- seoDescription must contain only the main YouTube description copy.\n` +
      `- Do not include timestamps, chapters, time ranges, hashtags, video tags, or social links inside seoDescription.\n` +
      `- Put timestamps only in the chapters, viralReels, and clipSuggestions fields.\n` +
      `- Put hashtags only in hashtags and video tags only in videoTags.\n` +
      `Before final JSON, mentally check: would a busy business owner or education company trust this output without rewriting it? If not, make it more specific and human.`;

    const response = await ai.models.generateContent({
      model: VIDEO_KIT_V2_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are a senior YouTube growth strategist and human conversion copywriter for Bangladesh and global digital businesses. Output strictly valid JSON. ${CREATOR_PACKAGE_QUALITY_INSTRUCTIONS}`,
        responseMimeType: 'application/json',
        responseSchema: creatorPackageSchema,
      },
    });

    const packageData = normalizeCreatorPackage(cleanJsonResponse(response.text));
    return NextResponse.json(packageData);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate YouTube SEO creator package.',
    }, { status: 500 });
  }
}
