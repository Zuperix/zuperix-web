'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { DocumentIcon } from '@heroicons/react/24/outline';

// Set up worker
// Using jsDelivr for the worker as Cloudflare had 404 issues with version 5
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function PdfPreview({ src, alt, className = '' }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function renderPreview() {
      try {
        setLoading(true);
        setError(false);

        // Fetch the PDF
        const loadingTask = pdfjs.getDocument(src);
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        // Get first page
        const page = await pdf.getPage(1);
        
        // Use a reasonable scale for thumbnail
        const viewport = page.getViewport({ scale: 1.0 });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set dimensions
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
      } catch (err) {
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
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
            <DocumentIcon className="h-12 w-12 text-red-500" />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Preview Failed</span>
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
