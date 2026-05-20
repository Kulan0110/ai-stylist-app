export interface Brand {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  badge: string;
  badgeColor: string;
  website: string;
}

export interface Product {
  id: string;
  brand_id: string;
  brand: string;
  name: string;
  type: string;
  category: string;
  layer: string;
  color: string;
  style: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
  url: string;
  thumb: string;
}

export const BRANDS: Brand[] = [
  { id: 'gobi',    name: 'Говь',          tagline: 'Тансаг кашемир',        logo: '🦌', badge: 'LUXURY',  badgeColor: '#F59E0B', website: 'https://gobi.mn' },
  { id: 'buyan',   name: 'Буян',          tagline: 'Монголын кашемир',       logo: '🐑', badge: 'LOCAL',   badgeColor: '#34D399', website: 'https://buyan.mn' },
  { id: 'nomin',   name: 'Номин',         tagline: 'Их дэлгүүр',             logo: '🏬', badge: 'STORE',   badgeColor: '#60A5FA', website: 'https://nomin.mn' },
  { id: 'zara',    name: 'Zara',          tagline: 'Fast fashion',            logo: '⬛', badge: 'INTL',    badgeColor: '#A855F7', website: 'https://zara.com' },
  { id: 'uniqlo',  name: 'Uniqlo',        tagline: 'LifeWear essentials',    logo: '🔴', badge: 'INTL',    badgeColor: '#A855F7', website: 'https://uniqlo.com' },
  { id: 'steppe',  name: 'Steppe Kicks',  tagline: 'Limited drop sneakers',  logo: '👟', badge: 'DROP',    badgeColor: '#F472B6', website: 'https://steppekicks.mn' },
  { id: 'ubstreet',name: 'UB Streetwear', tagline: 'Монгол streetwear',      logo: '🏙', badge: 'STREET',  badgeColor: '#FB923C', website: 'https://ubstreetwear.mn' },
  { id: 'adidas',  name: 'Adidas',        tagline: 'Sport & lifestyle',       logo: '🔱', badge: 'SPORT',   badgeColor: '#FBBF24', website: 'https://adidas.mn' },
];

