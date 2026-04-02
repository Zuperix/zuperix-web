'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { DocumentIcon } from '@heroicons/react/24/outline';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  src: string;
  assetId?: string;
  alt?: string;
  className?: string;
}

export default function PdfPreview({ src, assetId, alt, className = '' }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let loadingTask: any = null;

    async function renderPreview() {
      try {
        setLoading(true);
        setError(false);

        loadingTask = pdfjs.getDocument({
          url: src,
          withCredentials: false, // Signed URLs don't need credentials AND it avoids some CORS preflights
          disableRange: true,     // Optional: partial range requests often trigger complex CORS/SignedURL issues
        });

        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 }); // Slightly higher scale for better sharpness

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        if (isMounted) {
          setLoading(false);
        }
      } catch (err: any) {
        // Silently handle "Worker was destroyed" which happens on component unmount/fast refresh
        if (err?.message?.includes('Worker was destroyed')) {
          return;
        }

        console.error('PDF Preview Error:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderPreview();

    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [src]);


  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/5 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 animate-pulse z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Processing PDF...</div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <DocumentIcon className="h-8 w-8 text-red-500" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 text-center">Preview Failed</div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

    </div>
  );
}
