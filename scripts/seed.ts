// src/scripts/seed.ts

import { prisma } from '../src/db/dbClient';
import dayjs from 'dayjs';

async function main() {
  // 全データの削除
  await Promise.all([
    prisma.$executeRawUnsafe(`TRUNCATE TABLE store CASCADE;`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE reservation CASCADE;`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE reservation_type CASCADE;`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE staff CASCADE;`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE store_business_hour CASCADE;`),
  ]);

  // ストアの作成
  const store1 = await prisma.store.create({
    data: {
      storeName: '東京本店',
      address: '東京都千代田区1-1-1',
      phoneNumber: '03-1234-5678',
    },
  });

  const store2 = await prisma.store.create({
    data: {
      storeName: '大阪支店',
      address: '大阪府大阪市2-2-2',
      phoneNumber: '06-8765-4321',
    },
  });

  // 予約タイプの作成
  const consultation = await prisma.reservationType.create({
    data: {
      typeName: '相談',
      defaultMinutes: 30,
      description: '初回相談セッション',
    },
  });

  const contract = await prisma.reservationType.create({
    data: {
      typeName: '契約',
      defaultMinutes: 60,
      description: '契約手続き',
    },
  });

  // スタッフの作成（東京本店）
  const staff1 = await prisma.staff.create({
    data: {
      storeId: store1.id,
      staffName: '佐藤 太郎',
      phoneNumber: '03-1111-2222',
      email: 'taro.sato@example.com',
      reservationTypes: {
        connect: [{ id: consultation.id }, { id: contract.id }],
      },
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      storeId: store1.id,
      staffName: '鈴木 花子',
      phoneNumber: '03-3333-4444',
      email: 'hanako.suzuki@example.com',
      reservationTypes: {
        connect: [{ id: consultation.id }],
      },
    },
  });

  // スタッフの作成（大阪支店）
  const staff3 = await prisma.staff.create({
    data: {
      storeId: store2.id,
      staffName: '田中 一郎',
      phoneNumber: '06-5555-6666',
      email: 'ichiro.tanaka@example.com',
      reservationTypes: {
        connect: [{ id: consultation.id }],
      },
    },
  });

  const staff4 = await prisma.staff.create({
    data: {
      storeId: store2.id,
      staffName: '高橋 二郎',
      phoneNumber: '06-7777-8888',
      email: 'jiro.takahashi@example.com',
      reservationTypes: {
        connect: [{ id: contract.id }],
      },
    },
  });

  // 営業時間の作成（東京本店）
  const startTime = '10:00';
  const endTime = '18:00';
  const businessHoursStore1 = [
    {
      dayOfWeek: 1,
      startTime,
      endTime,
      isClosed: false,
    }, // 月曜日
    {
      dayOfWeek: 2,
      startTime,
      endTime,
      isClosed: false,
    }, // 火曜日
    {
      dayOfWeek: 3,
      startTime,
      endTime,
      isClosed: false,
    }, // 水曜日
    {
      dayOfWeek: 4,
      startTime,
      endTime,
      isClosed: false,
    }, // 木曜日
    {
      dayOfWeek: 5,
      startTime,
      endTime,
      isClosed: false,
    }, // 金曜日
    { dayOfWeek: 6, startTime: null, endTime: null, isClosed: true }, // 土曜日
    { dayOfWeek: 0, startTime: null, endTime: null, isClosed: true }, // 日曜日
  ];

  for (const bh of businessHoursStore1) {
    await prisma.storeBusinessHour.create({
      data: {
        storeId: store1.id,
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isClosed: bh.isClosed,
      },
    });
  }

  // 営業時間の作成（大阪支店）
  const businessHoursStore2 = [
    {
      dayOfWeek: 1,
      startTime,
      endTime,
      isClosed: false,
    }, // 月曜日
    {
      dayOfWeek: 2,
      startTime,
      endTime,
      isClosed: false,
    }, // 火曜日
    { dayOfWeek: 3, startTime: null, endTime: null, isClosed: true }, // 水曜日
    {
      dayOfWeek: 4,
      startTime,
      endTime,
      isClosed: false,
    }, // 木曜日
    {
      dayOfWeek: 5,
      startTime,
      endTime,
      isClosed: false,
    }, // 金曜日
    {
      dayOfWeek: 6,
      startTime,
      endTime,
      isClosed: false,
    }, // 土曜日
    { dayOfWeek: 0, startTime: null, endTime: null, isClosed: true }, // 日曜日
  ];

  const reservationStartTIme = dayjs()
    .set('hour', 10)
    .set('minute', 0)
    .set('second', 0)
    .set('millisecond', 0);

  for (const bh of businessHoursStore2) {
    await prisma.storeBusinessHour.create({
      data: {
        storeId: store2.id,
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isClosed: bh.isClosed,
      },
    });
  }

  // 予約の作成（必要に応じて）
  await prisma.reservation.createMany({
    data: [
      // 東京本店の「相談」予約
      {
        storeId: store1.id,
        reservationTypeId: consultation.id,
        staffId: staff1.id,
        userEmail: 'user1@example.com',
        date: dayjs().format('YYYY-MM-DD'),
        startTime: reservationStartTIme.format(),
        endTime: reservationStartTIme.add(30, 'minute').format(),
        status: 'confirmed',
      },
      // 東京本店の「契約」予約
      {
        storeId: store1.id,
        reservationTypeId: contract.id,
        staffId: staff2.id,
        userEmail: 'user2@example.com',
        date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        startTime: reservationStartTIme.format(),
        endTime: reservationStartTIme.add(30, 'minute').format(),
        status: 'pending',
      },
      // 大阪支店の「相談」予約
      {
        storeId: store2.id,
        reservationTypeId: consultation.id,
        staffId: staff3.id,
        userEmail: 'user3@example.com',
        date: dayjs().format('YYYY-MM-DD'),
        startTime: reservationStartTIme.format(),
        endTime: reservationStartTIme.add(30, 'minute').format(),
        status: 'confirmed',
      },
      // 大阪支店の「契約」予約
      {
        storeId: store2.id,
        reservationTypeId: contract.id,
        staffId: staff4.id,
        userEmail: 'user4@example.com',
        date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        startTime: reservationStartTIme.format(),
        endTime: reservationStartTIme.add(30, 'minute').format(),
        status: 'canceled',
      },
    ],
  });

  console.log('テストデータの挿入が完了しました。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
