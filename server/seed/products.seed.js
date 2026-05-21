const shopGroups = [
  {
    category: 'Highlights',
    products: [
      ['Dawn Ceramic Vase', 'New Collection', 129, 'A sculptural ceramic vase with a soft matte finish for calm interior arrangements.', 'Matte ceramic vase for shelves and tables.'],
      ['Curve Oak Tray', 'Classics', 89, 'A curved oak tray designed for serving, styling, and everyday rituals.', 'Curved oak tray with a warm natural grain.'],
      ['Linen Gift Set', 'Gift Guides', 149, 'A considered gift set with soft linen essentials for refined home moments.', 'Curated linen set for gifting.'],
    ],
  },
  {
    category: 'Furniture',
    products: [
      ['Aster Lounge Chair', 'Lounge Chairs', 849, 'A sculptural lounge chair with soft proportions, designed for calm and comfortable living spaces.', 'Minimal lounge chair with soft upholstery.'],
      ['Forma Coffee Table', 'Tables', 699, 'A low coffee table with balanced geometry and a warm wood surface.', 'Low oak coffee table with clean lines.'],
      ['Nora Storage Cabinet', 'Storage', 1199, 'A refined storage cabinet with generous compartments and quiet detailing.', 'Elegant cabinet for dining and living rooms.'],
    ],
  },
  {
    category: 'Sofas',
    products: [
      ['Mellow 2-Seater Sofa', '2-Seaters', 1499, 'A compact upholstered sofa with deep seating and a composed silhouette.', 'Compact two-seat sofa with soft comfort.'],
      ['Arc 3-Seater Sofa', '3-Seaters', 2199, 'A generous three-seat sofa shaped for slow evenings and relaxed conversation.', 'Curved three-seat sofa for living rooms.'],
      ['Cloud Modular Sofa', 'Modular Sofas', 2899, 'A modular sofa system with flexible sections and soft rounded volumes.', 'Flexible modular sofa with cloud-like cushions.'],
    ],
  },
  {
    category: 'Lighting',
    products: [
      ['Halo Portable Lamp', 'Portable Lamps', 189, 'A rechargeable lamp with a soft diffused glow for shelves, desks, and bedside tables.', 'Portable lamp with warm ambient light.'],
      ['Orbit Pendant Lamp', 'Pendant Lamps', 349, 'A pendant lamp with a quiet circular form and warm downward light.', 'Pendant lamp for dining and kitchen spaces.'],
      ['Sora Table Lamp', 'Table Lamps', 259, 'A table lamp with a linen shade and refined metal base for soft evening light.', 'Table lamp with linen shade.'],
    ],
  },
  {
    category: 'Kitchen',
    products: [
      ['Ripple Glass Set', 'Glasses', 79, 'A set of gently rippled glasses for water, wine, and everyday table settings.', 'Textured glass set for refined tables.'],
      ['Terra Serving Bowl', 'Bowls', 119, 'A wide ceramic serving bowl with an earthy glaze and generous proportions.', 'Ceramic bowl for shared meals.'],
      ['Linen Kitchen Towel Set', 'Kitchen Textiles', 49, 'A soft linen towel set designed for daily kitchen use and relaxed styling.', 'Three-piece linen kitchen towel set.'],
    ],
  },
  {
    category: 'Textiles',
    products: [
      ['Soft Linen Cushion', 'Cushions', 69, 'A soft linen cushion with a tactile weave and understated color palette.', 'Linen cushion for sofas and beds.'],
      ['Grid Cotton Throw', 'Bedspreads and Throws', 139, 'A cotton throw with a subtle grid pattern and comfortable weight.', 'Patterned cotton throw for layering.'],
      ['Pure Bath Towel', 'Towels', 59, 'A plush towel with a clean edge and soft absorbent cotton texture.', 'Absorbent cotton towel for bath spaces.'],
    ],
  },
  {
    category: 'Rugs',
    products: [
      ['Dune Rectangular Rug', 'Rectangular Rugs', 499, 'A rectangular wool rug with a low profile and calm tonal surface.', 'Wool rug for living and dining rooms.'],
      ['Pebble Round Rug', 'Round Rugs', 389, 'A round rug with a soft texture and organic presence for intimate spaces.', 'Round wool rug with organic texture.'],
      ['Line Runner Mat', 'Mats and Runners', 179, 'A slim runner mat with linear texture for hallways and kitchen paths.', 'Textured runner for narrow spaces.'],
    ],
  },
  {
    category: 'Accessories',
    products: [
      ['Poise Oval Mirror', 'Mirrors', 249, 'An oval mirror with a slender frame for bathrooms, hallways, and bedrooms.', 'Oval mirror with refined frame.'],
      ['Shell Ceramic Vase', 'Vases', 99, 'A ceramic vase with a shell-inspired silhouette and soft glazed surface.', 'Decorative ceramic vase for stems.'],
      ['Brass Candle Holder', 'Candle Holders', 79, 'A compact candle holder in brushed brass for warm table and shelf styling.', 'Brushed brass candle holder.'],
    ],
  },
  {
    category: 'Outdoor Living',
    products: [
      ['Cove Outdoor Chair', 'Outdoor Seating', 349, 'A weather-ready chair with a relaxed profile for balconies and garden corners.', 'Outdoor chair for calm open-air seating.'],
      ['Stone Outdoor Table', 'Outdoor Tables', 429, 'A compact outdoor table with a stone-like surface and stable base.', 'Outdoor table for patios and balconies.'],
      ['Clay Outdoor Pot', 'Outdoor Pots', 119, 'A generous plant pot with a clay-toned finish for terraces and green spaces.', 'Large outdoor pot for plants.'],
    ],
  },
  {
    category: 'Certified Products',
    products: [
      ['Renewed Oak Chair', 'Certified Furniture', 579, 'A certified chair made with responsibly sourced oak and durable woven seating.', 'Certified oak chair for dining spaces.'],
      ['Restored Table Lamp', 'Certified Lighting', 219, 'A certified lamp with replaceable components and a timeless table silhouette.', 'Certified table lamp with soft light.'],
      ['Certified Storage Box', 'Certified Accessories', 89, 'A practical storage box made with certified materials and clean detailing.', 'Certified storage box for shelves.'],
    ],
  },
  {
    category: 'Spare Parts',
    products: [
      ['Lamp Shade Replacement', 'Lamp Parts', 39, 'A replacement lamp shade designed to extend the life of compatible lighting pieces.', 'Replacement shade for table lamps.'],
      ['Sofa Leg Set', 'Sofa Parts', 59, 'A set of replacement sofa legs with mounting hardware and a clean wood finish.', 'Replacement sofa legs with hardware.'],
      ['Shelf Mounting Kit', 'Mounting Parts', 29, 'A mounting kit with brackets and screws for compatible shelving systems.', 'Mounting kit for shelving support.'],
    ],
  },
];

