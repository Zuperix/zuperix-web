import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Upload Status', template: '%s | Zuperix' },
};

export default function UploadStatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
