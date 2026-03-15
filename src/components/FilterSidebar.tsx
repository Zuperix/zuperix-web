import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  FunnelIcon,
  TagIcon,
  VideoCameraIcon,
  PhotoIcon,
  ArrowsPointingOutIcon,
  IdentificationIcon,
  PaintBrushIcon,
  CalendarIcon,
  DocumentIcon,
  ClockIcon,
  Square3Stack3DIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface FilterBucket {
  value: string | number;
  count?: number;
  hexes?: string[];
}

interface FilterSidebarProps {
  filters: Record<string, FilterBucket[] | { min: number; max: number; min_as_string?: string; max_as_string?: string }>;
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
}

function RangeSlider({ 
  min, 
  max, 
  currentMin, 
  currentMax, 
  onChange,
  isDate = false
}: { 
  min: number; 
  max: number; 
  currentMin: number | undefined; 
  currentMax: number | undefined; 
  onChange: (min: number | undefined, max: number | undefined) => void;
  isDate?: boolean;
}) {
  const [localMin, setLocalMin] = useState(currentMin ?? min);
  const [localMax, setLocalMax] = useState(currentMax ?? max);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMin(currentMin ?? min);
    setLocalMax(currentMax ?? max);
  }, [currentMin, currentMax, min, max]);

  const getPercent = (value: number) => ((value - min) / (max - min)) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax - (max - min) * 0.05);
    setLocalMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin + (max - min) * 0.05);
    setLocalMax(value);
  };

  const commit = () => {
    onChange(localMin === min ? undefined : localMin, localMax === max ? undefined : localMax);
  };

  return (
    <div className="px-1 pt-2 pb-4">
      <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
        <div 
          className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
          style={{ 
            left: `${getPercent(localMin)}%`, 
            right: `${100 - getPercent(localMax)}%` 
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={localMin}
          onChange={handleMinChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="absolute w-full h-1.5 -top-0 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={localMax}
          onChange={handleMaxChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="absolute w-full h-1.5 -top-0 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>
      <div className="flex justify-between mt-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Min</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{isDate ? new Date(localMin).toLocaleDateString() : localMin.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Max</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{isDate ? new Date(localMax).toLocaleDateString() : localMax.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, activeFilters, onFilterChange, onClearAll }: FilterSidebarProps) {
  const filterConfig: Record<string, { label: string; icon: any }> = {
    mime_type: { label: 'File Type', icon: Square3Stack3DIcon },
    orientation: { label: 'Orientation', icon: ArrowsPointingOutIcon },
    tags: { label: 'Tags', icon: TagIcon },
    file_extension: { label: 'Extension', icon: DocumentIcon },
    color_palette: { label: 'Colors', icon: PaintBrushIcon },
    aspect_ratio: { label: 'Aspect Ratio', icon: PhotoIcon },
    created_at: { label: 'Upload Date', icon: CalendarIcon },
    release_date: { label: 'Release Date', icon: CalendarIcon },
    expiration_date: { label: 'Expiration', icon: ClockIcon },
  };

  const getGroupConfig = (key: string) => {
    if (filterConfig[key]) return filterConfig[key];
    if (key.startsWith('metadata.')) {
      const parts = key.split('.');
      const clean = parts[1].replace(/_/g, ' ');
      return {
        label: clean.charAt(0).toUpperCase() + clean.slice(1),
        icon: IdentificationIcon
      };
    }
    return {
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: FunnelIcon
    };
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterSearch, setFilterSearch] = useState('');

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAll = () => {
    onClearAll();
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

  const filteredFilterEntries = Object.entries(filters).filter(([key, data]) => {
    if (!filterSearch) return true;
    const { label } = getGroupConfig(key);
    if (label.toLowerCase().includes(filterSearch.toLowerCase())) return true;
    
    // Check inside buckets
    if (Array.isArray(data)) {
      return data.some(b => String(b.value).toLowerCase().includes(filterSearch.toLowerCase()));
    }
    return false;
  });

  return (
    <div className="w-72 bg-[#f9fafb] dark:bg-[#0f111a] border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto px-5 py-6 flex flex-col space-y-6 shrink-0">
      <div className="space-y-4">
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

        {/* Filter Search */}
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Find filter..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-gray-100/50 dark:bg-gray-800/40 border-transparent dark:border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all outline-none"
          />
          {filterSearch && (
            <button 
              onClick={() => setFilterSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 space-y-6">
        {filteredFilterEntries.map(([key, data]) => {
          const isSearchMatchValue = filterSearch && Array.isArray(data) && data.some(b => String(b.value).toLowerCase().includes(filterSearch.toLowerCase()));
          const isExpanded = expanded[key] !== false || !!isSearchMatchValue; // auto-expand on search match

          // Handle numeric/date ranges (stats aggregation)
          if (!Array.isArray(data)) {
            if (data.min === undefined || data.max === undefined) return null;
            
            const isDate = data.min_as_string !== undefined || key.endsWith('_date') || key.endsWith('_at');
            
            const { label, icon: Icon } = getGroupConfig(key);
            
            return (
              <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-6">
                <button
                  onClick={() => toggleExpand(key)}
                  className="flex w-full items-center justify-between text-sm py-2 font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span>{label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-4 px-1">
                    {isDate ? (
                      <div className="space-y-4">
                        <div className="relative group/input">
                          <label className="absolute -top-2 left-2 px-1 bg-[#f9fafb] dark:bg-[#0f111a] text-[10px] font-bold text-gray-400 group-focus-within/input:text-blue-500 transition-colors z-10">FROM</label>
                          <input
                            type="date"
                            value={activeFilters[`${key}[gte]`] || ''}
                            onChange={(e) => onFilterChange(`${key}[gte]`, e.target.value)}
                            className="w-full text-xs px-3 py-2.5 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none appearance-none"
                          />
                        </div>
                        <div className="relative group/input">
                          <label className="absolute -top-2 left-2 px-1 bg-[#f9fafb] dark:bg-[#0f111a] text-[10px] font-bold text-gray-400 group-focus-within/input:text-blue-500 transition-colors z-10">TO</label>
                          <input
                            type="date"
                            value={activeFilters[`${key}[lte]`] || ''}
                            onChange={(e) => onFilterChange(`${key}[lte]`, e.target.value)}
                            className="w-full text-xs px-3 py-2.5 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none appearance-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <RangeSlider
                        min={data.min}
                        max={data.max}
                        currentMin={activeFilters[`${key}[gte]`] ? Number(activeFilters[`${key}[gte]`]) : undefined}
                        currentMax={activeFilters[`${key}[lte]`] ? Number(activeFilters[`${key}[lte]`]) : undefined}
                        onChange={(min, max) => {
                          onFilterChange(`${key}[gte]`, min);
                          onFilterChange(`${key}[lte]`, max);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          }

          const buckets = data as FilterBucket[];
          if (buckets.length === 0) return null;

          const { label, icon: Icon } = getGroupConfig(key);
          if (buckets.length === 0) return null;

          return (
            <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-6">
              <button
                onClick={() => toggleExpand(key)}
                className="flex w-full items-center justify-between text-sm py-2 font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span>{label}</span>
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4">
                  {key === 'color_palette' ? (
                    <div className="grid grid-cols-5 gap-2.5">
                      {buckets
                        .filter(bucket => !filterSearch || String(bucket.value).toLowerCase().includes(filterSearch.toLowerCase()))
                        .map((bucket) => {
                        const hex = String(bucket.value);
                        const clusterHexes = bucket.hexes || [hex];
                        const activeHexes = activeFilters[key] || [];
                        const isActive = clusterHexes.some(h => activeHexes.includes(h));
                        
                        return (
                          <button
                            key={hex}
                            onClick={() => {
                              const nextActive = isActive 
                                ? activeHexes.filter((h: string) => !clusterHexes.includes(h))
                                : Array.from(new Set([...activeHexes, ...clusterHexes]));
                              onFilterChange(key, nextActive.length > 0 ? nextActive : undefined);
                            }}
                            className={`w-full aspect-square rounded-full border-2 transition-all relative group/swatch ${
                              isActive 
                                ? 'border-blue-500 scale-110 shadow-md z-10' 
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/swatch:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                              {hex}
                            </span>
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/20" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {buckets
                        .filter(bucket => !filterSearch || String(bucket.value).toLowerCase().includes(filterSearch.toLowerCase()))
                        .map((bucket) => {
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
