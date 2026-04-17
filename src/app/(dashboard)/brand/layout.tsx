import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brand Kit',
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
