'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon, SunIcon, MoonIcon, ArrowPathIcon, DocumentIcon, SparklesIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { apiFetch, BASE_URL } from '@/lib/api';
import NotificationCenter from './NotificationCenter';
import CustomImage from './CustomImage';
import { useFliptBoolean } from '@flipt-io/flipt-client-react';
import { FEATURES } from '@/constants/features';

export default function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useLayout();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSemantic, setIsSemantic] = useState(false);
  const [showSearchInfo, setShowSearchInfo] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const reverseSearchEnabled = useFliptBoolean(
    FEATURES.REVERSE_IMAGE_SEARCH.key,
    false,
    user?.id || 'anonymous'
  );

  // Diagnostic logging for feature flags
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Flipt] ${FEATURES.REVERSE_IMAGE_SEARCH.name} status:`, reverseSearchEnabled);
    }
  }, [reverseSearchEnabled]);

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

      const savedSemantic = localStorage.getItem('isSemantic') === 'true';
      setIsSemantic(savedSemantic);
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


  const toggleSemantic = () => {
    const newState = !isSemantic;
    setIsSemantic(newState);
    localStorage.setItem('isSemantic', String(newState));
    
    // If on dashboard or search results, update the URL to trigger re-fetch
    if (pathname === '/') {
      const params = new URLSearchParams(searchParams.toString());
      if (newState) {
        params.set('is_semantic', 'true');
      } else {
        params.delete('is_semantic');
      }
      router.push(`${pathname}?${params.toString()}`);
    }

    // Trigger fresh suggestions with new state
    if (searchQuery.length > 1) {
      fetchSuggestions(searchQuery, newState);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery)}${isSemantic ? '&is_semantic=true' : ''}`);
    }
  };

  const fetchSuggestions = async (query: string, semanticState = isSemantic) => {
    if (!activeWorkspace || !query.trim() || query.length < 2 || pathname === '/search') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await apiFetch<any>(`/workspaces/${activeWorkspace.id}/search/assets/quick?q=${encodeURIComponent(query)}&limit=6&is_semantic=${semanticState}`);
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
              className="w-full pl-10 pr-32 py-2.5 bg-gray-100/80 dark:bg-gray-900/40 border border-transparent dark:border-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl outline-none focus:bg-white dark:focus:bg-[#161b22] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all duration-300 shadow-sm"
              placeholder={isSemantic ? "Natural language search aka AI search..." : "Search assets, metadata, tags..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            
            <div className="absolute right-3 flex items-center gap-1.5">
              {loadingSuggestions && (
                <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin mr-1" />
              )}
              
              {/* Semantic Toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSemantic}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-300 ${isSemantic ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${isSemantic ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="text-[10px] font-bold tracking-tight uppercase">AI</span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSearchInfo(!showSearchInfo);
                    }}
                    onBlur={() => setTimeout(() => setShowSearchInfo(false), 200)}
                    className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-500/5 transition-all"
                    aria-label="AI Search Information"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                  </button>

                  {showSearchInfo && (
                    <div className="absolute top-full right-0 mt-3 w-72 p-4 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                          <SparklesIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">About AI Search</span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                        Natural language search (Semantic Search) uses CLIP embeddings to find assets based on <span className="text-blue-400">visual concepts</span> rather than just keywords. 
                        AI analysis can occasionally vary, so please verify results for critical workflows.
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Powered by Zuperix AI</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-75" />
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Search Trigger */}
              {reverseSearchEnabled && (
                <div className="flex items-center ml-1">
                  <input
                    type="file"
                    id="visual-search-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !activeWorkspace) return;
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      try {
                        setLoadingSuggestions(true);
                        const response = await apiFetch<any>(`/workspaces/${activeWorkspace.id}/search/visual`, {
                          method: 'POST',
                          body: formData,
                        });
                        
                        if (response.results) {
                          setSuggestions(response.results);
                          setShowSuggestions(true);
                        }
                      } catch (err: any) {
                        console.error('Visual search failed', err);
                        if (err.status === 403) {
                          alert('Visual search is only available on Silver, Gold, and Platinum plans.');
                        } else {
                          alert('Visual search failed. Please try again.');
                        }
                      } finally {
                        setLoadingSuggestions(false);
                        // Clear the input so it can be used again for the same file
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('visual-search-upload')?.click()}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all group/cam"
                    title="Search by image (Reverse Search)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover/cam:scale-110 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z" />
                    </svg>
                  </button>
                </div>
              )}

              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 font-sans text-[10px] font-medium text-gray-400 dark:text-gray-500 shadow-sm ml-1">
                <span className="text-[8px]">⌘</span>K
              </kbd>
            </div>
          </form>

          {/* Suggestions Dropdown - Enhanced */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="px-3 py-2 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{isSemantic ? 'Semantic Matches' : 'Suggested Assets'}</span>
                  <div className="h-[1px] flex-1 ml-4 bg-gradient-to-r from-gray-100 dark:from-gray-800/50 to-transparent" />
                </div>
                
                {suggestions.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setShowSuggestions(false);
                      router.push(`/assets/${asset.id}`);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-900/10 flex items-center gap-4 transition-all group/item"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-900/40 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-800 group-hover/item:border-blue-500/30 transition-all shadow-sm" title={`Score: ${asset.score?.toFixed(4) || 'N/A'}`}>
                      {asset.mime_type?.startsWith('image/') ? (
                        <div className="relative h-full w-full">
                          <CustomImage 
                            src={asset.thumbnail_lg_url || asset.asset_live_url} 
                            alt="" 
                            fill
                            shimmerWidth={48}
                            shimmerHeight={48}
                            className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <DocumentIcon className="h-6 w-6 text-gray-400 dark:text-gray-600 group-hover/item:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                          {asset.original_name}
                        </span>
                        {asset.is_semantic_match && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[8px] font-extrabold uppercase rounded tracking-tighter shrink-0 ring-1 ring-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                            Semantic
                          </span>
                        )}
                        {asset.is_ocr_match && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[8px] font-extrabold uppercase rounded tracking-tighter shrink-0 ring-1 ring-amber-500/20">
                            OCR
                          </span>
                        )}
                        {asset.is_text_extraction_match && (
                          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[8px] font-extrabold uppercase rounded tracking-tighter shrink-0 ring-1 ring-purple-500/20">
                            Text Match
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

          <button
            onClick={() => router.push('/upload-status')}
            className={`p-1.5 rounded-lg transition-all duration-200 ${pathname === '/upload-status' ? 'bg-blue-500/10 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'}`}
            title="Upload Status"
          >
            <CloudArrowUpIcon className="h-4.5 w-4.5" />
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
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize">
              {(() => {
                if (user?.system_role === 'SUPER_ADMIN') return 'Super Admin';
                const membership = user?.workspace_members?.find(
                  (m) => m.workspace_id === activeWorkspace?.id
                );
                return membership?.role?.name?.toLowerCase() || 'Member';
              })()}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
