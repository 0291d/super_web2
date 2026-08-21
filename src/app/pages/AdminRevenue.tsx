import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowDownCircle, ArrowUpCircle, BarChart3, PackageCheck, ReceiptText, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { getAllOrders, Order } from '../api/orders';
import { useAuth } from '../context/AuthContext';

type RangeKey = '7d' | '30d' | '90d' | 'all';
type GroupKey = 'day' | 'month' | 'year';

const rangeOptions: Array<{ label: string; value: RangeKey }> = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

const groupOptions: Array<{ label: string; value: GroupKey }> = [
  { label: 'By day', value: 'day' },
  { label: 'By month', value: 'month' },
  { label: 'By year', value: 'year' },
];

function formatMoney(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!isValidDate(date)) return value || 'Unknown date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function dateKey(value: string) {
  const date = new Date(value);
  return isValidDate(date) ? date.toISOString().slice(0, 10) : '';
}

function periodKey(value: string, group: GroupKey) {
  const date = new Date(value);
  if (!isValidDate(date)) return '';
  if (group === 'year') return String(date.getUTCFullYear());
  if (group === 'month') return date.toISOString().slice(0, 7);
  return dateKey(value);
}

function formatPeriod(value: string, group: GroupKey) {
  if (!value) return 'Unknown period';
  if (group === 'year') return value;
  if (group === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return value;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return value;

    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  return formatDate(value);
}

function shortPeriodLabel(value: string, group: GroupKey) {
  if (group === 'day') return value.slice(5);
  if (group === 'month') return value.slice(5);
  return value;
}

function getRangeStart(range: RangeKey) {
  if (range === 'all') return null;

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return start;
}

function isRevenueOrder(order: Order) {
  return ['paid', 'processing', 'completed'].includes(order.status);
}

export function AdminRevenue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [range, setRange] = useState<RangeKey>('all');
  const [groupBy, setGroupBy] = useState<GroupKey>('year');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    setIsLoading(true);
    getAllOrders()
      .then(setOrders)
      .catch(() => toast.error('Unable to load revenue report'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, user]);

  const filteredOrders = useMemo(() => {
    const rangeStart = getRangeStart(range);
    if (!rangeStart) return orders;

    return orders.filter((order) => new Date(order.createdAt) >= rangeStart);
  }, [orders, range]);

  const metrics = useMemo(() => {
    const revenueOrders = filteredOrders.filter(isRevenueOrder);
    const revenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const orderTotals = revenueOrders.map((order) => Number(order.total || 0));
    const subtotal = revenueOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
    const tax = revenueOrders.reduce((sum, order) => sum + Number(order.taxTotal || 0), 0);
    const shipping = revenueOrders.reduce((sum, order) => sum + Number(order.shippingTotal || 0), 0);
    const units = revenueOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0,
    );

    return {
      revenue,
      subtotal,
      tax,
      shipping,
      units,
      totalOrderCount: filteredOrders.length,
      revenueOrderCount: revenueOrders.length,
      averageOrderValue: revenueOrders.length ? revenue / revenueOrders.length : 0,
      maxOrderValue: orderTotals.length ? Math.max(...orderTotals) : 0,
      minOrderValue: orderTotals.length ? Math.min(...orderTotals) : 0,
      currency: revenueOrders[0]?.currency || 'EUR',
    };
  }, [filteredOrders]);

  const periodRevenue = useMemo(() => {
    const totals = new Map<string, { period: string; revenue: number; orders: number; max: number; min: number; average: number }>();

    filteredOrders
      .filter(isRevenueOrder)
      .forEach((order) => {
        const key = periodKey(order.createdAt, groupBy);
        if (!key) return;
        const orderTotal = Number(order.total || 0);
        const current = totals.get(key) || { period: key, revenue: 0, orders: 0, max: orderTotal, min: orderTotal, average: 0 };
        current.revenue += orderTotal;
        current.orders += 1;
        current.max = Math.max(current.max, orderTotal);
        current.min = Math.min(current.min, orderTotal);
        current.average = current.revenue / current.orders;
        totals.set(key, current);
      });

    return Array.from(totals.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredOrders, groupBy]);

  const topProducts = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; revenue: number }>();

    filteredOrders
      .filter(isRevenueOrder)
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = item.productId || item.id || item.name;
          const current = totals.get(key) || { name: item.name, quantity: 0, revenue: 0 };
          current.quantity += Number(item.quantity || 0);
          current.revenue += Number(item.lineTotal || item.unitPrice * item.quantity || 0);
          totals.set(key, current);
        });
      });

    return Array.from(totals.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Revenue Report</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`border px-4 py-2 text-sm font-medium transition-colors ${
                  range === option.value
                    ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                    : 'border-[#EAE7E0] bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="border border-[#EAE7E0] bg-white p-8 text-sm text-[#737373]">Loading revenue data...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Revenue', value: formatMoney(metrics.revenue, metrics.currency), icon: TrendingUp },
                { label: 'Max Order', value: formatMoney(metrics.maxOrderValue, metrics.currency), icon: ArrowUpCircle },
                { label: 'Min Order', value: formatMoney(metrics.minOrderValue, metrics.currency), icon: ArrowDownCircle },
                { label: 'Average Order', value: formatMoney(metrics.averageOrderValue, metrics.currency), icon: BarChart3 },
                { label: 'Total Orders', value: String(metrics.totalOrderCount), icon: ReceiptText },
                { label: 'Revenue Orders', value: String(metrics.revenueOrderCount), icon: ReceiptText },
                { label: 'Units Sold', value: String(metrics.units), icon: PackageCheck },
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

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
              <section className="border border-[#EAE7E0] bg-white p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl">Revenue Statistics</h2>
                    <p className="mt-1 text-sm text-[#737373]">{periodRevenue.length} periods with orders</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGroupBy(option.value)}
                        className={`border px-4 py-2 text-sm font-medium transition-colors ${
                          groupBy === option.value
                            ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                            : 'border-[#EAE7E0] bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[360px]">
                  {periodRevenue.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={periodRevenue}>
                        <CartesianGrid stroke="#EAE7E0" vertical={false} />
                        <XAxis dataKey="period" tickFormatter={(value) => shortPeriodLabel(String(value), groupBy)} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(value) => formatMoney(Number(value), metrics.currency)} tickLine={false} axisLine={false} width={90} />
                        <Tooltip
                          formatter={(value: number) => [formatMoney(Number(value), metrics.currency), 'Revenue']}
                          labelFormatter={(value) => formatPeriod(String(value), groupBy)}
                        />
                        <Bar dataKey="revenue" fill="#2D2D2D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#737373]">No revenue in this range.</div>
                  )}
                </div>
              </section>

              <section className="border border-[#EAE7E0] bg-white p-6">
                <h2 className="mb-6 font-serif text-2xl">Top Products</h2>
                <div className="space-y-5">
                  {topProducts.length ? topProducts.map((product, index) => (
                    <div key={`${product.name}-${index}`} className="border-b border-[#EAE7E0] pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="mt-1 text-sm text-[#737373]">{product.quantity} units sold</p>
                        </div>
                        <p className="font-medium">{formatMoney(product.revenue, metrics.currency)}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-[#737373]">No product sales in this range.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="border border-[#EAE7E0] bg-white p-6">
                <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Subtotal</p>
                <p className="mt-3 font-serif text-2xl">{formatMoney(metrics.subtotal, metrics.currency)}</p>
              </div>
              <div className="border border-[#EAE7E0] bg-white p-6">
                <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Shipping</p>
                <p className="mt-3 font-serif text-2xl">{formatMoney(metrics.shipping, metrics.currency)}</p>
              </div>
              <div className="border border-[#EAE7E0] bg-white p-6">
                <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Tax</p>
                <p className="mt-3 font-serif text-2xl">{formatMoney(metrics.tax, metrics.currency)}</p>
              </div>
            </div>

            <section className="border border-[#EAE7E0] bg-white">
              <div className="border-b border-[#EAE7E0] p-6">
                <h2 className="font-serif text-2xl">Statistics by {groupBy}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Period</th>
                      <th className="px-6 py-4 font-medium">Orders</th>
                      <th className="px-6 py-4 text-right font-medium">Total Value</th>
                      <th className="px-6 py-4 text-right font-medium">Max Value</th>
                      <th className="px-6 py-4 text-right font-medium">Min Value</th>
                      <th className="px-6 py-4 text-right font-medium">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodRevenue.map((period) => (
                      <tr key={period.period} className="border-b border-[#EAE7E0] last:border-b-0">
                        <td className="px-6 py-4 font-medium">{formatPeriod(period.period, groupBy)}</td>
                        <td className="px-6 py-4 text-[#737373]">{period.orders}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatMoney(period.revenue, metrics.currency)}</td>
                        <td className="px-6 py-4 text-right text-[#737373]">{formatMoney(period.max, metrics.currency)}</td>
                        <td className="px-6 py-4 text-right text-[#737373]">{formatMoney(period.min, metrics.currency)}</td>
                        <td className="px-6 py-4 text-right text-[#737373]">{formatMoney(period.average, metrics.currency)}</td>
                      </tr>
                    ))}
                    {!periodRevenue.length && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-[#737373]">No statistics in this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-[#EAE7E0] bg-white">
              <div className="border-b border-[#EAE7E0] p-6">
                <h2 className="font-serif text-2xl">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 12).map((order) => (
                      <tr key={order.id} className="border-b border-[#EAE7E0] last:border-b-0">
                        <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-[#737373]">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4 text-[#737373]">{order.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{order.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatMoney(order.total, order.currency)}</td>
                      </tr>
                    ))}
                    {!filteredOrders.length && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-[#737373]">No orders in this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
