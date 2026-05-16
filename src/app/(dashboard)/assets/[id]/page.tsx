'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import CommentsSection from '@/components/CommentsSection';
import AssetHistory from '@/components/AssetHistory';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  TagIcon,
  QueueListIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ShareIcon,
  FolderIcon,
  Square3Stack3DIcon,
  ClockIcon,
  InboxIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ChatBubbleLeftIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  InboxArrowDownIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import DownloadModal from '@/components/DownloadModal';
import { useCategories, Category } from '@/hooks/useCategories';
import { useCollections, Collection as CollectionType } from '@/hooks/useCollections';
import { PermissionGate } from '@/components/PermissionGate';
import SimilarAssets from '@/components/SimilarAssets';
import { Action } from '@/types/auth';
import { toast } from 'sonner';
import WorkflowStartDialog from '@/components/WorkflowStartDialog';
import AssetWorkflowStatus from '@/components/AssetWorkflowStatus';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useAuth } from '@/context/AuthContext';
import { AssetWorkflow, WorkflowTaskStatus } from '@/types/workflow';

import ThreeDPreview from '@/components/ThreeDPreview';
import PdfPreview from '@/components/PdfPreview';
import { splitFileName, joinFileName } from '@/lib/naming';
import ShareAssetModal from '@/components/ShareAssetModal';
import MarkdownPreview from '@/components/MarkdownPreview';
import { is3D } from '@/lib/format';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import StarRating from '@/components/StarRating';
import TranscriptionPanel from '@/components/TranscriptionPanel';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { MicrophoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MetadataFieldInput } from '@/components/metadata/MetadataFieldInput';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { FEATURES } from '@/constants/features';
import gdrive from '@/services/google-drive.api';

interface Field {
  id: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
}

interface MetadataValue {
  field_id: string;
  value: any;
}

type Tab = 'file-info' | 'attachments' | 'versions' | 'comments' | 'history' | 'workflow' | 'transcript';

