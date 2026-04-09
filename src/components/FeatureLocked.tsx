import { SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface FeatureLockedProps {
  featureName: string;
  description: string;
  title?: string;
}

export default function FeatureLocked({ featureName, description, title }: FeatureLockedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] animate-in fade-in zoom-in duration-700">
      <div className="relative max-w-xl w-full text-center">
        {/* Multi-layered decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px]" />
        
        <div className="relative bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Subtle top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">
              <SparklesIcon className="h-3 w-3" />
              Premium Feature
            </div> */}
            
            <div className="p-5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[24px] border border-white/10 shadow-inner relative group">
              <RocketLaunchIcon className="h-12 w-12 text-blue-400 transition-transform group-hover:scale-110 duration-500" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">
            {title || `Ready to unlock ${featureName}?`}
          </h2>
          
          <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm mx-auto">
            {description}
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/settings/billing"
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-gray-950 px-10 py-4 rounded-2xl transition-all font-black text-sm tracking-wide hover:bg-blue-50 hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/10"
            >
              Upgrade Your Plan
              <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link 
              href="/settings/billing" 
              className="text-xs text-gray-500 hover:text-blue-400 font-bold transition-colors uppercase tracking-widest"
            >
              Compare Plans & Options
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
