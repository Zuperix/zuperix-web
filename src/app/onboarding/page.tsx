'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { CheckCircle2, Loader2, Rocket, Building2, Globe, Sparkles, Database, Search, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

type OnboardingStage = 'form' | 'setup';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>('form');
  const [companyName, setCompanyName] = useState(user?.customer?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupProgress, setSetupProgress] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.customer?.name && !companyName) {
      setCompanyName(user.customer.name);
    }
  }, [user, companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    setLoading(true);
    setError('');

    try {
      await apiFetch('/onboarding/setup', {
        method: 'PATCH',
        body: JSON.stringify({
          name: companyName,
          website_url: websiteUrl,
          industry,
        }),
      });
      setStage('setup');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage !== 'setup') return;

    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const { is_onboarding_completed } = await apiFetch<{ is_onboarding_completed: boolean }>('/onboarding/status');
        
        if (is_onboarding_completed) {
          setSetupProgress(100);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          setSetupProgress(prev => Math.min(prev + 5, 95));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    intervalId = setInterval(pollStatus, 1500);
    return () => clearInterval(intervalId);
  }, [stage]);

  if (authLoading || (user?.customer?.is_onboarding_completed)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (stage === 'setup') {
    return <SetupAnimation progress={setupProgress} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Let&apos;s personalize your Zuperix environment.</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="w-4 h-4" /> Company Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none transition-all"
                placeholder="Acme Global"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4" /> Website URL
              </label>
              <input
                type="url"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none transition-all"
                placeholder="https://acme.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Sparkles className="w-4 h-4" /> Industry
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none transition-all appearance-none"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select an industry</option>
                <option value="technology">Technology</option>
                <option value="marketing">Marketing & Creative</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !companyName}
            className="group relative w-full py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-500">
          We&apos;ll populate your workspace with some sample assets to show you around.
        </p>
      </div>
    </div>
  );
}

function SetupAnimation({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 text-white overflow-hidden">
      <div className="relative w-full max-w-2xl px-8 py-16 text-center space-y-12">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -z-10 animate-pulse" />

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium animate-bounce">
             <Sparkles className="w-4 h-4" /> Creating your workspace
          </div>
          <h2 className="text-5xl font-black tracking-tight">
            Getting everything <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">ready for you</span>
          </h2>
          <p className="text-gray-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">
            We&apos;re setting up your library and adding some sample assets so you can jump right in.
          </p>
        </div>

        <div className="relative">
          {/* Progress bar */}
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden p-1 border border-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="mt-4 flex justify-between text-sm font-bold text-gray-500 uppercase tracking-widest">
            <span>STARTING</span>
            <span className="text-blue-400">{progress}%</span>
            <span>FINISHING</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          <StatusItem 
            icon={<Database className="w-6 h-6" />} 
            label="Storage" 
            status={progress > 30 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<Search className="w-6 h-6" />} 
            label="Organizing" 
            status={progress > 60 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<Sparkles className="w-6 h-6" />} 
            label="AI Setup" 
            status={progress > 80 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<ShieldCheck className="w-6 h-6" />} 
            label="Securing" 
            status={progress === 100 ? 'completed' : 'pending'} 
          />
        </div>
      </div>

      {/* Futuristic floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-blue-500/10 rounded-full animate-spin-slow" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-cyan-500/10 rounded-full animate-reverse-spin" />
    </div>
  );
}

function StatusItem({ icon, label, status }: { icon: React.ReactNode; label: string; status: 'pending' | 'active' | 'completed' }) {
  return (
    <div className={clsx(
      "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-500",
      status === 'pending' && "border-gray-800 bg-gray-900/50 opacity-40 grayscale",
      status === 'active' && "border-blue-500/40 bg-blue-500/5 animate-pulse",
      status === 'completed' && "border-emerald-500/40 bg-emerald-500/5"
    )}>
      <div className={clsx(
        "p-3 rounded-xl",
        status === 'active' && "text-blue-400",
        status === 'completed' && "text-emerald-400",
        status === 'pending' && "text-gray-500"
      )}>
        {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-tighter text-gray-400">{label}</span>
    </div>
  );
}
