import { authHeaders } from './auth';

export type StorySection = {
  heading?: string;
  body: string;
  image?: string;
};

export type Story = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  heroImage?: string;
  images?: string[];
  author?: string;
  publishedAt?: string;
  readTime?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  tags?: string[];
  sections?: StorySection[];
  quote?: string;
  relatedProductIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type StoryQuery = {
  category?: string;
  q?: string;
  featured?: string;
  includeDrafts?: string;
};

function queryString(query: StoryQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export async function getStories(query: StoryQuery = {}): Promise<Story[]> {
  const response = await fetch(`/api/stories${queryString(query)}`);
  if (!response.ok) throw new Error('Unable to load stories');
  return response.json();
}

export async function getStory(id: string): Promise<Story> {
  const response = await fetch(`/api/stories/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Unable to load story');
  return response.json();
}

export async function createStory(story: Story): Promise<Story> {
  const response = await fetch('/api/stories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(story),
  });
  if (!response.ok) throw new Error('Unable to create story');
  return response.json();
}

export async function updateStory(id: string, story: Story): Promise<Story> {
  const response = await fetch(`/api/stories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(story),
  });
  if (!response.ok) throw new Error('Unable to update story');
  return response.json();
}

export async function deleteStory(id: string): Promise<void> {
  const response = await fetch(`/api/stories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Unable to delete story');
}
