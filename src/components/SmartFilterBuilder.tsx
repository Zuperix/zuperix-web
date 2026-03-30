'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  PlusIcon,
  TagIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface SmartFilterBuilderProps {
  filter: any;
  onChange: (filter: any) => void;
}

const FIELD_OPTIONS = [
  { value: 'mime_type', label: 'File Type', icon: PhotoIcon },
  { value: 'file_extension', label: 'Extension', icon: DocumentIcon },
  { value: 'orientation', label: 'Orientation', icon: SquaresPlusIcon },
  { value: 'status', label: 'Status', icon: CheckBadgeIcon },
];

const VALUE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  mime_type: [
    { value: 'image/', label: 'Images' },
    { value: 'video/', label: 'Videos' },
    { value: 'audio/', label: 'Audio' },
    { value: 'application/pdf', label: 'PDFs' },
  ],
  orientation: [
    { value: 'landscape', label: 'Landscape' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'square', label: 'Square' },
  ],
  status: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'archived', label: 'Archived' },
  ],
};

import { SquaresPlusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function SmartFilterBuilder({ filter = {}, onChange }: SmartFilterBuilderProps) {
  const [activeField, setActiveField] = useState<string | null>(null);

  const addFilterRow = (field: string) => {
    const nextFilter = { ...filter };
    if (!nextFilter[field]) {
      nextFilter[field] = [];
    }
    onChange(nextFilter);
    setActiveField(null);
  };

  const removeFilterRow = (field: string) => {
    const nextFilter = { ...filter };
    delete nextFilter[field];
    onChange(nextFilter);
  };

  const toggleValue = (field: string, value: string) => {
    const nextFilter = { ...filter };
    const currentValues = Array.isArray(nextFilter[field]) ? nextFilter[field] : [];
    
    if (currentValues.includes(value)) {
      nextFilter[field] = currentValues.filter((v: string) => v !== value);
      if (nextFilter[field].length === 0) delete nextFilter[field];
    } else {
      nextFilter[field] = [...currentValues, value];
    }
    
    onChange(nextFilter);
  };

  const setExtension = (field: string, value: string) => {
    const nextFilter = { ...filter };
    if (!value) delete nextFilter[field];
    else nextFilter[field] = value.split(',').map(v => v.trim().toLowerCase());
    onChange(nextFilter);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Smart Matching Rules</h3>
        <p className="text-[10px] text-gray-400 italic">Assets matching any of these criteria will be added.</p>
      </div>

      <div className="space-y-3">
        {Object.entries(filter).map(([field, values]: [string, any]) => {
          const fieldDef = FIELD_OPTIONS.find(f => f.value === field);
          if (!fieldDef) return null;

          return (
            <div key={field} className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-left-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <fieldDef.icon className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{fieldDef.label}</span>
                </div>
                <button onClick={() => removeFilterRow(field)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                  <XMarkIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {VALUE_OPTIONS[field] ? (
                  VALUE_OPTIONS[field].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleValue(field, opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${
                        values.includes(opt.value)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))
                ) : (
                  <input 
                    type="text"
                    placeholder="e.g. jpg, png, mp4"
                    className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue={Array.isArray(values) ? values.join(', ') : values}
                    onBlur={(e) => setExtension(field, e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}

        {Object.keys(filter).length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No rules defined</p>
          </div>
        )}
      </div>

      <div className="relative">
        <button 
          onClick={() => setActiveField(activeField ? null : 'menu')}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-500/50 transition-all group"
        >
          <PlusIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Add Rule</span>
        </button>

        {activeField === 'menu' && (
          <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-2 duration-200">
            {FIELD_OPTIONS.filter(f => !filter[f.value]).map(field => (
              <button
                key={field.value}
                onClick={() => addFilterRow(field.value)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all group"
              >
                <field.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{field.label}</span>
              </button>
            ))}
            {FIELD_OPTIONS.filter(f => !filter[f.value]).length === 0 && (
              <p className="text-center py-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">All rules added</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
