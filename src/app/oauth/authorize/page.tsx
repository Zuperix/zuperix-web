'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

function AuthorizeForm() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  useEffect(() => {
    if (user) {
      const loadWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
          const fetchedWorkspaces = await apiFetch<Array<{ id: string; name: string }>>('/workspaces');
          setWorkspaces(fetchedWorkspaces);
          if (fetchedWorkspaces.length > 0) {
            setWorkspaceId(fetchedWorkspaces[0].id);
          }
        } catch (err: any) {
          setError('Failed to load workspaces');
        } finally {
          setLoadingWorkspaces(false);
        }
      };
      loadWorkspaces();
    }
  }, [user]);

  const handleApprove = async () => {
    if (!workspaceId) return;
    setApproving(true);
    setError('');

    try {
      const response = await apiFetch<{ code: string }>('/canva/oauth/approve', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          workspace_id: workspaceId,
        }),
      });

      if (response.code) {
        const url = new URL(redirectUri || '');
        url.searchParams.set('code', response.code);
        if (state) {
          url.searchParams.set('state', state);
        }
        window.location.href = url.toString();
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
      setApproving(false);
    }
  };

  if (authLoading || loadingWorkspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // If not logged in, redirect to login page with a return_url
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?return_url=${returnUrl}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Connect Zuperix</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Choose a workspace to connect with Canva.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Workspace
            </label>
            <select
              className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              disabled={approving || workspaces.length === 0}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleApprove}
            disabled={approving || workspaces.length === 0 || !workspaceId}
            className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all"
          >
            {approving ? 'Approving...' : 'Approve Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={null}>
      <AuthorizeForm />
    </Suspense>
  );
}
