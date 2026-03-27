'use client';

import React from 'react';

interface ThreeDPreviewProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
}

export default function ThreeDPreview({
  src,
  poster,
  alt = 'A 3D model',
  className = '',
  autoRotate = true,
  cameraControls = true,
}: ThreeDPreviewProps) {
  const ModelViewer = 'model-viewer' as any;

  const [cacheBuster] = React.useState(() => Date.now());
  const finalSrc = src.includes('?') ? `${src}&t=${cacheBuster}` : `${src}?t=${cacheBuster}`;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/5 ${className}`}>
      <ModelViewer
        src={finalSrc}
        poster={poster}
        alt={alt}
        auto-rotate={autoRotate ? 'true' : undefined}
        camera-controls={cameraControls ? 'true' : undefined}
        shadow-intensity="1"
        loading="lazy"
        reveal="auto"
        touch-action="pan-y"
        style={{ width: '100%', height: '100%', '--poster-color': 'transparent' } as any}
        className="w-full h-full"
      >
        {/* Loading slot */}
        <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gray-900/40 animate-pulse">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Loading 3D Model...</div>
        </div>
      </ModelViewer>
      
      {/* 3D Badge Overlay */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-indigo-600/80 backdrop-blur-md rounded-lg border border-white/20">
      </div>
    </div>
  );
}
