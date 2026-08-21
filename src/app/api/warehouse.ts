import { authHeaders } from './auth';

export type InventoryProduct = {
  _id: string;
  productId: string;
  name: string;
  category: string;
  subcategory?: string;
  price?: number;
  currency?: string;
  stock: number;
  imageUrl?: string;
  stockStatus: 'inStock' | 'outOfStock';
};

export type ReceiptStatus = 'draft' | 'confirmed' | 'cancelled';

export type WarehouseReceiptItem = {
  productId: string;
  quantity: number;
  unitCost: number;
  lineTotal?: number;
  product?: InventoryProduct | null;
};

export type WarehouseReceipt = {
  id: string;
  receiptNumber: string;
  warehouseStaffId?: string;
  warehouseStaff?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
  receiptDate: string;
  items: WarehouseReceiptItem[];
  totalValue: number;
  status: ReceiptStatus;
  note?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryBatch = {
  id: string;
  batchCode: string;
  productId: string;
  receiptId: string;
  receivedDate: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  status: 'available' | 'depleted';
  createdAt: string;
};

export type WarehouseOrder = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  inventoryReserved?: boolean;
  inventoryRestored?: boolean;
  items: Array<{ productId: string; name: string; quantity: number }>;
  createdAt: string;
};

export type WarehouseIssue = {
  id: string;
  issueNumber: string;
  orderId?: string;
  issueDate: string;
  items: Array<WarehouseReceiptItem & {
    cost: number;
    fifoAllocations?: Array<{ batchId: string; quantity: number; unitCost: number }>;
  }>;
  totalCost: number;
  status: ReceiptStatus;
  note?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseCount = {
  id: string;
  countNumber: string;
  countDate: string;
  items: Array<{
    productId: string;
    systemQuantity: number;
    actualQuantity: number;
    difference: number;
    product?: InventoryProduct | null;
  }>;
  status: ReceiptStatus;
  note?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryLog = {
  id: string;
  productId: string;
  type: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost: number;
  totalCost: number;
  referenceType: 'receipt' | 'issue' | 'count';
  referenceId: string;
  performedBy: string;
  createdAt: string;
};

export async function getWarehouseInventory(query: {
  search?: string;
  category?: string;
  stockStatus?: 'all' | 'inStock' | 'outOfStock';
} = {}): Promise<{ products: InventoryProduct[]; categories: string[] }> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });

  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/warehouse/inventory${suffix}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load inventory');
  }

  return response.json();
}

export async function getWarehouseReceipts(query: {
  search?: string;
  status?: ReceiptStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<WarehouseReceipt[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });

  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/warehouse/receipts${suffix}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load receipts');
  }

  const data = await response.json();
  return data.receipts;
}

export async function getWarehouseReceipt(id: string): Promise<{ receipt: WarehouseReceipt; batches: InventoryBatch[] }> {
  const response = await fetch(`/api/warehouse/receipts/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load receipt');
  }

  return response.json();
}

export async function saveWarehouseReceipt(input: {
  id?: string;
  receiptDate: string;
  items: WarehouseReceiptItem[];
  note?: string;
}): Promise<WarehouseReceipt> {
  const response = await fetch(input.id ? `/api/warehouse/receipts/${encodeURIComponent(input.id)}` : '/api/warehouse/receipts', {
    method: input.id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to save receipt');
  }

  return data.receipt;
}

export async function cancelWarehouseReceipt(id: string): Promise<WarehouseReceipt> {
  const response = await fetch(`/api/warehouse/receipts/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to cancel receipt');
  }

  return data.receipt;
}

export async function confirmWarehouseReceipt(id: string): Promise<{ receipt: WarehouseReceipt; batches: InventoryBatch[] }> {
  const response = await fetch(`/api/warehouse/receipts/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to confirm receipt');
  }

  return data;
}

export async function getWarehouseOrders(): Promise<WarehouseOrder[]> {
  const response = await fetch('/api/warehouse/orders', { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load warehouse orders');
  const data = await response.json();
  return data.orders;
}

export async function getWarehouseIssues(query: { status?: ReceiptStatus | 'all'; search?: string } = {}): Promise<WarehouseIssue[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/warehouse/issues${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load issues');
  const data = await response.json();
  return data.issues;
}

export async function saveWarehouseIssue(input: { id?: string; orderId?: string; issueDate: string; items?: WarehouseReceiptItem[]; note?: string }): Promise<WarehouseIssue> {
  const response = await fetch(input.id ? `/api/warehouse/issues/${encodeURIComponent(input.id)}` : '/api/warehouse/issues', {
    method: input.id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to save issue');
  return data.issue;
}

export async function cancelWarehouseIssue(id: string): Promise<WarehouseIssue> {
  const response = await fetch(`/api/warehouse/issues/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', headers: authHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to cancel issue');
  return data.issue;
}

export async function confirmWarehouseIssue(id: string): Promise<WarehouseIssue> {
  const response = await fetch(`/api/warehouse/issues/${encodeURIComponent(id)}/confirm`, { method: 'POST', headers: authHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to confirm issue');
  return data.issue;
}

export async function getWarehouseCounts(query: { status?: ReceiptStatus | 'all'; search?: string } = {}): Promise<WarehouseCount[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/warehouse/counts${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load counts');
  const data = await response.json();
  return data.counts;
}

export async function saveWarehouseCount(input: { id?: string; countDate: string; items: Array<{ productId: string; actualQuantity: number }>; note?: string }): Promise<WarehouseCount> {
  const response = await fetch(input.id ? `/api/warehouse/counts/${encodeURIComponent(input.id)}` : '/api/warehouse/counts', {
    method: input.id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to save count');
  return data.count;
}

export async function cancelWarehouseCount(id: string): Promise<WarehouseCount> {
  const response = await fetch(`/api/warehouse/counts/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', headers: authHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to cancel count');
  return data.count;
}

export async function confirmWarehouseCount(id: string): Promise<WarehouseCount> {
  const response = await fetch(`/api/warehouse/counts/${encodeURIComponent(id)}/confirm`, { method: 'POST', headers: authHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to confirm count');
  return data.count;
}

export async function getWarehouseInventoryLogs(query: { productId?: string; type?: InventoryLog['type'] | 'all' } = {}): Promise<InventoryLog[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/warehouse/inventory-logs${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load inventory history');
  const data = await response.json();
  return data.logs;
}
