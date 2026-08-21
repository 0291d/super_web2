import { customers } from './customers.seed.js';

const demoProducts = [
  {
    productId: 'ferm-ripple-glasses',
    name: 'Ripple Long Drink Glasses',
    slug: 'ripple-long-drink-glasses',
    imageUrl: '/img/accesories/1.webp',
    category: 'Accessories',
    subcategory: 'Glassware',
    unitPrice: 55,
  },
  {
    productId: 'ferm-hebe-lamp',
    name: 'Hebe Table Lamp',
    slug: 'hebe-table-lamp',
    imageUrl: '/img/lightning/1.avif',
    category: 'Lighting',
    subcategory: 'Table Lamps',
    unitPrice: 349,
  },
  {
    productId: 'ferm-desert-chair',
    name: 'Desert Lounge Chair',
    slug: 'desert-lounge-chair',
    imageUrl: '/img/Outdoor_living/1.webp',
    category: 'Outdoor Living',
    subcategory: 'Chairs',
    unitPrice: 335,
  },
  {
    productId: 'ferm-kelim-rug',
    name: 'Kelim Rug',
    slug: 'kelim-rug',
    imageUrl: '/img/rug/1.webp',
    category: 'Rugs',
    subcategory: 'Woven Rugs',
    unitPrice: 189,
  },
  {
    productId: 'ferm-catena-sofa',
    name: 'Catena Sofa',
    slug: 'catena-sofa',
    imageUrl: '/img/Sofas/1.webp',
    category: 'Sofas',
    subcategory: 'Modular Sofas',
    unitPrice: 2499,
  },
  {
    productId: 'ferm-punctual-shelf',
    name: 'Punctual Shelf',
    slug: 'punctual-shelf',
    imageUrl: '/img/Furniture/1.webp',
    category: 'Furniture',
    subcategory: 'Shelving',
    unitPrice: 225,
  },
  {
    productId: 'ferm-still-teapot',
    name: 'Still Teapot',
    slug: 'still-teapot',
    imageUrl: '/img/kitchen/1.webp',
    category: 'Kitchen',
    subcategory: 'Serveware',
    unitPrice: 89,
  },
  {
    productId: 'ferm-calm-cushion',
    name: 'Calm Cushion',
    slug: 'calm-cushion',
    imageUrl: '/img/Textiles/1.webp',
    category: 'Textiles',
    subcategory: 'Cushions',
    unitPrice: 69,
  },
];

const recentOrderDates = [
  '2026-01-04T09:15:00.000Z',
  '2026-01-09T13:40:00.000Z',
  '2026-01-16T08:30:00.000Z',
  '2026-01-25T15:10:00.000Z',
  '2026-02-02T10:20:00.000Z',
  '2026-02-08T11:45:00.000Z',
  '2026-02-14T14:05:00.000Z',
  '2026-02-23T09:55:00.000Z',
  '2026-03-03T12:35:00.000Z',
  '2026-03-09T16:20:00.000Z',
  '2026-03-15T08:50:00.000Z',
  '2026-03-22T13:25:00.000Z',
  '2026-03-30T10:05:00.000Z',
  '2026-04-04T15:45:00.000Z',
  '2026-04-10T09:35:00.000Z',
  '2026-04-16T12:15:00.000Z',
  '2026-04-22T14:55:00.000Z',
  '2026-04-29T10:40:00.000Z',
  '2026-05-04T08:25:00.000Z',
  '2026-05-09T13:00:00.000Z',
  '2026-05-14T16:30:00.000Z',
  '2026-05-19T09:20:00.000Z',
  '2026-05-24T11:10:00.000Z',
  '2026-05-29T15:35:00.000Z',
  '2026-06-03T10:45:00.000Z',
  '2026-06-08T13:15:00.000Z',
  '2026-06-12T08:55:00.000Z',
  '2026-06-17T14:25:00.000Z',
  '2026-06-21T09:50:00.000Z',
  '2026-06-24T12:05:00.000Z',
];

const historicalOrderDates = Array.from({ length: 60 }, (_, index) => {
  const year = 2021 + Math.floor(index / 15);
  const month = (index * 5 + Math.floor(index / 15) * 2) % 12;
  const day = ((index * 7 + 3) % 26) + 1;
  const hour = 8 + (index % 9);
  const minute = (index * 11) % 60;

  return new Date(Date.UTC(year, month, day, hour, minute, 0)).toISOString();
});