const roomsByCategory = {
  Highlights: ['Living Room', 'Dining Room'],
  Furniture: ['Living Room', 'Bedroom', 'Office'],
  Sofas: ['Living Room'],
  Lighting: ['Living Room', 'Bedroom', 'Dining Room'],
  Kitchen: ['Kitchen', 'Dining Room'],
  Textiles: ['Bedroom', 'Bathroom', 'Living Room'],
  Rugs: ['Living Room', 'Hallway', 'Bedroom'],
  Accessories: ['Living Room', 'Hallway', 'Bathroom'],
  'Outdoor Living': ['Green Space', 'Outdoor'],
  'Certified Products': ['Living Room', 'Dining Room', 'Office'],
  'Spare Parts': ['Utility', 'Living Room'],
};

const materialsByCategory = {
  Highlights: ['Ceramic', 'Oak', 'Linen'],
  Furniture: ['Oak', 'Linen Blend', 'Foam'],
  Sofas: ['Solid Wood', 'High-resilience Foam', 'Textured Weave'],
  Lighting: ['Powder-coated Steel', 'Linen Shade', 'LED'],
  Kitchen: ['Glass', 'Stoneware', 'Linen'],
  Textiles: ['Linen', 'Cotton'],
  Rugs: ['Wool', 'Cotton Backing'],
  Accessories: ['Ceramic', 'Brass', 'Glass'],
  'Outdoor Living': ['Powder-coated Steel', 'Stone Composite', 'Frost-resistant Clay'],
  'Certified Products': ['Certified Oak', 'Recycled Metal', 'Certified Paper Pulp'],
  'Spare Parts': ['Steel', 'Wood', 'Mounting Hardware'],
};

const productImages = [
  'https://images.unsplash.com/photo-1725859685127-c723ea1d32a1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1752004028694-72610be3604e?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1723750290151-164cb19ebab7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1751945965380-017e4ac16506?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1745421147906-aa19b49366aa?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1758448511421-debb41f3e621?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1776993298427-743301e493e3?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1739800228654-697054cec854?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1760402327535-85a771fb034c?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1762076661989-8ccb95372df4?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1762117361523-0fb17f384e73?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1759238136818-7b00ec9e782a?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1773578639782-2046b150ce28?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1768609239321-1cfe14893e80?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1757262798677-ab4af4455a58?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1771888703723-01d85da1dae1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1569081596046-a00841f93159?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1611270478701-e5b9e0c91890?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1711450840884-12a344ed3070?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1675272915407-eb4e5e250716?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1678787034633-90a07f2245ff?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1592150138572-7f2aa260eac7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1596079890687-58c51d24889a?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1635232958384-cb399204f666?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1598342473022-5ced5bb5c291?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1558204556-cdba3d78a2d0?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1769184618499-976029286a64?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1769690398892-0cd9be392d7f?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1767692965744-744b2cc89f11?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1658915353538-1c844d1c7424?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1663322378853-e0fcee16adc2?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1761295908436-89f850764209?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
];

