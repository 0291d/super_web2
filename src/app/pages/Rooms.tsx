import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { ArrowRight } from 'lucide-react';
import { getRooms, RoomSetting } from '../api/rooms';
import { roomImages, roomOptions, roomSlug } from '../data/rooms';

export function Rooms() {
  const [rooms, setRooms] = useState<RoomSetting[]>([]);

  useEffect(() => {
    let isMounted = true;

    getRooms()
      .then((data) => {
        if (isMounted) setRooms(data);
      })
      .catch(() => {
        if (isMounted) setRooms([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const imageByRoom = useMemo(() => {
    return rooms.reduce<Record<string, string>>((acc, room) => {
      acc[room.name] = room.imageUrl || '';
      return acc;
    }, {});
  }, [rooms]);

  return (
    <div>
      <div className="bg-[#EAE7E0] py-20 text-center">
        <h1 className="text-5xl font-serif mb-6">Shop by Room</h1>
        <p className="text-[#737373] max-w-xl mx-auto px-6">
          Find inspiration for every space in your home. Explore our curated collections tailored for different rooms and moods.
        </p>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {roomOptions.map((room) => (
            <Link to={`/rooms/${roomSlug(room)}`} key={room} className="group block">
              <div className="aspect-[4/5] bg-[#F9F8F6] overflow-hidden mb-6 relative">
                <PlaceholderImage
                  text={room.toUpperCase()}
                  src={imageByRoom[room] || roomImages[room]}
                  alt={room}
                  className="transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-serif mb-2">{room}</h2>
              <span className="flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-[#737373] group-hover:text-[#2D2D2D] transition-colors">
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
