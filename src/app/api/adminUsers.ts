import { authHeaders } from './auth';

export type UserRole = 'user' | 'admin' | 'warehouse' | 'accountant';
export type UserStatus = 'active' | 'locked' | 'inactive';
export type StaffRole = 'warehouse' | 'accountant';

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isDeleted: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  includeDeleted?: boolean;
};

async function parseUserResponse(response: Response, fallbackMessage: string): Promise<AdminUser> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }
  return data.user;
}

export async function getAdminUsers(query: AdminUsersQuery = {}): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/admin/users${suffix}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load accounts');
  }

  return response.json();
}

export async function createStaffUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: StaffRole;
}): Promise<AdminUser> {
  const response = await fetch('/api/admin/users/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });

  return parseUserResponse(response, 'Unable to create staff account');
}

export async function updateAdminUser(id: string, input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: StaffRole;
  status?: UserStatus;
}): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });

  return parseUserResponse(response, 'Unable to update account');
}

export async function updateAdminUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });

  return parseUserResponse(response, 'Unable to update account status');
}

export async function resetAdminUserPassword(id: string, newPassword: string): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newPassword }),
  });

  return parseUserResponse(response, 'Unable to reset password');
}

export async function softDeleteAdminUser(id: string): Promise<AdminUser> {
  const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return parseUserResponse(response, 'Unable to delete account');
}
