import GuestUploadPortal from '@/components/portals/GuestUploadPortal';
import { BASE_URL } from '@/lib/api';

export const metadata = {
  title: 'Upload Assets - Zuperix',
  description: 'Upload assets directly to a Zuperix workspace.',
};

export default async function GuestUploadPage({ params }: { params: { token: string } }) {
  // Optionals: we can fetch link data server-side or client-side. Client-side is fine for this demo.
  return <GuestUploadPortal token={params.token} />;
}
