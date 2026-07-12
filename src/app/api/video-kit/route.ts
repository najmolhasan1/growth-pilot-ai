import { NextResponse } from 'next/server';
import { FileState, GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenAI } from '@google/genai';
import { AssemblyAI } from 'assemblyai';
import type { AudioToTranscribe } from 'assemblyai';
import ytdl from '@distube/ytdl-core';
import { YoutubeTranscript } from 'youtube-transcript';
import { extractJsonText, generateGeminiText } from '@/lib/gemini';

export const runtime = 'nodejs';

type VideoKitRequest = {
  sourceLink?: string;
  audience?: string;
  goal?: string;
  notes?: string;
  language?: string;
};

type ParsedVideoKitRequest = VideoKitRequest & {
  uploadedFile?: {
    buffer: Buffer;
    name: string;
    type: string;
    size: number;
  };
};

type VideoKitResult = {
  sourceTitle: string;
  transcriptSource: string;
  transcriptPreview: string;
  captions?: {
    srt: string;
    vtt: string;
  };
  output: string;
};

type VideoSourceInsight = {
  title?: string;
  transcript?: string;
  captions?: {
    srt: string;
    vtt: string;
  };
  source: 'assemblyai-transcription' | 'gemini-video-transcription' | 'youtube-captions' | 'manual-notes' | 'none';
  warning?: string;
};

type DownloadedMedia = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

const MAX_MEDIA_BYTES = 90 * 1024 * 1024;
const VIDEO_TRANSCRIPTION_MODEL = process.env.GEMINI_VIDEO_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const VIDEO_TRANSCRIPTION_MODELS = Array.from(new Set([
  process.env.GEMINI_VIDEO_MODEL,
  VIDEO_TRANSCRIPTION_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
].filter(Boolean))) as string[];
const MEDIA_EXTENSION_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/mp4',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

const ASSEMBLYAI_SPEECH_MODELS = ['universal-3-pro', 'universal-2'];
const ENABLE_GEMINI_TRANSCRIPTION_FALLBACK = process.env.ENABLE_GEMINI_TRANSCRIPTION_FALLBACK === 'true';

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function youtubeIdFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null;
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null;
      return url.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

function isYoutubeUrl(value: string) {
  return Boolean(youtubeIdFromUrl(value));
}

function driveFileIdFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('drive.google.com')) return null;
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    return fileMatch?.[1] || url.searchParams.get('id');
  } catch {
    return null;
  }
}

function directDownloadUrl(value: string) {
  const driveId = driveFileIdFromUrl(value);
  if (driveId) return `https://drive.google.com/uc?export=download&id=${driveId}`;
  return value;
}

function extensionMime(value: string) {
  try {
    const url = new URL(value);
    const extension = url.pathname.split('.').pop()?.toLowerCase() || '';
    return MEDIA_EXTENSION_MIME[extension];
  } catch {
    return undefined;
  }
}

function mediaFileName(value: string) {
  try {
    const url = new URL(value);
    const name = decodeURIComponent(url.pathname.split('/').pop() || '').replace(/[^\w.-]+/g, '-');
    return name || 'source-video.mp4';
  } catch {
    return 'source-video.mp4';
  }
}

function assemblyAIClient() {
  const rawKey = process.env.ASSEMBLYAI_API_KEY?.trim();
  const midpoint = rawKey && rawKey.length % 2 === 0 ? rawKey.length / 2 : 0;
  const apiKey = rawKey && midpoint && rawKey.slice(0, midpoint) === rawKey.slice(midpoint)
    ? rawKey.slice(0, midpoint)
    : rawKey;
  if (!apiKey) return null;
  return new AssemblyAI({ apiKey });
}

