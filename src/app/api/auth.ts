export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
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
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

const tokenKey = 'brew_auth_token';

export function getAuthToken() {
  return localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey);
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Invalid email or password');
  }

  return response.json();
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  newsletter: boolean;
}): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Unable to create account');
  }

  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch('/api/auth/me', {
    headers: authHeaders(),
  });

  if (!response.ok) {
    clearAuthToken();
    return null;
  }

  const data = await response.json();
  return data.user;
}

export async function updateCurrentUser(input: {
  firstName: string;
  lastName: string;
  newsletter?: boolean;
  addresses?: AuthUser['addresses'];
}): Promise<AuthUser> {
  const response = await fetch('/api/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Unable to update account');
  }

  const data = await response.json();
  return data.user;
}
