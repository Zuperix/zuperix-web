'use client';

import { useState, useMemo } from 'react';
import { LockClosedIcon, ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api';

interface PortalPasswordPromptProps {
  slug: string;
  name: string;
  logoUrl?: string;
  backgroundColor?: string;
  onSuccess: () => void;
}

// Function to calculate luminance and determine if a color is light or dark
function getContrastColor(hexcolor: string = '#0a0a0b') {
  if (hexcolor.startsWith('rgb')) return 'text-white';
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'dark' : 'light';
}

export default function PortalPasswordPrompt({
  slug,
  name,
  logoUrl,
  backgroundColor,
  onSuccess,
}: PortalPasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const theme = useMemo(() => getContrastColor(backgroundColor), [backgroundColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { access_token } = await apiFetch<{ access_token: string }>(
        `/p/${slug}/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ password }),
        }
      );

      localStorage.setItem(`portal_token_${slug}`, access_token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid portal password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 transition-all duration-700"
      style={{ backgroundColor: backgroundColor || '#0a0a0b' }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-1000 slide-in-from-bottom-8">
        <div className={`
          relative overflow-hidden
          ${theme === 'light' 
            ? 'bg-gray-900/90 border-gray-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]' 
            : 'bg-white/90 border-gray-200/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]'
          } 
          backdrop-blur-2xl border-2 rounded-[3rem] p-10 text-center space-y-10 
          transition-all duration-500
        `}>
          {/* Subtle Glow Effect */}
          <div className={`absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 blur-[100px] pointer-events-none rounded-full`}></div>
          
          {/* Logo/Branding */}
          <div className="space-y-6 relative z-10">
            {logoUrl ? (
              <div className="h-20 flex items-center justify-center filter drop-shadow-lg">
                <img src={logoUrl} alt={name} className="h-full object-contain" />
              </div>
            ) : (
              <div className={`
                h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner transition-colors duration-500
                ${theme === 'light' ? 'bg-blue-500/10 ring-1 ring-blue-500/20' : 'bg-blue-500/5 ring-1 ring-blue-500/10'}
              `}>
                <LockClosedIcon className="h-10 w-10 text-blue-500" />
              </div>
            )}
            
            <div className="space-y-2">
              <h1 className={`text-2xl font-black tracking-tight ${theme === 'light' ? 'text-white' : 'text-gray-900'}`}>
                {name}
              </h1>
              <p className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Portfolio Access Protected
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`
                  w-full rounded-2xl px-6 py-5 text-lg font-black outline-none ring-0 transition-all text-center tracking-[0.3em]
                  ${theme === 'light' 
                    ? 'bg-black/40 border-gray-800 text-white placeholder:text-gray-700 focus:border-blue-500/50' 
                    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-blue-500'
                  }
                  border-2
                `}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={`
                w-full py-5 rounded-2.5xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 group active:scale-[0.98]
                ${loading || !password 
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 ring-4 ring-blue-500/10'
                }
              `}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Portal</span>
                  <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <footer className="pt-4 border-t border-gray-800/10 relative z-10">
             <p className={`text-[9px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} opacity-30`}>
              Secured by Zuperix
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

