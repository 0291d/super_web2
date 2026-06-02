import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CheckCircle2, Clock3, PackageCheck, ReceiptText, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getAllOrders, Order, OrderStatus, updateOrderStatus } from '../api/orders';
import { useAuth } from '../context/AuthContext';

const statuses: Array<'all' | OrderStatus> = ['all', 'pending', 'paid', 'processing', 'completed', 'cancelled'];

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

function itemCount(order: Order) {
  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
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
      .catch(() => toast.error('Unable to load orders'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, user]);

  const metrics = useMemo(() => {
    const paidOrders = orders.filter((order) => ['paid', 'processing', 'completed'].includes(order.status));
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      processing: orders.filter((order) => order.status === 'processing').length,
      completed: orders.filter((order) => order.status === 'completed').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
      revenue: paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch =
        !query ||
        [order.orderNumber, order.email, order.shippingAddress?.firstName, order.shippingAddress?.lastName, order.shippingAddress?.city]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setUpdatingId(order.id);
    try {
      const updatedOrder = await updateOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)));
      toast.success('Order status updated');
    } catch {
      toast.error('Unable to update order status');
    } finally {
      setUpdatingId('');
    }
  }

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Orders</h1>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders"
              className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="border border-[#EAE7E0] bg-white p-8 text-sm text-[#737373]">Loading orders...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Orders', value: String(metrics.total), icon: ReceiptText },
                { label: 'Processing', value: String(metrics.processing), icon: Clock3 },
                { label: 'Completed', value: String(metrics.completed), icon: CheckCircle2 },
                { label: 'Order Revenue', value: formatMoney(metrics.revenue), icon: PackageCheck },
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

            <section className="border border-[#EAE7E0] bg-white">
              <div className="flex flex-col gap-4 border-b border-[#EAE7E0] p-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Order Management</h2>
                  <p className="mt-1 text-sm text-[#737373]">{filteredOrders.length} orders shown</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        statusFilter === status
                          ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                          : 'border-[#EAE7E0] bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Items</th>
                      <th className="px-6 py-4 font-medium">Ship To</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const customerName = `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim();
                      return (
                        <tr key={order.id} className="border-b border-[#EAE7E0] last:border-b-0">
                          <td className="px-6 py-4">
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="mt-1 text-[#737373]">{order.deliveryMethod || 'standard'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{customerName || 'Guest customer'}</p>
                            <p className="mt-1 text-[#737373]">{order.email}</p>
                          </td>
                          <td className="px-6 py-4 text-[#737373]">{formatDate(order.createdAt)}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{itemCount(order)} units</p>
                            <p className="mt-1 text-[#737373]">{order.items.length} line items</p>
                          </td>
                          <td className="px-6 py-4 text-[#737373]">{order.shippingAddress?.city || 'Not set'}</td>
                          <td className="px-6 py-4">
                            <select
                              value={order.status}
                              disabled={updatingId === order.id}
                              onChange={(event) => handleStatusChange(order, event.target.value as OrderStatus)}
                              className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm capitalize outline-none focus:border-[#2D2D2D] disabled:opacity-60"
                            >
                              {statuses.filter((status) => status !== 'all').map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">{formatMoney(order.total, order.currency)}</td>
                        </tr>
                      );
                    })}
                    {!filteredOrders.length && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-[#737373]">
                          No orders match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border border-[#EAE7E0] bg-white p-6">
                <div className="mb-5 flex items-center justify-between text-[#9E9B94]">
                  <span className="text-xs uppercase tracking-widest">Pending</span>
                  <Clock3 className="h-5 w-5" />
                </div>
                <p className="font-serif text-3xl">{metrics.pending}</p>
              </div>
              <div className="border border-[#EAE7E0] bg-white p-6">
                <div className="mb-5 flex items-center justify-between text-[#9E9B94]">
                  <span className="text-xs uppercase tracking-widest">Cancelled</span>
                  <XCircle className="h-5 w-5" />
                </div>
                <p className="font-serif text-3xl">{metrics.cancelled}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
