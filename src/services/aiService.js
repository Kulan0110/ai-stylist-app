// AI Stylist service — sends wardrobe + weather context to Gemini/GPT.
// Falls back to a rich mock response for demo/dev builds.

const AI_API_KEY = 'YOUR_GEMINI_OR_GPT_KEY';
const USE_MOCK = AI_API_KEY === 'YOUR_GEMINI_OR_GPT_KEY';

// ---------- Mock Dataset ---------------------------------------------------

export const MOCK_WARDROBE = [
  {
    id: 'item_001',
    type: 'T-Shirt',
    color: 'White',
    style: 'Streetwear',
    layer: 'Base Layer',
    category: 'Tops',
    brand: 'Zara',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=White+Tee',
  },
  {
    id: 'item_002',
    type: 'Hoodie',
    color: 'Black',
    style: 'Urban',
    layer: 'Mid Layer',
    category: 'Tops',
    brand: 'H&M',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Black+Hoodie',
  },
  {
    id: 'item_003',
    type: 'Puffer Jacket',
    color: 'Olive',
    style: 'Outdoor',
    layer: 'Outerwear',
    category: 'Jackets',
    brand: 'Mongolian Nomad Co.',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Olive+Puffer',
  },
  {
    id: 'item_004',
    type: 'Cargo Pants',
    color: 'Khaki',
    style: 'Streetwear',
    layer: 'Bottom',
    category: 'Bottoms',
    brand: 'Uniqlo',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Cargo+Pants',
  },
  {
    id: 'item_005',
    type: 'Snow Boots',
    color: 'Black',
    style: 'Winter',
    layer: 'Footwear',
    category: 'Footwear',
    brand: 'Columbia',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Snow+Boots',
  },
  {
    id: 'item_006',
    type: 'Beanie',
    color: 'Charcoal',
    style: 'Casual',
    layer: 'Accessory',
    category: 'Accessories',
    brand: 'New Era',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Beanie',
  },
  {
    id: 'item_007',
    type: 'Denim Jacket',
    color: 'Indigo',
    style: 'Retro',
    layer: 'Outerwear',
    category: 'Jackets',
    brand: 'Levi\'s',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Denim+Jacket',
  },
  {
    id: 'item_008',
    type: 'Jogger Pants',
    color: 'Grey',
    style: 'Athleisure',
    layer: 'Bottom',
    category: 'Bottoms',
    brand: 'Adidas',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Joggers',
  },
  {
    id: 'item_009',
    type: 'Sneakers',
    color: 'White/Purple',
    style: 'Streetwear',
    layer: 'Footwear',
    category: 'Footwear',
    brand: 'New Balance',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Sneakers',
  },
  {
    id: 'item_010',
    type: 'Turtleneck',
    color: 'Cream',
    style: 'Minimalist',
    layer: 'Base Layer',
    category: 'Tops',
    brand: 'COS',
    image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Turtleneck',
  },
];

export const MOCK_BRANDS_CATALOG = [
  {
    brand_name: 'UB Streetwear Co.',
    product_name: 'Монгол Нүүдэлчин Bucket Hat',
    product_url: 'https://ubstreetwear.mn/bucket-hat',
    style_tag: 'Streetwear',
  },
  {
    brand_name: 'Gobi Luxury',
    product_name: 'Кашемир Snood Scarf',
    product_url: 'https://gobiluxury.mn/snood-scarf',
    style_tag: 'Luxury Winter',
  },
  {
    brand_name: 'Steppe Kicks',
    product_name: 'Limited Drop — Tenger 001 Sneaker',
    product_url: 'https://steppekicks.mn/tenger-001',
    style_tag: 'Exclusive Footwear',
  },
];

// ---------- Mock AI Response -----------------------------------------------

const MOCK_AI_RESPONSE = {
  outfit_title: '❄️ Цасан Vibe Check',
  selected_items: [
    {
      item_id: 'item_010',
      layer: 'Base Layer',
      image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Turtleneck',
      reason_mn: 'Cream turtleneck — хүйтэнд perfectly зохицоод minimal look-ийг тогтоож байна.',
    },
    {
      item_id: 'item_002',
      layer: 'Mid Layer',
      image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Black+Hoodie',
      reason_mn: 'Black hoodie дээр layering хийхэд туйлын күүл, streetwear vibe 100% alive.',
    },
    {
      item_id: 'item_003',
      layer: 'Outerwear',
      image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Olive+Puffer',
      reason_mn: 'Olive puffer jacket — УБ-ийн -4°C шуурганд эрэгтэй хамгаалалт, гал харагдана.',
    },
    {
      item_id: 'item_004',
      layer: 'Bottom',
      image_url: 'https://via.placeholder.com/200x300/1E1E1E/BB86FC?text=Cargo+Pants',
      reason_mn: 'Khaki cargo — earthy tone нь olive jacket-тай perfectly match, aesthetic чамин.',
    },
    {
      item_id: 'item_005',
      layer: 'Footwear',
      image_url: 'https://via.placeholder.com/200x300/1E1E1E/03DAC6?text=Snow+Boots',
      reason_mn: 'Black snow boots — цасан замд grip100, style нь ч drop-дахгүй.',
    },
  ],
  stylist_comment:
    'Энэ outfit? Абсолют ГАЛ 🔥 Layering game нь хэт хүчтэй — cream + black + olive нь earthy tone perfection. УБ-ийн цасан шуурганд ч гэсэн чи хамгийн күүл хүн байх нь тодорхой, итгэлтэй явж орооч!',
  upsell_product: {
    brand_name: 'Gobi Luxury',
    product_name: 'Кашемир Snood Scarf',
    recommendation_reason_mn:
      'Olive puffer дээр Gobi Luxury-ийн кашемир snood тавихад? Чамин-г нь 10x болгоно, neck game абсолют upgrade — локал брэнд, дэлхийн чанар.',
    product_url: 'https://gobiluxury.mn/snood-scarf',
  },
};

// ---------- Public API -----------------------------------------------------

export async function generateOutfit({ weather, occasion, wardrobe, brandsCatalog }) {
  if (USE_MOCK) {
    await _simulateLatency(1800);
    return { success: true, data: MOCK_AI_RESPONSE };
  }

  const prompt = _buildPrompt({ weather, occasion, wardrobe, brandsCatalog });

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
        AI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) throw new Error('Gemini API error');
    const json = await response.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch (err) {
    console.warn('[aiService] Falling back to mock:', err.message);
    return { success: true, data: MOCK_AI_RESPONSE };
  }
}

// ---------- Prompt Builder -------------------------------------------------

function _buildPrompt({ weather, occasion, wardrobe, brandsCatalog }) {
  return `
You are an elite AI Fashion Stylist for Mongolian youth in Ulaanbaatar.

Current Weather: ${JSON.stringify(weather)}
Occasion: ${occasion}
User Wardrobe: ${JSON.stringify(wardrobe)}
Local Brands Catalog: ${JSON.stringify(brandsCatalog)}

Select 3–5 wardrobe items. Return ONLY a raw JSON object (no markdown) matching:
{
  "outfit_title": "string",
  "selected_items": [{"item_id":"string","layer":"string","image_url":"string","reason_mn":"string"}],
  "stylist_comment": "string in urban Mongolian slang",
  "upsell_product": {"brand_name":"string","product_name":"string","recommendation_reason_mn":"string","product_url":"string"}
}
`.trim();
}

function _simulateLatency(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
