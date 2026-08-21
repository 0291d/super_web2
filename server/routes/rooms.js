import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Room } from '../models/Room.js';

const router = Router();

const defaultRooms = [
  'Living Room',
  'Dining Room',
  'Kitchen',
  'Hallway',
  'Bedroom',
  'Bathroom',
  'Office',
  'Green Space',
];

router.get('/', async (_req, res, next) => {
  try {
    const savedRooms = await Room.find();
    const savedByName = new Map(savedRooms.map((room) => [room.name, room]));

    const rooms = defaultRooms.map((name) => {
      const savedRoom = savedByName.get(name);
      return {
        id: name,
        name,
        imageUrl: savedRoom?.imageUrl || '',
      };
    });

    res.json(rooms);
  } catch (error) {
    next(error);
  }
});

router.put('/:name', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const imageUrl = String(req.body.imageUrl || '').trim();

    const room = await Room.findOneAndUpdate(
      { name },
      { name, imageUrl },
      { new: true, runValidators: true, upsert: true },
    );

    res.json(room);
  } catch (error) {
    next(error);
  }
});

export default router;
