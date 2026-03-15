import { useState, useRef, useEffect } from 'react';
import { 
  BarsArrowDownIcon, 
  BarsArrowUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export type SortOption = {
  label: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  icon: any;
};

const sortOptions: SortOption[] = [
  { label: 'Newest First', sort_by: 'created_at', sort_order: 'desc', icon: CalendarIcon },
  { label: 'Oldest First', sort_by: 'created_at', sort_order: 'asc', icon: CalendarIcon },
  { label: 'Name (A-Z)', sort_by: 'original_filename.keyword', sort_order: 'asc', icon: DocumentTextIcon },
  { label: 'Name (Z-A)', sort_by: 'original_filename.keyword', sort_order: 'desc', icon: DocumentTextIcon },
  { label: 'Size (Smallest)', sort_by: 'file_size', sort_order: 'asc', icon: ChartBarIcon },
  { label: 'Size (Largest)', sort_by: 'file_size', sort_order: 'desc', icon: ChartBarIcon },
];

interface SortDropdownProps {
  currentSortBy: string;
  currentSortOrder: string;
  onSortChange: (option: SortOption) => void;
}

export default function SortDropdown({ 
  currentSortBy, 
  currentSortOrder, 
  onSortChange 
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = sortOptions.find(
    o => o.sort_by === currentSortBy && o.sort_order === currentSortOrder
  ) || sortOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800/60 rounded-xl px-4 py-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <currentOption.icon className="mr-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        <span>{currentOption.label}</span>
        <ChevronDownIcon
          className={`-mr-1 ml-2 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-2xl bg-white dark:bg-[#1a1c23] shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden p-1.5 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-100">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={`${option.sort_by}-${option.sort_order}`}
                onClick={() => {
                  onSortChange(option);
                  setIsOpen(false);
                }}
                className={`
                  ${currentOption.label === option.label 
                    ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  group flex items-center w-full px-3 py-2.5 text-xs rounded-xl transition-colors
                `}
              >
                <option.icon className={`mr-3 h-4 w-4 ${currentOption.label === option.label ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                {option.label}
                {currentOption.label === option.label && (
                   <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
