import { apiFetch } from '@/lib/api';

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export const billingApi = {
  /**
   * Initiates a Dodo Payments checkout session.
   * @param customerId The internal UUID of the customer.
   * @param plan The requested plan (BRONZE, SILVER, GOLD).
   */
  createCheckoutSession: async (customerId: string, plan: string): Promise<CheckoutSession> => {
    return apiFetch<CheckoutSession>('/dodopayments/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        plan: plan,
      }),
    });
  },

  /**
   * Fetches the current customer's billing and subscription status.
   */
  getBillingInfo: async (): Promise<any> => {
    return apiFetch<any>('/dodopayments/billing-info');
  },

  /**
   * Restoration of disconnected subscriptions.
   */
  restorePurchase: async (): Promise<any> => {
    return apiFetch<any>('/dodopayments/restore-purchase', {
      method: 'POST',
    });
  },

  /**
   * Fetches the current customer's payment history from Dodo Payments.
   */
  getPayments: async (): Promise<any[]> => {
    return apiFetch<any[]>('/dodopayments/payments');
  },
};
