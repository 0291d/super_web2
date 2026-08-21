import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { History, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getWarehouseInventoryLogs, InventoryLog } from '../api/warehouse';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

function canAccessWarehouse(role?: string) {
  return role === 'warehouse' || role === 'admin';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function WarehouseHistory() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<InventoryLog['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessWarehouse(user.role)) return navigate('/');

    setIsLoading(true);
    getWarehouseInventoryLogs({ productId, type })
      .then(setLogs)
      .catch(() => toast.error('Unable to load inventory history'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, productId, type, user]);

  const metrics = useMemo(() => ({
    total: logs.length,
    imports: logs.filter((log) => log.type === 'IMPORT').length,
    exports: logs.filter((log) => log.type === 'EXPORT').length,
    adjustments: logs.filter((log) => log.type === 'ADJUSTMENT').length,
  }), [logs]);

  if (isAuthLoading || !user || !canAccessWarehouse(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking warehouse access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs uppercase tracking-widest text-[#9E9B94]">Warehouse</p><h1 className="font-serif text-4xl">Inventory History</h1></div>
          <label className="relative block w-full md:max-w-sm"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" /><input value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="Filter product ID" className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]" /></label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[{ label: 'Logs', value: metrics.total }, { label: 'Import', value: metrics.imports }, { label: 'Export', value: metrics.exports }, { label: 'Adjustment', value: metrics.adjustments }].map((item) => (
            <div key={item.label} className="border border-[#EAE7E0] bg-white p-6"><div className="mb-5 flex items-center justify-between text-[#9E9B94]"><span className="text-xs uppercase tracking-widest">{item.label}</span><History className="h-5 w-5" /></div><p className="font-serif text-3xl">{item.value}</p></div>
          ))}
        </div>

        <section className="mt-8 border border-[#EAE7E0] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
            <div><h2 className="font-serif text-2xl">Movement Log</h2><p className="mt-1 text-sm text-[#737373]">Latest 200 inventory movements.</p></div>
            <select value={type} onChange={(event) => setType(event.target.value as InventoryLog['type'] | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm"><option value="all">All types</option><option value="IMPORT">IMPORT</option><option value="EXPORT">EXPORT</option><option value="ADJUSTMENT">ADJUSTMENT</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]"><tr><th className="px-6 py-4 font-medium">Time</th><th className="px-6 py-4 font-medium">Product</th><th className="px-6 py-4 font-medium">Type</th><th className="px-6 py-4 text-right font-medium">Qty</th><th className="px-6 py-4 text-right font-medium">Before</th><th className="px-6 py-4 text-right font-medium">After</th><th className="px-6 py-4 text-right font-medium">Cost</th><th className="px-6 py-4 font-medium">Reference</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={8} className="px-6 py-10 text-center text-[#737373]">Loading history...</td></tr> : logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#EAE7E0] last:border-b-0">
                    <td className="px-6 py-4 text-[#737373]">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4 font-mono text-xs">{log.productId}</td>
                    <td className="px-6 py-4"><span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{log.type}</span></td>
                    <td className="px-6 py-4 text-right font-medium">{log.quantity}</td>
                    <td className="px-6 py-4 text-right">{log.stockBefore}</td>
                    <td className="px-6 py-4 text-right">{log.stockAfter}</td>
                    <td className="px-6 py-4 text-right">{formatMoney(log.totalCost)}</td>
                    <td className="px-6 py-4 text-[#737373]">{log.referenceType} / {log.referenceId}</td>
                  </tr>
                ))}
                {!isLoading && !logs.length && <tr><td colSpan={8} className="px-6 py-10 text-center text-[#737373]">No inventory history found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
