import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Portals',
};

export default function PortalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
