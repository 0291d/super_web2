import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Product } from '../context/GlobalContext';
import { getProducts } from '../api/products';
import { shopCategories, shopLinkFor, shopMenu } from '../data/shopMenu';

const sortOptions = [
  { label: 'Featured', value: 'popular' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price Low to High', value: 'price_asc' },
  { label: 'Price High to Low', value: 'price_desc' },
];

function normalizePathCategory(value?: string) {
  if (!value) return '';
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Shop() {
  const { category: pathCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const category = searchParams.get('category') || normalizePathCategory(pathCategory);
  const subcategory = searchParams.get('subcategory') || '';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'popular';

  const activeTitle = subcategory || category || 'All Products';

  const activeSubcategories = useMemo(() => {
    const group = shopMenu.find((item) => item.title === category);
    return group?.links || [];
  }, [category]);

  function updateQuery(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params);
  }

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getProducts({ category, subcategory, q, sort })
      .then((data) => {
        if (!isMounted) return;
        setProducts(data);
        setLoadError('');
      })
      .catch(() => {
        if (!isMounted) return;
        setProducts([]);
        setLoadError('Unable to load products right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category, subcategory, q, sort]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-serif mb-4">{activeTitle}</h1>
        <p className="text-[#737373]">
          Explore furniture, lighting, textiles, and decor selected for considered everyday living.
        </p>
        {loadError && <p className="mt-4 text-sm text-[#9E9B94]">{loadError}</p>}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center py-4 border-y border-[#EAE7E0] mb-8 relative z-20">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-[#737373] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>

        <form
          className="flex-1 md:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            updateQuery({ q: String(formData.get('q') || '') });
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products"
            className="w-full bg-transparent border-b border-[#DCD5C6] py-2 text-sm focus:outline-none focus:border-[#2D2D2D]"
          />
        </form>

        <label className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
          Sort by
          <select
            value={sort}
            onChange={(event) => updateQuery({ sort: event.target.value })}
            className="bg-transparent border border-[#EAE7E0] px-3 py-2 text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4" />
        </label>
      </div>

      <div className="flex gap-12">
        {showFilters && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="mb-8">
              <h3 className="font-serif text-lg mb-4">Category</h3>
              <div className="space-y-3">
                <Link to="/shop" className={`block text-sm ${!category ? 'text-[#2D2D2D]' : 'text-[#737373]'} hover:text-[#2D2D2D]`}>
                  All Products
                </Link>
                {shopCategories.map((item) => (
                  <Link
                    key={item}
                    to={shopLinkFor(item)}
                    className={`block text-sm ${category === item ? 'text-[#2D2D2D]' : 'text-[#737373]'} hover:text-[#2D2D2D]`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {activeSubcategories.length > 0 && (
              <div className="mb-8">
                <h3 className="font-serif text-lg mb-4">Subcategory</h3>
                <div className="space-y-3">
                  {activeSubcategories.map((item) => (
                    <Link
                      key={item}
                      to={shopLinkFor(category, item)}
                      className={`block text-sm ${subcategory === item ? 'text-[#2D2D2D]' : 'text-[#737373]'} hover:text-[#2D2D2D]`}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        <div className="flex-1">
          <div className="mb-6 text-sm text-[#737373]">{isLoading ? 'Loading products...' : `${products.length} products`}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {isLoading && <div className="col-span-full text-center text-sm text-[#737373]">Loading products...</div>}
            {!isLoading && products.map((product) => <ProductCard key={product.id} product={product} />)}
            {!isLoading && products.length === 0 && (
              <div className="col-span-full text-center text-sm text-[#737373]">No products match this filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
