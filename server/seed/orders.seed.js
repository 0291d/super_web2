import { products } from './products.seed.js';
import { customers } from './customers.seed.js';

const statuses = ['paid', 'processing', 'completed', 'paid', 'completed', 'cancelled'];

function makeAddress(customer, index) {
  const address = customer.addresses?.[0] || {};

  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    company: index % 5 === 0 ? 'BREW Studio Client' : '',
    address1: address.address1 || `${18 + index} Nguyen Hue Street`,
    address2: index % 4 === 0 ? `Apartment ${index + 2}A` : '',
    city: address.city || 'Ho Chi Minh City',
    postalCode: address.postalCode || `70${String(100 + index).padStart(3, '0')}`,
    country: address.country || 'Vietnam',
    phone: address.phone || `090${String(1000000 + index * 739).slice(0, 7)}`,
  };
}

function makeOrderNumber(index, createdAt) {
  const stamp = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `BREW-${stamp}-SEED${String(index + 1).padStart(2, '0')}`;
}

function makeItems(orderIndex) {
  const itemCount = 1 + (orderIndex % 3);
  return Array.from({ length: itemCount }, (_, itemIndex) => {
    const product = products[(orderIndex * 2 + itemIndex * 5) % products.length];
    const quantity = 1 + ((orderIndex + itemIndex) % 3);
    const unitPrice = Number(product.price);

    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl || product.images?.[0] || '',
      category: product.category,
      subcategory: product.subcategory,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

export const orders = Array.from({ length: customers.length * 2 }, (_, index) => {
  const customer = customers[index % customers.length];
  const createdAt = new Date();
  createdAt.setHours(10 + (index % 8), 15, 0, 0);
  createdAt.setDate(createdAt.getDate() - index);

  const items = makeItems(index);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingTotal = subtotal >= 150 ? 0 : 15;
  const taxTotal = roundMoney(subtotal * 0.08);
  const total = roundMoney(subtotal + shippingTotal + taxTotal);
  const address = makeAddress(customer, index);

  return {
    orderNumber: makeOrderNumber(index, createdAt),
    email: customer.email,
    userId: '',
    items,
    shippingAddress: address,
    billingAddress: address,
    paymentMethod: 'card_demo',
    deliveryMethod: index % 4 === 0 ? 'express' : 'standard',
    subtotal,
    shippingTotal,
    taxTotal,
    total,
    currency: 'EUR',
    status: index < customers.length ? statuses[index % 5] : statuses[index % statuses.length],
    notes: index % 6 === 0 ? 'Seed demo order for revenue reporting.' : '',
    createdAt,
    updatedAt: createdAt,
  };
});
