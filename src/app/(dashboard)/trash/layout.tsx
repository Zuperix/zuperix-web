import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Trash', template: '%s | Zuperix' },
};

export default function TrashLayout({ children }: { children: React.ReactNode }) {
  return children;
}
