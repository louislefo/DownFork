'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderOpen,
  Film,
  Music,
  Search,
  ChevronDown,
  Play,
  Download,
  Trash2,
  X,
  Volume2,
  Calendar,
  HardDrive,
  Filter,
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

type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'size-desc'
  | 'size-asc'
  | 'title-asc'
  | 'title-desc';

type FilterType = 'all' | 'video' | 'audio';

function parseSizeToBytes(sizeStr: string | null): number {
  if (!sizeStr) return 0;
  const match = sizeStr.trim().match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return val * (multipliers[unit] || 1);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
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

export default function LibraryPage() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeMedia, setActiveMedia] = useState<DownloadRecord | null>(null);

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) {
        const all: DownloadRecord[] = await res.json();
        // Only keep completed downloads that have a valid file path
        setDownloads(all.filter((d) => d.status === 'COMPLETED' && d.filePath));
      }
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const deleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this media file?')) return;
    try {
      const res = await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDownloads((prev) => prev.filter((d) => d.id !== id));
        if (activeMedia?.id === id) {
          setActiveMedia(null);
        }
      }
    } catch {
      // Silent error handling
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedMedia = downloads
    .filter((media) => {
      const titleMatch = (media.title || '')
        .toLowerCase()
        .includes(search.toLowerCase());
      const urlMatch = media.url.toLowerCase().includes(search.toLowerCase());
      const typeMatch =
        filterType === 'all' ||
        (filterType === 'video' && media.format === 'mp4') ||
        (filterType === 'audio' && media.format === 'mp3');

      return (titleMatch || urlMatch) && typeMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'size-desc') {
        return parseSizeToBytes(b.fileSize) - parseSizeToBytes(a.fileSize);
      }
      if (sortBy === 'size-asc') {
        return parseSizeToBytes(a.fileSize) - parseSizeToBytes(b.fileSize);
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

  return (
    <div className="px-6 py-8 max-w-[1200px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Library</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage, search, and view your downloaded media files
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

      {/* Control Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border rounded-xl pl-10 pr-4 h-10 text-xs text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all duration-200"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Format Filter Tabs */}
          <div className="flex rounded-xl p-0.5 bg-bg-surface border border-border">
            {(['all', 'video', 'audio'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-accent/10 text-accent border border-accent/15'
                    : 'text-text-secondary hover:text-text-primary border border-transparent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-bg-surface border border-border rounded-xl pl-4 pr-10 h-10 text-xs font-semibold text-text-primary hover:bg-bg-hover cursor-pointer transition-all duration-200 focus:outline-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading your library...</p>
        </div>
      ) : filteredAndSortedMedia.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <FolderOpen className="w-8 h-8 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-primary font-medium">No media found</p>
          <p className="text-xs text-text-muted mt-1">
            {search || filterType !== 'all'
              ? 'Try modifying your search or filter options'
              : 'Downloaded videos and audio files will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedMedia.map((media) => {
            const isVideo = media.format === 'mp4';
            const thumbnailUrl = media.thumbnailUrl || (isVideo ? getYouTubeThumbnail(media.url) : null);
            return (
              <div
                key={media.id}
                onClick={() => setActiveMedia(media)}
                className="group relative flex flex-col bg-bg-surface border border-border hover:border-border-hover rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:shadow-accent-glow/5 transition-all duration-300"
              >
                {/* Media Preview/Icon area */}
                <div className="relative aspect-video rounded-xl bg-bg-deep/80 border border-border flex items-center justify-center overflow-hidden mb-3.5">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={media.title || 'Thumbnail'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : isVideo ? (
                    <Film className="w-8 h-8 text-text-muted group-hover:text-accent transition-colors duration-300" />
                  ) : (
                    <Music className="w-8 h-8 text-text-muted group-hover:text-accent transition-colors duration-300" />
                  )}

                  {/* Badge */}
                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                      isVideo
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {media.format}
                  </span>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300">
                      <Play className="w-4 h-4 text-accent fill-accent/10 ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Media Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3
                    className="text-xs font-semibold text-text-primary line-clamp-2 leading-relaxed"
                    title={media.title || media.url}
                  >
                    {media.title || media.url}
                  </h3>

                  {/* Meta Footer */}
                  <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-text-secondary font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      {formatDate(media.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <HardDrive className="w-3 h-3 text-text-muted" />
                      {media.fileSize || '--'}
                    </span>
                  </div>
                </div>

                {/* Inline Action Bar (top level controls) */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <a
                    href={media.filePath!}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 rounded-lg bg-bg-surface/90 border border-border flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/10 transition-all cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => deleteRecord(media.id, e)}
                    className="w-7 h-7 rounded-lg bg-bg-surface/90 border border-border flex items-center justify-center text-text-secondary hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                    title="Delete media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Player Modal */}
      {activeMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-3xl bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl z-10">
            {/* Modal Header */}
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

            {/* Modal Body: Player */}
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
                  {/* Audio visual decoration / album cover */}
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

            {/* Modal Footer */}
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
