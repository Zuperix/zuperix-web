'use client';

import React, { useRef, useState } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { XMarkIcon, Cog6ToothIcon, ChevronDownIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCollections } from '@/hooks/useCollections';
import { useCategories, Category } from '@/hooks/useCategories';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';

function flattenCategories(categories: Category[], prefix = ''): { id: string, name: string }[] {
  let items: { id: string, name: string }[] = [];
  categories.forEach(cat => {
    items.push({ id: cat.id, name: prefix + cat.name });
    if (cat.children && cat.children.length > 0) {
      items = [...items, ...flattenCategories(cat.children, prefix + cat.name + ' > ')];
    }
  });
  return items;
}

export default function ConfigPanel() {
  const { widgets, selectedWidgetId, setSelectedWidgetId, updateWidgetConfig, portalConfig, setPortalConfig, setIsConfigOpen } = useBuilderStore();
  const { collections, loading: collectionsLoading } = useCollections();
  const { categories, loading: categoriesLoading } = useCategories();
  const { activeWorkspace } = useWorkspace();
  const [uploadingState, setUploadingState] = useState<{ logo?: boolean; favicon?: boolean }>({});
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const flatCategories = React.useMemo(() => flattenCategories(categories), [categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo_url' | 'favicon_url') => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;

    setUploadingState(prev => ({ ...prev, [key === 'logo_url' ? 'logo' : 'favicon']: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', activeWorkspace.id);

      const response = await apiFetch<any>(`/assets/upload?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        body: formData,
      });

      const url = response.asset_live_url;
      const newSettings = { ...(portalConfig.settings || {}), [key]: url };
      setPortalConfig({ settings: newSettings });
    } catch (err) {
      console.error(`Failed to upload ${key}:`, err);
      alert(`Failed to upload image.`);
    } finally {
      setUploadingState(prev => ({ ...prev, [key === 'logo_url' ? 'logo' : 'favicon']: false }));
    }
  };

  const widget = widgets.find((w) => w.id === selectedWidgetId);
  
  if (!selectedWidgetId || !widget) {
    return (
      <div className="w-64 bg-[#0f111a] border-l border-gray-800/60 flex flex-col items-center justify-start p-6 pt-12 z-10 hidden lg:flex relative overflow-y-auto overflow-x-hidden transition-all duration-500 custom-scrollbar">
        <button 
          onClick={() => setIsConfigOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition-colors z-20"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>

        {/* Subtle blur decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500 rounded-full mix-blend-screen opacity-5 blur-[80px] pointer-events-none" />

        <div className="h-14 w-14 rounded-3xl bg-gray-900/80 border border-gray-800/80 shadow-2xl flex items-center justify-center mb-6 relative z-10 backdrop-blur-md flex-shrink-0">
          <Cog6ToothIcon className="h-6 w-6 text-gray-400 stroke-[1.5]" />
        </div>

        <h3 className="text-gray-200 font-semibold tracking-tight text-sm mb-2 relative z-10">Studio Ready</h3>

        <p className="text-[11px] text-gray-500 text-center leading-relaxed tracking-wide mb-10 max-w-[200px] relative z-10">
          Global settings for your portal.
        </p>

        <div className="w-full flex flex-col gap-4 relative z-10 pb-8">
          {/* Minimalistic Canvas Setup Pill */}
          <div className="w-full bg-gray-900/40 border border-gray-800/40 rounded-3xl p-5 hover:bg-gray-900/60 hover:border-gray-700/60 transition-all group backdrop-blur-md flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-blue-400 transition-colors">
              Canvas Global Color
            </span>

            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-700 shadow-md ring-2 ring-transparent group-focus-within:ring-white/20 transition-all shrink-0">
                <input
                  type="color"
                  className="absolute inset-0 w-[200%] h-[200%] -top-2 -left-2 cursor-pointer opacity-0 z-10"
                  value={portalConfig?.background_color || '#fafafa'}
                  onChange={(e) => setPortalConfig({ background_color: e.target.value })}
                />
                <div
                  className="w-full h-full pointer-events-none absolute inset-0 transition-colors"
                  style={{ backgroundColor: portalConfig?.background_color || '#fafafa' }}
                />
              </div>

              <input
                type="text"
                className="flex-1 bg-transparent border-none p-0 text-gray-300 text-xs font-mono uppercase focus:ring-0 focus:outline-none placeholder:text-gray-700 w-full"
                value={portalConfig?.background_color || '#fafafa'}
                onChange={(e) => setPortalConfig({ background_color: e.target.value })}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="w-full bg-gray-900/40 border border-gray-800/40 rounded-3xl p-5 hover:bg-gray-900/60 transition-all backdrop-blur-md flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
              Portal Favicon
            </span>
            <div className="flex items-center gap-3">
              <div 
                className="relative w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => faviconInputRef.current?.click()}
              >
                {uploadingState.favicon ? (
                  <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                ) : portalConfig?.settings?.favicon_url ? (
                  <img src={portalConfig.settings.favicon_url} alt="Favicon" className="w-full h-full object-cover" />
                ) : (
                  <PhotoIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-300 font-medium cursor-pointer hover:text-white" onClick={() => faviconInputRef.current?.click()}>
                  Upload Icon
                </span>
                <span className="text-[9px] text-gray-600">32x32 recommended</span>
              </div>
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon_url')} />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="w-full bg-gray-900/40 border border-gray-800/40 rounded-3xl p-5 hover:bg-gray-900/60 transition-all backdrop-blur-md flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
              Navigation Logo
            </span>
            <div className="flex flex-col gap-3">
              <div 
                className="relative w-full h-16 rounded-xl bg-gray-800/50 border border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                {uploadingState.logo ? (
                  <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
                ) : portalConfig?.settings?.logo_url ? (
                  <img src={portalConfig.settings.logo_url} alt="Logo" className="max-h-12 max-w-[90%] object-contain" />
                ) : (
                  <div className="flex flex-col items-center">
                    <PhotoIcon className="h-5 w-5 text-gray-500 mb-1" />
                    <span className="text-[9px] text-gray-500 text-center font-medium">Click to upload</span>
                  </div>
                )}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="w-full bg-gray-900/40 border border-gray-800/40 rounded-3xl p-5 hover:bg-gray-900/60 transition-all backdrop-blur-md flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
              Portal Expiration
            </span>
            <div className="flex flex-col gap-2">
              <input
                type="datetime-local"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none transition-all [color-scheme:dark]"
                value={portalConfig?.expires_at ? new Date(portalConfig.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPortalConfig({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              {portalConfig?.expires_at && (
                <button 
                  onClick={() => setPortalConfig({ expires_at: null })}
                  className="text-[9px] text-red-500/70 hover:text-red-400 font-bold uppercase tracking-wider text-left transition-colors"
                >
                  Clear Expiration
                </button>
              )}
              <p className="text-[9px] text-gray-600 px-1 leading-tight">
                Portal will become inaccessible after this date. Leave blank for no expiration.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    if (!selectedWidgetId) return;
    updateWidgetConfig(selectedWidgetId, { [key]: value });
  };

  return (
    <div className="w-64 bg-gray-950 border-l border-gray-800 flex flex-col h-full z-10 animate-in slide-in-from-right-4 duration-300">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/20">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Config: {widget.type}</h2>
          <p className="text-[9px] text-gray-500 font-mono mt-1 opacity-50">ID: {widget.id.split('_')[1] || widget.id}</p>
        </div>
        <button onClick={() => setIsConfigOpen(false)} className="text-gray-500 hover:text-white transition-colors">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Render config fields based on widget type */}
        {widget.type === 'text' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Heading</label>
              <input
                value={widget.config.heading || ''}
                onChange={(e) => handleChange('heading', e.target.value)}
                placeholder="Enter heading..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Body Text</label>
              <textarea
                value={widget.config.body || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Enter body content..."
                rows={5}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Alignment</label>
              <select
                value={widget.config.align || 'left'}
                onChange={(e) => handleChange('align', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {widget.type === 'banner' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Image URL</label>
              <input
                value={widget.config.image_url || ''}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Title</label>
              <input
                value={widget.config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Banner title"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Height (px)</label>
              <input
                type="number"
                value={widget.config.height || 400}
                onChange={(e) => handleChange('height', Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </>
        )}

        {widget.type === 'search' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Placeholder</label>
              <input
                value={widget.config.placeholder || 'Search assets...'}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <label className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
              <input
                type="checkbox"
                checked={widget.config.sticky || false}
                onChange={(e) => handleChange('sticky', e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500/20 bg-gray-800 border-gray-700 w-4 h-4"
              />
              <span className="text-sm font-bold text-white">Sticky at Top</span>
            </label>
          </>
        )}

        {widget.type === 'spacer' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Height (px)</label>
            <input
              type="number"
              value={widget.config.height || 64}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        )}

        {(widget.type === 'assets_grid' || widget.type === 'collection') && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Columns</label>
              <select
                value={widget.config.columns || 3}
                onChange={(e) => handleChange('columns', Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
                <option value={5}>5 Columns</option>
              </select>
            </div>
            {widget.type === 'collection' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Collection</label>
                <div className="relative group">
                  <select
                    value={widget.config.collection_id || ''}
                    onChange={(e) => handleChange('collection_id', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose a collection...</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
                </div>
                {collections.length === 0 && !collectionsLoading && (
                  <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mt-2 px-1">
                    No collections found in this workspace.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {widget.type === 'category' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Category</label>
            <div className="relative group">
              <select
                value={widget.config.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Choose a category...</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
            </div>
            {flatCategories.length === 0 && !categoriesLoading && (
              <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mt-2 px-1">
                No categories found in this workspace.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
