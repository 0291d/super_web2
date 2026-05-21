import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getProducts } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { Product } from '../context/GlobalContext';

export function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getProducts({ sort: 'newest' })
      .then((products) => {
        if (isMounted) setNewArrivals(products.slice(0, 4));
      })
      .catch(() => {
        if (isMounted) setNewArrivals([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col">
      <section className="relative h-[85vh] w-full bg-[#EAE7E0] flex items-end pb-20">
        <div className="absolute inset-0">
          <PlaceholderImage text="HERO LIFESTYLE IMAGE" className="opacity-80" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center text-[#2D2D2D]">
          <h1 className="text-5xl md:text-7xl font-serif mb-6">The Art of Creating Space</h1>
          <p className="text-lg mb-8 max-w-xl mx-auto">Discover our new collection of carefully crafted pieces designed to bring warmth and balance to your home.</p>
          <Link to="/shop" className="inline-block bg-[#2D2D2D] text-white px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors">
            Explore Collection
          </Link>
        </div>
      </section>

      <section className="py-20 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['New Arrivals', 'Gifts under EUR 100', 'Outdoor Living', 'Classics'].map((title, i) => (
            <Link to="/shop" key={i} className="group block relative aspect-square overflow-hidden bg-[#F3F1EC]">
              <PlaceholderImage text={`CATEGORY ${i + 1}`} className="transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <h3 className="text-white font-serif text-2xl tracking-wide">{title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#F9F8F6]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif mb-4">New Arrivals</h2>
              <p className="text-[#737373]">Soft shapes and tactile textures.</p>
            </div>
            <Link to="/shop" className="text-sm font-medium tracking-widest uppercase hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoadingProducts && <div className="col-span-full text-sm text-[#737373]">Loading products...</div>}
            {!isLoadingProducts && newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!isLoadingProducts && newArrivals.length === 0 && (
              <div className="col-span-full text-sm text-[#737373]">No products available.</div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/5] bg-[#EAE7E0]">
              <PlaceholderImage text="ROOM INSPIRATION" />
            </div>
            <div className="max-w-md ml-auto mr-auto lg:ml-12 lg:mr-0 text-center lg:text-left">
              <span className="text-sm tracking-widest uppercase text-[#9E9B94] mb-4 block">Inspiration</span>
              <h2 className="text-4xl font-serif mb-6">A Calm Sanctuary</h2>
              <p className="text-[#737373] mb-8 leading-relaxed">
                Create a space for pause and reflection. Soft hues, natural materials, and organic silhouettes come together to form a balanced bedroom oasis.
              </p>
              <Link to="/rooms/bedroom" className="inline-block border border-[#2D2D2D] px-8 py-3 text-sm font-medium tracking-widest uppercase hover:bg-[#2D2D2D] hover:text-white transition-colors">
                Shop the Room
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-[60vh] bg-[#DCD5C6] flex items-center justify-center">
        <div className="absolute inset-0">
          <PlaceholderImage text="EDITORIAL BANNER" />
        </div>
        <div className="relative z-10 text-center bg-white/90 p-12 max-w-lg mx-6">
          <h2 className="text-3xl font-serif mb-4">The Kitchen Collection</h2>
          <p className="text-[#737373] mb-6">Elevate everyday rituals with our new kitchen accessories.</p>
          <Link to="/shop/kitchen" className="text-sm font-medium tracking-widest uppercase hover:underline">Discover Now</Link>
        </div>
      </section>

      <section className="border-t border-[#EAE7E0] py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <h4 className="font-medium text-sm tracking-wide uppercase mb-2">Free Delivery</h4>
              <p className="text-[#9E9B94] text-sm">On orders over EUR 150</p>
            </div>
            <div>
              <h4 className="font-medium text-sm tracking-wide uppercase mb-2">30 Days Return</h4>
              <p className="text-[#9E9B94] text-sm">Return within 30 days</p>
            </div>
            <div>
              <h4 className="font-medium text-sm tracking-wide uppercase mb-2">Secure Payment</h4>
              <p className="text-[#9E9B94] text-sm">100% secure checkout</p>
            </div>
            <div>
              <h4 className="font-medium text-sm tracking-wide uppercase mb-2">Customer Care</h4>
              <p className="text-[#9E9B94] text-sm">We're here to help</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
