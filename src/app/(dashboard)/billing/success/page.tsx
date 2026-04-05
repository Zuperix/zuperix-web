'use client';

import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-700">
      <div className="p-4 bg-emerald-500/10 rounded-full mb-8">
        <CheckBadgeIcon className="h-20 w-20 text-emerald-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Payment Successful!</h1>
      <p className="text-xl text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
        Thank you for upgrading! Your workspace features are being unlocked now. Use the dashboard to explore your new tools.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-opacity-90 transition-all active:scale-95"
        >
          Go to Dashboard
        </Link>
        <Link 
          href="/settings/billing"
          className="px-8 py-3 bg-gray-900 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
        >
          View Billing
        </Link>
      </div>
    </div>
  );
}
