'use client';

import { FormEvent, useState } from 'react';
import { Check, Copy, Download, Loader2, Video, Wand2 } from 'lucide-react';
import { copyTextSafely } from '@/lib/clipboard';

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

function fileBaseName(value: string) {
  return (value || 'video-content-kit')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'video-content-kit';
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function VideoKitPage() {
  const [sourceLink, setSourceLink] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<VideoKitResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      let response: Response;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('mediaFile', mediaFile);
        formData.append('sourceLink', sourceLink);
        formData.append('audience', audience);
        formData.append('goal', goal);
        formData.append('notes', notes);
        formData.append('language', language);
        response = await fetch('/api/video-kit', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/video-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceLink, audience, goal, notes, language }),
        });
      }
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Video kit generation failed.');
      }
      setResult(payload.data as VideoKitResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video kit generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async () => {
    if (!result) return;
    const success = await copyTextSafely(result.output);
    if (!success) {
      setError('Copy permission was blocked. Please select and copy manually.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadOutput = (format: 'txt' | 'md' | 'srt' | 'vtt') => {
    if (!result) return;
    const base = fileBaseName(result.sourceTitle);
    if (format === 'srt' || format === 'vtt') {
      const caption = format === 'srt' ? result.captions?.srt : result.captions?.vtt;
      if (!caption) return;
      downloadText(`${base}.${format}`, caption, `text/${format};charset=utf-8`);
      return;
    }
    downloadText(`${base}.${format}`, result.output, format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
  };

  return (
    <div className="min-h-screen bg-[#030712] p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              <Video size={12} /> Separate Video Workflow
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Video <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">Content Kit</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Paste a YouTube link, public Google Drive video/audio file, or direct MP4/MP3 link. The app transcribes the media first, then uses that transcript as the brain for every title, timestamp, short-form idea, tag, and description.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[430px,1fr]">
          <form onSubmit={generate} className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Upload Audio / Video File
              </label>
              <input
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.m4v"
                onChange={event => setMediaFile(event.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-xs file:font-black file:text-cyan-200"
              />
              <p className="mt-2 text-xs leading-5 text-white/35">
                Best option for accuracy. Upload MP3, WAV, M4A, MP4, MOV, or WebM under 90MB. This bypasses YouTube bot blocking.
              </p>
              {mediaFile && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                  <span className="truncate">{mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button type="button" onClick={() => setMediaFile(null)} className="font-black text-cyan-200 hover:text-white">
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Or Video / Audio Link
              </label>
              <input
                value={sourceLink}
                onChange={event => setSourceLink(event.target.value)}
                placeholder="YouTube, public Drive file, or direct MP4/MP3 link"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/70"
              />
              <p className="mt-2 text-xs leading-5 text-white/35">
                Link fallback supports YouTube captions, public Drive files, and direct MP4/MP3 URLs. Direct upload is more reliable than YouTube links.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Audience
              </label>
              <input
                value={audience}
                onChange={event => setAudience(event.target.value)}
                placeholder="Optional: class 2 students, parents, developers, founders"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Goal
              </label>
              <input
                value={goal}
                onChange={event => setGoal(event.target.value)}
                placeholder="Optional: views, students, course leads, subscribers"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Transcript / Notes
              </label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Optional fallback only. Paste transcript, summary, or lesson notes if the video link is private or cannot be read."
                rows={7}
                className="w-full resize-y rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                Output Language
              </label>
              <select
                value={language}
                onChange={event => setLanguage(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white outline-none"
              >
                <option>English</option>
                <option>Bengali</option>
                <option>Banglish</option>
              </select>
            </div>

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
              {loading ? 'Transcribing media and building kit...' : 'Transcribe & Generate Kit'}
            </button>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                {error}
              </div>
            )}
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Result</p>
                <h2 className="mt-1 text-2xl font-black text-white">Transcript-Based Kit</h2>
              </div>
              {result && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyOutput} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08]">
                    {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => downloadOutput('txt')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08]">
                    <Download size={15} /> TXT
                  </button>
                  <button onClick={() => downloadOutput('md')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08]">
                    <Download size={15} /> MD
                  </button>
                  {result.captions?.srt && (
                    <button onClick={() => downloadOutput('srt')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08]">
                      <Download size={15} /> SRT
                    </button>
                  )}
                  {result.captions?.vtt && (
                    <button onClick={() => downloadOutput('vtt')} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-white/70 transition hover:bg-white/[0.08]">
                      <Download size={15} /> VTT
                    </button>
                  )}
                </div>
              )}
            </div>

            {!result && !loading && (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0d1117]/60 p-8 text-center">
                <Video size={36} className="mb-4 text-cyan-300" />
                <h3 className="text-xl font-black text-white">Video first, transcript based</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                  No more generic video output. The app reads the video/audio first and builds the kit from the actual transcript.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d1117]/60 p-8 text-center">
                <Loader2 className="mb-4 animate-spin text-cyan-300" size={36} />
                <h3 className="text-xl font-black text-white">Reading the video first...</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                  Transcribing the uploaded file or source link first, then generating titles, timestamps, reels ideas, description, tags, and 3-5 minute video ideas.
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-5">
                <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200/70">Transcript Source</p>
                  <h3 className="mt-2 text-lg font-black text-white">{result.sourceTitle}</h3>
                  <p className="mt-1 text-xs text-cyan-100/70">{result.transcriptSource}</p>
                  <p className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-white/45">
                    {result.transcriptPreview}
                  </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0d1117] p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                    {result.output}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
