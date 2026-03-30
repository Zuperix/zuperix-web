declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': MyModelViewerAttributes;
  }
}

interface MyModelViewerAttributes extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string;
  poster?: string;
  alt?: string;
  'auto-rotate'?: boolean | string;
  'camera-controls'?: boolean | string;
  'shadow-intensity'?: string | number;
  'environment-image'?: string;
  'exposure'?: string | number;
  loading?: 'eager' | 'lazy';
  reveal?: 'auto' | 'manual' | 'interaction';
  ar?: boolean | string;
  'ar-modes'?: string;
  'touch-action'?: string;
  style?: any;
}
