'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import Link from 'next/link';

function AuthorizeForm() {
  const { user, loading: authLoading, login, register } = useAuth();
  const { workspaces, activeWorkspace, loading: workspacesLoading, setActiveWorkspace } = useWorkspace();
  const searchParams = useSearchParams();

  // OAuth Parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const canvaUserToken = searchParams.get('canva_user_token');

  // Page States
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  // Handle default selected workspace
  useEffect(() => {
    if (activeWorkspace) {
      setSelectedWorkspaceId(activeWorkspace.id);
    } else if (workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [activeWorkspace, workspaces]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Successfully signed in!');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        name,
        companyName,
      });
      toast.success('Account created successfully!');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace context.');
      return;
    }
    if (!canvaUserToken) {
      toast.error('Canva connection metadata is missing.');
      return;
    }

    setIsApproving(true);
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
          canva_user_token: canvaUserToken,
          workspace_id: selectedWorkspaceId,
        }),
      });

      // Redirect back to Canva redirect URI with authorization code and state
      const targetUrl = new URL(redirectUri!);
      targetUrl.searchParams.set('code', response.code);
      if (state) {
        targetUrl.searchParams.set('state', state);
      }

      toast.success('Connection approved! Returning to Canva...');
      window.location.href = targetUrl.toString();
    } catch (err: any) {
      setError(err.message || 'Failed to approve Canva connection.');
      setIsApproving(false);
    }
  };

  const handleCancel = () => {
    // If canceled, we can try to notify the opener or close the window
    if (window.opener) {
      window.close();
    } else {
      toast.info('Connection canceled.');
      window.location.href = '/';
    }
  };

  const isPageLoading = authLoading || (user && workspacesLoading);

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin opacity-75 blur-[2px]" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-[3px] rounded-full bg-zinc-950 z-10" />
          <div className="absolute inset-[6px] rounded-full border-t-2 border-l-2 border-indigo-400 animate-spin z-20" style={{ animationDuration: '1s' }} />
          <div className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse z-30" />
        </div>
        <p className="mt-6 text-sm font-semibold text-zinc-400 tracking-wide animate-pulse">
          Securing authentication tunnel...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Subtle glass shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />

        {/* Logo and Context Header */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-12 w-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Canva Integration
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Access, search, and export your brand assets seamlessly between Canva and Zuperix.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/30 rounded-2xl animate-in fade-in slide-in-from-top-1">
            ⚠️ {error}
          </div>
        )}

        {!user ? (
          /* Authentication Form */
          <div className="relative z-10">
            {/* Custom Tab Switcher */}
            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/50 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={clsx(
                  "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'login'
                    ? "bg-zinc-900 text-white shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                }}
                className={clsx(
                  "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'register'
                    ? "bg-zinc-900 text-white shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] mt-2 shadow-lg shadow-indigo-500/10"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Company
                    </label>
                    <input
                      name="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] mt-2 shadow-lg shadow-indigo-500/10"
                >
                  {loading ? 'Creating Account...' : 'Get Started'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Connection and Scope Approval UI */
          <div className="relative z-10 space-y-6">
            {/* Visual Connection Diagram */}
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-3 shadow-lg">
                <img src="/logo_transparant.png" alt="Zuperix" className="w-full h-auto object-contain" />
              </div>
              <div className="flex items-center justify-center gap-1.5 relative w-12">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-[#00c4cc] flex items-center justify-center p-3.5 shadow-lg">
                <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 18.286c-3.473 0-6.286-2.813-6.286-6.286S8.527 5.714 12 5.714s6.286 2.813 6.286 6.286-2.813 6.286-6.286 6.286z" />
                </svg>
              </div>
            </div>

            {/* Signed In User Pill */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 px-4 py-3 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Signed In As</p>
                <p className="text-sm font-semibold text-white truncate max-w-[200px]">{user.email}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>

            {/* Workspace Context Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Select Workspace Context
              </label>
              {workspaces.length === 0 ? (
                <div className="text-sm text-zinc-500 py-3 bg-zinc-950/50 rounded-xl text-center border border-dashed border-zinc-800">
                  No workspaces found.
                </div>
              ) : (
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id} className="bg-zinc-950">
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Permissions Requested List */}
            <div className="space-y-3 bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Permissions Requested
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 mt-0.5">✓</span>
                  <span>Access and view digital assets of the selected Zuperix workspace in your Canva Editor.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 mt-0.5">✓</span>
                  <span>Export new designs from Canva directly to your Zuperix workspace categories.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 mt-0.5">✓</span>
                  <span>Securely bridge user credentials for automated content publishing.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 font-bold py-3.5 rounded-xl text-sm transition-all outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || workspaces.length === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
              >
                {isApproving ? 'Connecting...' : 'Approve Connection'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CanvaAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <AuthorizeForm />
    </Suspense>
  );
}
