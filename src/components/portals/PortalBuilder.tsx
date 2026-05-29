'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  DocumentIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  PaintBrushIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { DraggableAsset, DroppablePortalAssets } from './DndComponents';
import { apiFetch } from '@/lib/api';

interface PortalBuilderProps {
  portal: any;
  portalAssets: any[];
  onUpdate: (updates: any) => Promise<void>;
  onAddAsset: (assetId: string) => Promise<void>;
  onRemoveAsset: (assetId: string) => Promise<void>;
  activeWorkspace: any;
  onBack: () => void;
}

export default function PortalBuilder({ 
  portal, 
  portalAssets, 
  onUpdate, 
  onAddAsset, 
  onRemoveAsset,
  activeWorkspace,
  onBack
}: PortalBuilderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for live preview before saving
  const [localPortal, setLocalPortal] = useState(portal);

  useEffect(() => {
    setLocalPortal(portal);
  }, [portal]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !activeWorkspace) return;
    try {
      setSearching(true);
      const data = await apiFetch<any>(`/workspaces/${activeWorkspace.id}/search/assets?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setLocalPortal({ ...localPortal, [field]: value });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate({
        welcome_title: localPortal.welcome_title,
        description: localPortal.description,
        cta_text: localPortal.cta_text,
        cta_url: localPortal.cta_url,
        banner_image_url: localPortal.banner_image_url,
        background_color: localPortal.background_color,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] dark:bg-[#0b0d14] flex overflow-hidden">
      {/* Search Sidebar */}
      <aside 
        className={`bg-white dark:bg-[#0f111a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col z-30 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between min-w-[320px]">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Asset Library</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar min-w-[320px]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search assets..."
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="space-y-4">
            {searching ? (
              <div className="flex justify-center py-12">
                <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((asset) => (
                  <DraggableAsset 
                    key={asset.id} 
                    asset={asset} 
                    onAdd={onAddAsset} 
                    isAlreadyInPortal={portalAssets.some(pa => pa.id === asset.id)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 opacity-20 group">
                <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 group-hover:scale-110 transition-transform" />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Search to discover</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-6 top-1/2 -translate-y-1/2 z-40 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl hover:scale-110 transition-all text-blue-500"
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      )}

      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Editor Toolbar */}
        <div className="sticky top-0 z-20 px-8 py-4 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
               <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
             </button>
             <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
             <p className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">Draft: {portal.name}</p>
          </div>

          <div className="flex items-center gap-4">
             <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${isSaving ? 'opacity-100' : 'opacity-0'}`}>Saving...</span>
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
             >
                {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                Save & Publish
             </button>
          </div>
        </div>

        {/* Live Preview Content */}
        <div className="bg-[#fafafa] dark:bg-[#0b0d14] min-h-screen">
          <div className="max-w-6xl mx-auto py-12 px-6">
             {/* Editable Hero */}
             <section 
                className="relative mb-16 rounded-[48px] overflow-hidden min-h-[450px] flex flex-col justify-center px-16 py-20 shadow-2xl transition-all group/hero"
                style={{ 
                  backgroundColor: localPortal.background_color || '#2563eb',
                  backgroundImage: localPortal.banner_image_url ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${localPortal.banner_image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
             >
                {/* Floating Aesthetics Controls */}
                <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                   <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex items-center gap-2">
                      <PaintBrushIcon className="h-4 w-4 text-white" />
                      <input 
                        type="color" 
                        value={localPortal.background_color || '#2563eb'}
                        onChange={(e) => handleChange('background_color', e.target.value)}
                        className="h-6 w-6 rounded-lg bg-transparent cursor-pointer border-0 p-0"
                      />
                   </div>
                   <button className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl text-[10px] font-black text-white hover:bg-white/20 transition-all">
                      CHANGE BANNER
                   </button>
                </div>

                <div className="relative z-10 max-w-3xl space-y-10">
                   <div className="inline-flex items-center justify-center p-5 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20">
                      <PhotoIcon className="h-12 w-12 text-white" />
                   </div>

                   <div className="space-y-6">
                      <input 
                        className="w-full bg-transparent border-none text-white text-6xl md:text-8xl font-black tracking-tighter focus:outline-none placeholder:text-white/20 p-0 leading-none"
                        value={localPortal.welcome_title || ''}
                        placeholder="Page Title"
                        onChange={(e) => handleChange('welcome_title', e.target.value)}
                      />
                      <textarea 
                        className="w-full bg-transparent border-none text-white/80 text-xl font-medium focus:outline-none placeholder:text-white/20 p-0 resize-none leading-relaxed h-auto"
                        value={localPortal.description || ''}
                        placeholder="Add a compelling description for your collection..."
                        rows={2}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                   </div>

                   <div className="flex items-center gap-8">
                      <div className="relative group/cta">
                        <input 
                          className="bg-white text-black font-black uppercase tracking-[0.2em] text-sm px-10 py-5 rounded-2xl focus:outline-none min-w-[200px] text-center"
                          value={localPortal.cta_text || ''}
                          placeholder="Button Text"
                          onChange={(e) => handleChange('cta_text', e.target.value)}
                        />
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-3 py-2 rounded-lg opacity-0 group-hover/cta:opacity-100 transition-opacity whitespace-nowrap">
                          EDIT BUTTON TEXT
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-6 py-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">
                          {portalAssets.length} Available Assets
                        </span>
                      </div>
                   </div>
                </div>

                {!localPortal.banner_image_url && (
                    <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
                      <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-white rounded-full blur-[120px]" />
                      <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[100px]" />
                    </div>
                )}
             </section>

             {/* Asset Grid Editor */}
             <div className="space-y-12">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-4">
                      Asset Collection
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                   </h2>
                   <div className="flex items-center gap-4">
                      <div className="h-px w-24 bg-gray-200 dark:bg-gray-800" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DRAG FROM SIDEBAR TO ADD</span>
                   </div>
                </div>

                <DroppablePortalAssets 
                  assets={portalAssets}
                  onDrop={onAddAsset}
                  onRemove={onRemoveAsset}
                  onOpenSearch={() => setIsSidebarOpen(true)}
                />
             </div>
          </div>
        </div>
      </main>

      {/* Floating Aesthetics Panel (Aesthetics) */}
      <div className="fixed bottom-10 right-10 z-40 bg-white dark:bg-[#0f111a] p-2 rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-2xl flex items-center gap-2">
         <div className="h-10 w-10 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-[22px]">
            <PaintBrushIcon className="h-5 w-5" />
         </div>
         <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 mx-2" />
         <div className="flex items-center gap-1 group/input pr-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Banner URL</span>
            <input 
               type="text"
               placeholder="https://images.unsplash.com/..."
               className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-[11px] w-64 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
               value={localPortal.banner_image_url || ''}
               onChange={(e) => handleChange('banner_image_url', e.target.value)}
            />
         </div>
      </div>
    </div>
  );
}
