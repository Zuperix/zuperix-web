'use client';

import Link from 'next/link';
import { HomeIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-10 animate-pulse delay-700" />

      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <QuestionMarkCircleIcon className="h-24 w-24 text-blue-500 animate-bounce" />
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20" />
            </div>
          </div>
          
          <h1 className="text-8xl font-black text-white tracking-tighter italic">404</h1>
          <h2 className="text-3xl font-bold text-gray-200 tracking-tight">
            Congratulations! You found... <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">absolutely nothing.</span>
          </h2>
          
          <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
            You've managed to navigate to a page that doesn't exist. 
            You're basically a digital explorer, just a very, very lost one. 
            Maybe try a button that actually goes somewhere?
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-950 font-bold rounded-2xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-white/5 group"
          >
            <HomeIcon className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
            Take me back to civilization
          </Link>
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
    </div>
  );
}
