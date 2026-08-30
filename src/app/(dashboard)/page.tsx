'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import { useMarqueeSelection } from '@/hooks/useMarqueeSelection';
import AssetGrid from '@/components/AssetGrid';
import { useUpload } from '@/context/UploadContext';
import GuestUploadLinkDialog from '@/components/GuestUploadLinkDialog';
import ManageGuestLinksModal from '@/components/ManageGuestLinksModal';
import UploadDropdown from '@/components/UploadDropdown';
import MetadataPanel from '@/components/MetadataPanel';
import FilterSidebar from '@/components/FilterSidebar';
import DuplicateFinderModal from '@/components/DuplicateFinderModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import DownloadModal from '@/components/DownloadModal';
import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SquaresPlusIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import BulkActionToolbar from '@/components/BulkActionToolbar';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import Pagination from '@/components/Pagination';
import { useLayout } from '@/context/LayoutContext';
import { PermissionGate } from '@/components/PermissionGate';
import { Action } from '@/types/auth';
import { toast } from 'sonner';
import DocumentationLink from '@/components/DocumentationLink';
import DashboardTour from '@/components/DashboardTour';
import { useCategories } from '@/hooks/useCategories';

function FilterChips({
  activeFilters,
  filters,
  filterConfig,
  onRemove,
  onClearAll,
  disabled = false,
}: {
  activeFilters: Record<string, any>,
  filters: any,
  filterConfig?: Record<string, { label: string; type: string }>,
  onRemove: (key: string, value?: any) => void,
  onClearAll: () => void,
  disabled?: boolean,
}) {

  const getLabel = (key: string) => {
    const filterLabels: Record<string, string> = {
      mime_type: 'File Type',
      orientation: 'Orientation',
      tag_uuids: 'Tag',
      file_extension: 'Extension',
      color_palette: 'Color',
      category_uuids: 'Category',
      collection_uuids: 'Collection',
      q: 'Search',
      created_at: 'Uploaded',
      release_date: 'Released',
      expiration_date: 'Expires',
      aspect_ratio: 'Aspect Ratio',
      category_paths: 'Category',
      uploaded_by_id: 'Uploaded by',
      average_rating: 'Rating',
      person_ids: 'People'
    };
    if (filterLabels[key]) return filterLabels[key];
    if (filterConfig && filterConfig[key]) return filterConfig[key].label;
    return key.split('.').pop()!.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const chips: { key: string; label: string; value: any; displayValue: string; isRange?: boolean }[] = [];
  const rangeGroups: Record<string, { gte?: any, lte?: any }> = {};
  const processedKeys = new Set<string>();

  // 1. First pass: group range filters
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const match = key.match(/^(.+)\[(gte|lte)\]$/);
    if (match) {
      const [, baseKey, op] = match;
      if (!rangeGroups[baseKey]) rangeGroups[baseKey] = {};
      rangeGroups[baseKey][op as 'gte' | 'lte'] = value;
      processedKeys.add(key);
    }
  });

  // 2. Second pass: generate chips
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (processedKeys.has(key)) return; // Skip already grouped range keys
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return;
    if (key.startsWith('ws') || ['page', 'limit', 'is_semantic', 'sort_by', 'sort_order', 'sortBy', 'sortOrder'].includes(key.trim())) return;

    const label = getLabel(key);

    if (Array.isArray(value)) {
      value.forEach(v => {
        let displayValue = String(v);
        if (key === 'orientation') {
          displayValue = displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
        }
        const facetBuckets = filters[key];
        if (Array.isArray(facetBuckets)) {
          const bucket = facetBuckets.find((b: any) => b.value === v);
          if (bucket?.label) displayValue = bucket.label;
        }

        chips.push({
          key,
          label,
          value: v,
          displayValue: key === 'color_palette' ? '' : displayValue
        });
      });
    } else {
      let displayValue = String(value);
      if (key === 'orientation') {
        displayValue = displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
      }
      const facetBuckets = filters[key];
      if (Array.isArray(facetBuckets)) {
        const bucket = facetBuckets.find((b: any) => b.value === value);
        if (bucket?.label) displayValue = bucket.label;
      }
      chips.push({ key, label, value, displayValue });
    }
  });

  // 3. Third pass: Add grouped range chips
  Object.entries(rangeGroups).forEach(([baseKey, values]) => {
    const label = getLabel(baseKey);

    const formatValue = (val: any) => {
      if (typeof val === 'number') {
        if (Number.isInteger(val)) return val.toString();
        return val.toFixed(2);
      }
      if (!isNaN(parseFloat(val)) && /^-?\d*\.?\d+$/.test(String(val))) {
        const num = parseFloat(val);
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(2);
      }
      return String(val);
    };

    let displayValue = '';
    if (values.gte && values.lte) {
      displayValue = `${formatValue(values.gte)} - ${formatValue(values.lte)}`;
    } else if (values.gte) {
      displayValue = `> ${formatValue(values.gte)}`;
    } else if (values.lte) {
      displayValue = `< ${formatValue(values.lte)}`;
    }

    if (displayValue) {
      chips.push({
        key: baseKey,
        label,
        value: values,
        displayValue,
        isRange: true
      } as any);
    }
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {chips.map((chip, i) => (
        <div
          key={`${chip.key}-${chip.value}-${i}`}
          className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-tight">{chip.label}:</span>
          {chip.key === 'color_palette' ? (
            <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: chip.value }} />
          ) : (
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{chip.displayValue}</span>
          )}
          <button
            onClick={() => onRemove(chip.key, chip.value)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onClearAll}
        className="px-3 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors uppercase tracking-tight"
      >
        Clear all
      </button>
    </div>
  );
}


function flattenCategories(cats: any[]): any[] {
  const flat: any[] = [];
  const recurse = (list: any[]) => {
    list.forEach(c => {
      flat.push(c);
      if (c.children && c.children.length > 0) {
        recurse(c.children);
      }
    });
  };
  recurse(cats);
  return flat;
}

function DashboardContent() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { categories } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const limit = Number(searchParams.get('limit')) || 20;
  const contentRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState<any[]>([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [totalInWorkspace, setTotalInWorkspace] = useState(0);
  const [pagination, setPagination] = useState<{ page: number, total_pages: number }>({ page: 1, total_pages: 1 });
  const [currentSort, setCurrentSort] = useState<{ by: string; order: 'asc' | 'desc' }>({
    by: searchParams.get('sort_by') || 'created_at',
    order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
  });
  const [filters, setFilters] = useState<any>({});
  const [filterConfig, setFilterConfig] = useState<any>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isClearingAllFilters, setIsClearingAllFilters] = useState(false);
  const { openModal } = useUpload();
  const [isGuestLinkOpen, setIsGuestLinkOpen] = useState(false);
  const [isManageLinksOpen, setIsManageLinksOpen] = useState(false);
  const { sidebarCollapsed, setSidebarCollapsed, isFilterOpen, setIsFilterOpen } = useLayout();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const q = searchParams.get('q') || '';
  const isSemantic = searchParams.get('is_semantic') === 'true';
  const [exportLoading, setExportLoading] = useState(false);

  const [personMap, setPersonMap] = useState<Record<string, string>>({});
  const fetchRequestIdRef = useRef(0);
  const [workspaceSettings, setWorkspaceSettings] = useState<any>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    apiFetch(`/workspaces/${activeWorkspace.id}/settings`)
      .then(data => setWorkspaceSettings(data))
      .catch(console.error);
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) return;
    apiFetch<any[]>(`/workspaces/${activeWorkspace.id}/persons`)
      .then(persons => {
        const map: Record<string, string> = {};
        persons.forEach(p => { map[p.id] = p.name; });
        setPersonMap(map);
      })
      .catch(console.error);
  }, [activeWorkspace]);


  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Download Modal State
  const [downloadAsset, setDownloadAsset] = useState<any | null>(null);

  useEffect(() => {
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    const normalized: Record<string, any> = {};
    const arrayKeys = ['mime_type', 'file_extension', 'tag_uuids', 'orientation', 'color_palette', 'category_uuids', 'collection_uuids', 'category_paths'];
    Object.entries(params).forEach(([k, v]) => {
      if (arrayKeys.includes(k) && !Array.isArray(v)) {
        normalized[k] = [v];
      } else {
        normalized[k] = v;
      }
    });

    setActiveFilters(normalized);

    const q = searchParams.get('q');
    const isSemantic = searchParams.get('is_semantic') === 'true';
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order') as 'asc' | 'desc';

    const defaultBy = (q || isSemantic) ? '_score' : 'created_at';
    const defaultOrder = 'desc';

    setCurrentSort({
      by: sortBy || defaultBy,
      order: sortOrder || defaultOrder
    });

    if (isClearingAllFilters && searchParams.toString() === '') {
      setIsClearingAllFilters(false);
    }
  }, [isClearingAllFilters, searchParams]);

  const fetchAssets = useCallback(async () => {
    if (!activeWorkspace) return;
    const requestId = ++fetchRequestIdRef.current;
    try {
      setLoading(true);

      const endpoint = `/workspaces/${activeWorkspace.id}/search/assets?${searchParams.toString()}`;

      // We expect the new envelope with results, pagination, filters
      const data = await apiFetch<any>(endpoint);
      if (fetchRequestIdRef.current !== requestId) return;
      setAssets(data.results || []);
      setTotalMatching(data.pagination?.total_results || data.results?.length || 0);
      setTotalInWorkspace(data.pagination?.workspace_total || 0);
      setPagination({
        page: data.pagination?.page || 1,
        total_pages: data.pagination?.total_pages || 1
      });
      setFilters(data.filters || {});
      setFilterConfig(data.filter_config || {});
    } catch (error) {
      if (fetchRequestIdRef.current !== requestId) return;
      console.error('Failed to fetch assets:', error);
    } finally {
      if (fetchRequestIdRef.current !== requestId) return;
      setLoading(false);
    }
  }, [activeWorkspace, searchParams]);

  const decoratedFilters = useMemo(() => {
    if (!filters) return {};
    const f = { ...filters };
    if (f.person_ids && Array.isArray(f.person_ids)) {
      f.person_ids = f.person_ids.map((b: any) => ({
        ...b,
        label: personMap[b.value] || b.value
      }));
    }
    return f;
  }, [filters, personMap]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    const handleAssetsUploaded = () => {
      fetchAssets();
    };
    window.addEventListener('zuperix:assets-uploaded', handleAssetsUploaded);
    return () => window.removeEventListener('zuperix:assets-uploaded', handleAssetsUploaded);
  }, [fetchAssets]);

  const handleFilterChange = (keyOrUpdates: string | Record<string, any>, value?: any) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page on filter change
    params.delete('page');

    if (typeof keyOrUpdates === 'string') {
      const key = keyOrUpdates;
      params.delete(key);
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.set(key, String(value));
        }
      }
    } else {
      // Multi-update
      Object.entries(keyOrUpdates).forEach(([k, v]) => {
        params.delete(k);
        if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) {
            v.forEach(val => params.append(k, String(val)));
          } else {
            params.set(k, String(v));
          }
        }
      });
    }

    const query = params.toString();
    router.replace(`/${query ? `?${query}` : ''}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`/?${params.toString()}`);
  };

  const handleSortChange = (option: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort_by', option.sort_by);
    params.set('sort_order', option.sort_order);
    params.set('page', '1'); // Reset to page 1 on sort change
    router.replace(`/?${params.toString()}`);
  };

  const handleClearAll = () => {
    setIsClearingAllFilters(true);
    setActiveFilters({});
    setSelectedIds([]);
    setLastSelectedId(null);
    router.replace('/');
  };

  const handleExport = async () => {
    if (!activeWorkspace) return;
    try {
      setExportLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      const endpoint = `/workspaces/${activeWorkspace.id}/export/search?${params.toString()}`;

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.message || 'Export failed');
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('text/csv')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Export downloaded');
      } else {
        const result = await response.json();
        toast.success(result.message || 'Export started, check your email shortly');
      }
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const removeFilter = (key: string, value?: any) => {
    if (value === undefined) {
      handleFilterChange(key, undefined);
      return;
    }

    // Handle grouped range removal
    if (typeof value === 'object' && (value.gte !== undefined || value.lte !== undefined)) {
      handleFilterChange({
        [`${key}[gte]`]: undefined,
        [`${key}[lte]`]: undefined
      });
      return;
    }

    const current = activeFilters[key];
    if (Array.isArray(current)) {
      const updated = current.filter(v => v !== value);
      handleFilterChange(key, updated.length > 0 ? updated : undefined);
    } else {
      handleFilterChange(key, undefined);
    }
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/assets/${assetToDelete}`, { method: 'DELETE' });
      setAssets(prev => prev.filter((a: any) => a.id !== assetToDelete));
      setSelectedIds(prev => prev.filter(id => id !== assetToDelete));
      setDeleteModalOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      toast.error('Asset deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setAssetToDelete(id);
    setDeleteModalOpen(true);
  };

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const resolveCategoryUuid = useCallback((path: string) => {
    let cleanPath = path;
    if (activeWorkspace) {
      const prefix = `${activeWorkspace.id}/`;
      if (path.startsWith(prefix)) {
        cleanPath = path.substring(prefix.length);
      }
    }
    const found = flatCategories.find(c => c.path === cleanPath);
    return found ? found.id : null;
  }, [flatCategories, activeWorkspace]);

  const handleBulkRemoveFromCategory = async () => {
    if (!activeWorkspace || selectedIds.length === 0) return;

    const activePaths = activeFilters.category_paths;
    if (!activePaths || activePaths.length === 0) {
      toast.error('No active category selected');
      return;
    }

    const path = activePaths[0];
    const catUuid = resolveCategoryUuid(path);
    if (!catUuid) {
      toast.error('Could not resolve category ID');
      return;
    }

    try {
      await apiFetch(`/categories/${catUuid}/assets/delete`, {
        method: 'POST',
        body: JSON.stringify({ asset_ids: selectedIds })
      });
      toast.success('Successfully removed assets from category');
      setSelectedIds([]);
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove assets from category');
    }
  };

  const handleToggleSelect = (id: string, isShift: boolean) => {
    setSelectedIds(prev => {
      if (isShift && lastSelectedId) {
        const currentIndex = assets.findIndex(a => a.id === id);
        const lastIndex = assets.findIndex(a => a.id === lastSelectedId);
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const rangeIds = assets.slice(start, end + 1).map(a => a.id);
          const combined = Array.from(new Set([...prev, ...rangeIds]));
          return combined;
        }
      }

      setLastSelectedId(id);
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const [marqueeIds, setMarqueeIds] = useState<string[]>([]);
  const { isDragging, selectionBox } = useMarqueeSelection(
    contentRef,
    '[data-asset-id]',
    (ids) => setMarqueeIds(ids),
    (finalIds) => {
      setSelectedIds(prev => {
        // If nothing was selected by marquee, we don't clear (that's handled by simple click elsewhere if needed)
        // But for marquee, we usually want to REPLACEMENT select unless Shift is held.
        // For simplicity, let's just use finalIds if not empty.
        return finalIds.length > 0 ? finalIds : prev;
      });
      setMarqueeIds([]);
    }
  );

  const handleBulkSelect = (ids: string[], isAppend: boolean) => {
    setSelectedIds(prev => {
      if (isAppend) {
        return Array.from(new Set([...prev, ...ids]));
      }
      return ids;
    });
  };

  const [showNoWorkspaceMsg, setShowNoWorkspaceMsg] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!activeWorkspace && !workspaceLoading) {
      timer = setTimeout(() => {
        setShowNoWorkspaceMsg(true);
      }, 5000);
    } else {
      setShowNoWorkspaceMsg(false);
    }
    return () => clearTimeout(timer);
  }, [activeWorkspace, workspaceLoading]);

  if (!activeWorkspace) {
    if (workspaceLoading || !showNoWorkspaceMsg) {
      return (
        <div className="flex items-center justify-center h-full">
          <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      );
    }
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 p-4 sm:p-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Assets
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                Loading workspace...
              </p>
            </div>
            <div className="h-10 w-full max-w-xl rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <FilterSidebar
        filters={decoratedFilters}
        activeFilters={activeFilters}
        externalFilterConfig={filterConfig}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        disabled={isClearingAllFilters}
        filtersConfig={workspaceSettings?.filters_config}
      />


      <div
        ref={contentRef}
        className={`relative flex-1 p-4 sm:p-8 transition-all overflow-y-auto select-none`}
      >
        {/* Marquee Overlay */}
        {isDragging && selectionBox && (
          <div
            className="absolute z-50 bg-blue-500/20 border border-blue-500 rounded-sm pointer-events-none"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div data-tour="page-title">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {q ? 'Search Results' : 'Assets'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                  Showing <span className="text-gray-900 dark:text-gray-100 font-semibold">{assets.length}</span> out of <span className="text-gray-900 dark:text-gray-100 font-semibold">{totalMatching}</span> assets
                  {isSemantic && <span className="ml-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 text-[10px] font-medium rounded-full border border-amber-200/50 dark:border-amber-800/30 transition-all animate-pulse">AI can make mistakes</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('limit', newLimit.toString());
                      params.set('page', '1');
                      router.push(`${pathname}?${params.toString()}`);
                    }}
                    className="appearance-none px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all"
                  >
                    {[20, 50, 100, 500].map(size => (
                      <option key={size} value={size}>{size} per page</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    data-tour="filter-sidebar"
                    className="lg:hidden flex-1 flex items-center justify-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shrink-0"
                  >
                    <FunnelIcon className="h-3.5 w-3.5 mr-1.5" />
                    Filters
                  </button>
                  <button
                    onClick={fetchAssets}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-700 sm:border-transparent rounded-xl transition-all shrink-0"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div data-tour="sort-dropdown" className="flex items-center gap-2 flex-1 sm:flex-none">
                  <SortDropdown
                    currentSortBy={currentSort.by}
                    currentSortOrder={currentSort.order}
                    onSortChange={handleSortChange}
                  />
                  <button
                    onClick={handleExport}
                    disabled={exportLoading || assets.length === 0}
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    title="Export Results to CSV"
                  >
                    <ArrowDownTrayIcon className={`h-4 w-4 ${exportLoading ? 'animate-pulse' : 'group-hover:scale-110'} transition-all`} />
                  </button>
                  <div data-tour="upload-button">
                  <UploadDropdown
                    workspaceId={activeWorkspace.id}
                    onUploadClick={() => openModal()}
                    onGenerateLinkClick={() => setIsGuestLinkOpen(true)}
                    onManageLinksClick={() => setIsManageLinksOpen(true)}
                    onUploadStatusClick={() => router.push('/upload-status')}
                  />
                  </div>
                </div>
              </div>
            </div>

            <FilterChips
              activeFilters={activeFilters}
              filters={decoratedFilters}
              filterConfig={filterConfig}
              onRemove={removeFilter}
              onClearAll={handleClearAll}
              disabled={isClearingAllFilters}
            />
          </div>

          {assets.length === 0 && !loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No assets found for these filters.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleSelectAll}
                  data-tour="select-all"
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
                >
                  <SquaresPlusIcon className="h-4 w-4" />
                  {selectedIds.length === assets.length ? 'Deselect All' : 'Select All on Page'}
                </button>

                {activeFilters.category_paths?.length === 1 && selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkRemoveFromCategory}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-widest"
                  >
                    <FolderIcon className="h-4 w-4" />
                    REMOVE FROM CATEGORY ({selectedIds.length})
                  </button>
                )}
              </div>

              <div data-tour="asset-grid">
              <AssetGrid
                assets={assets}
                onDelete={handleDeleteTrigger}
                onSelect={(id) => router.push(`/assets/${id}`)}
                onToggleSelect={handleToggleSelect}
                onDownload={(asset) => setDownloadAsset(asset)}
                selectedIds={Array.from(new Set([...selectedIds, ...marqueeIds]))}
                loading={loading}
                limit={limit}
              />
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      <DashboardTour />

      {isGuestLinkOpen && (
        <GuestUploadLinkDialog
          workspaceId={activeWorkspace.id}
          onClose={() => setIsGuestLinkOpen(false)}
        />
      )}

      {isManageLinksOpen && (
        <ManageGuestLinksModal
          workspaceId={activeWorkspace.id}
          onClose={() => setIsManageLinksOpen(false)}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {selectedIds.length > 0 && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onSuccess={() => {
            setSelectedIds([]);
            fetchAssets();
          }}
        />
      )}

      {downloadAsset && (
        <DownloadModal
          isOpen={!!downloadAsset}
          onClose={() => setDownloadAsset(null)}
          assetId={downloadAsset.id}
          originalName={downloadAsset.original_name}
          width={downloadAsset.width || null}
          height={downloadAsset.height || null}
          mimeType={downloadAsset.mime_type}
          previewUrl={(downloadAsset.mime_type === 'image/vnd.adobe.photoshop' || downloadAsset.mime_type === 'image/x-photoshop')
            ? downloadAsset.thumbnail_lg_url
            : (downloadAsset.asset_live_url || downloadAsset.thumbnail_lg_url)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
