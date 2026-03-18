'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon, SunIcon, MoonIcon, ArrowPathIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';

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
    <header className="h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 flex items-center gap-2 sm:gap-4 px-4 sm:px-6 sticky top-0 z-30 transition-all">
      {/* Hamburger */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all shrink-0"
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-2xl min-w-0" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative flex items-center group">
          <MagnifyingGlassIcon className="absolute left-3 sm:left-4 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <input
            type="text"
            className="w-full pl-9 sm:pl-11 pr-4 py-2 bg-gray-100/50 dark:bg-gray-900/50 border-transparent dark:border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all truncate"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          {loadingSuggestions && (
            <div className="absolute right-12 flex items-center">
              <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
          <kbd className="absolute right-4 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500 rounded-md hidden md:flex items-center gap-1 shadow-sm pointer-events-none font-medium">
            <span className="font-sans">⌘</span>K
          </kbd>
        </form>

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-3 mx-4 sm:mx-6 max-w-2xl bg-white dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="px-3 py-2 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Suggested Assets</span>
                <span className="h-1 flex-1 ml-4 bg-gradient-to-r from-gray-100 dark:from-gray-800/50 to-transparent rounded-full" />
              </div>
              {suggestions.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setShowSuggestions(false);
                    router.push(`/dashboard/assets/${asset.id}`);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 flex items-center gap-4 transition-all group"
                >
                  <div className="h-11 w-11 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-800 group-hover:border-blue-500/30 transition-all shadow-sm">
                    {asset.mime_type?.startsWith('image/') ? (
                      <img 
                        src={`${BASE_URL}/assets/${asset.id}/view`} 
                        alt="" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = document.createElement('div');
                            icon.className = 'h-5 w-5 text-gray-400 dark:text-gray-600';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <DocumentIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors">
                      {asset.original_name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {(asset.mime_type || 'file').split('/')[1]} • {formatSize(asset.size)}
                    </span>
                  </div>
                </button>
              ))}
              
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/10 -mx-2 -mb-2">
                <button 
                  onClick={handleSearch}
                  className="w-full text-center py-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors tracking-wide uppercase"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <button className="hidden sm:flex p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          <BellIcon className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-gray-800 cursor-pointer hover:ring-blue-500 transition-all shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
