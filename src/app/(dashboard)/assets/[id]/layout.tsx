import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${baseUrl}/assets/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const { data } = await res.json();
      return {
        title: data?.original_name || `Asset: ${id}`,
      };
    }
  } catch (e) {
    console.error('Metadata generation failed:', e);
  }

  return { title: 'Asset Details' };
}

export default function AssetDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
