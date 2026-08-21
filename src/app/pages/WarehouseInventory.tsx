import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Boxes, PackageCheck, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getWarehouseInventory, InventoryProduct } from '../api/warehouse';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';

type StockFilter = 'all' | 'inStock' | 'outOfStock';

function canAccessWarehouse(role?: string) {
  return role === 'warehouse' || role === 'admin';
}

export function WarehouseInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState<StockFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!canAccessWarehouse(user.role)) return navigate('/');

    setIsLoading(true);
    getWarehouseInventory({ search, category, stockStatus })
      .then((data) => {
        setProducts(data.products);
        setCategories((current) => [...new Set([...current, ...data.categories])].sort());
      })
      .catch(() => toast.error('Unable to load inventory'))
      .finally(() => setIsLoading(false));
  }, [category, isAuthLoading, location.pathname, navigate, search, stockStatus, user]);

  const metrics = useMemo(() => ({
    total: products.length,
    inStock: products.filter((product) => product.stock > 0).length,
    outOfStock: products.filter((product) => product.stock <= 0).length,
    units: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
  }), [products]);

  if (isAuthLoading || !user || !canAccessWarehouse(user.role)) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking warehouse access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Warehouse</p>
            <h1 className="font-serif text-4xl">Inventory</h1>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or product ID"
              className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Products Shown', value: String(metrics.total), icon: Boxes },
            { label: 'Units Available', value: String(metrics.units), icon: PackageCheck },
            { label: 'In Stock', value: String(metrics.inStock), icon: PackageCheck },
            { label: 'Out Of Stock', value: String(metrics.outOfStock), icon: XCircle },
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

        <section className="mt-8 border border-[#EAE7E0] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#EAE7E0] p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-serif text-2xl">Current Stock</h2>
              <p className="mt-1 text-sm text-[#737373]">Values come directly from products.stock.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm">
                <option value="all">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={stockStatus} onChange={(event) => setStockStatus(event.target.value as StockFilter)} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm">
                <option value="all">All stock</option>
                <option value="inStock">In stock</option>
                <option value="outOfStock">Out of stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Product ID</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[#737373]">Loading inventory...</td></tr>
                ) : products.map((product) => (
                  <tr key={product.productId} className="border-b border-[#EAE7E0] last:border-b-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-12 shrink-0 bg-[#EAE7E0]">
                          <PlaceholderImage text={product.productId} src={product.imageUrl} alt={product.name} />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="mt-1 text-[#737373]">{product.currency || 'EUR'} {Number(product.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.productId}</td>
                    <td className="px-6 py-4 text-[#737373]">{product.category}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">
                        {product.stock > 0 ? 'inStock' : 'outOfStock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{product.stock}</td>
                  </tr>
                ))}
                {!isLoading && !products.length && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[#737373]">No products match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
