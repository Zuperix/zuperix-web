import { Metadata } from 'next';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { UploadProvider } from '@/context/UploadContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { SystemAnnouncementBanner } from '@/components/SystemAnnouncementBanner';
import UploadModal from '@/components/UploadModal';
import FloatingUploadWidget from '@/components/FloatingUploadWidget';
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
      <SubscriptionGuard>
        <LayoutProvider>
          <WorkspaceProvider>
            <UploadProvider>
              <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a] overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <SystemAnnouncementBanner />
                  <AnnouncementBanner />
                  <Suspense fallback={<div className="h-16 bg-white dark:bg-[#0f111a]" />}>
                    <Header />
                  </Suspense>
                  <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                  </main>
                </div>
              </div>
              <UploadModal />
              <FloatingUploadWidget />
            </UploadProvider>
          </WorkspaceProvider>
          <TawkChat />
        </LayoutProvider>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}
