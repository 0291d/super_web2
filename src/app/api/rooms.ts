import { authHeaders } from './auth';

export type RoomSetting = {
  id: string;
  name: string;
  imageUrl?: string;
};

export async function getRooms(): Promise<RoomSetting[]> {
  const response = await fetch('/api/rooms');

  if (!response.ok) {
    throw new Error('Unable to load rooms');
  }

  return response.json();
}

export async function updateRoom(name: string, imageUrl: string): Promise<RoomSetting> {
  const response = await fetch(`/api/rooms/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Unable to update room');
  }

  return response.json();
}
