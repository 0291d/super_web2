export const roomOptions = [
  'Living Room',
  'Dining Room',
  'Kitchen',
  'Hallway',
  'Bedroom',
  'Bathroom',
  'Office',
  'Green Space',
];

export function roomSlug(room: string) {
  return room.toLowerCase().replace(/\s+/g, '-');
}

export function roomNameFromSlug(slug?: string) {
  if (!slug) return 'Room';
  const normalized = slug.replace(/-/g, ' ').toLowerCase();
  return roomOptions.find((room) => room.toLowerCase() === normalized) || normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
