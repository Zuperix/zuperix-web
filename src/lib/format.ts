export function formatBytes(bytes: number) {
  if (bytes === 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function is3D(mime?: string, filename?: string) {
  const m = (mime || '').toLowerCase();
  const f = (filename || '').toLowerCase();
  return (
    m === 'model/gltf-binary' || 
    m === 'model/gltf+json' || 
    m.includes('model/') ||
    f.endsWith('.glb') || 
    f.endsWith('.gltf')
  );
}
