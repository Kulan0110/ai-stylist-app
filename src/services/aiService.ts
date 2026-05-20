// AI Stylist — Claude (Anthropic) API
// Set EXPO_PUBLIC_CLAUDE_API_KEY in .env to enable real API calls.
// Without a key the service returns realistic mock data so UI development works offline.

import type {
  WardrobeItem,
  WeatherData,
  OutfitData,
  AvatarAnalysis,
  ClothingAnalysis,
  ApiResult,
  BrandCatalogItem,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Blob → base64 data URL helper (FileReader is available in React Native)
// ─────────────────────────────────────────────────────────────────────────────
function _blobToBase64DataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror  = () => reject(new Error('FileReader алдаа'));
    reader.readAsDataURL(blob);
  });
}

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001';
const USE_MOCK       = !CLAUDE_API_KEY;
const API_TIMEOUT    = 20_000; // ms — Claude can be slow on first token

// ─────────────────────────────────────────────────────────────────────────────
// Seed / initial wardrobe data
// Imported by wardrobeService as the app's starting inventory.
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_WARDROBE: WardrobeItem[] = [
  { id:'item_001', type:'T-Shirt',       color:'White',        style:'Streetwear', layer:'Base Layer', category:'Tops',        brand:'Zara',                image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=White+Tee' },
  { id:'item_002', type:'Hoodie',        color:'Black',        style:'Urban',      layer:'Mid Layer',  category:'Tops',        brand:'H&M',                 image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Black+Hoodie' },
  { id:'item_003', type:'Puffer Jacket', color:'Olive',        style:'Outdoor',    layer:'Outerwear',  category:'Jackets',     brand:'Mongolian Nomad Co.', image_url:'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Olive+Puffer' },
  { id:'item_004', type:'Cargo Pants',   color:'Khaki',        style:'Streetwear', layer:'Bottom',     category:'Bottoms',     brand:'Uniqlo',              image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Cargo+Pants' },
  { id:'item_005', type:'Snow Boots',    color:'Black',        style:'Winter',     layer:'Footwear',   category:'Footwear',    brand:'Columbia',            image_url:'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Snow+Boots' },
  { id:'item_006', type:'Beanie',        color:'Charcoal',     style:'Casual',     layer:'Accessory',  category:'Accessories', brand:'New Era',             image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Beanie' },
  { id:'item_007', type:'Denim Jacket',  color:'Indigo',       style:'Retro',      layer:'Outerwear',  category:'Jackets',     brand:"Levi's",              image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Denim+Jacket' },
  { id:'item_008', type:'Jogger Pants',  color:'Grey',         style:'Athleisure', layer:'Bottom',     category:'Bottoms',     brand:'Adidas',              image_url:'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Joggers' },
  { id:'item_009', type:'Sneakers',      color:'White/Purple', style:'Streetwear', layer:'Footwear',   category:'Footwear',    brand:'New Balance',         image_url:'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Sneakers' },
  { id:'item_010', type:'Turtleneck',    color:'Cream',        style:'Minimalist', layer:'Base Layer', category:'Tops',        brand:'COS',                 image_url:'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Turtleneck' },
];

export const MOCK_BRANDS_CATALOG: BrandCatalogItem[] = [
  { brand_name:'UB Streetwear Co.', product_name:'Монгол Нүүдэлчин Bucket Hat', product_url:'https://ubstreetwear.mn/bucket-hat',   style_tag:'Streetwear' },
  { brand_name:'Gobi Luxury',       product_name:'Кашемир Snood Scarf',          product_url:'https://gobiluxury.mn/snood-scarf',      style_tag:'Luxury Winter' },
  { brand_name:'Steppe Kicks',      product_name:'Limited Drop — Tenger 001 Sneaker', product_url:'https://steppekicks.mn/tenger-001', style_tag:'Exclusive Footwear' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock responses (development / API-key-absent mode)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_AVATAR_ANALYSIS: AvatarAnalysis = {
  body_type:   'athletic',
  skin_tone:   'medium',
  hair_color:  'black',
  top_size:    'M',
  bottom_size: 'M',
  style_vibe:  'Streetwear',
  fit_tips_mn: 'Чиний бие Uniqlo/Zara M хэмжээтэй perfect fit болно. Layering style-д 100% зохино — гал харагдана!',
};

const MOCK_CLOTHING: ClothingAnalysis = {
  type:'T-Shirt', color:'White', category:'Tops',
  layer:'Base Layer', brand:'Unknown', style:'Casual',
};

// Build a mock outfit from the actual wardrobe passed in (one item per layer)
function _buildMockOutfit(wardrobe: WardrobeItem[]): OutfitData {
  const layers  = ['Base Layer', 'Mid Layer', 'Outerwear', 'Bottom', 'Footwear'];
  const picked: WardrobeItem[]  = [];
  for (const layer of layers) {
    const match = wardrobe.find((w) => w.layer === layer);
    if (match) picked.push(match);
    if (picked.length === 5) break;
  }
  // Fallback: take first 3 items if layer coverage is thin
  const items = picked.length >= 2 ? picked : wardrobe.slice(0, 3);

  return {
    outfit_title: '❄️ Цасан Vibe Check',
    selected_items: items.map((item) => ({
      item_id:   item.id,
      layer:     item.layer,
      image_url: item.image_url ?? '',
      reason_mn: `${item.color} ${item.type} — өнөөдрийн look-д туйлын зохимжтой.`,
    })),
    stylist_comment:
      'Энэ outfit? Абсолют ГАЛ 🔥 Layering game хэт хүчтэй — итгэлтэй явж орооч!',
    upsell_product: MOCK_BRANDS_CATALOG[0] && {
      brand_name:              MOCK_BRANDS_CATALOG[0].brand_name,
      product_name:            MOCK_BRANDS_CATALOG[0].product_name,
      recommendation_reason_mn:'Локал брэнд, дэлхийн чанар — look-ийг 10x upgrade хийнэ.',
      product_url:             MOCK_BRANDS_CATALOG[0].product_url,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────────────────

// Fetch with AbortController timeout; throws on network error or non-2xx
async function _apiFetch(url: string, options: RequestInit, timeoutMs: number = API_TIMEOUT): Promise<any> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const CLAUDE_HEADERS: Record<string, string> = {
  'Content-Type':      'application/json',
  'x-api-key':         CLAUDE_API_KEY,
  'anthropic-version': '2023-06-01',
};

// Extract JSON object from Claude's response text.
// Handles: plain JSON, ```json fences, and stray whitespace.
function _extractJson(raw: string): any {
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  // Find the outermost { } to handle any surrounding commentary
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in response');
  return JSON.parse(match[0]);
}

// Strip display-only fields before sending wardrobe to Claude.
// Reduces token usage by ~40 % on a typical wardrobe.
function _slimWardrobe(wardrobe: WardrobeItem[]) {
  return wardrobe.map(({ id, type, color, style, layer, category, brand }) => ({
    id, type, color, style, layer, category, brand,
  }));
}

function _delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateOutfit — main outfit recommendation
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateOutfitParams {
  weather?: WeatherData | null;
  occasion: string;
  wardrobe: WardrobeItem[];
  brandsCatalog?: BrandCatalogItem[];
}

export async function generateOutfit({ weather, occasion, wardrobe, brandsCatalog }: GenerateOutfitParams): Promise<ApiResult<OutfitData>> {
  if (USE_MOCK) {
    await _delay(1_800);
    return { success: true, data: _buildMockOutfit(wardrobe ?? MOCK_WARDROBE) };
  }

  const prompt = _buildOutfitPrompt({ weather, occasion, wardrobe, brandsCatalog });

  try {
    const json = await _apiFetch(
      'https://api.anthropic.com/v1/messages',
      {
        method:  'POST',
        headers: CLAUDE_HEADERS,
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 1_024,
          messages:   [{ role: 'user', content: prompt }],
        }),
      },
    );

    const raw  = json.content?.[0]?.text ?? '';
    const data = _extractJson(raw);

    // Re-attach image_url from wardrobe so StylistScreen can render images
    const wardrobeMap: Record<string, WardrobeItem> = Object.fromEntries(wardrobe.map((w) => [w.id, w]));
    data.selected_items = (data.selected_items ?? []).map((item: any) => ({
      ...item,
      image_url: wardrobeMap[item.item_id]?.image_url ?? item.image_url ?? '',
    }));

    return { success: true, data };
  } catch (err: any) {
    console.warn('[aiService] generateOutfit fallback:', err.message);
    return { success: true, data: _buildMockOutfit(wardrobe ?? MOCK_WARDROBE) };
  }
}

function _buildOutfitPrompt({ weather, occasion, wardrobe, brandsCatalog }: GenerateOutfitParams): string {
  const dayCtx = weather
    ? `Today's full-day forecast for ${weather.city ?? 'Ulaanbaatar'}:
  High ${weather.day_temp_max ?? weather.temp} / Low ${weather.day_temp_min ?? weather.temp}
  Feels like high: ${weather.day_feels_max ?? weather.feels_like}
  Condition: ${weather.day_condition_en ?? weather.condition_en} (${weather.day_condition ?? weather.condition})
  Max wind: ${weather.day_wind_max ?? weather.wind} | Precipitation chance: ${weather.day_precip_chance ?? '—'}`
    : 'Weather data unavailable';

  const slimWardrobe = _slimWardrobe(wardrobe ?? []);

  return `You are an elite AI Fashion Stylist for Mongolian youth in Ulaanbaatar.

${dayCtx}
Occasion: ${occasion}

User Wardrobe (${slimWardrobe.length} items):
${JSON.stringify(slimWardrobe)}

Local Brand Catalog:
${JSON.stringify(brandsCatalog ?? [])}

TASK: Select 3–5 wardrobe items that work together for the ENTIRE day (layering matters).
Prefer items that handle the worst weather condition of the day.

Return ONLY a raw JSON object — no markdown, no explanation:
{
  "outfit_title": "short catchy Mongolian title with 1 emoji",
  "selected_items": [
    {"item_id":"<id from wardrobe>","layer":"<layer>","image_url":"","reason_mn":"<≤20 word reason in urban Mongolian slang>"}
  ],
  "stylist_comment": "2-3 sentence hype comment in urban Mongolian slang",
  "upsell_product": {"brand_name":"<from catalog>","product_name":"<from catalog>","recommendation_reason_mn":"<≤20 words>","product_url":"<from catalog>"}
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. generateDailyTip — short weather-based outfit tip for HomeScreen
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_TIP_SYSTEM =
  "You are a concise personal stylist. Given today's full-day weather forecast, " +
  'write ONE outfit tip (2–3 sentences). Be specific: mention fabrics, layering, or accessories. ' +
  'Language: Mongolian (natural, friendly tone).';

interface GenerateDailyTipParams {
  weather?: WeatherData | null;
}

export async function generateDailyTip({ weather }: GenerateDailyTipParams): Promise<ApiResult<string>> {
  if (USE_MOCK) {
    await _delay(900);
    return { success: true, data: _buildLocalTip(weather) };
  }

  const userMsg = weather
    ? `Өнөөдрийн цаг агаарын урьдчилсан мэдээ — ${weather.city ?? 'Улаанбаатар'}:
Дээд ${weather.day_temp_max ?? weather.temp} / Доод ${weather.day_temp_min ?? weather.temp}
Мэдрэгдэх дээд: ${weather.day_feels_max ?? weather.feels_like}
Байдал: ${weather.day_condition ?? weather.condition}
Хамгийн их салхи: ${weather.day_wind_max ?? weather.wind} | Тунадасны магадлал: ${weather.day_precip_chance ?? '—'}
Өдрийн туршид тохиромжтой outfit зөвлөгөө өгнө үү.`
    : 'Цаг агаарын мэдээлэл байхгүй байна. Ерөнхий зөвлөгөө өгнө үү.';

  try {
    const json = await _apiFetch(
      'https://api.anthropic.com/v1/messages',
      {
        method:  'POST',
        headers: CLAUDE_HEADERS,
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 220,
          system:     DAILY_TIP_SYSTEM,
          messages:   [{ role: 'user', content: userMsg }],
        }),
      },
    );

    const tip = json.content?.[0]?.text?.trim() ?? '';
    return { success: true, data: tip || _buildLocalTip(weather) };
  } catch (err: any) {
    console.warn('[aiService] generateDailyTip fallback:', err.message);
    return { success: true, data: _buildLocalTip(weather) };
  }
}

// Local offline tip — no API needed
function _buildLocalTip(weather?: WeatherData | null): string {
  if (!weather) {
    return 'Цаг агаарын мэдээлэл байхгүй байна. Давхарласан хувцас өмсөж, нэмэлт jacket бэлтгэж явах нь хамгийн найдвартай.';
  }

  const maxTemp = parseInt(weather.day_temp_max ?? weather.temp, 10);
  const cond    = weather.day_condition_en ?? weather.condition_en ?? 'Clear';
  const range   = weather.day_temp_max
    ? `${weather.day_temp_min ?? '?'} ~ ${weather.day_temp_max}`
    : (weather.temp ?? '?°C');

  let ctx = '';
  if      (maxTemp <= -15) ctx = `${range} их хүйтэн`;
  else if (maxTemp <= -5)  ctx = `${range} хүйтэн`;
  else if (maxTemp <=  5)  ctx = `${range} сэрүүн`;
  else if (maxTemp <= 15)  ctx = `${range} бага дулаан`;
  else if (maxTemp <= 25)  ctx = `${range} тааламжтай`;
  else                     ctx = `${range} халуун`;

  const tips: Record<string, string> = {
    Clear:        `${ctx} тэнгэр цэлмэг өдөр хөнгөн cotton эсвэл linen хувцас тохиромжтой. Нар шарах тул sunglasses бэлтгэж, оройн хүйтэнд зориулж нимгэн jacket авч яваарай.`,
    Clouds:       `${ctx} үүлтэй цагт mid-weight sweater эсвэл hoodie давхарлаарай. Бороо орж болзошгүй тул water-resistant jacket авч явбал бэлэн байна.`,
    Snow:         `${ctx} цас орж байна — гурван давхар хувцаслаарай: thermal доторлогоо, fleece mid-layer, wind-proof гадуур jacket. Waterproof boots, scarf, beanie мартвал тохиромжгүй.`,
    Rain:         `${ctx} бороотой цагт waterproof jacket эсвэл raincoat зайлшгүй. Quick-dry fabric сонгоорой, резин гутал өмсвөл хөл чийгшихгүй.`,
    Drizzle:      `${ctx} бага зэрэг тунадас байна — water-resistant хөнгөн jacket тохиромжтой. Canvas sneaker биш waterproof гутал сонгоорой.`,
    Mist:         `${ctx} манан байна, humidity өндөр тул moisture-wicking fabric ашиглаарай. Дулаан fleece layer нэмэх нь дээр.`,
    Thunderstorm: `${ctx} аянга цахилгаан байгаа тул усны тусгаарлалттай jacket, rubber sole гутал зайлшгүй. Металл зүйлсээс зайлсхиж, нийтийн тээвэр ашиглаарай.`,
  };

  return tips[cond] ?? tips.Clear;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. analyzeAvatar — Claude Vision body analysis
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyzeAvatarParams {
  imageBase64?: string | null;
  mimeType?: string;
  height: number;
  weight: number;
}

export async function analyzeAvatar({ imageBase64, mimeType = 'image/jpeg', height, weight }: AnalyzeAvatarParams): Promise<ApiResult<AvatarAnalysis>> {
  if (USE_MOCK || !imageBase64) {
    await _delay(1_200);
    return { success: true, data: MOCK_AVATAR_ANALYSIS };
  }

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

  const prompt = `You are a fashion AI assistant. Analyze this person.
Known measurements: Height ${height}cm | Weight ${weight}kg | BMI ${bmi}

Return ONLY raw JSON (no markdown, no explanation):
{
  "body_type":    "slim|athletic|average|curvy",
  "skin_tone":    "fair|light|medium|tan|dark",
  "hair_color":   "black|brown|blonde|red|gray|other",
  "top_size":     "XS|S|M|L|XL|XXL",
  "bottom_size":  "XS|S|M|L|XL|XXL",
  "style_vibe":   "1-2 word Mongolian style label",
  "fit_tips_mn":  "max 25 word fitting advice in casual Mongolian"
}`;

  try {
    const json = await _apiFetch(
      'https://api.anthropic.com/v1/messages',
      {
        method:  'POST',
        headers: CLAUDE_HEADERS,
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 512,
          messages: [{
            role:    'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
              { type: 'text',  text: prompt },
            ],
          }],
        }),
      },
    );

    const raw  = json.content?.[0]?.text ?? '';
    const data = _extractJson(raw);
    return { success: true, data };
  } catch (err: any) {
    console.warn('[aiService] analyzeAvatar fallback:', err.message);
    return { success: true, data: MOCK_AVATAR_ANALYSIS };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. analyzeClothingItem — Claude Vision clothing recognition
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyzeClothingParams {
  imageBase64?: string | null;
  mimeType?: string;
}

export async function analyzeClothingItem({ imageBase64, mimeType = 'image/jpeg' }: AnalyzeClothingParams): Promise<ApiResult<ClothingAnalysis>> {
  if (USE_MOCK || !imageBase64) {
    await _delay(1_400);
    return { success: true, data: MOCK_CLOTHING };
  }

  const prompt = `Identify the clothing item in this image.
Return ONLY raw JSON (no markdown, no explanation):
{
  "type":     "T-Shirt|Hoodie|Jacket|Denim Jacket|Puffer Jacket|Cargo Pants|Jogger Pants|Sneakers|Snow Boots|Beanie|Turtleneck|Other",
  "color":    "White|Black|Red|Blue|Green|Yellow|Pink|Purple|Grey|Olive|Brown|Khaki|Cream|Indigo|Charcoal",
  "category": "Tops|Jackets|Bottoms|Footwear|Accessories",
  "layer":    "Base Layer|Mid Layer|Outerwear|Bottom|Footwear|Accessory",
  "brand":    "brand name if visible, else Unknown",
  "style":    "Streetwear|Casual|Formal|Sporty|Outdoor|Luxury|Urban|Retro|Athleisure|Minimalist"
}`;

  try {
    const json = await _apiFetch(
      'https://api.anthropic.com/v1/messages',
      {
        method:  'POST',
        headers: CLAUDE_HEADERS,
        body: JSON.stringify({
          model:      CLAUDE_MODEL,
          max_tokens: 300,
          messages: [{
            role:    'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
              { type: 'text',  text: prompt },
            ],
          }],
        }),
      },
    );

    const raw  = json.content?.[0]?.text ?? '';
    const data = _extractJson(raw);
    return { success: true, data };
  } catch (err: any) {
    console.warn('[aiService] analyzeClothingItem fallback:', err.message);
    return { success: true, data: MOCK_CLOTHING };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. generateClothingImageUrl — Pollinations.ai product image (free, no key)
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateClothingImageParams {
  type: string;
  color: string;
  style: string;
}

export function generateClothingImageUrl({ type, color, style }: GenerateClothingImageParams): string {
  const prompt  = `${color} ${type}, ${style} fashion, product photo, clean white background, studio lighting`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=turbo&seed=${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. generateAvatarImage — HuggingFace SDXL (free with token)
// ─────────────────────────────────────────────────────────────────────────────

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN ?? '';
const HF_URL   = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
const HF_CARTOON_URL = 'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix';
const CARTOON_PROMPT = 'cartoon illustration of clothing, 2d style, clean lines, flat colors, isolated on solid white background';

function _pollinationsAvatarUrl(prompt: string): string {
  // Keep prompt short to avoid URL length issues; model=turbo is proven to work
  const short = prompt.slice(0, 200);
  return (
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(short) +
    '?width=512&height=768&model=turbo&nologo=true&seed=' +
    Date.now()
  );
}

interface GenerateAvatarImageParams {
  prompt: string;
}

export async function generateAvatarImage({ prompt }: GenerateAvatarImageParams): Promise<ApiResult<{ url: string }>> {
  // Try HuggingFace SDXL first (token required)
  if (HF_TOKEN) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60_000);
      let res: Response;
      try {
        res = await fetch(HF_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HF_TOKEN}` },
          body:    JSON.stringify({ inputs: prompt.slice(0, 500) }),
          signal:  ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (res!.status === 503) {
        const data = await res!.json().catch(() => ({}));
        const sec  = Math.ceil(data?.estimated_time ?? 30);
        throw new Error(`Model дулааццаж байна — ${sec}с`);
      }
      if (!res!.ok) {
        const err = await res!.json().catch(() => ({}));
        throw new Error(err?.error ?? `HF error ${res!.status}`);
      }

      const blob = await res!.blob();
      const url  = await _blobToBase64DataUrl(blob);
      return { success: true, data: { url } };
    } catch (err: any) {
      console.warn('[aiService] generateAvatarImage HF failed, falling back to Pollinations:', err.message);
    }
  }

  // Fallback 1: Pollinations.ai — pre-fetch + convert to data URL
  const pollUrl = _pollinationsAvatarUrl(prompt);
  try {
    const ctrl2  = new AbortController();
    const timer2 = setTimeout(() => ctrl2.abort(), 60_000);
    try {
      const pollRes = await fetch(pollUrl, { signal: ctrl2.signal });
      if (!pollRes.ok) throw new Error(`Pollinations HTTP ${pollRes.status}`);
      const blob = await pollRes.blob();
      const url  = await _blobToBase64DataUrl(blob);
      return { success: true, data: { url } };
    } finally {
      clearTimeout(timer2);
    }
  } catch (pollErr: any) {
    console.warn('[aiService] Pollinations failed:', pollErr.message);
  }

  // Fallback 2: DiceBear — Cloudflare CDN, always reachable, no auth
  const diceBearUrl =
    'https://api.dicebear.com/9.x/adventurer/png?seed=' +
    Date.now() +
    '&size=512&backgroundColor=0a0a1a';
  return { success: true, data: { url: diceBearUrl } };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. convertToCartoonImage — HuggingFace instruct-pix2pix cartoon style
//    Takes an Expo image URI, returns a base64 data-URL in cartoon style.
//    Falls back to the original URI on any network / API error.
// ─────────────────────────────────────────────────────────────────────────────

export async function convertToCartoonImage(imageUri: string): Promise<ApiResult<{ uri: string }>> {
  if (!HF_TOKEN) {
    console.warn('[aiService] convertToCartoonImage: EXPO_PUBLIC_HF_TOKEN тохируулагдаагүй — оригинал зургийг ашиглана');
    return { success: true, data: { uri: imageUri } };
  }

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000); // model cold-start can take ~60s

  try {
    // Read the local Expo URI as a Blob, then encode to base64 for HF JSON API
    const imgRes   = await fetch(imageUri);
    const imgBlob  = await imgRes.blob();
    const dataUrl  = await _blobToBase64DataUrl(imgBlob);
    const base64   = dataUrl.split(',')[1]; // strip "data:image/...;base64,"

    const hfRes = await fetch(HF_CARTOON_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        inputs: base64,
        parameters: {
          prompt:               CARTOON_PROMPT,
          num_inference_steps:  15,
          image_guidance_scale: 1.5,
          guidance_scale:       7.5,
        },
      }),
      signal: ctrl.signal,
    });

    if (hfRes.status === 503) {
      const data = await hfRes.json().catch(() => ({}));
      const sec  = Math.ceil(data?.estimated_time ?? 30);
      throw new Error(`Model дулааццаж байна — ${sec}с хүлээнэ үү`);
    }

    if (!hfRes.ok) {
      const errData = await hfRes.json().catch(() => ({}));
      throw new Error(errData?.error ?? `HF API алдаа ${hfRes.status}`);
    }

    const resultBlob    = await hfRes.blob();
    const resultDataUrl = await _blobToBase64DataUrl(resultBlob);
    return { success: true, data: { uri: resultDataUrl } };

  } catch (err: any) {
    console.warn('[aiService] convertToCartoonImage fallback →', err.message);
    return { success: true, data: { uri: imageUri } }; // return original so the flow continues
  } finally {
    clearTimeout(timer);
  }
}
