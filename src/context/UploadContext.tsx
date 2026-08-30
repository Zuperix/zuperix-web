'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  FileEntry,
  CONCURRENCY,
  MAX_FILES,
  MAX_FILE_SIZE_MB,
  uploadFileXHR,
  DuplicateError,
} from '@/lib/uploadService';
import { toast } from 'sonner';

export interface UploadCounts {
  total: number;
  done: number;
  duplicate: number;
  error: number;
  uploading: number;
  pending: number;
}

interface UploadContextType {
  entries: FileEntry[];
  running: boolean;
  done: boolean;
  isModalOpen: boolean;
  isWidgetMinimized: boolean;
  selectedCategoryId: string;
  selectedVaultId: string;
  initialMetadata: Record<string, unknown>;
  counts: UploadCounts;
  overallProgress: number;

  // Actions
  addFiles: (files: FileList | File[]) => void;
  removeEntry: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  startUpload: () => Promise<void>;
  retryFailed: () => void;
  forceAllDuplicates: () => void;
  openModal: (options?: { categoryId?: string; vaultId?: string }) => void;
  closeModal: () => void;
  minimizeModal: () => void;
  toggleWidgetMinimized: () => void;
  dismissWidget: () => void;
  setSelectedCategoryId: (id: string) => void;
  setSelectedVaultId: (id: string) => void;
  setInitialMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  updateEntry: (id: string, patch: Partial<FileEntry>) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const { activeWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');
  const [initialMetadata, setInitialMetadata] = useState<Record<string, unknown>>({});
  const abortRef = useRef(false);

  // Tab protection: warn on refresh/close while running
  useEffect(() => {
    if (!running) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Uploads are currently in progress. If you leave, your uploads will be cancelled.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running]);

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    setEntries((prev) => {
      const remainingSlots = MAX_FILES - prev.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum limit of ${MAX_FILES} files reached.`);
        return prev;
      }

      const arr = Array.from(files).slice(0, remainingSlots);
      const oversized: string[] = [];
      const valid = arr.filter((f) => {
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          oversized.push(f.name);
          return false;
        }
        return true;
      });

      if (oversized.length > 0) {
        toast.error(`${oversized.length} file(s) exceeded the ${MAX_FILE_SIZE_MB / 1024} GB limit.`);
      }

      const newEntries: FileEntry[] = valid.map((f) => {
        let relativePath: string | undefined = undefined;
        const customFile = f as File & { webkitRelativePath?: string; path?: string };
        const path = customFile.webkitRelativePath || customFile.path;
        if (path) {
          const lastSlash = path.lastIndexOf('/');
          if (lastSlash !== -1) {
            relativePath = path.substring(0, lastSlash);
          }
        }

        return {
          id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()}`,
          file: f,
          status: 'pending',
          progress: 0,
          relativePath,
        };
      });

