'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { CheckCircle2, Loader2, Rocket, Building2, Globe, Database, Search, ShieldCheck, Mail, Briefcase, Settings, Cpu, Layers, Users } from 'lucide-react';
import { clsx } from 'clsx';

import OnboardingBackground from '@/components/OnboardingBackground';
import Link from 'next/link';

type OnboardingStage = 'form' | 'setup';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>('form');
  const [companyName, setCompanyName] = useState(user?.customer?.name || '');
  const [teamSize, setTeamSize] = useState('');
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
    if (!companyName || !teamSize) return;

    setLoading(true);
    setError('');

    try {
      await apiFetch('/onboarding/setup', {
        method: 'PATCH',
        body: JSON.stringify({
          name: companyName,
          team_size: teamSize,
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-[#0c0e17] text-white">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 blur-[130px] rounded-full pointer-events-none" />
      
      <OnboardingBackground />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-xl mx-4 animate-in fade-in zoom-in duration-700">
        <div className="bg-[#121420]/80 border border-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] p-8 md:p-12 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2 shadow-sm border border-indigo-500/10">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              We&apos;re excited to have you. Let&apos;s personalize your new creative workspace.
            </p>
          </div>

          {error && (
            <div className="p-4 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
              <div className="w-1 h-6 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 px-0.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" /> Company Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-white outline-none transition-all duration-200 placeholder-gray-600 text-sm font-medium"
                  placeholder="Acme Global"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 px-0.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" /> Team Size
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full px-4 py-3 bg-[#121420] border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-white outline-none appearance-none text-sm font-medium"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    <option value="" className="bg-[#121420]">Select team size</option>
                    <option value="1-5" className="bg-[#121420]">1-5 people</option>
                    <option value="6-25" className="bg-[#121420]">6-25 people</option>
                    <option value="26-100" className="bg-[#121420]">26-100 people</option>
                    <option value="101-500" className="bg-[#121420]">101-500 people</option>
                    <option value="500+" className="bg-[#121420]">500+ people</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 px-0.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" /> Website
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-white outline-none transition-all duration-200 placeholder-gray-600 text-sm font-medium"
                  placeholder="https://acme.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 px-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500" /> Industry
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-[#121420] border border-white/10 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-white outline-none transition-all appearance-none text-sm font-medium"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="" className="bg-[#121420]">Select industry</option>
                    <option value="technology" className="bg-[#121420]">Technology</option>
                    <option value="marketing" className="bg-[#121420]">Marketing & Creative</option>
                    <option value="manufacturing" className="bg-[#121420]">Manufacturing</option>
                    <option value="retail" className="bg-[#121420]">Retail & E-commerce</option>
                    <option value="other" className="bg-[#121420]">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 px-1 py-1 group/terms cursor-pointer select-none" onClick={() => setTermsAccepted(!termsAccepted)}>
              <div className={clsx(
                "mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0",
                termsAccepted ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-white/[0.02] border-white/10 group-hover/terms:border-indigo-500/50"
              )}>
                {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold text-gray-300">
                  I accept the <Link href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/20" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
                </p>
                <p className="text-[10px] text-gray-500 leading-normal">
                  By checking this, you agree to our data processing and acceptable use policies.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !companyName || !teamSize || !termsAccepted}
              className="w-full py-4 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-[0_8px_30px_rgb(99,102,241,0.2)] hover:shadow-[0_8px_32px_rgb(99,102,241,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup'}
              </span>
            </button>
          </form>

          {isSampleSyncEnabled && (
            <div className="flex items-center gap-3 py-3 px-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <p className="text-[11px] font-medium text-indigo-300">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080e] text-white overflow-hidden">
      <div className="relative w-full max-w-2xl px-8 py-16 text-center space-y-10">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full -z-10 animate-pulse" />

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold tracking-wide animate-bounce">
             <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Creating your workspace
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Getting everything <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">ready for you</span>
          </h2>
          <p className="text-gray-400 text-sm font-normal max-w-md mx-auto leading-relaxed">
            {isSampleSyncEnabled 
              ? "We're setting up your library and adding some sample assets so you can jump right in."
              : "We're setting up your professional digital asset management workspace."}
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          {/* Progress bar */}
          <div className="h-3 w-full bg-white/[0.04] rounded-full overflow-hidden p-[2px] border border-white/[0.06]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="mt-3 flex justify-between text-[10px] font-bold text-gray-500 tracking-wider">
            <span>STARTING</span>
            <span className="text-indigo-400">{progress}%</span>
            <span>FINISHING</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
          <StatusItem 
            icon={<Database className="w-5 h-5" />} 
            label="Storage" 
            status={progress > 30 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<Search className="w-5 h-5" />} 
            label="Organizing" 
            status={progress > 60 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<Cpu className="w-5 h-5" />} 
            label="Metadata Engine" 
            status={progress > 80 ? 'active' : 'pending'} 
          />
          <StatusItem 
            icon={<ShieldCheck className="w-5 h-5" />} 
            label="Securing" 
            status={progress === 100 ? 'completed' : 'pending'} 
          />
        </div>
      </div>

      {/* Futuristic floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-indigo-500/5 rounded-full animate-spin-slow" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-cyan-500/5 rounded-full animate-reverse-spin" />
    </div>
  );
}

function StatusItem({ icon, label, status }: { icon: React.ReactNode; label: string; status: 'pending' | 'active' | 'completed' }) {
  return (
    <div className={clsx(
      "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 bg-white/[0.01]",
      status === 'pending' && "border-white/[0.06] opacity-30",
      status === 'active' && "border-indigo-500/30 bg-indigo-500/5 text-indigo-400 scale-[1.02] shadow-sm shadow-indigo-500/5 animate-pulse",
      status === 'completed' && "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
    )}>
      <div className={clsx(
        "p-2 rounded-lg shrink-0",
        status === 'active' && "bg-indigo-500/10 text-indigo-400",
        status === 'completed' && "bg-emerald-500/10 text-emerald-400",
        status === 'pending' && "bg-white/[0.02] text-gray-600"
      )}>
        {status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </div>
      <span className="text-xs font-bold tracking-tight">{label}</span>
    </div>
  );
}