export const PRODUCTS: Product[] = [
  { id: 'p001', brand_id: 'gobi',    brand: 'Говь',         name: 'Кашемир Хоолойт Цамц',     type: 'Turtleneck',     category: 'Tops',        layer: 'Base Layer', color: 'Cream',  style: 'Minimalist',  price: 189000, rating: 4.9, reviews: 312, tags: ['Winter','Luxury'], url: 'https://gobi.mn', thumb: 'https://via.placeholder.com/300x380/F5F0DC/5C3317?text=Cashmere+Neck' },
  { id: 'p002', brand_id: 'gobi',    brand: 'Говь',         name: 'Кашемир Кардиган',          type: 'Hoodie',         category: 'Tops',        layer: 'Mid Layer',  color: 'Grey',   style: 'Minimalist',  price: 245000, rating: 4.8, reviews: 198, tags: ['Winter','Luxury'], url: 'https://gobi.mn', thumb: 'https://via.placeholder.com/300x380/C0C0C0/333333?text=Cashmere+Card' },
  { id: 'p003', brand_id: 'gobi',    brand: 'Говь',         name: 'Кашемир Шарф',              type: 'Beanie',         category: 'Accessories', layer: 'Accessory',  color: 'Charcoal',style: 'Luxury',      price: 98000,  rating: 4.9, reviews: 421, tags: ['Winter','Luxury'], url: 'https://gobi.mn', thumb: 'https://via.placeholder.com/300x380/455A64/F0F0F0?text=Scarf' },
  { id: 'p004', brand_id: 'buyan',   brand: 'Буян',         name: 'Монгол Хашмир Пуловер',    type: 'Turtleneck',     category: 'Tops',        layer: 'Base Layer', color: 'Brown',  style: 'Casual',      price: 145000, rating: 4.7, reviews: 87,  tags: ['Winter','Local'], url: 'https://buyan.mn', thumb: 'https://via.placeholder.com/300x380/8B4513/F5DEB3?text=Buyan+Pull' },
  { id: 'p005', brand_id: 'buyan',   brand: 'Буян',         name: 'Кашемир Гар Бээлий',       type: 'Beanie',         category: 'Accessories', layer: 'Accessory',  color: 'Cream',  style: 'Casual',      price: 45000,  rating: 4.6, reviews: 156, tags: ['Winter','Local'], url: 'https://buyan.mn', thumb: 'https://via.placeholder.com/300x380/FAF0DC/8B7355?text=Gloves' },
  { id: 'p006', brand_id: 'nomin',   brand: 'Номин',        name: 'Цагаан Хөвөн Цамц',        type: 'T-Shirt',        category: 'Tops',        layer: 'Base Layer', color: 'White',  style: 'Casual',      price: 29900,  rating: 4.3, reviews: 543, tags: ['Basic','Casual'], url: 'https://nomin.mn', thumb: 'https://via.placeholder.com/300x380/FFFFFF/333333?text=White+Tee' },
  { id: 'p007', brand_id: 'nomin',   brand: 'Номин',        name: 'Хар Жинсэн Өмд',           type: 'Cargo Pants',    category: 'Bottoms',     layer: 'Bottom',     color: 'Black',  style: 'Casual',      price: 79900,  rating: 4.4, reviews: 289, tags: ['Casual','Denim'], url: 'https://nomin.mn', thumb: 'https://via.placeholder.com/300x380/1C1C1C/AAAAAA?text=Black+Jeans' },
  { id: 'p008', brand_id: 'zara',    brand: 'Zara',         name: 'Oversize Bomber Jacket',   type: 'Jacket',         category: 'Jackets',     layer: 'Outerwear',  color: 'Black',  style: 'Streetwear',  price: 189000, rating: 4.6, reviews: 412, tags: ['Trendy','Outerwear'], url: 'https://zara.com', thumb: 'https://via.placeholder.com/300x380/111111/AAAAAA?text=Bomber' },
  { id: 'p009', brand_id: 'zara',    brand: 'Zara',         name: 'Slim Fit Cargo',           type: 'Cargo Pants',    category: 'Bottoms',     layer: 'Bottom',     color: 'Khaki',  style: 'Streetwear',  price: 119000, rating: 4.5, reviews: 334, tags: ['Cargo','Trendy'], url: 'https://zara.com', thumb: 'https://via.placeholder.com/300x380/C3B091/555555?text=Cargo' },
  { id: 'p010', brand_id: 'uniqlo',  brand: 'Uniqlo',       name: 'Ultra Light Down Jacket',  type: 'Puffer Jacket',  category: 'Jackets',     layer: 'Outerwear',  color: 'Olive',  style: 'Outdoor',     price: 159000, rating: 4.8, reviews: 621, tags: ['Winter','Lightweight'], url: 'https://uniqlo.com', thumb: 'https://via.placeholder.com/300x380/556B2F/F0F0F0?text=Down+Jacket' },
  { id: 'p011', brand_id: 'uniqlo',  brand: 'Uniqlo',       name: 'Heattech Дотуур Цамц',     type: 'T-Shirt',        category: 'Tops',        layer: 'Base Layer', color: 'Black',  style: 'Sporty',      price: 39900,  rating: 4.9, reviews: 1203,tags: ['Winter','Essential'], url: 'https://uniqlo.com', thumb: 'https://via.placeholder.com/300x380/222222/AAAAAA?text=Heattech' },
  { id: 'p012', brand_id: 'uniqlo',  brand: 'Uniqlo',       name: 'Slim Fit Chino',           type: 'Jogger Pants',   category: 'Bottoms',     layer: 'Bottom',     color: 'Khaki',  style: 'Casual',      price: 59900,  rating: 4.7, reviews: 445, tags: ['Smart-Casual'], url: 'https://uniqlo.com', thumb: 'https://via.placeholder.com/300x380/C3B091/333333?text=Chino' },
  { id: 'p013', brand_id: 'steppe',  brand: 'Steppe Kicks', name: 'Tenger 001 Sneaker',       type: 'Sneakers',       category: 'Footwear',    layer: 'Footwear',   color: 'White',  style: 'Streetwear',  price: 289000, rating: 4.9, reviews: 67,  tags: ['Limited','Exclusive'], url: 'https://steppekicks.mn', thumb: 'https://via.placeholder.com/300x380/F5F5F5/333333?text=Tenger001' },
  { id: 'p014', brand_id: 'steppe',  brand: 'Steppe Kicks', name: 'Gobi Runner',              type: 'Sneakers',       category: 'Footwear',    layer: 'Footwear',   color: 'Olive',  style: 'Outdoor',     price: 219000, rating: 4.7, reviews: 43,  tags: ['Local','Runner'], url: 'https://steppekicks.mn', thumb: 'https://via.placeholder.com/300x380/6B7C3D/F0F0F0?text=Gobi+Run' },
  { id: 'p015', brand_id: 'ubstreet',brand: 'UB Streetwear',name: 'Монгол Нүүдэлчин Hoodie', type: 'Hoodie',         category: 'Tops',        layer: 'Mid Layer',  color: 'Black',  style: 'Streetwear',  price: 89000,  rating: 4.6, reviews: 134, tags: ['Local','Streetwear'], url: 'https://ubstreetwear.mn', thumb: 'https://via.placeholder.com/300x380/111111/BB86FC?text=UB+Hoodie' },
  { id: 'p016', brand_id: 'ubstreet',brand: 'UB Streetwear',name: 'Нүүдэлчин Bucket Hat',    type: 'Beanie',         category: 'Accessories', layer: 'Accessory',  color: 'Black',  style: 'Streetwear',  price: 35000,  rating: 4.4, reviews: 89,  tags: ['Local','Cap'], url: 'https://ubstreetwear.mn', thumb: 'https://via.placeholder.com/300x380/111111/BB86FC?text=Bucket+Hat' },
  { id: 'p017', brand_id: 'adidas',  brand: 'Adidas',       name: 'Ultraboost 24',            type: 'Sneakers',       category: 'Footwear',    layer: 'Footwear',   color: 'White',  style: 'Sporty',      price: 319000, rating: 4.8, reviews: 892, tags: ['Running','Sport'], url: 'https://adidas.mn', thumb: 'https://via.placeholder.com/300x380/F5F5F5/000000?text=Ultraboost' },
  { id: 'p018', brand_id: 'adidas',  brand: 'Adidas',       name: 'Tiro Jogger Pants',        type: 'Jogger Pants',   category: 'Bottoms',     layer: 'Bottom',     color: 'Black',  style: 'Athleisure',  price: 89000,  rating: 4.5, reviews: 312, tags: ['Sport','Athleisure'], url: 'https://adidas.mn', thumb: 'https://via.placeholder.com/300x380/111111/AAAAAA?text=Tiro+Pants' },
];

interface ItemMatcher {
  type: string;
  layer: string;
  style: string;
  category: string;
}

export function getProductsForItem(item: ItemMatcher, limit = 2): Product[] {
  const scored = PRODUCTS.map(p => {
    let score = 0;
    if (p.type     === item.type)     score += 4;
    if (p.layer    === item.layer)    score += 3;
    if (p.category === item.category) score += 2;
    if (p.style    === item.style)    score += 1;
    return { ...p, _score: score };
  });
  return scored
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

export function getFeaturedProducts(limit = 6): Product[] {
  return PRODUCTS.filter(p => p.rating >= 4.7).slice(0, limit);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'all') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === category);
}

export function getBrandById(id: string): Brand | undefined {
  return BRANDS.find(b => b.id === id);
}
