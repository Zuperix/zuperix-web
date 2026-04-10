import GuestUploadPortal from '@/components/portals/GuestUploadPortal';
import { BASE_URL } from '@/lib/api';

export const metadata = {
  title: 'Upload Assets - Zuperix',
  description: 'Upload assets directly to a Zuperix workspace.',
};

export default async function GuestUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  return <GuestUploadPortal token={resolvedParams.token} />;
}
