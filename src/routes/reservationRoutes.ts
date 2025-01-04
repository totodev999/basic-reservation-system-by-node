import express from 'express';

import { prisma } from '../db/dbClient';
import { ReservationUsecase } from '../usecases/ReservationUsecase';
import { z } from 'zod';
import dayjs from 'dayjs';

const router = express.Router();

// 定数としてエラーメッセージを定義
const ERROR_MESSAGES = {
  MISSING_PARAMS: 'storeId と reservationTypeId は必須です。',
  INVALID_PARAMS: 'storeId と reservationTypeId は数値である必要があります。',
  RESERVATION_TYPE_NOT_FOUND: '指定された reservationTypeId が存在しません。',
  NO_STAFF_AVAILABLE:
    '指定された予約タイプに対応可能なスタッフが存在しません。',
  FAILED_TO_FETCH_SLOTS: '予約可能枠の取得に失敗しました。',
};

// ユーティリティ関数：パラメータのバリデーション
const validateParams = (
  req: express.Request
): { storeId: number; reservationTypeId: number } | null => {
  const { storeId, reservationTypeId } = req.query;

  if (!storeId || !reservationTypeId) {
    return null;
  }

  const storeIdNum = parseInt(storeId as string, 10);
  const reservationTypeIdNum = parseInt(reservationTypeId as string, 10);

  if (isNaN(storeIdNum) || isNaN(reservationTypeIdNum)) {
    return null;
  }

  return { storeId: storeIdNum, reservationTypeId: reservationTypeIdNum };
};

router.get('/available', async (req, res) => {
  try {
    const params = validateParams(req);
    if (!params) {
      res.status(400).json({ error: ERROR_MESSAGES.MISSING_PARAMS });
      return;
    }

    const { storeId, reservationTypeId } = params;

    const reservationUsecase = new ReservationUsecase();
    const availableSlots = await reservationUsecase.getAvailable(
      storeId,
      reservationTypeId
    );

    res.json({ availableSlots });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: error?.message
        ? error.message
        : ERROR_MESSAGES.FAILED_TO_FETCH_SLOTS,
    });
  }
});

// 予約一覧取得
router.get('/', async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        store: true,
        reservationType: true,
        staff: true,
      },
    });
    res.json(reservations);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: error?.message ? error.message : 'Failed to fetch reservations',
    });
  }
});

// 予約作成
router.post('/', async (req, res) => {
  try {
    console.log(req.body);
    console.log(dayjs(req.body.date).isBefore(dayjs()));
    const requestObj = z.object({
      body: z
        .object({
          storeId: z.number(),
          reservationTypeId: z.number(),
          userEmail: z.string().email(),
          startTime: z.string(),
          date: z.string().refine((value) => !dayjs(value).isBefore(dayjs()), {
            message: 'Reservation time cannot be in the past',
          }),
        })
        .refine((value) => dayjs(value.date + value.startTime).isValid(), {
          message: 'Invalid date format',
        })
        .refine(
          (value) => !dayjs(value.date + value.startTime).isBefore(dayjs()),
          {
            message: 'Reservation time cannot be in the past',
          }
        ),
    });

    const { data: requestBody, error } = requestObj.safeParse(req);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const reservationUsecase = new ReservationUsecase();
    const newReservation = await reservationUsecase.createReservation(
      requestBody.body
    );

    res.status(201).json(newReservation);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message ? error?.message : 'Failed to create reservation',
    });
  }
});
// 予約詳細取得
router.get('/:id', async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        store: true,
        reservationType: true,
        staff: true,
      },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// // 予約更新
// router.put('/:id', async (req, res) => {
//   try {
//     const reservationId = Number(req.params.id);
//     const {
//       storeId,
//       reservationTypeId,
//       staffId,
//       userEmail,
//       startTime,
//       endTime,
//       status,
//     } = req.body;

//     const updatedReservation = await prisma.reservation.update({
//       where: { id: reservationId },
//       data: {
//         storeId,
//         reservationTypeId,
//         staffId,
//         userEmail,
//         startTime: startTime ? new Date(startTime) : undefined,
//         endTime: endTime ? new Date(endTime) : undefined,
//         status,
//       },
//     });

//     res.json(updatedReservation);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to update reservation' });
//   }
// });

// 予約削除
router.delete('/:id', async (req, res) => {
  try {
    const reservationId = Number(req.params.id);

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

export default router;
