'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { components } from '@/types/api';

type User = components['schemas']['UpdateUserDto'] & { 
  id: string; 
  system_role?: string;
  customerId?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: components['schemas']['LoginDto']) => Promise<void>;
  register: (data: components['schemas']['RegisterDto']) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiFetch<User>('/users/me');
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (credentials: components['schemas']['LoginDto']) => {
    const response = await apiFetch<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('auth_token', response.access_token);
    await fetchProfile();
    router.push('/dashboard');
  };

  const register = async (data: components['schemas']['RegisterDto']) => {
    const response = await apiFetch<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('auth_token', response.access_token);
    await fetchProfile();
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
