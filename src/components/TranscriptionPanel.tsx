'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  ClockIcon, 
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { apiDownload } from '@/lib/api';
import { toast } from 'sonner';
import { useWorkspace } from '@/context/WorkspaceContext';

interface Word {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

interface Segment {
  start_ms: number;
  end_ms: number;
  text: string;
  words?: Word[];
}

interface Transcript {
  id: string;
  transcript_text: string;
  segments: Segment[];
  language_code: string;
}

interface TranscriptionPanelProps {
  transcript: Transcript | null;
  currentTime: number;
  onSeek: (time: number) => void;
  loading?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  canGenerate?: boolean;
  quotaExceeded?: boolean;
  planRestricted?: boolean;
  isProcessing?: boolean;
  assetId?: string;
}

export default function TranscriptionPanel({ 
  transcript, 
  currentTime, 
  onSeek,
  loading = false,
  onGenerate,
  isGenerating = false,
  canGenerate = true,
  quotaExceeded = false,
  planRestricted = false,
  isProcessing = false,
  assetId,
}: TranscriptionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const { activeWorkspace } = useWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Filter segments based on search
  const matches = useMemo(() => {
    if (!searchQuery.trim() || !transcript) return [];
    const query = searchQuery.toLowerCase();
    return transcript.segments.reduce((acc: number[], segment, index) => {
      if (segment.text.toLowerCase().includes(query)) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [searchQuery, transcript]);

  // Handle search navigation
  useEffect(() => {
    if (matches.length > 0) {
      setActiveMatchIndex(0);
    } else {
      setActiveMatchIndex(-1);
    }
  }, [matches]);

  // Auto-scroll to current segment
  const currentSegmentIndex = useMemo(() => {
    if (!transcript) return -1;
    return transcript.segments.findIndex(
      s => currentTime >= s.start_ms / 1000 && currentTime <= s.end_ms / 1000
    );
  }, [transcript, currentTime]);

  useEffect(() => {
    if (currentSegmentIndex !== -1 && scrollContainerRef.current) {
      const activeElement = segmentRefs.current[currentSegmentIndex];
      if (activeElement && searchQuery === '') { // Only auto-scroll if not searching
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentSegmentIndex, searchQuery]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === undefined) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'srt' | 'vtt' | 'txt') => {
    if (!activeWorkspace || !assetId) return;
    try {
      setIsExportOpen(false);
      toast.loading(`Preparing ${format.toUpperCase()} download...`, { id: 'transcription-download' });
      
      const blob = await apiDownload(`/transcription/assets/${assetId}/${format}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${assetId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss('transcription-download');
      toast.success('Download started');
    } catch (error: any) {
      toast.dismiss('transcription-download');
      toast.error(error.message || 'Failed to download transcript');
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIndex = (activeMatchIndex + 1) % matches.length;
    setActiveMatchIndex(nextIndex);
    const segmentIndex = matches[nextIndex];
    segmentRefs.current[segmentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIndex = (activeMatchIndex - 1 + matches.length) % matches.length;
    setActiveMatchIndex(prevIndex);
    const segmentIndex = matches[prevIndex];
    segmentRefs.current[segmentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Transcript...</p>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px] bg-gray-50/20 dark:bg-gray-900/10">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-full mb-4">
          <ClockIcon className="h-10 w-10 text-gray-300 dark:text-gray-700" />
        </div>
        
        {isProcessing ? (
          <>
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Transcription In Progress</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px]">
              We are currently generating the transcript. Please check back in a few minutes.
            </p>
          </>
        ) : planRestricted ? (
          <>
            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2">Plan Restricted</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mb-8">
              Transcription is not available on your current plan. Upgrade to Silver or Gold to unlock this feature.
            </p>
          </>
        ) : quotaExceeded ? (
          <>
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Quota Exceeded</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mb-8">
              You have exhausted your monthly transcription limit. Quota resets on the 1st of next month.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">No Transcript Available</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mb-8">This asset has not been transcribed yet.</p>
            
            {onGenerate && canGenerate && (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    Generate Transcript
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Search Header */}
      <div className="flex items-center gap-2 mb-6">
        {transcript && (
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 px-3 py-3.5 bg-gray-50/50 dark:bg-[#0a0b10] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl transition-all text-xs font-semibold border-2 border-transparent focus:border-blue-500/30 dark:focus:border-blue-500/20"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-[#0f111a] shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1.5">
                  <button
                    onClick={() => handleDownload('srt')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                  >
                    <span className="w-8 text-[10px] font-bold text-blue-500 bg-blue-500/10 py-0.5 rounded text-center">SRT</span>
                    <span>SubRip Subtitle</span>
                  </button>
                  <button
                    onClick={() => handleDownload('vtt')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                  >
                    <span className="w-8 text-[10px] font-bold text-purple-500 bg-purple-500/10 py-0.5 rounded text-center">VTT</span>
                    <span>WebVTT Subtitle</span>
                  </button>
                  <button
                    onClick={() => handleDownload('txt')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left"
                  >
                    <span className="w-8 text-[10px] font-bold text-gray-500 bg-gray-500/10 py-0.5 rounded text-center">TXT</span>
                    <span>Plain Text</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search in transcript..."
            className="w-full pl-11 pr-24 py-3.5 bg-gray-50/50 dark:bg-[#0a0b10] border-2 border-transparent focus:border-blue-500/30 dark:focus:border-blue-500/20 rounded-2xl text-sm font-medium outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400">
                  {matches.length > 0 ? activeMatchIndex + 1 : 0}/{matches.length}
                </span>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-2" />
                <button 
                  onClick={handlePrevMatch}
                  className="p-1 hover:text-blue-500 transition-colors border-none"
                >
                  <ChevronLeftIcon className="h-3 w-3" />
                </button>
                <button 
                  onClick={handleNextMatch}
                  className="p-1 hover:text-blue-500 transition-colors border-none"
                >
                  <ChevronRightIcon className="h-3 w-3" />
                </button>
              </div>
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2"
      >
        {transcript.segments.map((segment, index) => {
          const isActive = index === currentSegmentIndex;
          const isMatch = matches.includes(index);
          const isActiveMatch = matches[activeMatchIndex] === index;

          return (
            <div
              key={index}
              ref={el => { segmentRefs.current[index] = el; }}
              onClick={() => onSeek(segment.start_ms / 1000)}
              className={`group relative p-4 rounded-2xl transition-all cursor-pointer border border-transparent ${
                isActive 
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' 
                  : isMatch 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-gray-700 dark:text-gray-200'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
              } ${isActiveMatch ? 'ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-[#0a0b10]' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 ${
                  isActive ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <ClockIcon className="h-3 w-3" />
                  {formatTime(segment.start_ms / 1000)}
                </div>
                <p className={`text-sm leading-relaxed ${isActive ? 'font-medium' : ''}`}>
                  {segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                    part.toLowerCase() === searchQuery.toLowerCase() && searchQuery !== '' ? (
                      <mark key={i} className={`bg-yellow-300 dark:bg-yellow-600 rounded-sm px-0.5 text-black animate-pulse`}>
                        {part}
                      </mark>
                    ) : part
                  ))}
                </p>
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-all ${
                  isActive ? 'bg-white' : 'bg-transparent group-hover:bg-blue-500/30'
                }`} />
              </div>
              
              <button 
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}
              >
                <PlayIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
