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
  { title: 'Spare Parts', links: ['All Spare Parts'] },
];

export const shopCategories = shopMenu.map((group) => group.title);

export function shopLinkFor(title: string, link?: string) {
  if (!link || link.startsWith('All ')) {
    return `/shop?category=${encodeURIComponent(title)}`;
  }

  return `/shop?subcategory=${encodeURIComponent(link)}`;
}
