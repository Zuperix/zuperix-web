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
  MapPinIcon
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
  created_at: string;
}

export default function ProjectFeaturesPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Customer[]>('/customers');
      if (data && data.length > 0) {
        setCustomer(data[0]);
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

  const toggleFeature = async (feature: 'isOcrEnabled' | 'isTextExtractionEnabled' | 'isGeoTaggingEnabled', currentValue: boolean) => {
    if (!customer) return;
    try {
      await apiFetch(`/customers/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [feature]: !currentValue }),
      });
      
      const dbField = feature === 'isOcrEnabled' 
        ? 'is_ocr_enabled' 
        : feature === 'isTextExtractionEnabled' 
          ? 'is_text_extraction_enabled' 
          : 'is_geo_tagging_enabled';
      setCustomer({ ...customer, [dbField]: !currentValue });
      toast.success('Settings updated successfully');
    } catch (err: any) {
      toast.error(`Failed to update settings: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
          {error || 'Settings not available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link 
        href="/dashboard/settings"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
      >
        <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Settings
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-emerald-500/10 rounded-2xl">
          <AdjustmentsHorizontalIcon className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Project Features</h1>
          <p className="text-gray-400">Manage advanced processing and AI features for {customer.name}.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* OCR Section */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                        <CursorArrowRaysIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">OCR Engine</h3>
                        <p className="text-sm text-gray-400">Automatically extract text from images and scanned documents.</p>
                    </div>
                </div>
                <button
                    onClick={() => toggleFeature('isOcrEnabled', customer.is_ocr_enabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        customer.is_ocr_enabled ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        customer.is_ocr_enabled ? 'translate-x-6' : 'translate-x-1'
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
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl">
                        <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Full Text Extraction</h3>
                        <p className="text-sm text-gray-400">Extract selectable text from PDF and Word documents.</p>
                    </div>
                </div>
                <button
                    onClick={() => toggleFeature('isTextExtractionEnabled', customer.is_text_extraction_enabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        customer.is_text_extraction_enabled ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        customer.is_text_extraction_enabled ? 'translate-x-6' : 'translate-x-1'
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
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                        <MapPinIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Geo-Tagging</h3>
                        <p className="text-sm text-gray-400">Extract and display location data from asset metadata.</p>
                    </div>
                </div>
                <button
                    onClick={() => toggleFeature('isGeoTaggingEnabled', customer.is_geo_tagging_enabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${
                        customer.is_geo_tagging_enabled ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gray-700'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        customer.is_geo_tagging_enabled ? 'translate-x-6' : 'translate-x-1'
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
    </div>
  );
}
