'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Typewriter } from '@/components/Typewriter';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const marketingTexts = [
    "Securely reset your password.",
    "Protecting your creative assets.",
    "Quick recovery, back to work.",
    "Encryption-first security architecture."
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
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Sign In
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Forgot Password?</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            {success ? (
              <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <EnvelopeIcon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Check your email</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 italic">
                    We've sent a password reset link to <span className="font-bold text-zinc-700 dark:text-zinc-200">{email}</span>.
                  </p>
                </div>
                <p className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                   If you don't see it, check your spam folder or wait a few minutes.
                </p>
                <Link 
                  href="/login" 
                  className="block w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
