export const FEATURES = {
  /**
   * Enables or disables the reverse image search (visual search) capability.
   */
  REVERSE_IMAGE_SEARCH: {
    key: "reverse-image-search",
    name: "Reverse Image Search",
  },
  FACE_DETECTION: {
    key: "face-detection",
    name: "Face Detection",
  },
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES]["key"];
export interface FeatureConfig {
  readonly key: string;
  readonly name: string;
}
