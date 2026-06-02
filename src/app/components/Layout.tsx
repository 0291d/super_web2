import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { SearchOverlay } from './SearchOverlay';

export function Layout() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);

    const pageMeta =
      pathname === '/'
        ? { title: 'BREW | Modern Interior Furniture', description: 'Discover considered furniture, lighting, and home accessories by BREW.' }
        : pathname.startsWith('/shop')
          ? { title: 'Shop | BREW', description: 'Shop furniture, lighting, textiles, and decor selected for everyday living.' }
          : pathname.startsWith('/product/')
            ? { title: 'Product Details | BREW', description: 'View materials, dimensions, care guidance, and availability for this BREW product.' }
            : pathname.startsWith('/rooms')
              ? { title: 'Rooms | BREW', description: 'Explore styled rooms and interior inspiration from BREW.' }
              : pathname.startsWith('/inspire') || pathname.startsWith('/inspiration')
                ? { title: 'Inspiration | BREW', description: 'Read interior stories and discover new ways to shape your space.' }
                : pathname === '/cart'
                  ? { title: 'Shopping Cart | BREW', description: 'Review the pieces in your BREW shopping cart.' }
                  : pathname === '/checkout'
                    ? { title: 'Checkout | BREW', description: 'Complete your BREW order details.' }
                    : pathname === '/wishlist'
                      ? { title: 'Wishlist | BREW', description: 'View your saved BREW pieces.' }
                      : pathname === '/login' || pathname === '/account'
                        ? { title: 'Account | BREW', description: 'Manage your BREW account and order history.' }
                        : { title: 'BREW', description: 'Modern interior furniture and inspiration from BREW.' };

    document.title = pageMeta.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute('content', pageMeta.description);
    const socialTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    socialTitle?.setAttribute('content', pageMeta.title);
    const socialDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    socialDescription?.setAttribute('content', pageMeta.description);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      <main className="flex-grow pt-[88px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduceMotion ? undefined : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
            transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Loading page...</div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
    </div>
  );
}
