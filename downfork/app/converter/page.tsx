'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Music,
  Film,
  Sparkles,
  Loader2,
  CheckCircle2,
  Download,
  FolderOpen,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ConversionResult {
  success: boolean;
  filePath: string;
  title: string;
  fileSize: string;
  id: string;
}

type TargetFormat = 'mp3' | 'mp4' | 'webm' | 'wav' | 'gif';

function ConverterContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<TargetFormat>('mp3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Auto-select format based on URL search query parameters
  useEffect(() => {
    if (mode === 'audio') {
      setFormat('mp3');
    } else if (mode === 'gif') {
      setFormat('gif');
    } else if (mode === 'format') {
      setFormat('mp4');
    }
  }, [mode]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const startConversion = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Conversion failed. Please try again.');
      }
    } catch {
      setError('Connection error. Failed to reach the converter API.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const formats: { id: TargetFormat; label: string; desc: string; icon: any }[] = [
    {
      id: 'mp3',
      label: 'MP3 Audio',
      desc: 'High-quality compressed audio (libmp3lame)',
      icon: Music,
    },
    {
      id: 'mp4',
      label: 'MP4 Video',
      desc: 'Standard H.264 video with AAC audio (compatible)',
      icon: Film,
    },
    {
      id: 'webm',
      label: 'WebM Video',
      desc: 'Open VP9 video with Opus audio (web-friendly)',
      icon: Film,
    },
    {
      id: 'wav',
      label: 'WAV Audio',
      desc: 'Uncompressed CD-quality lossless audio',
      icon: Music,
    },
    {
      id: 'gif',
      label: 'GIF Image',
      desc: 'Convert short videos to animated GIF files',
      icon: Sparkles,
    },
  ];

  return (
    <div className="px-6 py-8 max-w-[800px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">File Converter</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Convert video, audio, and image formats using system FFmpeg
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

      {/* Main container */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {loading ? (
          /* Loading State */
          <div className="py-16 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <Loader2 className="w-6 h-6 text-accent animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">Converting file...</p>
              <p className="text-xs text-text-muted">
                Running FFmpeg pipeline. Please do not close this tab.
              </p>
            </div>
          </div>
        ) : result ? (
          /* Success Result State */
          <div className="py-6 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-sm font-semibold text-text-primary">Conversion Completed!</p>
              <p className="text-xs text-text-secondary truncate font-medium bg-bg-deep/40 px-3 py-2 rounded-xl border border-border" title={result.title}>
                {result.title}
              </p>
              <p className="text-[10px] text-text-muted font-mono">{result.fileSize}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
              <a
                href={result.filePath}
                download
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
              <Link
                href="/downloader/library"
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-bg-surface border border-border text-xs font-medium text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                Open Library
              </Link>
            </div>

            <button
              onClick={reset}
              className="text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Convert another file
            </button>
          </div>
        ) : (
          /* Selection & Upload State */
          <div className="space-y-6">
            {/* File Selector Zone */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Select File
              </label>

              {file ? (
                /* Selected File Badge */
                <div className="flex items-center justify-between p-4 bg-bg-surface border border-border rounded-xl">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-error hover:text-error/80 px-2.5 py-1.5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                /* Drag & Drop File Input */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    dragActive
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border-hover hover:bg-bg-surface/30'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  <p className="text-xs font-semibold text-text-primary">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    Supports MP4, MKV, AVI, MP3, WAV, M4A, etc.
                  </p>
                </div>
              )}
            </div>

            {/* Target Format Selector */}
            {file && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Convert to Format
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {formats.map((fmt) => {
                    const FmtIcon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setFormat(fmt.id)}
                        className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          format === fmt.id
                            ? 'bg-accent/10 border-accent/30 text-accent'
                            : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          format === fmt.id ? 'bg-accent/15' : 'bg-bg-elevated'
                        }`}>
                          <FmtIcon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{fmt.label}</div>
                          <div className="text-[10px] text-text-muted line-clamp-1 leading-normal mt-0.5">
                            {fmt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex flex-col gap-3">
                  {error && (
                    <div className="flex items-center gap-2 text-xs font-medium text-error p-3 rounded-xl bg-error/5 border border-error/15">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={startConversion}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-all cursor-pointer shadow-lg shadow-accent-glow/10"
                  >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                    Convert File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConverterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm text-text-muted">Loading converter...</p>
        </div>
      }
    >
      <ConverterContent />
    </Suspense>
  );
}
