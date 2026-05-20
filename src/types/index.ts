// ─── Domain models ────────────────────────────────────────────────────────────

export interface WardrobeItem {
  id: string;
  type: string;
  color: string;
  brand: string;
  style: string;
  category: string;
  layer: string;
  image_url: string;
  original_uri?: string;
  created_at?: string;
  user_id?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export interface WeatherData {
  city?: string;
  temp: string;
  feels_like: string;
  condition: string;
  condition_en: string;
  wind: string;
  day_temp_max?: string;
  day_temp_min?: string;
  day_feels_max?: string;
  day_condition?: string;
  day_condition_en?: string;
  day_wind_max?: string;
  day_precip_chance?: string;
}

// ─── Outfit / Stylist ─────────────────────────────────────────────────────────

export interface OutfitItem {
  item_id: string;
  layer: string;
  image_url: string;
  reason_mn: string;
}

export interface UpsellProduct {
  brand_name: string;
  product_name: string;
  recommendation_reason_mn: string;
  product_url: string;
}

export interface OutfitData {
  outfit_title: string;
  selected_items: OutfitItem[];
  stylist_comment: string;
  upsell_product?: UpsellProduct;
}

export interface BrandCatalogItem {
  brand_name: string;
  product_name: string;
  product_url: string;
  style_tag: string;
}

// ─── AI analysis ─────────────────────────────────────────────────────────────

export interface AvatarAnalysis {
  body_type: string;
  skin_tone: string;
  hair_color: string;
  top_size: string;
  bottom_size: string;
  style_vibe: string;
  fit_tips_mn: string;
}

export interface ClothingAnalysis {
  type: string;
  color: string;
  category: string;
  layer: string;
  brand: string;
  style: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Home: undefined;
  Wardrobe: undefined;
  Stylist: { outfitData?: OutfitData; weather?: WeatherData } | undefined;
  Avatar: { selectedIds?: string[] } | undefined;
  Profile: undefined;
};

// ─── Context values ───────────────────────────────────────────────────────────

export interface WardrobeContextValue {
  wardrobe: WardrobeItem[];
  loading: boolean;
  addItem: (item: WardrobeItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
