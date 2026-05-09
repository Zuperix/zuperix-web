'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
            <div className="relative group">
              <div className="w-72 h-72 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2">
                <Image
                  src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDFiMDhibmNhNnd2MWl1YXY3cXFmbDMwaWc4ZGtmZjNmeGY3bTd2NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/eRKDMSarMgSWXGag9Z/giphy.gif"
                  alt="System Error"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent opacity-60" />
              </div>
              <div className="absolute -inset-4 bg-red-500/20 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-7xl font-black text-white tracking-widest italic uppercase">500</h1>
            <h2 className="text-3xl font-bold text-gray-200 tracking-tight">
              Oh brilliant. <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Our servers are having a meltdown.</span>
            </h2>
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
