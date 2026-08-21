import { authHeaders } from './auth';

export type AdminCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'warehouse' | 'accountant';
  status?: 'active' | 'locked' | 'inactive';
  isDeleted?: boolean;
  newsletter?: boolean;
  addresses?: Array<{
    label: string;
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  }>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export type AdminCustomersResponse = {
  total: number;
  newsletterCount: number;
  customers: AdminCustomer[];
};

export async function getAdminCustomers(): Promise<AdminCustomersResponse> {
  const response = await fetch('/api/customers', {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load customers');
  }

  return response.json();
}
