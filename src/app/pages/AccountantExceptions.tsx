import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AlertTriangle, CircleCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  AccountingException,
  createException,
  ExceptionStatus,
  ExceptionType,
  getExceptions,
  transitionException,
  updateException,
} from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

const exceptionTypes: ExceptionType[] = ['RETURN', 'REFUND', 'UNDERPAYMENT', 'OVERPAYMENT', 'CANCEL_AFTER_EXPORT', 'RECONCILIATION_DIFFERENCE'];
const statuses: Array<ExceptionStatus | 'all'> = ['all', 'pending', 'processing', 'resolved', 'cancelled'];

function canAccessAccounting(role?: string) {
  return role === 'accountant' || role === 'admin';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function AccountantExceptions() {
  const [exceptions, setExceptions] = useState<AccountingException[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all');
  const [type, setType] = useState<ExceptionType>('REFUND');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [handlingAction, setHandlingAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadExceptions() {
    setIsLoading(true);
    try {
      const data = await getExceptions({ status: statusFilter });
      setExceptions(data);
      if (selectedId && !data.some((item) => item.id === selectedId)) setSelectedId('');
    } catch {
      toast.error('Unable to load accounting exceptions');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessAccounting(user.role)) return navigate('/');
    loadExceptions();
  }, [isAuthLoading, location.pathname, navigate, statusFilter, user]);

  const selected = useMemo(() => exceptions.find((item) => item.id === selectedId) || exceptions[0], [exceptions, selectedId]);
  const metrics = useMemo(() => ({
    open: exceptions.filter((item) => item.status === 'pending' || item.status === 'processing').length,
    resolved: exceptions.filter((item) => item.status === 'resolved').length,
    amount: exceptions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  }), [exceptions]);

  useEffect(() => {
    if (!selected) return;
    setHandlingAction(selected.handlingAction || '');
  }, [selected?.id]);

  async function submitException() {
    try {
      const exception = await createException({
        exceptionType: type,
        amount: Number(amount || 0),
        description,
        handlingAction,
      });
      setExceptions((current) => [exception, ...current]);
      setSelectedId(exception.id);
      setAmount('');
      setDescription('');
      toast.success('Exception created for accountant workflow');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create exception');
    }
  }

  async function saveHandling() {
    if (!selected) return;
    try {
      const updated = await updateException(selected.id, { handlingAction });
      setExceptions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success('Handling action saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update exception');
    }
  }

  async function transition(id: string, action: 'start' | 'resolve' | 'cancel') {
    try {
      const updated = await transitionException(id, action);
      setExceptions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(action === 'resolve' ? 'Exception resolved' : 'Exception updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update exception');
    }
  }

  if (isAuthLoading || !user || !canAccessAccounting(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking accounting access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Accountant</p>
            <h1 className="font-serif text-4xl">Exception Handling</h1>
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ExceptionStatus | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-3 text-sm">
            {statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[{ label: 'Open', value: metrics.open }, { label: 'Resolved', value: metrics.resolved }, { label: 'Tracked Amount', value: formatMoney(metrics.amount) }].map((item) => (
            <div key={item.label} className="border border-[#EAE7E0] bg-white p-5"><div className="mb-4 flex items-center justify-between text-[#9E9B94]"><span className="text-xs uppercase tracking-widest">{item.label}</span><AlertTriangle className="h-5 w-5" /></div><p className="font-serif text-3xl">{item.value}</p></div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_460px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-6"><h2 className="font-serif text-2xl">Exceptions</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4">Exception</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Order</th><th className="px-6 py-4">Payment</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Created</th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan={7} className="px-6 py-10 text-center text-[#737373]">Loading...</td></tr> : exceptions.map((item) => (
                    <tr key={item.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4"><button onClick={() => setSelectedId(item.id)} className="text-left"><p className="font-medium">{item.exceptionNumber}</p><p className="text-[#737373]">{item.description}</p></button></td>
                      <td className="px-6 py-4">{item.exceptionType}</td>
                      <td className="px-6 py-4 text-[#737373]">{item.order?.orderNumber || item.orderId || 'Not linked'}</td>
                      <td className="px-6 py-4 text-[#737373]">{item.payment?.paymentNumber || item.paymentId || 'Not linked'}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(item.amount)}</td>
                      <td className="px-6 py-4"><span className="border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{item.status}</span></td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {!isLoading && !exceptions.length && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#737373]">No exceptions match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="border border-[#EAE7E0] bg-white p-6">
              <h2 className="font-serif text-2xl">Create Exception</h2>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <select value={type} onChange={(event) => setType(event.target.value as ExceptionType)} className="border border-[#EAE7E0] bg-white px-3 py-3 text-sm">{exceptionTypes.map((item) => <option key={item}>{item}</option>)}</select>
                <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="border border-[#EAE7E0] px-3 py-3 text-sm" />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="min-h-24 border border-[#EAE7E0] p-3 text-sm" />
                <textarea value={handlingAction} onChange={(event) => setHandlingAction(event.target.value)} placeholder="Handling action" className="min-h-24 border border-[#EAE7E0] p-3 text-sm" />
                <button onClick={submitException} disabled={user.role !== 'accountant'} className="bg-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-40">Create</button>
              </div>
              {type === 'REFUND' && <p className="mt-3 text-sm text-[#737373]">This records internal refund handling only. It does not mark a payment refunded by itself.</p>}
            </section>

            <section className="border border-[#EAE7E0] bg-white p-6">
              {selected ? (
                <>
                  <div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-[#9E9B94]">{selected.exceptionType}</p><h2 className="font-serif text-2xl">{selected.exceptionNumber}</h2></div><CircleCheck className="h-5 w-5 text-[#9E9B94]" /></div>
                  <p className="text-sm text-[#737373]">{selected.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Amount</p><p className="mt-1">{formatMoney(selected.amount)}</p></div>
                    <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Status</p><p className="mt-1">{selected.status}</p></div>
                  </div>
                  <textarea value={handlingAction} onChange={(event) => setHandlingAction(event.target.value)} className="mt-4 min-h-28 w-full border border-[#EAE7E0] p-3 text-sm" />
                  <button onClick={saveHandling} disabled={!['pending', 'processing'].includes(selected.status)} className="mt-3 w-full border border-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest disabled:opacity-40">Save handling</button>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => transition(selected.id, 'start')} disabled={selected.status !== 'pending'} className="border border-[#EAE7E0] px-3 py-3 text-xs uppercase tracking-widest disabled:opacity-40">Start</button>
                    <button onClick={() => transition(selected.id, 'resolve')} disabled={!['pending', 'processing'].includes(selected.status)} className="bg-[#2D2D2D] px-3 py-3 text-xs uppercase tracking-widest text-white disabled:opacity-40">Resolve</button>
                    <button onClick={() => transition(selected.id, 'cancel')} disabled={!['pending', 'processing'].includes(selected.status)} className="border border-[#EAE7E0] px-3 py-3 text-xs uppercase tracking-widest disabled:opacity-40">Cancel</button>
                  </div>
                  {selected.journals?.length ? <div className="mt-4 text-sm text-[#737373]">{selected.journals.map((journal) => <p key={journal.journalNumber}>{journal.journalNumber} · {journal.journalType} · {journal.status}</p>)}</div> : null}
                </>
              ) : <p className="text-sm text-[#737373]">Select an exception to process.</p>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
