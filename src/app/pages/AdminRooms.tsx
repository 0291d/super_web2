import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getProducts, ProductDetail } from '../api/products';
import { getRooms, RoomSetting, updateRoom } from '../api/rooms';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { roomOptions, roomSlug } from '../data/rooms';
import { readImageFiles } from '../lib/fileImages';

export function AdminRooms() {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [rooms, setRooms] = useState<RoomSetting[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0]);
  const [roomImageUrl, setRoomImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'admin') return navigate('/');

    setIsLoading(true);
    Promise.all([getProducts({ sort: 'newest' }), getRooms()])
      .then(([productData, roomData]) => {
        setProducts(productData);
        setRooms(roomData);
        setRoomImageUrl(roomData.find((room) => room.name === selectedRoom)?.imageUrl || '');
      })
      .catch(() => toast.error('Unable to load room products'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, location.pathname, navigate, user]);

  useEffect(() => {
    setRoomImageUrl(rooms.find((room) => room.name === selectedRoom)?.imageUrl || '');
  }, [rooms, selectedRoom]);

  const roomCounts = useMemo(() => {
    return roomOptions.reduce<Record<string, number>>((counts, room) => {
      counts[room] = products.filter((product) => product.room?.includes(room)).length;
      return counts;
    }, {});
  }, [products]);

  const roomProducts = useMemo(() => {
    return products.filter((product) => product.room?.includes(selectedRoom));
  }, [products, selectedRoom]);

  async function handleRoomImageFiles(files: FileList | null) {
    try {
      const [image] = await readImageFiles(files);
      if (image) setRoomImageUrl(image);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  async function handleSaveRoomImage() {
    setIsSavingImage(true);
    try {
      const savedRoom = await updateRoom(selectedRoom, roomImageUrl);
      setRooms((current) => {
        const exists = current.some((room) => room.name === savedRoom.name);
        if (exists) return current.map((room) => (room.name === savedRoom.name ? savedRoom : room));
        return [...current, savedRoom];
      });
      toast.success('Room image updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update room image');
    } finally {
      setIsSavingImage(false);
    }
  }

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
                  Update the room image and review products assigned to this room.
                </p>
              </div>
              <Link to={`/rooms/${roomSlug(selectedRoom)}`} className="text-sm font-medium uppercase tracking-widest underline">
                View public page
              </Link>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 border border-[#EAE7E0] bg-[#F9F8F6] p-4 md:grid-cols-[220px_1fr]">
              <div className="aspect-[4/5] bg-[#EAE7E0]">
                <PlaceholderImage text={selectedRoom.toUpperCase()} src={roomImageUrl} alt={selectedRoom} />
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Room Image URL</span>
                  <input
                    value={roomImageUrl}
                    onChange={(event) => setRoomImageUrl(event.target.value)}
                    className="w-full border border-[#EAE7E0] bg-white px-3 py-2"
                    placeholder="Paste image URL or upload a file"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleRoomImageFiles(event.target.files)}
                    className="w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isSavingImage}
                    onClick={handleSaveRoomImage}
                    className="bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50"
                  >
                    {isSavingImage ? 'Saving...' : 'Save Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomImageUrl('')}
                    className="border border-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>
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
