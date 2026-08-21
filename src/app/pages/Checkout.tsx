import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createOrder, getMyOrders } from '../api/orders';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { useGlobal } from '../context/GlobalContext';

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function Checkout() {
  const { cart, cartTotal, clearCart } = useGlobal();
  const { user } = useAuth();
  const [sameBilling, setSameBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'card_demo'>('vnpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setPreviousOrderCount(null);
      return;
    }

    getMyOrders()
      .then((orders) => {
        if (isMounted) {
          setPreviousOrderCount(orders.filter((order) => order.status !== 'cancelled').length);
        }
      })
      .catch(() => {
        if (isMounted) setPreviousOrderCount(null);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const discountRate = user && previousOrderCount !== null ? (previousOrderCount === 0 ? 0.1 : cartTotal > 500 ? 0.05 : 0) : 0;
  const discountTotal = roundMoney(cartTotal * discountRate);
  const discountedSubtotal = roundMoney(Math.max(0, cartTotal - discountTotal));
  const shippingTotal = cartTotal >= 150 ? 0 : 15;
  const taxTotal = roundMoney(discountedSubtotal * 0.08);
  const total = roundMoney(discountedSubtotal + shippingTotal + taxTotal);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    const shippingAddress = {
      firstName: String(formData.get('shippingFirstName') || ''),
      lastName: String(formData.get('shippingLastName') || ''),
      company: String(formData.get('shippingCompany') || ''),
      address1: String(formData.get('shippingAddress1') || ''),
      address2: String(formData.get('shippingAddress2') || ''),
      city: String(formData.get('shippingCity') || ''),
      postalCode: String(formData.get('shippingPostalCode') || ''),
      country: String(formData.get('shippingCountry') || ''),
      phone: String(formData.get('shippingPhone') || ''),
    };

    const billingAddress = sameBilling
      ? shippingAddress
      : {
          firstName: String(formData.get('billingFirstName') || ''),
          lastName: String(formData.get('billingLastName') || ''),
          company: String(formData.get('billingCompany') || ''),
          address1: String(formData.get('billingAddress1') || ''),
          address2: String(formData.get('billingAddress2') || ''),
          city: String(formData.get('billingCity') || ''),
          postalCode: String(formData.get('billingPostalCode') || ''),
          country: String(formData.get('billingCountry') || ''),
          phone: String(formData.get('billingPhone') || ''),
        };

    try {
      const order = await createOrder({
        email: String(formData.get('email') || ''),
        items: cart,
        shippingAddress,
        billingAddress,
        paymentMethod,
        deliveryMethod: String(formData.get('deliveryMethod') || 'standard'),
        notes: String(formData.get('notes') || ''),
      });
      clearCart();
      if (order.paymentUrl) {
        toast.success('Redirecting to VNPay');
        window.location.href = order.paymentUrl;
        return;
      }

      toast.success('Order placed');
      navigate(`/order-confirmation/${order.orderNumber}?token=${encodeURIComponent(order.publicToken || '')}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place order');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h1 className="mb-6 font-serif text-4xl">Your cart is empty</h1>
        <Link to="/shop" className="inline-block bg-[#2D2D2D] px-10 py-4 text-sm font-medium uppercase tracking-widest text-white hover:bg-black">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const fieldClass = 'w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none';
  const labelClass = 'mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]';

  function AddressFields({ prefix }: { prefix: 'shipping' | 'billing' }) {
    const title = prefix === 'shipping' ? 'Shipping Address' : 'Billing Address';
    return (
      <section className="space-y-6">
        <h2 className="font-serif text-2xl">{title}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>First Name</span>
            <input name={`${prefix}FirstName`} required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Last Name</span>
            <input name={`${prefix}LastName`} required className={fieldClass} />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Company</span>
            <input name={`${prefix}Company`} className={fieldClass} />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Address</span>
            <input name={`${prefix}Address1`} required className={fieldClass} />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Apartment, suite, etc.</span>
            <input name={`${prefix}Address2`} className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>City</span>
            <input name={`${prefix}City`} required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Postal Code</span>
            <input name={`${prefix}PostalCode`} required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Country</span>
            <input name={`${prefix}Country`} defaultValue="Vietnam" required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Phone</span>
            <input name={`${prefix}Phone`} className={fieldClass} />
          </label>
        </div>
      </section>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="mb-12 font-serif text-4xl">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_420px]">
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="font-serif text-2xl">Contact</h2>
            <label>
              <span className={labelClass}>Email</span>
              <input name="email" type="email" defaultValue={user?.email || ''} required className={fieldClass} />
            </label>
          </section>

          <AddressFields prefix="shipping" />

          <section className="space-y-6">
            <label className="flex items-center gap-3 text-sm text-[#737373]">
              <input type="checkbox" checked={sameBilling} onChange={(event) => setSameBilling(event.target.checked)} />
              Billing address is the same as shipping address
            </label>
            {!sameBilling && <AddressFields prefix="billing" />}
          </section>

          <section className="space-y-6">
            <h2 className="font-serif text-2xl">Delivery</h2>
            <label className="flex cursor-pointer items-center justify-between border border-[#EAE7E0] p-4">
              <span>
                <span className="block font-medium">Standard Delivery</span>
                <span className="text-sm text-[#737373]">3-7 business days for small items</span>
              </span>
              <span>{shippingTotal === 0 ? 'Free' : 'EUR 15.00'}</span>
              <input name="deliveryMethod" value="standard" type="radio" defaultChecked className="sr-only" />
            </label>
          </section>

          <section className="space-y-6">
            <h2 className="font-serif text-2xl">Payment</h2>
            <label className={`block cursor-pointer border p-4 ${paymentMethod === 'vnpay' ? 'border-[#2D2D2D]' : 'border-[#EAE7E0]'}`}>
              <div className="flex items-start gap-3">
                <input
                  name="paymentMethod"
                  type="radio"
                  value="vnpay"
                  checked={paymentMethod === 'vnpay'}
                  onChange={() => setPaymentMethod('vnpay')}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">VNPay</span>
                  <span className="mt-2 block text-sm text-[#737373]">
                    You will be redirected to the VNPay sandbox payment gateway to complete this order.
                  </span>
                </span>
              </div>
            </label>
            <label className={`block cursor-pointer border p-4 ${paymentMethod === 'card_demo' ? 'border-[#2D2D2D]' : 'border-[#EAE7E0]'}`}>
              <div className="flex items-start gap-3">
                <input
                  name="paymentMethod"
                  type="radio"
                  value="card_demo"
                  checked={paymentMethod === 'card_demo'}
                  onChange={() => setPaymentMethod('card_demo')}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">Demo Card Payment</span>
                  <span className="mt-2 block text-sm text-[#737373]">
                    This demo option stores the order immediately with paid status.
                  </span>
                </span>
              </div>
            </label>
            <label>
              <span className={labelClass}>Order Notes</span>
              <textarea name="notes" rows={4} className={fieldClass} />
            </label>
          </section>
        </div>

        <aside className="h-fit border border-[#EAE7E0] bg-[#F9F8F6] p-6 lg:sticky lg:top-28">
          <h2 className="mb-6 font-serif text-2xl">Order Summary</h2>
          <div className="mb-6 space-y-5">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="h-20 w-16 shrink-0 bg-[#EAE7E0]">
                  <PlaceholderImage text={`CHECKOUT ${item.id}`} src={item.imageUrl} alt={item.name} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[#737373]">Qty {item.quantity}</p>
                </div>
                <span className="font-medium">EUR {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t border-[#EAE7E0] pt-6 text-sm">
            <div className="flex justify-between text-[#737373]"><span>Subtotal</span><span>EUR {cartTotal.toFixed(2)}</span></div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-[#737373]">
                <span>{discountRate === 0.1 ? 'First order discount' : 'Account discount'}</span>
                <span>-EUR {discountTotal.toFixed(2)}</span>
              </div>
            )}
            {user && previousOrderCount !== null && previousOrderCount > 0 && cartTotal <= 500 && (
              <div className="text-xs text-[#9E9B94]">5% account discount applies to orders over EUR 500.</div>
            )}
            <div className="flex justify-between text-[#737373]"><span>Shipping</span><span>{shippingTotal === 0 ? 'Free' : `EUR ${shippingTotal.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-[#737373]"><span>Estimated tax</span><span>EUR {taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-[#EAE7E0] pt-4 text-lg font-medium"><span>Total</span><span>EUR {total.toFixed(2)}</span></div>
          </div>
          <button disabled={isSubmitting} className="mt-8 w-full bg-[#2D2D2D] py-4 text-sm font-medium uppercase tracking-widest text-white hover:bg-black disabled:opacity-60">
            {isSubmitting ? 'Placing Order...' : paymentMethod === 'vnpay' ? 'Pay with VNPay' : 'Place Order'}
          </button>
        </aside>
      </form>
    </div>
  );
}
