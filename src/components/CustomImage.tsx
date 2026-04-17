import React, { forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { getShimmerDataUrl } from '@/lib/image';

export interface CustomImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  /**
   * Optional width for the shimmer SVG. Defaults to 400.
   */
  shimmerWidth?: number;
  /**
   * Optional height for the shimmer SVG. Defaults to 300.
   */
  shimmerHeight?: number;
}

/**
 * A customized Next.js Image component that automatically includes:
 * - Shimmer loading placeholder
 * - unoptimized={true} (optimized on backend)
 * - Standard defaults for Zuperix
 */
const CustomImage = forwardRef<HTMLImageElement, CustomImageProps>(
  ({ shimmerWidth = 400, shimmerHeight = 300, unoptimized = true, alt = "", ...props }, ref) => {
    return (
      <Image
        ref={ref}
        alt={alt}
        placeholder="blur"
        blurDataURL={getShimmerDataUrl(shimmerWidth, shimmerHeight)}
        unoptimized={unoptimized}
        {...props}
      />
    );
  }
);

CustomImage.displayName = 'CustomImage';

export default CustomImage;