function secondsToTimestamp(secondsValue: number) {
  const seconds = Math.max(0, Math.floor(secondsValue));
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

async function fetchWithTimeout(url: string, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 SEO-Automation' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadMedia(sourceLink: string): Promise<DownloadedMedia | null> {
  if (!sourceLink || isYoutubeUrl(sourceLink)) return null;
  const url = directDownloadUrl(sourceLink);
  const inferredMime = extensionMime(sourceLink);
  const response = await fetchWithTimeout(url, 30000);
  if (!response.ok) {
    throw new Error('Video/audio file could not be downloaded. Make the Drive file public or use a direct MP4/MP3 link.');
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_MEDIA_BYTES) {
    throw new Error('Video/audio file is too large for server transcription. Use a shorter clip or compressed file under 90MB.');
  }

  const contentType = (response.headers.get('content-type') || inferredMime || '').split(';')[0].trim().toLowerCase();
  const mimeType = contentType || inferredMime || 'video/mp4';
  const looksLikeMedia = mimeType.startsWith('video/') || mimeType.startsWith('audio/') || Boolean(inferredMime);
  if (!looksLikeMedia) {
    throw new Error('The link did not return a video/audio file. For Google Drive, set sharing to "Anyone with the link" and use the file link.');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_MEDIA_BYTES) {
    throw new Error('Video/audio file is too large for server transcription. Use a shorter clip or compressed file under 90MB.');
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: inferredMime || mimeType,
    fileName: mediaFileName(sourceLink),
  };
}

function formatAssemblyTranscript(transcript: {
  text?: string | null;
  words?: Array<{ start?: number | null; text?: string | null }> | null;
}) {
  const words = transcript.words?.filter(word => word.text && typeof word.start === 'number') || [];
  if (!words.length) return transcript.text || '';

  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += 60) {
    const chunk = words.slice(index, index + 60);
    const start = secondsToTimestamp((chunk[0].start || 0) / 1000);
    chunks.push(`${start} ${chunk.map(word => word.text).join(' ')}`);
  }
  return chunks.join('\n');
}

async function transcribeWithAssemblyAI(sourceLink: string): Promise<VideoSourceInsight | null> {
  const client = assemblyAIClient();
  if (!client || !sourceLink) return null;

  let sourceTitle = sourceLink;
  let audio: AudioToTranscribe = directDownloadUrl(sourceLink);

  if (isYoutubeUrl(sourceLink)) {
    const info = await ytdl.getInfo(sourceLink);
    sourceTitle = info.videoDetails.title || sourceLink;
    audio = ytdl.downloadFromInfo(info, {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 25,
    });
  }

  const transcript = await client.transcripts.transcribe({
    audio,
    speech_models: ASSEMBLYAI_SPEECH_MODELS,
    punctuate: true,
    format_text: true,
  }, {
    pollingInterval: 3000,
    pollingTimeout: 240000,
  });

  if (transcript.status === 'error') {
    throw new Error(transcript.error || 'AssemblyAI transcription failed.');
  }

  const text = formatAssemblyTranscript(transcript);
  if (!text || text.length < 80) return null;

  let srt = '';
  let vtt = '';
  try {
    [srt, vtt] = await Promise.all([
      client.transcripts.subtitles(transcript.id, 'srt'),
      client.transcripts.subtitles(transcript.id, 'vtt'),
    ]);
  } catch {
    // Caption export is a nice-to-have. The transcript is still usable.
  }

  return {
    title: sourceTitle,
    transcript: text.slice(0, 30000),
    captions: srt || vtt ? { srt, vtt } : undefined,
    source: 'assemblyai-transcription',
  };
}

async function transcribeUploadedFileWithAssemblyAI(file: ParsedVideoKitRequest['uploadedFile']): Promise<VideoSourceInsight | null> {
  const client = assemblyAIClient();
  if (!client || !file) return null;
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error('Uploaded audio/video file is too large. Use a file under 90MB.');
  }

  const transcript = await client.transcripts.transcribe({
    audio: file.buffer,
    speech_models: ASSEMBLYAI_SPEECH_MODELS,
    punctuate: true,
    format_text: true,
  }, {
    pollingInterval: 3000,
    pollingTimeout: 240000,
  });

  if (transcript.status === 'error') {
    throw new Error(transcript.error || 'AssemblyAI transcription failed.');
  }

  const text = formatAssemblyTranscript(transcript);
  if (!text || text.length < 80) return null;

  let srt = '';
  let vtt = '';
  try {
    [srt, vtt] = await Promise.all([
      client.transcripts.subtitles(transcript.id, 'srt'),
      client.transcripts.subtitles(transcript.id, 'vtt'),
    ]);
  } catch {
    // Caption export is optional.
  }

  return {
    title: file.name || 'Uploaded media file',
    transcript: text.slice(0, 30000),
    captions: srt || vtt ? { srt, vtt } : undefined,
    source: 'assemblyai-transcription',
  };
}

