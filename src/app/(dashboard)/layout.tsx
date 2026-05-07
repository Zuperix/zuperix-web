import { Metadata } from 'next';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import TawkChat from '@/components/TawkChat';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: `%s | Zuperix`,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <LayoutProvider>
        <WorkspaceProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0"> {/* Removed overflow-hidden here */}
              <AnnouncementBanner />
              <Suspense fallback={<div className="h-16 bg-white dark:bg-[#0f111a]" />}>
                <Header />
              </Suspense>
              <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
              </main>
            </div>
          </div>
        </WorkspaceProvider>
        <TawkChat />
      </LayoutProvider>
    </ProtectedRoute>
  );
}
