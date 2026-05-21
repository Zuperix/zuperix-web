import PublicShareLink from '@/components/PublicShareLink';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { uuid } = await params;
  
  const defaultMeta = {
    title: 'Shared Assets | Zuperix',
    description: 'Secure shared assets from Zuperix',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title: 'Shared Assets',
      description: 'Secure shared assets from Zuperix',
      images: [
        {
          url: 'https://zuperix.com/images/og-share-default.png',
          width: 1200,
          height: 630,
          alt: 'Zuperix Secure Share',
        },
      ],
      type: 'website',
    },
  };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${baseUrl}/share-links/${uuid}/meta`, { next: { revalidate: 10 } });
    if (res.ok) {
      const response = await res.json();
      const metaData = response.data !== undefined ? response.data : response;
      const titleText = metaData.title || 'Shared Assets';
      const descText = metaData.description || 'Secure shared assets page from Zuperix';
      return {
        title: `${titleText} | Zuperix`,
        description: descText,
        robots: defaultMeta.robots,
        openGraph: {
          title: titleText,
          description: descText,
          images: defaultMeta.openGraph.images,
          type: 'website',
        },
      };
    }
  } catch (e) {}

  return defaultMeta;
}

export default async function Page({ params }: Props) {
  const { uuid } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  
  let initialMeta = null;
  let initialError = null;

  try {
    const metaRes = await fetch(`${baseUrl}/share-links/${uuid}/meta`, { next: { revalidate: 10 } });
    if (!metaRes.ok) throw new Error('Shared link not found or has expired');
    const response = await metaRes.json();
    initialMeta = response.data !== undefined ? response.data : response;
  } catch (err: any) {
    initialError = err.message || 'Failed to load shared link';
  }

  return (
    <PublicShareLink 
      uuid={uuid} 
      initialMeta={initialMeta} 
      initialError={initialError} 
    />
  );
}
