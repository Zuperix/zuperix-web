import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Public Portals',
    template: `%s | Zuperix`,
  },
};

export default function PortalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
