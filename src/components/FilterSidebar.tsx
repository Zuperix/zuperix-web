import { useState, useRef, useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';
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
  XMarkIcon,
  FolderIcon,
  RectangleGroupIcon,
  StarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';



interface FilterBucket {
  value: string | number;
  label?: string;
  count?: number;
  hexes?: string[];
}

interface TreeBucket extends FilterBucket {
  children: TreeBucket[];
}

function buildTree(buckets: FilterBucket[]): TreeBucket[] {
  const map: Record<string, TreeBucket> = {};
  const roots: TreeBucket[] = [];

  const sortedBuckets = [...buckets].sort((a, b) => String(a.value).localeCompare(String(b.value)));

  sortedBuckets.forEach(bucket => {
    const path = String(bucket.value);
    const parts = path.split('/');
    const label = parts[parts.length - 1];

    const node: TreeBucket = {
      ...bucket,
      label: label,
      children: []
    };

    map[path] = node;

    if (parts.length === 1) {
      roots.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      if (map[parentPath]) {
        map[parentPath].children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  const sortByCountRecursive = (nodes: TreeBucket[]) => {
    nodes.sort((a, b) => (b.count || 0) - (a.count || 0));
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortByCountRecursive(node.children);
      }
    });
  };

  sortByCountRecursive(roots);
  return roots;
}

function RenderCategoryNode({
  bucket,
  depth = 0,
  activeFilters,
  handleCheckboxChange,
  groupKey
}: {
  bucket: TreeBucket;
  depth?: number;
  activeFilters: any;
  handleCheckboxChange: any;
  groupKey: string;
}) {
  const rawActive = activeFilters[groupKey];
  const activeList = Array.isArray(rawActive) ? rawActive : (rawActive ? [rawActive] : []);
  const isExplicitlySelected = activeList.includes(bucket.value);

  // Recursive check for any selected descendant
  const hasSelectedDescendant = (node: TreeBucket): boolean => {
    return node.children.some(child =>
      activeList.includes(child.value) || hasSelectedDescendant(child)
    );
  };

  const showTick = isExplicitlySelected || hasSelectedDescendant(bucket);

  return (
    <div key={String(bucket.value)} className="space-y-1.5">
      <label className="flex items-center group cursor-pointer justify-between">
        <div className="flex items-center overflow-hidden pr-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
          <input
            type="checkbox"
            checked={showTick}
            onChange={(e) => handleCheckboxChange(groupKey, bucket.value, e.target.checked)}
            className={`h-4 w-4 bg-white dark:bg-[#1a1c23] border-gray-300 dark:border-gray-600 rounded text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors outline-none ${!isExplicitlySelected && showTick ? 'opacity-60' : ''}`}
          />
          <span className={`ml-3 text-sm group-hover:text-gray-900 dark:group-hover:text-gray-100 truncate transition-colors ${showTick ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
            {bucket.label}
          </span>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 rounded-full shrink-0">
          {bucket.count}
        </span>
      </label>
      {bucket.children.length > 0 && (
        <div
          className="space-y-1.5 border-l border-gray-200 dark:border-gray-700/50 ml-2"
          style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
        >
          {bucket.children.map(child => (
            <RenderCategoryNode
              key={String(child.value)}
              bucket={child}
              depth={0}
              activeFilters={activeFilters}
              handleCheckboxChange={handleCheckboxChange}
              groupKey={groupKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterSidebarProps {
  filters: Record<string, FilterBucket[] | { min: number; max: number; min_as_string?: string; max_as_string?: string }>;
  activeFilters: Record<string, any>;
  onFilterChange: (keyOrUpdates: string | Record<string, any>, value?: any) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function DateRangePicker({
  currentMin,
  currentMax,
  onChange
}: {
  min: number;
  max: number;
  currentMin: string | undefined;
  currentMax: string | undefined;
  onChange: (min: string | undefined, max: string | undefined) => void;
}) {
  const [from, setFrom] = useState(currentMin || '');
  const [to, setTo] = useState(currentMax || '');

  useEffect(() => {
    setFrom(currentMin || '');
    setTo(currentMax || '');
  }, [currentMin, currentMax]);

  const handleCommit = (newFrom: string, newTo: string) => {
    onChange(newFrom || undefined, newTo || undefined);
  };

  return (
    <div className="space-y-4 px-1 pt-1">
      <div className="flex flex-col gap-3">
        <div
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input) (input as any).showPicker?.();
          }}
          className="group/input relative flex items-center bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40 transition-all cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-3 group-focus-within/input:text-blue-500 transition-colors" />
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                handleCommit(e.target.value, to);
              }}
              className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>

        <div
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input) (input as any).showPicker?.();
          }}
          className="group/input relative flex items-center bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40 transition-all cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-3 group-focus-within/input:text-blue-500 transition-colors" />
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                handleCommit(from, e.target.value);
              }}
              className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>
      </div>

      {(from || to) && (
        <button
          onClick={() => {
            setFrom('');
            setTo('');
            onChange(undefined, undefined);
          }}
          className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 uppercase tracking-widest bg-gray-100/50 dark:bg-gray-800/30 rounded-lg transition-all hover:scale-[0.98] active:scale-95"
        >
          Clear Dates
        </button>
      )}
    </div>
  );
}

function RangeSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange
}: {
  min: number;
  max: number;
  currentMin: number | undefined;
  currentMax: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const [localMin, setLocalMin] = useState(Number(currentMin ?? min));
  const [localMax, setLocalMax] = useState(Number(currentMax ?? max));
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMin(Number(currentMin ?? min));
    setLocalMax(Number(currentMax ?? max));
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
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{localMin.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Max</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{localMax.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, activeFilters, onFilterChange, onClearAll, disabled = false }: FilterSidebarProps) {
  const { isFilterOpen, setIsFilterOpen } = useLayout();
  // ... rest of component
  const filterConfig: Record<string, { label: string; icon: any }> = {
    mime_type: { label: 'File Type', icon: Square3Stack3DIcon },
    status: { label: 'Status', icon: ClockIcon },
    orientation: { label: 'Orientation', icon: ArrowsPointingOutIcon },
    tag_uuids: { label: 'Tags', icon: TagIcon },
    file_extension: { label: 'Extension', icon: DocumentIcon },
    color_palette: { label: 'Colors', icon: PaintBrushIcon },
    aspect_ratio: { label: 'Aspect Ratio', icon: PhotoIcon },
    created_at: { label: 'Upload Date', icon: CalendarIcon },
    lifecycle: { label: 'Asset Lifecycle', icon: ClockIcon },
    category_uuids: { label: 'Categories', icon: FolderIcon },
    category_paths: { label: 'Category', icon: FolderIcon },
    collection_uuids: { label: 'Collections', icon: Square3Stack3DIcon },
    uploaded_by_id: { label: 'Uploaded By', icon: IdentificationIcon },
    average_rating: { label: 'Rating', icon: StarIcon },
    vault_uuids: { label: 'Asset Vaults', icon: LockClosedIcon },
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

  const collapseAll = () => {
    const newExpanded: Record<string, boolean> = {};
    Object.keys(filters).forEach(key => {
      newExpanded[key] = false;
    });
    setExpanded(newExpanded);
  };

  const handleCheckboxChange = (groupKey: string, value: string | number, checked: boolean) => {
    const rawValue = activeFilters[groupKey];
    const currentValues = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);

    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: any) => v !== value);
    }
    onFilterChange(groupKey, newValues.length > 0 ? newValues : undefined);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 && Object.values(activeFilters).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  const ratingTiers = [
    { label: '5 Stars', min: 5, max: 5 },
    { label: '4 Stars & Up', min: 4, max: 5 },
    { label: '3 Stars & Up', min: 3, max: 5 },
    { label: '2 Stars & Up', min: 2, max: 5 },
    { label: '1 Star & Up', min: 1, max: 5 },
  ];

  if (!filters || Object.keys(filters).length === 0) return null;


  const filteredFilterEntries = Object.entries(filters).filter(([key, data]) => {
    // Hide empty array filters
    if (Array.isArray(data) && data.length === 0) return false;

    // Hide date filters if they are empty/01-01-1970
    if (!Array.isArray(data)) {
      // Hide total_ratings as requested by user
      if (key === 'total_ratings') return false;

      if (data.min === 0 && data.max === 0) return false;
      // If it's a date and the range is basically empty (1970)
      if ((key.endsWith('_date') || key.endsWith('_at')) && data.max < 20000) return false;
    }

    if (!filterSearch) return true;
    const { label } = getGroupConfig(key);
    if (label.toLowerCase().includes(filterSearch.toLowerCase())) return true;

    // Check inside buckets
    if (Array.isArray(data)) {
      return data.some(b =>
        String(b.value).toLowerCase().includes(filterSearch.toLowerCase()) ||
        String(b.label || '').toLowerCase().includes(filterSearch.toLowerCase())
      );
    }
    return false;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-50 w-72 max-w-[90%] bg-white dark:bg-[#0f111a] border-l border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-68 lg:border-r lg:border-l-0 lg:z-0 lg:flex
        ${isFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${disabled ? 'pointer-events-none opacity-60' : ''}
        flex flex-col h-full overflow-hidden shrink-0 shadow-2xl lg:shadow-none
      `}>
        <div className="flex flex-col h-full overflow-y-auto px-5 py-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Filters</h2>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={collapseAll}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Collapse all
              </button>
            </div>

            {/* Filter Search */}
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Find filter..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-gray-100/50 dark:bg-gray-800/40 border-transparent dark:border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
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
            {filteredFilterEntries
              .filter(([key]) => !key.startsWith('metadata.'))
              .map(([key, data]) => {
                const isSearchMatchValue = filterSearch && Array.isArray(data) && data.some(b => String(b.value).toLowerCase().includes(filterSearch.toLowerCase()));
                const isExpanded = expanded[key] !== false || !!isSearchMatchValue;
                const { label, icon: Icon } = getGroupConfig(key);

                return (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-4 text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex w-full items-center justify-between text-sm py-2 font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span>{label}</span>
                      </div>
                      {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="pt-4 px-1">
                        {key === 'average_rating' ? (
                          <div className="space-y-3 px-1">
                            {ratingTiers.map((tier) => {
                              const isActive = Number(activeFilters[`${key}[gte]`]) === tier.min && Number(activeFilters[`${key}[lte]`]) === tier.max;
                              const ratingData = data as any[];
                              const bucketKey = tier.min === 5 ? '5_stars' : (tier.min === 1 ? '1_star_up' : `${tier.min}_stars_up`);
                              const bucket = Array.isArray(ratingData)
                                ? ratingData.find((b: any) => b.value === bucketKey)
                                : null;
                              const count = bucket?.count || 0;

                              return (
                                <label key={tier.label} className="flex items-center group cursor-pointer justify-between">
                                  <div className="flex items-center overflow-hidden pr-2">
                                    <input
                                      type="checkbox"
                                      checked={isActive}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          onFilterChange({
                                            [`${key}[gte]`]: tier.min,
                                            [`${key}[lte]`]: tier.max
                                          });
                                        } else {
                                          onFilterChange({
                                            [`${key}[gte]`]: undefined,
                                            [`${key}[lte]`]: undefined
                                          });
                                        }
                                      }}
                                      className="h-4 w-4 bg-white dark:bg-[#1a1c23] border-gray-300 dark:border-gray-600 rounded text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors outline-none"
                                    />
                                    <div className="ml-3 flex items-center gap-1.5">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                          <StarSolid key={i} className={`h-3 w-3 ${i <= tier.min ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                        {tier.min} Stars{tier.min < 5 ? '+' : ''}
                                      </span>
                                    </div>
                                  </div>
                                  {count > 0 && (
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                      {count}
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        ) : !Array.isArray(data) ? (
                          <div className="px-2">
                            {key.endsWith('_date') || key.endsWith('_at') ? (
                              <DateRangePicker
                                min={data.min}
                                max={data.max}
                                currentMin={activeFilters[`${key}[gte]`]}
                                currentMax={activeFilters[`${key}[lte]`]}
                                onChange={(minVal, maxVal) => {
                                  onFilterChange({
                                    [`${key}[gte]`]: minVal,
                                    [`${key}[lte]`]: maxVal
                                  });
                                }}
                              />
                            ) : (
                              <RangeSlider
                                min={data.min}
                                max={data.max}
                                currentMin={activeFilters[`${key}[gte]`]}
                                currentMax={activeFilters[`${key}[lte]`]}
                                onChange={(minVal, maxVal) => {
                                  onFilterChange({
                                    [`${key}[gte]`]: minVal,
                                    [`${key}[lte]`]: maxVal
                                  });
                                }}
                              />
                            )}
                          </div>
                        ) : key === 'color_palette' ? (
                          <div className="grid grid-cols-5 gap-3">
                            {data.map((bucket) => {
                              const hex = String(bucket.value);
                              const clusterHexes = bucket.hexes || [hex];
                              const rawActiveHexes = activeFilters[key];
                              const activeHexes = Array.isArray(rawActiveHexes) ? rawActiveHexes : (rawActiveHexes ? [rawActiveHexes] : []);
                              const isActive = clusterHexes.some(h => activeHexes.includes(h));
                              return (
                                <button
                                  key={hex}
                                  onClick={() => {
                                    const nextActive = isActive
                                      ? activeHexes.filter((h: any) => !clusterHexes.includes(h))
                                      : Array.from(new Set([...activeHexes, ...clusterHexes]));
                                    onFilterChange(key, nextActive.length > 0 ? nextActive : undefined);
                                  }}
                                  className={`w-full aspect-square rounded-full border-2 transition-all relative group/swatch ${isActive ? 'border-blue-500 scale-110 shadow-md z-10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'}`}
                                  style={{ backgroundColor: hex }}
                                  title={hex}
                                >
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
                            {key === 'category_paths' ? (
                              buildTree(data)
                                .filter(node => !filterSearch || String(node.value).toLowerCase().includes(filterSearch.toLowerCase()) || node.children.some(c => String(c.value).toLowerCase().includes(filterSearch.toLowerCase())))
                                .map(node => (
                                  <RenderCategoryNode
                                    key={String(node.value)}
                                    bucket={node}
                                    activeFilters={activeFilters}
                                    handleCheckboxChange={handleCheckboxChange}
                                    groupKey={key}
                                  />
                                ))
                            ) : (
                              data
                                .filter(bucket => !filterSearch || String(bucket.value).toLowerCase().includes(filterSearch.toLowerCase()))
                                .sort((a, b) => (b.count || 0) - (a.count || 0))
                                .map((bucket) => {
                                  const rawActive = activeFilters[key];
                                  const activeList = Array.isArray(rawActive) ? rawActive : (rawActive ? [rawActive] : []);
                                  const isActive = activeList.includes(bucket.value);
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
                                          {bucket.label || bucket.value}
                                        </span>
                                      </div>
                                      <span className="px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 rounded-full shrink-0">
                                        {bucket.count}
                                      </span>
                                    </label>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {filteredFilterEntries.some(([key]) => key.startsWith('metadata.')) && (
              <div className="py-2 flex items-center gap-3">
                <div className="h-px bg-gray-200 dark:bg-gray-800/60 grow" />
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">---- Metadata Filters ----</span>
                <div className="h-px bg-gray-200 dark:bg-gray-800/60 grow" />
              </div>
            )}

            {filteredFilterEntries
              .filter(([key]) => key.startsWith('metadata.'))
              .map(([key, data]) => {
                const isSearchMatchValue = filterSearch && Array.isArray(data) && data.some(b => String(b.value).toLowerCase().includes(filterSearch.toLowerCase()));
                const isExpanded = expanded[key] !== false || !!isSearchMatchValue;
                const { label, icon: Icon } = getGroupConfig(key);

                return (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-800/60 pb-4 text-gray-900 dark:text-gray-100">
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex w-full items-center justify-between text-sm py-2 font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span>{label}</span>
                      </div>
                      {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="pt-4 px-1">
                        {!Array.isArray(data) ? (
                          <div className="px-2">
                            {key.endsWith('_date') || key.endsWith('_at') ? (
                              <DateRangePicker
                                min={data.min}
                                max={data.max}
                                currentMin={activeFilters[`${key}[gte]`]}
                                currentMax={activeFilters[`${key}[lte]`]}
                                onChange={(minVal, maxVal) => {
                                  onFilterChange({
                                    [`${key}[gte]`]: minVal,
                                    [`${key}[lte]`]: maxVal
                                  });
                                }}
                              />
                            ) : (
                              <RangeSlider
                                min={data.min}
                                max={data.max}
                                currentMin={activeFilters[`${key}[gte]`]}
                                currentMax={activeFilters[`${key}[lte]`]}
                                onChange={(minVal, maxVal) => {
                                  onFilterChange({
                                    [`${key}[gte]`]: minVal,
                                    [`${key}[lte]`]: maxVal
                                  });
                                }}
                              />
                            )}
                          </div>
                        ) : key === 'color_palette' ? (
                          <div className="grid grid-cols-5 gap-3">
                            {data.map((bucket) => {
                              const hex = String(bucket.value);
                              const clusterHexes = bucket.hexes || [hex];
                              const rawActiveHexes = activeFilters[key];
                              const activeHexes = Array.isArray(rawActiveHexes) ? rawActiveHexes : (rawActiveHexes ? [rawActiveHexes] : []);
                              const isActive = clusterHexes.some(h => activeHexes.includes(h));
                              return (
                                <button
                                  key={hex}
                                  onClick={() => {
                                    const nextActive = isActive
                                      ? activeHexes.filter((h: any) => !clusterHexes.includes(h))
                                      : Array.from(new Set([...activeHexes, ...clusterHexes]));
                                    onFilterChange(key, nextActive.length > 0 ? nextActive : undefined);
                                  }}
                                  className={`w-full aspect-square rounded-full border-2 transition-all relative group/swatch ${isActive ? 'border-blue-500 scale-110 shadow-md z-10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'}`}
                                  style={{ backgroundColor: hex }}
                                  title={hex}
                                >
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
                            {data
                              .filter(bucket => !filterSearch || String(bucket.value).toLowerCase().includes(filterSearch.toLowerCase()))
                              .map((bucket) => {
                                const rawActive = activeFilters[key];
                                const activeList = Array.isArray(rawActive) ? rawActive : (rawActive ? [rawActive] : []);
                                const isActive = activeList.includes(bucket.value);
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
                                        {bucket.label || bucket.value}
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
      </div>
    </>
  );
}
