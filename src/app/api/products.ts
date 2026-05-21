import { Product } from '../context/GlobalContext';
import { authHeaders } from './auth';

export type ProductDetail = Product & {
  description?: string;
  shortDescription?: string;
  images?: string[];
  sizes?: string[];
  materials?: string[];
  stock?: number;
  details?: {
    itemNumber?: string;
    size?: string;
    weight?: string;
    material?: string;
    origin?: string;
  };
  careInstructions?: string;
  material?: string;
  dimensions?: string;
  inStock?: boolean;
  imageUrl?: string;
};

export type ProductQuery = {
  category?: string;
  subcategory?: string;
  q?: string;
  sort?: string;
};

export async function getProducts(query: ProductQuery = {}): Promise<ProductDetail[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/products${suffix}`);

  if (!response.ok) {
    throw new Error('Unable to load products');
  }

  return response.json();
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const response = await fetch(`/api/products/${id}`);

  if (!response.ok) {
    throw new Error('Unable to load product');
  }

  return response.json();
}

export async function createProduct(product: ProductDetail): Promise<ProductDetail> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Unable to create product');
  }

  return response.json();
}

export async function updateProduct(id: string, product: ProductDetail): Promise<ProductDetail> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Unable to update product');
  }

  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to delete product');
  }
}
