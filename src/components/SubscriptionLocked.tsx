'use client';

import { LockClosedIcon, ArrowRightOnRectangleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SubscriptionLocked() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user?.system_role === 'SUPER_ADMIN';

  const handleUpgrade = () => {
    router.push('/settings/billing');
  };

  const supportEmail = user?.customer?.business_email || 'support@zuperix.com';

  return (
    <div className="fixed inset-0 bg-[#060814]/95 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#0e111f]/60 border border-red-500/10 rounded-[24px] p-6 text-center shadow-2xl relative overflow-hidden group">
        
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Lock Icon badge */}
        <div className="mx-auto mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 w-fit shadow-lg shadow-red-500/5 animate-bounce">
          <LockClosedIcon className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Workspace Suspended
        </h1>
        
        <p className="text-gray-400 text-xs leading-relaxed mb-6 max-w-xs mx-auto font-medium">
          {isSuperAdmin
            ? 'Your workspace has been suspended because your free trial has ended or your subscription was cancelled. Please reactivate your plan to unlock all digital assets.'
            : 'Your workspace has been suspended due to an expired trial or subscription. Please contact your organization Super Admin to reactivate workspace access.'}
        </p>

        <div className="flex flex-col gap-2.5">
          {isSuperAdmin ? (
            <button
              onClick={handleUpgrade}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-black rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <CreditCardIcon className="h-3.5 w-3.5" />
              Upgrade / Reactivate
            </button>
          ) : null}

          <button
            onClick={async () => {
              await logout();
            }}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-black rounded-xl border border-white/10 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
            Logout & Switch Accounts
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center">
          <a
            href={`mailto:${supportEmail}?subject=Workspace%20Suspension%20Support%20Request`}
            className="text-[9px] font-black text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] hover:underline"
          >
            Contact support if you believe it's a mistake
          </a>
        </div>
      </div>
    </div>
  );
}
