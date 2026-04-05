'use client';

import Link from 'next/link';
import { XCircleIcon } from '@heroicons/react/24/solid';

export default function PaymentCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in zoom-in duration-700">
      <div className="p-4 bg-orange-500/10 rounded-full mb-8">
        <XCircleIcon className="h-20 w-20 text-orange-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Checkout Cancelled</h1>
      <p className="text-xl text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
        Your payment attempt was cancelled. No charges were made to your account. Need another look at our plans?
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/settings/billing"
          className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-opacity-90 transition-all active:scale-95"
        >
          Return to Billing
        </Link>
        <Link 
          href="/"
          className="px-8 py-3 bg-gray-900 border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 justify-center"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
