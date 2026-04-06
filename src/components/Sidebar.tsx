'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLayout } from '@/context/LayoutContext';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  ChevronUpDownIcon,
  CheckIcon,
  PlusIcon,
  FolderIcon,
  RectangleGroupIcon,
  Square3Stack3DIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  UsersIcon,
  GlobeAltIcon,
  InboxIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Action } from '@/types/auth';

const NAV = [
  { name: 'Assets', href: '/', icon: RectangleGroupIcon },
  { name: 'My Tasks', href: '/tasks', icon: InboxIcon },
  { name: 'Categories', href: '/categories', icon: FolderIcon },
  { name: 'Collections', href: '/collections', icon: Square3Stack3DIcon },
  // { name: 'Brand kits', href: '/brand', icon: PaintBrushIcon },
  { name: 'Portals', href: '/portals', icon: GlobeAltIcon },
  { name: 'Vaults', href: '/vaults', icon: LockClosedIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const ADMIN_NAV = [
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Roles', href: '/admin/roles', icon: ShieldCheckIcon },
  { name: 'API Keys', href: '/admin/api-keys', icon: KeyIcon },
  { name: 'Webhooks', href: '/admin/webhooks', icon: GlobeAltIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, user } = useAuth();
  const { can } = usePermissions();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const [wsOpen, setWsOpen] = useState(false);

  const filteredNav = useMemo(() => {
    return NAV.filter(item => {
      // Basic visibility rules:
      if (item.name === 'Assets') return true; // Everyone sees assets, service handles filtering
      if (item.name === 'Upload Status') return true; // Everyone sees upload status for their assets
      if (item.name === 'My Tasks') return true; // Personalized
      if (item.name === 'Settings') return true; // General settings
      
      // Permission-based:
      if (item.name === 'Categories') return can(Action.Read, 'Category', activeWorkspace?.id);
      if (item.name === 'Collections') return can(Action.Read, 'Collection', activeWorkspace?.id);
      if (item.name === 'Portals') return can(Action.Read, 'Portal', activeWorkspace?.id);
      
      return true;
    });
  }, [can, activeWorkspace]);

  const filteredAdminNav = useMemo(() => {
    return ADMIN_NAV.filter(item => {
      if (item.name === 'Users') return can(Action.Read, 'User', activeWorkspace?.id);
      if (item.name === 'Roles') return can(Action.Read, 'Role', activeWorkspace?.id);
      if (item.name === 'API Keys') return can(Action.Read, 'Role', activeWorkspace?.id); // Reuse Role read permission for API keys admin
      if (item.name === 'Webhooks') return can(Action.Read, 'Webhook', activeWorkspace?.id);
      if (item.name === 'Analytics') return can(Action.Manage, 'Asset', activeWorkspace?.id);
      return false;
    });
  }, [can, activeWorkspace]);

  const collapsed = sidebarCollapsed;

  return (
    <>
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:flex flex-col h-screen bg-gray-950 border-r border-gray-800/60 transition-all duration-300 ease-in-out ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[60px]' : 'translate-x-0 w-64 lg:w-60'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-gray-800/60 flex-shrink-0 ${collapsed ? 'justify-center' : 'px-4 gap-2.5'}`}>
          <div 
            className="h-9 w-9 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <span 
              className="text-sm font-semibold text-white tracking-wide cursor-pointer"
              onClick={() => router.push('/')}
            >
              Zuperix
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-3 gap-1 custom-scrollbar">
          {/* Workspace switcher */}
          {!collapsed && (
            <div className="px-3 mb-1 relative">
              <button
                onClick={() => setWsOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 text-left transition-colors group"
              >
                <div className="h-5 w-5 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-indigo-300">
                    {activeWorkspace?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <span className="flex-1 text-xs font-medium text-gray-200 truncate">
                  {activeWorkspace?.name || 'No workspace'}
                </span>
                <ChevronUpDownIcon className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>

              {wsOpen && workspaces.length > 0 && (
                <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl overflow-hidden">
                  <p className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    Workspaces
                  </p>
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => { setActiveWorkspace(w); setWsOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left hover:bg-gray-800 transition-colors"
                    >
                      <div className="h-5 w-5 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-indigo-300">{w.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="flex-1 text-gray-300 truncate font-medium">{w.name}</span>
                      {activeWorkspace?.id === w.id && (
                        <CheckIcon className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!collapsed && (
            <p className="px-6 py-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
              Navigation
            </p>
          )}

          <nav className={`flex flex-col gap-0.5 ${collapsed ? 'items-center px-2' : 'px-3'}`}>
            {filteredNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center rounded-lg transition-all duration-150 group ${
                    collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2'
                  } ${
                    active
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/70'
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 transition-colors ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${
                      active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                    }`}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {filteredAdminNav.length > 0 && (
            <>
              {!collapsed && (
                <p className="px-6 py-2 mt-4 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                  Admin
                </p>
              )}
              <nav className={`flex flex-col gap-0.5 ${collapsed ? 'items-center px-2' : 'px-3'}`}>
                {filteredAdminNav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center rounded-lg transition-all duration-150 group ${
                        collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2'
                      } ${
                        active
                          ? 'bg-purple-600/15 text-purple-400'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/70'
                      }`}
                    >
                      <item.icon
                        className={`flex-shrink-0 transition-colors ${collapsed ? 'h-5 w-5' : 'h-4 w-4'} ${
                          active ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                      {active && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <div className={`border-t border-gray-800/60 flex-shrink-0 ${collapsed ? 'py-3 flex flex-col items-center gap-2' : 'p-3'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-800/60 transition-colors group">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
