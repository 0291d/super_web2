import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BookCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  AccountingJournal,
  confirmAccountingJournal,
  getAccountingJournals,
  JournalStatus,
  JournalType,
  markAccountingJournalNeedsAdjustment,
} from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

const journalTypes: Array<JournalType | 'all'> = ['all', 'REVENUE', 'COGS', 'TAX', 'ADJUSTMENT', 'REFUND'];
const statuses: Array<JournalStatus | 'all'> = ['all', 'auto', 'confirmed', 'need_adjustment', 'adjusted'];

function canAccessAccounting(role?: string) {
  return role === 'accountant' || role === 'admin';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function AccountantJournals() {
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [journalType, setJournalType] = useState<JournalType | 'all'>('all');
  const [status, setStatus] = useState<JournalStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadJournals() {
    setIsLoading(true);
    try {
      const data = await getAccountingJournals({ search, journalType, status });
      setJournals(data);
      if (selectedId && !data.some((journal) => journal.id === selectedId)) setSelectedId('');
    } catch {
      toast.error('Unable to load accounting journals');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessAccounting(user.role)) return navigate('/');
    loadJournals();
  }, [isAuthLoading, journalType, location.pathname, navigate, search, status, user]);

  const selectedJournal = useMemo(() => journals.find((journal) => journal.id === selectedId) || journals[0], [journals, selectedId]);
  const metrics = useMemo(() => ({
    total: journals.length,
    auto: journals.filter((journal) => journal.status === 'auto').length,
    confirmed: journals.filter((journal) => journal.status === 'confirmed').length,
    needAdjustment: journals.filter((journal) => journal.status === 'need_adjustment').length,
  }), [journals]);

  async function updateJournal(action: 'confirm' | 'adjustment') {
    if (!selectedJournal) return;
    try {
      const updated = action === 'confirm'
        ? await confirmAccountingJournal(selectedJournal.id)
        : await markAccountingJournalNeedsAdjustment(selectedJournal.id);
      setJournals((current) => current.map((journal) => journal.id === updated.id ? updated : journal));
      setSelectedId(updated.id);
      toast.success(action === 'confirm' ? 'Journal confirmed' : 'Journal marked for adjustment');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update journal');
    }
  }

  if (isAuthLoading || !user || !canAccessAccounting(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking accounting access...</div>;
  }

  const canAct = user.role === 'accountant' && selectedJournal?.status === 'auto';

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Accountant</p>
            <h1 className="font-serif text-4xl">Journal Review</h1>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search journal number" className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]" />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Journals', value: metrics.total },
            { label: 'Auto', value: metrics.auto },
            { label: 'Confirmed', value: metrics.confirmed },
            { label: 'Need Adjustment', value: metrics.needAdjustment },
          ].map((item) => (
            <div key={item.label} className="border border-[#EAE7E0] bg-white p-6">
              <div className="mb-5 flex items-center justify-between text-[#9E9B94]">
                <span className="text-xs uppercase tracking-widest">{item.label}</span>
                <BookCheck className="h-5 w-5" />
              </div>
              <p className="font-serif text-3xl">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_520px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-serif text-2xl">Journals</h2>
                <p className="mt-1 text-sm text-[#737373]">{journals.length} journals shown</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={journalType} onChange={(event) => setJournalType(event.target.value as JournalType | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm">
                  {journalTypes.map((item) => <option key={item} value={item}>{item === 'all' ? 'All types' : item}</option>)}
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value as JournalStatus | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm">
                  {statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Journal</th>
                    <th className="px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 text-right font-medium">Debit</th>
                    <th className="px-6 py-4 text-right font-medium">Credit</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-[#737373]">Loading journals...</td></tr>
                  ) : journals.map((journal) => (
                    <tr key={journal.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => setSelectedId(journal.id)} className="text-left">
                          <p className="font-medium">{journal.journalNumber}</p>
                          <p className="mt-1 text-[#737373]">{journal.journalType}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[#737373]">{journal.order?.orderNumber || 'Not linked'}</td>
                      <td className="px-6 py-4 text-[#737373]">{journal.description}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(journal.totals.debit)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(journal.totals.credit)}</td>
                      <td className="px-6 py-4"><span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{journal.status}</span></td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(journal.createdAt)}</td>
                    </tr>
                  ))}
                  {!isLoading && !journals.length && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#737373]">No journals match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="h-fit border border-[#EAE7E0] bg-white p-6">
            {selectedJournal ? (
              <>
                <p className="text-xs uppercase tracking-widest text-[#9E9B94]">{selectedJournal.journalType}</p>
                <h2 className="mt-1 font-serif text-2xl">{selectedJournal.journalNumber}</h2>
                <p className="mt-2 text-sm text-[#737373]">{selectedJournal.description}</p>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Order</p><p className="mt-1">{selectedJournal.order?.orderNumber || 'Not linked'}</p></div>
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Status</p><p className="mt-1">{selectedJournal.status}</p></div>
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Debit</p><p className="mt-1">{formatMoney(selectedJournal.totals.debit)}</p></div>
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Credit</p><p className="mt-1">{formatMoney(selectedJournal.totals.credit)}</p></div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="py-3 pr-3 font-medium">Account</th><th className="py-3 text-right font-medium">Debit</th><th className="py-3 text-right font-medium">Credit</th></tr></thead>
                    <tbody>
                      {selectedJournal.lines.map((line) => (
                        <tr key={`${line.accountCode}-${line.debit}-${line.credit}`} className="border-b border-[#EAE7E0] last:border-b-0">
                          <td className="py-3 pr-3"><p className="font-medium">{line.accountCode}</p><p className="text-[#737373]">{line.accountName}</p></td>
                          <td className="py-3 text-right">{formatMoney(line.debit)}</td>
                          <td className="py-3 text-right">{formatMoney(line.credit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedJournal.status === 'need_adjustment' && <p className="mt-4 border border-[#EAE7E0] bg-[#F9F8F6] p-3 text-sm text-[#737373]">Waiting for Sprint 5 adjustment workflow.</p>}

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button disabled={!canAct} onClick={() => updateJournal('confirm')} className="bg-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-40">Confirm</button>
                  <button disabled={!canAct} onClick={() => updateJournal('adjustment')} className="border border-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white disabled:opacity-40">Need Adjustment</button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-[#737373]">Select a journal to review.</div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
