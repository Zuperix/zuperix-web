import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FilterBucket {
  value: string | number;
  count?: number;
}

interface FilterSidebarProps {
  filters: Record<string, FilterBucket[] | { min: number; max: number; min_as_string?: string; max_as_string?: string }>;
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
}

export default function FilterSidebar({ filters, activeFilters, onFilterChange }: FilterSidebarProps) {
  const friendlyNames: Record<string, string> = {
    mime_type: 'File Type',
    orientation: 'Orientation',
    tags: 'Tags',
    file_extension: 'Extension',
  };

  const getFriendlyName = (key: string) => {
    if (friendlyNames[key]) return friendlyNames[key];
    if (key.startsWith('metadata.')) {
      const parts = key.split('.');
      const clean = parts[1].replace(/_/g, ' ');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAll = () => {
    Object.keys(activeFilters).forEach(key => onFilterChange(key, undefined));
  };

  const handleCheckboxChange = (groupKey: string, value: string | number, checked: boolean) => {
    const currentValues = activeFilters[groupKey] || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: any) => v !== value);
    }
    onFilterChange(groupKey, newValues.length > 0 ? newValues : undefined);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 && Object.values(activeFilters).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  if (!filters || Object.keys(filters).length === 0) return null;

  return (
    <div className="w-72 bg-[#f9fafb] dark:bg-[#0f111a] border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto px-5 py-6 flex flex-col space-y-6 shrink-0">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800/60">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Filters</h2>
        {hasActiveFilters && (
          <button 
            onClick={clearAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex-1 space-y-6">
        {Object.entries(filters).map(([key, data]) => {
          const isExpanded = expanded[key] !== false; // default true

          // Handle numeric/date ranges (stats aggregation)
          if (!Array.isArray(data)) {
            if (data.min === undefined || data.max === undefined) return null;
            
            const isDate = data.min_as_string !== undefined || key.endsWith('_date') || key.endsWith('_at');
            
            return (
              <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-5">
                <button
                  onClick={() => toggleExpand(key)}
                  className="flex w-full items-center justify-between text-sm py-1 font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  {getFriendlyName(key)}
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type={isDate ? "date" : "number"}
                        placeholder={isDate ? "dd/mm/yyyy" : "Min"}
                        step={isDate ? undefined : "any"}
                        value={activeFilters[`${key}[gte]`] || ''}
                        onChange={(e) => onFilterChange(`${key}[gte]`, e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-gray-500 bg-white dark:bg-[#1a1c23] rounded-md text-gray-900 dark:text-red-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                      />
                      <span className="text-gray-400 text-sm">-</span>
                      <input
                        type={isDate ? "date" : "number"}
                        placeholder={isDate ? "dd/mm/yyyy" : "Max"}
                        step={isDate ? undefined : "any"}
                        value={activeFilters[`${key}[lte]`] || ''}
                        onChange={(e) => onFilterChange(`${key}[lte]`, e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-gray-500 bg-white dark:bg-[#1a1c23] rounded-md text-gray-900 dark:text-red-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-500 px-1">
                      <span>{isDate && data.min_as_string ? data.min_as_string.split('T')[0] : Math.round(data.min * 100) / 100}</span>
                      <span>{isDate && data.max_as_string ? data.max_as_string.split('T')[0] : Math.round(data.max * 100) / 100}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const buckets = data as FilterBucket[];
          if (buckets.length === 0) return null;

          return (
            <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-5">
              <button
                onClick={() => toggleExpand(key)}
                className="flex w-full items-center justify-between text-sm py-1 font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                {getFriendlyName(key)}
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-2.5">
                  {buckets.map((bucket) => {
                    const isActive = (activeFilters[key] || []).includes(bucket.value);
                    return (
                      <label key={`${bucket.value}`} className="flex items-center group cursor-pointer justify-between">
                        <div className="flex items-center overflow-hidden pr-2">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => handleCheckboxChange(key, bucket.value, e.target.checked)}
                            className="h-4 w-4 bg-white dark:bg-[#1a1c23] border-gray-300 dark:border-gray-600 rounded text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors outline-none"
                          />
                          <span className="ml-3 text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 truncate transition-colors">
                            {bucket.value}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 rounded-full shrink-0">
                          {bucket.count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
