'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Activity,
  HardDrive,
  Download,
  Clock,
  FolderOpen,
} from 'lucide-react';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [usedStorage, setUsedStorage] = useState<string>('Loading...');

  const fetchStorage = useCallback(async () => {
    try {
      const res = await fetch('/api/storage');
      if (res.ok) {
        const data = await res.json();
        setUsedStorage(data.used);
      }
    } catch {
      setUsedStorage('-- MB');
    }
  }, []);

  useEffect(() => {
    fetchStorage();
    // Refresh storage size every 8 seconds
    const id = setInterval(fetchStorage, 8000);
    return () => clearInterval(id);
  }, [fetchStorage]);

  return (
    <>
      <header className="flex justify-between items-center w-full px-6 h-14 sticky top-0 z-50 bg-bg-deep/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-hover cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">DownFork</h2>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-semibold text-success">Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-text-muted bg-bg-surface px-3 py-1.5 rounded-lg border border-border">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{usedStorage} used</span>
          </div>
          <button className="text-text-muted hover:text-text-secondary transition-colors p-1.5 rounded-lg hover:bg-bg-hover cursor-pointer" title="System status">
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-[80vw] bg-bg-surface border-r border-border h-full">
            <div className="flex items-center justify-between px-5 h-14 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm font-semibold text-text-primary">DownFork</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  pathname === '/'
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <Download className="w-4 h-4" />
                Downloads
              </Link>
              <Link
                href="/downloader/history"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  pathname === '/downloader/history'
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <Clock className="w-4 h-4" />
                History
              </Link>
              <Link
                href="/downloader/library"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  pathname === '/downloader/library'
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Library
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
