'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { BrandKit, BrandColor, BrandFont, BrandLogo } from '@/types/brand';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  PlusIcon,
  LinkIcon,
  PhotoIcon,
  SwatchIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { AddColorModal, AddFontModal, AssetPickerModal } from '@/components/brand/BrandKitModals';
import { useWorkspace } from '@/context/WorkspaceContext';

import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

export default function BrandKitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeletingKit, setIsDeletingKit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal states
  const [showColorModal, setShowColorModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const fetchKit = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<BrandKit>(`/brand-kits/${id}`);
      setKit(data);
    } catch (error) {
      console.error('Failed to fetch kit:', error);
      toast.error('Failed to load brand kit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchKit();
  }, [id]);

  const handleDeleteKit = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteKit = async () => {
    setIsDeletingKit(true);
    try {
      await apiFetch(`/brand-kits/${id}`, { method: 'DELETE' });
      toast.success('Brand kit deleted');
      router.push('/brand');
    } catch (err) {
      toast.error('Failed to delete brand kit');
      setIsDeletingKit(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteItem = async (type: 'colors' | 'fonts' | 'logos', itemId: string) => {
    try {
      await apiFetch(`/brand-kits/${id}/${type}/${itemId}`, { method: 'DELETE' });
      toast.success('Item removed');
      fetchKit();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddLogo = async (asset: any) => {
    try {
      await apiFetch(`/brand-kits/${id}/logos`, {
        method: 'POST',
        body: JSON.stringify({ asset_id: asset.id, usage_type: 'primary' }),
      });
      toast.success('Logo added!');
      fetchKit();
      setShowLogoModal(false);
    } catch (err) {
      toast.error('Failed to add logo');
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Loading kit details...</div>;
  if (!kit) return <div className="p-8 text-center text-gray-500">Kit not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/brand')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Brand Governance
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDeleteKit}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{kit.name}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">{kit.description || 'Define your visual identity through colors, typography, and logos.'}</p>
      </div>

      {/* Grid Layout for Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Colors Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <SwatchIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Color Palette</h2>
            </div>
            <button 
              onClick={() => setShowColorModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Color
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {kit.colors?.map(color => (
              <div key={color.id} className="group relative bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700 outline outline-0 hover:outline-2 outline-blue-500/20">
                <div 
                  className="w-full aspect-square rounded-xl mb-3 shadow-inner" 
                  style={{ backgroundColor: color.color_hex }}
                />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{color.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">{color.color_hex}</p>
                <button 
                  onClick={() => handleDeleteItem('colors', color.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">Aa</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Typography</h2>
            </div>
            <button 
              onClick={() => setShowFontModal(true)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Font
            </button>
          </div>

          <div className="space-y-4">
            {kit.fonts?.map(font => (
              <div key={font.id} className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                    {font.is_google_font ? 'Google Font' : 'Local'}
                  </span>
                  <button 
                    onClick={() => handleDeleteItem('fonts', font.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-2xl mb-1" style={{ fontFamily: font.font_family }}>
                  The quick brown fox jumps over the lazy dog.
                </h3>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{font.name} — {font.font_family}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Logos Section */}
        <section className="lg:col-span-2 space-y-6 pt-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <PhotoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Official Logos</h2>
            </div>
            <button 
              onClick={() => setShowLogoModal(true)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Link Official Logo
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {kit.logos?.map(logo => (
              <div key={logo.id} className="group relative aspect-square bg-gray-50 dark:bg-gray-800/30 rounded-2xl flex items-center justify-center p-8 border border-transparent hover:border-blue-500/30 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-xl">
                {logo.asset ? (
                  <img 
                    src={`/api/v1/assets/${logo.asset.id}/raw`} 
                    alt={logo.usage_type || 'Logo'} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <PhotoIcon className="h-12 w-12 text-gray-200" />
                )}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors rounded-2xl" />
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-tighter rounded-full border border-blue-200/50 dark:border-blue-500/20">
                    {logo.usage_type || 'Logo'}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteItem('logos', logo.id)}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 text-red-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

      <AddColorModal 
        isOpen={showColorModal} 
        onClose={() => setShowColorModal(false)} 
        onSuccess={fetchKit} 
        brandKitId={id as string} 
      />
      <AddFontModal 
        isOpen={showFontModal} 
        onClose={() => setShowFontModal(false)} 
        onSuccess={fetchKit} 
        brandKitId={id as string} 
      />
      <AssetPickerModal 
        isOpen={showLogoModal} 
        onClose={() => setShowLogoModal(false)} 
        onSelect={handleAddLogo} 
        workspaceId={activeWorkspace?.id} 
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteKit}
        isDeleting={isDeletingKit}
        title="Delete Brand Kit"
        message="Are you sure you want to delete this brand kit? This will permanently remove all associated colors, fonts, and logo references."
        confirmText="Delete permanently"
      />
    </div>
  );
}
