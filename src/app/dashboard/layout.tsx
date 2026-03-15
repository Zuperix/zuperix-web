import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { LayoutProvider } from '@/context/LayoutContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <LayoutProvider>
        <WorkspaceProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-[#0f111a] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
            </div>
          </div>
        </WorkspaceProvider>
      </LayoutProvider>
    </ProtectedRoute>
  );
}
