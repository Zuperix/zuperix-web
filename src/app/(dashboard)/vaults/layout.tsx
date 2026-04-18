import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Vaults', template: '%s | Zuperix' },
};

export default function VaultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