function transcriptionPrompt(language: string) {
  return `Transcribe this video/audio yourself from the media.

Return valid JSON only:
{
  "title": "best short title if visible or infer from content",
  "transcript": "timestamped transcript with a timestamp every 15-30 seconds, formatted like 00:00 Spoken content..."
}

Rules:
- Use ${language || 'the spoken language'} for transcript text when possible.
- Do not summarize instead of transcribing.
- Preserve teaching points, examples, numbers, names, and calls to action.
- If a section has no speech, describe the visual/audio context briefly with timestamp.`;
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return String(error || 'Unknown provider error.');
  try {
    const parsed = JSON.parse(error.message) as { error?: { code?: number; message?: string; status?: string } };
    if (parsed.error?.message) {
      return `${parsed.error.code || ''} ${parsed.error.status || ''} ${parsed.error.message}`.trim();
    }
  } catch {
    // Keep the plain SDK message.
  }
  return error.message;
}

function userFriendlyTranscriptionError(message: string) {
  if (/sign in to confirm/i.test(message) || /not a bot/i.test(message)) {
    return 'YouTube blocked server-side audio extraction with a bot/sign-in challenge. Browser login does not apply to the backend server. Use a YouTube video with captions, public Google Drive/direct MP4-MP3 link, or paste transcript/notes.';
  }
  return message;
}

async function generateGeminiVideoText(parts: Array<{ fileData?: { fileUri: string; mimeType?: string }; text?: string }>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const ai = new GoogleGenAI({ apiKey });
  let finalError: unknown;

  for (const model of VIDEO_TRANSCRIPTION_MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
        });
        const text = result.text || '';
        if (text.trim()) return text;
      } catch (error) {
        finalError = error;
        const detail = errorMessage(error).toLowerCase();
        const transient = detail.includes('503') || detail.includes('unavailable') || detail.includes('high demand');
        const quota = detail.includes('429') || detail.includes('quota') || detail.includes('limit');
        if (!transient && !quota) break;
        await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }

  throw new Error(errorMessage(finalError));
}

async function transcribeYoutubeWithGemini(sourceLink: string, language: string): Promise<VideoSourceInsight | null> {
  if (!isYoutubeUrl(sourceLink)) return null;

  const text = await generateGeminiVideoText([
    { fileData: { fileUri: sourceLink } },
    { text: transcriptionPrompt(language) },
  ]);
  const parsed = JSON.parse(extractJsonText(text)) as { title?: string; transcript?: string };
  const transcript = parsed.transcript?.trim();
  if (!transcript || transcript.length < 80) return null;
  return {
    title: parsed.title?.trim(),
    transcript: transcript.slice(0, 26000),
    source: 'gemini-video-transcription',
  };
}

async function transcribeUploadedMediaWithGemini(media: DownloadedMedia, language: string): Promise<VideoSourceInsight | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const fileManager = new GoogleAIFileManager(apiKey, { timeout: 90000 });
  const upload = await fileManager.uploadFile(media.buffer, {
    displayName: media.fileName,
    mimeType: media.mimeType,
  });

  let file = upload.file;
  try {
    const deadline = Date.now() + 90000;
    while (file.state === FileState.PROCESSING && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      file = await fileManager.getFile(file.name);
    }

    if (file.state !== FileState.ACTIVE) {
      throw new Error(file.error?.message || 'Gemini could not process this video/audio file.');
    }

    const text = await generateGeminiVideoText([
      { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
      { text: transcriptionPrompt(language) },
    ]);
    const parsed = JSON.parse(extractJsonText(text)) as { title?: string; transcript?: string };
    const transcript = parsed.transcript?.trim();
    if (!transcript || transcript.length < 80) return null;
    return {
      title: parsed.title?.trim() || media.fileName,
      transcript: transcript.slice(0, 26000),
      source: 'gemini-video-transcription',
    };
  } finally {
    fileManager.deleteFile(file.name).catch(() => undefined);
  }
}

