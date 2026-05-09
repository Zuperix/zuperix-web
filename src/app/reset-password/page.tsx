'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Typewriter } from '@/components/Typewriter';
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password);
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const marketingTexts = [
    "Choose a strong password.",
    "Your security is our priority.",
    "Enhanced account protection.",
    "Back to managing your assets."
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-1 relative bg-indigo-600 dark:bg-indigo-950 flex-col justify-center px-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400 blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-xl text-white">
          <div className="mb-8">
            <img src="/logo_transparant.png" alt="Zuperix Logo" className="h-20 w-auto brightness-0 invert" />
          </div>
          <h2 className="text-6xl font-extrabold tracking-tight mb-4">Zuperix</h2>
          <div className="text-2xl font-medium text-indigo-100/90 h-24 flex items-start">
            <Typewriter texts={marketingTexts} />
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="mb-8">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <LockClosedIcon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Reset Password</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Secure your account by choosing a new password.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1.5 text-[11px] text-zinc-400">At least 8 characters long.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-zinc-950 dark:text-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 mt-2 flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