const orderDates = [...recentOrderDates, ...historicalOrderDates];

const orderLines = [
  [[4, 1], [7, 2]],
  [[1, 1], [0, 4], [6, 1]],
  [[2, 2], [7, 3]],
  [[5, 2], [0, 2]],
  [[3, 3], [6, 2]],
  [[1, 2], [7, 4]],
  [[4, 1], [5, 1]],
  [[2, 1], [3, 2], [0, 6]],
  [[5, 3], [6, 3]],
  [[4, 1], [1, 1]],
  [[3, 4], [7, 4]],
  [[2, 2], [0, 3]],
  [[1, 1], [5, 2], [6, 1]],
  [[4, 1], [3, 1]],
  [[2, 1], [7, 6], [0, 4]],
  [[5, 4], [1, 1]],
  [[4, 2]],
  [[3, 5], [6, 2]],
  [[0, 2], [7, 1]],
  [[1, 1], [3, 1]],
  [[2, 3], [6, 2]],
  [[5, 1], [7, 5], [0, 2]],
  [[4, 1], [6, 4]],
  [[1, 2], [3, 1]],
  [[2, 1], [5, 2], [7, 2]],
  [[0, 8], [6, 1]],
  [[3, 2], [1, 1]],
  [[5, 3], [7, 3]],
  [[4, 1], [0, 6]],
  [[2, 2], [1, 1], [6, 2]],
];

const statuses = [
  'completed',
  'processing',
  'paid',
  'completed',
  'paid',
  'processing',
  'completed',
  'paid',
  'completed',
  'paid',
  'completed',
  'processing',
  'paid',
  'completed',
  'paid',
  'completed',
  'paid',
  'completed',
  'pending',
  'cancelled',
  'paid',
  'processing',
  'completed',
  'paid',
  'completed',
  'paid',
  'processing',
  'completed',
  'paid',
  'completed',
];

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function makeAddress(customer) {
  const address = customer.addresses?.[0] || {};

  return {
    firstName: address.firstName || customer.firstName,
    lastName: address.lastName || customer.lastName,
    company: address.company || '',
    address1: address.address1 || '',
    address2: address.address2 || '',
    city: address.city || '',
    postalCode: address.postalCode || '',
    country: address.country || 'Vietnam',
    phone: address.phone || '',
  };
}

function makeItems(lines) {
  return lines.map(([productIndex, quantity]) => {
    const product = demoProducts[productIndex];
    const lineTotal = roundMoney(product.unitPrice * quantity);

    return {
      ...product,
      quantity,
      lineTotal,
    };
  });
}

function makeOrder(index) {
  const customer = customers[index % customers.length];
  const items = makeItems(orderLines[index % orderLines.length]);
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const discountRate = index % 7 === 0 ? 0.1 : index % 5 === 0 ? 0.05 : 0;
  const discountTotal = roundMoney(subtotal * discountRate);
  const discountedSubtotal = roundMoney(subtotal - discountTotal);
  const shippingTotal = subtotal >= 150 ? 0 : 15;
  const taxTotal = roundMoney(discountedSubtotal * 0.08);
  const total = roundMoney(discountedSubtotal + shippingTotal + taxTotal);
  const status = statuses[index % statuses.length];
  const createdAt = new Date(orderDates[index]);
  const paidStatuses = ['paid', 'processing', 'completed'];
  const address = makeAddress(customer);

  return {
    orderNumber: `BREW-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-SEED${String(index + 1).padStart(2, '0')}`,
    email: customer.email,
    userId: '',
    items,
    shippingAddress: address,
    billingAddress: address,
    paymentMethod: 'card_demo',
    paymentProvider: 'demo',
    paidAt: paidStatuses.includes(status) ? createdAt : undefined,
    deliveryMethod: index % 6 === 0 ? 'express' : 'standard',
    subtotal,
    discountRate,
    discountTotal,
    shippingTotal,
    taxTotal,
    total,
    currency: 'EUR',
    status,
    notes: 'Seed demo order for revenue reporting.',
    publicToken: `seed-access-${String(index + 1).padStart(2, '0')}`,
    inventoryReserved: paidStatuses.includes(status),
    inventoryRestored: status === 'cancelled',
    createdAt,
    updatedAt: createdAt,
  };
}

export const orders = Array.from({ length: 90 }, (_, index) => makeOrder(index));
