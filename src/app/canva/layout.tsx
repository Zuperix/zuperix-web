import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { Toaster } from 'sonner';

export default function CanvaLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#f7fafc] to-[#eef3ff] text-[#1f2937]">
        {children}
      </div>
      <Toaster position="top-right" richColors expand={false} />
    </WorkspaceProvider>
  );
}
