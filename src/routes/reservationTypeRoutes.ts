import express from 'express';

import { prisma } from '../db/dbClient';
import e from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const reservationTypes = await prisma.reservationType.findMany();
    res.json(reservationTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reservation types' });
  }
});

export default router;
