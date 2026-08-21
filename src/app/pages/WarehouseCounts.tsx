import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ClipboardCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelWarehouseCount,
  confirmWarehouseCount,
  getWarehouseCounts,
  getWarehouseInventory,
  InventoryProduct,
  saveWarehouseCount,
  WarehouseCount,
} from '../api/warehouse';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

function canAccessWarehouse(role?: string) {
  return role === 'warehouse' || role === 'admin';
}

const emptyItem = { productId: '', actualQuantity: 0 };

export function WarehouseCounts() {
  const [counts, setCounts] = useState<WarehouseCount[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadData() {
    setIsLoading(true);
    try {
      const [countData, inventoryData] = await Promise.all([getWarehouseCounts({ search }), getWarehouseInventory()]);
      setCounts(countData);
      setProducts(inventoryData.products);
    } catch {
      toast.error('Unable to load inventory counts');
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

  const selectedCount = useMemo(() => counts.find((count) => count.id === selectedId), [counts, selectedId]);
  const metrics = useMemo(() => ({
    total: counts.length,
    draft: counts.filter((count) => count.status === 'draft').length,
    confirmed: counts.filter((count) => count.status === 'confirmed').length,
  }), [counts]);

  function productStock(productId: string) {
    return products.find((product) => product.productId === productId)?.stock || 0;
  }

  function newCount() {
    setSelectedId('');
    setCountDate(new Date().toISOString().slice(0, 10));
    setItems([{ ...emptyItem }]);
    setNote('');
  }

  function selectCount(count: WarehouseCount) {
    setSelectedId(count.id);
    setCountDate(count.countDate.slice(0, 10));
    setItems(count.items.map((item) => ({ productId: item.productId, actualQuantity: item.actualQuantity })));
    setNote(count.note || '');
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = await saveWarehouseCount({ id: selectedCount?.id, countDate, items, note });
      toast.success(selectedCount ? 'Count updated' : 'Count draft created');
      await loadData();
      selectCount(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save count');
    }
  }

  async function handleConfirm(count: WarehouseCount) {
    if (!window.confirm(`Confirm ${count.countNumber}?`)) return;
    try {
      const confirmed = await confirmWarehouseCount(count.id);
      toast.success('Count confirmed');
      await loadData();
      selectCount(confirmed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm count');
    }
  }

  async function handleCancel(count: WarehouseCount) {
    if (!window.confirm(`Cancel ${count.countNumber}?`)) return;
    try {
      const cancelled = await cancelWarehouseCount(count.id);
      toast.success('Count cancelled');
      await loadData();
      selectCount(cancelled);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel count');
    }
  }

  if (isAuthLoading || !user || !canAccessWarehouse(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking warehouse access...</div>;
  }

  const formDisabled = selectedCount?.status !== undefined && selectedCount.status !== 'draft';

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Warehouse</p><h1 className="font-serif text-4xl">Inventory Counts</h1></div>
          <button onClick={newCount} className="w-fit bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">New Count</button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[{ label: 'Counts', value: metrics.total }, { label: 'Draft', value: metrics.draft }, { label: 'Confirmed', value: metrics.confirmed }].map((item) => (
            <div key={item.label} className="border border-[#EAE7E0] bg-white p-6"><div className="mb-5 flex items-center justify-between text-[#9E9B94]"><span className="text-xs uppercase tracking-widest">{item.label}</span><ClipboardCheck className="h-5 w-5" /></div><p className="font-serif text-3xl">{item.value}</p></div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_460px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
              <div><h2 className="font-serif text-2xl">Count List</h2><p className="mt-1 text-sm text-[#737373]">{counts.length} counts shown</p></div>
              <label className="relative block w-full md:max-w-sm"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search count number" className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]" /></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4 font-medium">Count</th><th className="px-6 py-4 font-medium">Date</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Items</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-[#737373]">Loading counts...</td></tr> : counts.map((count) => (
                    <tr key={count.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4"><button type="button" onClick={() => selectCount(count)} className="font-medium">{count.countNumber}</button></td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(count.countDate)}</td>
                      <td className="px-6 py-4"><span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{count.status}</span></td>
                      <td className="px-6 py-4">{count.items.length}</td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button type="button" onClick={() => selectCount(count)} className="border border-[#EAE7E0] px-3 py-2">View</button><button type="button" disabled={count.status !== 'draft'} onClick={() => handleConfirm(count)} className="border border-[#EAE7E0] px-3 py-2 disabled:opacity-40">Confirm</button><button type="button" disabled={count.status !== 'draft'} onClick={() => handleCancel(count)} className="border border-[#EAE7E0] px-3 py-2 text-[#9F2A2A] disabled:opacity-40">Cancel</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={handleSave} className="h-fit border border-[#EAE7E0] bg-white p-6">
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">{selectedCount ? selectedCount.countNumber : 'Draft'}</p>
            <h2 className="mt-1 font-serif text-2xl">{selectedCount ? 'Count Detail' : 'New Count'}</h2>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Count Date</span><input type="date" disabled={formDisabled} value={countDate} onChange={(event) => setCountDate(event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" /></label>
              <div><div className="mb-2 flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-[#737373]">Items</span><button type="button" disabled={formDisabled} onClick={() => setItems((current) => [...current, { ...emptyItem }])} className="text-sm underline disabled:opacity-40">Add item</button></div>
                <div className="space-y-3">{items.map((item, index) => {
                  const systemQuantity = selectedCount?.items[index]?.systemQuantity ?? productStock(item.productId);
                  const difference = Number(item.actualQuantity || 0) - Number(systemQuantity || 0);
                  return <div key={index} className="border border-[#EAE7E0] p-3"><select disabled={formDisabled} value={item.productId} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, productId: event.target.value } : entry))} className="w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm disabled:bg-[#F9F8F6]" required><option value="">Choose product</option>{products.map((product) => <option key={product.productId} value={product.productId}>{product.productId} - {product.name}</option>)}</select><div className="mt-3 grid grid-cols-3 gap-3 text-sm"><div className="border border-[#EAE7E0] px-3 py-2 text-[#737373]">{systemQuantity}</div><input type="number" min={0} step={1} disabled={formDisabled} value={item.actualQuantity} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, actualQuantity: Number(event.target.value) } : entry))} className="border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" /><div className="border border-[#EAE7E0] px-3 py-2 text-[#737373]">{difference}</div></div></div>;
                })}</div>
              </div>
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Note</span><textarea disabled={formDisabled} value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" /></label>
            </div>
            <button disabled={formDisabled} type="submit" className="mt-6 w-full bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50">{selectedCount ? 'Save Draft' : 'Create Draft'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