async function transcribeMediaSource(sourceLink: string, language: string): Promise<VideoSourceInsight | null> {
  if (!sourceLink) return null;

  if (isYoutubeUrl(sourceLink)) {
    return await withTimeout(transcribeYoutubeWithGemini(sourceLink, language), 65000);
  }

  const media = await downloadMedia(sourceLink);
  if (!media) return null;
  return await withTimeout(transcribeUploadedMediaWithGemini(media, language), 130000);
}

async function getVideoSourceInsight(sourceLink?: string): Promise<VideoSourceInsight> {
  if (!sourceLink) return { source: 'none' };
  const videoId = youtubeIdFromUrl(sourceLink);
  if (!videoId) {
    return {
      source: 'none',
      warning: 'The video/audio could not be transcribed from this link. Use a public Drive file, direct MP4/MP3 link, YouTube link, or paste transcript/notes.',
    };
  }

  const insight: VideoSourceInsight = { source: 'none' };
  try {
    const oembed = await fetchWithTimeout(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembed.ok) {
      const data = await oembed.json() as { title?: string };
      insight.title = data.title;
    }
  } catch {
    // Metadata is optional.
  }

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = transcriptItems
      .map(item => `${secondsToTimestamp(item.offset / 1000)} ${decodeHtml(item.text.replace(/\s+/g, ' ').trim())}`)
      .filter(line => line.trim().length > 6)
      .join('\n')
      .slice(0, 18000);

    if (transcript) {
      return { ...insight, transcript, source: 'youtube-captions' };
    }
  } catch {
    // Fall through to the older HTML caption extraction fallback.
  }

  try {
    const watch = await fetchWithTimeout(`https://www.youtube.com/watch?v=${videoId}`);
    if (!watch.ok) return insight;
    const html = await watch.text();
    const captionMatch = html.match(/"captionTracks":(\[.*?\])[,}]/);
    if (!captionMatch?.[1]) {
      return { ...insight, warning: 'The video could not be transcribed and no captions were found. Paste transcript/notes or use a public video/audio file link.' };
    }

    const tracks = JSON.parse(captionMatch[1].replace(/\\"/g, '"')) as Array<{ baseUrl?: string; languageCode?: string }>;
    const track = tracks.find(item => item.languageCode?.startsWith('en')) || tracks[0];
    if (!track?.baseUrl) return insight;

    const transcriptResponse = await fetchWithTimeout(decodeHtml(track.baseUrl));
    if (!transcriptResponse.ok) return insight;
    const transcriptXml = await transcriptResponse.text();
    const transcript = Array.from(transcriptXml.matchAll(/<text start="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g))
      .map(match => `${secondsToTimestamp(Number(match[1]))} ${decodeHtml(match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())}`)
      .filter(line => line.trim().length > 6)
      .join('\n')
      .slice(0, 18000);

    if (transcript) {
      return { ...insight, transcript, source: 'youtube-captions' };
    }
  } catch {
    return { ...insight, warning: 'Transcript could not be loaded automatically. Paste transcript/notes to continue.' };
  }

  return insight;
}

function buildVideoPrompt(params: {
  title: string;
  transcript: string;
  audience: string;
  goal: string;
  language: string;
}) {
  return `You are a senior YouTube content strategist and video editor.

Use ONLY the transcript/source notes below as the brain. Do not invent a different topic. If timestamps are in the transcript, use them.

Language: ${params.language}
Audience: ${params.audience}
Goal: ${params.goal}
Video title/source: ${params.title}

Transcript/source notes:
${params.transcript}

Return valid JSON only:
{
  "output": "A complete video content kit with these sections: 1) Content understanding summary, 2) Accurate or best-effort chapters with timestamps, 3) 5 viral but relevant title options, 4) 5 thumbnail text ideas, 5) thumbnail design direction, 6) SEO optimized description, 7) 10 hashtags, 8) 20 video tags, 9) 8-10 Reels/Shorts ideas with timestamp ranges and hook text, 10) 3 separate 3-5 minute video ideas with timestamped structure, 11) social post versions for Facebook, LinkedIn, and YouTube community."
}`;
}

function keywordFromTitle(value: string) {
  return value
    .replace(/^https?:\/\/\S+/i, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'the video topic';
}

function buildTranscriptFallback(params: {
  title: string;
  transcript: string;
  audience: string;
  goal: string;
  language: string;
}) {
  const topic = keywordFromTitle(params.title);
  const lines = params.transcript.split('\n').map(line => line.trim()).filter(Boolean);
  const timestampLines = lines.filter(line => /^\d{1,2}:\d{2}/.test(line)).slice(0, 8);
  const chapters = timestampLines.length
    ? timestampLines.map(line => `- ${line}`).join('\n')
    : [
      '- 00:00 Intro and lesson promise',
      '- 00:30 Main concept explained',
      '- 01:30 Example or demonstration',
      '- 03:00 Practice/action section',
      '- 04:30 Recap and next step',
    ].join('\n');

  return `Video Content Kit
Topic/source: ${topic}
Audience: ${params.audience}
Goal: ${params.goal}
Transcript basis: ${timestampLines.length ? 'Timestamped source notes' : 'Manual transcript/notes'}

1. Content Understanding Summary
This kit is based on the provided transcript/notes, not a generic topic guess. The video appears to teach or explain: ${lines.slice(0, 4).join(' ')}

2. Chapters / Timestamps
${chapters}

3. Viral But Relevant Title Options
- ${topic}: Simple Lesson for ${params.audience}
- Learn ${topic} Step by Step
- ${topic} Explained With Examples
- Easy ${topic} Practice for Students
- Watch This Before Practicing ${topic}

4. Thumbnail Text Ideas
- EASY LESSON
- START HERE
- STEP BY STEP
- PRACTICE NOW
- SIMPLE TRICK

5. Thumbnail Direction
Use a clean classroom-style visual, one clear subject/object from the lesson, large 2-3 word text, bright contrast, and a friendly teacher/student cue. Avoid generic marketing-style thumbnails.

6. SEO Optimized Description
In this video, ${params.audience} can learn ${topic} with a simple explanation, examples, and practice guidance. The lesson is structured to make the topic easier to understand and easier to revise later.

What you will learn:
- Main concept from the lesson
- Step-by-step explanation
- Practice examples
- Recap and next action

7. Reels / Shorts Ideas With Timestamps
- 00:00-00:20 Hook: what students will learn today
- 00:30-00:55 Simple explanation clip
- 01:00-01:30 One example clip
- 02:00-02:30 Practice question clip
- 03:00-03:30 Common mistake or recap clip
- 04:00-04:30 Final quick revision clip
- 04:30-05:00 Homework/action prompt

8. 3-5 Minute Video Ideas With Timestamps
Idea 1: ${topic} Quick Lesson
00:00 Hook
00:20 Concept
01:20 Example
03:00 Practice
04:30 Recap

Idea 2: ${topic} Practice Session
00:00 Promise
00:30 Question 1
01:30 Question 2
02:30 Question 3
04:00 Answer recap

Idea 3: ${topic} Mistakes and Fixes
00:00 Common mistake hook
00:30 Mistake explanation
01:30 Correct method
03:00 Practice
04:30 Recap

9. Hashtags
#Class2 #Education #Learning #StudyTips #StudentLearning #OnlineClass #MathLesson #KidsEducation #YouTubeEducation #StudyOnline

10. Video Tags
${topic}, class 2 lesson, class 2 education, class 2 tutorial, class 2 practice, online class, kids learning, student learning, primary education, easy lesson, school lesson, educational video

11. Social Post Versions
Facebook: A simple lesson for ${params.audience}. Watch the video, practice along, and revise the key points.
LinkedIn: Educational content works best when the lesson is clear, structured, and easy to revisit. This video turns ${topic} into a step-by-step learning experience.
YouTube Community: New lesson uploaded: ${topic}. Watch, practice, and comment your answer or question.`;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('Video kit generation timed out.')), timeoutMs);
  });

  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function parseVideoKitRequest(request: Request): Promise<ParsedVideoKitRequest> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return await request.json() as ParsedVideoKitRequest;
  }

  const form = await request.formData();
  const fileValue = form.get('mediaFile');
  let uploadedFile: ParsedVideoKitRequest['uploadedFile'];
  if (fileValue instanceof File && fileValue.size > 0) {
    uploadedFile = {
      buffer: Buffer.from(await fileValue.arrayBuffer()),
      name: fileValue.name || 'uploaded-media',
      type: fileValue.type || 'application/octet-stream',
      size: fileValue.size,
    };
  }

  return {
    sourceLink: String(form.get('sourceLink') || ''),
    audience: String(form.get('audience') || ''),
    goal: String(form.get('goal') || ''),
    notes: String(form.get('notes') || ''),
    language: String(form.get('language') || 'English'),
    uploadedFile,
  };
}

