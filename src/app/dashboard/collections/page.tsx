'use client';

import React, { useState } from 'react';
import { useCollections, Collection } from '@/hooks/useCollections';
import { 
  PlusIcon, 
  Square3Stack3DIcon, 
  TrashIcon, 
  FolderIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightIcon,
  SparklesIcon,
  PencilSquareIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import SmartFilterBuilder from '@/components/SmartFilterBuilder';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function CollectionsPage() {
  const { collections, createCollection, updateCollection, deleteCollection, refresh } = useCollections();
  const { activeWorkspace } = useWorkspace();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSmart, setIsSmart] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [smartFilter, setSmartFilter] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCollection(newName, newDesc, isSmart, isSmart ? smartFilter : null, isGlobal);
      setNewName('');
      setNewDesc('');
      setIsSmart(false);
      setIsGlobal(false);
      setSmartFilter({});
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create collection');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!newName.trim()) return;
    try {
      await updateCollection(id, {
        name: newName,
        description: newDesc,
        is_smart: isSmart,
        smart_filter: isSmart ? smartFilter : null,
        is_global: isGlobal,
      });
      setEditingId(null);
      setNewName('');
      setNewDesc('');
      setIsSmart(false);
      setSmartFilter({});
    } catch (err) {
      console.error('Failed to update collection');
    }
  };

  const startEdit = (col: Collection) => {
    setEditingId(col.id);
    setNewName(col.name);
    setNewDesc(col.description || '');
    setIsSmart(col.is_smart);
    setIsGlobal(col.is_global || false);
    setSmartFilter(col.smart_filter || {});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteCollection(id);
    } catch (err) {
      console.error('Failed to delete collection');
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-4">
            <Square3Stack3DIcon className="h-9 w-9 text-indigo-500" />
            My Collections
          </h1>
          <p className="text-gray-500 text-sm mt-1 mx-1">Curate and group your favorite assets for quick access and sharing.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search collections..."
              className="bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 outline-none w-64 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        <PermissionGate action={Action.Create} subject="Collection" workspaceId={activeWorkspace?.id}>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            New Collection
          </button>
        </PermissionGate>
        </div>
      </header>

      {isAdding && (
        <div className="bg-gray-900/60 p-8 border border-indigo-500/30 rounded-[32px] animate-in zoom-in-95 duration-200 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-bold text-white uppercase tracking-widest">Create Collection</h3>
             <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="h-5 w-5" />
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Inspiration, Q4 Campaign, etc."
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                <input 
                  type="text"
                  placeholder="What is this collection for?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`p-2 rounded-lg transition-all ${isSmart ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
                <SparklesIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white tracking-tight">Smart Collection</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Automatically associate assets via rules</p>
              </div>
              <input 
                type="checkbox" 
                checked={isSmart} 
                onChange={e => setIsSmart(e.target.checked)} 
                className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500/20"
              />
            </label>
            
            {isSmart && (
              <div className="mt-4 pt-4 border-t border-gray-700 animate-in slide-in-from-top-2 duration-300">
                <SmartFilterBuilder filter={smartFilter} onChange={setSmartFilter} />
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`p-2 rounded-lg transition-all ${isGlobal ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
                <GlobeAmericasIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white tracking-tight">Global Collection</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Visible to all users in this workspace</p>
              </div>
              <input 
                type="checkbox" 
                checked={isGlobal} 
                onChange={e => setIsGlobal(e.target.checked)} 
                className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-amber-600 focus:ring-amber-500/20"
              />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800/60">
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40"
            >
              Create Collection
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-gray-900/20 rounded-[48px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-6">
             <div className="h-20 w-20 rounded-full bg-gray-800/50 flex items-center justify-center">
                <Square3Stack3DIcon className="h-10 w-10 text-gray-700" />
             </div>
             <div className="space-y-1">
                 <p className="text-white font-bold text-lg">No collections found</p>
                 <p className="text-gray-500 text-sm">Start curating by creating your first collection.</p>
             </div>
             <PermissionGate action={Action.Create} subject="Collection" workspaceId={activeWorkspace?.id}>
               <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-4 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
               >
                  Create Collection
               </button>
             </PermissionGate>
          </div>
        ) : (
          filteredCollections.map(col => (
            <React.Fragment key={col.id}>
              <div 
                className="group flex flex-col p-6 rounded-[32px] bg-gray-900/40 border border-gray-800/60 hover:border-indigo-500/30 hover:bg-gray-800/40 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                   <PermissionGate action={Action.Update} subject="Collection" workspaceId={activeWorkspace?.id}>
                     <button 
                       onClick={() => startEdit(col)}
                       className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                     >
                        <PencilSquareIcon className="h-4 w-4" />
                     </button>
                   </PermissionGate>
                   <PermissionGate action={Action.Delete} subject="Collection" workspaceId={activeWorkspace?.id}>
                     <button 
                       onClick={() => handleDelete(col.id)}
                       className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                     >
                        <TrashIcon className="h-4 w-4" />
                     </button>
                   </PermissionGate>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FolderIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{col.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {col.is_global ? (
                          <span className="flex items-center gap-1 text-amber-500">
                            <GlobeAmericasIcon className="h-3 w-3" />
                            Global Collection
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            Personal Collection
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-6 leading-relaxed">
                  {col.description || 'No description provided for this collection.'}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-gray-800/60 pt-4">
                   <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-[10px] text-gray-500 font-mono">{(new Date()).toLocaleDateString()}</span>
                   </div>
                   <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all uppercase tracking-widest active:scale-95">
                      View
                      <ArrowRightIcon className="h-3 w-3" />
                   </button>
                </div>
              </div>

              {editingId === col.id && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gray-900/60 p-8 border border-indigo-500/30 rounded-[32px] animate-in zoom-in-95 duration-200 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Collection: {col.name}</h3>
                     <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white transition-colors">
                        <XMarkIcon className="h-5 w-5" />
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Name</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
                        <input 
                          type="text"
                          className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                          value={newDesc}
                          onChange={e => setNewDesc(e.target.value)}
                        />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`p-2 rounded-lg transition-all ${isSmart ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
                        <SparklesIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white tracking-tight">Smart Collection</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Automatically associate assets via rules</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSmart} 
                        onChange={e => setIsSmart(e.target.checked)} 
                        className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500/20"
                      />
                    </label>
                    
                    {isSmart && (
                      <div className="mt-4 pt-4 border-t border-gray-700 animate-in slide-in-from-top-2 duration-300">
                        <SmartFilterBuilder filter={smartFilter} onChange={setSmartFilter} />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`p-2 rounded-lg transition-all ${isGlobal ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
                        <GlobeAmericasIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white tracking-tight">Global Collection</p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Visible to all users in this workspace</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isGlobal} 
                        onChange={e => setIsGlobal(e.target.checked)} 
                        className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-amber-600 focus:ring-amber-500/20"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800/60">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdate(col.id)}
                      className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      <footer className="pt-20 flex flex-col items-center gap-4">
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Open DAM Collection System</p>
      </footer>
    </div>
  );
}
