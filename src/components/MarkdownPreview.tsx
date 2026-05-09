'use client';

import React, { useEffect, useState } from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  src: string;
  className?: string;
}

export default function MarkdownPreview({ src, className = '' }: MarkdownPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(src);
        if (!response.ok) throw new Error('Failed to fetch markdown content');
        const text = await response.text();
        if (isMounted) {
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        console.error('Markdown Preview Error:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className={`relative w-full h-full min-h-[400px] flex flex-col bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 animate-pulse z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Rendering Document...</div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center gap-6 p-12 h-full">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 shadow-2xl shadow-rose-900/20">
            <DocumentIcon className="h-10 w-10 text-rose-500" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 text-center">Preview Unavailable</div>
        </div>
      ) : (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-gray-800/50 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      
      {/* Decorative glass overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
}