      return [...prev, ...newEntries];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setEntries((prev) => prev.filter((e) => e.status !== 'done'));
  }, []);

  const clearAll = useCallback(() => {
    if (running) {
      abortRef.current = true;
    }
    setEntries([]);
    setRunning(false);
    setDone(false);
  }, [running]);

  const counts: UploadCounts = useMemo(() => {
    return {
      total: entries.length,
      done: entries.filter((e) => e.status === 'done').length,
      duplicate: entries.filter((e) => e.status === 'duplicate').length,
      error: entries.filter((e) => e.status === 'error').length,
      uploading: entries.filter((e) => e.status === 'uploading').length,
      pending: entries.filter((e) => e.status === 'pending').length,
    };
  }, [entries]);

  const overallProgress = useMemo(() => {
    if (counts.total === 0) return 0;
    const progressSum = entries.reduce((acc, e) => {
      if (e.status === 'done' || e.status === 'duplicate') return acc + 100;
      return acc + (e.progress || 0);
    }, 0);
    return Math.round(progressSum / counts.total);
  }, [entries, counts.total]);

  const startUpload = useCallback(async () => {
    if (!activeWorkspace?.id) {
      toast.error('No active workspace selected.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    abortRef.current = false;
    setRunning(true);
    setDone(false);

    // Minimize modal automatically if user starts from full modal or keep open
    const currentEntries = [...entries];
    const pending = currentEntries.filter(
      (e) => e.status === 'pending' || e.status === 'error' || (e.status === 'duplicate' && e.force)
    );

    if (pending.length === 0) {
      setRunning(false);
      setDone(true);
      return;
    }

    let i = 0;
    const categoryIds = selectedCategoryId ? [selectedCategoryId] : [];
    const vaultId = selectedVaultId || null;

    const next = async (): Promise<void> => {
      if (abortRef.current) return;
      const entry = pending[i++];
      if (!entry) return;

      updateEntry(entry.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        await uploadFileXHR(
          entry.file,
          activeWorkspace.id,
          token,
          (pct) => {
            updateEntry(entry.id, { progress: pct });
          },
          categoryIds,
          vaultId,
          entry.force,
          initialMetadata,
          entry.relativePath
        );
        updateEntry(entry.id, { status: 'done', progress: 100 });
      } catch (err: unknown) {
        if (err instanceof DuplicateError) {
          updateEntry(entry.id, {
            status: 'duplicate',
            progress: 0,
            error: err.message,
            duplicateAsset: err.asset,
          });
        } else {
          const message = err instanceof Error ? err.message : 'Upload failed';
          updateEntry(entry.id, { status: 'error', progress: 0, error: message });
        }
      }

      return next();
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => next());
    await Promise.all(workers);

    setEntries((prev) =>
      prev.map((entry) =>
        entry.status === 'error' || entry.status === 'duplicate'
          ? entry
          : { ...entry, status: 'done', progress: 100 }
      )
    );

    setRunning(false);
    setDone(true);

    // Notify user of completion
    const failedCount = pending.filter((e) => e.status === 'error').length;
    if (failedCount > 0) {
      toast.error(`Upload completed with ${failedCount} errors.`);
    } else {
      toast.success(`Successfully uploaded ${pending.length} asset(s)!`);
      // Dispatch a custom event so active pages (e.g. AssetGrid) can refresh data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zuperix:assets-uploaded'));
      }
    }
  }, [activeWorkspace?.id, entries, selectedCategoryId, selectedVaultId, initialMetadata, updateEntry]);

  const retryFailed = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => (e.status === 'error' ? { ...e, status: 'pending', progress: 0, error: undefined } : e))
    );
    setDone(false);
  }, []);

  const forceAllDuplicates = useCallback(() => {
    setEntries((prev) => prev.map((e) => (e.status === 'duplicate' ? { ...e, force: true } : e)));
    setTimeout(() => {
      startUpload();
    }, 0);
  }, [startUpload]);

  const openModal = useCallback((options?: { categoryId?: string; vaultId?: string }) => {
    if (options?.categoryId) setSelectedCategoryId(options.categoryId);
    if (options?.vaultId) setSelectedVaultId(options.vaultId);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // If uploads are running, automatically keep widget available in bottom-right
    if (running) {
      toast.info('Uploads continuing in background. Keep this browser tab open.');
    }
  }, [running]);

  const minimizeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsWidgetMinimized(false); // expand widget drawer briefly so user sees where it went
  }, []);

  const toggleWidgetMinimized = useCallback(() => {
    setIsWidgetMinimized((prev) => !prev);
  }, []);

  const dismissWidget = useCallback(() => {
    if (running) {
      const confirmCancel = window.confirm(
        'Uploads are currently in progress. Dismissing will cancel all active and pending uploads. Are you sure?'
      );
      if (!confirmCancel) return;
      abortRef.current = true;
    }
    setEntries([]);
    setRunning(false);
    setDone(false);
    setIsWidgetMinimized(true);
  }, [running]);

  const value = useMemo(
    () => ({
      entries,
      running,
      done,
      isModalOpen,
      isWidgetMinimized,
      selectedCategoryId,
      selectedVaultId,
      initialMetadata,
      counts,
      overallProgress,
      addFiles,
      removeEntry,
      clearCompleted,
      clearAll,
      startUpload,
      retryFailed,
      forceAllDuplicates,
      openModal,
      closeModal,
      minimizeModal,
      toggleWidgetMinimized,
      dismissWidget,
      setSelectedCategoryId,
      setSelectedVaultId,
      setInitialMetadata,
      updateEntry,
    }),
    [
      entries,
      running,
      done,
      isModalOpen,
      isWidgetMinimized,
      selectedCategoryId,
      selectedVaultId,
      initialMetadata,
      counts,
      overallProgress,
      addFiles,
      removeEntry,
      clearCompleted,
      clearAll,
      startUpload,
      retryFailed,
      forceAllDuplicates,
      openModal,
      closeModal,
      minimizeModal,
      toggleWidgetMinimized,
      dismissWidget,
      updateEntry,
    ]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
