import React, { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { getProducts, ProductDetail } from '../api/products';
import { useGlobal } from '../context/GlobalContext';
import { PlaceholderImage } from './PlaceholderImage';

export function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen } = useGlobal();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isSearchOpen) return;

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      getProducts(query.trim() ? { q: query.trim() } : { sort: 'popular' })
        .then((products) => {
          if (!isMounted) return;
          setResults(products.slice(0, 4));
          setLoadError('');
        })
        .catch(() => {
          if (!isMounted) return;
          setResults([]);
          setLoadError('Unable to load products right now.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, query.trim() ? 220 : 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [isSearchOpen, query]);

  function closeSearch() {
    setIsSearchOpen(false);
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    closeSearch();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-[#F9F8F6]"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between border-b border-[#EAE7E0] p-6">
            <div className="w-8" />
            <span className="font-serif text-xl uppercase tracking-wide">Search</span>
            <button onClick={closeSearch} className="rounded-full p-2 transition-colors hover:bg-[#EAE7E0]" aria-label="Close search">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <form onSubmit={handleSearch} className="relative mx-auto mb-16 max-w-4xl">
              <input
                type="search"
                placeholder="Search products..."
                className="w-full border-b-2 border-[#2D2D2D] bg-transparent pb-4 font-serif text-2xl placeholder:text-[#9E9B94] focus:outline-none md:text-4xl"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit" className="absolute bottom-4 right-0" aria-label="View all search results">
                <Search className="h-8 w-8 text-[#2D2D2D]" />
              </button>
            </form>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 md:grid-cols-3">
              <div>
                <h3 className="mb-6 text-sm font-medium uppercase tracking-widest text-[#9E9B94]">Popular Searches</h3>
                <ul className="space-y-4 text-lg">
                  <li><Link to="/shop?subcategory=Modular%20Sofas" onClick={closeSearch} className="transition-colors hover:text-[#9E9B94]">Modular Sofas</Link></li>
                  <li><Link to="/shop?subcategory=Portable%20Lamps" onClick={closeSearch} className="transition-colors hover:text-[#9E9B94]">Portable Lamps</Link></li>
                  <li><Link to="/shop?subcategory=Vases" onClick={closeSearch} className="transition-colors hover:text-[#9E9B94]">Vases</Link></li>
                  <li><Link to="/shop?category=Outdoor%20Living" onClick={closeSearch} className="transition-colors hover:text-[#9E9B94]">Outdoor Furniture</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h3 className="mb-6 text-sm font-medium uppercase tracking-widest text-[#9E9B94]">
                  {query.trim() ? 'Matching Products' : 'Popular Products'}
                </h3>
                {isLoading && <p className="text-sm text-[#737373]">Searching products...</p>}
                {!isLoading && loadError && <p className="text-sm text-[#737373]">{loadError}</p>}
                {!isLoading && !loadError && results.length === 0 && <p className="text-sm text-[#737373]">No products found.</p>}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {!isLoading && results.map((product) => (
                    <Link to={`/product/${product.id}`} onClick={closeSearch} key={product.id} className="group flex items-center gap-4">
                      <div className="h-20 w-20 bg-[#EAE7E0]">
                        <PlaceholderImage text={`PROD ${product.id}`} src={product.imageUrl || product.images?.[0]} alt={product.name} />
                      </div>
                      <div>
                        <h4 className="font-medium transition-colors group-hover:text-[#9E9B94]">{product.name}</h4>
                        <p className="text-sm text-[#9E9B94]">{product.currency || 'EUR'} {product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
