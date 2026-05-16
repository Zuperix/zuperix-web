'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import googleDriveApi from '@/services/google-drive.api';
import { toast } from 'sonner';

export default function GoogleDriveCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      toast.error('Invalid callback parameters');
      router.push('/settings/integrations/google-drive?error=invalid_params');
      return;
    }

    const handleCallback = async () => {
      processed.current = true;
      try {
        await googleDriveApi.callback(code, state);
        toast.success('Successfully connected to Google Drive!');
        router.push('/settings/integrations/google-drive?success=true');
      } catch (error: any) {
        console.error('Callback failed:', error);
        toast.error(`Authentication failed: ${error.message}`);
        router.push(`/settings/integrations/google-drive?error=${encodeURIComponent(error.message)}`);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Finalizing Connection</h2>
        <p className="text-gray-400">Please wait while we secure your connection to Google Drive...</p>
      </div>
    </div>
  );
}
