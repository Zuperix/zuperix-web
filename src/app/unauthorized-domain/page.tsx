'use client';

import { ExclamationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedDomain() {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.zuperix.com';

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] bg-red-600/10 blur-[150px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-blue-600/10 blur-[150px] rounded-full -z-10 animate-pulse delay-700" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <ExclamationCircleIcon className="h-28 w-28 text-white animate-bounce-slow" />
              <div className="absolute inset-0 bg-white blur-3xl opacity-20" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase italic">
              Wait a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">second.</span>
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-400 tracking-tight max-w-lg mx-auto leading-relaxed">
              You're trying to access the dashboard on the <span className="text-white">Portals domain.</span>
            </h2>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl max-w-xl mx-auto shadow-2xl">
            <p className="text-gray-300 text-lg font-medium leading-relaxed mb-6">
              This domain is exclusively for viewing shared portals. To manage your assets, workspaces, and settings, you'll need to head over to the main dashboard.
            </p>
            
            <a
              href={dashboardUrl}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-gray-950 font-black rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              Go to Dashboard
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <div className="pt-12 text-[10px] font-bold text-gray-600 uppercase tracking-[0.5em] select-none">
          Zuperix Security & Routing Protocol
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
