'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Download,
  ArrowRightLeft,
  CalendarClock,
  Network,
  ArrowRight,
  FileText,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  Volume2,
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

function getYouTubeThumbnail(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
  } catch {
    // silent
  }
  return null;
}

export default function Home() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [activeMedia, setActiveMedia] = useState<DownloadRecord | null>(null);

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

  const deleteRecord = async (id: string) => {
    if (!confirm('Delete this record and its file?')) return;
    try {
      const res = await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
      if (res.ok) setDownloads((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent
    }
  };

  const completed = downloads.filter((d) => d.status === 'COMPLETED' && d.filePath);

  return (
    <div className="px-6 py-8 max-w-[1100px] mx-auto w-full space-y-10">
      {/* ---- HERO SECTION ---- */}
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          DownFork Tools
        </h1>
        <p className="text-xs text-text-secondary max-w-lg leading-relaxed">
          Select a tool below to begin media extraction, format conversion, or manage your library.
        </p>
      </section>

      {/* ---- TOOLS DIRECTORY GRID ---- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube Downloader */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-border-hover hover:shadow-xl hover:shadow-accent-glow/5 transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/20">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">YouTube Downloader</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Extract video and high-quality audio formats from YouTube, TikTok, Vimeo, and other web links.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-5 mt-4 border-t border-border/50">
            <Link
              href="/downloader/new"
              className="flex-1 flex items-center justify-center h-8.5 rounded-lg bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-colors cursor-pointer"
            >
              Open Downloader
            </Link>
            <Link
              href="/downloader/library"
              className="px-3 flex items-center justify-center h-8.5 rounded-lg bg-bg-surface border border-border text-text-primary text-xs font-semibold hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Library
            </Link>
          </div>
        </div>

        {/* File Converter */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-border-hover hover:shadow-xl hover:shadow-accent-glow/5 transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/20">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">File Converter</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Convert local media files between formats (MP3, MP4, WebM, WAV, GIF) using local system FFmpeg.
              </p>
            </div>
          </div>
          <div className="pt-5 mt-4 border-t border-border/50">
            <Link
              href="/converter"
              className="w-full flex items-center justify-center h-8.5 rounded-lg bg-bg-surface border border-border text-text-primary text-xs font-bold hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Open Converter
            </Link>
          </div>
        </div>

        {/* Scheduler */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-border-hover hover:shadow-xl hover:shadow-accent-glow/5 transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <CalendarClock className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/20">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">Task Scheduler</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Schedule recurring download jobs, automated backup operations, and media updates.
              </p>
            </div>
          </div>
          <div className="pt-5 mt-4 border-t border-border/50">
            <Link
              href="/scheduler"
              className="w-full flex items-center justify-center h-8.5 rounded-lg bg-bg-surface border border-border text-text-primary text-xs font-bold hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Open Scheduler
            </Link>
          </div>
        </div>

        {/* Batch URLs */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-border-hover hover:shadow-xl hover:shadow-accent-glow/5 transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Network className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/15 text-success border border-success/20">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">Batch URL Downloader</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Import bulk text lists of video URLs and run batch extractions in parallel pipelines.
              </p>
            </div>
          </div>
          <div className="pt-5 mt-4 border-t border-border/50">
            <Link
              href="/batch"
              className="w-full flex items-center justify-center h-8.5 rounded-lg bg-bg-surface border border-border text-text-primary text-xs font-bold hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Open Batch Tool
            </Link>
          </div>
        </div>
      </section>

      {/* Media Player Modal */}
      {activeMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          />
          <div className="relative w-full max-w-3xl bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl z-10">
            <div className="flex items-center justify-between p-4 border-b border-border bg-bg-deep/40">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                {activeMedia.format === 'mp4' ? (
                  <Film className="w-4 h-4 text-accent shrink-0" />
                ) : (
                  <Music className="w-4 h-4 text-accent shrink-0" />
                )}
                <h3
                  className="text-xs font-semibold text-text-primary truncate"
                  title={activeMedia.title || activeMedia.url}
                >
                  {activeMedia.title || activeMedia.url}
                </h3>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-bg-deep flex items-center justify-center min-h-[240px] max-h-[70vh]">
              {activeMedia.format === 'mp4' ? (
                <video
                  src={activeMedia.filePath!}
                  poster={activeMedia.thumbnailUrl || getYouTubeThumbnail(activeMedia.url) || undefined}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[70vh] object-contain focus:outline-none"
                />
              ) : (
                <div className="w-full max-w-lg px-6 py-12 flex flex-col items-center text-center space-y-6">
                  {activeMedia.thumbnailUrl || getYouTubeThumbnail(activeMedia.url) ? (
                    <div className="relative w-28 h-28 rounded-xl border border-border shadow-lg overflow-hidden shrink-0">
                      <img
                        src={activeMedia.thumbnailUrl || getYouTubeThumbnail(activeMedia.url) || ''}
                        alt={activeMedia.title || 'Album Art'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="relative w-24 h-24 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center">
                      <div className="absolute inset-2 border border-dashed border-accent/20 rounded-full animate-spin [animation-duration:15s]" />
                      <Volume2 className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                  )}
                  <div className="space-y-1 w-full">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">
                      Playing audio file
                    </p>
                    <p className="text-sm font-semibold text-text-primary truncate px-4">
                      {activeMedia.title || activeMedia.url}
                    </p>
                  </div>
                  <audio
                    src={activeMedia.filePath!}
                    controls
                    autoPlay
                    className="w-full focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-deep/40 text-[10px] text-text-secondary font-medium">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-text-muted" />
                {activeMedia.fileSize || '--'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeMedia.filePath!}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-deep font-bold hover:bg-accent-bright transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
