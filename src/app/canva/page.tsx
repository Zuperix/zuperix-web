'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowPathIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  Squares2X2Icon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { canvaApi, CanvaAsset, CanvaConnection, CanvaExportJob } from '@/services/canva.api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';

type CanvaTab = 'browse' | 'favorites' | 'recent';

const PAGE_SIZE = 30;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function inferCanvaFormatFromUrl(url: string): 'PNG' | 'JPG' | 'PDF' {
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return 'PDF';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'JPG';
  return 'PNG';
}

export default function CanvaMicrofrontendPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();

  const [connection, setConnection] = useState<CanvaConnection | null>(null);
  const [assets, setAssets] = useState<CanvaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fileType, setFileType] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [tab, setTab] = useState<CanvaTab>('browse');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [exportJobs, setExportJobs] = useState<CanvaExportJob[]>([]);

  const [designId, setDesignId] = useState('');
  const [exportDownloadUrl, setExportDownloadUrl] = useState('');
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'PDF'>('PNG');
  const [fileName, setFileName] = useState('');
  const [destinationCategoryId, setDestinationCategoryId] = useState('');
  const [exporting, setExporting] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const isSilverOrHigher = useMemo(() => {
    const plan = (user?.customer?.plan || '').toUpperCase();
    return plan === 'SILVER' || plan === 'GOLD';
  }, [user?.customer?.plan]);

  const workspaceId = activeWorkspace?.id;
  const pendingExports = useMemo(
    () => exportJobs.filter((job) => job.status === 'PENDING' || job.status === 'PROCESSING').length,
    [exportJobs],
  );

  const fetchConnection = useCallback(async () => {
    if (!workspaceId) return;
    const data = await canvaApi.getConnection(workspaceId);
    setConnection(data.connection);
  }, [workspaceId]);

  const fetchCollectionsAndCategories = useCallback(async () => {
    if (!workspaceId) return;
    const data = await canvaApi.getFolders(workspaceId);
    setCollections(data.collections || []);
    setCategories(data.categories || []);
  }, [workspaceId]);

  const fetchFavorites = useCallback(async () => {
    if (!workspaceId || !connection?.id) return [] as CanvaAsset[];
    const data = await canvaApi.getFavorites(workspaceId, connection.id);
    const ids = new Set((data.assets || []).map((asset) => asset.id));
    setFavoriteIds(ids);
    return data.assets || [];
  }, [connection?.id, workspaceId]);

  const fetchRecent = useCallback(async () => {
    if (!workspaceId) return [] as CanvaAsset[];
    const data = await canvaApi.getRecentAssets(workspaceId);
    return data.assets || [];
  }, [workspaceId]);

  const fetchSearchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!workspaceId || !connection?.id) return;
      setLoadingAssets(true);
      try {
        if (tab === 'favorites') {
          const favoriteAssets = await fetchFavorites();
          setAssets(favoriteAssets);
          setHasNext(false);
          return;
        }
        if (tab === 'recent') {
          const recentAssets = await fetchRecent();
          setAssets(recentAssets);
          setHasNext(false);
          return;
        }

        const response = await canvaApi.searchAssets({
          workspace_id: workspaceId,
          q: query || undefined,
          mime_type: fileType || undefined,
          tags: tagsInput || undefined,
          collection_uuids: collectionId || undefined,
          created_at_gte: createdAfter || undefined,
          page: nextPage,
          limit: PAGE_SIZE,
        });

        setAssets((prev) => (replace ? response.assets : [...prev, ...response.assets]));
        setHasNext(response.pagination.has_next);
        setPage(nextPage);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'Failed to load assets'));
      } finally {
        setLoadingAssets(false);
      }
    },
    [
      workspaceId,
      connection?.id,
      tab,
      fetchFavorites,
      fetchRecent,
      query,
      fileType,
      tagsInput,
      collectionId,
      createdAfter,
    ],
  );

  const refreshJobs = useCallback(async () => {
    if (!workspaceId || !connection?.id) return;
    const jobs = await canvaApi.listExports(workspaceId);
    setExportJobs(jobs);
  }, [workspaceId, connection?.id]);

  useEffect(() => {
    if (!workspaceId || !isSilverOrHigher || !user) return;
    fetchConnection().catch((error) => {
      toast.error(error.message || 'Failed to load Canva connection');
    });
  }, [workspaceId, fetchConnection, isSilverOrHigher, user]);

  useEffect(() => {
    if (!workspaceId || !isSilverOrHigher || !user || !connection) return;
    fetchCollectionsAndCategories().catch(() => {
      toast.error('Failed to load folders and collections');
    });
    fetchSearchPage(1, true).catch(() => undefined);
    refreshJobs().catch(() => undefined);
  }, [
    workspaceId,
    connection,
    fetchCollectionsAndCategories,
    fetchSearchPage,
    refreshJobs,
    isSilverOrHigher,
    user,
  ]);

  useEffect(() => {
    if (!workspaceId || !connection || tab !== 'browse') return;
    const id = setTimeout(() => {
      setQuery(searchInput.trim());
    }, 220);
    return () => clearTimeout(id);
  }, [searchInput, tab, workspaceId, connection]);

  useEffect(() => {
    if (!workspaceId || !connection) return;
    fetchSearchPage(1, true).catch(() => undefined);
  }, [workspaceId, connection, query, fileType, tagsInput, collectionId, createdAfter, tab, fetchSearchPage]);

  useEffect(() => {
    if (!hasNext || loadingAssets || tab !== 'browse') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchSearchPage(page + 1, false).catch(() => undefined);
          }
        });
      },
      { rootMargin: '500px' },
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadingAssets, page, tab, fetchSearchPage]);

  useEffect(() => {
    if (!workspaceId || !connection) return;
    const hasActive = exportJobs.some((job) => job.status === 'PENDING' || job.status === 'PROCESSING');
    if (!hasActive) return;
    const id = setInterval(() => {
      refreshJobs().catch(() => undefined);
    }, 4000);
    return () => clearInterval(id);
  }, [workspaceId, connection, exportJobs, refreshJobs]);

  const handleConnectCanva = async () => {
    if (!workspaceId) return;
    try {
      const { auth_url } = await canvaApi.getAuthUrl(workspaceId);
      if (window.parent && window.parent !== window) {
        window.open(auth_url, '_blank', 'noopener,noreferrer');
        toast.info('Complete Canva OAuth in the new tab, then return here.');
      } else {
        window.location.href = auth_url;
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to start Canva connection'));
    }
  };

  const handleDisconnectCanva = async () => {
    if (!connection?.id) return;
    try {
      await canvaApi.disconnect(connection.id);
      setConnection(null);
      setAssets([]);
      toast.success('Canva disconnected');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to disconnect Canva'));
    }
  };

  const handleToggleFavorite = async (assetId: string) => {
    if (!workspaceId || !connection?.id) return;
    try {
      const result = await canvaApi.toggleFavorite(workspaceId, connection.id, assetId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (result.is_favorite) next.add(assetId);
        else next.delete(assetId);
        return next;
      });
      if (tab === 'favorites') {
        const favoriteAssets = await fetchFavorites();
        setAssets(favoriteAssets);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update favorite'));
    }
  };

  const handleInsertAsset = async (asset: CanvaAsset) => {
    if (!workspaceId || !connection?.id) return;
    if (!asset.insert_url) {
      toast.error('This asset is missing a valid insert URL');
      return;
    }

    try {
      await canvaApi.markInsert(workspaceId, connection.id, asset.id);

      const payload = {
        type: 'ZUPERIX_CANVA_INSERT_ASSET',
        asset: {
          id: asset.id,
          name: asset.name,
          mime_type: asset.mime_type,
          url: asset.insert_url,
          thumbnail_url: asset.thumbnail_url,
        },
      };

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(asset.insert_url);
      }

      toast.success('Asset ready for Canva. URL copied as fallback.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to insert asset'));
    }
  };

  const handleExport = async () => {
    if (!workspaceId) return;
    if (!designId.trim() || !exportDownloadUrl.trim()) {
      toast.error('Design ID and download URL are required');
      return;
    }
    try {
      setExporting(true);
      await canvaApi.createExport({
        workspace_id: workspaceId,
        canva_design_id: designId.trim(),
        export_format: exportFormat,
        export_download_url: exportDownloadUrl.trim(),
        file_name: fileName.trim() || undefined,
        destination_category_id: destinationCategoryId || undefined,
      });
      toast.success('Export queued. Processing in background.');
      setDesignId('');
      setExportDownloadUrl('');
      setFileName('');
      await refreshJobs();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to queue export'));
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <ArrowPathIcon className="h-7 w-7 animate-spin text-[#0f5bd8]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#dbe5ff] rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[#0f172a]">Connect your Zuperix account</h1>
          <p className="text-sm text-[#475569] mt-2">
            Sign in to browse DAM assets in Canva and export completed designs back to Zuperix.
          </p>
          <a
            href="/login"
            className="inline-flex items-center mt-5 px-4 py-2 rounded-xl bg-[#0f5bd8] text-white text-sm font-medium hover:bg-[#0b4ec1]"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (!isSilverOrHigher) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#f5e3c2] rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[#0f172a]">Canva integration is on Silver and Gold</h1>
          <p className="text-sm text-[#475569] mt-2">
            Your current plan does not include this integration. Upgrade to Silver or Gold to use Zuperix inside Canva.
          </p>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#dbe5ff] rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[#0f172a]">Select a workspace</h1>
          <p className="text-sm text-[#475569] mt-2">Choose a workspace in Zuperix first, then reopen this Canva app.</p>
          {workspaces.length > 0 && (
            <p className="text-xs text-[#64748b] mt-3">Available: {workspaces.map((ws) => ws.name).join(', ')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-3 md:p-5 text-[#0f172a]">
      <div className="rounded-2xl border border-[#e5eaf2] bg-white px-4 py-3 shadow-sm md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Zuperix for Canva</h1>
            <p className="text-sm text-[#64748b]">Browse assets, insert fast, export back to Zuperix.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs text-[#64748b]">
              {activeWorkspace?.name}
            </span>
            {!connection ? (
              <button
                onClick={handleConnectCanva}
                className="rounded-xl bg-[#0f5bd8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b4ec1]"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnectCanva}
                className="rounded-xl border border-[#e5eaf2] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {!connection ? (
        <div className="rounded-2xl border border-dashed border-[#dbe3ee] bg-white p-8 text-center shadow-sm">
          <CloudArrowUpIcon className="mx-auto h-8 w-8 text-[#0f5bd8]" />
          <h2 className="mt-3 text-base font-semibold">Connect Canva to start</h2>
          <p className="mt-1 text-sm text-[#64748b]">You&apos;ll be able to search assets and export designs back here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <section className="rounded-2xl border border-[#e5eaf2] bg-white shadow-sm">
            <div className="border-b border-[#eef2f7] p-4 md:p-5">
              <div className="flex items-center gap-2 rounded-xl bg-[#f8fafc] p-1">
                {(['browse', 'favorites', 'recent'] as CanvaTab[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setTab(item)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${tab === item ? 'bg-white shadow-sm' : 'text-[#64748b]'}`}
                  >
                    {item === 'browse' ? 'Browse' : item === 'favorites' ? 'Favorites' : 'Recent'}
                  </button>
                ))}
              </div>

              {tab === 'browse' && (
                <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <div className="relative lg:col-span-2">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search assets"
                      className="w-full rounded-xl border border-[#dbe3ee] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#b7c8e3]"
                    />
                  </div>
                  <select
                    value={fileType}
                    onChange={(event) => setFileType(event.target.value)}
                    className="rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                  >
                    <option value="">All types</option>
                    <option value="image/png,image/jpeg,image/webp,image/svg+xml">Images + SVG</option>
                    <option value="video/mp4,video/quicktime,video/webm">Video</option>
                    <option value="application/pdf">PDF</option>
                  </select>
                  <input
                    value={tagsInput}
                    onChange={(event) => setTagsInput(event.target.value)}
                    placeholder="Tags"
                    className="rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                  />
                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <select
                      value={collectionId}
                      onChange={(event) => setCollectionId(event.target.value)}
                      className="rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                    >
                      <option value="">Collections</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={createdAfter}
                      onChange={(event) => setCreatedAfter(event.target.value)}
                      className="rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-5">
              {assets.length === 0 && !loadingAssets ? (
                <div className="grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-[#dbe3ee] bg-[#fbfcfe] text-center">
                  <div>
                    <Squares2X2Icon className="mx-auto h-7 w-7 text-[#94a3b8]" />
                    <p className="mt-2 text-sm font-medium">No assets found</p>
                    <p className="text-sm text-[#64748b]">Try another search or open Favorites.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="overflow-hidden rounded-2xl border border-[#e5eaf2] bg-white">
                      <div className="aspect-square bg-[#f8fafc]">
                        {asset.thumbnail_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={asset.thumbnail_url} alt={asset.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[#cbd5e1]">
                            <PhotoIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-3">
                        <div>
                          <p className="truncate text-sm font-medium" title={asset.name}>{asset.name}</p>
                          <p className="truncate text-[11px] text-[#64748b]">{asset.mime_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleInsertAsset(asset)}
                            className="flex-1 rounded-lg bg-[#0f5bd8] px-3 py-2 text-xs font-medium text-white hover:bg-[#0b4ec1]"
                          >
                            Insert
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(asset.id)}
                            className={`rounded-lg border px-2.5 py-2 ${favoriteIds.has(asset.id) ? 'border-[#f59e0b] bg-[#fff7ed] text-[#d97706]' : 'border-[#dbe3ee] text-[#64748b]'}`}
                          >
                            <HeartIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {loadingAssets && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#64748b]">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading assets...
                </div>
              )}
              <div ref={sentinelRef} />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm">
              <p className="text-sm font-medium">Export to Zuperix</p>
              <p className="mt-1 text-sm text-[#64748b]">Save Canva output with versioning.</p>

              <div className="mt-4 space-y-2">
                <input
                  value={designId}
                  onChange={(event) => setDesignId(event.target.value)}
                  placeholder="Design ID"
                  className="w-full rounded-xl border border-[#dbe3ee] px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                />
                <input
                  value={exportDownloadUrl}
                  onChange={(event) => {
                    const value = event.target.value;
                    setExportDownloadUrl(value);
                    setExportFormat(inferCanvaFormatFromUrl(value));
                  }}
                  placeholder="Download URL"
                  className="w-full rounded-xl border border-[#dbe3ee] px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={exportFormat}
                    onChange={(event) => setExportFormat(event.target.value as 'PNG' | 'JPG' | 'PDF')}
                    className="rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                  >
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                    <option value="PDF">PDF</option>
                  </select>
                  <input
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    placeholder="Filename"
                    className="rounded-xl border border-[#dbe3ee] px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                  />
                </div>
                <select
                  value={destinationCategoryId}
                  onChange={(event) => setDestinationCategoryId(event.target.value)}
                  className="w-full rounded-xl border border-[#dbe3ee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7c8e3]"
                >
                  <option value="">Destination folder</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="mt-3 w-full rounded-xl bg-[#0f5bd8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b4ec1] disabled:opacity-60"
              >
                {exporting ? 'Saving...' : 'Save to Zuperix'}
              </button>
            </div>

            <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Exports</p>
                <span className="text-xs text-[#64748b]">{pendingExports} active</span>
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
                {exportJobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#dbe3ee] bg-[#fbfcfe] p-3 text-sm text-[#64748b]">No exports yet.</p>
                ) : (
                  exportJobs.slice(0, 8).map((job) => (
                    <div key={job.id} className="rounded-xl border border-[#e5eaf2] bg-[#fbfcfe] p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{job.canva_design_id}</p>
                        <span className="text-xs text-[#64748b]">{job.status}</span>
                      </div>
                      {job.failure_reason ? <p className="mt-1 truncate text-xs text-[#dc2626]">{job.failure_reason}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
