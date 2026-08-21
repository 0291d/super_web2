import { authHeaders } from './auth';

export type JournalStatus = 'auto' | 'confirmed' | 'need_adjustment' | 'adjusted';
export type JournalType = 'REVENUE' | 'COGS' | 'TAX' | 'ADJUSTMENT' | 'REFUND';
export type ReconciliationSource = 'VNPAY' | 'COD' | 'BANK';
export type ReconciliationStatus = 'pending' | 'matched' | 'difference';
export type ReconciliationResult = 'matched' | 'difference' | 'not_received';
export type AdjustmentStatus = 'pending' | 'completed' | 'cancelled';
export type ExceptionType = 'RETURN' | 'REFUND' | 'UNDERPAYMENT' | 'OVERPAYMENT' | 'CANCEL_AFTER_EXPORT' | 'RECONCILIATION_DIFFERENCE';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'cancelled';

export type AccountingJournal = {
  id: string;
  journalNumber: string;
  journalType: JournalType;
  sourceType: 'order' | 'payment' | 'inventoryissue' | 'exception';
  sourceId: string;
  orderId?: string;
  order?: { orderNumber?: string; total?: number; taxTotal?: number; shippingTotal?: number; status?: string; paymentMethod?: string } | null;
  description: string;
  lines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }>;
  status: JournalStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  totals: { debit: number; credit: number };
};

export type ReconciliationItem = {
  paymentId: string;
  orderId?: string;
  transactionCode: string;
  systemAmount: number;
  actualAmount: number | null;
  difference: number;
  result: ReconciliationResult;
  order?: { orderNumber?: string; total?: number; status?: string; paymentMethod?: string } | null;
};

export type Reconciliation = {
  id: string;
  reconciliationNumber: string;
  accountantId: string;
  source: ReconciliationSource;
  fromDate: string;
  toDate: string;
  items: ReconciliationItem[];
  status: ReconciliationStatus;
  note?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountingAdjustment = {
  id: string;
  adjustmentNumber: string;
  journalId: string;
  reconciliationId?: string;
  accountantId: string;
  reason: string;
  oldData: Record<string, unknown>;
  newData: { lines?: Array<{ accountCode: string; accountName: string; debit: number; credit: number }>; [key: string]: unknown };
  status: AdjustmentStatus;
  adjustedAt?: string;
  createdAt: string;
  updatedAt: string;
  journal?: { journalNumber?: string; journalType?: JournalType; status?: JournalStatus; description?: string } | null;
  reconciliation?: { reconciliationNumber?: string; source?: ReconciliationSource; status?: ReconciliationStatus } | null;
};

export type AccountingException = {
  id: string;
  exceptionNumber: string;
  exceptionType: ExceptionType;
  orderId?: string;
  paymentId?: string;
  inventoryIssueId?: string;
  reconciliationId?: string;
  accountantId: string;
  description: string;
  amount: number;
  handlingAction: string;
  status: ExceptionStatus;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  order?: { orderNumber?: string; total?: number; status?: string; paymentMethod?: string } | null;
  payment?: { paymentNumber?: string; method?: string; amount?: number; status?: string; transactionCode?: string } | null;
  inventoryIssue?: { issueNumber?: string; totalCost?: number; status?: string } | null;
  journals?: Array<{ journalNumber?: string; journalType?: JournalType; status?: JournalStatus; description?: string }>;
};

async function parseJson(response: Response) {
  return response.json().catch(() => null);
}

export async function getAccountingJournals(query: {
  journalType?: JournalType | 'all';
  status?: JournalStatus | 'all';
  search?: string;
} = {}): Promise<AccountingJournal[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/accounting/journals${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load accounting journals');
  const data = await response.json();
  return data.journals;
}

export async function confirmAccountingJournal(id: string): Promise<AccountingJournal> {
  const response = await fetch(`/api/accounting/journals/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to confirm journal');
  return data.journal;
}

export async function markAccountingJournalNeedsAdjustment(id: string): Promise<AccountingJournal> {
  const response = await fetch(`/api/accounting/journals/${encodeURIComponent(id)}/need-adjustment`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to mark journal');
  return data.journal;
}

export async function getReconciliations(query: { source?: ReconciliationSource | 'all'; status?: ReconciliationStatus | 'all' } = {}): Promise<Reconciliation[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/accounting/reconciliations${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load reconciliations');
  const data = await response.json();
  return data.reconciliations;
}

export async function createReconciliation(input: {
  source: ReconciliationSource;
  fromDate: string;
  toDate: string;
  note?: string;
  actualItems?: Array<{ paymentId?: string; orderId?: string; transactionCode?: string; actualAmount: number }>;
}): Promise<Reconciliation> {
  const response = await fetch('/api/accounting/reconciliations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to create reconciliation');
  return data.reconciliation;
}

export async function updateReconciliation(id: string, input: {
  note?: string;
  actualItems: Array<{ paymentId?: string; orderId?: string; transactionCode?: string; actualAmount: number }>;
}): Promise<Reconciliation> {
  const response = await fetch(`/api/accounting/reconciliations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to update reconciliation');
  return data.reconciliation;
}

export async function confirmReconciliation(id: string): Promise<Reconciliation> {
  const response = await fetch(`/api/accounting/reconciliations/${encodeURIComponent(id)}/confirm`, { method: 'POST', headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to confirm reconciliation');
  return data.reconciliation;
}

export async function getAdjustments(query: { status?: AdjustmentStatus | 'all' } = {}): Promise<AccountingAdjustment[]> {
  const params = new URLSearchParams();
  if (query.status && query.status !== 'all') params.set('status', query.status);
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/accounting/adjustments${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load adjustments');
  const data = await response.json();
  return data.adjustments;
}

export async function createAdjustment(input: {
  journalId: string;
  reconciliationId?: string;
  reason: string;
  newData: { lines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }> };
}): Promise<AccountingAdjustment> {
  const response = await fetch('/api/accounting/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to create adjustment');
  return data.adjustment;
}

export async function applyAdjustment(id: string): Promise<AccountingAdjustment> {
  const response = await fetch(`/api/accounting/adjustments/${encodeURIComponent(id)}/apply`, { method: 'POST', headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to apply adjustment');
  return data.adjustment;
}

export async function cancelAdjustment(id: string): Promise<AccountingAdjustment> {
  const response = await fetch(`/api/accounting/adjustments/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to cancel adjustment');
  return data.adjustment;
}

export async function getExceptions(query: { exceptionType?: ExceptionType | 'all'; status?: ExceptionStatus | 'all' } = {}): Promise<AccountingException[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const response = await fetch(`/api/accounting/exceptions${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Unable to load exceptions');
  const data = await response.json();
  return data.exceptions;
}

export async function createException(input: {
  exceptionType: ExceptionType;
  orderId?: string;
  paymentId?: string;
  inventoryIssueId?: string;
  reconciliationId?: string;
  description: string;
  amount: number;
  handlingAction?: string;
}): Promise<AccountingException> {
  const response = await fetch('/api/accounting/exceptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to create exception');
  return data.exception;
}

export async function updateException(id: string, input: { description?: string; handlingAction?: string; amount?: number }): Promise<AccountingException> {
  const response = await fetch(`/api/accounting/exceptions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to update exception');
  return data.exception;
}

export async function transitionException(id: string, action: 'start' | 'resolve' | 'cancel'): Promise<AccountingException> {
  const response = await fetch(`/api/accounting/exceptions/${encodeURIComponent(id)}/${action}`, { method: 'POST', headers: authHeaders() });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.message || 'Unable to update exception status');
  return data.exception;
}
