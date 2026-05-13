'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { canvaApi } from '@/services/canva.api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Canva connection failed: ${error}`);
      router.push('/canva');
      return;
    }

    if (!code || !state) {
      toast.error('Missing Canva callback parameters');
      router.push('/canva');
      return;
    }

    canvaApi
      .callback(code, state)
      .then(() => {
        toast.success('Canva connected successfully');
      })
      .catch((callbackError: unknown) => {
        toast.error(
          callbackError instanceof Error
            ? callbackError.message
            : 'Failed to finalize Canva connection',
        );
      })
      .finally(() => {
        router.push('/canva');
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="bg-white border border-[#d6e2ff] rounded-2xl p-6 text-center max-w-sm w-full">
        <h1 className="text-lg font-semibold text-[#0f172a]">Finishing Canva connection</h1>
        <p className="mt-2 text-sm text-[#64748b]">Please wait while we securely link your Zuperix account.</p>
      </div>
    </div>
  );
}

export default function CanvaCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
