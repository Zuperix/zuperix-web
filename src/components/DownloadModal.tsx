import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect, useMemo } from 'react';
import DownloadOptions from './DownloadOptions';
import CustomImage from './CustomImage';
import { BASE_URL } from '@/lib/api';

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  originalName: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  previewUrl?: string;
  portalSlug?: string;
}

export default function DownloadModal({
  isOpen,
  onClose,
  assetId,
  originalName,
  width: propWidth,
  height: propHeight,
  mimeType,
  previewUrl,
  portalSlug,
}: DownloadModalProps) {

  const [originalWidth, setOriginalWidth] = useState<number | null>(propWidth);
  const [originalHeight, setOriginalHeight] = useState<number | null>(propHeight);
  const [crop, setCrop] = useState<Crop>({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatioType, setAspectRatioType] = useState('none');
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  useEffect(() => {
    setOriginalWidth(propWidth);
    setOriginalHeight(propHeight);
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!isOpen) {
      setAspectRatioType('none');
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [isOpen]);

  // Handle aspect ratio changes
  useEffect(() => {
    if (aspectRatioType === 'none' || aspectRatioType === 'freehand' || !originalWidth || !originalHeight) return;

    const ratio = parseFloat(aspectRatioType);
    let newWidth = 80;
    let newHeight = (80 * originalWidth) / (originalHeight * ratio);

    if (newHeight > 80) {
      newHeight = 80;
      newWidth = (80 * originalHeight * ratio) / originalWidth;
    }

    // Center it
    setCrop({
      width: newWidth,
      height: newHeight,
      x: (100 - newWidth) / 2,
      y: (100 - newHeight) / 2,
    });
  }, [aspectRatioType, originalWidth, originalHeight]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!originalWidth || !originalHeight) {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setOriginalWidth(naturalWidth);
      setOriginalHeight(naturalHeight);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - startPos.x) / rect.width) * 100;
    const dy = ((e.clientY - startPos.y) / rect.height) * 100;

    let newCrop = { ...crop };

    if (dragType === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - startPos.cropW, startPos.cropX + dx));
      newCrop.y = Math.max(0, Math.min(100 - startPos.cropH, startPos.cropY + dy));
    } else {
      // Resize logic
      if (dragType?.includes('n')) {
        const potentialH = startPos.cropH - dy;
        const actualH = Math.max(5, Math.min(startPos.cropH + startPos.cropY, potentialH));
        newCrop.y = startPos.cropY + (startPos.cropH - actualH);
        newCrop.height = actualH;
      }
      if (dragType?.includes('s')) {
        newCrop.height = Math.max(5, Math.min(100 - startPos.cropY, startPos.cropH + dy));
      }
      if (dragType?.includes('w')) {
        const potentialW = startPos.cropW - dx;
        const actualW = Math.max(5, Math.min(startPos.cropW + startPos.cropX, potentialW));
        newCrop.x = startPos.cropX + (startPos.cropW - actualW);
        newCrop.width = actualW;
      }
      if (dragType?.includes('e')) {
        newCrop.width = Math.max(5, Math.min(100 - startPos.cropX, startPos.cropW + dx));
      }

      // Aspect Ratio Lock during resize
      if (aspectRatioType !== 'none' && aspectRatioType !== 'freehand') {
        const ratio = parseFloat(aspectRatioType);
        
        // Target H% = (W% * origW) / (origH * ratio)
        newCrop.height = (newCrop.width * (originalWidth || 1)) / ((originalHeight || 1) * ratio);
        
        // Re-check constraints
        if (newCrop.y + newCrop.height > 100) {
          newCrop.height = 100 - newCrop.y;
          newCrop.width = (newCrop.height * (originalHeight || 1) * ratio) / (originalWidth || 1);
        }
      }
    }

    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const showCrop = aspectRatioType !== 'none';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#0f111a] rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[85vh] md:h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Preview & Crop Area */}
        <div className="flex-1 bg-gray-50 dark:bg-black/40 flex items-center justify-center p-6 relative min-h-[300px] border-r border-gray-100 dark:border-white/5 overflow-hidden">
          <div 
            ref={containerRef}
            className="relative max-w-full max-h-full aspect-auto flex items-center justify-center group"
          >
            {mimeType.startsWith('image/') ? (
              <>
                <CustomImage 
                  ref={imageRef}
                  src={previewUrl!} 
                  alt={originalName}
                  onLoad={onImageLoad}
                  crossOrigin="anonymous"
                  width={originalWidth || 1000}
                  height={originalHeight || 1000}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10 select-none"
                />
                
                {/* Visual Crop Overlay */}
                {showCrop && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {/* Darkened Overlays */}
                    <div className="absolute inset-0 bg-black/50" style={{ clipPath: `polygon(0% 0%, 0% 100%, ${crop.x}% 100%, ${crop.x}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, ${crop.x}% ${crop.y + crop.height}%, ${crop.x}% 100%, 100% 100%, 100% 0%)` }} />
                    
                    {/* Crop Box */}
                    <div 
                      className="absolute border-2 border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_0_20px_rgba(59,130,246,0.3)] pointer-events-auto cursor-move group-active:border-white transition-colors"
                      style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
                      onMouseDown={(e) => handleMouseDown(e, 'move')}
                    >
                      {/* Grid Lines */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                        <div className="border-r border-white/50" />
                        <div className="border-r border-white/50" />
                        <div />
                        <div className="border-b border-white/50 col-span-3" />
                        <div className="border-b border-white/50 col-span-3" />
                      </div>

                      {/* Handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize shadow-sm hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'se')} />
                    </div>
                  </div>
                )}
              </>
            ) : (
               <div className="flex flex-col items-center gap-4">
                 <div className="p-6 bg-white dark:bg-white/5 rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                   <span className="text-4xl">📄</span>
                 </div>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{mimeType}</span>
               </div>
            )}
          </div>
          
          {/* Metadata Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {originalWidth || '?' } × {originalHeight || '?'} px
              </span>
              <div className="h-2 w-px bg-white/20" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                {showCrop ? `${Math.round((originalWidth || 0) * crop.width / 100)} × ${Math.round((originalHeight || 0) * crop.height / 100)}` : 'Original'}
              </span>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/5 rounded-2xl">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                {showCrop ? 'Cropping Active' : 'Select Crop Option'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Options */}
        <div className="w-full md:w-[420px] flex flex-col bg-white dark:bg-[#0f111a] overflow-hidden">
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Download Options
              </h3>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate mt-0.5">
                {originalName}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
            <DownloadOptions 
              assetId={assetId}
              originalName={originalName}
              width={originalWidth}
              height={originalHeight}
              crop={showCrop ? crop : undefined}
              aspectRatioType={aspectRatioType}
              onAspectRatioChange={setAspectRatioType}
              onCropChange={setCrop}
              portalSlug={portalSlug}
            />

          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-white/2 border-t border-gray-100 dark:border-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