export async function POST(request: Request) {
  try {
    const body = await parseVideoKitRequest(request);
    const sourceLink = (body.sourceLink || '').trim();
    const manualNotes = (body.notes || '').trim();
    if (!sourceLink && !manualNotes && !body.uploadedFile) {
      return NextResponse.json({ success: false, error: 'Upload an audio/video file, paste a YouTube/Drive link, or add transcript/notes first.' }, { status: 400 });
    }

    const language = body.language || 'English';
    let mediaWarning = '';
    let mediaInsight: VideoSourceInsight | null = null;
    if (isYoutubeUrl(sourceLink)) {
      const captionInsight = await getVideoSourceInsight(sourceLink);
      if (captionInsight.transcript) {
        mediaInsight = captionInsight;
      }
    }

    try {
      if (!mediaInsight) {
        mediaInsight = body.uploadedFile
          ? await withTimeout(transcribeUploadedFileWithAssemblyAI(body.uploadedFile), 250000)
          : await withTimeout(transcribeWithAssemblyAI(sourceLink), 250000);
      }
    } catch (error) {
      mediaWarning = `AssemblyAI transcription failed: ${userFriendlyTranscriptionError(errorMessage(error))}`;
    }

    if (!mediaInsight) {
      const captionInsight = await getVideoSourceInsight(sourceLink);
      if (captionInsight.transcript) {
        mediaInsight = captionInsight;
      }
    }

    if (!mediaInsight && ENABLE_GEMINI_TRANSCRIPTION_FALLBACK) {
      try {
        mediaInsight = await transcribeMediaSource(sourceLink, language);
      } catch (error) {
        mediaWarning = mediaWarning
          ? `${mediaWarning} Gemini fallback failed: ${errorMessage(error)}`
          : `Automatic media transcription failed: ${errorMessage(error)}`;
      }
    }

    const insight = mediaInsight || await getVideoSourceInsight(sourceLink);
    const transcript = insight.transcript || manualNotes;
    if (!transcript || transcript.length < 80) {
      return NextResponse.json({
        success: false,
        error: mediaWarning
          ? mediaWarning
          : insight.warning || 'Transcript could not be loaded. Paste transcript/notes so the kit can be based on the actual video.',
        sourceTitle: insight.title || sourceLink,
      }, { status: 422 });
    }

    const sourceTitle = insight.title || sourceLink || 'Manual video notes';
    const promptParams = {
      title: sourceTitle,
      transcript,
      audience: body.audience || 'the actual viewers of this video',
      goal: body.goal || 'views, retention, subscribers, and relevant action',
      language,
    };

    let output = '';
    try {
      const text = await withTimeout(generateGeminiText(buildVideoPrompt(promptParams)), 30000);
      try {
        const parsed = JSON.parse(extractJsonText(text)) as { output?: string };
        output = typeof parsed.output === 'string' ? parsed.output.trim() : '';
      } catch {
        output = text.trim();
      }
    } catch {
      output = buildTranscriptFallback(promptParams);
    }

    if (!output) output = buildTranscriptFallback(promptParams);

    const data: VideoKitResult = {
      sourceTitle,
      transcriptSource: insight.source === 'assemblyai-transcription'
        ? 'AssemblyAI video/audio transcription'
        : insight.source === 'gemini-video-transcription'
        ? 'Gemini video/audio transcription'
        : insight.source === 'youtube-captions'
          ? 'YouTube public captions fallback'
          : 'Manual transcript/notes',
      transcriptPreview: transcript.slice(0, 1400),
      captions: insight.captions,
      output,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Video kit generation failed.',
    }, { status: 500 });
  }
}
