import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { X, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PlaceholderImage } from './PlaceholderImage';

export function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen } = useGlobal();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!isSearchOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    navigate(`/shop?q=${query}`);
  };

  return (
    <div className="fixed inset-0 bg-[#F9F8F6] z-[60] flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-[#EAE7E0]">
        <div className="w-8" /> {/* Spacer */}
        <span className="font-serif text-xl tracking-wide uppercase">Search</span>
        <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-[#EAE7E0] rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative mb-16">
          <input
            type="text"
            placeholder="Search products, rooms, inspiration..."
            className="w-full text-2xl md:text-4xl font-serif bg-transparent border-b-2 border-[#2D2D2D] pb-4 focus:outline-none placeholder:text-[#9E9B94]"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="absolute right-0 bottom-4">
            <Search className="w-8 h-8 text-[#2D2D2D]" />
          </button>
        </form>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#9E9B94]">Popular Searches</h3>
            <ul className="space-y-4 text-lg">
              <li><Link to="/shop?subcategory=Modular%20Sofas" onClick={() => setIsSearchOpen(false)} className="hover:text-[#9E9B94]">Modular Sofas</Link></li>
              <li><Link to="/shop?subcategory=Portable%20Lamps" onClick={() => setIsSearchOpen(false)} className="hover:text-[#9E9B94]">Portable Lamps</Link></li>
              <li><Link to="/shop?subcategory=Vases" onClick={() => setIsSearchOpen(false)} className="hover:text-[#9E9B94]">Vases</Link></li>
              <li><Link to="/shop?category=Outdoor%20Living" onClick={() => setIsSearchOpen(false)} className="hover:text-[#9E9B94]">Outdoor Furniture</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#9E9B94]">Suggested Products</h3>
            <div className="grid grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Link to={`/product/${i}`} onClick={() => setIsSearchOpen(false)} key={i} className="group flex items-center gap-4">
                  <div className="w-20 h-20 bg-[#EAE7E0]">
                    <PlaceholderImage text={`PROD ${i}`} />
                  </div>
                  <div>
                    <h4 className="font-medium group-hover:text-[#9E9B94] transition-colors">Minimalist Chair {i}</h4>
                    <p className="text-sm text-[#9E9B94]">€299.00</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
