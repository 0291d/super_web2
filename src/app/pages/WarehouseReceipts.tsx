import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CheckCircle2, ClipboardList, PackagePlus, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelWarehouseReceipt,
  confirmWarehouseReceipt,
  getWarehouseInventory,
  getWarehouseReceipts,
  InventoryProduct,
  ReceiptStatus,
  saveWarehouseReceipt,
  WarehouseReceipt,
  WarehouseReceiptItem,
} from '../api/warehouse';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

type StatusFilter = ReceiptStatus | 'all';

const statuses: StatusFilter[] = ['all', 'draft', 'confirmed', 'cancelled'];

const emptyItem: WarehouseReceiptItem = { productId: '', quantity: 1, unitCost: 0 };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function canAccessWarehouse(role?: string) {
  return role === 'warehouse' || role === 'admin';
}

export function WarehouseReceipts() {
  const [receipts, setReceipts] = useState<WarehouseReceipt[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptDate, setReceiptDate] = useState(todayInputValue());
  const [items, setItems] = useState<WarehouseReceiptItem[]>([{ ...emptyItem }]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadData() {
    setIsLoading(true);
    try {
      const [receiptData, inventoryData] = await Promise.all([
        getWarehouseReceipts({ search, status: statusFilter, dateFrom, dateTo }),
        getWarehouseInventory(),
      ]);
      setReceipts(receiptData);
      setProducts(inventoryData.products);
    } catch {
      toast.error('Unable to load warehouse receipts');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessWarehouse(user.role)) return navigate('/');

    loadData();
  }, [dateFrom, dateTo, isAuthLoading, location.pathname, navigate, search, statusFilter, user]);

  const selectedReceipt = useMemo(() => receipts.find((receipt) => receipt.id === selectedId), [receipts, selectedId]);
  const mode = selectedReceipt ? 'edit' : 'create';

  const previewTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0),
    [items],
  );

  const metrics = useMemo(() => ({
    total: receipts.length,
    draft: receipts.filter((receipt) => receipt.status === 'draft').length,
    confirmed: receipts.filter((receipt) => receipt.status === 'confirmed').length,
    value: receipts.reduce((sum, receipt) => sum + Number(receipt.totalValue || 0), 0),
  }), [receipts]);

  function startNewReceipt() {
    setSelectedId('');
    setReceiptDate(todayInputValue());
    setItems([{ ...emptyItem }]);
    setNote('');
  }

  function selectReceipt(receipt: WarehouseReceipt) {
    setSelectedId(receipt.id);
    setReceiptDate(receipt.receiptDate.slice(0, 10));
    setItems(receipt.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
    })));
    setNote(receipt.note || '');
  }

  function updateItem(index: number, patch: Partial<WarehouseReceiptItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((current) => current.length === 1 ? current : current.filter((_item, itemIndex) => itemIndex !== index));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await saveWarehouseReceipt({
        id: selectedReceipt?.id,
        receiptDate,
        items,
        note,
      });
      toast.success(selectedReceipt ? 'Receipt updated' : 'Receipt draft created');
      await loadData();
      selectReceipt(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save receipt');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel(receipt: WarehouseReceipt) {
    if (!window.confirm(`Cancel ${receipt.receiptNumber}?`)) return;
    try {
      const updated = await cancelWarehouseReceipt(receipt.id);
      setReceipts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      selectReceipt(updated);
      toast.success('Receipt cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel receipt');
    }
  }

  async function handleConfirm(receipt: WarehouseReceipt) {
    if (!window.confirm(`Confirm ${receipt.receiptNumber} and increase product stock?`)) return;
    try {
      const data = await confirmWarehouseReceipt(receipt.id);
      toast.success(`Receipt confirmed. ${data.batches.length} batch records created.`);
      await loadData();
      selectReceipt(data.receipt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm receipt');
    }
  }

  if (isAuthLoading || !user || !canAccessWarehouse(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking warehouse access...</div>;
  }

  const formDisabled = selectedReceipt?.status && selectedReceipt.status !== 'draft';

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Warehouse</p>
            <h1 className="font-serif text-4xl">Inventory Receipts</h1>
          </div>
          <button onClick={startNewReceipt} className="flex w-fit items-center gap-2 bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            <PackagePlus className="h-4 w-4" />
            New Receipt
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Receipts', value: String(metrics.total), icon: ClipboardList },
            { label: 'Draft', value: String(metrics.draft), icon: ClipboardList },
            { label: 'Confirmed', value: String(metrics.confirmed), icon: CheckCircle2 },
            { label: 'Total Value', value: formatMoney(metrics.value), icon: PackagePlus },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="border border-[#EAE7E0] bg-white p-6">
                <div className="mb-5 flex items-center justify-between text-[#9E9B94]">
                  <span className="text-xs uppercase tracking-widest">{item.label}</span>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-serif text-3xl">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_480px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="space-y-4 border-b border-[#EAE7E0] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Receipt List</h2>
                  <p className="mt-1 text-sm text-[#737373]">{receipts.length} receipts shown</p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search receipt number"
                    className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm capitalize">
                  {statuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>)}
                </select>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Receipt</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Staff</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-[#737373]">Loading receipts...</td></tr>
                  ) : receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => selectReceipt(receipt)} className="text-left">
                          <p className="font-medium">{receipt.receiptNumber}</p>
                          <p className="mt-1 text-[#737373]">{receipt.items.length} line items</p>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[#737373]">{formatDate(receipt.receiptDate)}</td>
                      <td className="px-6 py-4 text-[#737373]">{receipt.warehouseStaff?.email || 'Not set'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{receipt.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatMoney(receipt.totalValue)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => selectReceipt(receipt)} className="border border-[#EAE7E0] px-3 py-2 hover:border-[#2D2D2D]">View</button>
                          <button type="button" disabled={receipt.status !== 'draft'} onClick={() => handleConfirm(receipt)} className="border border-[#EAE7E0] px-3 py-2 hover:border-[#2D2D2D] disabled:opacity-40">Confirm</button>
                          <button type="button" disabled={receipt.status !== 'draft'} onClick={() => handleCancel(receipt)} className="border border-[#EAE7E0] px-3 py-2 text-[#9F2A2A] hover:border-[#9F2A2A] disabled:opacity-40">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && !receipts.length && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-[#737373]">No receipts match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <form onSubmit={handleSave} className="h-fit border border-[#EAE7E0] bg-white p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-[#9E9B94]">{mode === 'create' ? 'Draft' : selectedReceipt?.receiptNumber}</p>
              <h2 className="mt-1 font-serif text-2xl">{mode === 'create' ? 'New Receipt' : 'Receipt Detail'}</h2>
              {selectedReceipt && <p className="mt-1 text-sm capitalize text-[#737373]">{selectedReceipt.status}</p>}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Receipt Date</span>
                <input type="date" value={receiptDate} disabled={Boolean(formDisabled)} onChange={(event) => setReceiptDate(event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" required />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#737373]">Items</span>
                  <button type="button" disabled={Boolean(formDisabled)} onClick={() => setItems((current) => [...current, { ...emptyItem }])} className="text-sm font-medium underline disabled:opacity-40">Add item</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border border-[#EAE7E0] p-3">
                      <div className="grid grid-cols-1 gap-3">
                        <select value={item.productId} disabled={Boolean(formDisabled)} onChange={(event) => updateItem(index, { productId: event.target.value })} className="w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm disabled:bg-[#F9F8F6]" required>
                          <option value="">Choose product</option>
                          {products.map((product) => (
                            <option key={product.productId} value={product.productId}>{product.productId} - {product.name}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                          <input type="number" min={1} step={1} value={item.quantity} disabled={Boolean(formDisabled)} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} className="min-w-0 border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" required />
                          <input type="number" min={0} step={0.01} value={item.unitCost} disabled={Boolean(formDisabled)} onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) })} className="min-w-0 border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" required />
                          <button type="button" disabled={Boolean(formDisabled) || items.length === 1} onClick={() => removeItem(index)} className="border border-[#EAE7E0] px-3 py-2 text-[#9F2A2A] disabled:opacity-40">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-right text-sm text-[#737373]">{formatMoney(Number(item.quantity || 0) * Number(item.unitCost || 0))}</p>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Note</span>
                <textarea value={note} disabled={Boolean(formDisabled)} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full border border-[#EAE7E0] px-3 py-2 disabled:bg-[#F9F8F6]" />
              </label>
            </div>

            <div className="mt-6 border-t border-[#EAE7E0] pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#737373]">Preview total</span>
                <span className="font-medium">{formatMoney(previewTotal)}</span>
              </div>
              <button disabled={isSaving || Boolean(formDisabled)} type="submit" className="mt-4 w-full bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50">
                {isSaving ? 'Saving...' : mode === 'create' ? 'Create Draft' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
