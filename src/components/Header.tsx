'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useLayout();
  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-14 bg-gray-950 border-b border-gray-800/60 flex items-center gap-4 px-4 sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative flex items-center group">
          <MagnifyingGlassIcon className="absolute left-3 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 bg-gray-800/70 border border-gray-700/50 text-sm text-gray-100 placeholder-gray-500 rounded-lg outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="absolute right-3 text-[10px] text-gray-600 hidden sm:flex items-center gap-1 pointer-events-none">
            <span className="font-sans">⌘K</span>
          </kbd>
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-400 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-800 cursor-pointer hover:ring-blue-500 transition-all">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
