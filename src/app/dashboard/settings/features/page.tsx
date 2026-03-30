'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  DocumentTextIcon,
  CursorArrowRaysIcon,
  ShieldCheckIcon,
  ScaleIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  MapPinIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_ocr_enabled: boolean;
  is_text_extraction_enabled: boolean;
  is_geo_tagging_enabled: boolean;
  ocr_last_toggle_at: string | null;
  geo_tagging_last_toggle_at: string | null;
  text_extraction_last_toggle_at: string | null;
  created_at: string;
}

interface LocalSettings {
  is_ocr_enabled: boolean;
  is_text_extraction_enabled: boolean;
  is_geo_tagging_enabled: boolean;
}

export default function ProjectFeaturesPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [localSettings, setLocalSettings] = useState<LocalSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Customer[]>('/customers');
      if (data && data.length > 0) {
        setCustomer(data[0]);
        setLocalSettings({
          is_ocr_enabled: data[0].is_ocr_enabled,
          is_text_extraction_enabled: data[0].is_text_extraction_enabled,
          is_geo_tagging_enabled: data[0].is_geo_tagging_enabled,
        });
      } else {
        setError('No customer settings found.');
      }
    } catch (err: any) {
      console.error('Failed to fetch customer settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const handleToggleLocal = (feature: keyof LocalSettings) => {
    if (!localSettings || !customer) return;

    // Abuse Prevention: 72h check for ENABLING
    const currentValueInDb = feature === 'is_ocr_enabled' 
      ? customer.is_ocr_enabled 
      : feature === 'is_text_extraction_enabled'
        ? customer.is_text_extraction_enabled
        : customer.is_geo_tagging_enabled;

    const lastToggleAt = feature === 'is_ocr_enabled'
      ? customer.ocr_last_toggle_at
      : feature === 'is_text_extraction_enabled'
        ? customer.text_extraction_last_toggle_at
        : customer.geo_tagging_last_toggle_at;

    // If currently OFF in DB and trying to turn ON in Local
    if (!currentValueInDb && !localSettings[feature as keyof typeof localSettings]) {
       if (isFeatureRestricted(lastToggleAt)) {
         const hoursLeft = getHoursRemaining(lastToggleAt);
         toast.error(`Restriction active: Please wait ${hoursLeft} more hours before re-enabling this feature.`);
         return;
       }
    }

    setLocalSettings({
      ...localSettings,
      [feature]: !localSettings[feature as keyof typeof localSettings],
    });
  };

  const isFeatureRestricted = (lastToggleAt: string | null) => {
    if (!lastToggleAt) return false;
    const last = new Date(lastToggleAt).getTime();
    const now = new Date().getTime();
    const threshold = 72 * 60 * 60 * 1000;
    return (now - last) < threshold;
  };

  const getHoursRemaining = (lastToggleAt: string | null) => {
    if (!lastToggleAt) return 0;
    const last = new Date(lastToggleAt).getTime();
    const now = new Date().getTime();
    const threshold = 72 * 60 * 60 * 1000;
    const remaining = threshold - (now - last);
    return Math.ceil(remaining / (60 * 60 * 1000));
  };

  const saveSettings = async () => {
    if (!customer || !localSettings) return;
    
    setIsSaving(true);
    try {
      await apiFetch(`/customers/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isOcrEnabled: localSettings.is_ocr_enabled,
          isTextExtractionEnabled: localSettings.is_text_extraction_enabled,
          isGeoTaggingEnabled: localSettings.is_geo_tagging_enabled,
        }),
      });
      
      toast.success('Settings saved. A single background backfill job has been started to process your assets.');
      await fetchCustomer(); // Refresh to get updated timestamps
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = localSettings && customer && (
    localSettings.is_ocr_enabled !== customer.is_ocr_enabled ||
    localSettings.is_text_extraction_enabled !== customer.is_text_extraction_enabled ||
    localSettings.is_geo_tagging_enabled !== customer.is_geo_tagging_enabled
  );

  const showBackfillWarning = localSettings && customer && (
    (!customer.is_ocr_enabled && localSettings.is_ocr_enabled) ||
    (!customer.is_text_extraction_enabled && localSettings.is_text_extraction_enabled) ||
    (!customer.is_geo_tagging_enabled && localSettings.is_geo_tagging_enabled)
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !customer || !localSettings) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
          {error || 'Settings not available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <Link 
        href="/dashboard/settings"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
      >
        <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <AdjustmentsHorizontalIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Project Features</h1>
              <p className="text-gray-400">Manage advanced processing and AI features for {customer.name}.</p>
            </div>
        </div>

      </div>

      {/* Global Notice - Refined */}
      <div className="mb-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex gap-5 items-start">
        <div className="p-3 bg-blue-500/10 rounded-2xl shrink-0">
          <InformationCircleIcon className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Feature Processing & Policy</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            Advanced features require a one-time project-wide backfill to index your existing assets. 
            To ensure system stability, re-enabling a feature has a 72-hour cooling period once toggled.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* OCR Section */}
        <div className={`bg-gray-900/40 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${localSettings.is_ocr_enabled ? 'border-blue-500/30' : 'border-gray-800'}`}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${localSettings.is_ocr_enabled ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
                        <CursorArrowRaysIcon className={`h-6 w-6 ${localSettings.is_ocr_enabled ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">OCR Engine</h3>
                            {isFeatureRestricted(customer.ocr_last_toggle_at) && !customer.is_ocr_enabled && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                                    <ClockIcon className="h-3 w-3" />
                                    Restricted: {getHoursRemaining(customer.ocr_last_toggle_at)}h left
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">Automatically extract text from images and scanned documents.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleToggleLocal('is_ocr_enabled')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        localSettings.is_ocr_enabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        localSettings.is_ocr_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
            </div>
            <div className="p-4 bg-blue-500/5 px-6">
                <p className="text-xs text-blue-400/80 leading-relaxed font-medium">
                    When enabled, all uploaded images will be processed through the OCR engine to enable full-text searching of image content.
                </p>
            </div>
        </div>

        {/* Text Extraction Section */}
        <div className={`bg-gray-900/40 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${localSettings.is_text_extraction_enabled ? 'border-purple-500/30' : 'border-gray-800'}`}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${localSettings.is_text_extraction_enabled ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                        <DocumentTextIcon className={`h-6 w-6 ${localSettings.is_text_extraction_enabled ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">Full Text Extraction</h3>
                            {isFeatureRestricted(customer.text_extraction_last_toggle_at) && !customer.is_text_extraction_enabled && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                                    <ClockIcon className="h-3 w-3" />
                                    Restricted: {getHoursRemaining(customer.text_extraction_last_toggle_at)}h left
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">Extract selectable text from PDF and Word documents.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleToggleLocal('is_text_extraction_enabled')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        localSettings.is_text_extraction_enabled ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        localSettings.is_text_extraction_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
            </div>
            <div className="p-4 bg-purple-500/5 px-6">
                <p className="text-xs text-purple-400/80 leading-relaxed font-medium">
                    Enabling this will allow the system to parse and index the internal text content of .pdf and .docx files for deep search capabilities.
                </p>
            </div>
        </div>

        {/* Geo-Tagging Section */}
        <div className={`bg-gray-900/40 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${localSettings.is_geo_tagging_enabled ? 'border-emerald-500/30' : 'border-gray-800'}`}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${localSettings.is_geo_tagging_enabled ? 'bg-emerald-500/20' : 'bg-gray-800'}`}>
                        <MapPinIcon className={`h-6 w-6 ${localSettings.is_geo_tagging_enabled ? 'text-emerald-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">Geo-Tagging</h3>
                            {isFeatureRestricted(customer.geo_tagging_last_toggle_at) && !customer.is_geo_tagging_enabled && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                                    <ClockIcon className="h-3 w-3" />
                                    Restricted: {getHoursRemaining(customer.geo_tagging_last_toggle_at)}h left
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">Extract and display location data from asset metadata.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleToggleLocal('is_geo_tagging_enabled')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        localSettings.is_geo_tagging_enabled ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        localSettings.is_geo_tagging_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
            </div>
            <div className="p-4 bg-emerald-500/5 px-6">
                <p className="text-xs text-emerald-400/80 leading-relaxed font-medium">
                    When enabled, the system will automatically process GPS coordinates and location information embedded in images and videos.
                </p>
            </div>
        </div>

        {/* Quotas / Plan Info */}
        <div className="bg-gray-900/20 border border-gray-800/60 border-dashed rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between opacity-80">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                    <ScaleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Storage Quota</p>
                    <p className="text-sm text-gray-300">100 GB Total (100GB Plan Feature)</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">API Access</p>
                    <p className="text-sm text-gray-300">Enabled for {customer.name}</p>
                </div>
            </div>
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-400 uppercase tracking-tighter">
                {customer.plan} Account
            </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${showBackfillWarning ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                {showBackfillWarning ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">Unsaved Changes</p>
                {showBackfillWarning ? (
                  <p className="text-xs text-amber-400/80 font-medium">Re-processing of existing assets will be triggered.</p>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">Click save to apply your project settings.</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setLocalSettings({
                        is_ocr_enabled: customer.is_ocr_enabled,
                        is_text_extraction_enabled: customer.is_text_extraction_enabled,
                        is_geo_tagging_enabled: customer.is_geo_tagging_enabled,
                    })}
                    className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    disabled={isSaving}
                >
                    Reset
                </button>
                <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg ${
                        showBackfillWarning 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                    {isSaving ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save & Start Backfill'
                    )}
                </button>
            </div>
          </div>
          
          {showBackfillWarning && (
            <div className="mt-3 px-6 text-center">
                <p className="text-[10px] text-gray-500 font-medium italic">
                    * Backfilling processes all your past files. This can be resource intensive and may take up to a few hours for large libraries.
                </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
