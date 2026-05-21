import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getOrder, Order } from '../api/orders';

export function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    getOrder(orderNumber)
      .then(setOrder)
      .finally(() => setIsLoading(false));
  }, [orderNumber]);

  if (isLoading) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Loading order...</div>;
  }

  if (!order) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Order not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <div className="bg-[#F9F8F6] border border-[#EAE7E0] p-10 text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-[#9E9B94]">Order Confirmed</p>
        <h1 className="mb-6 font-serif text-4xl">Thank you for your order</h1>
        <p className="mb-8 text-[#737373]">Your demo order has been saved. A confirmation would be sent to {order.email}.</p>
        <div className="mx-auto mb-8 max-w-sm space-y-3 border-y border-[#EAE7E0] py-6 text-sm">
          <div className="flex justify-between"><span>Order number</span><span className="font-medium">{order.orderNumber}</span></div>
          <div className="flex justify-between"><span>Status</span><span className="font-medium capitalize">{order.status}</span></div>
          <div className="flex justify-between"><span>Total</span><span className="font-medium">{order.currency} {order.total.toFixed(2)}</span></div>
        </div>
        <Link to="/shop" className="inline-block bg-[#2D2D2D] px-8 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
