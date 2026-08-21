import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Calculator, SearchCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  confirmReconciliation,
  createException,
  createReconciliation,
  getReconciliations,
  Reconciliation,
  ReconciliationSource,
  updateReconciliation,
} from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

const sources: ReconciliationSource[] = ['VNPAY', 'COD', 'BANK'];

function canAccessAccounting(role?: string) {
  return role === 'accountant' || role === 'admin';
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return 'Manual';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function AccountantReconciliations() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [source, setSource] = useState<ReconciliationSource>('VNPAY');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [actualByPayment, setActualByPayment] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadReconciliations() {
    setIsLoading(true);
    try {
      const data = await getReconciliations();
      setReconciliations(data);
      if (selectedId && !data.some((item) => item.id === selectedId)) setSelectedId('');
    } catch {
      toast.error('Unable to load reconciliations');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessAccounting(user.role)) return navigate('/');
    loadReconciliations();
  }, [isAuthLoading, location.pathname, navigate, user]);

  const selected = useMemo(() => reconciliations.find((item) => item.id === selectedId) || reconciliations[0], [reconciliations, selectedId]);
  const metrics = useMemo(() => ({
    total: reconciliations.length,
    pending: reconciliations.filter((item) => item.status === 'pending').length,
    matched: reconciliations.filter((item) => item.status === 'matched').length,
    difference: reconciliations.filter((item) => item.status === 'difference').length,
  }), [reconciliations]);

  useEffect(() => {
    if (!selected) return;
    const next: Record<string, string> = {};
    selected.items.forEach((item) => {
      next[item.paymentId] = item.actualAmount === null ? '' : String(item.actualAmount);
    });
    setActualByPayment(next);
  }, [selected?.id]);

  async function createSession() {
    try {
      const reconciliation = await createReconciliation({ source, fromDate, toDate });
      setReconciliations((current) => [reconciliation, ...current]);
      setSelectedId(reconciliation.id);
      toast.success('Reconciliation session created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create reconciliation');
    }
  }

  async function saveActuals() {
    if (!selected) return;
    try {
      const actualItems = selected.items
        .filter((item) => actualByPayment[item.paymentId] !== '')
        .map((item) => ({
          paymentId: item.paymentId,
          orderId: item.orderId,
          transactionCode: item.transactionCode,
          actualAmount: Number(actualByPayment[item.paymentId]),
        }));
      const updated = await updateReconciliation(selected.id, { actualItems });
      setReconciliations((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success('Actual data reconciled by backend');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update reconciliation');
    }
  }

  async function confirmSelected() {
    if (!selected) return;
    try {
      const updated = await confirmReconciliation(selected.id);
      setReconciliations((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success('Reconciliation confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm reconciliation');
    }
  }

  async function createExceptionForItem(item: Reconciliation['items'][number]) {
    if (!selected) return;
    const type = item.result === 'difference' && item.difference < 0 ? 'UNDERPAYMENT' : item.result === 'difference' && item.difference > 0 ? 'OVERPAYMENT' : 'RECONCILIATION_DIFFERENCE';
    try {
      await createException({
        exceptionType: type,
        orderId: item.orderId,
        paymentId: item.paymentId,
        reconciliationId: selected.id,
        amount: Math.abs(item.difference || item.systemAmount),
        description: `Reconciliation ${selected.reconciliationNumber} item ${item.transactionCode || item.paymentId}`,
      });
      toast.success('Exception created for discrepancy');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create exception');
    }
  }

  if (isAuthLoading || !user || !canAccessAccounting(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking accounting access...</div>;
  }

  const canAct = user.role === 'accountant' && selected && !selected.confirmedAt;

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Accountant</p>
          <h1 className="font-serif text-4xl">Data Reconciliation</h1>
        </div>

        <section className="border border-[#EAE7E0] bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_180px_180px_auto] md:items-end">
            <label className="text-sm">Source<select value={source} onChange={(event) => setSource(event.target.value as ReconciliationSource)} className="mt-2 w-full border border-[#EAE7E0] bg-white px-3 py-3">{sources.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm">From<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-2 w-full border border-[#EAE7E0] px-3 py-3" /></label>
            <label className="text-sm">To<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-2 w-full border border-[#EAE7E0] px-3 py-3" /></label>
            <button onClick={createSession} disabled={user.role !== 'accountant'} className="bg-[#2D2D2D] px-5 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-40">Create session</button>
          </div>
          <p className="mt-3 text-sm text-[#737373]">Actual amounts are entered manually here; the backend calculates system amount, difference, and final result.</p>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[{ label: 'Sessions', value: metrics.total }, { label: 'Pending', value: metrics.pending }, { label: 'Matched', value: metrics.matched }, { label: 'Difference', value: metrics.difference }].map((item) => (
            <div key={item.label} className="border border-[#EAE7E0] bg-white p-5"><div className="mb-4 flex items-center justify-between text-[#9E9B94]"><span className="text-xs uppercase tracking-widest">{item.label}</span><SearchCheck className="h-5 w-5" /></div><p className="font-serif text-3xl">{item.value}</p></div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
          <aside className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-5"><h2 className="font-serif text-2xl">Sessions</h2></div>
            <div className="max-h-[720px] overflow-y-auto">
              {isLoading ? <p className="p-6 text-sm text-[#737373]">Loading...</p> : reconciliations.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full border-b border-[#EAE7E0] p-5 text-left text-sm ${selected?.id === item.id ? 'bg-[#F9F8F6]' : 'bg-white'}`}>
                  <p className="font-medium">{item.reconciliationNumber}</p>
                  <p className="mt-1 text-[#737373]">{item.source} · {item.status}</p>
                  <p className="mt-1 text-xs text-[#9E9B94]">{formatDate(item.createdAt)}</p>
                </button>
              ))}
              {!isLoading && !reconciliations.length && <p className="p-6 text-sm text-[#737373]">No reconciliation sessions yet.</p>}
            </div>
          </aside>

          <section className="border border-[#EAE7E0] bg-white">
            {selected ? (
              <>
                <div className="flex flex-col gap-3 border-b border-[#EAE7E0] p-6 md:flex-row md:items-center md:justify-between">
                  <div><p className="text-xs uppercase tracking-widest text-[#9E9B94]">{selected.source}</p><h2 className="font-serif text-2xl">{selected.reconciliationNumber}</h2><p className="mt-1 text-sm text-[#737373]">{formatDate(selected.fromDate)} - {formatDate(selected.toDate)}</p></div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={saveActuals} disabled={!canAct} className="border border-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest disabled:opacity-40">Compare</button>
                    <button onClick={confirmSelected} disabled={!canAct} className="bg-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-40">Confirm</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4">Transaction</th><th className="px-6 py-4">Order</th><th className="px-6 py-4 text-right">System</th><th className="px-6 py-4">Actual</th><th className="px-6 py-4 text-right">Difference</th><th className="px-6 py-4">Result</th><th className="px-6 py-4"></th></tr></thead>
                    <tbody>
                      {selected.items.map((item) => (
                        <tr key={item.paymentId} className="border-b border-[#EAE7E0] last:border-b-0">
                          <td className="px-6 py-4 font-mono text-xs">{item.transactionCode || item.paymentId}</td>
                          <td className="px-6 py-4 text-[#737373]">{item.order?.orderNumber || item.orderId || 'Not linked'}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatMoney(item.systemAmount)}</td>
                          <td className="px-6 py-4"><input disabled={!canAct} type="number" min="0" value={actualByPayment[item.paymentId] ?? ''} onChange={(event) => setActualByPayment((current) => ({ ...current, [item.paymentId]: event.target.value }))} className="w-36 border border-[#EAE7E0] px-3 py-2 text-right disabled:bg-[#F9F8F6]" /></td>
                          <td className="px-6 py-4 text-right font-medium">{formatMoney(item.difference)}</td>
                          <td className="px-6 py-4"><span className="border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{item.result}</span></td>
                          <td className="px-6 py-4 text-right"><button disabled={item.result === 'matched'} onClick={() => createExceptionForItem(item)} className="text-xs uppercase tracking-widest text-[#2D2D2D] underline disabled:opacity-30">Exception</button></td>
                        </tr>
                      ))}
                      {!selected.items.length && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#737373]">No paid payments found for this source and period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <div className="p-10 text-center text-sm text-[#737373]"><Calculator className="mx-auto mb-3 h-6 w-6" />Create or select a reconciliation session.</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
