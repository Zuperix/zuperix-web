import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Billing & Plans', template: '%s | Zuperix' },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
