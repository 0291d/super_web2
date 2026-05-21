import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getProducts, ProductDetail } from '../api/products';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { roomOptions, roomSlug } from '../data/rooms';

export function AdminRooms() {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'admin') return navigate('/');

    setIsLoading(true);
    getProducts({ sort: 'newest' })
      .then(setProducts)
      .catch(() => toast.error('Unable to load room products'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, user]);

  const roomCounts = useMemo(() => {
    return roomOptions.reduce<Record<string, number>>((counts, room) => {
      counts[room] = products.filter((product) => product.room?.includes(room)).length;
      return counts;
    }, {});
  }, [products]);

  const roomProducts = useMemo(() => {
    return products.filter((product) => product.room?.includes(selectedRoom));
  }, [products, selectedRoom]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Rooms</h1>
          </div>
          <Link to="/admin/products" className="w-fit bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            Assign Products
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="border border-[#EAE7E0] bg-white">
            {roomOptions.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={`flex w-full items-center justify-between border-b border-[#EAE7E0] p-4 text-left hover:bg-[#F9F8F6] ${
                  selectedRoom === room ? 'bg-[#F3F1EC]' : 'bg-white'
                }`}
              >
                <span className="font-medium">{room}</span>
                <span className="text-sm text-[#737373]">{roomCounts[room] || 0}</span>
              </button>
            ))}
          </aside>

          <section className="border border-[#EAE7E0] bg-white p-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-3xl">{selectedRoom}</h2>
                <p className="mt-1 text-sm text-[#737373]">
                  Products assigned to this room. Edit a product to change room placement.
                </p>
              </div>
              <Link to={`/rooms/${roomSlug(selectedRoom)}`} className="text-sm font-medium uppercase tracking-widest underline">
                View public page
              </Link>
            </div>

            {isLoading ? (
              <div className="py-12 text-sm text-[#737373]">Loading products...</div>
            ) : roomProducts.length === 0 ? (
              <div className="bg-[#F9F8F6] p-10 text-center text-sm text-[#737373]">No products assigned to this room yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roomProducts.map((product) => (
                  <Link key={product.id} to="/admin/products" className="flex gap-4 border border-[#EAE7E0] p-4 hover:bg-[#F9F8F6]">
                    <div className="h-24 w-20 shrink-0 bg-[#EAE7E0]">
                      <PlaceholderImage text={`ROOM ${product.id}`} src={product.imageUrl || product.images?.[0]} alt={product.name} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="mt-1 text-sm text-[#737373]">{product.category}</p>
                      <p className="text-sm text-[#9E9B94]">{product.currency || 'EUR'} {product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
