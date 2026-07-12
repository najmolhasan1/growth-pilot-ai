import { NextResponse } from 'next/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import ytdl from '@distube/ytdl-core';
import { cleanJsonResponse, CREATOR_PACKAGE_QUALITY_INSTRUCTIONS, getVideoKitV2Client, normalizeCreatorPackage, transcriptionSchema, VIDEO_KIT_V2_MODEL } from '@/lib/video-kit-v2';

export const runtime = 'nodejs';
export const maxDuration = 300;

type RemoteMedia = {
  path: string;
  mimeType: string;
  originalName: string;
  fileType: 'video' | 'audio';
  sourceKind: 'youtube' | 'google_drive';
  sourceUrl: string;
  youtubeVideoId?: string;
  size: number;
  duration?: string;
};

function extractDriveId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function extractYouTubeId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || undefined;
    }
    return parsed.searchParams.get('v') || parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] || undefined;
  } catch {
    return undefined;
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').slice(0, 120) || 'remote_media';
}

function formatSeconds(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '00:00';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getFileSize(filePath: string) {
  return fs.statSync(filePath).size;
}

async function writeResponseToFile(response: Response, outputPath: string) {
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
}

async function downloadYouTubeAudio(videoUrl: string, outputPath: string): Promise<RemoteMedia> {
  const info = await ytdl.getInfo(videoUrl);
  const title = sanitizeFileName(info.videoDetails.title || 'youtube_audio');
  const duration = formatSeconds(Number(info.videoDetails.lengthSeconds || 0));

  await new Promise<void>((resolve, reject) => {
    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });
    const writeStream = fs.createWriteStream(outputPath);
    stream.pipe(writeStream);
    stream.on('error', reject);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return {
    path: outputPath,
    mimeType: 'audio/mpeg',
    originalName: `${title}.mp3`,
    fileType: 'audio',
    sourceKind: 'youtube',
    sourceUrl: videoUrl,
    youtubeVideoId: extractYouTubeId(videoUrl),
    size: getFileSize(outputPath),
    duration,
  };
}

function getFileNameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const nameMatch = disposition.match(/filename="?([^";]+)"?/i);
  return nameMatch?.[1] ? nameMatch[1] : fallback;
}

async function downloadGoogleDriveFile(fileId: string, sourceUrl: string, outputPath: string): Promise<RemoteMedia> {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  const initialUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
  const response = await fetch(initialUrl, { headers: { 'User-Agent': userAgent } });

  if (!response.ok) {
    throw new Error(`Google Drive download failed with status ${response.status}. Make sure the file is shared publicly.`);
  }

  let finalResponse = response;
  const contentType = response.headers.get('content-type') || '';
  const cookieHeader = response.headers.get('set-cookie') || '';

  if (contentType.includes('text/html')) {
    const html = await response.text();
    const confirmToken =
      html.match(/confirm=([a-zA-Z0-9_-]+)/)?.[1] ||
      html.match(/name="confirm"\s+value="([^"]+)"/)?.[1];

    if (!confirmToken) {
      throw new Error('Google Drive returned an HTML page instead of media. Check that the link is public and points directly to an audio/video file.');
    }

    const headers: Record<string, string> = { 'User-Agent': userAgent };
    if (cookieHeader) headers.Cookie = cookieHeader;
    finalResponse = await fetch(`${initialUrl}&confirm=${confirmToken}`, { headers });
    if (!finalResponse.ok) {
      throw new Error(`Google Drive confirmation download failed with status ${finalResponse.status}.`);
    }
  }

  await writeResponseToFile(finalResponse, outputPath);
  const mimeType = finalResponse.headers.get('content-type') || 'application/octet-stream';
  const originalName = getFileNameFromDisposition(finalResponse.headers.get('content-disposition'), `drive_${fileId}`);
  const fileType = mimeType.startsWith('video/') ? 'video' : 'audio';

  if (!mimeType.startsWith('video/') && !mimeType.startsWith('audio/')) {
    throw new Error(`Google Drive file type is not supported (${mimeType}). Upload or link a video/audio file.`);
  }

  return {
    path: outputPath,
    mimeType,
    originalName,
    fileType,
    sourceKind: 'google_drive',
    sourceUrl,
    size: getFileSize(outputPath),
  };
}

