'use client';

import React from 'react';
import { FliptProvider as BaseFliptProvider } from '@flipt-io/flipt-client-react';

export function FliptProvider({ children }: { children: React.ReactNode }) {
  const url = '/flipt-api';
  const namespace = process.env.NEXT_PUBLIC_FLIPT_NAMESPACE || 'default';

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log(`[Flipt] Connecting via proxy to ${url} (namespace: ${namespace})`);
  }

  return (
    <BaseFliptProvider
      options={{
        url,
        namespace,
        updateInterval: 180, 
      }}
    >
      {children}
    </BaseFliptProvider>
  );
}
