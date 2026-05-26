'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Typewriter } from '@/components/Typewriter';
import { clsx } from 'clsx';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [figmaLinkedWorkspace, setFigmaLinkedWorkspace] = useState('');
  const [adobeLinkedWorkspace, setAdobeLinkedWorkspace] = useState('');
  const [figmaWorkspaces, setFigmaWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [figmaWorkspaceId, setFigmaWorkspaceId] = useState('');
  const [figmaLoading, setFigmaLoading] = useState(false);
  const [adobeLoading, setAdobeLoading] = useState(false);
  const [figmaLoadingWorkspaces, setFigmaLoadingWorkspaces] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading: authLoading, login, signInWithGoogle, logout } = useAuth();
  const searchParams = useSearchParams();
  const canvaToken = searchParams.get('canva_token');
  const figmaDeviceCode = searchParams.get('figma_device_code');
  const adobeDeviceCode = searchParams.get('adobe_device_code');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const linkCanva = async () => {
      if (user && canvaToken) {
        try {
          await apiFetch('/canva/dam/connect', {
            method: 'POST',
            body: JSON.stringify({ canva_user_token: canvaToken }),
          });
          setIsLinked(true);
          // Account linked! Now close the popup if we are in one
          if (window.opener) {
            window.close();
          }
        } catch (err) {
          console.error('Failed to link Canva account:', err);
        }
      }
    };
    linkCanva();
  }, [user, canvaToken]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!user || (!figmaDeviceCode && !adobeDeviceCode)) return;
      try {
        setFigmaLoadingWorkspaces(true);
        const workspaces = await apiFetch<Array<{ id: string; name: string }>>('/workspaces');
        setFigmaWorkspaces(workspaces);
        const savedWorkspaceId = localStorage.getItem('active_workspace_id');
        const initialWorkspaceId =
          (savedWorkspaceId && workspaces.find((workspace) => workspace.id === savedWorkspaceId)?.id) ||
          workspaces[0]?.id ||
          '';
        setFigmaWorkspaceId(initialWorkspaceId);
      } catch (err: any) {
        setError(err.message || 'Failed to load workspaces');
      } finally {
        setFigmaLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, [user, figmaDeviceCode, adobeDeviceCode]);

  const handleFigmaConnect = async () => {
    if (!figmaDeviceCode) return;
    setError('');
    setFigmaLoading(true);

    try {
      const result = await apiFetch<{ success: boolean; workspace?: { id: string; name: string } }>(
        '/figma-plugin/auth/approve',
        {
          method: 'POST',
          body: JSON.stringify({
            figma_device_code: figmaDeviceCode,
            workspace_id: figmaWorkspaceId || undefined,
          }),
        },
      );
      setFigmaLinkedWorkspace(result.workspace?.name || 'your workspace');
    } catch (err: any) {
      setError(err.message || 'Failed to connect Figma');
    } finally {
      setFigmaLoading(false);
    }
  };

  const handleAdobeConnect = async () => {
    if (!adobeDeviceCode) return;
    setError('');
    setAdobeLoading(true);

    try {
      const result = await apiFetch<{ success: boolean; workspace?: { id: string; name: string } }>(
        '/adobe-express-plugin/auth/approve',
        {
          method: 'POST',
          body: JSON.stringify({
            adobe_device_code: adobeDeviceCode,
            workspace_id: figmaWorkspaceId || undefined,
          }),
        },
      );
      setAdobeLinkedWorkspace(result.workspace?.name || 'your workspace');
    } catch (err: any) {
      setError(err.message || 'Failed to connect Adobe Express');
    } finally {
      setAdobeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const isRedirectingOrSyncing = isMounted && (
    localStorage.getItem('auth_token') ||
    window.location.hash.includes('access_token=') ||
    window.location.search.includes('canva_token') ||
    window.location.search.includes('figma_device_code') ||
    window.location.search.includes('adobe_device_code')
  );

  const showLoadingOverlay = googleLoading || (authLoading && isRedirectingOrSyncing);
  const loadingMessage = googleLoading ? 'Connecting to Google' : 'Signing you in';
  const loadingSubMessage = googleLoading
    ? 'Redirecting to secure authorization page...'
    : 'Securing your session and loading your workspace...';

  if (showLoadingOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full text-center space-y-6 transform scale-100 transition-all duration-300 animate-in zoom-in-95">
          <div className="relative flex items-center justify-center w-20 h-20">
            {/* Outer pulsing ring with gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin opacity-75 blur-[2px]" style={{ animationDuration: '3s' }} />
            {/* Inner solid white/dark circle to create the ring effect */}
            <div className="absolute inset-[3px] rounded-full bg-white dark:bg-zinc-900 z-10" />
            {/* Middle spinner */}
            <div className="absolute inset-[6px] rounded-full border-t-2 border-l-2 border-indigo-600 dark:border-indigo-400 animate-spin z-20" style={{ animationDuration: '1s' }} />
            {/* Inner logo/pulsing dot */}
            <div className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse z-30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
              {loadingMessage}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              {loadingSubMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const marketingTexts = [
    "The home for all your digital assets.",
    "Scale your creative vision with AI.",
    "Find any file in a heartbeat.",
    "Beautiful assets, organized effortlessly.",
    "The ultimate DAM for modern teams."
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Left Side: Marketing/Branding */}
      <div className="hidden lg:flex flex-1 relative bg-indigo-600 dark:bg-indigo-950 flex-col justify-center px-20 overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-xl text-white">
          <div className="mb-8">
            <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-20 w-auto brightness-0 invert" />
          </div>
          <h2 className="text-6xl font-extrabold tracking-tight mb-4">
            Zuperix
          </h2>
          <div className="text-2xl font-medium text-indigo-100/90 h-24 flex items-start">
            <Typewriter texts={marketingTexts} />
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="absolute bottom-12 left-20 right-20 flex justify-between items-center text-indigo-200/50 text-sm font-medium">
          <span>© 2026 Zuperix</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-12 w-auto" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {user ? 'Authenticated' : 'Sign In'}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                {user ? `You are signed in as ${user.email}` : 'Welcome back! Please enter your details.'}
              </p>
            </div>

            {isLinked && (
              <div className="mb-6 p-4 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-1">
                ✅ Successfully linked with Canva! You may close this tab and return to the Canva application.
              </div>
            )}

            {figmaLinkedWorkspace && (
              <div className="mb-6 p-4 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-1">
                Successfully connected Figma to {figmaLinkedWorkspace}. You can close this tab and return to Figma.
              </div>
            )}

            {adobeLinkedWorkspace && (
              <div className="mb-6 p-4 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-1">
                Successfully connected Adobe Express to {adobeLinkedWorkspace}. You can close this tab and return to Adobe Express.
              </div>
            )}

            {user && figmaDeviceCode && !figmaLinkedWorkspace && (
              <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 animate-in fade-in slide-in-from-top-1">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Connect Figma</div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Choose which workspace should be connected to this Figma session.
                  </p>
                </div>

                {figmaLoadingWorkspaces ? (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading workspaces...</div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Workspace
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all"
                        value={figmaWorkspaceId}
                        onChange={(e) => setFigmaWorkspaceId(e.target.value)}
                      >
                        {figmaWorkspaces.length === 0 ? (
                          <option value="">No workspaces found</option>
                        ) : (
                          figmaWorkspaces.map((workspace) => (
                            <option key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleFigmaConnect}
                      disabled={figmaLoading || figmaWorkspaces.length === 0}
                      className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                    >
                      {figmaLoading ? 'Connecting...' : 'Connect Figma'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {user && adobeDeviceCode && !adobeLinkedWorkspace && (
              <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 animate-in fade-in slide-in-from-top-1">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">Connect Adobe Express</div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Choose which workspace should be connected to this Adobe Express session.
                  </p>
                </div>

                {figmaLoadingWorkspaces ? (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading workspaces...</div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Workspace
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all"
                        value={figmaWorkspaceId}
                        onChange={(e) => setFigmaWorkspaceId(e.target.value)}
                      >
                        {figmaWorkspaces.length === 0 ? (
                          <option value="">No workspaces found</option>
                        ) : (
                          figmaWorkspaces.map((workspace) => (
                            <option key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdobeConnect}
                      disabled={adobeLoading || figmaWorkspaces.length === 0}
                      className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                    >
                      {adobeLoading ? 'Connecting...' : 'Connect Adobe Express'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {searchParams.get('reset') === 'success' && (
              <div className="mb-6 p-4 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-1">
                ✅ Password updated successfully! You can now sign in with your new password.
              </div>
            )}

            {error && (
              <div className={clsx(
                "mb-6 p-4 text-sm font-medium rounded-xl border animate-in fade-in slide-in-from-top-1",
                error.toLowerCase().includes('confirm')
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-900/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/20"
                  : "text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 border-red-100 dark:border-red-900/20"
              )}>
                {error.toLowerCase().includes('confirm') ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">Email not verified</span>
                    <span>Please confirm your email address to access the platform. Check your inbox for the verification link.</span>
                  </div>
                ) : error}
              </div>
            )}

            {!user && (
              <>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                      <Link href="/forgot-password" title="Go to forgot password page" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                    <span className="px-3 bg-white dark:bg-zinc-900 text-zinc-400">Or continue with</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold text-zinc-700 dark:text-zinc-300 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>

                <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            )}
            {user && (
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <button
                  onClick={logout}
                  className="text-sm font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                >
                  Sign in with a different account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
