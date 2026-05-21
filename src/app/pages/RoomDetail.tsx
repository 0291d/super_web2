import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getProducts } from '../api/products';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../context/GlobalContext';
import { roomNameFromSlug } from '../data/rooms';

export function RoomDetail() {
  const { id } = useParams();
  const roomName = roomNameFromSlug(id);
  const [roomProducts, setRoomProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getProducts({ sort: 'newest' })
      .then((products) => {
        if (!isMounted) return;
        const matchingProducts = products.filter((product) => product.room?.includes(roomName)).slice(0, 4);
        setRoomProducts(matchingProducts.length ? matchingProducts : products.slice(0, 4));
      })
      .catch(() => {
        if (isMounted) setRoomProducts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomName]);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] w-full">
        <PlaceholderImage text={`${roomName.toUpperCase()} INSPIRATION`} />
      </section>

      {/* Intro */}
      <section className="container mx-auto px-6 py-20 text-center max-w-3xl">
        <h1 className="text-5xl font-serif mb-8">{roomName}</h1>
        <p className="text-lg text-[#737373] leading-relaxed">
          Create a space for life to unfold. Our {roomName.toLowerCase()} collection combines comfort with sculptural aesthetics to form a harmonious environment that invites relaxation and connection.
        </p>
      </section>

      {/* Shop the Room */}
      <section className="bg-[#F9F8F6] py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="md:w-1/2">
              <div className="aspect-square bg-[#EAE7E0] relative">
                <PlaceholderImage text="ROOM HOTSPOTS" />
                {/* Mock Hotspots */}
                <div className="absolute top-[40%] left-[30%] w-4 h-4 bg-white rounded-full shadow-lg border border-[#EAE7E0] cursor-pointer animate-pulse" />
                <div className="absolute top-[60%] left-[60%] w-4 h-4 bg-white rounded-full shadow-lg border border-[#EAE7E0] cursor-pointer animate-pulse" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-serif mb-8">Shop the Room</h2>
              <div className="grid grid-cols-2 gap-6">
                {isLoadingProducts && <div className="col-span-full text-sm text-[#737373]">Loading products...</div>}
                {!isLoadingProducts && roomProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {!isLoadingProducts && roomProducts.length === 0 && (
                  <div className="col-span-full text-sm text-[#737373]">No room products available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Stories */}
      <section className="py-20 border-t border-[#EAE7E0]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl font-serif">Stories</h2>
            <Link to="/inspiration" className="text-sm font-medium tracking-widest uppercase hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Link to={`/inspiration/${i}`} key={i} className="group">
                <div className="aspect-[4/3] bg-[#EAE7E0] mb-6 overflow-hidden">
                  <PlaceholderImage text={`STORY ${i}`} className="transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="text-xs tracking-widest uppercase text-[#9E9B94] mb-3">Interior Design</p>
                <h3 className="text-xl font-serif group-hover:text-[#737373] transition-colors">A Home Designed for Slow Living</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
