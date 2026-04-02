import { paths } from '@/types/api';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type GetPaths = keyof paths;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Handle portal-specific tokens
  if (typeof window !== 'undefined' && endpoint.startsWith('/p/')) {
    const slug = endpoint.split('/')[2];
    if (slug) {
      const portalToken = localStorage.getItem(`portal_token_${slug}`);
      if (portalToken) {
        headers.set('x-portal-token', portalToken);
      }
    }
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // If not JSON, try to get text or just stick with status
      try {
        const text = await response.text();
        if (text && text.length < 100) message = text;
      } catch {}
    }
    throw new Error(message);
  }

  const result = await response.json();
  // Unwrap the standard envelope if it exists
  return (result.data !== undefined ? result.data : result) as T;
}

export async function apiDownload(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Handle portal-specific tokens
  if (typeof window !== 'undefined' && endpoint.startsWith('/p/')) {
    const slug = endpoint.split('/')[2];
    if (slug) {
      const portalToken = localStorage.getItem(`portal_token_${slug}`);
      if (portalToken) {
        headers.set('x-portal-token', portalToken);
      }
    }
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.blob();
}
