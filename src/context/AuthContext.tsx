'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';
import { User } from '@/types/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: components['schemas']['LoginDto']) => Promise<void>;
  register: (data: components['schemas']['RegisterDto']) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isSyncing = useRef(false);
  const lastSyncedToken = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const redirectUser = useCallback((profile: User) => {
    const isLoginOrRegister = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isOnboardingPage = pathname.startsWith('/onboarding');
    const isPublicPage = pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/help');
    const isRecoveryPage = pathname.startsWith('/reset-password') || pathname.startsWith('/forgot-password');

    if (isRecoveryPage) return;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      
      // If a specific return URL was provided, redirect there and abort the default flow
      const returnUrl = searchParams.get('return_url');
      if (returnUrl) {
        router.push(returnUrl);
        return;
      }

      if (
        searchParams.get('canva_token') ||
        searchParams.get('figma_device_code') ||
        searchParams.get('adobe_device_code') ||
        searchParams.get('chrome_device_code')
      ) {
        return;
      }
    }

    if (profile.customer && (!profile.customer.is_onboarding_completed || process.env.NEXT_PUBLIC_SHOW_ONBOARDING === 'true')) {
      if (!isOnboardingPage && !isPublicPage) {
        router.push('/onboarding');
      }
    } else if (isLoginOrRegister || isOnboardingPage) {
      router.push('/');
    }
  }, [router, pathname]);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiFetch<User>('/users/me');
      setUser(profile);
      console.log('Profile fetched successfully:', profile.email);
      return profile;
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Forbidden')
      ) {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  const syncWithBackend = useCallback(async (supabaseToken: string) => {
    if (isSyncing.current) return false;
    isSyncing.current = true;

    try {
      const response = await apiFetch<{ access_token: string }>('/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ access_token: supabaseToken }),
      });
      localStorage.setItem('auth_token', response.access_token);
      const profile = await fetchProfile();
      if (profile) redirectUser(profile);
      return true;
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
      }
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [fetchProfile, logout, redirectUser]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetchProfile();
      } else if (!window.location.hash.includes('access_token=')) {
        setLoading(false);
      }
    };

    initAuth();

    // Safety timeout: if we're waiting for Supabase to process a hash token
    // and it hasn't resolved loading in 15 seconds, something went wrong.
    const hasHashToken = window.location.hash.includes('access_token=');
    let safetyTimeout: ReturnType<typeof setTimeout> | undefined;
    if (hasHashToken) {
      safetyTimeout = setTimeout(() => {
        setLoading((current) => {
          if (current) {
            console.warn('Auth loading safety timeout triggered — hash token processing took too long');
            return false;
          }
          return current;
        });
      }, 15000);
    }

    return () => {
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event, 'Session:', !!session);

      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password');
        return;
      }

      if (session?.access_token) {
        // Clean up the hash fragment after Supabase has parsed it
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Prevent syncing if the session token is already expired (e.g. background tab wake up)
        const isExpired = session.expires_at
          ? session.expires_at * 1000 < Date.now() + 10000
          : false;

        if (isExpired) {
          console.log('Supabase token is expired, skipping sync until refreshed');
          setLoading(false);
          return;
        }

        const currentBackendToken = localStorage.getItem('auth_token');

        // Only sync if the token has actually changed or we are missing the backend token.
        // This prevents "constant sync" on tab focus or re-renders.
        if (session.access_token !== lastSyncedToken.current || !currentBackendToken) {
          console.log('Triggering backend sync for event:', event);
          lastSyncedToken.current = session.access_token;
          const success = await syncWithBackend(session.access_token);
          if (!success) {
            setLoading(false);
          }
        } else if (!user && !isSyncing.current) {
          // If we have a backend token but no user profile state, load it.
          await fetchProfile();
        } else {
          setLoading(false);
        }
      } else {
        if (event === 'SIGNED_OUT') {
          lastSyncedToken.current = null;
          localStorage.removeItem('auth_token');
          setUser(null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          // If there is no session initially and no local backend token, stop loading
          const currentBackendToken = localStorage.getItem('auth_token');
          if (!currentBackendToken) {
            setLoading(false);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, syncWithBackend, user]);

  useEffect(() => {
    if (!loading && user) {
      redirectUser(user);
    }
  }, [user, loading, pathname, redirectUser]);

  const login = async (credentials: components['schemas']['LoginDto']) => {
    const response = await apiFetch<{ access_token: string; supabase_session: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    localStorage.setItem('auth_token', response.access_token);

    if (response.supabase_session) {
      await supabase.auth.setSession(response.supabase_session);
    }

    const profile = await fetchProfile();
    if (profile) redirectUser(profile);
  };

  const register = async (data: components['schemas']['RegisterDto']) => {
    const response = await apiFetch<{ access_token: string; supabase_session: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    localStorage.setItem('auth_token', response.access_token);

    if (response.supabase_session) {
      await supabase.auth.setSession(response.supabase_session);
    }

    const profile = await fetchProfile();
    if (profile) redirectUser(profile);
  };

  const signInWithGoogle = async () => {
    const searchParams = window.location.search;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login${searchParams}`,
      },
    });
    if (error) throw error;
  };
  
  const forgotPassword = async (email: string) => {
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (password: string) => {
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  };

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    signInWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
  }), [user, loading, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
