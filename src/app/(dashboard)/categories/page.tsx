'use client';

import React, { useState } from 'react';
import { useCategories, Category } from '@/hooks/useCategories';
import { apiFetch } from '@/lib/api';
import {
  PlusIcon,
  TagIcon,
  TrashIcon,
  PencilSquareIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import SmartFilterBuilder from '@/components/SmartFilterBuilder';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import Link from 'next/link';

export default function CategoriesPage() {
  const { categories, updateCategory, deleteCategory, refresh } = useCategories();
  const { activeWorkspace } = useWorkspace();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isAddingTo, setIsAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isSmart, setIsSmart] = useState(false);
  const [smartFilter, setSmartFilter] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleCreate = async (parentId?: string) => {
    if (!newName.trim()) return;
    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          parent_id: parentId === 'root' ? undefined : parentId,
          workspace_id: activeWorkspace?.id,
          customer_id: (activeWorkspace as any).customer_id,
          is_smart: isSmart,
          smart_filter: isSmart ? smartFilter : null,
        }),
      });
      setNewName('');
      setIsSmart(false);
      setSmartFilter({});
      setIsAddingTo(null);
      refresh();
      if (parentId && parentId !== 'root') {
        setExpandedIds(prev => new Set(prev).add(parentId));
      }
    } catch (err) {
      console.error('Failed to create category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateCategory(id, {
        name: newName,
        is_smart: isSmart,
        smart_filter: isSmart ? smartFilter : null,
      });
      setEditingId(null);
      setNewName('');
      setIsSmart(false);
      setSmartFilter({});
    } catch (err) {
      console.error('Failed to update category');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setIsSmart(cat.is_smart);
    setSmartFilter(cat.smart_filter || {});
  };

  const handleDeleteRequest = (cat: Category) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCategoryRow = (cat: Category, depth: number = 0) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;

    return (
      <div key={cat.id} className="space-y-1">
        <div
          className="group flex items-center justify-between p-3 rounded-2xl bg-gray-900/40 border border-gray-800/60 hover:border-blue-500/30 hover:bg-gray-800/40 transition-all duration-200"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleExpand(cat.id)}
              className={`p-1 rounded-md hover:bg-gray-800 transition-colors ${!hasChildren ? 'opacity-0 cursor-default' : 'opacity-100'}`}
              disabled={!hasChildren}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                isExpanded ? <FolderOpenIcon className="h-4 w-4 text-blue-400" /> : <FolderIcon className="h-4 w-4 text-blue-400" />
              ) : (
                <FolderIcon className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm font-semibold text-white">{cat.name}</span>
              {cat.asset_count > 0 && (
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold">
                  {cat.asset_count}
                </span>
              )}
              {cat.name === 'Global' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold uppercase tracking-wider">System</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cat.asset_count > 0 && (
              <Link
                href={`/?category_uuids=${cat.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/5 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group/view"
              >
                View
                <ArrowRightIcon className="h-3 w-3 group-hover/view:translate-x-0.5 transition-transform" />
              </Link>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <PermissionGate action={Action.Update} subject="Category" workspaceId={activeWorkspace?.id}>
                <button
                  onClick={() => setIsAddingTo(cat.id)}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all"
                  title="Add sub-category"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </PermissionGate>
              {cat.name !== 'Global' && (
                <PermissionGate action={Action.Update} subject="Category" workspaceId={activeWorkspace?.id}>
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-all"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                </PermissionGate>
              )}
              {cat.name !== 'Global' && (
                <PermissionGate action={Action.Delete} subject="Category" workspaceId={activeWorkspace?.id}>
                  <button
                    onClick={() => handleDeleteRequest(cat)}
                    className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>

        {editingId === cat.id && (
          <div className="p-6 bg-gray-900/60 border border-blue-500/30 rounded-3xl mt-2 space-y-4 animate-in zoom-in-95 duration-200" style={{ marginLeft: `${depth * 24}px` }}>
            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Category Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />

              <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`p-2 rounded-lg transition-all ${isSmart ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
                    <BoltIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white tracking-tight">Smart Category</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Automatically associate assets via rules</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSmart}
                    onChange={e => setIsSmart(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500/20"
                  />
                </label>

                {isSmart && (
                  <div className="mt-4 pt-4 border-t border-gray-700 animate-in slide-in-from-top-2 duration-300">
                    <SmartFilterBuilder filter={smartFilter} onChange={setSmartFilter} />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdate(cat.id)}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setEditingId(null); setNewName(''); setIsSmart(false); setSmartFilter({}); }}
                  className="flex-1 py-3 bg-gray-800 text-gray-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddingTo === cat.id && (
          <div
            className="flex items-center gap-2 p-2 ml-auto w-[calc(100%-24px)] animate-in slide-in-from-left-2 duration-200"
            style={{ marginLeft: `${(depth + 1) * 24}px` }}
          >
            <div className="flex-1 flex items-center bg-gray-800 rounded-xl border border-blue-500/30 overflow-hidden">
              <input
                autoFocus
                type="text"
                placeholder="Sub-category name..."
                className="flex-1 bg-transparent px-4 py-2 text-xs text-white outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate(cat.id)}
              />
              <button
                onClick={() => handleCreate(cat.id)}
                className="p-2 text-blue-400 hover:bg-gray-700 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setIsAddingTo(null); setNewName(''); }}
                className="p-2 text-gray-500 hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {isExpanded && cat.children?.map(child => renderCategoryRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FolderIcon className="h-7 w-7 text-blue-500" />
            Category Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage hierarchical labels to organize your global asset library.</p>
        </div>
        <PermissionGate action={Action.Create} subject="Category" workspaceId={activeWorkspace?.id}>
          <button
            onClick={() => setIsAddingTo('root')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Root Category
          </button>
        </PermissionGate>
      </header>

      {isAddingTo === 'root' && (
        <div className="bg-gray-900/60 p-4 border border-blue-500/30 rounded-3xl animate-in zoom-in-95 duration-200">
          <div className="flex gap-4">
            <input
              autoFocus
              type="text"
              placeholder="Internal ID or Name..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={() => handleCreate()}
              className="px-8 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all"
            >
              Create
            </button>
            <button
              onClick={() => { setIsAddingTo(null); setNewName(''); }}
              className="px-4 text-gray-500 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/20 rounded-[40px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-4">
            <FolderIcon className="h-12 w-12 text-gray-800" />
            <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">No categories defined for this workspace</p>
          </div>
        ) : (
          categories.map(cat => renderCategoryRow(cat))
        )}
      </div>

      <footer className="pt-10 border-t border-gray-900 flex justify-center">
        <div className="bg-blue-500/5 px-6 py-4 rounded-3xl border border-blue-500/10 max-w-lg">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            <span className="text-blue-400 font-bold mr-1">Pro Tip:</span>
            Organizing assets into a logical hierarchy improves discoverability. Sub-categories inherit properties from their parents.
          </p>
        </div>
      </footer>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setCategoryToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? All sub-categories and their associations will be removed. This action cannot be undone.`}
        confirmText="Delete Category"
        isDeleting={isDeleting}
      />
    </div>
  );
}
