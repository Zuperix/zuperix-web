import PublicPortal from '@/components/PublicPortal';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Portal: ${slug}`,
    description: 'Shared assets from Open DAM',
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <PublicPortal slug={slug} />;
}
