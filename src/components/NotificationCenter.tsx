'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon, TrashIcon, InboxIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Notification[]>('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsOpen(false);

    if (n.data?.assetId) {
      router.push(`/dashboard/assets/${n.data.assetId}`);
    }
  };

  return (
    <div className="relative flex items-center" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg transition-all duration-200 relative group ${
          isOpen 
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800'
        }`}
        aria-label="Notifications"
      >
        <BellIcon className={`h-4.5 w-4.5 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:rotate-12'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-tr from-red-600 to-rose-400 text-white text-[9px] font-black flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#161b22] shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white/95 dark:bg-[#0f111a]/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out origin-top-right">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-[0.2em]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Checking alerts...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="h-16 w-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center">
                  <InboxIcon className="h-8 w-8 text-gray-300 dark:text-gray-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">All caught up!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">No new notifications at the moment.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/30">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-blue-900/5 relative group/item ${!n.is_read ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`text-xs font-bold transition-colors ${!n.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                          {n.title}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium tabular-nums mt-0.5 shrink-0 uppercase tracking-tighter">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${!n.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">View details →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-900/20 text-center">
              <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors uppercase tracking-[0.2em]">
                View All Activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
