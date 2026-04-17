import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys',
};

export default function ApiKeysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
