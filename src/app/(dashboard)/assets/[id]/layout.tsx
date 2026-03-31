import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asset Details',
};

export default function AssetDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
