import React from 'react';
import { Link } from 'react-router';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#2D2D2D] text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          
          <div className="lg:col-span-2">
            <h3 className="font-serif text-2xl mb-6">Join our newsletter</h3>
            <p className="text-sm text-[#A3A3A3] mb-6 max-w-sm">
              Sign up to receive news, inspiration, and a 10% discount on your next purchase.
            </p>
            <form className="flex border-b border-[#525252] pb-2 max-w-sm">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-transparent flex-1 focus:outline-none text-sm placeholder:text-[#737373]"
              />
              <button type="submit" className="text-sm font-medium tracking-wide uppercase">Subscribe</button>
            </form>
          </div>

          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#A3A3A3]">Customer Service</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/service/contact-us" className="hover:text-[#A3A3A3] transition-colors">Contact Us</Link></li>
              <li><Link to="/service/delivery-returns" className="hover:text-[#A3A3A3] transition-colors">Delivery & Returns</Link></li>
              <li><Link to="/service/care-maintenance" className="hover:text-[#A3A3A3] transition-colors">Care & Maintenance</Link></li>
              <li><Link to="/service/faq" className="hover:text-[#A3A3A3] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#A3A3A3]">Shop</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/shop/furniture" className="hover:text-[#A3A3A3] transition-colors">Furniture</Link></li>
              <li><Link to="/shop/lighting" className="hover:text-[#A3A3A3] transition-colors">Lighting</Link></li>
              <li><Link to="/shop/accessories" className="hover:text-[#A3A3A3] transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#A3A3A3]">Our World</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/inspiration" className="hover:text-[#A3A3A3] transition-colors">Inspiration</Link></li>
              <li><Link to="/rooms" className="hover:text-[#A3A3A3] transition-colors">Rooms</Link></li>
              <li><Link to="/styling" className="hover:text-[#A3A3A3] transition-colors">Styling Sessions</Link></li>
              <li><Link to="/professionals" className="hover:text-[#A3A3A3] transition-colors">Professionals</Link></li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-[#525252] text-sm text-[#A3A3A3]">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <Link to="/service/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/service/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/service/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
          
          <div className="flex gap-6 mb-6 md:mb-0">
            <Instagram className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <Facebook className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <Twitter className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <Youtube className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <span>Global (EN)</span>
            <span>EUR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
