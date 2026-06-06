'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import SubscriptionLocked from './SubscriptionLocked';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // If loading or no user, let parent components handle it
  if (loading || !user || !user.customer) {
    return <>{children}</>;
  }

  const { plan, created_at, is_disabled } = user.customer;

  // 1. Check if manually disabled
  const isDisabled = is_disabled === true;

  // 2. Check if free trial has expired
  const isTrialExpired = (() => {
    if (plan === 'FREE_TIER' && created_at) {
      const trialDurationDays = 14;
      const createdAtTime = new Date(created_at).getTime();
      const now = new Date().getTime();
      const daysSinceCreation = Math.floor((now - createdAtTime) / (1000 * 60 * 60 * 24));
      return daysSinceCreation >= trialDurationDays;
    }
    return false;
  })();

  const isSuspended = isDisabled || isTrialExpired;

  if (isSuspended) {
    const isSuperAdmin = user.system_role === 'SUPER_ADMIN';
    const isBillingPage = pathname === '/settings/billing';

    // If on the billing page AND the user is a super admin, allow them to view it to upgrade/reactivate.
    // If not, render the locked overlay.
    if (isSuperAdmin && isBillingPage) {
      return <>{children}</>;
    }

    return <SubscriptionLocked />;
  }

  return <>{children}</>;
}
