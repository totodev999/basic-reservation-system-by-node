import express from 'express';
import { prisma } from '../db/dbClient';

const router = express.Router();

// 店舗一覧取得
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// 店舗作成
router.post('/', async (req, res) => {
  try {
    const { storeName, address, phoneNumber } = req.body;
    const newStore = await prisma.store.create({
      data: {
        storeName,
        address,
        phoneNumber,
      },
    });
    res.status(201).json(newStore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// 店舗詳細取得
router.get('/:id', async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// 店舗情報更新
router.put('/:id', async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { storeName, address, phoneNumber } = req.body;

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        storeName,
        address,
        phoneNumber,
      },
    });
    res.json(updatedStore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// 店舗削除
router.delete('/:id', async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    await prisma.store.delete({
      where: { id: storeId },
    });
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

export default router;
