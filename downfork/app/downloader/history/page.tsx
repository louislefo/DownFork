'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Download,
  Trash2,
  RotateCcw,
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

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function HistoryPage() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) setDownloads(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const hasPending = downloads.some((d) => d.status === 'PENDING');
    if (!hasPending) return;

    const id = setInterval(fetchHistory, 1500);
    return () => clearInterval(id);
  }, [downloads, fetchHistory]);

  const stopDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/downloads/${id}/stop`, { method: 'POST' });
      if (res.ok) fetchHistory();
    } catch { /* silent */ }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Delete this record and its file?')) return;
    try {
      const res = await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
      if (res.ok) setDownloads(prev => prev.filter(d => d.id !== id));
    } catch { /* silent */ }
  };

  const retryDownload = async (origUrl: string, origFormat: string) => {
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: origUrl, format: origFormat }),
      });
      if (res.ok) fetchHistory();
    } catch { /* silent */ }
  };

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">History</h2>
          <p className="text-xs text-text-muted mt-0.5">All extraction pipeline records</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading && downloads.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 text-accent mx-auto mb-3 animate-spin" />
            <p className="text-sm text-text-muted">Loading history...</p>
          </div>
        ) : downloads.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-8 h-8 text-text-disabled mx-auto mb-3" />
            <p className="text-sm text-text-muted">No downloads recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[750px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Title</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Format</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Size</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Date</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((dl) => (
                  <tr key={dl.id} className="border-b border-border last:border-b-0 hover:bg-bg-surface/50 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0" />
                        <span className="text-sm text-text-primary truncate max-w-[250px]" title={dl.title || dl.url}>
                          {dl.title || dl.url}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        dl.format === 'mp3'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      }`}>
                        {dl.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary font-mono">
                      {dl.fileSize || '--'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary">
                      {timeAgo(dl.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {dl.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Done</span>
                        </div>
                      ) : dl.status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5 text-accent">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[11px] font-semibold">
                            Active {dl.progress ? `(${dl.progress}%)` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-error">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Failed</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {dl.status === 'PENDING' && (
                          <button
                            onClick={() => stopDownload(dl.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                            title="Stop download"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {dl.status === 'COMPLETED' && dl.filePath && (
                          <>
                            <button
                              onClick={() => window.open(dl.filePath!, '_blank')}
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                              title="Play / Preview"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={dl.filePath}
                              download
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        {dl.status === 'FAILED' && (
                          <button
                            onClick={() => retryDownload(dl.url, dl.format)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors cursor-pointer"
                            title="Retry download"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteRecord(dl.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
