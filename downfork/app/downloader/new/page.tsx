'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Link as LinkIcon,
  ClipboardPaste,
  Download,
  Music,
  Film,
  Sparkles,
  Loader2,
  ArrowLeft,
  Square,
} from 'lucide-react';

interface DownloadRecord {
  id: string;
  title: string | null;
  url: string;
  format: string;
  fileSize: string | null;
  filePath: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  thumbnailUrl: string | null;
  progress?: string;
  speed?: string;
  eta?: string;
}

export default function DownloaderPage() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchDownloads = useCallback(async () => {
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) setDownloads(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  useEffect(() => {
    const hasPending = downloads.some((d) => d.status === 'PENDING');
    if (!hasPending) return;

    const id = setInterval(fetchDownloads, 1500);
    return () => clearInterval(id);
  }, [downloads, fetchDownloads]);

  const submit = async () => {
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ ok: true, text: 'Download queued successfully.' });
        setUrl('');
        fetchDownloads();
      } else {
        setFeedback({ ok: false, text: data.error || 'Failed to start download.' });
      }
    } catch {
      setFeedback({ ok: false, text: 'Connection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // clipboard access denied
    }
  };

  const stopDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/downloads/${id}/stop`, { method: 'POST' });
      if (res.ok) fetchDownloads();
    } catch {
      // silent
    }
  };

  const pending = downloads.filter((d) => d.status === 'PENDING');

  return (
    <div className="px-6 py-8 max-w-[800px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">YouTube Downloader</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Extract videos and audio files to your local library
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Downloader card */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Download YouTube Video</h3>

          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="url"
                required
                placeholder="Paste a video or audio URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full bg-bg-surface border border-border rounded-xl pl-10 pr-4 h-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all duration-200"
              />
            </div>
            <button
              type="button"
              onClick={paste}
              className="flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-bg-surface border border-border text-text-secondary text-xs font-medium hover:bg-bg-hover hover:text-text-primary transition-all duration-200 cursor-pointer shrink-0"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste
            </button>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* MP3 */}
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  format === 'mp3'
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'mp3' ? 'bg-accent/15' : 'bg-bg-elevated'
                }`}>
                  <Music className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Audio</div>
                  <div className="text-[10px] text-text-muted">MP3</div>
                </div>
              </button>

              {/* MP4 */}
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  format === 'mp4'
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'mp4' ? 'bg-accent/15' : 'bg-bg-elevated'
                }`}>
                  <Film className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Video</div>
                  <div className="text-[10px] text-text-muted">MP4 Best</div>
                </div>
              </button>

              {/* HD - maps to mp4 */}
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`hidden sm:flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  format === 'mp4'
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'mp4' ? 'bg-accent/15' : 'bg-bg-elevated'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">HD Video</div>
                  <div className="text-[10px] text-text-muted">MP4 1080p+</div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit + Feedback */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border">
            {feedback && (
              <p className={`text-xs font-medium ${feedback.ok ? 'text-success' : 'text-error'}`}>
                {feedback.text}
              </p>
            )}
            <div className="sm:ml-auto" />
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !url.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent-glow/10"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {submitting ? 'Starting...' : 'Start Download'}
            </button>
          </div>
        </div>

        {/* Active downloads */}
        {pending.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Active Downloads ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.map((dl) => (
                <div key={dl.id} className="bg-bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/20">
                        Active
                      </span>
                      <span className="text-xs text-text-secondary truncate" title={dl.title || dl.url}>
                        {dl.title || dl.url}
                      </span>
                    </div>
                    <button
                      onClick={() => stopDownload(dl.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 border border-error/20 text-error text-[11px] font-semibold hover:bg-error/20 transition-colors cursor-pointer shrink-0"
                      title="Stop download"
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-text-secondary">
                    <span>{dl.progress ? `${dl.progress}%` : 'Connecting...'}</span>
                    {dl.speed && dl.eta && (
                      <span className="font-mono text-text-muted">
                        {dl.speed} - ETA {dl.eta}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                    <div
                      className="shimmer-bar h-full rounded-full transition-all duration-300"
                      style={{ width: dl.progress ? `${dl.progress}%` : '5%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
