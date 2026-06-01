'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Download,
  Clock,
  FolderOpen,
  CalendarClock,
  ArrowRightLeft,
  Network,
  Settings,
  TerminalSquare,
  Plus,
  ChevronDown,
  Music,
  Sparkles,
  Search,
  X,
} from 'lucide-react';

interface NavSubItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: any;
  disabled?: boolean;
  keywords?: string[];
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  keywords: string[];
  subItems: NavSubItem[];
}

const bottomNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Terminal', icon: TerminalSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Track accordion states
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    downloader: true,
    converter: false,
    scheduler: false,
    batch: false,
  });

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: NavSection[] = [
    {
      id: 'downloader',
      label: 'YouTube Downloader',
      icon: Download,
      keywords: ['download', 'youtube', 'video', 'audio', 'mp3', 'mp4', 'extraction', 'save', 'grab', 'link', 'url', 'playlist'],
      subItems: [
        {
          label: 'New Download',
          href: '/downloader/new',
          icon: Plus,
          keywords: ['new', 'start', 'paste', 'url', 'add'],
        },
        {
          label: 'Library',
          href: '/downloader/library',
          icon: FolderOpen,
          keywords: ['library', 'files', 'saved', 'downloaded', 'stored', 'local'],
        },
        {
          label: 'All Downloads',
          href: '/downloader/history',
          icon: Clock,
          keywords: ['history', 'all', 'logs', 'past', 'finished'],
        },
      ],
    },
    {
      id: 'converter',
      label: 'File Converter',
      icon: ArrowRightLeft,
      keywords: ['convert', 'file', 'format', 'mp3', 'mp4', 'webm', 'wav', 'gif', 'audio', 'video', 'resize', 'change', 'transform', 'encoder'],
      subItems: [
        { label: 'Format Converter', href: '/converter?mode=format', icon: ArrowRightLeft, keywords: ['format', 'convert', 'file', 'video', 'audio'] },
        { label: 'Extract Audio (MP3)', href: '/converter?mode=audio', icon: Music, keywords: ['extract', 'audio', 'mp3', 'music', 'sound'] },
        { label: 'Create GIF', href: '/converter?mode=gif', icon: Sparkles, keywords: ['gif', 'image', 'create', 'make', 'loop'] },
      ],
    },
    {
      id: 'scheduler',
      label: 'Scheduler',
      icon: CalendarClock,
      keywords: ['schedule', 'cron', 'timer', 'automatic', 'recurring', 'daily', 'weekly', 'hourly', 'background', 'automatic download', 'later', 'time'],
      subItems: [
        { label: 'Active Tasks', href: '/scheduler', icon: CalendarClock, keywords: ['active', 'tasks', 'list', 'schedules', 'jobs'] },
        { label: 'New Schedule', href: '/scheduler', icon: Plus, keywords: ['new', 'create', 'add', 'schedule', 'recurring'] },
      ],
    },
    {
      id: 'batch',
      label: 'Batch URLs',
      icon: Network,
      keywords: ['batch', 'bulk', 'multiple', 'text', 'file', 'url', 'list', 'links', 'extract', 'scrape', 'parallel'],
      subItems: [
        { label: 'Batch Downloader', href: '/batch?tab=downloader', icon: Download, keywords: ['downloader', 'bulk', 'multiple', 'urls', 'download'] },
        { label: 'URL Extractor', href: '/batch?tab=extractor', icon: Network, keywords: ['extractor', 'scrape', 'find', 'page', 'grab'] },
      ],
    },
  ];

  // Perform search filtering
  const query = searchQuery.toLowerCase().trim();
  const filteredSections = sections
    .map((section) => {
      if (!query) return section;

      const sectionMatches =
        section.label.toLowerCase().includes(query) ||
        section.keywords.some((kw) => kw.toLowerCase().includes(query));

      const matchingSubItems = section.subItems.filter(
        (subItem) =>
          sectionMatches ||
          subItem.label.toLowerCase().includes(query) ||
          (subItem.keywords && subItem.keywords.some((kw) => kw.toLowerCase().includes(query)))
      );

      if (matchingSubItems.length > 0) {
        return {
          ...section,
          subItems: matchingSubItems,
        };
      }
      return null;
    })
    .filter(Boolean) as NavSection[];

  return (
    <nav className="hidden lg:flex flex-col w-[240px] h-screen shrink-0 bg-bg-surface border-r border-border">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 px-5 h-16 border-b border-border hover:bg-bg-hover/30 transition-colors duration-200 cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Download className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text-primary tracking-tight">DownFork</h1>
          <p className="text-[10px] text-text-muted font-medium">v0.0.3</p>
        </div>
      </Link>

      {/* Search Bar */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search tools or intent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-deep border border-border rounded-xl pl-9 pr-8 h-9 text-xs text-text-primary placeholder:text-text-muted focus:outline-none input-glow transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accordion Navigation */}
      <div className="flex-1 px-3 pt-4 flex flex-col gap-2 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Tools
          </span>
        </div>

        {filteredSections.map((section) => {
          const SectionIcon = section.icon;
          const isCurrentSectionActive = section.subItems.some(
            (sub) => sub.href && (pathname === sub.href.split('?')[0] || pathname.startsWith(sub.href.split('?')[0] + '/'))
          );
          const isExpanded = query ? true : expanded[section.id];

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer text-left ${
                  isCurrentSectionActive
                    ? 'text-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SectionIcon className="w-4 h-4 shrink-0 text-text-muted" />
                  <span>{section.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-accent' : ''
                  }`}
                />
              </button>

              {/* Sub-items (collapsible tree view) */}
              {isExpanded && (
                <div className="pl-4 pr-1 mt-0.5 flex flex-col gap-0.5 border-l border-border ml-5">
                  {section.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = subItem.href && pathname === subItem.href.split('?')[0];

                    if (subItem.disabled) {
                      return (
                        <div
                          key={subItem.label}
                          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-disabled cursor-not-allowed select-none"
                        >
                          {subItem.label}
                        </div>
                      );
                    }

                    if (subItem.onClick) {
                      return (
                        <button
                          key={subItem.label}
                          onClick={subItem.onClick}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer text-left border border-transparent"
                        >
                          {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0 text-text-muted" />}
                          {subItem.label}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={subItem.label}
                        href={subItem.href!}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                        }`}
                      >
                        {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-border pt-3">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-text-disabled cursor-not-allowed border border-transparent"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

