import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { shopLinkFor, shopMenu } from '../data/shopMenu';

function accountDestination(role?: string) {
  if (role === 'admin') return '/admin';
  if (role === 'warehouse') return '/warehouse';
  if (role === 'accountant') return '/accountant';
  return '/account';
}

export function Header() {
  const { cartCount, setIsCartOpen, setIsSearchOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useGlobal();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeShopCategory, setActiveShopCategory] = useState('Furniture');
  const highlightsMenu = shopMenu[0];
  const categoryMenu = shopMenu.slice(1);
  const activeShopMenu = shopMenu.find((item) => item.title === activeShopCategory) || categoryMenu[0];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled || activeMenu ? 'bg-[#F9F8F6] border-b border-[#EAE7E0] py-4' : 'bg-transparent py-6'
        }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="text-2xl font-serif tracking-widest uppercase font-semibold">
              BREW
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <div 
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => {
                setActiveMenu('shop');
                setActiveShopCategory((current) => current || 'Furniture');
              }}
            >
              <Link to="/shop" className="text-sm font-medium tracking-wide hover:text-[#9E9B94] transition-colors">Shop</Link>
            </div>
            <Link to="/inspire" className="text-sm font-medium tracking-wide hover:text-[#9E9B94] transition-colors">Inspire</Link>
            <Link to="/rooms" className="text-sm font-medium tracking-wide hover:text-[#9E9B94] transition-colors">Rooms</Link>
            <Link to="/professionals" className="text-sm font-medium tracking-wide hover:text-[#9E9B94] transition-colors">Professionals</Link>
          </nav>

          <div className="flex items-center gap-4 lg:gap-6">
            <button onClick={() => setIsSearchOpen(true)} className="hover:text-[#9E9B94] transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/wishlist" className="hover:text-[#9E9B94] transition-colors hidden sm:block">
              <Heart className="w-5 h-5" />
            </Link>
            {user ? (
              <Link
                to={accountDestination(user.role)}
                className="hover:text-[#9E9B94] transition-colors hidden lg:block"
                aria-label="Account"
                title={user.email}
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/login" className="hover:text-[#9E9B94] transition-colors hidden lg:block" aria-label="Sign in">
                <User className="w-5 h-5" />
              </Link>
            )}
            <button onClick={() => setIsCartOpen(true)} className="hover:text-[#9E9B94] transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#2D2D2D] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu */}
        {activeMenu && (
          <div className="absolute top-full left-0 w-full bg-[#F9F8F6] border-b border-[#EAE7E0] shadow-sm hidden lg:block">
            <div className="container mx-auto px-6 py-12 min-h-[520px] grid grid-cols-12 gap-12">
              <div className="col-span-4">
                <ul className="space-y-4">
                  {highlightsMenu.links.map((link) => (
                    <li key={link}>
                      <Link
                        to={shopLinkFor(highlightsMenu.title, link)}
                        className="text-lg text-[#2D2D2D] hover:text-[#9E9B94] transition-colors"
                        onClick={() => setActiveMenu(null)}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-4">
                <ul className="space-y-4">
                  {categoryMenu.map((column) => (
                    <li key={column.title}>
                      <Link
                        to={shopLinkFor(column.title)}
                        className={`text-lg transition-colors ${
                          activeShopCategory === column.title ? 'text-[#2D2D2D] underline underline-offset-4' : 'text-[#9E9B94] hover:text-[#2D2D2D]'
                        }`}
                        onMouseEnter={() => setActiveShopCategory(column.title)}
                        onFocus={() => setActiveShopCategory(column.title)}
                        onClick={() => setActiveMenu(null)}
                      >
                        {column.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3">
                <ul className="space-y-4">
                  {activeShopMenu.links.map((link) => (
                    <li key={link}>
                      <Link
                        to={shopLinkFor(activeShopMenu.title, link)}
                        className="text-lg text-[#2D2D2D] hover:text-[#9E9B94] transition-colors"
                        onClick={() => setActiveMenu(null)}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2" />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#F9F8F6] z-50 flex flex-col lg:hidden">
          <div className="flex justify-between items-center p-6 border-b border-[#EAE7E0]">
            <Link to="/" className="text-2xl font-serif tracking-widest uppercase font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              BREW
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-xl font-serif">
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
            <Link to="/inspire" onClick={() => setIsMobileMenuOpen(false)}>Inspire</Link>
            <Link to="/rooms" onClick={() => setIsMobileMenuOpen(false)}>Rooms</Link>
            <Link to="/professionals" onClick={() => setIsMobileMenuOpen(false)}>Professionals</Link>
            <div className="h-px bg-[#EAE7E0] my-4" />
            <div className="flex flex-col gap-4 text-base font-sans">
              {user ? (
                <Link
                  to={accountDestination(user.role)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <User className="w-5 h-5"/> {user.firstName || 'Account'}
                </Link>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3"><User className="w-5 h-5"/> Account</Link>
              )}
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3"><Heart className="w-5 h-5"/> Wishlist</Link>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }} className="flex items-center gap-3"><Search className="w-5 h-5"/> Search</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
