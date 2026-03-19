'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon, SunIcon, MoonIcon, ArrowPathIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import NotificationCenter from './NotificationCenter';

export default function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useLayout();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 Bytes';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  useEffect(() => {
    // Check initial state from local storage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!activeWorkspace || !query.trim() || query.length < 2 || pathname === '/dashboard/search') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await apiFetch<any>(`/workspaces/${activeWorkspace.id}/search/assets/quick?q=${encodeURIComponent(query)}&limit=6`);
      setSuggestions(response.assets || []);
      setShowSuggestions((response.assets || []).length > 0);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (searchQuery.length > 1) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, activeWorkspace]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/70 dark:bg-[#0f111a]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/40 flex items-center gap-4 px-6 sticky top-0 z-30 transition-all duration-300">
      {/* Sidebar Toggle & Logo/Context */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all duration-200 shrink-0 group focus:ring-2 focus:ring-blue-500/20"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </button>
        
        <div className="hidden lg:flex flex-col">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">
            {activeWorkspace?.name || 'Workspace'}
          </span>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
            Digital Assets
          </span>
        </div>
      </div>

      {/* Search - Centered and Premium */}
      <div className="flex-1 flex justify-center min-w-0" ref={searchRef}>
        <div className="w-full max-w-2xl relative">
          <form onSubmit={handleSearch} className="relative flex items-center group">
            <div className="absolute left-3.5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-16 py-2.5 bg-gray-100/80 dark:bg-gray-900/40 border border-transparent dark:border-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#161b22] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all duration-300 shadow-sm"
              placeholder="Search assets, metadata, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            
            <div className="absolute right-3 flex items-center gap-2">
              {loadingSuggestions && (
                <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 font-sans text-[10px] font-medium text-gray-400 dark:text-gray-500 shadow-sm">
                <span className="text-[8px]">⌘</span>K
              </kbd>
            </div>
          </form>

          {/* Suggestions Dropdown - Enhanced */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="px-3 py-2 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Suggested Assets</span>
                  <div className="h-[1px] flex-1 ml-4 bg-gradient-to-r from-gray-100 dark:from-gray-800/50 to-transparent" />
                </div>
                
                {suggestions.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setShowSuggestions(false);
                      router.push(`/dashboard/assets/${asset.id}`);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-900/10 flex items-center gap-4 transition-all group/item"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-900/40 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-800 group-hover/item:border-blue-500/30 transition-all shadow-sm">
                      {asset.mime_type?.startsWith('image/') ? (
                        <img 
                          src={`${BASE_URL}/assets/${asset.id}/view`} 
                          alt="" 
                          className="h-full w-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <DocumentIcon className="h-6 w-6 text-gray-400 dark:text-gray-600 group-hover/item:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                          {asset.original_name}
                        </span>
                        {asset.is_ocr_match && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[8px] font-extrabold uppercase rounded tracking-tighter shrink-0 ring-1 ring-amber-500/20">
                            OCR
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                        {(asset.mime_type || 'file').split('/')[1]} • {formatSize(asset.size)}
                      </span>
                    </div>
                  </button>
                ))}
                
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/10 -mx-2 -mb-2">
                  <button 
                    onClick={handleSearch}
                    className="w-full text-center py-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors tracking-widest uppercase"
                  >
                    Search all for "{searchQuery}"
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right actions - Clean & Grouped */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/40 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/30">
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-none hover:shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
          </button>
          
          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700/50 mx-1" />
          
          <NotificationCenter />
        </div>

        {/* User Profile - Premium Avatar */}
        <button className="flex items-center gap-3 p-1 pl-1 pr-2 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-200 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-gray-900 group-hover:scale-105 transition-transform duration-300">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-none">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Admin
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
