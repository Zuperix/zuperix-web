'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  FolderIcon, 
  MagnifyingGlassIcon, 
  TrashIcon, 
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

import { useLayout } from '@/context/LayoutContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { sidebarCollapsed } = useLayout();

  const navigation = [
    { name: 'Assets', href: '/dashboard', icon: FolderIcon },
    { name: 'Search', href: '/dashboard/search', icon: MagnifyingGlassIcon },
    { name: 'Trash', href: '/dashboard/trash', icon: TrashIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className={`flex flex-col h-screen bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-16 border-b dark:border-gray-800">
        {!sidebarCollapsed ? (
          <span className="text-xl font-bold text-blue-600 transition-opacity">Open DAM</span>
        ) : (
          <span className="text-xl font-bold text-blue-600">OD</span>
        )}
      </div>

      <div className={`p-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        {!sidebarCollapsed && (
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Workspace
          </label>
        )}
        <div className="relative group">
          <select 
            className={`bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 text-sm rounded-lg p-2.5 outline-none appearance-none cursor-pointer transition-all ${sidebarCollapsed ? 'w-10 h-10 p-0 text-center' : 'w-full'}`}
            value={activeWorkspace?.id || ''}
            onChange={(e) => {
              const selected = workspaces.find(w => w.id === e.target.value);
              if (selected) setActiveWorkspace(selected);
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {sidebarCollapsed ? w.name.charAt(0).toUpperCase() : w.name}
              </option>
            ))}
          </select>
          {!sidebarCollapsed && (
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={sidebarCollapsed ? item.name : ''}
              className={`flex items-center rounded-lg transition-all duration-200 group ${
                sidebarCollapsed ? 'justify-center p-2' : 'px-4 py-2.5'
              } ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} ${!sidebarCollapsed ? 'mr-3' : ''}`} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm transition-opacity duration-200 overflow-hidden whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t dark:border-gray-800 ${sidebarCollapsed ? 'flex flex-col items-center space-y-4' : ''}`}>
        <div className={`flex items-center ${sidebarCollapsed ? '' : 'mb-4'}`}>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm ring-2 ring-white dark:ring-gray-800 flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate w-32">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={sidebarCollapsed ? 'Logout' : ''}
          className={`flex items-center text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group ${
            sidebarCollapsed ? 'justify-center p-2' : 'w-full px-4 py-2'
          }`}
        >
          <ArrowLeftOnRectangleIcon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-x-1 ${!sidebarCollapsed ? 'mr-3' : ''}`} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
