import React from 'react';
import { Link } from 'react-router';
import { useGlobal } from '../context/GlobalContext';
import { Minus, Plus, X } from 'lucide-react';
import { PlaceholderImage } from '../components/PlaceholderImage';

export function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useGlobal();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="text-4xl font-serif mb-6">Your Cart is Empty</h1>
        <p className="text-[#737373] mb-8">Discover our collection and find something you love.</p>
        <Link to="/shop" className="inline-block bg-[#2D2D2D] text-white px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-serif mb-12">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Cart Items Table */}
        <div className="lg:w-2/3">
          <div className="hidden md:grid grid-cols-12 text-sm font-medium tracking-wide uppercase text-[#9E9B94] border-b border-[#EAE7E0] pb-4 mb-8">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-8">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center border-b border-[#EAE7E0] pb-8">
                <div className="col-span-6 flex gap-6 w-full">
                  <div className="w-24 h-24 bg-[#EAE7E0] flex-shrink-0">
                    <PlaceholderImage text={`CART ${item.id}`} src={item.imageUrl} alt={item.name} />
                  </div>
                  <div>
                    <Link to={`/product/${item.id}`} className="font-serif text-lg hover:text-[#737373] transition-colors">{item.name}</Link>
                    <p className="text-sm text-[#737373] mt-1">{item.subcategory || item.category}</p>
                    <p className="text-sm mt-2 md:hidden">€{item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="col-span-3 w-full md:w-auto flex justify-center">
                  <div className="flex items-center border border-[#EAE7E0]">
                    <button className="px-4 py-2 hover:bg-[#F9F8F6]" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-medium">{item.quantity}</span>
                    <button className="px-4 py-2 hover:bg-[#F9F8F6]" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 w-full md:w-auto text-right font-medium text-lg hidden md:block">
                  €{(item.price * item.quantity).toFixed(2)}
                </div>

                <div className="col-span-1 w-full md:w-auto flex justify-end md:justify-center">
                  <button onClick={() => removeFromCart(item.id)} className="text-[#9E9B94] hover:text-[#2D2D2D]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-[#F9F8F6] border border-[#EAE7E0] p-8">
            <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 border-b border-[#EAE7E0] pb-6">
              <div className="flex justify-between text-[#737373]">
                <span>Subtotal</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#737373]">
                <span>Shipping</span>
                <span>{cartTotal > 150 ? 'Free' : 'Calculated at checkout'}</span>
              </div>
            </div>

            <div className="flex justify-between font-medium text-xl mb-8">
              <span>Total</span>
              <span>€{cartTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-start gap-3 mb-8">
              <input type="checkbox" id="cart-terms" className="mt-1" />
              <label htmlFor="cart-terms" className="text-sm text-[#737373]">
                I agree to the <span className="underline cursor-pointer">Terms & Conditions</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
              </label>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-[#2D2D2D] text-white py-4 text-center text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors mb-4"
            >
              Proceed to Checkout
            </Link>

            <p className="text-center text-xs text-[#9E9B94]">
              Taxes and shipping calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
