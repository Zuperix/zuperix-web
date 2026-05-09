'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { CheckCircle2, Loader2, Rocket, Building2, Globe, Sparkles, Database, Search, ShieldCheck, Mail, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';

import OnboardingBackground from '@/components/OnboardingBackground';
import Link from 'next/link';

type OnboardingStage = 'form' | 'setup';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>('form');
  const [companyName, setCompanyName] = useState(user?.customer?.name || '');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [setupProgress, setSetupProgress] = useState(0);
  const isSampleSyncEnabled = useFeatureFlag('sample-asset-sync', false);

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
          business_email: businessEmail,
          website_url: websiteUrl,
          industry,
        }),
      });

      if (isSampleSyncEnabled) {
        setStage('setup');
      } else {
        window.location.href = '/';
      }
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
            window.location.href = '/';
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

  if (authLoading || (user?.customer?.is_onboarding_completed && process.env.NEXT_PUBLIC_SHOW_ONBOARDING !== 'true')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (stage === 'setup') {
    return <SetupAnimation progress={setupProgress} isSampleSyncEnabled={isSampleSyncEnabled} />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">
      <OnboardingBackground />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-xl mx-4 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl border border-white/20 dark:border-gray-800/50 rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_48px_128px_-16px_rgba(0,0,0,0.5)] p-10 md:p-14 space-y-10">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 rounded-3xl mb-2 group shadow-inner">
              <Rocket className="w-10 h-10 text-blue-600 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Welcome, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
              We&apos;re excited to have you. Let&apos;s personalize your new creative workspace.
            </p>
          </div>

          {error && (
            <div className="p-4 text-sm font-bold text-red-600 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-8 bg-red-600 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 px-1">
                  <Building2 className="w-3.5 h-3.5" /> Company Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 dark:text-white outline-none transition-all placeholder-gray-400 font-medium shadow-sm"
                  placeholder="Acme Global"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 px-1">
                  <Mail className="w-3.5 h-3.5" /> Business Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 dark:text-white outline-none transition-all placeholder-gray-400 font-medium shadow-sm"
                  placeholder="billing@acme.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 px-1">
                  <Globe className="w-3.5 h-3.5" /> Website
                </label>
                <input
                  type="url"
                  className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 dark:text-white outline-none transition-all placeholder-gray-400 font-medium shadow-sm"
                  placeholder="https://acme.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 px-1">
                  <Briefcase className="w-3.5 h-3.5" /> Industry
                </label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 dark:text-white outline-none transition-all appearance-none font-medium shadow-sm"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="marketing">Marketing & Creative</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail & E-commerce</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 px-1 py-2 group/terms cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
              <div className={clsx(
                "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                termsAccepted ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 group-hover/terms:border-blue-500/50"
              )}>
                {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  I accept the <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 font-bold underline underline-offset-4 decoration-blue-600/20" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 font-medium leading-relaxed">
                  By checking this, you agree to our data processing and acceptable use policies.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !companyName || !businessEmail || !termsAccepted}
              className="group relative w-full py-5 font-black uppercase tracking-widest text-sm text-white bg-blue-600 rounded-[1.5rem] hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all active:scale-[0.98] overflow-hidden shadow-2xl shadow-blue-600/20 disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </form>

          {isSampleSyncEnabled && (
            <div className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-gray-100 dark:border-gray-800/40">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                We&apos;ll auto-populate some sample assets for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SetupAnimation({ progress, isSampleSyncEnabled }: { progress: number; isSampleSyncEnabled: boolean }) {
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
            {isSampleSyncEnabled 
              ? "We're setting up your library and adding some sample assets so you can jump right in."
              : "We're setting up your professional digital asset management workspace."}
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
