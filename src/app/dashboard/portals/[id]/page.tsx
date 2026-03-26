'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePortals, Portal } from '@/hooks/usePortals';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  GlobeAltIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  TrashIcon,
  PhotoIcon,
  DocumentIcon,
  VideoCameraIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableAsset, DroppablePortalAssets } from '@/components/portals/DndComponents';
import Builder from '@/components/portals/builder/Builder';
import { useBuilderStore } from '@/stores/builderStore';

import { toast } from 'sonner';

export default function PortalDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const { getPortal, getPortalAssets, addAssetsToPortal, updatePortal } = usePortals();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [portalAssets, setPortalAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchingOpen, setIsSearchingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'builder'>('builder');
  const [isSaving, setIsSaving] = useState(false);
  const { setWidgets, widgets, portalConfig, setPortalConfig } = useBuilderStore();

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [p, assetsData] = await Promise.all([
        getPortal(id as string),
        getPortalAssets(id as string)
      ]);
      setPortal(p);
      setWidgets(p.settings?.layout || []);
      setPortalConfig({ background_color: p.background_color || '#fafafa' });
      setPortalAssets(assetsData.assets || []);
      useBuilderStore.getState().setPortalAssets(assetsData.assets || []);
      useBuilderStore.getState().setPortalCategories(assetsData.categories || []);
      useBuilderStore.getState().setPortalCollections(assetsData.collections || []);
    } catch (err) {
      console.error('Failed to load portal detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id, getPortal, getPortalAssets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleAddAsset = async (assetId: string) => {
    try {
      await addAssetsToPortal(id, [assetId]);
      await loadData();
      toast.success('Asset added to portal');
    } catch (err) {
      toast.error('Failed to add asset');
    }
  };

  const handleUpdatePortal = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    
    // Use getState() to ensure we have the absolute latest state from the store
    // This prevents potential race conditions or stale closures during save
    const currentWidgets = useBuilderStore.getState().widgets;
    const currentConfig = useBuilderStore.getState().portalConfig;
    
    const updates = {
      background_color: currentConfig?.background_color,
      settings: {
        ...(portal?.settings || {}),
        layout: currentWidgets
      }
    };

    try {
      setIsSaving(true);
      await updatePortal(id, updates);
      await loadData();
      toast.success('Portal updated successfully');
    } catch (err) {
      toast.error('Failed to update portal');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !portal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="p-8 text-center bg-gray-950 min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-xl font-bold text-white">Portal not found</h1>
        <Link href="/dashboard/portals" className="text-blue-500 mt-4 inline-block italic">Back to Portals</Link>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <PortalDetailContent 
        id={id}
        portal={portal}
        portalAssets={portalAssets}
        loadData={loadData}
        activeWorkspace={activeWorkspace}
        getPortal={getPortal}
        getPortalAssets={getPortalAssets}
        addAssetsToPortal={addAssetsToPortal}
        updatePortal={updatePortal}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searching={searching}
        setSearching={setSearching}
        isSearchingOpen={isSearchingOpen}
        setIsSearchingOpen={setIsSearchingOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        handleSearch={handleSearch}
        handleAddAsset={handleAddAsset}
        handleUpdatePortal={handleUpdatePortal}
      />
    </DndProvider>
  );
}

function PortalDetailContent({ 
  id, portal, portalAssets, loadData, activeWorkspace,
  addAssetsToPortal, updatePortal, 
  searchQuery, setSearchQuery, searchResults, 
  searching, isSearchingOpen, setIsSearchingOpen,
  activeTab, setActiveTab, isSaving, 
  handleSearch, handleAddAsset, handleUpdatePortal
}: any) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link 
            href="/dashboard/portals" 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Portals
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <GlobeAltIcon className="h-9 w-9 text-blue-500" />
            {portal.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs font-mono bg-gray-900/50 px-3 py-1 rounded-lg border border-gray-800">/p/{portal.slug}</span>
            <a 
              href={`/p/${portal.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 text-xs font-bold flex items-center gap-1.5"
            >
              <GlobeAltIcon className="h-4 w-4" />
              Open Public Page
            </a>
          </div>
        </div>
        
        <button 
          onClick={() => setIsSearchingOpen(true)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <PlusIcon className="h-4 w-4" />
          Add Assets
        </button>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('builder')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'builder' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Page Builder
            {activeTab === 'builder' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'assets' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Raw Assets
            {activeTab === 'assets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>
        </div>

        {activeTab === 'builder' && (
          <button 
            onClick={() => handleUpdatePortal()}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 mb-4 sm:mb-0"
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
            {!isSaving && <CheckIcon className="h-4 w-4" />}
          </button>
        )}
      </div>

      {activeTab === 'builder' && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-6">
           <Builder />
        </section>
      )}

      {activeTab === 'assets' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Included Assets ({portalAssets.length})</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Manage shared content</p>
          </div>

          <DroppablePortalAssets 
            assets={portalAssets} 
            onDrop={handleAddAsset} 
            onOpenSearch={() => setIsSearchingOpen(true)} 
          />
        </section>
      )}

      {/* Asset Search Drawer/Overlay */}
      {isSearchingOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchingOpen(false)} />
          <div className="relative w-full max-w-2xl bg-gray-950 border-l border-gray-800 h-full flex flex-col animate-in slide-in-from-right duration-300">
            <header className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Add Assets from Library</h3>
              <button 
                onClick={() => setIsSearchingOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </header>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search your library..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Search
                </button>
              </div>

              <div className="space-y-4">
                {searching ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {searchResults.map((asset: any) => {
                      const isAlreadyInPortal = portalAssets.some((pa: any) => pa.id === asset.id);
                      return (
                        <DraggableAsset 
                          key={asset.id} 
                          asset={asset} 
                          onAdd={handleAddAsset} 
                          isAlreadyInPortal={isAlreadyInPortal} 
                        />
                      );
                    })}
                  </div>
                ) : searchQuery && !searching ? (
                  <p className="text-center py-12 text-gray-500 text-sm italic">No assets found for "{searchQuery}"</p>
                ) : (
                  <div className="text-center py-12 space-y-2 opacity-40">
                    <PhotoIcon className="h-10 w-10 text-gray-500 mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Search to discover assets</p>
                  </div>
                )}
              </div>
            </div>
            
            <footer className="p-6 border-t border-gray-800 bg-gray-950/80 backdrop-blur-md">
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">Assets added will be immediately visible on the public portal.</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

