import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useGlobal, Product } from '../context/GlobalContext';
import { ProductCard } from '../components/ProductCard';
import { getProduct } from '../api/products';

export function Wishlist() {
  const { wishlist } = useGlobal();
  const [savedProducts, setSavedProducts] = useState<Product[]>(wishlist);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      const hydrated = await Promise.all(
        wishlist.map(async (item) => {
          if (item.name && item.price !== undefined) return item;
          try {
            return await getProduct(item.id);
          } catch {
            return item;
          }
        }),
      );

      if (isMounted) {
        setSavedProducts(hydrated);
        setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [wishlist]);

  return (
    <div className="container mx-auto px-6 py-12 min-h-[60vh]">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-serif mb-4">Your Wishlist</h1>
        <p className="text-[#737373]">
          Save your favorite pieces here. Log in to access your wishlist across all devices.
        </p>
        <Link to="/login" className="inline-block mt-4 text-sm font-medium tracking-wide uppercase underline">
          Log In or Register
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-[#737373]">Loading wishlist...</div>
      ) : savedProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#F9F8F6]">
          <h2 className="text-2xl font-serif mb-4">No items saved yet</h2>
          <p className="text-[#737373] mb-8">Start adding items to your wishlist by clicking the heart icon on products you love.</p>
          <Link to="/shop" className="inline-block border border-[#2D2D2D] px-8 py-3 text-sm font-medium tracking-widest uppercase hover:bg-[#2D2D2D] hover:text-white transition-colors">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
