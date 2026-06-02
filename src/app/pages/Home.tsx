import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getProducts } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { Product } from '../context/GlobalContext';
import { motion, useReducedMotion } from 'motion/react';

function RevealSection({ className, children }: { className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={reduceMotion ? undefined : { opacity: 0, y: 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

export function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const reduceMotion = useReducedMotion();

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
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={reduceMotion ? undefined : { opacity: 0.45, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <PlaceholderImage text="HERO LIFESTYLE IMAGE" className="opacity-80" />
        </motion.div>
        <motion.div
          className="container mx-auto px-6 relative z-10 text-center text-[#2D2D2D]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.18 } },
          }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-serif mb-6"
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            The Art of Creating Space
          </motion.h1>
          <motion.p
            className="text-lg mb-8 max-w-xl mx-auto"
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            Discover our new collection of carefully crafted pieces designed to bring warmth and balance to your home.
          </motion.p>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="inline-block"
          >
            <Link to="/shop" className="inline-block bg-[#2D2D2D] text-white px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors">
            Explore Collection
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <RevealSection className="py-20 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['New Arrivals', 'Gifts under EUR 100', 'Outdoor Living', 'Classics'].map((title, i) => (
            <motion.div
              key={title}
              initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : i * 0.1 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
            >
              <Link to="/shop" className="group block relative aspect-square overflow-hidden bg-[#F3F1EC] shadow-sm hover:shadow-lg transition-shadow duration-300">
                <PlaceholderImage text={`CATEGORY ${i + 1}`} className="transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                  <h3 className="text-white font-serif text-2xl tracking-wide">{title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="py-20 bg-[#F9F8F6]">
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
      </RevealSection>

      <RevealSection className="py-20">
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
      </RevealSection>

      <RevealSection className="relative h-[60vh] bg-[#DCD5C6] flex items-center justify-center">
        <div className="absolute inset-0">
          <PlaceholderImage text="EDITORIAL BANNER" />
        </div>
        <div className="relative z-10 text-center bg-white/90 p-12 max-w-lg mx-6">
          <h2 className="text-3xl font-serif mb-4">The Kitchen Collection</h2>
          <p className="text-[#737373] mb-6">Elevate everyday rituals with our new kitchen accessories.</p>
          <Link to="/shop/kitchen" className="text-sm font-medium tracking-widest uppercase hover:underline">Discover Now</Link>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-[#EAE7E0] py-12 bg-white">
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
      </RevealSection>
    </div>
  );
}
