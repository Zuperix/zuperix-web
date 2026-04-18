import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Webhooks', template: '%s | Zuperix' },
};

export default function WebhooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
