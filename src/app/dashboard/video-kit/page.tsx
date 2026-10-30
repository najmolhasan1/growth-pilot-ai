'use client';

import { FormEvent, useState } from 'react';
import { Check, Copy, Download, Loader2, Video, Wand2, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#030303] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5533]">
              <Video size={12} /> Separate Video Workflow
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Video <span className="bg-gradient-to-r from-[#FF4D42] via-[#FF6A3D] to-[#FF8A00] bg-clip-text text-transparent">Content Kit</span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-white/50">
              Paste a YouTube link, public Google Drive video/audio file, or direct MP4/MP3 link. The app transcribes the media first, then uses that transcript as the brain for every title, timestamp, short-form idea, tag, and description.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 w-full">
          <form onSubmit={generate} className="space-y-6 rounded-3xl border border-white/10 bg-[#0d0d0f] p-5 sm:p-7 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF5533] flex items-center justify-center text-xs font-black">
                  01
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Media Source & Parameters</h2>
                  <p className="text-[11px] text-white/40">Upload media or paste link to transcribe and extract viral packaging.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Language:</span>
                <select
                  value={language}
                  onChange={event => setLanguage(event.target.value)}
                  className="rounded-xl border border-white/10 bg-[#030303] px-3 py-1.5 text-xs font-bold text-white outline-none cursor-pointer focus:border-[#FF5533]/50"
                >
                  <option>English</option>
                  <option>Bengali</option>
                  <option>Banglish</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Upload Audio / Video File
                </label>
                <input
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.m4v"
                  onChange={event => setMediaFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-white/10 bg-[#030303] px-4 py-2.5 text-xs text-white file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500/15 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-[#FF7A45]"
                />
                <p className="mt-1.5 text-[11px] leading-4 text-white/35">
                  Direct upload (under 90MB) bypasses YouTube bot protection.
                </p>
                {mediaFile && (
                  <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-[#FF7A45]">
                    <span className="truncate">{mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    <button type="button" onClick={() => setMediaFile(null)} className="font-black text-[#FF5533] hover:text-white">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Or Video / Audio Link
                </label>
                <input
                  value={sourceLink}
                  onChange={event => setSourceLink(event.target.value)}
                  placeholder="YouTube, public Drive file, or direct MP4/MP3 link"
                  className="w-full rounded-2xl border border-white/10 bg-[#030303] px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                />
                <p className="mt-1.5 text-[11px] leading-4 text-white/35">
                  Supports YouTube public videos, Drive links, and direct media URLs.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Audience (Optional)
                </label>
                <input
                  value={audience}
                  onChange={event => setAudience(event.target.value)}
                  placeholder="E.g. small business owners, students, developers, founders"
                  className="w-full rounded-2xl border border-white/10 bg-[#030303] px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Conversion Goal (Optional)
                </label>
                <input
                  value={goal}
                  onChange={event => setGoal(event.target.value)}
                  placeholder="E.g. course sales, leads, subscribers, website visits"
                  className="w-full rounded-2xl border border-white/10 bg-[#030303] px-4 py-2.5 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Transcript / Source Notes (Optional Fallback)
                </label>
                <textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Paste transcript, summary, or lesson notes if link is unreadable."
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#030303] px-4 py-3 text-xs leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#FF5533]/60 focus:ring-1 focus:ring-[#FF5533]/20"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-white/5">
              <button
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-[#FF5533]/25 transition hover:from-[#FF5547] hover:to-[#FF9036] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer w-full sm:w-auto"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                <span>{loading ? 'Transcribing media and building kit...' : 'Transcribe & Generate Video Kit'}</span>
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-100 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-5 sm:p-7 shadow-2xl space-y-6 w-full">
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
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0d0d0f]/60 p-8 text-center">
                <Video size={36} className="mb-4 text-[#FF5533]" />
                <h3 className="text-xl font-black text-white">Video first, transcript based</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                  No more generic video output. The app reads the video/audio first and builds the kit from the actual transcript.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d0d0f]/60 p-8 text-center">
                <Loader2 className="mb-4 animate-spin text-[#FF5533]" size={36} />
                <h3 className="text-xl font-black text-white">Reading the video first...</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                  Transcribing the uploaded file or source link first, then generating titles, timestamps, reels ideas, description, tags, and 3-5 minute video ideas.
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-5">
                <section className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FF7A45]">Transcript Source</p>
                  <h3 className="mt-2 text-lg font-black text-white">{result.sourceTitle}</h3>
                  <p className="mt-1 text-xs text-[#FF8A00]">{result.transcriptSource}</p>
                  <p className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-white/45">
                    {result.transcriptPreview}
                  </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-5">
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
