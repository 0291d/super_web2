import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Mail, Search, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { AdminCustomer, getAdminCustomers } from '../api/customers';
import { useAuth } from '../context/AuthContext';

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function customerName(customer: AdminCustomer) {
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return name || 'Unnamed customer';
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [search, setSearch] = useState('');
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
    getAdminCustomers()
      .then((data) => {
        setCustomers(data.customers);
        setTotal(data.total);
        setNewsletterCount(data.newsletterCount);
      })
      .catch(() => toast.error('Unable to load customers'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, user]);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return customers;

    return customers.filter((customer) =>
      [customerName(customer), customer.email, customer.addresses?.[0]?.city, customer.addresses?.[0]?.country]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [customers, search]);

  const metrics = useMemo(() => {
    const customersWithOrders = customers.filter((customer) => customer.orderCount > 0).length;
    const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);
    const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

    return { customersWithOrders, totalOrders, totalSpent };
  }, [customers]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Customers</h1>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
              className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="border border-[#EAE7E0] bg-white p-8 text-sm text-[#737373]">Loading customers...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Customers', value: String(total), icon: UsersRound },
                { label: 'With Orders', value: String(metrics.customersWithOrders), icon: ShoppingBag },
                { label: 'Newsletter', value: String(newsletterCount), icon: Mail },
                { label: 'Customer Revenue', value: formatMoney(metrics.totalSpent), icon: UserRound },
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
              <div className="flex flex-col gap-2 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Customer List</h2>
                  <p className="mt-1 text-sm text-[#737373]">{filteredCustomers.length} customers shown</p>
                </div>
                <p className="text-sm text-[#737373]">{metrics.totalOrders} total customer orders</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Newsletter</th>
                      <th className="px-6 py-4 font-medium">Orders</th>
                      <th className="px-6 py-4 font-medium">Total Spent</th>
                      <th className="px-6 py-4 font-medium">Last Login</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const address = customer.addresses?.[0];
                      const locationText = [address?.city, address?.country].filter(Boolean).join(', ') || 'Not set';

                      return (
                        <tr key={customer.id} className="border-b border-[#EAE7E0] last:border-b-0">
                          <td className="px-6 py-4">
                            <p className="font-medium">{customerName(customer)}</p>
                            <p className="mt-1 text-[#737373]">{customer.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">
                              {customer.newsletter ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{customer.orderCount}</td>
                          <td className="px-6 py-4 font-medium">{formatMoney(customer.totalSpent)}</td>
                          <td className="px-6 py-4 text-[#737373]">{formatDate(customer.lastLoginAt)}</td>
                          <td className="px-6 py-4 text-[#737373]">{formatDate(customer.createdAt)}</td>
                          <td className="px-6 py-4 text-[#737373]">{locationText}</td>
                        </tr>
                      );
                    })}
                    {!filteredCustomers.length && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-[#737373]">
                          No customers match this search.
                        </td>
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
