'use client';

import { FormEvent, useState } from 'react';
import { Check, Copy, Download, Loader2, Video, Wand2 } from 'lucide-react';
import { WorkspacePage, WorkspaceHeader, WorkspaceBody, Panel, Field, EmptyState, Notice, ui } from '@/components/workspace/ui';
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
    <WorkspacePage>
      <WorkspaceHeader title="Video Content Kit" crumbs={[{ label: 'Growth', href: '/dashboard' }]} />
      <WorkspaceBody>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <form onSubmit={generate} className="lg:col-span-5">
            <Panel
              title="Source"
              actions={
                <select value={language} onChange={event => setLanguage(event.target.value)} className={`${ui.select} h-8 w-auto text-xs`}>
                  <option>English</option>
                  <option>Bengali</option>
                  <option>Banglish</option>
                </select>
              }
              bodyClassName="space-y-4"
            >
              <Field label="Audio or video file (max 90MB)">
                <input
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.m4v"
                  onChange={event => setMediaFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-xs text-muted-foreground file:mr-3 file:h-8 file:cursor-pointer file:rounded-lg file:border-0 file:bg-muted file:px-3 file:text-xs file:font-medium file:text-foreground"
                />
              </Field>
              {mediaFile && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground">
                  <span className="truncate">
                    {mediaFile.name} · {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button type="button" onClick={() => setMediaFile(null)} className="text-muted-foreground hover:text-foreground">
                    Remove
                  </button>
                </div>
              )}

              <Field label="Or a link">
                <input
                  value={sourceLink}
                  onChange={event => setSourceLink(event.target.value)}
                  placeholder="YouTube, Drive or direct MP4/MP3 URL"
                  className={ui.input}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Audience">
                  <input value={audience} onChange={event => setAudience(event.target.value)} placeholder="e.g. Founders" className={ui.input} />
                </Field>
                <Field label="Goal">
                  <input value={goal} onChange={event => setGoal(event.target.value)} placeholder="e.g. Leads" className={ui.input} />
                </Field>
              </div>

              <Field label="Transcript or notes (optional)">
                <textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Paste a transcript if the media can't be reached"
                  rows={3}
                  className={ui.textarea}
                />
              </Field>

              {error && <Notice>{error}</Notice>}

              <button disabled={loading} className={`${ui.btnPrimary} h-11 w-full`}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {loading ? 'Transcribing…' : 'Generate kit'}
              </button>
            </Panel>
          </form>

          <Panel
            title="Output"
            className="lg:col-span-7"
            bodyClassName="min-h-[480px]"
            actions={
              result && (
                <>
                  <button onClick={copyOutput} className={ui.btnGhost}>
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                  {(['txt', 'md'] as const).map(f => (
                    <button key={f} onClick={() => downloadOutput(f)} className={ui.btnGhost}>
                      <Download size={13} /> {f}
                    </button>
                  ))}
                  {result.captions?.srt && (
                    <button onClick={() => downloadOutput('srt')} className={ui.btnGhost}>
                      <Download size={13} /> srt
                    </button>
                  )}
                  {result.captions?.vtt && (
                    <button onClick={() => downloadOutput('vtt')} className={ui.btnGhost}>
                      <Download size={13} /> vtt
                    </button>
                  )}
                </>
              )
            }
          >
            {!result && !loading && <EmptyState icon={Video} title="No kit yet" text="Add a file or link, then generate." />}

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="mb-3 h-6 w-6 animate-spin text-[#FF5533]" />
                <p className="text-sm text-muted-foreground">Transcribing and analyzing…</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <section className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{result.sourceTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{result.transcriptSource}</p>
                  <p className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                    {result.transcriptPreview}
                  </p>
                </section>
                <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{result.output}</div>
              </div>
            )}
          </Panel>
        </div>
      </WorkspaceBody>
    </WorkspacePage>
  );
}
