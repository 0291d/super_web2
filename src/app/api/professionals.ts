import { authHeaders } from './auth';

export type ProfessionalCard = {
  title: string;
  description: string;
  linkLabel?: string;
  href?: string;
  order?: number;
  isActive?: boolean;
};

export type Catalogue = {
  title: string;
  fileSize?: string;
  fileUrl?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

export type ProfessionalPage = {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage?: string;
  cards: ProfessionalCard[];
  inquiryTitle: string;
  inquiryIntro?: string;
  cataloguesTitle: string;
  catalogues: Catalogue[];
  servicesTitle?: string;
  services?: string[];
  isPublished?: boolean;
};

export type ProfessionalInquiry = {
  id?: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  projectDetails: string;
  status?: 'new' | 'reviewed' | 'archived';
  createdAt?: string;
};

export async function getProfessionalPage(admin = false): Promise<ProfessionalPage> {
  const response = await fetch(`/api/professionals${admin ? '/admin' : ''}`, {
    headers: admin ? authHeaders() : undefined,
  });
  if (!response.ok) throw new Error('Unable to load professionals page');
  return response.json();
}

export async function updateProfessionalPage(page: ProfessionalPage): Promise<ProfessionalPage> {
  const response = await fetch('/api/professionals/admin', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(page),
  });
  if (!response.ok) throw new Error('Unable to update professionals page');
  return response.json();
}

export async function createProfessionalInquiry(inquiry: ProfessionalInquiry): Promise<ProfessionalInquiry> {
  const response = await fetch('/api/professionals/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiry),
  });
  if (!response.ok) throw new Error('Unable to submit inquiry');
  return response.json();
}

export async function getProfessionalInquiries(): Promise<ProfessionalInquiry[]> {
  const response = await fetch('/api/professionals/inquiries', {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Unable to load inquiries');
  return response.json();
}

export async function updateProfessionalInquiry(id: string, inquiry: Partial<ProfessionalInquiry>): Promise<ProfessionalInquiry> {
  const response = await fetch(`/api/professionals/inquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(inquiry),
  });
  if (!response.ok) throw new Error('Unable to update inquiry');
  return response.json();
}

export async function deleteProfessionalInquiry(id: string): Promise<void> {
  const response = await fetch(`/api/professionals/inquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Unable to delete inquiry');
}
