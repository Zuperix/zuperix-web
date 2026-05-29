import PublicPortal from '@/components/PublicPortal';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${baseUrl}/p/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const { data } = await res.json();
      return {
        title: data?.welcome_title || data?.name || `Portal`,
        description: data?.description || 'Shared assets from Zuperix',
        icons: data?.settings?.favicon_url ? {
          icon: data.settings.favicon_url,
          shortcut: data.settings.favicon_url,
          apple: data.settings.favicon_url,
        } : undefined,
      };
    }
  } catch (e) {}

  return { title: `Portal: ${slug}`, description: 'Shared assets from Zuperix' };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  
  let initialData = null;
  let initialAssets = null;
  let initialError = null;

  try {
    const portalRes = await fetch(`${baseUrl}/p/${slug}`, { cache: 'no-store' });
    if (!portalRes.ok) throw new Error('Portal not found');
    const portalResponse = await portalRes.json();
    initialData = portalResponse.data;

    if (initialData) {
      const searchRes = await fetch(`${baseUrl}/p/${slug}/search?page=1&limit=20`, { cache: 'no-store' });
      if (searchRes.ok) {
         const searchResponse = await searchRes.json();
         initialAssets = searchResponse.data;
      }
    }
  } catch (err: any) {
    initialError = err.message || 'Failed to load portal';
  }

  return (
    <PublicPortal 
      slug={slug} 
      initialData={initialData} 
      initialAssets={initialAssets} 
      initialError={initialError} 
    />
  );
}
