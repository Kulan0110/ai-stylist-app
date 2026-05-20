import { supabase }     from './supabase';
import { MOCK_WARDROBE } from './aiService';
import type { WardrobeItem } from '../types';

// base64 data URLs are too large for Supabase text columns — drop them.
// The item metadata (type/color/style) is enough to regenerate images.
function sanitize(item: WardrobeItem): Partial<WardrobeItem> {
  const { original_uri, ...rest } = item;
  return {
    ...rest,
    image_url: rest.image_url?.startsWith('data:') ? '' : (rest.image_url ?? ''),
  };
}

export async function loadWardrobe(userId: string | undefined): Promise<WardrobeItem[]> {
  if (!userId) return MOCK_WARDROBE;
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[wardrobeService] load:', error.message); return MOCK_WARDROBE; }
  return data?.length ? data : [];
}

export async function addItem(item: WardrobeItem, userId: string): Promise<void> {
  const { error } = await supabase
    .from('wardrobe_items')
    .insert({ ...sanitize(item), user_id: userId });
  if (error) console.warn('[wardrobeService] insert:', error.message);
}

export async function removeItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('id', itemId);
  if (error) console.warn('[wardrobeService] delete:', error.message);
}

// Legacy — kept for imports that still reference it
export function getInitialWardrobe(): WardrobeItem[] { return MOCK_WARDROBE; }
