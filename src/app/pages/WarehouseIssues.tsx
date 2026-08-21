import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ClipboardList, PackageCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelWarehouseIssue,
  confirmWarehouseIssue,
  getWarehouseIssues,
  getWarehouseOrders,
  saveWarehouseIssue,
  WarehouseIssue,
  WarehouseOrder,
} from '../api/warehouse';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

function canAccessWarehouse(role?: string) {
  return role === 'warehouse' || role === 'admin';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function WarehouseIssues() {
  const [issues, setIssues] = useState<WarehouseIssue[]>([]);
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadData() {
    setIsLoading(true);
    try {
      const [issueData, orderData] = await Promise.all([getWarehouseIssues({ search }), getWarehouseOrders()]);
      setIssues(issueData);
      setOrders(orderData);
    } catch {
      toast.error('Unable to load inventory issues');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessWarehouse(user.role)) return navigate('/');
    loadData();
  }, [isAuthLoading, location.pathname, navigate, search, user]);

  const selectedIssue = useMemo(() => issues.find((issue) => issue.id === selectedId), [issues, selectedId]);
  const metrics = useMemo(() => ({
    total: issues.length,
    draft: issues.filter((issue) => issue.status === 'draft').length,
    confirmed: issues.filter((issue) => issue.status === 'confirmed').length,
    cost: issues.reduce((sum, issue) => sum + Number(issue.totalCost || 0), 0),
  }), [issues]);

  function newIssue() {
    setSelectedId('');
    setOrderId('');
    setIssueDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }

  function selectIssue(issue: WarehouseIssue) {
    setSelectedId(issue.id);
    setOrderId(issue.orderId || '');
    setIssueDate(issue.issueDate.slice(0, 10));
    setNote(issue.note || '');
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = await saveWarehouseIssue({ id: selectedIssue?.id, orderId, issueDate, items: selectedIssue?.items, note });
      toast.success(selectedIssue ? 'Issue updated' : 'Issue draft created');
      await loadData();
      selectIssue(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save issue');
    }
  }

  async function handleConfirm(issue: WarehouseIssue) {
    if (!window.confirm(`Confirm ${issue.issueNumber}?`)) return;
    try {
      const confirmed = await confirmWarehouseIssue(issue.id);
      toast.success('Issue confirmed with FIFO allocations');
      await loadData();
      selectIssue(confirmed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm issue');
    }
  }

  async function handleCancel(issue: WarehouseIssue) {
    if (!window.confirm(`Cancel ${issue.issueNumber}?`)) return;
    try {
      const cancelled = await cancelWarehouseIssue(issue.id);
      toast.success('Issue cancelled');
      await loadData();
      selectIssue(cancelled);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel issue');
    }
  }

  if (isAuthLoading || !user || !canAccessWarehouse(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking warehouse access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Warehouse</p>
            <h1 className="font-serif text-4xl">Inventory Issues</h1>
          </div>
          <button onClick={newIssue} className="w-fit bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">New Issue</button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Issues', value: String(metrics.total), icon: ClipboardList },
            { label: 'Draft', value: String(metrics.draft), icon: ClipboardList },
            { label: 'Confirmed', value: String(metrics.confirmed), icon: PackageCheck },
            { label: 'COGS', value: formatMoney(metrics.cost), icon: PackageCheck },
          ].map((item) => {
            const Icon = item.icon;
            return <div key={item.label} className="border border-[#EAE7E0] bg-white p-6"><div className="mb-5 flex items-center justify-between text-[#9E9B94]"><span className="text-xs uppercase tracking-widest">{item.label}</span><Icon className="h-5 w-5" /></div><p className="font-serif text-3xl">{item.value}</p></div>;
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_460px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
              <div><h2 className="font-serif text-2xl">Issue List</h2><p className="mt-1 text-sm text-[#737373]">{issues.length} issues shown</p></div>
              <label className="relative block w-full md:max-w-sm"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issue number" className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]" /></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4 font-medium">Issue</th><th className="px-6 py-4 font-medium">Order</th><th className="px-6 py-4 font-medium">Date</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 text-right font-medium">Cost</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan={6} className="px-6 py-10 text-center text-[#737373]">Loading issues...</td></tr> : issues.map((issue) => (
                    <tr key={issue.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4"><button type="button" onClick={() => selectIssue(issue)} className="text-left"><p className="font-medium">{issue.issueNumber}</p><p className="mt-1 text-[#737373]">{issue.items.length} line items</p></button></td>
                      <td className="px-6 py-4 font-mono text-xs">{issue.orderId || 'Not set'}</td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(issue.issueDate)}</td>
                      <td className="px-6 py-4"><span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{issue.status}</span></td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(issue.totalCost)}</td>
                      <td className="px-6 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => selectIssue(issue)} className="border border-[#EAE7E0] px-3 py-2">View</button><button type="button" disabled={issue.status !== 'draft'} onClick={() => handleConfirm(issue)} className="border border-[#EAE7E0] px-3 py-2 disabled:opacity-40">Confirm</button><button type="button" disabled={issue.status !== 'draft'} onClick={() => handleCancel(issue)} className="border border-[#EAE7E0] px-3 py-2 text-[#9F2A2A] disabled:opacity-40">Cancel</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={handleSave} className="h-fit border border-[#EAE7E0] bg-white p-6">
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">{selectedIssue ? selectedIssue.issueNumber : 'Draft'}</p>
            <h2 className="mt-1 font-serif text-2xl">{selectedIssue ? 'Issue Detail' : 'New Issue From Order'}</h2>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Order</span><select value={orderId} disabled={Boolean(selectedIssue)} onChange={(event) => setOrderId(event.target.value)} className="w-full border border-[#EAE7E0] bg-white px-3 py-2 disabled:bg-[#F9F8F6]" required><option value="">Choose reserved order</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} - {order.email}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Issue Date</span><input type="date" disabled={selectedIssue?.status !== undefined && selectedIssue.status !== 'draft'} value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" /></label>
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Note</span><textarea disabled={selectedIssue?.status !== undefined && selectedIssue.status !== 'draft'} value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" /></label>
              {selectedIssue && <div className="space-y-3 border-t border-[#EAE7E0] pt-4">{selectedIssue.items.map((item) => <div key={item.productId} className="border border-[#EAE7E0] p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{item.productId}</span><span>{item.quantity} units</span></div><p className="mt-1 text-[#737373]">Cost {formatMoney(item.cost)}</p>{item.fifoAllocations?.map((allocation) => <p key={`${allocation.batchId}-${allocation.quantity}`} className="mt-1 font-mono text-xs text-[#737373]">{allocation.batchId}: {allocation.quantity} x {formatMoney(allocation.unitCost)}</p>)}</div>)}</div>}
            </div>
            <button disabled={selectedIssue?.status !== undefined && selectedIssue.status !== 'draft'} type="submit" className="mt-6 w-full bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50">{selectedIssue ? 'Save Draft' : 'Create Draft'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
