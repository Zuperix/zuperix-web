export interface BrandColor {
  id: string;
  brand_kit_id: string;
  name: string;
  color_hex: string;
  color_cmyk?: string;
  color_pantone?: string;
}

export interface BrandFont {
  id: string;
  brand_kit_id: string;
  name: string;
  font_family: string;
  font_url?: string;
  is_google_font: boolean;
}

export interface BrandLogo {
  id: string;
  brand_kit_id: string;
  asset_id: string;
  usage_type?: string;
  asset?: any; // Reference to Asset type if needed
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  colors?: BrandColor[];
  fonts?: BrandFont[];
  logos?: BrandLogo[];
  created_at: string;
  updated_at: string;
}
