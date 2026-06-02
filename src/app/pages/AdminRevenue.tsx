import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BarChart3, PackageCheck, ReceiptText, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { getAllOrders, Order } from '../api/orders';
import { useAuth } from '../context/AuthContext';

type RangeKey = '7d' | '30d' | '90d' | 'all';

const rangeOptions: Array<{ label: string; value: RangeKey }> = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

function formatMoney(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
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
  const [range, setRange] = useState<RangeKey>('30d');
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
      orderCount: revenueOrders.length,
      averageOrderValue: revenueOrders.length ? revenue / revenueOrders.length : 0,
      currency: revenueOrders[0]?.currency || 'EUR',
    };
  }, [filteredOrders]);

  const dailyRevenue = useMemo(() => {
    const totals = new Map<string, { date: string; revenue: number; orders: number }>();

    filteredOrders
      .filter(isRevenueOrder)
      .forEach((order) => {
        const key = dateKey(order.createdAt);
        const current = totals.get(key) || { date: key, revenue: 0, orders: 0 };
        current.revenue += Number(order.total || 0);
        current.orders += 1;
        totals.set(key, current);
      });

    return Array.from(totals.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

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
                { label: 'Orders', value: String(metrics.orderCount), icon: ReceiptText },
                { label: 'Average Order', value: formatMoney(metrics.averageOrderValue, metrics.currency), icon: BarChart3 },
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
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-2xl">Revenue by Day</h2>
                  <p className="text-sm text-[#737373]">{dailyRevenue.length} days with orders</p>
                </div>
                <div className="h-[360px]">
                  {dailyRevenue.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyRevenue}>
                        <CartesianGrid stroke="#EAE7E0" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(value) => formatMoney(Number(value), metrics.currency)} tickLine={false} axisLine={false} width={90} />
                        <Tooltip
                          formatter={(value: number) => [formatMoney(Number(value), metrics.currency), 'Revenue']}
                          labelFormatter={(value) => formatDate(String(value))}
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
