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
          <div className="flex h-screen bg-gray-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </WorkspaceProvider>
      </LayoutProvider>
    </ProtectedRoute>
  );
}
