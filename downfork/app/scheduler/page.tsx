'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Link as LinkIcon,
  ClipboardPaste,
  Plus,
  Trash2,
  Play,
  Pause,
  Clock,
  ArrowLeft,
  Loader2,
  Music,
  Film,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleRecord {
  id: string;
  url: string;
  format: string;
  time: string;
  frequency: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
  lastTriggeredAt: string | null;
}

function timeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';
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

export default function SchedulerPage() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [time, setTime] = useState('12:00');
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        setSchedules(await res.json());
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // clipboard access denied
    }
  };

  const submit = async () => {
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, frequency, time }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ ok: true, text: 'Schedule created successfully.' });
        setUrl('');
        fetchSchedules();
      } else {
        setFeedback({ ok: false, text: data.error || 'Failed to create schedule.' });
      }
    } catch {
      setFeedback({ ok: false, text: 'Connection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'PAUSED') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
      }
    } catch {
      // silent
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="px-6 py-8 max-w-[900px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">Task Scheduler</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Automate recurring media downloads and updates
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creation Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <CalendarClock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">New Schedule</h3>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Target URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="url"
                    required
                    placeholder="Video or playlist URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-bg-surface border border-border rounded-xl pl-10 pr-4 h-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={paste}
                  className="flex items-center justify-center p-3 rounded-xl bg-bg-surface border border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all duration-200 cursor-pointer shrink-0"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('mp3')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    format === 'mp3'
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  Audio (MP3)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('mp4')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    format === 'mp4'
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Video (MP4)
                </button>
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Frequency</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['hourly', 'daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-2 rounded-xl border text-[11px] font-semibold capitalize transition-all duration-200 cursor-pointer ${
                      frequency === freq
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {frequency === 'hourly' ? 'Minute Of The Hour' : 'Trigger Time'}
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type={frequency === 'hourly' ? 'number' : 'time'}
                  min={frequency === 'hourly' ? 0 : undefined}
                  max={frequency === 'hourly' ? 59 : undefined}
                  value={frequency === 'hourly' ? (time.includes(':') ? time.split(':')[1] : time) : time}
                  onChange={(e) => {
                    if (frequency === 'hourly') {
                      const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                      setTime(`00:${val.toString().padStart(2, '0')}`);
                    } else {
                      setTime(e.target.value);
                    }
                  }}
                  className="w-full bg-bg-surface border border-border rounded-xl pl-10 pr-4 h-11 text-sm text-text-primary focus:outline-none input-glow transition-all duration-200"
                />
              </div>
              <p className="text-[10px] text-text-muted">
                {frequency === 'hourly' && 'Runs once every hour at the specified minute.'}
                {frequency === 'daily' && 'Runs once every day at the specified time.'}
                {frequency === 'weekly' && 'Runs once every week on this day at the specified time.'}
              </p>
            </div>

            {/* Feedback and Submit */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              {feedback && (
                <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                  feedback.ok ? 'bg-success/5 border-success/20 text-success' : 'bg-error/5 border-error/20 text-error'
                }`}>
                  {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{feedback.text}</span>
                </div>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !url.trim()}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-bg-deep text-xs font-bold hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent-glow/10"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>

        {/* Schedules List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-2xl p-6 h-full space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-sm font-semibold text-text-primary">Active Schedules</h3>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {schedules.length} configured
              </span>
            </div>

            {schedules.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border flex items-center justify-center text-text-muted">
                  <CalendarClock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">No schedules created yet</p>
                  <p className="text-[11px] text-text-muted max-w-[250px]">
                    Use the form on the left to set up automatic downloads.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
                {schedules.map((schedule) => {
                  const isHourly = schedule.frequency === 'hourly';
                  const displayTime = isHourly
                    ? `minute :${schedule.time.split(':')[1]}`
                    : schedule.time;

                  return (
                    <div
                      key={schedule.id}
                      className="bg-bg-surface/50 border border-border/50 hover:border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            schedule.status === 'ACTIVE'
                              ? 'bg-success/15 text-success border border-success/20'
                              : 'bg-bg-elevated text-text-muted border border-border'
                          }`}>
                            {schedule.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary bg-bg-elevated/60 px-2 py-0.5 rounded-md border border-border">
                            {schedule.format === 'mp3' ? <Music className="w-3 h-3 text-accent" /> : <Film className="w-3 h-3 text-accent" />}
                            {schedule.format.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Every {schedule.frequency} at {displayTime}
                          </span>
                        </div>
                        <p
                          className="text-xs font-medium text-text-primary truncate"
                          title={schedule.url}
                        >
                          {schedule.url}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-text-muted">
                          <span>
                            Created: {new Date(schedule.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Last run: {timeAgo(schedule.lastTriggeredAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => toggleStatus(schedule.id, schedule.status)}
                          className={`flex items-center justify-center p-2 rounded-xl border transition-colors cursor-pointer ${
                            schedule.status === 'ACTIVE'
                              ? 'bg-amber/10 border-amber/20 text-amber hover:bg-amber/20'
                              : 'bg-success/10 border-success/20 text-success hover:bg-success/20'
                          }`}
                          title={schedule.status === 'ACTIVE' ? 'Pause schedule' : 'Activate schedule'}
                        >
                          {schedule.status === 'ACTIVE' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="flex items-center justify-center p-2 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors cursor-pointer"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
