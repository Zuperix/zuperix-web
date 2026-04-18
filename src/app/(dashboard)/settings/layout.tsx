import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Settings',
    template: `%s | Zuperix`,
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
