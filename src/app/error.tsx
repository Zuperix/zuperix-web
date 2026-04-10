'use client';

import { useEffect } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] bg-red-600/10 blur-[150px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-blue-600/10 blur-[150px] rounded-full -z-10 animate-pulse delay-700" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <ExclamationTriangleIcon className="h-28 w-28 text-red-500 animate-pulse" />
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-7xl font-black text-white tracking-widest italic uppercase">500</h1>
            <h2 className="text-3xl font-bold text-gray-200 tracking-tight">
              Oh brilliant. <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Our servers are having a meltdown.</span>
            </h2>
          </div>
          
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 backdrop-blur-sm max-w-lg mx-auto">
            <p className="text-red-400/90 text-lg font-bold leading-relaxed mb-1">
              "Something went wrong." 
            </p>
            <p className="text-gray-400 text-sm font-medium">
              Which is dev-speak for "we have no idea what happened, but it's definitely not your fault. Probably." 
              We're already blaming each other in the Slack channel.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-gray-950 font-bold rounded-2xl hover:bg-red-50 transition-all active:scale-95 shadow-xl shadow-white/5 active:rotate-1"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try that again, maybe it'll work this time?
          </button>
          
          <a
            href="/"
            className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-gray-400 font-bold rounded-2xl border border-gray-800 hover:text-white hover:border-gray-700 transition-all active:scale-95"
          >
            Run away to the home page
          </a>
        </div>


      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
      
      {/* Decorative floating code snippets (if possible, but keep it clean) */}
      <div className="absolute top-20 right-20 text-red-500/5 text-xs font-mono select-none -rotate-12 blur-[1px]">TypeError: Cannot read properties of undefined</div>
      <div className="absolute bottom-40 left-10 text-blue-500/5 text-xs font-mono select-none rotate-12 blur-[1px]">ReferenceError: server_sanity is not defined</div>
    </div>
  );
}
