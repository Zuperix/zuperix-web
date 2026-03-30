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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isSyncing = useRef(false);

  const redirectUser = useCallback((profile: User) => {
    const isLoginOrRegister = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isOnboardingPage = pathname.startsWith('/onboarding');

    console.log('Redirecting user based on profile:', profile.email, 'Path:', pathname);

    if (profile.customer && !profile.customer.is_onboarding_completed) {
      if (!isOnboardingPage) {
        console.log('Redirecting to onboarding...');
        router.push('/onboarding');
      }
    } else if (isLoginOrRegister || isOnboardingPage) {
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [router, pathname]);

  const fetchProfile = useCallback(async () => {
    console.log('Fetching user profile...');
    try {
      const profile = await apiFetch<User>('/users/me');
      setUser(profile);
      console.log('Profile fetched successfully:', profile.email);
      return profile;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event, 'Session:', !!session);

      if (session?.access_token) {
        const currentBackendToken = localStorage.getItem('auth_token');

        // Sync if it's a fresh login or if we are missing the backend token entirely.
        // We skip syncing on INITIAL_SESSION if a token already exists to avoid redundant calls.
        if (!currentBackendToken || event === 'SIGNED_IN') {
          console.log('Triggering backend sync for event:', event);
          await syncWithBackend(session.access_token);
        } else if (!user && !isSyncing.current) {
          // If we have a backend token but no user profile state, load it.
          await fetchProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auth_token');
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, syncWithBackend]); // user removed from dependencies to avoid loop

  useEffect(() => {
    if (!loading && user) {
      redirectUser(user);
    }
  }, [user, loading, redirectUser]);

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login',
      },
    });
    if (error) throw error;
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    signInWithGoogle,
    logout
  }), [user, loading, logout]);

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
