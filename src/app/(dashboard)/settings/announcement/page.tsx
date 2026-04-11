'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { AnnouncementStyle } from '@/types/announcement';
import { 
  MegaphoneIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function AnnouncementSettingsPage() {
  const { user } = useAuth();
  const customer = user?.customer;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    announcementHeader: '',
    announcementDescription: '',
    announcementStartAt: '',
    announcementEndAt: '',
    announcementStyle: AnnouncementStyle.INFO,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        announcementHeader: customer.announcement_header || '',
        announcementDescription: customer.announcement_description || '',
        announcementStartAt: customer.announcement_start_at ? customer.announcement_start_at.split('T')[0] : '',
        announcementEndAt: customer.announcement_end_at ? customer.announcement_end_at.split('T')[0] : '',
        announcementStyle: (customer.announcement_style as AnnouncementStyle) || AnnouncementStyle.INFO,
      });
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer?.id) return;
    
    setIsLoading(true);
    try {
      await apiFetch(`/customers/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      toast.success('Announcement settings updated successfully');
    } catch (error) {
      console.error('Failed to update announcement:', error);
      toast.error('Failed to update announcement settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClear = async () => {
    if (!customer?.id) return;
    
    setIsLoading(true);
    try {
      const emptyData = {
        announcementHeader: null,
        announcementDescription: null,
        announcementStartAt: null,
        announcementEndAt: null,
        announcementStyle: AnnouncementStyle.INFO,
      };
      
      await apiFetch(`/customers/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify(emptyData),
      });
      
      setFormData({
        announcementHeader: '',
        announcementDescription: '',
        announcementStartAt: '',
        announcementEndAt: '',
        announcementStyle: AnnouncementStyle.INFO,
      });
      
      toast.success('Announcement cleared successfully');
    } catch (error) {
      console.error('Failed to clear announcement:', error);
      toast.error('Failed to clear announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const getStyleColor = (style: AnnouncementStyle) => {
    switch (style) {
      case AnnouncementStyle.CRITICAL: return 'bg-rose-600';
      case AnnouncementStyle.WARNING: return 'bg-amber-500';
      case AnnouncementStyle.INFO: return 'bg-indigo-600';
      default: return 'bg-indigo-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8 p-6 bg-gray-900/40 border border-gray-800 rounded-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <MegaphoneIcon className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Announcement banner</h1>
            <p className="text-gray-400">Use an announcement banner to communicate important information in-app to all members across your organization.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-4 block">Edit the fields below to preview the banner:</label>
            <div className={`p-4 rounded-xl flex items-center gap-4 ${getStyleColor(formData.announcementStyle)}`}>
               {formData.announcementStyle === AnnouncementStyle.CRITICAL && <ExclamationCircleIcon className="h-6 w-6 text-white" />}
               {formData.announcementStyle === AnnouncementStyle.WARNING && <ExclamationTriangleIcon className="h-6 w-6 text-white" />}
               {formData.announcementStyle === AnnouncementStyle.INFO && <InformationCircleIcon className="h-6 w-6 text-white" />}
               <div className="flex-1 overflow-hidden">
                 <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                   {formData.announcementHeader || 'Your Header Here'}
                 </p>
                 <p className="text-sm opacity-90 truncate">
                   {formData.announcementDescription || 'Your announcement description will appear here...'}
                 </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Header<span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.announcementHeader}
                  onChange={(e) => setFormData({...formData, announcementHeader: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. System Maintenance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description<span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.announcementDescription}
                  onChange={(e) => setFormData({...formData, announcementDescription: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Describe the announcement... (markdown supported)"
                />
                <p className="text-xs text-gray-500 mt-2">This field accepts a limited subset of markdown.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Active period</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={formData.announcementStartAt}
                    onChange={(e) => setFormData({...formData, announcementStartAt: e.target.value})}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                  />
                  <span className="text-gray-600">—</span>
                  <input
                    type="date"
                    value={formData.announcementEndAt}
                    onChange={(e) => setFormData({...formData, announcementEndAt: e.target.value})}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
              <div className="space-y-4">
                {[
                  { id: AnnouncementStyle.CRITICAL, label: 'Critical', icon: ExclamationCircleIcon, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
                  { id: AnnouncementStyle.WARNING, label: 'Warning', icon: ExclamationTriangleIcon, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
                  { id: AnnouncementStyle.INFO, label: 'Info', icon: InformationCircleIcon, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' }
                ].map((style) => (
                  <label key={style.id} className="flex items-center gap-4 cursor-pointer group">
                    <input
                      type="radio"
                      name="style"
                      checked={formData.announcementStyle === style.id}
                      onChange={() => setFormData({...formData, announcementStyle: style.id})}
                      className="w-5 h-5 text-indigo-600 bg-gray-900 border-gray-700 focus:ring-indigo-600"
                    />
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${formData.announcementStyle === style.id ? 'border-gray-600 bg-gray-800' : 'border-gray-800 bg-gray-900/40'} min-w-[140px] transition-all group-hover:border-gray-700`}>
                      <style.icon className={`h-6 w-6 ${style.color}`} />
                      <span className="text-sm font-semibold text-gray-200">{style.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
            <button
              onClick={handleClear}
              disabled={isLoading || !customer?.announcement_header}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-700 text-gray-300 font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Clear Banner
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !formData.announcementHeader || !formData.announcementDescription}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
