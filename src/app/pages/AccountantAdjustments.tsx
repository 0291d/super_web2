import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FilePenLine, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  AccountingAdjustment,
  AccountingJournal,
  applyAdjustment,
  cancelAdjustment,
  createAdjustment,
  getAccountingJournals,
  getAdjustments,
} from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

type LineDraft = { accountCode: string; accountName: string; debit: string; credit: string };

function canAccessAccounting(role?: string) {
  return role === 'accountant' || role === 'admin';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

function linesFromJournal(journal?: AccountingJournal): LineDraft[] {
  return (journal?.lines || [{ accountCode: '', accountName: '', debit: 0, credit: 0 }, { accountCode: '', accountName: '', debit: 0, credit: 0 }]).map((line) => ({
    accountCode: line.accountCode,
    accountName: line.accountName,
    debit: String(line.debit || ''),
    credit: String(line.credit || ''),
  }));
}

export function AccountantAdjustments() {
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [adjustments, setAdjustments] = useState<AccountingAdjustment[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadData() {
    setIsLoading(true);
    try {
      const [journalData, adjustmentData] = await Promise.all([
        getAccountingJournals({ status: 'need_adjustment' }),
        getAdjustments(),
      ]);
      setJournals(journalData);
      setAdjustments(adjustmentData);
      if (!selectedJournalId && journalData[0]) setSelectedJournalId(journalData[0].id);
    } catch {
      toast.error('Unable to load adjustment data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessAccounting(user.role)) return navigate('/');
    loadData();
  }, [isAuthLoading, location.pathname, navigate, user]);

  const selectedJournal = useMemo(() => journals.find((journal) => journal.id === selectedJournalId) || journals[0], [journals, selectedJournalId]);

  useEffect(() => {
    setLines(linesFromJournal(selectedJournal));
  }, [selectedJournal?.id]);

  const totals = useMemo(() => lines.reduce((sum, line) => ({
    debit: sum.debit + Number(line.debit || 0),
    credit: sum.credit + Number(line.credit || 0),
  }), { debit: 0, credit: 0 }), [lines]);

  function updateLine(index: number, key: keyof LineDraft, value: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  }

  async function submitAdjustment() {
    if (!selectedJournal) return;
    try {
      const adjustment = await createAdjustment({
        journalId: selectedJournal.id,
        reason,
        newData: {
          lines: lines.map((line) => ({
            accountCode: line.accountCode.trim(),
            accountName: line.accountName.trim(),
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
          })),
        },
      });
      setAdjustments((current) => [adjustment, ...current]);
      setReason('');
      toast.success('Adjustment created with old and new data snapshots');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create adjustment');
    }
  }

  async function apply(id: string) {
    try {
      const adjustment = await applyAdjustment(id);
      setAdjustments((current) => current.map((item) => item.id === id ? adjustment : item));
      await loadData();
      toast.success('Adjustment applied; original journal marked adjusted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to apply adjustment');
    }
  }

  async function cancel(id: string) {
    try {
      const adjustment = await cancelAdjustment(id);
      setAdjustments((current) => current.map((item) => item.id === id ? adjustment : item));
      toast.success('Adjustment cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel adjustment');
    }
  }

  if (isAuthLoading || !user || !canAccessAccounting(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking accounting access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Accountant</p>
          <h1 className="font-serif text-4xl">Accounting Adjustments</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_480px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-6">
              <h2 className="font-serif text-2xl">Journals Needing Adjustment</h2>
              <p className="mt-1 text-sm text-[#737373]">Original journal data remains read-only; adjustment creates a separate audit record.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4">Journal</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Debit</th><th className="px-6 py-4 text-right">Credit</th><th className="px-6 py-4">Created</th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-[#737373]">Loading...</td></tr> : journals.map((journal) => (
                    <tr key={journal.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4"><button onClick={() => setSelectedJournalId(journal.id)} className="text-left"><p className="font-medium">{journal.journalNumber}</p><p className="text-[#737373]">{journal.journalType}</p></button></td>
                      <td className="px-6 py-4 text-[#737373]">{journal.description}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(journal.totals.debit)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(journal.totals.credit)}</td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(journal.createdAt)}</td>
                    </tr>
                  ))}
                  {!isLoading && !journals.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-[#737373]">No journals currently require adjustment.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="h-fit border border-[#EAE7E0] bg-white p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl">New Adjustment</h2><FilePenLine className="h-5 w-5 text-[#9E9B94]" /></div>
            {selectedJournal ? (
              <>
                <p className="text-sm font-medium">{selectedJournal.journalNumber}</p>
                <div className="mt-4 space-y-3">
                  {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 border border-[#EAE7E0] p-3">
                      <input value={line.accountCode} onChange={(event) => updateLine(index, 'accountCode', event.target.value)} placeholder="Account code" className="border border-[#EAE7E0] px-3 py-2 text-sm" />
                      <input value={line.accountName} onChange={(event) => updateLine(index, 'accountName', event.target.value)} placeholder="Account name" className="border border-[#EAE7E0] px-3 py-2 text-sm" />
                      <input value={line.debit} onChange={(event) => updateLine(index, 'debit', event.target.value)} type="number" min="0" placeholder="Debit" className="border border-[#EAE7E0] px-3 py-2 text-right text-sm" />
                      <input value={line.credit} onChange={(event) => updateLine(index, 'credit', event.target.value)} type="number" min="0" placeholder="Credit" className="border border-[#EAE7E0] px-3 py-2 text-right text-sm" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setLines((current) => [...current, { accountCode: '', accountName: '', debit: '', credit: '' }])} className="mt-3 flex items-center gap-2 text-sm uppercase tracking-widest underline"><Plus className="h-4 w-4" />Line</button>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Debit</p><p className="mt-1">{formatMoney(totals.debit)}</p></div>
                  <div className="border border-[#EAE7E0] p-3"><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Credit</p><p className="mt-1">{formatMoney(totals.credit)}</p></div>
                </div>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Adjustment reason" className="mt-4 min-h-28 w-full border border-[#EAE7E0] p-3 text-sm" />
                <button onClick={submitAdjustment} disabled={user.role !== 'accountant'} className="mt-4 w-full bg-[#2D2D2D] px-4 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-40">Create adjustment</button>
              </>
            ) : <p className="text-sm text-[#737373]">Select a journal to prepare an adjustment.</p>}
          </aside>
        </div>

        <section className="mt-8 border border-[#EAE7E0] bg-white">
          <div className="border-b border-[#EAE7E0] p-6"><h2 className="font-serif text-2xl">Adjustment History</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4">Adjustment</th><th className="px-6 py-4">Journal</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Created</th><th className="px-6 py-4"></th></tr></thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="border-b border-[#EAE7E0] last:border-b-0">
                    <td className="px-6 py-4 font-medium">{adjustment.adjustmentNumber}</td>
                    <td className="px-6 py-4 text-[#737373]">{adjustment.journal?.journalNumber || adjustment.journalId}</td>
                    <td className="px-6 py-4 text-[#737373]">{adjustment.reason}</td>
                    <td className="px-6 py-4"><span className="border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{adjustment.status}</span></td>
                    <td className="px-6 py-4 text-[#737373]">{formatDate(adjustment.createdAt)}</td>
                    <td className="px-6 py-4 text-right"><button disabled={adjustment.status !== 'pending'} onClick={() => apply(adjustment.id)} className="mr-4 text-xs uppercase tracking-widest underline disabled:opacity-30">Apply</button><button disabled={adjustment.status !== 'pending'} onClick={() => cancel(adjustment.id)} className="text-xs uppercase tracking-widest underline disabled:opacity-30">Cancel</button></td>
                  </tr>
                ))}
                {!adjustments.length && <tr><td colSpan={6} className="px-6 py-10 text-center text-[#737373]">No adjustments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