async function downloadRemoteMedia(url: string): Promise<RemoteMedia> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Please enter a valid YouTube or public Google Drive URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS links are supported.');
  }

  const tempDir = os.tmpdir();
  if (isYouTubeUrl(url)) {
    return downloadYouTubeAudio(url, path.join(tempDir, `video-kit-${randomUUID()}.mp3`));
  }

  const driveId = extractDriveId(url);
  if (driveId) {
    return downloadGoogleDriveFile(driveId, url, path.join(tempDir, `video-kit-${randomUUID()}`));
  }

  throw new Error('Supported links: YouTube video links or public Google Drive file links.');
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function POST(request: Request) {
  let uploadedFileName = '';
  let uploadedFileUri = '';
  let tempFilePath = '';
  const ai = getVideoKitV2Client();

  try {
    const contentType = request.headers.get('content-type') || '';
    let mediaFile: File | string;
    let mediaMimeType = 'application/octet-stream';
    let mediaFileName = 'media file';
    let remoteMedia: RemoteMedia | null = null;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const url = String(body.url || '').trim();
      if (!url) {
        return NextResponse.json({ error: 'Missing YouTube or Google Drive URL.' }, { status: 400 });
      }
      remoteMedia = await downloadRemoteMedia(url);
      tempFilePath = remoteMedia.path;
      mediaFile = remoteMedia.path;
      mediaMimeType = remoteMedia.mimeType;
      mediaFileName = remoteMedia.originalName;
    } else {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: 'No media file uploaded.' }, { status: 400 });
      }
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Please upload a file under 100MB.' }, { status: 413 });
      }
      mediaFile = file;
      mediaMimeType = file.type || 'application/octet-stream';
      mediaFileName = file.name;
    }

    const uploadResult = await ai.files.upload({
      file: mediaFile,
      config: {
        mimeType: mediaMimeType,
      },
    });
    uploadedFileName = uploadResult.name || '';
    uploadedFileUri = uploadResult.uri || '';

    if (!uploadedFileName || !uploadedFileUri) {
      throw new Error('Gemini file upload did not return a usable file reference.');
    }

    let fileState = await ai.files.get({ name: uploadedFileName });
    for (let attempt = 0; fileState.state === 'PROCESSING' && attempt < 40; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      fileState = await ai.files.get({ name: uploadedFileName });
    }

    if (fileState.state === 'FAILED') {
      throw new Error('Gemini media file processing failed.');
    }

    const systemInstruction =
      `You are a precise audio and video transcription AI plus a senior YouTube growth strategist and human conversion copywriter. Transcribe the media with high accuracy, identify speaker switches, create subtitle-style segments with start/end timestamps, summarize the content, extract topics, and create a YouTube creator package. Output strictly valid JSON. Keep seoDescription clean: no chapters, timestamps, time ranges, hashtags, video tags, or social links inside seoDescription. ${CREATOR_PACKAGE_QUALITY_INSTRUCTIONS}`;

    const prompt = `Transcribe this file (${mediaFileName}). Detect the primary language, create a verbatim transcript, logical subtitle-style segments, a concise bulleted summary, key topics, and a full YouTube creator package with thumbnail text, titles, SEO description, hashtags, video tags, viral reels, clip ideas, and chapters. Preserve names, jargon, metrics, and examples.

Creator package rules:
- thumbnailTexts must contain exactly 10 options, ranked best first.
- titles must contain exactly 10 options, ranked best first.
- Judge every thumbnail text and title against Bangladesh audience behavior: click curiosity, trust, relevance, clear benefit, and whether the video can actually satisfy the promise.
- Do not create random ideas from text. Package the strongest real viewer reasons from the transcript.
- Each title must be final-publish usable, not a draft label.
- seoDescription must be only the main YouTube description copy.
- Do not include timestamps, chapters, time ranges, hashtags, video tags, or social links inside seoDescription.
- Put timestamps only in chapters, viralReels, and clipSuggestions.
- Put hashtags only in hashtags and video tags only in videoTags.

${CREATOR_PACKAGE_QUALITY_INSTRUCTIONS}

Before final JSON, mentally check: would a busy business owner or education company trust this output without rewriting it? If not, make it more specific and human.`;

    const response = await ai.models.generateContent({
      model: VIDEO_KIT_V2_MODEL,
      contents: [
        {
          fileData: {
            fileUri: uploadedFileUri,
            mimeType: uploadResult.mimeType || mediaMimeType,
          },
        },
        prompt,
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema,
      },
    });

    const transcription = cleanJsonResponse(response.text);
    if (transcription.creatorPackage) {
      transcription.creatorPackage = normalizeCreatorPackage(transcription.creatorPackage);
    }
    if (remoteMedia) {
      transcription.remoteMedia = {
        fileName: remoteMedia.originalName,
        fileSize: formatBytes(remoteMedia.size),
        fileType: remoteMedia.fileType,
        duration: remoteMedia.duration || '00:00',
        sourceKind: remoteMedia.sourceKind,
        sourceUrl: remoteMedia.sourceUrl,
        youtubeVideoId: remoteMedia.youtubeVideoId,
      };
    }
    return NextResponse.json(transcription);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process media file transcription.',
    }, { status: 500 });
  } finally {
    if (uploadedFileName) {
      try {
        await ai.files.delete({ name: uploadedFileName });
      } catch {
        // Best-effort cleanup.
      }
    }
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // Best-effort cleanup.
      }
    }
  }
}