const sizes = ['One Size'];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const products = shopGroups.flatMap((group, groupIndex) =>
  group.products.map(([name, subcategory, price, description, shortDescription], productIndex) => {
    const numericId = groupIndex * 3 + productIndex + 1;
    const id = `prod_${String(numericId).padStart(3, '0')}`;
    const slug = slugify(name);
    const stock = 8 + ((numericId * 3) % 13);
    const imageUrl = productImages[numericId - 1];
    const detailImageUrl = productImages[numericId % productImages.length];
    const materials = materialsByCategory[group.category] || ['Mixed Materials'];

    return {
      productId: id,
      name,
      slug,
      category: group.category,
      subcategory,
      room: roomsByCategory[group.category] || ['Living Room'],
      price,
      currency: 'EUR',
      description,
      shortDescription,
      images: [imageUrl, detailImageUrl],
      sizes,
      materials,
      stock,
      isNew: group.category === 'Highlights' || productIndex === 0,
      isCertified: group.category === 'Certified Products',
      isFeatured: productIndex === 0,
      isPopular: productIndex < 2,
      badge: group.category === 'Certified Products' ? 'Certified' : productIndex === 0 ? 'New' : productIndex === 1 ? 'Popular' : '',
      details: {
        itemNumber: `BREW-DEMO-${String(numericId).padStart(3, '0')}`,
        size: productIndex === 1 ? 'W 90 x H 42 x D 60 cm' : 'W 78 x H 72 x D 82 cm',
        weight: `${6 + productIndex * 4} kg`,
        material: materials.join(', '),
        origin: 'Designed in Europe',
      },
      careInstructions:
        'Clean gently with a soft dry cloth. Avoid harsh chemicals, direct heat, and prolonged exposure to strong sunlight.',

      // Compatibility fields for existing cards/cart/detail.
      material: materials.join(', '),
      dimensions: productIndex === 1 ? 'W: 90 x H: 42 x D: 60 cm' : 'W: 78 x H: 72 x D: 82 cm',
      inStock: stock > 0,
      imageUrl,
    };
  }),
);

export const shopMenu = [
  { title: 'Highlights', links: ['New Collection', 'Gift Guides', 'Classics', 'Shop by Series', 'Bestsellers', 'Gift Card'] },
  { title: 'Furniture', links: ['All Furniture', 'Lounge Chairs', 'Tables', 'Storage', 'Customise Shelving'] },
  { title: 'Sofas', links: ['All Sofas', '2-Seaters', '3-Seaters', '4-Seaters', 'Modular Sofas', 'Sofa Modules', 'Fabric Samples'] },
  { title: 'Lighting', links: ['All Lighting', 'Portable Lamps', 'Pendant Lamps', 'Table Lamps', 'Floor Lamps', 'Wall Lamps', 'Customise Lamp'] },
  { title: 'Kitchen', links: ['All Kitchen Items', 'Kitchen Textiles', 'Glasses', 'Cups', 'Carafes', 'Plates', 'Bowls', 'Serveware', 'Kitchen Tools and Utensils'] },
  { title: 'Textiles', links: ['All Textiles', 'Cushions', 'Cushion Covers', 'Bedspreads and Throws', 'Towels', 'Shower Curtains'] },
  { title: 'Rugs', links: ['All Rugs', 'Rectangular Rugs', 'Round Rugs', 'Mats and Runners'] },
  { title: 'Accessories', links: ['All Accessories', 'Mirrors', 'Vases', 'Candle Holders', 'Baskets', 'Hooks', 'Wall Decor', 'Plant Pots'] },
  { title: 'Outdoor Living', links: ['All Outdoor Living Items', 'Outdoor Accessories', 'Outdoor Textiles', 'Outdoor Seating', 'Outdoor Tables', 'Outdoor Pots'] },
  { title: 'Certified Products', links: ['All Certified Products', 'Certified Furniture', 'Certified Lighting', 'Certified Accessories'] },
  { title: 'Spare Parts', links: ['All Spare Parts', 'Lamp Parts', 'Sofa Parts', 'Furniture Parts', 'Mounting Parts'] },
];
