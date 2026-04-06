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
  ExclamationCircleIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDoubleDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { usePermissions, SystemRole } from '@/hooks/usePermissions';
import { billingApi } from '@/services/billing.api';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import DowngradeWarningModal from '@/components/DowngradeWarningModal';

const PLAN_ICONS = {
  FREE_TIER: AcademicCapIcon,
  BRONZE: AcademicCapIcon,
  SILVER: RocketLaunchIcon,
  GOLD: BoltIcon,
  ENTERPRISE: GlobeAltIcon,
};

const PLAN_NAMES = {
  FREE_TIER: 'Free Trial',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  ENTERPRISE: 'Enterprise',
};

const PLAN_WEIGHTS: Record<string, number> = {
  FREE_TIER: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  ENTERPRISE: 4,
};

const PLANS = [
  { 
    id: 'BRONZE', 
    name: 'Bronze', 
    monthlyPrice: 10, 
    yearlyPrice: 99, 
    color: 'border-amber-500/30', 
    bg: 'bg-amber-500/5', 
    text: 'text-amber-400' 
  },
  { 
    id: 'SILVER', 
    name: 'Silver', 
    monthlyPrice: 25, 
    yearlyPrice: 249, 
    color: 'border-blue-500/50', 
    bg: 'bg-blue-500/5', 
    text: 'text-blue-400',
    popular: true 
  },
  { 
    id: 'GOLD', 
    name: 'Gold', 
    monthlyPrice: 99, 
    yearlyPrice: 990, 
    color: 'border-purple-500/30', 
    bg: 'bg-purple-500/5', 
    text: 'text-purple-400'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 0, 
    displayMonthlyPrice: 'Custom',
    yearlyPrice: 0,
    displayYearlyPrice: 'Custom',
    color: 'border-gray-500/30',
    bg: 'bg-gray-500/5',
    text: 'text-gray-400',
    isEnterprise: true
  }
];

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [isFetchingPayments, setIsFetchingPayments] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

  // Downgrade Management
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

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
    if (planId === 'ENTERPRISE') {
      window.open('mailto:support@zuperix.com?subject=Enterprise Inquiry');
      return;
    }
    
    if (planId === 'GOLD' && process.env.NODE_ENV === 'production') return;

    // Determine if it's an upgrade or downgrade
    const currentWeight = PLAN_WEIGHTS[billingInfo.plan as keyof typeof PLAN_WEIGHTS] || 0;
    const targetWeight = PLAN_WEIGHTS[planId as keyof typeof PLAN_WEIGHTS] || 0;

    if (targetWeight < currentWeight) {
      setTargetPlanId(planId);
      setIsDowngradeModalOpen(true);
      return;
    }

    setLoading(planId);
    try {
      const { checkout_url } = await billingApi.createCheckoutSession(user!.customer!.id, planId, billingCycle);
      window.location.href = checkout_url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to initialize checkout');
    } finally {
      setLoading(null);
    }
  };

  const confirmDowngrade = async () => {
    if (!targetPlanId) return;
    setIsDowngradeModalOpen(false);
    setLoading(targetPlanId);
    
    try {
      const { checkout_url } = await billingApi.createCheckoutSession(user!.customer!.id, targetPlanId, billingCycle);
      window.location.href = checkout_url;
    } catch (error: any) {
      console.error('Downgrade error:', error);
      toast.error(error.message || 'Failed to initialize downgrade process');
    } finally {
      setLoading(null);
      setTargetPlanId(null);
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
  const currentWeight = PLAN_WEIGHTS[billingInfo.plan as keyof typeof PLAN_WEIGHTS] || 0;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">View and manage your workspace subscription and history.</p>
      </header>

      {/* Subscription Card - Minimalist */}
      <section className="mb-16">
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row gap-10 items-start md:items-center relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <PlanIcon className="h-32 w-32 -mr-10 -mt-10" />
          </div>

          <div className={`p-6 rounded-3xl bg-blue-500/10 text-blue-400 z-10`}>
             <PlanIcon className="h-12 w-12" />
          </div>

          <div className="flex-1 z-10">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{PLAN_NAMES[billingInfo.plan as keyof typeof PLAN_NAMES]}</h2>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${billingInfo.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {billingInfo.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
              {isTrial ? (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Trial Status</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                    <ClockIcon className="h-4 w-4 text-blue-500" />
                    {billingInfo.trial_days_left} days remaining
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Renewal Date</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                    <CalendarDaysIcon className="h-4 w-4 text-emerald-500" />
                    {billingInfo.next_billing_date ? new Date(billingInfo.next_billing_date).toLocaleDateString() : 'Manual Renewal'}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Billing Method</p>
                <div className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-500" />
                  {billingInfo.dodo_subscription_id ? 'Dodo Payments' : 'No Active Billing'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
            <button
               onClick={handleRestore}
               disabled={loading === 'restore'}
               className="px-6 py-3.5 bg-transparent border border-gray-800 hover:bg-gray-800/10 text-gray-500 hover:text-white font-black rounded-2xl transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-widest"
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
      </section>

      {/* Available Plans Grid - Restored Minimalist */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
           <div>
             <h3 className="text-2xl font-black text-white mb-1 tracking-tight">Change Your Plan</h3>
             <p className="text-gray-500 text-sm font-medium">Select a tier that best fits your workspace needs.</p>
           </div>
           
           <div className="flex items-center bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800 shadow-xl">
             <button
               onClick={() => setBillingCycle('MONTHLY')}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${billingCycle === 'MONTHLY' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Monthly
             </button>
             <button
               onClick={() => setBillingCycle('YEARLY')}
               className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${billingCycle === 'YEARLY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Yearly
               <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${billingCycle === 'YEARLY' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                 -16% OFF
               </span>
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === billingInfo.plan;
            const targetWeight = PLAN_WEIGHTS[plan.id as keyof typeof PLAN_WEIGHTS] || 0;
            const isUpgrade = targetWeight > currentWeight;
            const isDowngrade = targetWeight < currentWeight;

            return (
              <div 
                key={plan.id}
                className={`relative p-8 rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xl ${plan.color} ${plan.bg} ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-black' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest py-1 px-8 rotate-45 translate-x-3 translate-y-2 shadow-sm">
                      Current
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xl font-black text-white mb-1 tracking-tighter">{plan.name}</h4>
                  
                  <div className="flex items-baseline gap-1 mt-6">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {plan.isEnterprise ? (billingCycle === 'MONTHLY' ? plan.displayMonthlyPrice : plan.displayYearlyPrice) : `$${billingCycle === 'MONTHLY' ? plan.monthlyPrice : Math.floor((plan.yearlyPrice as number) / 12)}`}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">{plan.isEnterprise ? '' : '/mo'}</span>
                  </div>

                  {!plan.isEnterprise && billingCycle === 'YEARLY' && (
                    <p className="mt-2 text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                       Save ${plan.id === 'GOLD' ? '198' : plan.id === 'SILVER' ? '51' : '21'} Yearly
                    </p>
                  )}
                </div>

                <div className="space-y-4 mt-8">
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!loading || isCurrent || (plan.id === 'GOLD' && process.env.NODE_ENV === 'production')}
                    className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl active:scale-95 uppercase flex items-center justify-center gap-2
                      ${isCurrent 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        : isUpgrade
                          ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                      }
                      ${(plan.id === 'GOLD' && process.env.NODE_ENV === 'production') ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.id ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto text-black" />
                    ) : isCurrent ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (plan.id === 'GOLD' && process.env.NODE_ENV === 'production') ? (
                      'Coming Soon'
                    ) : isUpgrade ? (
                      <>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        Upgrade
                      </>
                    ) : plan.isEnterprise ? (
                      'Inquiry'
                    ) : (
                      <>
                        <ChevronDoubleDownIcon className="w-4 h-4" />
                        Downgrade
                      </>
                    )}
                  </button>

                  <a 
                    href="https://zuperix.com/pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]"
                  >
                    Features
                    <ArrowPathIcon className="w-3 h-3 rotate-45" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment History */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold text-white tracking-tight">Payment History</h3>
           <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.2em]">{payments.length} Records Found</span>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {isFetchingPayments ? (
            <div className="p-12 flex justify-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-700 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gray-800/20 p-6 rounded-full w-fit mx-auto mb-6">
                <CalendarDaysIcon className="h-10 w-10 text-gray-700" />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No transactions recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/50 text-[10px] uppercase font-black text-gray-500 tracking-[0.3em]">
                    <th className="px-10 py-6">Date</th>
                    <th className="px-10 py-6">Amount</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/30">
                  {payments.map((payment) => (
                    <tr key={payment.payment_id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-10 py-6 text-sm text-gray-400 font-medium">
                        {new Date(payment.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-black text-white tracking-tight">
                          {(payment.total_amount / 100).toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: payment.currency 
                          })}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                             payment.status === 'succeeded' ? 'bg-emerald-500' : 
                             payment.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <span className={`text-[10px] uppercase font-black tracking-tighter ${
                            payment.status === 'succeeded' ? 'text-emerald-500' : 
                            payment.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        {payment.invoice_url ? (
                          <a 
                            href={payment.invoice_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] font-black text-blue-500 hover:text-white transition-all uppercase tracking-widest bg-blue-500/5 hover:bg-blue-500 px-3 py-1.5 rounded-lg border border-blue-500/20"
                          >
                            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest italic">Pending</span>
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

      {/* Downgrade Warning Modal */}
      <DowngradeWarningModal
        isOpen={isDowngradeModalOpen}
        onClose={() => setIsDowngradeModalOpen(false)}
        onConfirm={confirmDowngrade}
        targetPlanName={PLAN_NAMES[targetPlanId as keyof typeof PLAN_NAMES] || ''}
        isProcessing={!!loading}
      />
    </div>
  );
}
