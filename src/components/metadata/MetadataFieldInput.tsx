'use client';

import { MetadataField } from '@/hooks/useMetadataFields';
import { 
  LinkIcon, 
  EnvelopeIcon, 
  HashtagIcon, 
  CalendarIcon, 
  ClockIcon,
  ListBulletIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface MetadataFieldFlexible {
  id: string;
  label: string;
  field_type?: string;
  fieldType?: string;
  options?: any;
  is_required?: boolean;
  isRequired?: boolean;
}

interface Props {
  field: MetadataFieldFlexible;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function MetadataFieldInput({ field, value, onChange, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);
  const type = field.field_type || field.fieldType || 'string';
  const isRequired = field.is_required || field.isRequired;

  const validateUrl = (val: string) => {
    if (!val) return true;
    try {
      if (!val.startsWith('http://') && !val.startsWith('https://')) return false;
      new URL(val);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleChange = (newVal: any) => {
    if (type === 'url') {
      if (!validateUrl(newVal)) {
        setError('Invalid URL format (must start with http:// or https://)');
      } else {
        setError(null);
      }
    } else if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newVal && !emailRegex.test(newVal)) {
        setError('Invalid email format');
      } else {
        setError(null);
      }
    }
    onChange(newVal);
  };

  const id = `field-${field.id}`;

  const renderInput = () => {
    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center h-10 px-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:border-blue-500/30">
            <label className="relative inline-flex items-center cursor-pointer w-full justify-between group" htmlFor={id}>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{value ? 'Enabled' : 'Disabled'}</span>
              <input
                id={id}
                type="checkbox"
                className="sr-only peer"
                checked={value || false}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[16px] after:bg-white after:border-gray-300 dark:after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-sm"></div>
            </label>
          </div>
        );

      case 'date':
        return (
          <div className="relative group">
            <input
              id={id}
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200"
            />
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
        );

      case 'datetime': {
        const toLocalDatetimeStr = (val: any) => {
          if (!val) return '';
          try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } catch {
            return '';
          }
        };
        const dtValue = toLocalDatetimeStr(value);
        return (
          <div className="relative group">
            <input
              id={id}
              type="datetime-local"
              value={dtValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200"
            />
            <ClockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
        );
      }

      case 'enum':
      case 'multi_select':
        const choices = field.options?.choices || [];
        const isMulti = type === 'multi_select';
        
        return (
          <div className="relative group">
            <select
              id={id}
              multiple={isMulti}
              value={isMulti ? (Array.isArray(value) ? value : []) : (value || '')}
              onChange={(e) => {
                if (isMulti) {
                  const options = Array.from(e.target.selectedOptions, (option) => option.value);
                  handleChange(options);
                } else {
                  handleChange(e.target.value);
                }
              }}
              disabled={disabled}
              className={`w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200 appearance-none ${isMulti ? 'min-h-[80px]' : ''}`}
            >
              {!isMulti && <option value="">Select option...</option>}
              {choices.map((choice: string) => (
                <option key={choice} value={choice}>{choice}</option>
              ))}
            </select>
            <ListBulletIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            {!isMulti && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
        );

      case 'url':
        return (
          <div className="relative group">
            <input
              id={id}
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              placeholder="https://example.com"
              className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800/50 border ${error ? 'border-red-500/50 focus:ring-red-500/10' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200`}
            />
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {error ? (
                <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
              ) : value && !error ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="relative group">
            <input
              id={id}
              type="email"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              placeholder="jane@example.com"
              className={`w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800/50 border ${error ? 'border-red-500/50 focus:ring-red-500/10' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200`}
            />
            <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {error ? (
                <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
              ) : value && !error ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          </div>
        );

      case 'integer':
      case 'float':
        return (
          <div className="relative group">
            <input
              id={id}
              type="number"
              step={type === 'float' ? '0.01' : '1'}
              value={value === undefined || value === null ? '' : value}
              onChange={(e) => handleChange(type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
              disabled={disabled}
              placeholder="0"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200"
            />
            <HashtagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
        );

      case 'text':
        return (
          <textarea
            id={id}
            rows={3}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200 resize-none placeholder:text-gray-600"
          />
        );

      default:
        return (
          <input
            id={id}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium dark:text-gray-200 placeholder:text-gray-600"
          />
        );
    }
  };

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between px-0.5">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest group-focus-within:text-blue-500 transition-colors truncate" htmlFor={id}>
          {field.label}
          {isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
        <span className="text-[8px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-md">
          {type.replace('_', ' ')}
        </span>
      </div>
      
      {renderInput()}
      
      {error && (
        <p className="text-[9px] font-bold text-red-500 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
