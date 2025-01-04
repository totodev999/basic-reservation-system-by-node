import dayjs, { Dayjs } from 'dayjs';
import { prisma } from '../db/dbClient';
import { PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';

const ERROR_MESSAGES = {
  MISSING_PARAMS: 'storeId と reservationTypeId は必須です。',
  INVALID_PARAMS: 'storeId と reservationTypeId は数値である必要があります。',
  RESERVATION_TYPE_NOT_FOUND: '指定された reservationTypeId が存在しません。',
  NO_STAFF_AVAILABLE:
    '指定された予約タイプに対応可能なスタッフが存在しません。',
  // 指定されたstoreIdは存在しません
  STORE_NOT_FOUND: '指定されたstoreIdは存在しません。',
  FAILED_TO_FETCH_SLOTS: '予約可能枠の取得に失敗しました。',
  DUPLICATE_RESERVATION: 'すでに予約済みの日時です。',
  STORE_CLOSED_AT_SPECIFIED_TIME: '指定された日時は店舗が営業していません。',
  INVALID_RESERVATION_TIME: '予約時間が不正です。',
};

export class ReservationUsecase {
  // You should inject the repository here
  constructor() {}

  async getAvailable(
    storeId: number,
    reservationTypeId: number
  ): Promise<
    | {
        date: string;
        slots: string[];
      }[]
    | string
  > {
    const reservationType = await prisma.reservationType.findUnique({
      where: { id: reservationTypeId },
    });

    if (!reservationType) {
      throw new Error(ERROR_MESSAGES.RESERVATION_TYPE_NOT_FOUND);
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new Error(ERROR_MESSAGES.STORE_NOT_FOUND);
    }

    const slotDuration = reservationType.defaultMinutes;

    const today = dayjs().startOf('day');
    // change length according to requirements
    const nextWeek = Array.from({ length: 7 }, (_, i) => today.add(i, 'day'));

    const staffs = await prisma.staff.findMany({
      where: {
        storeId,
        reservationTypes: { some: { id: reservationTypeId } },
      },
    });

    if (staffs.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_STAFF_AVAILABLE);
    }

    // create the array of available slots
    const slots = [];
    for (const date of nextWeek) {
      const dayOfWeek = date.day();

      const businessHour = await prisma.storeBusinessHour.findUnique({
        where: { storeId_dayOfWeek: { storeId, dayOfWeek } },
      });

      if (
        !businessHour ||
        businessHour.isClosed ||
        !businessHour.startTime ||
        !businessHour.endTime
      ) {
        slots.push({ date: this.formatDateYYYYMMDD(date), slots: [] });
        continue;
      }

      const businessStart = dayjs(
        this.formatDateYYYYMMDDWithTime(date, businessHour.startTime)
      );

      const businessEnd = dayjs(
        this.formatDateYYYYMMDDWithTime(date, businessHour.endTime)
      );

      const possibleSlots = this.generateTimeSlots(
        businessStart,
        businessEnd,
        slotDuration
      );

      // exclude slots that are already passed
      let availableSlots;
      if (date.isSame(today, 'day')) {
        const currentTime = dayjs();
        availableSlots = possibleSlots.filter((slot) => {
          const slotTime = dayjs(this.formatDateYYYYMMDDWithTime(today, slot));
          return slotTime.isAfter(currentTime);
        });
      }

      slots.push({
        date: this.formatDateYYYYMMDD(date),
        slots: availableSlots ? availableSlots : possibleSlots,
      });
    }

    // exclude slots that are already reserved
    // In this example, this is done by the staff basis, but you can change this logic to fit your needs
    // Instead of using staff, you can simply use the limitation of slots.
    const availableSlots = [];
    for (const availableSlot of slots) {
      const date = dayjs(availableSlot.date);
      const reservations = await prisma.reservation.findMany({
        where: {
          storeId,
          // reservationTypeId,
          date: dayjs(availableSlot.date).format('YYYY-MM-DD'),
        },
        select: { date: true, startTime: true, endTime: true, staffId: true },
      });

      const slotAvailability: Record<string, number> =
        availableSlot.slots.reduce((acc, slot) => {
          acc[slot] = 0;
          return acc;
        }, {} as Record<string, number>);

      for (const staff of staffs) {
        const staffReservations = reservations.filter(
          (resv) => resv.staffId === staff.id
        );
        const busyIntervals = staffReservations.map((resv) => ({
          start: dayjs(resv.startTime),
          end: dayjs(resv.endTime),
        }));

        availableSlot.slots.forEach((slot) => {
          const slotStart = dayjs(this.formatDateYYYYMMDDWithTime(date, slot));
          const slotEnd = slotStart.add(slotDuration, 'minute');

          const isBusy = busyIntervals.some((interval) =>
            this.isSlotOverlapping(
              slotStart,
              slotEnd,
              interval.start,
              interval.end
            )
          );

          if (!isBusy) {
            slotAvailability[slot]++;
          }
        });
      }

      const availableTimeSlots = Object.keys(slotAvailability).filter(
        (slot) => slotAvailability[slot] > 0
      );
      availableSlots.push({
        date: this.formatDateYYYYMMDD(date),
        slots: availableTimeSlots,
      });
    }

    return availableSlots;
  }

  async createReservation(input: {
    date: string;
    storeId: number;
    reservationTypeId: number;
    userEmail: string;
    startTime: string;
  }) {
    const { date, storeId, reservationTypeId, userEmail, startTime } = input;
    const reservationType = await prisma.reservationType.findUnique({
      where: { id: reservationTypeId },
    });

    if (!reservationType) {
      throw new Error(ERROR_MESSAGES.RESERVATION_TYPE_NOT_FOUND);
    }

    // check if the reservation time is valid
    const dayOfWeek = dayjs(date + startTime).day();
    const storeBusinessHour = await prisma.storeBusinessHour.findFirst({
      where: {
        storeId: storeId,
        dayOfWeek: dayOfWeek,
      },
    });

    if (
      !storeBusinessHour ||
      storeBusinessHour.isClosed ||
      !storeBusinessHour.startTime ||
      !storeBusinessHour.endTime
    ) {
      throw new Error(ERROR_MESSAGES.STORE_CLOSED_AT_SPECIFIED_TIME);
    }

    // check slot is valid
    const isReservationTimeValid = this.checkSlotIsValid(
      date,
      storeBusinessHour.startTime,
      storeBusinessHour.endTime,
      reservationType.defaultMinutes,
      startTime
    );

    if (!isReservationTimeValid) {
      throw new Error(ERROR_MESSAGES.INVALID_RESERVATION_TIME);
    }

    // Retrieve staffs who can handle the reservation type and don't have any overlapping reservations
    const staffs = await prisma.staff.findMany({
      where: {
        storeId: storeId,
        reservations: {
          none: {
            startTime: {
              gte: dayjs(date + startTime).toDate(),
              lte: dayjs(date + startTime)
                .set('minute', reservationType.defaultMinutes)
                .toDate(),
            },
            AND: {
              endTime: {
                gte: dayjs(date + startTime).toDate(),
              },
            },
          },
        },
      },
      include: {
        reservationTypes: {
          where: {
            id: reservationTypeId,
          },
        },
        reservations: true,
      },
    });

    if (staffs.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_STAFF_AVAILABLE);
    }

    // Sort staffs by the number of reservations they have
    const staff = [...staffs].sort((a, b) => {
      const aCount = a.reservations.length;
      const bCount = b.reservations.length;
      return aCount - bCount;
    })[0];

    // Thanks to Exclusive Constraints, you don't need to check for overlapping reservations
    // because the database will prevent it from happening. see "migration.sql"
    const startTimeDayjs = dayjs(date + startTime);
    const newReservation = await prisma.reservation
      .create({
        data: {
          storeId,
          reservationTypeId,
          staffId: staff.id,
          userEmail,
          date,
          startTime: startTimeDayjs.toDate(),
          endTime: startTimeDayjs
            .add(reservationType.defaultMinutes, 'minute')
            .toDate(),
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientUnknownRequestError) {
          const message = error.message;
          const code = message.match(/code: "(\w+)"/)?.[1];
          // Exclusive Constraints will throw 23P01 error code(exclusion_violation)
          // This can prevent duplicate reservations from being created
          if (code === '23P01') {
            throw new Error(ERROR_MESSAGES.DUPLICATE_RESERVATION);
          }
        }
        throw new Error(error);
      });

    return newReservation;
  }

  private checkSlotIsValid(
    date: string,
    storeStartTime: string,
    storeEndTime: string,
    slotDuration: number,
    reservationStartTime: string
  ) {
    const startTimeObj = dayjs(date + storeStartTime);
    const endTimeObj = dayjs(date + storeEndTime);
    const slot = this.generateTimeSlots(startTimeObj, endTimeObj, slotDuration);
    const isValidSlot = slot.includes(reservationStartTime);
    return isValidSlot;
  }

  private formatDateYYYYMMDDWithTime(date: dayjs.Dayjs, time: string): string {
    return `${this.formatDateYYYYMMDD(date)} ${time}`;
  }

  private formatDateYYYYMMDD(date: dayjs.Dayjs): string {
    return date.format('YYYY-MM-DD');
  }

  // ユーティリティ関数：タイムスロットの生成
  private generateTimeSlots(
    startTime: Dayjs,
    endTime: Dayjs,
    slotDuration: number // reservationType.defaultMinutes
  ): string[] {
    const slots: string[] = [];
    const step = 30; // 30分刻み

    let current = startTime.clone();

    // 予約タイプのデフォルト長が入る時間を満たせるかどうかチェックしてスロット生成
    while (
      // current + slotDuration が営業終了時刻を超えないか？の判定を入れておく
      current.add(slotDuration, 'minute').isSame(endTime) ||
      current.add(slotDuration, 'minute').isBefore(endTime)
    ) {
      slots.push(current.format('HH:mm'));
      current = current.add(step, 'minute');
    }

    return slots;
  }

  // ユーティリティ関数：予約の重複チェック
  private isSlotOverlapping(
    slotStart: Dayjs,
    slotEnd: Dayjs,
    intervalStart: Dayjs,
    intervalEnd: Dayjs
  ): boolean {
    return slotStart < intervalEnd && slotEnd > intervalStart;
  }
}
