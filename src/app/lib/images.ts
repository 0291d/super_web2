export const INTERIOR_IMAGES = {
  hero:
    'https://images.unsplash.com/photo-1752004028694-72610be3604e?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  dining:
    'https://images.unsplash.com/photo-1725859685127-c723ea1d32a1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  living:
    'https://images.unsplash.com/photo-1723750290151-164cb19ebab7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  lounge:
    'https://images.unsplash.com/photo-1762076661989-8ccb95372df4?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  kitchen:
    'https://images.unsplash.com/photo-1745421147906-aa19b49366aa?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  editorial:
    'https://images.unsplash.com/photo-1758448511421-debb41f3e621?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  professional:
    'https://images.unsplash.com/photo-1751945965380-017e4ac16506?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  story:
    'https://images.unsplash.com/photo-1776993298427-743301e493e3?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  decor:
    'https://images.unsplash.com/photo-1760402327535-85a771fb034c?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  product:
    'https://images.unsplash.com/photo-1739800228654-697054cec854?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  bookcase:
    'https://images.unsplash.com/photo-1762117361523-0fb17f384e73?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  galleryLiving:
    'https://images.unsplash.com/photo-1759238136818-7b00ec9e782a?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  spaciousLiving:
    'https://images.unsplash.com/photo-1773578639782-2046b150ce28?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  whiteLiving:
    'https://images.unsplash.com/photo-1768609239321-1cfe14893e80?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  marbleLiving:
    'https://images.unsplash.com/photo-1757262798677-ab4af4455a58?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  warmLiving:
    'https://images.unsplash.com/photo-1771888703723-01d85da1dae1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
};

export const PRODUCT_IMAGES = [
  INTERIOR_IMAGES.lounge,
  INTERIOR_IMAGES.dining,
  INTERIOR_IMAGES.decor,
  INTERIOR_IMAGES.product,
  INTERIOR_IMAGES.living,
  INTERIOR_IMAGES.kitchen,
  INTERIOR_IMAGES.editorial,
  INTERIOR_IMAGES.professional,
  INTERIOR_IMAGES.bookcase,
  INTERIOR_IMAGES.galleryLiving,
  INTERIOR_IMAGES.spaciousLiving,
  INTERIOR_IMAGES.whiteLiving,
];

const CATEGORY_IMAGES = [
  INTERIOR_IMAGES.dining,
  INTERIOR_IMAGES.lounge,
  INTERIOR_IMAGES.kitchen,
  INTERIOR_IMAGES.decor,
  INTERIOR_IMAGES.whiteLiving,
];

const ROOM_IMAGES = [
  INTERIOR_IMAGES.living,
  INTERIOR_IMAGES.dining,
  INTERIOR_IMAGES.kitchen,
  INTERIOR_IMAGES.editorial,
  INTERIOR_IMAGES.hero,
  INTERIOR_IMAGES.professional,
  INTERIOR_IMAGES.bookcase,
  INTERIOR_IMAGES.galleryLiving,
  INTERIOR_IMAGES.spaciousLiving,
  INTERIOR_IMAGES.whiteLiving,
  INTERIOR_IMAGES.marbleLiving,
  INTERIOR_IMAGES.warmLiving,
];

const STORY_IMAGES = [
  INTERIOR_IMAGES.story,
  INTERIOR_IMAGES.hero,
  INTERIOR_IMAGES.diningDetail,
  INTERIOR_IMAGES.professional,
  INTERIOR_IMAGES.living,
  INTERIOR_IMAGES.kitchen,
  INTERIOR_IMAGES.galleryLiving,
  INTERIOR_IMAGES.warmLiving,
];

function indexFromText(text: string, fallback = 0) {
  const match = text.match(/\d+/);
  if (match) return Math.max(Number(match[0]) - 1, 0);

  let total = fallback;
  for (let i = 0; i < text.length; i += 1) {
    total += text.charCodeAt(i);
  }
  return total;
}

function pick(images: string[], text: string) {
  return images[indexFromText(text) % images.length];
}

export function imageForPlaceholder(text = '') {
  const value = text.toLowerCase();

  if (value.includes('category')) return pick(CATEGORY_IMAGES, value);
  if (value.includes('story') || value.includes('editorial') || value.includes('detail')) return pick(STORY_IMAGES, value);
  if (value.includes('living room')) return INTERIOR_IMAGES.living;
  if (value.includes('dining room')) return INTERIOR_IMAGES.dining;
  if (value.includes('kitchen')) return INTERIOR_IMAGES.kitchen;
  if (value.includes('bedroom')) return INTERIOR_IMAGES.hero;
  if (value.includes('bathroom')) return INTERIOR_IMAGES.editorial;
  if (value.includes('office') || value.includes('professional') || value.includes('styling')) return INTERIOR_IMAGES.professional;
  if (value.includes('green space') || value.includes('outdoor')) return INTERIOR_IMAGES.spaciousLiving;
  if (value.includes('hallway')) return INTERIOR_IMAGES.decor;
  if (value.includes('room')) return pick(ROOM_IMAGES, value);
  if (value.includes('hero')) return INTERIOR_IMAGES.hero;
  if (value.includes('campaign')) return INTERIOR_IMAGES.editorial;
  if (value.includes('product') || value.includes('thumb') || value.includes('prod') || value.includes('img') || value.includes('cart')) return pick(PRODUCT_IMAGES, value);

  return pick(ROOM_IMAGES, value);
}
