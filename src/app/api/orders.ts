import { CartItem } from '../context/GlobalContext';
import { authHeaders } from './auth';

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  email: string;
  items: Array<CartItem & { productId?: string; lineTotal: number; unitPrice: number }>;
  shippingAddress: CheckoutAddress;
  billingAddress: CheckoutAddress;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  publicToken?: string;
  createdAt: string;
};

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

export async function createOrder(input: {
  email: string;
  items: CartItem[];
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  paymentMethod?: string;
  deliveryMethod?: string;
  notes?: string;
}): Promise<Order & { paymentUrl?: string }> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Unable to create order');
  }

  const data = await response.json();
  return data.order ? { ...data.order, paymentUrl: data.paymentUrl } : data;
}

export async function getOrder(orderNumber: string, token = ''): Promise<Order> {
  const suffix = token ? `?token=${encodeURIComponent(token)}` : '';
  const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}${suffix}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Unable to load order');
  return response.json();
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders/my', {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load orders');
  }

  return response.json();
}

export async function getAllOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders', {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load orders');
  }

  return response.json();
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const response = await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Unable to update order status');
  }

  return response.json();
}
