'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch } from '@/lib/api';
import { BrandKit } from '@/types/brand';
import { 
  PlusIcon, 
  PaintBrushIcon, 
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { CreateBrandKitModal } from '@/components/brand/BrandKitModals';

export default function BrandKitsPage() {
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchKits = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await apiFetch<BrandKit[]>(`/brand-kits?workspace_id=${activeWorkspace.id}`);
      setKits(data || []);
    } catch (error) {
      console.error('Failed to fetch brand kits:', error);
      toast.error('Failed to load brand kits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) fetchKits();
  }, [activeWorkspace]);

  if (!activeWorkspace) return null;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Brand Governance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Centralize your brand identities, colors, and typography.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <PlusIcon className="h-5 w-5" />
          New Brand Kit
        </button>
      </div>

      <CreateBrandKitModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchKits}
        workspaceId={activeWorkspace?.id}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <PaintBrushIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Brand Kits Yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Start by creating your first brand identity.</p>
          <button className="text-blue-600 font-bold text-sm uppercase tracking-widest hover:text-blue-500">
            Create First Kit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map(kit => (
            <div 
              key={kit.id}
              onClick={() => router.push(`/dashboard/brand/${kit.id}`)}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1"
            >
              {/* Decorative background gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <PaintBrushIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{kit.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6">
                {kit.description || 'No description provided.'}
              </p>

              <div className="flex items-center gap-2">
                {kit.colors?.slice(0, 4).map(color => (
                  <div 
                    key={color.id}
                    className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: color.color_hex }}
                    title={color.name}
                  />
                ))}
                {(kit.colors?.length || 0) > 4 && (
                  <span className="text-[10px] font-bold text-gray-400">+{kit.colors!.length - 4}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
