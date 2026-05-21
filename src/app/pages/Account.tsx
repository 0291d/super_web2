import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getMyOrders, Order } from '../api/orders';
import { ProductCard } from '../components/ProductCard';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { useGlobal } from '../context/GlobalContext';

type AccountSection = 'details' | 'addresses' | 'orders' | 'wishlist' | null;

type Address = {
  label: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
};

const emptyAddress: Address = {
  label: 'Preferred',
  firstName: '',
  lastName: '',
  address1: '',
  city: '',
  postalCode: '',
  country: 'Vietnam',
  phone: '',
};

export function Account() {
  const { user, isAuthLoading, updateProfile, logout } = useAuth();
  const { wishlist } = useGlobal();
  const [activeSection, setActiveSection] = useState<AccountSection>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState<Address>(user?.addresses?.[0] || emptyAddress);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [isAuthLoading, location.pathname, navigate, user]);

  useEffect(() => {
    if (activeSection !== 'orders' || !user) return;

    setIsLoadingOrders(true);
    getMyOrders()
      .then(setOrders)
      .catch(() => toast.error('Unable to load order history'))
      .finally(() => setIsLoadingOrders(false));
  }, [activeSection, user]);

  useEffect(() => {
    if (user?.addresses?.[0]) {
      setAddress(user.addresses[0]);
    }
  }, [user]);

  if (isAuthLoading || !user) {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking account...</div>;
  }

  async function handleDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await updateProfile({
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        newsletter: formData.get('newsletter') === 'on',
      });
      setIsEditingDetails(false);
      toast.success('Account updated');
    } catch {
      toast.error('Unable to update account');
    }
  }

  async function handleAddressSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextAddress = {
      label: String(formData.get('label') || 'Preferred'),
      firstName: String(formData.get('firstName') || ''),
      lastName: String(formData.get('lastName') || ''),
      address1: String(formData.get('address1') || ''),
      city: String(formData.get('city') || ''),
      postalCode: String(formData.get('postalCode') || ''),
      country: String(formData.get('country') || 'Vietnam'),
      phone: String(formData.get('phone') || ''),
    };

    try {
      await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        newsletter: user.newsletter,
        addresses: [nextAddress],
      });
      setAddress(nextAddress);
      setIsEditingAddress(false);
      toast.success('Address updated');
    } catch {
      toast.error('Unable to update address');
    }
  }

  async function deleteAddress() {
    try {
      await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        newsletter: user.newsletter,
        addresses: [],
      });
      setAddress(emptyAddress);
      toast.success('Address deleted');
    } catch {
      toast.error('Unable to delete address');
    }
  }

  function sectionButton(section: Exclude<AccountSection, null>, label: string) {
    return (
      <button
        type="button"
        onClick={() => setActiveSection((current) => (current === section ? null : section))}
        className="block font-serif text-4xl leading-tight text-[#242424] hover:text-[#737373]"
      >
        {label}
      </button>
    );
  }

  const fieldClass = 'w-full max-w-sm border-b border-[#2D2D2D] bg-transparent py-2 text-base focus:outline-none';
  const actionClass = 'border-b border-[#2D2D2D] pb-1 text-base font-medium';

  return (
    <div className="container mx-auto min-h-[70vh] px-6 py-16">
      <h1 className="mb-12 font-serif text-7xl leading-none text-[#3A3A3A] max-md:text-5xl">My Account</h1>

      <div className="max-w-3xl space-y-9">
        <div>
          {sectionButton('details', 'Details')}
          {activeSection === 'details' && (
            <div className="mt-5 space-y-5 text-lg">
              {isEditingDetails ? (
                <form onSubmit={handleDetailsSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="block text-sm font-medium">First name</span>
                      <input name="firstName" defaultValue={user.firstName} className={fieldClass} />
                    </label>
                    <label>
                      <span className="block text-sm font-medium">Last name</span>
                      <input name="lastName" defaultValue={user.lastName} className={fieldClass} />
                    </label>
                  </div>
                  <p>{user.email}</p>
                  <label className="flex items-center gap-3 text-base">
                    <input name="newsletter" type="checkbox" defaultChecked={Boolean(user.newsletter)} />
                    Newsletter subscription
                  </label>
                  <div className="flex gap-5">
                    <button className={actionClass}>Save</button>
                    <button type="button" onClick={() => setIsEditingDetails(false)} className={actionClass}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name saved'}</p>
                    <p>{user.email}</p>
                    <p className="text-[#737373]">{user.newsletter ? 'Newsletter enabled' : 'Newsletter disabled'}</p>
                  </div>
                  <button type="button" onClick={() => setIsEditingDetails(true)} className={actionClass}>Edit</button>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          {sectionButton('addresses', 'Addresses')}
          {activeSection === 'addresses' && (
            <div className="mt-4 space-y-8 text-lg">
              {isEditingAddress ? (
                <form onSubmit={handleAddressSubmit} className="space-y-5">
                  <input name="label" defaultValue={address.label} className={fieldClass} aria-label="Address label" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="firstName" defaultValue={address.firstName} placeholder="First name" className={fieldClass} />
                    <input name="lastName" defaultValue={address.lastName} placeholder="Last name" className={fieldClass} />
                  </div>
                  <input name="address1" defaultValue={address.address1} placeholder="Address" className={fieldClass} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <input name="city" defaultValue={address.city} placeholder="City" className={fieldClass} />
                    <input name="postalCode" defaultValue={address.postalCode} placeholder="Postal code" className={fieldClass} />
                    <input name="country" defaultValue={address.country} placeholder="Country" className={fieldClass} />
                  </div>
                  <input name="phone" defaultValue={address.phone} placeholder="Phone" className={fieldClass} />
                  <div className="flex gap-5">
                    <button className={actionClass}>Save</button>
                    <button type="button" onClick={() => setIsEditingAddress(false)} className={actionClass}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="inline-block border-t border-[#2D2D2D] pt-3">
                    <p className="font-medium">{address.label}</p>
                    {[address.firstName, address.lastName].filter(Boolean).length > 0 && (
                      <p>{[address.firstName, address.lastName].filter(Boolean).join(' ')}</p>
                    )}
                    {address.address1 && <p>{address.address1}</p>}
                    {[address.city, address.postalCode].filter(Boolean).length > 0 && (
                      <p>{[address.city, address.postalCode].filter(Boolean).join(', ')}</p>
                    )}
                    <p>{address.country}</p>
                    {address.phone && <p>{address.phone}</p>}
                  </div>
                  <div className="flex gap-5">
                    <button type="button" onClick={() => setIsEditingAddress(true)} className={actionClass}>Edit</button>
                    <button type="button" onClick={deleteAddress} className={actionClass}>Delete</button>
                  </div>
                  <button type="button" onClick={() => setIsEditingAddress(true)} className={actionClass}>Add a New Address</button>
                </>
              )}
            </div>
          )}
        </div>

        <div>
          {sectionButton('orders', 'Order history')}
          {activeSection === 'orders' && (
            <div className="mt-5 space-y-6 text-lg">
              {isLoadingOrders ? (
                <p className="text-[#737373]">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-[#737373]">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border-t border-[#2D2D2D] pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId((current) => (current === order.id ? '' : order.id))}
                      className="block text-left"
                    >
                      <span className="block font-medium">{order.orderNumber}</span>
                      <span className="block text-base text-[#737373]">
                        {new Date(order.createdAt).toLocaleDateString()} - {order.currency} {order.total.toFixed(2)} - {order.status}
                      </span>
                    </button>

                    {expandedOrderId === order.id && (
                      <div className="mt-5 space-y-5 text-base">
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.id || item.productId}`} className="flex gap-4">
                              <div className="h-20 w-16 shrink-0 bg-[#EAE7E0]">
                                <PlaceholderImage text="ORDER" src={item.imageUrl} alt={item.name} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-[#737373]">Qty {item.quantity}</p>
                              </div>
                              <p className="font-medium">{order.currency} {item.lineTotal.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-6 border-t border-[#EAE7E0] pt-5 md:grid-cols-2">
                          <div>
                            <p className="font-medium">Shipping address</p>
                            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p>{order.shippingAddress.address1}</p>
                            {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>{order.currency} {order.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Shipping</span><span>{order.currency} {order.shippingTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Tax</span><span>{order.currency} {order.taxTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between font-medium"><span>Total</span><span>{order.currency} {order.total.toFixed(2)}</span></div>
                          </div>
                        </div>

                        <Link to={`/order-confirmation/${order.orderNumber}`} className={actionClass}>
                          View order page
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          {sectionButton('wishlist', 'Wishlist')}
          {activeSection === 'wishlist' && (
            <div className="mt-6">
              {wishlist.length === 0 ? (
                <p className="text-lg text-[#737373]">No wishlist items yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {wishlist.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="pt-10 text-lg font-medium"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
