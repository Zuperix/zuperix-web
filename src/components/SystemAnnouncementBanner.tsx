'use client';

import React from 'react';
import { useFeatureFlagJson } from '@/providers/LaunchDarklyProvider';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface SystemAnnouncement {
  active: boolean;
  title: string;
  message: string;
  type: 'maintenance' | 'outage' | 'update' | 'default';
  link?: string;
  linkText?: string;
}

export function SystemAnnouncementBanner() {
  const config = useFeatureFlagJson<SystemAnnouncement>('system-announcement', {
    active: false,
    title: '',
    message: '',
    type: 'default',
  });

  if (!config.active || !config.title || !config.message) {
    return null;
  }


  return (
    <div className="relative w-full z-[60] bg-zinc-950 border-b border-white/5 overflow-hidden group">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Scanning Light Effect */}
      <div className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-[shimmer_3s_linear_infinite]" />

      <div className="relative max-w-7xl mx-auto py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                  System
                </span>
                <span className="text-sm font-bold text-white whitespace-nowrap">
                  {config.title}
                </span>
              </div>
              <span className="hidden sm:inline text-white/20">|</span>
              <p className="text-xs font-medium text-zinc-400 truncate">
                {config.message}
              </p>
            </div>
          </div>

          {config.link && (
            <a
              href={config.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white transition-all active:scale-95"
            >
              {config.linkText || 'Details'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={clsx(
        "absolute bottom-0 left-0 h-[1px] w-full transition-all duration-1000",
        config.type === 'outage' 
          ? "bg-gradient-to-r from-transparent via-rose-500/50 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
          : "bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
      )} />
    </div>
  );
}
