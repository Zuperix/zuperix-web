import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Brand Kit',
    template: `%s | Zuperix`,
  },
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
