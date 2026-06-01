'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Network,
  Download,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Volume2,
  Trash2,
  Play,
  X,
  HardDrive,
  Film,
  Music,
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

type TabType = 'downloader' | 'extractor';

function BatchContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'downloader';

  const [activeTab, setActiveTab] = useState<TabType>('downloader');
  const [urlsInput, setUrlsInput] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [queuedIds, setQueuedIds] = useState<string[]>([]);
  const [isQueueing, setIsQueueing] = useState(false);
  const [queueResult, setQueueResult] = useState<{ success: number; failed: number } | null>(null);

  // Extractor States
  const [rawTextInput, setRawTextInput] = useState('');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);

  // Downloads tracking
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  // Sync tab with URL parameter
  useEffect(() => {
    if (initialTab === 'downloader' || initialTab === 'extractor') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchDownloads = useCallback(async () => {
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) setDownloads(await res.json());
    } catch {
      // silent
    }
  }, []);

  // Poll progress if any queued download is still pending
  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  useEffect(() => {
    const trackedDownloads = downloads.filter((d) => queuedIds.includes(d.id));
    const hasPending = trackedDownloads.some((d) => d.status === 'PENDING');
    if (!hasPending) return;

    const id = setInterval(fetchDownloads, 1500);
    return () => clearInterval(id);
  }, [downloads, queuedIds, fetchDownloads]);

  // URL extraction regex
  const extractUrls = () => {
    // Matches youtube links, tiktok links, vimeo, and standard https URLs
    const urlRegex = /(https?:\/\/[^\s"'<>\(\)]+)/gi;
    const matches = rawTextInput.match(urlRegex) || [];
    
    // Filter to keep mostly video platform links or unique URLs
    const uniqueMatches = Array.from(new Set(matches)).filter((url) => {
      const lower = url.toLowerCase();
      return (
        lower.includes('youtube.com') ||
        lower.includes('youtu.be') ||
        lower.includes('tiktok.com') ||
        lower.includes('vimeo.com') ||
        lower.includes('twitter.com') ||
        lower.includes('x.com') ||
        lower.match(/\.(mp4|mp3|mkv|mov|avi|webm|flv|m4a|wav|aac)$/)
      );
    });

    setExtractedUrls(uniqueMatches);
  };

  const sendToDownloader = () => {
    if (extractedUrls.length === 0) return;
    setUrlsInput(extractedUrls.join('\n'));
    setActiveTab('downloader');
  };

  // Submit bulk downloads
  const submitBatch = async () => {
    const urls = urlsInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('http://') || line.startsWith('https://'));

    if (urls.length === 0 || isQueueing) return;

    setIsQueueing(true);
    setQueueResult(null);
    const newQueuedIds: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Queue sequentially to prevent crashing the child process handler
    for (const url of urls) {
      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, format }),
        });

        if (res.ok) {
          const data = await res.json();
          newQueuedIds.push(data.id);
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    setQueuedIds((prev) => [...prev, ...newQueuedIds]);
    setQueueResult({ success: successCount, failed: failedCount });
    setUrlsInput('');
    setIsQueueing(false);
    fetchDownloads();
  };

  const stopDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/downloads/${id}/stop`, { method: 'POST' });
      if (res.ok) fetchDownloads();
    } catch {
      // silent
    }
  };

  // Filter downloads to show only those triggered in the current session
  const trackedDownloads = downloads.filter((d) => queuedIds.includes(d.id));

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Batch URL Downloader</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Bulk extract and download list of links in parallel pipelines
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

      {/* Tabs selector */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('downloader')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'downloader'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Batch Downloader
        </button>
        <button
          onClick={() => setActiveTab('extractor')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'extractor'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          URL Extractor
        </button>
      </div>

      {/* Tab Content */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {activeTab === 'downloader' ? (
          /* BATCH DOWNLOADER TAB */
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Paste URLs (one per line)
              </label>
              <textarea
                rows={6}
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=video1&#10;https://www.youtube.com/watch?v=video2"
                className="w-full bg-bg-surface border border-border rounded-xl p-3.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all"
              />
            </div>

            {/* Format Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Target Format
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setFormat('mp3')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    format === 'mp3'
                      ? 'bg-accent/10 border-accent/20 text-accent'
                      : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-semibold">Audio (MP3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('mp4')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    format === 'mp4'
                      ? 'bg-accent/10 border-accent/20 text-accent'
                      : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span className="text-xs font-semibold">Video (MP4)</span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              {queueResult && (
                <p className="text-xs font-medium text-text-secondary">
                  Queued: <span className="text-success">{queueResult.success} success</span>
                  {queueResult.failed > 0 && <span className="text-error">, {queueResult.failed} failed</span>}
                </p>
              )}
              {isQueueing && (
                <p className="text-xs font-medium text-text-muted flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Queueing batch URLs...
                </p>
              )}
              <button
                onClick={submitBatch}
                disabled={isQueueing || !urlsInput.trim()}
                className="ml-auto flex items-center justify-center gap-2 h-9 px-6 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent-glow/10"
              >
                <Download className="w-3.5 h-3.5" />
                Queue Downloads
              </button>
            </div>

            {/* Tracked Downloads List */}
            {trackedDownloads.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Batch Session Progress
                </h3>
                <div className="space-y-2.5">
                  {trackedDownloads.map((dl) => (
                    <div key={dl.id} className="bg-bg-surface/50 border border-border rounded-xl p-4.5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {dl.status === 'COMPLETED' ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/20">
                              Done
                            </span>
                          ) : dl.status === 'PENDING' ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20 animate-pulse">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-error/15 text-error border border-error/20">
                              Failed
                            </span>
                          )}
                          <span className="text-xs text-text-primary font-medium truncate" title={dl.title || dl.url}>
                            {dl.title || dl.url}
                          </span>
                        </div>
                        {dl.status === 'PENDING' && (
                          <button
                            onClick={() => stopDownload(dl.id)}
                            className="p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {dl.status === 'PENDING' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-medium text-text-secondary">
                            <span>{dl.progress ? `${dl.progress}%` : 'Connecting...'}</span>
                            {dl.speed && <span>{dl.speed} - ETA {dl.eta}</span>}
                          </div>
                          <div className="w-full bg-bg-elevated rounded-full h-1 overflow-hidden">
                            <div
                              className="shimmer-bar h-full rounded-full transition-all duration-300"
                              style={{ width: dl.progress ? `${dl.progress}%` : '5%' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* URL EXTRACTOR TAB */
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Paste raw HTML or Text Block
              </label>
              <textarea
                rows={6}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder="Paste code or page text containing video links..."
                className="w-full bg-bg-surface border border-border rounded-xl p-3.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={extractUrls}
                disabled={!rawTextInput.trim()}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Network className="w-4 h-4" />
                Extract Links
              </button>
            </div>

            {extractedUrls.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Extracted Video Links ({extractedUrls.length})
                  </h3>
                  <button
                    onClick={sendToDownloader}
                    className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-bright transition-colors cursor-pointer"
                  >
                    Send to Batch Downloader
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                <div className="bg-bg-surface border border-border rounded-xl p-3 max-h-60 overflow-y-auto space-y-1">
                  {extractedUrls.map((url, i) => (
                    <div
                      key={i}
                      className="text-[11px] font-mono text-text-secondary truncate border-b border-border/30 last:border-b-0 py-1"
                    >
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm text-text-muted">Loading Batch Tool...</p>
        </div>
      }
    >
      <BatchContent />
    </Suspense>
  );
}
