import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Categories',
    template: `%s | Zuperix`,
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
