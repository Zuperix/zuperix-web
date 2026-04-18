'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  EnvelopeIcon, 
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  HandRaisedIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';
import { apiDownload, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface DownloadOptionsProps {
  assetId: string;
  originalName: string;
  width: number | null;
  height: number | null;
  crop?: { x: number; y: number; width: number; height: number };
  aspectRatioType: string;
  onAspectRatioChange: (type: string) => void;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  mimeType: string;
  portalSlug?: string;
}

const ASPECT_RATIOS = [
  { label: 'None', value: 'none' },
  { label: 'Freehand', value: 'freehand' },
  { label: '1:1', value: 1 },
  { label: '2:3', value: 2/3 },
  { label: '4:3', value: 4/3 },
  { label: '16:9', value: 16/9 },
];

export default function DownloadOptions({ 
  assetId, 
  originalName, 
  width: originalWidth, 
  height: originalHeight,
  crop,
  aspectRatioType,
  onAspectRatioChange,
  onCropChange,
  mimeType,
  portalSlug,
}: DownloadOptionsProps) {

  const [isCustomizing, setIsCustomizing] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  
  // Customization state
  const [width, setWidth] = useState<number | string>(originalWidth || '');
  const [height, setHeight] = useState<number | string>(originalHeight || '');
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(90);
  const [email, setEmail] = useState('');
  const [pageRange, setPageRange] = useState('');

  const originalAspectRatio = originalWidth && originalHeight ? originalWidth / originalHeight : 1;

  // Sync width/height with crop area
  useEffect(() => {
    if (crop && originalWidth && originalHeight) {
      setWidth(Math.round((crop.width * originalWidth) / 100));
      setHeight(Math.round((crop.height * originalHeight) / 100));
    } else if (!crop) {
      setWidth(originalWidth || '');
      setHeight(originalHeight || '');
    }
  }, [crop, originalWidth, originalHeight]);

  const handleWidthChange = (val: string) => {
    setSelectedPreset(null);
    const num = parseInt(val);

    setWidth(val);
    if (!num || !originalWidth || !originalHeight) return;

    if (aspectRatioType !== 'none' && aspectRatioType !== 'freehand') {
      const ratio = typeof aspectRatioType === 'number' ? aspectRatioType : parseFloat(aspectRatioType);
      const newH = Math.round(num / ratio);
      setHeight(newH);
      
      // Update crop box to match
      const newCropWidth = (num / originalWidth) * 100;
      const newCropHeight = (newH / originalHeight) * 100;
      onCropChange({ ...crop!, width: newCropWidth, height: newCropHeight });
    } else if (aspectRatioType === 'freehand' && crop) {
      onCropChange({ ...crop, width: (num / originalWidth) * 100 });
    }
  };

  const handleHeightChange = (val: string) => {
    setSelectedPreset(null);
    const num = parseInt(val);

    setHeight(val);
    if (!num || !originalWidth || !originalHeight) return;

    if (aspectRatioType !== 'none' && aspectRatioType !== 'freehand') {
      const ratio = typeof aspectRatioType === 'number' ? aspectRatioType : parseFloat(aspectRatioType);
      const newW = Math.round(num * ratio);
      setWidth(newW);
      
      // Update crop box to match
      const newCropWidth = (newW / originalWidth) * 100;
      const newCropHeight = (num / originalHeight) * 100;
      onCropChange({ ...crop!, width: newCropWidth, height: newCropHeight });
    } else if (aspectRatioType === 'freehand' && crop) {
      onCropChange({ ...crop, height: (num / originalHeight) * 100 });
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getCropPayload = () => {
    if (!crop || !originalWidth || !originalHeight) return undefined;
    return {
      left: (crop.x * originalWidth) / 100,
      top: (crop.y * originalHeight) / 100,
      width: (crop.width * originalWidth) / 100,
      height: (crop.height * originalHeight) / 100,
    };
  };

  const handlePresetDownload = (preset: string) => {
    setIsCustomizing(true);
    setSelectedPreset(preset.toLowerCase());
    switch (preset.toLowerCase()) {
      case 'small':
        setWidth(800);
        setFormat('webp');
        setQuality(80);
        onAspectRatioChange('none');
        break;
      case 'large':
        setWidth(2400);
        setFormat('webp');
        setQuality(90);
        onAspectRatioChange('none');
        break;
      case 'transparent':
        setFormat('png');
        onAspectRatioChange('none');
        break;
      case 'high_res':
        setFormat('tiff');
        setQuality(100);
        onAspectRatioChange('none');
        break;
      default:
        break;
    }
  };


  const handleCustomDownload = async () => {
    setLoading('custom');
    try {
      const options: any = {
        format,
        quality: parseInt(quality as any),
        crop: getCropPayload(),
        pageRange: pageRange.trim() || undefined,
      };
      if (width) options.width = parseInt(width as string);
      if (height) options.height = parseInt(height as string);

      const endpoint = portalSlug 
        ? `/p/${portalSlug}/assets/${assetId}/download/custom`
        : `/assets/${assetId}/download/custom`;

      const blob = await apiDownload(endpoint, {
        method: 'POST',
        body: JSON.stringify(options),
      });

      const downloadExt = mimeType === 'application/pdf' ? 'pdf' : format;
      downloadBlob(blob, `${originalName?.split('.')[0] || 'asset'}_custom.${downloadExt}`);
      toast.success('Custom version downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    setLoading('email');
    try {
      const options: any = {
        email,
        format,
        quality: parseInt(quality as any),
        crop: getCropPayload(),
        pageRange: pageRange.trim() || undefined,
      };
      if (width) options.width = parseInt(width as string);
      if (height) options.height = parseInt(height as string);

      const endpoint = portalSlug
        ? `/p/${portalSlug}/assets/${assetId}/download/email`
        : `/assets/${assetId}/download/email`;

      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(options),
      });

      toast.success(`Asset is being sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="space-y-5">
      {/* Quick Presets - Only for images */}
      {mimeType.startsWith('image/') && (
        <div className="space-y-2.5">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.15em] uppercase px-1">Presets</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePresetDownload('small')}
            disabled={!!loading}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all group border-2 ${
              selectedPreset === 'small' 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-blue-500/30'
            }`}
          >

            <div className="h-8 w-8 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20">
              <span className="text-[10px] font-black text-blue-500">800</span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-900 dark:text-gray-100">Small</span>
              <span className="text-[9px] text-gray-400 group-hover:text-blue-500/70 transition-colors tracking-tight">WebP • Mobile</span>
            </div>
          </button>

          <button
            onClick={() => handlePresetDownload('large')}
            disabled={!!loading}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all group border-2 ${
              selectedPreset === 'large' 
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-indigo-500/30'
            }`}
          >

            <div className="h-8 w-8 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20">
              <span className="text-[10px] font-black text-indigo-500">2.4K</span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-900 dark:text-gray-100">Large</span>
              <span className="text-[9px] text-gray-400 group-hover:text-indigo-500/70 transition-colors tracking-tight">WebP • Desktop</span>
            </div>
          </button>

          <button
            onClick={() => handlePresetDownload('transparent')}
            disabled={!!loading}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all group border-2 ${
              selectedPreset === 'transparent' 
                ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-purple-500/30'
            }`}
          >

            <div className="h-8 w-8 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20">
              <span className="text-[10px] font-black text-purple-500">PNG</span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-900 dark:text-gray-100">Transparent</span>
              <span className="text-[9px] text-gray-400 group-hover:text-purple-500/70 transition-colors tracking-tight">Lossless</span>
            </div>
          </button>

          <button
            onClick={() => handlePresetDownload('high_res')}
            disabled={!!loading}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all group border-2 ${
              selectedPreset === 'high_res' 
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-emerald-500/30'
            }`}
          >

            <div className="h-8 w-8 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20">
              <span className="text-[10px] font-black text-emerald-500">HQ</span>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-bold text-gray-900 dark:text-gray-100">Archival</span>
              <span className="text-[9px] text-gray-400 group-hover:text-emerald-500/70 transition-colors tracking-tight">TIFF • Original</span>
            </div>
          </button>
        </div>
      </div>
      )}

      {/* Customize Download Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.15em] uppercase">
            {mimeType.startsWith('image/') ? 'Customize' : 'Download Options'}
          </h2>
          {mimeType.startsWith('image/') && (
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors"
            >
              {isCustomizing ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {isCustomizing && (
          <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
            {/* Format & Aspect Ratio Grid - Only for images */}
            {mimeType.startsWith('image/') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Format</label>
                    <div className="relative group">
                      <select
                        value={format}
                        onChange={(e) => {
                          setFormat(e.target.value);
                          setSelectedPreset(null);
                        }}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                      >
                        <option value="webp">WebP</option>
                        <option value="jpg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="tiff">TIFF</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none group-hover:text-gray-200 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Aspect Ratio</label>
                    <div className="relative group">
                      <select
                        value={aspectRatioType}
                        onChange={(e) => {
                          onAspectRatioChange(e.target.value);
                          setSelectedPreset(null);
                        }}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                      >
                        {ASPECT_RATIOS.map(ratio => (
                          <option key={ratio.label} value={ratio.value}>{ratio.label}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none group-hover:text-gray-200 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Output Dimensions</label>
                    {(originalWidth && width) && (
                      <span className="text-[9px] font-bold text-blue-500/80 uppercase">
                        {Math.round((parseInt(width as string) / originalWidth) * 100)}% of original
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl px-3 py-1.5 text-xs font-black outline-none placeholder:text-gray-600 focus:ring-0"
                        placeholder="W"
                      />
                    </div>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                    <div className="flex-1">
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl px-3 py-1.5 text-xs font-black outline-none placeholder:text-gray-600 focus:ring-0"
                        placeholder="H"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quality Slider - Only for images */}
            {mimeType.startsWith('image/') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Image Quality</label>
                  <span className="text-[10px] font-black text-blue-500">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => {
                    setQuality(parseInt(e.target.value));
                    setSelectedPreset(null);
                  }}
                  className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {/* PDF Page Range - Only for PDFs */}
            {mimeType === 'application/pdf' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Page Range</label>
                <div className="relative group">
                   <input
                      type="text"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      placeholder="e.g. 1, 3-5, 10 (Leave empty for all)"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-500"
                    />
                </div>
                <p className="text-[8px] text-gray-400 font-medium px-1 uppercase tracking-wider">Example: 1 for page 1, 1-10 for range, or 1, 3 for specific pages</p>
              </div>
            )}

            {/* Email Field with explicit styling */}
            <div className="space-y-2 pt-2">
               <div className="relative group">
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email to send asset..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-10 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-500"
                  />
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
               </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={handleSendEmail}
                disabled={loading === 'email'}
                className="col-span-1 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all disabled:opacity-50 group"
                title="Send via Email"
              >
                <EnvelopeIcon className={`h-5 w-5 ${loading === 'email' ? 'animate-bounce text-blue-500' : 'text-gray-400 group-hover:text-blue-500'}`} />
              </button>
              
              <button
                onClick={handleCustomDownload}
                disabled={!!loading}
                className="col-span-3 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading === 'custom' ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="h-4 w-4" />
                )}
                <span>{mimeType?.startsWith('image/') ? (crop ? 'Download Cropped' : 'Download Custom') : `Download Original ${mimeType?.split('/')[1]?.toUpperCase() || ''}`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
