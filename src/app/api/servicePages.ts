import { authHeaders } from './auth';

export type ServiceSection = {
  title?: string;
  body?: string;
  items?: string[];
};

export type ServicePage = {
  id: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  heroImage?: string;
  sections?: ServiceSection[];
  ctaLabel?: string;
  ctaHref?: string;
  order?: number;
  isPublished?: boolean;
};

export async function getServicePages(includeDrafts = false): Promise<ServicePage[]> {
  const response = await fetch(`/api/service-pages${includeDrafts ? '?includeDrafts=true' : ''}`);
  if (!response.ok) throw new Error('Unable to load service pages');
  return response.json();
}

export async function getServicePage(id: string): Promise<ServicePage> {
  const response = await fetch(`/api/service-pages/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Unable to load service page');
  return response.json();
}

export async function createServicePage(page: ServicePage): Promise<ServicePage> {
  const response = await fetch('/api/service-pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(page),
  });
  if (!response.ok) throw new Error('Unable to create service page');
  return response.json();
}

export async function updateServicePage(id: string, page: ServicePage): Promise<ServicePage> {
  const response = await fetch(`/api/service-pages/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(page),
  });
  if (!response.ok) throw new Error('Unable to update service page');
  return response.json();
}

export async function deleteServicePage(id: string): Promise<void> {
  const response = await fetch(`/api/service-pages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Unable to delete service page');
}
