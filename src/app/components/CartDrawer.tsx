import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { X, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { PlaceholderImage } from './PlaceholderImage';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, cartTotal } = useGlobal();

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#F9F8F6] shadow-xl z-50 flex flex-col transform transition-transform">
        <div className="flex items-center justify-between p-6 border-b border-[#EAE7E0]">
          <h2 className="text-xl font-serif">Your Cart ({cart.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[#EAE7E0] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <p className="text-[#9E9B94]">Your cart is currently empty.</p>
              <Link 
                to="/shop" 
                onClick={() => setIsCartOpen(false)}
                className="px-8 py-3 bg-[#2D2D2D] text-white text-sm tracking-wider uppercase hover:bg-black transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#E8E4DB] p-4 text-sm text-center">
                Free shipping on orders over €150
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0">
                    <PlaceholderImage text={`CART ${item.id}`} src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id)} className="text-[#9E9B94] hover:text-[#2D2D2D]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-[#9E9B94] mt-1">{item.subcategory || item.category}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-[#EAE7E0]">
                        <button 
                          className="px-3 py-1 hover:bg-[#EAE7E0]"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button 
                          className="px-3 py-1 hover:bg-[#EAE7E0]"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#EAE7E0] bg-white">
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total</span>
              <span className="font-medium">€{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-start gap-2 mb-6">
              <input type="checkbox" id="terms" className="mt-1" />
              <label htmlFor="terms" className="text-xs text-[#9E9B94]">
                I agree to the Terms & Conditions and Privacy Policy
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <Link 
                to="/cart"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 bg-[#EAE7E0] text-[#2D2D2D] text-sm tracking-wider uppercase text-center hover:bg-[#DCD5C6] transition-colors"
              >
                Go to Cart
              </Link>
              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 bg-[#2D2D2D] text-white text-sm tracking-wider uppercase text-center hover:bg-black transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
