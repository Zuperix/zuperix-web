'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useLayout();
  const { user } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 flex items-center gap-4 px-6 sticky top-0 z-30 transition-all">
      {/* Hamburger */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
        <div className="relative flex items-center group">
          <MagnifyingGlassIcon className="absolute left-4 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2 bg-gray-100/50 dark:bg-gray-900/50 border-transparent dark:border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
            placeholder="Search assets, tags, or metadata…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="absolute right-4 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 dark:text-gray-500 rounded-md hidden sm:flex items-center gap-1 shadow-sm pointer-events-none font-medium">
            <span className="font-sans">⌘</span>K
          </kbd>
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button 
          onClick={toggleTheme}
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-gray-800 cursor-pointer hover:ring-blue-500 transition-all shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
