import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { getOrder, Order } from '../api/orders';

export function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('token') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    getOrder(orderNumber, accessToken)
      .then(setOrder)
      .finally(() => setIsLoading(false));
  }, [accessToken, orderNumber]);

  if (isLoading) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Loading order...</div>;
  }

  if (!order) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Order not found.</div>;
  }

  const isPaid = order.status === 'paid';
  const title = isPaid ? 'Thank you for your order' : order.status === 'cancelled' ? 'Payment was not completed' : 'Order received';
  const message =
    paymentStatus === 'invalid_signature'
      ? 'VNPay returned an invalid signature, so the payment was rejected.'
      : paymentStatus === 'invalid_amount'
        ? 'VNPay returned an amount that does not match this order, so the payment was rejected.'
      : order.status === 'cancelled'
        ? 'The payment failed or was cancelled. Reserved inventory has been released.'
        : isPaid
          ? `Your order has been saved. A confirmation would be sent to ${order.email}.`
          : `Your order is waiting for payment confirmation. We will update it when payment is completed.`;

  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <div className="bg-[#F9F8F6] border border-[#EAE7E0] p-10 text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-[#9E9B94]">{isPaid ? 'Order Confirmed' : 'Order Status'}</p>
        <h1 className="mb-6 font-serif text-4xl">{title}</h1>
        <p className="mb-8 text-[#737373]">{message}</p>
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
