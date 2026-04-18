import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'API Keys', template: '%s | Zuperix' },
};

export default function ApiKeysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
