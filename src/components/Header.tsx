'use client';

import { MagnifyingGlassIcon, Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery } = useLayout();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 max-w-2xl px-8">
        <form onSubmit={handleSearch} className="relative group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm"
            placeholder="Search across all assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 relative">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
      </div>
    </header>
  );
}
