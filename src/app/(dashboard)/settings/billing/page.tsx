'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  RocketLaunchIcon, 
  BoltIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { usePermissions, SystemRole } from '@/hooks/usePermissions';
import { billingApi } from '@/services/billing.api';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

const PLAN_ICONS = {
  FREE_TIER: AcademicCapIcon,
  BRONZE: AcademicCapIcon,
  SILVER: RocketLaunchIcon,
  GOLD: BoltIcon,
};

const PLAN_NAMES = {
  FREE_TIER: 'Free Trial',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
};

const PLANS = [
  { id: 'BRONZE', name: 'Bronze', price: '$10', color: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400' },
  { id: 'SILVER', name: 'Silver', price: '$25', color: 'border-blue-500/50', bg: 'bg-blue-500/5', text: 'text-blue-400' },
  { id: 'GOLD', name: 'Gold', price: '$59', color: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400' },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [isFetchingPayments, setIsFetchingPayments] = useState(true);

  // Security Check: Only SUPER_ADMIN can see this page
  if (user && user.system_role !== SystemRole.SUPER_ADMIN) {
    redirect('/settings');
  }

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await billingApi.getBillingInfo();
        setBillingInfo(info);
      } catch (error) {
        console.error('Failed to fetch billing info:', error);
        toast.error('Failed to load real-time billing data');
      } finally {
        setIsFetchingInfo(false);
      }
    };
    fetchInfo();

    const fetchPayments = async () => {
      try {
        const history = await billingApi.getPayments();
        setPayments(history);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setIsFetchingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === billingInfo?.plan) {
      toast('You are already on this plan', { icon: 'ℹ️' });
      return;
    }

    setLoading(planId);
    try {
      const { checkout_url } = await billingApi.createCheckoutSession(user!.customer!.id, planId);
      window.location.href = checkout_url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to initialize checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    try {
      const result = await billingApi.restorePurchase();
      if (result.success) {
        toast.success(`Subscription restored! You are now on the ${PLAN_NAMES[result.plan as keyof typeof PLAN_NAMES]} plan.`);
        const info = await billingApi.getBillingInfo();
        setBillingInfo(info);
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(error.message || 'No active subscription found to restore');
    } finally {
      setLoading(null);
    }
  };

  if (isFetchingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const PlanIcon = PLAN_ICONS[billingInfo.plan as keyof typeof PLAN_ICONS] || AcademicCapIcon;
  const isTrial = billingInfo.is_trial;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">Manage your workspace plan and payment information.</p>
      </header>

      {/* Current Subscription Status */}
      <section className="mb-16">
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row gap-10 items-start md:items-center">
          <div className={`p-6 rounded-3xl bg-blue-500/10 text-blue-400`}>
             <PlanIcon className="h-12 w-12" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{PLAN_NAMES[billingInfo.plan as keyof typeof PLAN_NAMES]}</h2>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${billingInfo.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {billingInfo.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {isTrial ? (
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Trial Status</p>
                    <p className="text-sm text-gray-300">{billingInfo.trial_days_left} days remaining</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Next Billing Date</p>
                    <p className="text-sm text-gray-300">
                      {billingInfo.next_billing_date ? new Date(billingInfo.next_billing_date).toLocaleDateString() : 'Manual Renewal Required'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Payment Method</p>
                  <p className="text-sm text-gray-300">{billingInfo.dodo_subscription_id ? 'Dodo Payments' : 'No active subscription'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
               onClick={handleRestore}
               disabled={loading === 'restore'}
               className="px-6 py-3 bg-transparent border border-gray-800 hover:bg-gray-800/10 text-gray-400 hover:text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading === 'restore' ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              Restore Purchase
            </button>
          </div>
        </div>
        
        {isTrial && (
           <div className="mt-4 px-6 py-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-blue-400 font-medium">Your free trial ends soon. Upgrade now to prevent service interruption.</p>
           </div>
        )}
      </section>

      {/* Payment History */}
      <section className="mb-16">
        <h3 className="text-xl font-bold text-white mb-6">Payment History</h3>
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden">
          {isFetchingPayments ? (
            <div className="p-8 flex justify-center">
              <ArrowPathIcon className="h-6 w-6 text-gray-600 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-800/50 p-4 rounded-full w-fit mx-auto mb-4">
                <CalendarDaysIcon className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-500 font-medium">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Amount</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {payments.map((payment) => (
                    <tr key={payment.payment_id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5 text-sm text-gray-300">
                        {new Date(payment.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-white">
                          {(payment.total_amount / 100).toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: payment.currency 
                          })}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {payment.status === 'succeeded' ? (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                          ) : payment.status === 'failed' ? (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          ) : (
                            <ExclamationCircleIcon className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={`text-[10px] uppercase font-bold tracking-tight ${
                            payment.status === 'succeeded' ? 'text-emerald-500' : 
                            payment.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {payment.invoice_url ? (
                          <a 
                            href={payment.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">Processing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Available Plans */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold text-white">Available Plans</h3>
           <a href="https://zuperix.com/pricing" target="_blank" className="text-sm text-blue-500 hover:underline">Full feature list</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`p-8 rounded-3xl border ${plan.color} ${plan.bg} flex flex-col justify-between transition-all hover:scale-[1.02]`}
            >
              <div>
                <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-gray-500">/mo</span>
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={!!loading || plan.id === billingInfo.plan}
                className={`mt-8 w-full py-3 rounded-xl font-bold transition-all
                  ${plan.id === billingInfo.plan
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                 {loading === plan.id ? (
                   <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto text-black" />
                 ) : (
                   plan.id === billingInfo.plan ? 'Current Plan' : (isTrial ? 'Choose Plan' : 'Switch Plan')
                 )}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