const STATUS_STYLING: Record<string, string> = {
  draft: 'bg-gray-900/40 text-gray-300 border-white/10 backdrop-blur-md shadow-sm',
  pending_review: 'bg-amber-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-amber-900/10',
  approved: 'bg-emerald-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-emerald-900/10',
  archived: 'bg-rose-500/60 text-white border-white/20 backdrop-blur-md shadow-md shadow-rose-900/10',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived',
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('file-info');
  const [showEmptyFields, setShowEmptyFields] = useState(false);

  // Organization state
  const { categories, refresh: refreshCategories } = useCategories();
  const { collections, refresh: refreshCollections } = useCollections();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showCollectionInput, setShowCollectionInput] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingCollections, setIsManagingCollections] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Versioning state
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  const [activeWorkflow, setActiveWorkflow] = useState<AssetWorkflow | null>(null);
  const isLocked = activeWorkflow?.status === 'ACTIVE';
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);


  // Annotation state
  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ type: string; coordinates: any } | null>(null);
  const [assetComments, setAssetComments] = useState<any[]>([]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    isProcessing: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => { },
    isProcessing: false,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [transcriptionUsage, setTranscriptionUsage] = useState<any>(null);
  const [transcriptionJob, setTranscriptionJob] = useState<any>(null);

  // Facial Recognition state
  const [showFaces, setShowFaces] = useState(false);
  const [editingFaceId, setEditingFaceId] = useState<string | null>(null);
  const [faceNameInput, setFaceNameInput] = useState('');
  const [isFaceTaggingMode, setIsFaceTaggingMode] = useState(false);
  const [faceDragStart, setFaceDragStart] = useState<{ x: number; y: number } | null>(null);
  const [faceDragCurrent, setFaceDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isManualFaceSaving, setIsManualFaceSaving] = useState(false);
  const mediaWrapperRef = useRef<HTMLDivElement>(null);

  const { fetchAssetWorkflow, processTask, loading: processingTask } = useWorkflows();
  const { user } = useAuth();
  const isFaceDetectionEnabled = useFeatureFlag(FEATURES.FACE_DETECTION.key, false);

  const canApprove = () => {
    if (!user || !activeWorkspace || !activeWorkflow || activeWorkflow.status !== 'ACTIVE') return false;
    const stages = activeWorkflow.workflow?.stages || [];
    const currentStage = stages.find(s => s.id === activeWorkflow.current_stage_id);
    if (!currentStage) return false;
    if (!currentStage.approver_role_id) return true;
    const workspaceMember = user.workspace_members?.find(m => m.workspace_id === activeWorkspace.id);
    return workspaceMember?.role_id === currentStage.approver_role_id || user.system_role === 'SUPER_ADMIN';
  };

  const handleQuickAction = async (status: WorkflowTaskStatus) => {
    // Super Admins can process any task for the stage
    const activeTask = activeWorkflow?.tasks?.find(t => {
      const tStageId = t.stage_id || (t as any).stageId;
      const currentStageId = activeWorkflow.current_stage_id || (activeWorkflow as any).currentStageId;
      return tStageId === currentStageId &&
        t.status === WorkflowTaskStatus.PENDING &&
        (user?.system_role === 'SUPER_ADMIN' || (t.user_id || (t as any).userId) === user?.id);
    }) || activeWorkflow?.tasks?.find(t => {
      const tStageId = t.stage_id || (t as any).stageId;
      const currentStageId = activeWorkflow.current_stage_id || (activeWorkflow as any).currentStageId;
      return tStageId === currentStageId && t.status === WorkflowTaskStatus.PENDING;
    });

    if (!activeTask) {
      toast.error('No active task found');
      return;
    }
    try {
      await processTask(activeTask.id, status, 'Approved via Quick Action');
      toast.success(status === WorkflowTaskStatus.APPROVED ? 'Stage approved' : 'Workflow rejected');
      fetchData(); // Refresh all data
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const fetchComments = useCallback(async () => {
    if (!assetId) return;
    try {
      const data = await apiFetch<any[]>(`/assets/${assetId}/comments`);
      setAssetComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  }, [assetId]);

  const fetchAttachments = useCallback(async () => {
    if (!assetId) return;
    try {
      const data = await apiFetch<any[]>(`/assets/${assetId}/attachments`);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  }, [assetId]);

  const fetchTranscript = useCallback(async () => {
    if (!assetId) return;
    try {
      setLoadingTranscript(true);
      const [transcriptData, usageData, jobData] = await Promise.all([
        apiFetch<any>(`/transcription/assets/${assetId}`).catch(() => null),
        apiFetch<any>('/transcription/usage').catch(() => null),
        apiFetch<any>(`/transcription/assets/${assetId}/job`).catch(() => null),
      ]);
      setTranscript(transcriptData);
      setTranscriptionUsage(usageData);
      setTranscriptionJob(jobData);
    } catch (err) {
      console.error('Failed to fetch transcription data:', err);
    } finally {
      setLoadingTranscript(false);
    }
  }, [assetId]);

  const handleGenerateTranscript = async () => {
    if (!assetId) return;
    try {
      setIsGeneratingTranscript(true);
      await apiFetch(`/transcription/assets/${assetId}`, {
        method: 'POST',
        body: JSON.stringify({ workspace_id: activeWorkspace?.id }),
      });
      toast.success('Transcription has been initiated. It should appear here in a few minutes.');

      // Refresh to show "Processing" state immediately
      fetchTranscript();

      // Auto refresh in 30s as a courtesy
      setTimeout(fetchTranscript, 30000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start transcription');
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleAssignFace = async (faceId: string, personName: string) => {
    if (!personName.trim()) return;
    try {
      await apiFetch(`/assets/${assetId}/faces/${faceId}/person`, {
        method: 'PATCH',
        body: JSON.stringify({ person_name: personName.trim() })
      });
      toast.success('Face tagged successfully');
      setEditingFaceId(null);
      setFaceNameInput('');
      fetchData(); // Refresh asset to get updated faces
    } catch (err: any) {
      toast.error(err.message || 'Failed to tag face');
    }
  };

  const handleUnassignFace = async (faceId: string) => {
    try {
      await apiFetch(`/assets/${assetId}/faces/${faceId}/person`, {
        method: 'DELETE'
      });
      toast.success('Face tag removed');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove tag');
    }
  };

  const handleManualFaceSave = async () => {
    if (!faceDragStart || !faceDragCurrent || !asset) return;

    const rect = mediaWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Normalize coordinates relative to media wrapper
    const x1 = Math.min(faceDragStart.x, faceDragCurrent.x) - rect.left;
    const y1 = Math.min(faceDragStart.y, faceDragCurrent.y) - rect.top;
    const x2 = Math.max(faceDragStart.x, faceDragCurrent.x) - rect.left;
    const y2 = Math.max(faceDragStart.y, faceDragCurrent.y) - rect.top;

    // Scale to original dimensions
    const scaleX = asset.width / rect.width;
    const scaleY = asset.height / rect.height;

    const boundingBox = [
      Math.round(x1 * scaleX),
      Math.round(y1 * scaleY),
      Math.round(x2 * scaleX),
      Math.round(y2 * scaleY)
    ];

    try {
      setIsManualFaceSaving(true);
      const name = prompt('Name this person (optional):');

      await apiFetch(`/assets/${assetId}/faces`, {
        method: 'POST',
        body: JSON.stringify({
          bounding_box: boundingBox,
          person_name: name || undefined
        })
      });

      toast.success('Manual face tag added');
      setIsFaceTaggingMode(false);
      setFaceDragStart(null);
      setFaceDragCurrent(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save manual face tag');
    } finally {
      setIsManualFaceSaving(false);
    }
  };

  const handleReprocessFaces = async () => {
    try {
      await apiFetch(`/assets/${assetId}/process/faces`, { method: 'POST' });
      toast.success('AI face detection triggered. Refresh in a few moments.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger AI detection');
    }
  };

  const fetchData = useCallback(async () => {
    if (!activeWorkspace || !assetId) return;
    try {
      setLoading(true);
      setError('');

      const assetData = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(assetData);
      setSelectedCategoryIds(assetData.categories?.map((c: any) => c.id) || []);
      setSelectedCollectionIds(assetData.collections?.map((c: any) => c.id) || []);

      const [fieldDefs, currentValues, workflowData] = await Promise.all([
        apiFetch<Field[]>(`/workspaces/${activeWorkspace.id}/metadata/fields?asset_id=${assetId}`),
        apiFetch<MetadataValue[]>(`/assets/${assetId}/metadata`),
        fetchAssetWorkflow(assetId).catch(() => null),
        fetchComments(),
        fetchAttachments()
      ]);


      setFields(fieldDefs);
      setActiveWorkflow(workflowData);
      const valueMap: Record<string, any> = {};
      currentValues.forEach(v => {
        if (v.field_id && v.field_id !== 'undefined') {
          valueMap[v.field_id] = v.value;
        }
      });
      setValues(valueMap);
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 404 || err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setIsNotFound(true);
      } else {
        setError('Failed to load asset details');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assetId, activeWorkspace, fetchComments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateCompletion = () => {
    if (!asset || fields.length === 0) return 100;

    // Custom metadata fields only
    const filledCustomCount = fields.filter(field => {
      const val = values[field.id];
      return val !== undefined && val !== null && val !== '';
    }).length;

    return Math.round((filledCustomCount / fields.length) * 100);
  };

  useEffect(() => {
    if (activeTab === 'transcript' && !transcript) {
      fetchTranscript();
    }
  }, [activeTab, transcript, fetchTranscript]);

  // Fetch all workspace tags for autocomplete
  useEffect(() => {
    const fetchWorkspaceTags = async () => {
      if (!activeWorkspace) return;
      try {
        const tags = await apiFetch<any[]>(`/workspaces/${activeWorkspace.id}/tags`);
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to fetch workspace tags', err);
      }
    };
    fetchWorkspaceTags();
  }, [activeWorkspace]);

  // Filter suggestions as user types
  useEffect(() => {
    if (!tagInput.trim()) {
      setFilteredSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    const currentTagNames = (asset?.tags || []).map((t: any) => t.name.toLowerCase());
    const filtered = availableTags.filter(tag =>
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !currentTagNames.includes(tag.name.toLowerCase())
    );

    setFilteredSuggestions(filtered);
    setShowTagSuggestions(filtered.length > 0);
  }, [tagInput, availableTags, asset?.tags]);

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveMetadata = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const entries = Object.entries(values)
        .filter(([key, value]) => key && key !== 'undefined' && value !== undefined && !key.startsWith('_'))
        .map(([fieldId, value]) => ({
          field_id: fieldId,
          value,
        }));

      // Update metadata
      await apiFetch(`/assets/${assetId}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ entries }),
      });

      // Update organization
      await apiFetch(`/assets/${assetId}/organization`, {
        method: 'PUT',
        body: JSON.stringify({
          category_ids: selectedCategoryIds,
          collection_ids: selectedCollectionIds
        })
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchData(); // Refresh to get updated organization labels
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateAsset = async (updates: { original_name?: string; status?: string; release_date?: string | null; expiration_date?: string | null }) => {
    if (!assetId) return;
    try {
      setSaving(true);
      await apiFetch(`/assets/${assetId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      // Refresh asset data
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update asset:', err);
      toast.error(err.message || 'Failed to update asset details');
    } finally {
      setSaving(false);
    }
  };

  const handleStartNameEdit = () => {
    if (isLocked) {
      toast.error('Asset is locked during active workflow');
      return;
    }
    const { basename } = splitFileName(asset?.original_name || '');
    setTempName(basename);
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleSaveNameEdit = async () => {
    const { basename, extension } = splitFileName(asset?.original_name || '');

    if (!tempName.trim() || tempName === basename) {
      handleCancelNameEdit();
      return;
    }

    try {
      setIsSavingName(true);
      const newFullName = joinFileName(tempName.trim(), extension);
      await handleUpdateAsset({ original_name: newFullName });
      setIsEditingName(false);
      toast.success('Asset renamed successfully');
    } catch (err) {
      toast.error('Failed to rename asset');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCopyFilename = () => {
    if (!asset?.original_name) return;
    navigator.clipboard.writeText(asset.original_name);
    toast.success('Filename copied to clipboard');
  };

  const handleRate = async (rating: number) => {
    if (!assetId) return;
    try {
      const result = await apiFetch<any>(`/assets/${assetId}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rating })
      });
      setAsset((prev: any) => ({
        ...prev,
        average_rating: result.average_rating,
        total_ratings: result.total_ratings,
        user_rating: rating
      }));
      toast.success('Rating updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update rating');
    }
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      confirmText: 'Delete permanently',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isProcessing: true }));
        try {
          await apiFetch(`/assets/${assetId}`, { method: 'DELETE' });
          toast.success('Asset deleted successfully');
          router.push('/');
        } catch (err) {
          toast.error('Failed to delete asset');
          setConfirmModal(prev => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
      isProcessing: false,
    });
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleToggleCategory = (id: string) => {
    if (isLocked) {
      toast.error('Asset is locked during active workflow');
      return;
    }
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleToggleCollection = (id: string) => {
    if (isLocked) {
      toast.error('Asset is locked during active workflow');
      return;
    }
    setSelectedCollectionIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const resp = await apiFetch<any>(`/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), workspace_id: activeWorkspace?.id })
      });
      await refreshCategories();
      setSelectedCategoryIds(prev => [...prev, resp.id]);
      setNewCategoryName('');
      setShowCategoryInput(false);
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const resp = await apiFetch<any>(`/collections`, {
        method: 'POST',
        body: JSON.stringify({ name: newCollectionName.trim(), workspace_id: activeWorkspace?.id })
      });
      await refreshCollections();
      setSelectedCollectionIds(prev => [...prev, resp.id]);
      setNewCollectionName('');
      setShowCollectionInput(false);
    } catch (err) {
      toast.error('Failed to create collection');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleAddTag = async (e?: React.FormEvent, nameOverride?: string) => {
    if (e) e.preventDefault();
    const tagName = (nameOverride || tagInput).trim();
    if (!tagName || !activeWorkspace) return;

    setIsAddingTag(true);
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/assets/${assetId}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tags: [tagName] })
      });
      // Refresh asset to get updated tags
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
      setTagInput('');
    } catch (err: any) {
      console.error('Failed to add tag:', err);
      toast.error(err.message || 'Failed to add tag');
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!activeWorkspace) return;
    try {
      await apiFetch(`/workspaces/${activeWorkspace.id}/assets/${assetId}/tags`, {
        method: 'DELETE',
        body: JSON.stringify({ tags: [tagName] })
      });
      // Refresh asset to get updated tags
      const updatedAsset = await apiFetch<any>(`/assets/${assetId}`);
      setAsset(updatedAsset);
    } catch (err: any) {
      console.error('Failed to remove tag:', err);
      toast.error(err.message || 'Failed to remove tag');
    }
  };

  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetId) return;

    setIsUploadingVersion(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (versionNotes.trim()) {
        formData.append('notes', versionNotes.trim());
      }

      await apiFetch(`/assets/${assetId}/versions`, {
        method: 'POST',
        body: formData,
      });

      setSuccess(true);
      setVersionNotes('');
      setShowVersionUpload(false);
      setTimeout(() => setSuccess(false), 3000);
      fetchData(); // Refresh to get new version in list
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload new version');
    } finally {
      setIsUploadingVersion(false);
      if (versionFileInputRef.current) versionFileInputRef.current.value = '';
    }
  };

  const handleRevert = async (versionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revert to Version',
      message: 'Are you sure you want to revert to this version? A new version will be created reflecting this state.',
      confirmText: 'Revert',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isProcessing: true }));
        try {
          await apiFetch(`/assets/${assetId}/versions/${versionId}/revert`, {
            method: 'POST',
          });
          toast.success('Version reverted successfully');
          fetchData();
        } catch (err: any) {
          toast.error(err.message || 'Failed to revert version');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
      isProcessing: false,
    });
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetId) return;

    setIsUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiFetch(`/assets/${assetId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      toast.success('Attachment uploaded');
      fetchAttachments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Attachment',
      message: 'Are you sure you want to remove this attachment? This action cannot be undone.',
      confirmText: 'Remove',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isProcessing: true }));
        try {
          await apiFetch(`/assets/attachments/${attachmentId}`, {
            method: 'DELETE',
          });
          toast.success('Attachment removed');
          fetchAttachments();
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove attachment');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
      isProcessing: false,
    });
  };


  const handleAssetClick = (e: React.MouseEvent) => {
    if (!annotationMode || !mediaWrapperRef.current) return;

    const rect = mediaWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Safety check: coordinates should be within 0-100
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    setPendingAnnotation({
      type: 'point',
      coordinates: { x, y }
    });

    // Switch to comments tab to focus the input
    setActiveTab('comments');
  };

  const getFaceColor = (index: number, faceId?: string) => {
    if (faceId === editingFaceId) return '#fbbf24'; // amber-400 for editing

    const palette = asset?.color_palette || [];
    if (palette.length > 0) {
      return palette[index % palette.length];
    }

    // Default high-contrast colors
    const colors = [
      '#ec4899', // pink-500
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#8b5cf6', // violet-500
      '#f43f5e', // rose-500
      '#06b6d4', // cyan-500
    ];
    return colors[index % colors.length];
  };

  if (isNotFound) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-[#0f111a] overflow-hidden">
        {/* Simplified Header */}
        <div className="flex items-center px-6 h-12 bg-gray-50 dark:bg-[#1a1c26] border-b border-gray-200 dark:border-gray-800/60 transition-all">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all group"
          >
            <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-12">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 blur-[100px] rounded-full" />

            {/* 404 Illustration placeholder/Card */}
            <div className="relative flex items-center justify-center w-32 h-32 md:w-48 md:h-48 bg-white dark:bg-[#151720] rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-700">
              <div className="flex flex-col items-center gap-4">
                <ExclamationTriangleIcon className="w-16 h-16 md:w-24 md:h-24 text-blue-500 opacity-80" />
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/30 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Asset Not Found
              </h2>
              <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full animate-in grow-x duration-1000 delay-300" />
            </div>

            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              We couldn&apos;t find the asset you&apos;re looking for. It might have been relocated, deleted, or you may need elevated permissions to access it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <button
                onClick={() => router.back()}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Go Back
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent dark:border-white/10 flex items-center justify-center gap-2"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Search Assets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fb] dark:bg-[#0f111a] gap-4">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Asset Details</p>
      </div>
    );
  }

  const flattenedCategories = flattenCategories(categories);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0f111a] overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Search Header Bar */}
      <div className="flex items-center px-6 h-12 bg-gray-50 dark:bg-[#1a1c26] border-b border-gray-200 dark:border-gray-800/60 transition-all">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all group"
        >
          <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Search results
        </button>
      </div>

      <header className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-[#0f111a] border-b border-gray-200 dark:border-gray-800/60 sticky top-16 z-30 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 md:gap-3 group/title">
            {isEditingName ? (
              <div className="flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/10 p-1 px-2 rounded-xl ring-2 ring-blue-500/50 flex-1 max-w-2xl animate-in slide-in-from-left-2 duration-200">
                <input
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNameEdit();
                    if (e.key === 'Escape') handleCancelNameEdit();
                  }}
                  onBlur={handleSaveNameEdit}
                  disabled={isSavingName}
                  className="bg-transparent border-none outline-none text-lg md:text-xl font-bold text-blue-900 dark:text-blue-100 flex-1 min-w-0"
                  placeholder="Filename"
                />
                <span className="text-lg md:text-xl font-bold text-blue-400 dark:text-blue-500 opacity-60 flex-none px-1">
                  {splitFileName(asset?.original_name || '').extension}
                </span>
                {isSavingName && (
                  <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin flex-none" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3 group/title flex-1 min-w-0">
                <h1
                  onClick={handleStartNameEdit}
                  className="text-lg md:text-xl font-extrabold truncate leading-tight text-blue-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Click to rename"
                >
                  {asset?.original_name || 'Asset Details'}
                </h1>
                <button
                  onClick={handleStartNameEdit}
                  className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all"
                  title="Rename Asset"
                >
                  <PencilIcon className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleCopyFilename}
                  className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-all"
                  title="Copy Filename"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}

            {asset?.status && (
              <span className={`px-2 py-0.5 shrink-0 rounded-lg text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${STATUS_STYLING[asset.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {STATUS_LABELS[asset.status] || asset.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </PermissionGate>
          <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
            <button
              onClick={handleSaveMetadata}
              disabled={saving || isLocked}
              className={`px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${success
                ? 'bg-green-500 text-white shadow-green-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                } disabled:opacity-50`}
              title={isLocked ? 'Asset is locked during active workflow' : 'Save Changes'}
            >
              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : success ? <CheckIcon className="h-4 w-4" /> : null}
              <span className="hidden sm:inline">{saving ? 'Saving...' : success ? 'Saved' : 'Save Changes'}</span>
              <span className="sm:hidden">{saving ? '...' : success ? 'OK' : 'Save'}</span>
            </button>
          </PermissionGate>
        </div>
      </header>

      {isLocked && (
        <div className="sticky top-[112px] md:top-[128px] z-30 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl border-b border-amber-500/20 px-4 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between animate-in slide-in-from-top duration-500 gap-4 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] dark:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="shrink-0 h-10 w-10 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl flex items-center justify-center relative overflow-hidden group border border-amber-500/20">
              <div className="absolute inset-0 bg-amber-400/10 animate-pulse" />
              <LockClosedIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-amber-900 dark:text-amber-100 uppercase tracking-[0.2em] px-2 py-0.5 bg-amber-500/20 dark:bg-amber-500/30 rounded-md border border-amber-500/20">Locked for Review</span>
                <span className="hidden md:inline text-[10px] font-bold text-amber-600/70 dark:text-amber-500/50 uppercase tracking-widest">• Active Workflow</span>
              </div>
              <p className="text-[10px] md:text-xs text-amber-800/80 dark:text-amber-400/80 font-medium">This asset is in review. Edits are restricted until finalized.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {canApprove() ? (
              <>
                <button
                  onClick={() => handleQuickAction(WorkflowTaskStatus.APPROVED)}
                  className="whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Approve Asset
                </button>
                <button
                  onClick={() => handleQuickAction(WorkflowTaskStatus.REJECTED)}
                  className="whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Reject
                </button>
                <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent mx-2" />
              </>
            ) : (
              <div className="px-3 md:px-4 py-2 bg-amber-100/30 dark:bg-amber-900/10 border border-amber-500/10 rounded-xl flex items-center gap-2 mr-2 md:mr-4">
                <ClockIcon className="h-4 w-4 text-amber-500/60 animate-pulse" />
                <span className="text-[8px] md:text-[9px] font-bold text-amber-700/80 dark:text-amber-400/80 uppercase tracking-widest leading-none">Awaiting reviewer</span>
              </div>
            )}
            <button
              onClick={() => setActiveTab('workflow')}
              className="whitespace-nowrap px-4 md:px-5 py-2 md:py-2.5 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-gray-200 dark:border-white/10 flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
            >
              Details
              <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Preview and Summary */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb] dark:bg-[#090a0f] overflow-y-auto custom-scrollbar pt-0 pb-12">
          <div className="p-4 md:p-8 flex flex-col items-center">
            <div className="relative group w-full max-w-4xl bg-white dark:bg-[#151720] rounded-3xl md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 flex items-center justify-center min-h-[300px] md:min-h-[500px] border-2 md:border-4 border-white dark:border-gray-800/30">
              {/* Interactive Action Overlay */}
              <div className="absolute top-8 right-8 flex flex-col gap-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <button
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="p-3.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white dark:border-gray-800 rounded-2xl shadow-2xl text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 transition-all hover:text-blue-600 dark:hover:text-blue-400 group/btn"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Download Asset</div>
                </button>
                <button
                  onClick={handleShare}
                  className="p-3.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white dark:border-gray-800 rounded-2xl shadow-2xl text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 transition-all hover:text-indigo-600 dark:hover:text-indigo-400 group/btn"
                >
                  <ShareIcon className="h-5 w-5" />
                  <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Share Link</div>
                </button>
                <button
                  onClick={() => setAnnotationMode(!annotationMode)}
                  className={`p-3.5 backdrop-blur-2xl border rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group/btn ${annotationMode ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/90 dark:bg-gray-900/90 border-white dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:text-purple-600'}`}
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{annotationMode ? 'Exit Annotation Mode' : 'Add Annotation'}</div>
                </button>
                {isFaceDetectionEnabled && asset?.faces?.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowFaces(!showFaces); }}
                    className={`p-3.5 backdrop-blur-2xl border rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group/btn ${showFaces ? 'bg-pink-600 border-pink-500 text-white' : 'bg-white/90 dark:bg-gray-900/90 border-white dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:text-pink-600'}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{showFaces ? 'Hide Faces' : `Show Faces (${asset.faces.length})`}</div>
                  </button>
                )}
                {/* {isFaceDetectionEnabled && asset?.mime_type?.startsWith('image/') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReprocessFaces(); }}
                    className="p-3.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white dark:border-gray-800 rounded-2xl shadow-2xl text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 transition-all hover:text-blue-600 dark:hover:text-blue-400 group/btn"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                    <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Regenerate AI face detection</div>
                  </button>
                )} */}
                {isFaceDetectionEnabled && asset?.mime_type?.startsWith('image/') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsFaceTaggingMode(!isFaceTaggingMode); if (!isFaceTaggingMode) setShowFaces(true); }}
                    className={`p-3.5 backdrop-blur-2xl border rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group/btn ${isFaceTaggingMode ? 'bg-amber-500 border-amber-400 text-white' : 'bg-white/90 dark:bg-gray-900/90 border-white dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:text-amber-500'}`}
                  >
                    <PlusIcon className="h-5 w-5" />
                    <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{isFaceTaggingMode ? 'Cancel Tagging' : 'Add Face Tag'}</div>
                  </button>
                )}
                {asset?.source === 'google_drive' && !asset?.is_imported && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await gdrive.promoteAsset(assetId);
                        toast.success('Asset promotion started! It will be fully imported in a few moments.');
                        fetchData();
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to promote asset');
                      }
                    }}
                    className="p-3.5 bg-blue-600 border border-blue-400 rounded-2xl shadow-2xl text-white hover:scale-110 active:scale-95 transition-all text-white group/btn"
                  >
                    <InboxArrowDownIcon className="h-5 w-5" />
                    <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Promote to Native Asset</div>
                  </button>
                )}
              </div>

              <div
                ref={previewRef}
                onClick={handleAssetClick}
                className={`relative flex items-center justify-center w-full h-full ${annotationMode ? 'cursor-crosshair' : ''}`}
              >
                <div
                  ref={mediaWrapperRef}
                  className="relative inline-block max-w-full"
                >
                  {/* Overlays - Now relative to the actual media content */}

                  {/* Existing Annotation Markers */}
                  {assetComments.filter(c => c.coordinates).map((comment) => (
                    <div
                      key={comment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('comments');
                        setTimeout(() => {
                          const element = document.getElementById(`comment-${comment.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-[#0a0b10]');
                            setTimeout(() => {
                              element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-[#0a0b10]');
                            }, 2000);
                          }
                        }, 100);
                      }}
                      className="absolute group/marker cursor-pointer z-30 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${comment.coordinates.x}%`, top: `${comment.coordinates.y}%` }}
                    >
                      <div className="w-5 h-5 bg-purple-600 border-2 border-white rounded-full shadow-lg hover:scale-125 transition-all flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900/95 backdrop-blur shadow-xl rounded-xl border border-gray-800 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                            {comment.user?.name?.[0] || 'U'}
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{comment.user?.name || 'User'}</span>
                        </div>
                        <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight">{comment.content}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95" />
                      </div>
                    </div>
                  ))}

                  {/* Pending Annotation Marker */}
                  {pendingAnnotation && (
                    <div
                      className="absolute w-6 h-6 bg-yellow-400 border-2 border-white rounded-full shadow-xl transform -translate-x-1/2 -translate-y-1/2 z-40 animate-pulse"
                      style={{ left: `${pendingAnnotation.coordinates.x}%`, top: `${pendingAnnotation.coordinates.y}%` }}
                    />
                  )}

                  {/* Manual Face Tagging Overlay */}
                  {isFaceDetectionEnabled && isFaceTaggingMode && (
                    <div
                      className="absolute inset-0 z-40 cursor-crosshair"
                      onMouseDown={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setFaceDragStart({ x: e.clientX, y: e.clientY });
                        setFaceDragCurrent({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        if (faceDragStart) setFaceDragCurrent({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseUp={() => {
                        if (faceDragStart && faceDragCurrent) {
                          const dist = Math.sqrt(Math.pow(faceDragCurrent.x - faceDragStart.x, 2) + Math.pow(faceDragCurrent.y - faceDragStart.y, 2));
                          if (dist > 10) {
                            handleManualFaceSave();
                          } else {
                            setFaceDragStart(null);
                            setFaceDragCurrent(null);
                          }
                        }
                      }}
                    >
                      {faceDragStart && faceDragCurrent && (
                        <div
                          className="absolute border-2 border-amber-500 bg-amber-500/20 rounded shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                          style={{
                            left: Math.min(faceDragStart.x, faceDragCurrent.x) - (mediaWrapperRef.current?.getBoundingClientRect().left || 0),
                            top: Math.min(faceDragStart.y, faceDragCurrent.y) - (mediaWrapperRef.current?.getBoundingClientRect().top || 0),
                            width: Math.abs(faceDragCurrent.x - faceDragStart.x),
                            height: Math.abs(faceDragCurrent.y - faceDragStart.y),
                          }}
                        />
                      )}
                      <div className="absolute top-4 left-4 bg-amber-600/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur animate-pulse">
                        DRAW A BOX AROUND THE FACE
                      </div>
                    </div>
                  )}

                  {/* Face Annotations */}
                  {isFaceDetectionEnabled && asset?.faces?.map((face: any, idx: number) => {
                    if (!face.bounding_box) return null;
                    const [x1, y1, x2, y2] = face.bounding_box;
                    const imageWidth = asset.width || 1;
                    const imageHeight = asset.height || 1;

                    const left = (x1 / imageWidth) * 100;
                    const top = (y1 / imageHeight) * 100;
                    const width = ((x2 - x1) / imageWidth) * 100;
                    const height = ((y2 - y1) / imageHeight) * 100;

                    const color = getFaceColor(idx, face.id);

                    return (
                      <div
                        key={face.id}
                        className={`absolute border-2 rounded transition-all duration-300 z-20 group/face ${editingFaceId && editingFaceId !== face.id ? 'opacity-30 scale-95 grayscale-[0.3]' : (showFaces || editingFaceId === face.id ? 'opacity-100' : 'opacity-0')} hover:opacity-100 hover:scale-[1.02]`}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                          borderColor: color,
                          boxShadow: editingFaceId === face.id
                            ? `0 0 0 2px rgba(0,0,0,0.4), 0 0 20px ${color}`
                            : `0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3), 0 0 8px ${color}44`
                        }}
                        onClick={(e) => { e.stopPropagation(); setEditingFaceId(face.id); setFaceNameInput(face.person?.name || ''); }}
                      >
                        {/* Badge / Name popover */}
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 whitespace-nowrap z-50 ${top < 20 ? 'top-full mt-2' : 'bottom-full mb-2'
                            } ${editingFaceId === face.id || (showFaces && face.person)
                              ? 'opacity-100 scale-100'
                              : (editingFaceId ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-0 scale-95 group-hover/face:opacity-100 group-hover/face:scale-100')
                            }`}
                        >
                          {editingFaceId === face.id ? (
                            <div className="bg-[#0f111a]/95 border border-white/10 rounded-xl p-1.5 flex items-center gap-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={faceNameInput}
                                  onChange={e => setFaceNameInput(e.target.value)}
                                  placeholder="Name..."
                                  className="bg-white/5 text-white text-[10px] font-bold border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/50 w-28 tracking-wide placeholder:text-gray-500"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleAssignFace(face.id, faceNameInput);
                                    if (e.key === 'Escape') setEditingFaceId(null);
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-1 flex-none border-l border-white/10 pl-1.5 ml-0.5">
                                <button
                                  onClick={() => handleAssignFace(face.id, faceNameInput)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                                  title="Save"
                                >
                                  <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => setEditingFaceId(null)}
                                  className="p-1 text-gray-400 hover:bg-white/10 rounded-md transition-colors"
                                  title="Cancel"
                                >
                                  <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#0f111a]/90 text-white text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1.5 shadow-2xl backdrop-blur-md tracking-widest uppercase border border-white/10">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                              {face.person ? face.person.name : 'Unknown'}
                              {face.person && (
                                <button onClick={(e) => { e.stopPropagation(); handleUnassignFace(face.id); }} className="hover:text-red-400 ml-1 transition-colors opacity-60 hover:opacity-100">
                                  <XMarkIcon className="w-2.5 h-2.5 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {is3D(asset?.mime_type, asset?.original_name) ? (
                    <ThreeDPreview
                      src={asset?.asset_live_url || ''}
                      alt={asset?.original_name}
                      className="w-full h-[60vh] max-h-[70vh]"
                    />
                  ) : (asset?.mime_type === 'text/markdown' || asset?.mime_type === 'application/json') ? (
                    <MarkdownPreview
                      src={asset?.asset_live_url || ''}
                      className="max-w-full max-h-[70vh]"
                    />
                  ) : asset?.mime_type === 'application/pdf' ? (
                    <PdfPreview src={asset?.asset_live_url} alt={asset?.original_name} className="max-w-full max-h-[70vh] rounded-2xl md:rounded-[32px]" />
                  ) : asset?.mime_type?.startsWith('image/') ? (
                    <img
                      src={
                        (asset?.mime_type === 'image/vnd.adobe.photoshop' || asset?.mime_type === 'image/x-photoshop')
                          ? asset?.thumbnail_lg_url
                          : (asset?.asset_live_url || asset?.thumbnail_lg_url)
                      }
                      alt={asset?.original_name}
                      loading="lazy"
                      className="block max-w-full max-h-[70vh] w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-[1.01] pointer-events-none"
                    />
                  ) : asset?.mime_type?.startsWith('video/') ? (
                    <video
                      ref={videoRef}
                      src={asset?.asset_live_url}
                      controls={!annotationMode}
                      className="block max-w-full max-h-[70vh] w-auto h-auto rounded-2xl pointer-events-none"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-8 p-20">
                      <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center shadow-inner">
                        <DocumentIcon className="h-12 w-12 text-blue-500" />
                      </div>
                      <div className="text-center space-y-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{asset?.original_name || asset?.original_filename || asset?.name || 'Untitled Asset'}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{asset?.mime_type?.split('/')[1] || 'FILE'}</span>
                      </div>
                      <button
                        onClick={() => window.open(asset?.asset_live_url, '_blank')}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                      >
                        View Original
                      </button>
                    </div>
                  )}

                  {/* Google Drive Source Indicator */}
                  {asset?.source === 'google_drive' && (
                    <div className="absolute top-6 left-6 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4285F4] text-white rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M7.71 3.502L1.15 15l3.414 6h13.15l6.56-11.498L17.71 3.502H7.71zm1.26 2h7.06l5.41 9.498h-7.06L9 15.002z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {asset.is_imported ? 'Managed via Google Drive' : 'Linked via Google Drive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full max-w-4xl mt-8 mb-20 space-y-8 md:space-y-12">
              {/* Categories & Collections Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <section className="space-y-4 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <FolderIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest leading-none">Categories</label>
                    </div>
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <button
                        onClick={() => setIsManagingCategories(!isManagingCategories)}
                        disabled={isLocked}
                        className={`text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${isManagingCategories ? 'bg-blue-600 text-white shadow-blue-500/20' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'} disabled:opacity-50`}
                        title={isLocked ? 'Locked during workflow' : ''}
                      >
                        {isManagingCategories ? 'Close' : 'Manage'}
                      </button>
                    </PermissionGate>
                  </div>

                  {!isManagingCategories && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {flattenedCategories.filter(c => selectedCategoryIds.includes(c.id)).length === 0 ? (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">No categories assigned</span>
                      ) : (
                        flattenedCategories.filter(c => selectedCategoryIds.includes(c.id)).map(cat => (
                          <span key={cat.id} className="px-3 py-1.5 bg-blue-600/10 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-600 hover:text-white group/tag">
                            {cat.name}
                            <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                              <button
                                onClick={() => handleToggleCategory(cat.id)}
                                disabled={isLocked}
                                className="text-blue-400 group-hover/tag:text-blue-100 disabled:opacity-50"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </PermissionGate>
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {isManagingCategories && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {showCategoryInput ? (
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500/50"
                            placeholder="Category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowCategoryInput(true)}
                          className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-400 hover:text-blue-500 hover:border-blue-500/50 transition-all"
                        >
                          + Create New Category
                        </button>
                      )}

                      <div className="max-h-60 overflow-y-auto custom-scrollbar px-1 py-1">
                        {flattenedCategories.map((cat: any) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          const depth = cat.depth || 0;
                          return (
                            <div key={cat.id} className="relative group/item">
                              {depth > 0 && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800 pointer-events-none"
                                  style={{ marginLeft: `${(depth - 1) * 1.5 + 0.75}rem` }}
                                />
                              )}
                              <div
                                onClick={() => handleToggleCategory(cat.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300'
                                  }`}
                                style={{ marginLeft: `${depth * 1.5}rem` }}
                              >
                                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}>
                                  {cat.name}
                                </span>
                                {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <InboxIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest leading-none">Collections</label>
                    </div>
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <button
                        onClick={() => setIsManagingCollections(!isManagingCollections)}
                        disabled={isLocked}
                        className={`text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${isManagingCollections ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'} disabled:opacity-50`}
                        title={isLocked ? 'Locked during workflow' : ''}
                      >
                        {isManagingCollections ? 'Close' : 'Manage'}
                      </button>
                    </PermissionGate>
                  </div>

                  {!isManagingCollections && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {collections.filter(c => selectedCollectionIds.includes(c.id)).length === 0 ? (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">No collections assigned</span>
                      ) : (
                        collections.filter(c => selectedCollectionIds.includes(c.id)).map(col => (
                          <span key={col.id} className="px-3 py-1.5 bg-indigo-600/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all hover:bg-indigo-600 hover:text-white group/tag">
                            {col.name}
                            <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                              <button
                                onClick={() => handleToggleCollection(col.id)}
                                disabled={isLocked}
                                className="text-indigo-400 group-hover/tag:text-indigo-100 disabled:opacity-50"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </PermissionGate>
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  {isManagingCollections && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {showCollectionInput ? (
                        <form onSubmit={handleCreateCollection} className="flex gap-2">
                          <input
                            autoFocus
                            className="flex-1 bg-gray-50 dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500/50"
                            placeholder="Collection name..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={creatingCollection || !newCollectionName.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowCollectionInput(true)}
                          className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all"
                        >
                          + Create New Collection
                        </button>
                      )}

                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                        {collections.map(col => {
                          const isSelected = selectedCollectionIds.includes(col.id);
                          return (
                            <div
                              key={col.id}
                              onClick={() => handleToggleCollection(col.id)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                            >
                              <span className="text-[11px] font-medium">{col.name}</span>
                              {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Tags & Dates Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <section className="space-y-4 md:space-y-6 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-8 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] group">
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800/60 pb-4">
                    <div className="h-8 w-8 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <TagIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest leading-none">Smart Tags</label>
                  </div>
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {(asset?.tags || []).map((tag: any, i: number) => (
                      <span key={i} className="group/tag flex items-center gap-1.5 px-3 py-2 bg-gray-100/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 rounded-xl text-[11px] font-bold border border-gray-200 dark:border-gray-700/60 hover:border-teal-500/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
                        {tag.name}
                        <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                          <button
                            onClick={() => handleRemoveTag(tag.name)}
                            disabled={isLocked}
                            className="text-gray-400 hover:text-red-500 disabled:opacity-50 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </PermissionGate>
                      </span>
                    ))}
                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <div className="relative w-full mt-2 group/tag-input">
                        <form onSubmit={handleAddTag}>
                          <input
                            ref={tagInputRef}
                            type="text"
                            placeholder={isLocked ? 'Locked during workflow' : "Press Enter to add tag..."}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onFocus={() => {
                              if (filteredSuggestions.length > 0) setShowTagSuggestions(true);
                            }}
                            disabled={isAddingTag || isLocked}
                            className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#0a0b10] border-2 border-transparent focus:border-teal-500/30 dark:focus:border-teal-500/20 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-400/60 ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100/50 dark:hover:bg-[#1a1c26]'}`}
                            title={isLocked ? 'Locked during workflow' : ''}
                          />
                        </form>

                        {showTagSuggestions && (
                          <div
                            ref={suggestionsRef}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1c26] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                          >
                            <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                              <div className="px-3 py-1.5 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Suggestions
                              </div>
                              {filteredSuggestions.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    handleAddTag(undefined, tag.name);
                                    setShowTagSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-gray-300 flex items-center gap-2 group transition-all"
                                >
                                  <TagIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-teal-500" />
                                  <span>{tag.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </PermissionGate>
                  </div>
                </section>

                <section className="space-y-4 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] group">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Ownership & Dates</label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review Status</span>
                      <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                        <div className="relative group/select">
                          <select
                            className={`absolute inset-0 opacity-0 w-full h-full z-10 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            value={asset?.status || ''}
                            onChange={(e) => handleUpdateAsset({ status: e.target.value })}
                            disabled={isLocked}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl text-[11px] font-bold transition-all ${STATUS_STYLING[asset?.status || ''] || 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                            {STATUS_LABELS[asset?.status || ''] || 'Set status'}
                            <ChevronDownIcon className="h-3.5 w-3.5 opacity-50 transition-transform group-hover/select:translate-y-0.5" />
                          </div>
                        </div>
                      </PermissionGate>
                    </div>
                    {[
                      { id: 'release_date', label: 'Release date', value: asset?.release_date },
                      { id: 'expiration_date', label: 'Expiration date', value: asset?.expiration_date },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                        <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                          <div className="relative group/date">
                            <input
                              type="date"
                              className={`absolute inset-0 opacity-0 w-full h-full z-10 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              value={item.value ? new Date(item.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleUpdateAsset({ [item.id]: e.target.value || null })}
                              disabled={isLocked}
                            />
                            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-bold shadow-sm transition-all group-hover/date:border-purple-500/50">
                              {item.value ? new Date(item.value).toLocaleDateString() : 'Set date'}
                              <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          </div>
                        </PermissionGate>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Metadata Section */}
              <section className="space-y-4 md:space-y-6 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-8 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.12)] group">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-800/60 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest leading-none">Custom Metadata</label>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                            style={{ width: `${calculateCompletion()}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                          {calculateCompletion()}% COMPLETE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Show empty</span>
                    <button
                      onClick={() => setShowEmptyFields(!showEmptyFields)}
                      className={`w-8 h-4 rounded-full transition-all relative ${showEmptyFields ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showEmptyFields ? 'left-[17px]' : 'left-[3px]'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {fields
                    .filter(f => showEmptyFields || values[f.id])
                    .map(field => (
                      <div key={field.id}>
                        <MetadataFieldInput
                          field={field}
                          value={values[field.id]}
                          onChange={(val) => updateValue(field.id, val)}
                          disabled={isLocked}
                        />
                      </div>
                    ))}

                  {fields.filter(f => showEmptyFields || values[f.id]).length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px] bg-gray-50/30 dark:bg-gray-900/10">
                      <InformationCircleIcon className="h-12 w-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">No metadata fields populated</p>
                    </div>
                  )}
                </div>
              </section>

              {/* People in Image Section */}
              {isFaceDetectionEnabled && asset?.faces?.length > 0 && asset.faces.some((f: any) => f.person) && (
                <section className="space-y-4 bg-white/80 dark:bg-[#151720]/80 backdrop-blur-xl p-5 md:p-6 rounded-2xl md:rounded-[32px] border border-white dark:border-gray-800 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <svg className="h-4 w-4 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">People in Image</label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {asset.faces.filter((f: any) => f.person).map((face: any) => (
                      <div key={face.id} className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-lg border border-pink-200 dark:border-pink-800/50 text-[11px] font-bold transition-all hover:scale-105 group">
                        {face.person.name}
                        <button onClick={() => handleUnassignFace(face.id)} className="hover:text-pink-500 ml-1 transition-opacity opacity-0 group-hover:opacity-100">
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {asset.faces.filter((f: any) => !f.person).length > 0 && (
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/40 text-gray-500 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed text-[11px] font-bold">
                        {asset.faces.filter((f: any) => !f.person).length} UNNAMED
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleReprocessFaces}
                    className="w-full py-2.5 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-400 hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Re-run AI Detection
                  </button>
                </section>
              )}

              {/* OCR Text Section */}
              {asset?.ocr_text && (
                <section className="space-y-6 bg-white dark:bg-[#151720] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <DocumentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">AI Extracted Text</label>
                  </div>
                  <div className="p-6 bg-gray-50/50 dark:bg-[#0a0b10]/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar selection:bg-blue-500/30">
                      {asset.ocr_text}
                    </div>
                  </div>
                </section>
              )}

              {/* Geo Location Section */}
              {asset?.latitude && asset?.longitude && (
                <section className="space-y-6 bg-white dark:bg-[#151720] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <GlobeAltIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Asset Location</label>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-[400px] w-full relative">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${asset.longitude - 0.01},${asset.latitude - 0.01},${asset.longitude + 0.01},${asset.latitude + 0.01}&layer=mapnik&marker=${asset.latitude},${asset.longitude}`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Coordinates: {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}</span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${asset.latitude}&mlon=${asset.longitude}#map=15/${asset.latitude}/${asset.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      View on OpenStreetMap
                    </a>
                  </div>
                </section>
              )}

              <SimilarAssets assetId={assetId} />
            </div>
          </div>
        </div>

        {/* Floating Mobile Tabs (Mobile only) */}
        <div className="md:hidden fixed bottom-8 left-4 right-4 z-30">
          <div className="bg-gray-900/90 dark:bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/10 dark:border-gray-800/50 p-2 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex items-center gap-1">
            {[
              { id: 'file-info', label: 'Specs', icon: InboxIcon },
              { id: 'workflow', label: 'Workflow', icon: QueueListIcon },
              { id: 'history', label: 'Audit', icon: ClockIcon },
              { id: 'attachments', label: 'Links', icon: Square3Stack3DIcon },
              { id: 'versions', label: 'History', icon: ClockIcon },
              { id: 'comments', label: 'Chat', icon: ChatBubbleLeftIcon },
              ...(asset?.mime_type?.startsWith('video/') || asset?.mime_type?.startsWith('audio/') ? [{ id: 'transcript', label: 'Transcript', icon: MicrophoneIcon }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setIsMobileDrawerOpen(true);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300 relative z-10 ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <tab.icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${activeTab === tab.id && isMobileDrawerOpen ? 'scale-110 text-blue-400' : 'text-gray-600 opacity-60'}`} />
                <span className="truncate max-w-[45px] font-bold text-[9px] uppercase tracking-wider">{tab.label}</span>
                {activeTab === tab.id && isMobileDrawerOpen && (
                  <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-2xl -z-10 animate-in fade-in zoom-in-95 duration-200" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Content Drawer (Mobile only) */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileDrawerOpen(false)} />
            <div className="relative w-full h-[85vh] bg-white dark:bg-[#0f111a] rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 border-t border-white/10">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none mb-1">
                      {activeTab === 'file-info' ? 'Specifications' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Asset Metadata & Activity</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-40">
                {activeTab === 'file-info' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                        <PhotoIcon className="h-5 w-5 text-emerald-500" />
                      </div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Technical specifications</h2>
                    </div>

                    <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                      <div className="bg-gray-50/30 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl mb-6 transition-all hover:bg-white dark:hover:bg-gray-800/60 group/rating border-b-2 hover:border-b-yellow-500/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <StarIconOutline className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rating</span>
                          </div>
                          {asset?.average_rating > 0 && (
                            <div className="flex items-center gap-1.5">
                              <StarSolid className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs font-black text-gray-900 dark:text-gray-100">{Number(asset.average_rating).toFixed(1)}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter ml-1">
                                ({asset.total_ratings} {asset.total_ratings === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-white/40 dark:bg-gray-950/20 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
                          <StarRating
                            value={asset?.user_rating || 0}
                            onRate={handleRate}
                            size="md"
                            interactive={true}
                          />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            {asset?.user_rating > 0 ? `${asset.user_rating} / 5` : 'Rate this'}
                          </span>
                        </div>
                      </div>
                    </PermissionGate>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'Filename', value: asset?.original_name, icon: DocumentIcon, color: 'text-blue-500' },
                        { label: 'Size', value: asset?.size ? `${(asset.size / 1024 / 1024).toFixed(2)} MB` : '0 MB', icon: Square3Stack3DIcon, color: 'text-indigo-500' },
                        { label: 'Dimensions', value: asset?.width && asset?.height ? `${asset.width} × ${asset.height} px` : 'N/A', icon: PhotoIcon, color: 'text-emerald-500' },
                        { label: 'Format', value: asset?.mime_type, icon: InformationCircleIcon, color: 'text-purple-500' },
                        { label: 'Uploaded', value: asset?.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A', icon: ClockIcon, color: 'text-amber-500' },
                        { label: 'Ratio', value: asset?.aspect_ratio?.toFixed(2) || 'N/A', icon: PhotoIcon, color: 'text-emerald-500' },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center justify-between transition-all group/card border-b-2 hover:border-b-blue-500">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50`}>
                              <item.icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight break-all" title={item.value}>{item.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}


                      {asset?.color_palette && asset.color_palette.length > 0 && (
                        <div className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col gap-3 transition-all border-b-2 hover:border-b-indigo-500/50">
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50`}>
                              <SwatchIcon className={`h-5 w-5 text-indigo-500`} />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">Color Palette</span>
                              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                {asset.color_palette.map((color: string, i: number) => (
                                  <div
                                    key={i}
                                    className="h-6 w-12 rounded-lg shadow-sm border border-black/5 dark:border-white/5 shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
                {activeTab === 'attachments' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-medium">Linked attachments and source files.</p>
                      <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                        <button
                          onClick={() => attachmentFileInputRef.current?.click()}
                          disabled={isUploadingAttachment || isLocked}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </PermissionGate>
                    </div>
                    <div className="space-y-4">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <DocumentIcon className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{attachment.original_name}</p>
                              <p className="text-[10px] text-gray-400">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={attachment.asset_live_url} target="_blank" className="p-2 text-gray-400 hover:text-blue-500"><ArrowDownTrayIcon className="h-4 w-4" /></a>
                            <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={isLocked}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </PermissionGate>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'comments' && (
                  <div className="h-full min-h-[500px]">
                    <CommentsSection
                      assetId={assetId}
                      workspaceId={activeWorkspace?.id}
                      pendingAnnotation={pendingAnnotation}
                      onCommentPosted={() => {
                        setPendingAnnotation(null);
                        setAnnotationMode(false);
                        fetchComments();
                      }}
                    />
                  </div>
                )}
                {activeTab === 'history' && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full">
                    <AssetHistory assetId={assetId} />
                  </div>
                )}
                {activeTab === 'workflow' && (
                  <div className="h-full flex flex-col">
                    {activeWorkflow ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-3xl border border-gray-200 dark:border-gray-800">
                        <AssetWorkflowStatus workflow={activeWorkflow} onRefresh={fetchData} />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px] bg-gray-50/20 dark:bg-gray-900/10">
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-full mb-4">
                          <QueueListIcon className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">No Active Workflow</h3>
                        <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px] mb-6">This asset is currently not enrolled in any approval process.</p>
                        <button
                          onClick={() => setIsWorkflowDialogOpen(true)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                          Initiate Workflow
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                          <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">History</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Version Timeline</p>
                        </div>
                      </div>
                      <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                        <button
                          onClick={() => setShowVersionUpload(!showVersionUpload)}
                          disabled={isLocked}
                          className={`p-2 rounded-xl shadow-lg transition-all ${showVersionUpload ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'}`}
                        >
                          <PlusIcon className={`h-4 w-4 transition-transform duration-300 ${showVersionUpload ? 'rotate-45' : ''}`} />
                        </button>
                      </PermissionGate>
                    </div>

                    {showVersionUpload && (
                      <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div
                          onClick={() => versionFileInputRef.current?.click()}
                          className="border-2 border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-all"
                        >
                          <CloudArrowUpIcon className="h-8 w-8 text-amber-500" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Choose a new file</p>
                            <p className="text-[10px] text-gray-500 font-medium">Max 50MB per version</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={versionFileInputRef}
                          className="hidden"
                          onChange={handleUploadNewVersion}
                        />
                        <textarea
                          placeholder="What's changed in this version? (Optional)"
                          value={versionNotes}
                          onChange={(e) => setVersionNotes(e.target.value)}
                          className="w-full bg-white dark:bg-[#0a0b10] border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[100px] transition-all"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      {(asset?.versions || []).map((version: any, index: number) => {
                        const isLatest = index === 0;
                        return (
                          <div
                            key={version.id}
                            className={`group relative bg-white dark:bg-[#151720] border rounded-2xl p-4 transition-all hover:shadow-xl ${isLatest
                              ? 'border-blue-500 dark:border-blue-500/50 shadow-blue-500/5'
                              : 'border-gray-100 dark:border-gray-800'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-4">
                                <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${isLatest ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                  <span className={`text-xs font-bold ${isLatest ? 'text-white' : 'text-gray-400'}`}>
                                    v{version.version_number}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                      {isLatest ? 'Current Version' : `Version ${version.version_number}`}
                                    </span>
                                    {isLatest && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-extrabold uppercase rounded tracking-tighter">Active</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 italic">
                                    {version.notes || 'No change notes provided.'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                                    <span className="flex items-center gap-1">
                                      <ClockIcon className="h-3 w-3" />
                                      {version.created_at ? new Date(version.created_at).toLocaleString() : 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DocumentIcon className="h-3 w-3" />
                                      {(version.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <a
                                  href={version.asset_live_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="View original"
                                >
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                </a>
                                {!isLatest && (
                                  <button
                                    onClick={() => handleRevert(version.id)}
                                    disabled={isLocked}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                                    title={isLocked ? 'Locked during workflow' : 'Revert to this version'}
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {(asset?.versions?.length || 0) === 0 && (
                        <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/20 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                          <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No version history available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'transcript' && (
                  <div className="h-full min-h-[500px]">
                    <TranscriptionPanel
                      transcript={transcript}
                      currentTime={currentTime}
                      assetId={assetId}
                      loading={loadingTranscript}
                      onSeek={(time) => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = time;
                          videoRef.current.play();
                        }
                      }}
                      onGenerate={asset?.mime_type?.startsWith('video/') || asset?.mime_type?.startsWith('audio/') ? handleGenerateTranscript : undefined}
                      isGenerating={isGeneratingTranscript}
                      isProcessing={transcriptionJob?.status === 'pending' || transcriptionJob?.status === 'processing'}
                      quotaExceeded={transcriptionUsage && transcriptionUsage.remaining_seconds <= 0}
                      planRestricted={transcriptionUsage && transcriptionUsage.limit_seconds === 0}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Tabbed Information Panel (Desktop Only) */}
        <div className="hidden md:flex w-4/11 flex-col bg-white dark:bg-[#0a0b10] border-l border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 h-full overflow-hidden">
          {/* Premium Segmented Tab Control */}
          <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-800/60 bg-gray-50/30 dark:bg-[#0a0b10] shrink-0">
            <div className="flex bg-gray-100/80 dark:bg-gray-800/40 p-1 rounded-2xl relative overflow-hidden">
              {[
                { id: 'file-info', label: 'Specs', icon: InboxIcon },
                { id: 'workflow', label: 'Workflow', icon: QueueListIcon },
                { id: 'history', label: 'Audit', icon: ClockIcon },
                { id: 'attachments', label: 'Links', icon: Square3Stack3DIcon },
                { id: 'versions', label: 'History', icon: ClockIcon },
                { id: 'comments', label: 'Chat', icon: ChatBubbleLeftIcon },
                ...(asset?.mime_type?.startsWith('video/') || asset?.mime_type?.startsWith('audio/') ? [{ id: 'transcript', label: 'Transcript', icon: MicrophoneIcon }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 relative z-10 ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                >
                  <tab.icon className={`h-4 w-4 shrink-0 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-blue-500' : 'text-gray-400 opacity-60'}`} />
                  <span className="truncate">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute inset-x-0 inset-y-0.5 bg-white dark:bg-gray-700 shadow-sm rounded-xl -z-10 animate-in fade-in zoom-in-95 duration-200" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {activeTab === 'file-info' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <PhotoIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Technical specifications</h2>
                </div>

                <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                  <div className="bg-gray-50/30 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl mb-6 transition-all hover:bg-white dark:hover:bg-gray-800/60 group/rating border-b-2 hover:border-b-yellow-500/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <StarIconOutline className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rating</span>
                      </div>
                      {asset?.average_rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <StarSolid className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs font-black text-gray-900 dark:text-gray-100">{Number(asset.average_rating).toFixed(1)}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter ml-1">
                            ({asset.total_ratings} {asset.total_ratings === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-white/40 dark:bg-gray-950/20 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
                      <StarRating
                        value={asset?.user_rating || 0}
                        onRate={handleRate}
                        size="md"
                        interactive={true}
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        {asset?.user_rating > 0 ? `${asset.user_rating} / 5` : 'Rate this'}
                      </span>
                    </div>
                  </div>
                </PermissionGate>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Filename', value: asset?.original_name, icon: DocumentIcon, color: 'text-blue-500' },
                    { label: 'Size', value: asset?.size ? `${(asset.size / 1024 / 1024).toFixed(2)} MB` : '0 MB', icon: Square3Stack3DIcon, color: 'text-indigo-500' },
                    { label: 'Dimensions', value: asset?.width && asset?.height ? `${asset.width} × ${asset.height} px` : 'N/A', icon: PhotoIcon, color: 'text-emerald-500' },
                    { label: 'Format', value: asset?.mime_type, icon: InformationCircleIcon, color: 'text-purple-500' },
                    { label: 'Uploaded', value: asset?.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A', icon: ClockIcon, color: 'text-amber-500' },
                    { label: 'Ratio', value: asset?.aspect_ratio?.toFixed(2) || 'N/A', icon: PhotoIcon, color: 'text-emerald-500' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex flex-col gap-2 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none group/card border-b-2 hover:border-b-blue-500">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{item.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate leading-tight" title={item.value}>{item.value}</span>
                    </div>
                  ))}

                  {asset?.color_palette && asset.color_palette.length > 0 && (
                    <div className="col-span-2 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex flex-col gap-3 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none group/card border-b-2 hover:border-b-indigo-500/50">
                      <div className="flex items-center gap-2">
                        <SwatchIcon className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Color Palette</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {asset.color_palette.map((color: string, i: number) => (
                          <div
                            key={i}
                            className="h-7 w-14 rounded-lg shadow-sm border border-black/5 dark:border-white/5 transition-all hover:scale-110 hover:shadow-md cursor-help shrink-0"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'workflow' && activeWorkflow && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <AssetWorkflowStatus workflow={activeWorkflow} onRefresh={fetchData} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full">
                <AssetHistory assetId={assetId} />
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                      <Square3Stack3DIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Linked Assets</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Attachments & Source Files</p>
                    </div>
                  </div>
                  <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                    <button
                      onClick={() => attachmentFileInputRef.current?.click()}
                      disabled={isUploadingAttachment || isLocked}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </PermissionGate>
                </div>

                <input
                  type="file"
                  ref={attachmentFileInputRef}
                  className="hidden"
                  onChange={handleUploadAttachment}
                  disabled={isUploadingAttachment || isLocked}
                />

                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="group relative bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800">
                          <DocumentIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={attachment.original_name}>
                            {attachment.original_name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={attachment.asset_live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                        <PermissionGate action={Action.Delete} subject="Asset" workspaceId={activeWorkspace?.id}>
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            disabled={isLocked}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </div>
                  ))}

                  {attachments.length === 0 && (
                    <div className="p-12 text-center bg-gray-50 dark:bg-[#0a0b10]/40 border border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] animate-in fade-in duration-500">
                      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl mb-6 w-fit mx-auto shadow-inner">
                        <InboxIcon className="h-12 w-12 text-gray-200 dark:text-gray-700" />
                      </div>
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">No attachments yet</h3>
                      <p className="text-[10px] text-gray-500 font-medium max-w-[200px] mx-auto leading-relaxed">Need to store a creative brief, license, or source file? Link them right here.</p>
                      <button
                        onClick={() => attachmentFileInputRef.current?.click()}
                        disabled={isLocked}
                        className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 mx-auto"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Link your first file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'versions' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                      <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">History</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Version Timeline</p>
                    </div>
                  </div>
                  <PermissionGate action={Action.Update} subject="Asset" workspaceId={activeWorkspace?.id}>
                    <button
                      onClick={() => setShowVersionUpload(!showVersionUpload)}
                      disabled={isLocked}
                      className={`p-2 rounded-xl shadow-lg transition-all ${showVersionUpload ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'}`}
                    >
                      <PlusIcon className={`h-4 w-4 transition-transform duration-300 ${showVersionUpload ? 'rotate-45' : ''}`} />
                    </button>
                  </PermissionGate>
                </div>

                {showVersionUpload && (
                  <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div
                      onClick={() => versionFileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-all"
                    >
                      <CloudArrowUpIcon className="h-8 w-8 text-amber-500" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Choose a new file</p>
                        <p className="text-[10px] text-gray-500 font-medium">Max 50MB per version</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={versionFileInputRef}
                      className="hidden"
                      onChange={handleUploadNewVersion}
                    />
                    <textarea
                      placeholder="What's changed in this version? (Optional)"
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      className="w-full bg-white dark:bg-[#0a0b10] border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[100px] transition-all"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {(asset?.versions || []).map((version: any, index: number) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={version.id}
                        className={`group relative bg-white dark:bg-[#151720] border rounded-2xl p-4 transition-all hover:shadow-xl ${isLatest
                          ? 'border-blue-500 dark:border-blue-500/50 shadow-blue-500/5'
                          : 'border-gray-100 dark:border-gray-800'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${isLatest ? 'bg-blue-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                              <span className={`text-xs font-bold ${isLatest ? 'text-white' : 'text-gray-400'}`}>
                                v{version.version_number}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {isLatest ? 'Current Version' : `Version ${version.version_number}`}
                                </span>
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-extrabold uppercase rounded tracking-tighter">Active</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 italic">
                                {version.notes || 'No change notes provided.'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {version.created_at ? new Date(version.created_at).toLocaleString() : 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DocumentIcon className="h-3 w-3" />
                                  {(version.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <a
                              href={version.asset_live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="View original"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </a>
                            {!isLatest && (
                              <button
                                onClick={() => handleRevert(version.id)}
                                disabled={isLocked}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                                title={isLocked ? 'Locked during workflow' : 'Revert to this version'}
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(asset?.versions?.length || 0) === 0 && (
                    <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/20 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                      <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-800 mx-auto mb-4" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No version history available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
                <CommentsSection
                  assetId={assetId}
                  workspaceId={activeWorkspace?.id}
                  pendingAnnotation={pendingAnnotation}
                  onCommentPosted={() => {
                    setPendingAnnotation(null);
                    setAnnotationMode(false);
                    fetchComments();
                  }}
                />
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                      <QueueListIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">Workflow Status</h2>
                  </div>
                  {!activeWorkflow && (
                    <button
                      onClick={() => setIsWorkflowDialogOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Start Workflow
                    </button>
                  )}
                </div>

                {activeWorkflow ? (
                  <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
                    <AssetWorkflowStatus workflow={activeWorkflow} onRefresh={fetchData} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] bg-gray-50/30 dark:bg-gray-900/10">
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-full mb-6">
                      <QueueListIcon className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">No Active Workflow</h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-[240px]">This asset is currently not enrolled in any approval process.</p>
                    <button
                      onClick={() => setIsWorkflowDialogOpen(true)}
                      className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                    >
                      Initiate Workflow
                    </button>
                  </div>
                )}

                <WorkflowStartDialog
                  assetId={assetId}
                  isOpen={isWorkflowDialogOpen}
                  onClose={() => setIsWorkflowDialogOpen(false)}
                  onSuccess={() => {
                    fetchData();
                    toast.success('Workflow initiated successfully!');
                  }}
                />
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col">
                <TranscriptionPanel
                  transcript={transcript}
                  currentTime={currentTime}
                  assetId={assetId}
                  loading={loadingTranscript}
                  onSeek={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                      videoRef.current.play();
                    }
                  }}
                  onGenerate={asset?.mime_type?.startsWith('video/') || asset?.mime_type?.startsWith('audio/') ? handleGenerateTranscript : undefined}
                  isGenerating={isGeneratingTranscript}
                  isProcessing={transcriptionJob?.status === 'pending' || transcriptionJob?.status === 'processing'}
                  quotaExceeded={transcriptionUsage && transcriptionUsage.remaining_seconds <= 0}
                  planRestricted={transcriptionUsage && transcriptionUsage.limit_seconds === 0}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        assetId={assetId}
        originalName={asset?.original_name || 'asset'}
        width={asset?.width}
        height={asset?.height}
        mimeType={asset?.mime_type || 'application/octet-stream'}
        previewUrl={asset?.asset_live_url}
      />
      {asset && (
        <ShareAssetModal
          assetId={assetId}
          originalName={asset.original_name}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      <DeleteConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDeleting={confirmModal.isProcessing}
      />
    </div>
  );
}



function flattenCategories(categories: Category[], depth = 0): any[] {
  let result: any[] = [];
  categories.forEach(cat => {
    result.push({ ...cat, depth });
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children, depth + 1));
    }
  });
  return result;
}
