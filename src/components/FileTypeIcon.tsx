'use client';

import React from 'react';

interface FileTypeIconProps {
  mimeType: string;
  filename: string;
  className?: string;
}

export default function FileTypeIcon({ mimeType, filename, className = '' }: FileTypeIconProps) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const getIconConfig = () => {
    // Adobe Suite
    if (ext === 'indd' || mimeType === 'application/x-indesign' || mimeType === 'application/indesign') {
      return {
        bg: 'from-[#FF3366] to-[#D0021B]',
        text: 'Id',
        label: 'INDD',
        color: 'text-white'
      };
    }
    if (ext === 'ai' || mimeType === 'application/postscript') {
      return {
        bg: 'from-[#FF9A00] to-[#FF7A00]',
        text: 'Ai',
        label: 'AI',
        color: 'text-[#330000]'
      };
    }
    if (ext === 'psd' || mimeType === 'image/vnd.adobe.photoshop' || mimeType === 'image/x-photoshop') {
      return {
        bg: 'from-[#00C8FF] to-[#001E36]',
        text: 'Ps',
        label: 'PSD',
        color: 'text-[#001E36]'
      };
    }
    
    // Microsoft Office
    if (ext === 'pptx' || ext === 'ppt' || mimeType.includes('presentationml')) {
      return {
        bg: 'from-[#D24726] to-[#A92A0E]',
        text: 'P',
        label: 'PPTX',
        color: 'text-white'
      };
    }
    if (ext === 'docx' || ext === 'doc' || mimeType.includes('wordprocessingml')) {
      return {
        bg: 'from-[#2B579A] to-[#1E3A5F]',
        text: 'W',
        label: 'DOCX',
        color: 'text-white'
      };
    }
    if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheetml')) {
      return {
        bg: 'from-[#217346] to-[#154B2E]',
        text: 'X',
        label: 'XLSX',
        color: 'text-white'
      };
    }

    // Others
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return {
        bg: 'from-[#FF0000] to-[#CC0000]',
        text: 'PDF',
        label: 'PDF',
        color: 'text-white'
      };
    }
    if (ext === 'zip' || ext === 'rar' || ext === '7z' || mimeType.includes('zip') || mimeType.includes('compressed')) {
      return {
        bg: 'from-[#F1C40F] to-[#D4AC0D]',
        text: 'ZIP',
        label: 'ARCHIVE',
        color: 'text-white'
      };
    }
    if (mimeType.startsWith('video/')) {
      return {
        bg: 'from-[#9B59B6] to-[#8E44AD]',
        text: '▶',
        label: 'VIDEO',
        color: 'text-white'
      };
    }
    if (mimeType.startsWith('audio/')) {
      return {
        bg: 'from-[#3498DB] to-[#2980B9]',
        text: '♫',
        label: 'AUDIO',
        color: 'text-white'
      };
    }

    // Default
    return {
      bg: 'from-gray-400 to-gray-600',
      text: '?',
      label: ext.toUpperCase() || 'FILE',
      color: 'text-white'
    };
  };

  const config = getIconConfig();

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full bg-gray-50/50 dark:bg-gray-950/20 ${className}`}>
      <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${config.bg} shadow-2xl flex flex-col items-center justify-center overflow-hidden border border-white/20 transform group-hover:scale-105 transition-transform duration-500`}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Folded Corner Effect */}
        <div className="absolute top-0 right-0 w-8 h-8">
           <div className="absolute top-0 right-0 w-full h-full bg-black/10" />
           <div className="absolute top-0 right-0 border-[16px] border-transparent border-t-white/20 border-r-white/20 rounded-bl-xl" />
        </div>

        <span className={`text-4xl sm:text-5xl font-black ${config.color} tracking-tighter drop-shadow-xl z-10`}>
          {config.text}
        </span>
        
        <div className="absolute bottom-4 w-full text-center z-10">
          <span className={`text-[10px] sm:text-[11px] font-black ${config.color} opacity-80 uppercase tracking-[0.2em]`}>
            {config.label}
          </span>
        </div>

        {/* Glossy overlay */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
