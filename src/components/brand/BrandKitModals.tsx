'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  brandKitId?: string;
  workspaceId?: string;
}

export function CreateBrandKitModal({ isOpen, onClose, onSuccess, workspaceId }: ModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch(`/brand-kits?workspace_id=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      toast.success('Brand kit created!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create brand kit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Brand Kit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Kit Name</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="e.g. Acme Primary Identity"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
              placeholder="Primary colors and typography for Acme Corp."
            />
          </div>
          <button 
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Brand Kit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AddColorModal({ isOpen, onClose, onSuccess, brandKitId }: ModalProps) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#000000');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch(`/brand-kits/${brandKitId}/colors`, {
        method: 'POST',
        body: JSON.stringify({ name, color_hex: hex }),
      });
      toast.success('Color added!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to add color');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Color</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-center py-4">
            <div className="h-24 w-24 rounded-2xl shadow-inner border border-black/5" style={{ backgroundColor: hex }} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Color Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl" placeholder="e.g. Midnight Blue" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">HEX Code</label>
            <input required value={hex} onChange={e => setHex(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl font-mono uppercase" placeholder="#FFFFFF" />
          </div>
          <button disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all">
            {submitting ? 'Adding...' : 'Add Color'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AddFontModal({ isOpen, onClose, onSuccess, brandKitId }: ModalProps) {
  const [name, setName] = useState('');
  const [family, setFamily] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch(`/brand-kits/${brandKitId}/fonts`, {
        method: 'POST',
        body: JSON.stringify({ name, font_family: family, is_google_font: true }),
      });
      toast.success('Font added!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to add font');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Font</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Font Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl" placeholder="e.g. Primary Sans" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Font Family</label>
            <input required value={family} onChange={e => setFamily(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl" placeholder="e.g. Inter, sans-serif" />
          </div>
          <button disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all">
            {submitting ? 'Adding...' : 'Add Font'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AssetPickerModal({ isOpen, onClose, onSelect, workspaceId }: any) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (isOpen && workspaceId) {
      const fetchAssets = async () => {
        try {
          setLoading(true);
          const data = await apiFetch<any>(`/workspaces/${workspaceId}/search/assets?q=${q}&limit=20`);
          setAssets(data.results || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchAssets();
    }
  }, [isOpen, workspaceId, q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl h-[80vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose Logo from Assets</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search assets..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No assets found.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {assets.map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => onSelect(asset)}
                  className="group relative aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:ring-4 ring-blue-500/50 transition-all shadow-sm"
                >
                  <img src={`/api/v1/assets/${asset.id}/raw`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-blue-600 px-2 py-1 rounded">Select</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
