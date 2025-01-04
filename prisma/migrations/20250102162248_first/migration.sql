-- CreateTable
CREATE TABLE "store" (
    "id" SERIAL NOT NULL,
    "store_name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_business_hour" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "store_business_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "staff_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_type" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,
    "default_minutes" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "reservation_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "reservation_type_id" INTEGER NOT NULL,
    "staff_id" INTEGER,
    "user_email" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StaffOnReservationType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffOnReservationType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_business_hour_store_id_day_of_week_key" ON "store_business_hour"("store_id", "day_of_week");

-- CreateIndex
CREATE INDEX "_StaffOnReservationType_B_index" ON "_StaffOnReservationType"("B");

-- AddForeignKey
ALTER TABLE "store_business_hour" ADD CONSTRAINT "store_business_hour_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_reservation_type_id_fkey" FOREIGN KEY ("reservation_type_id") REFERENCES "reservation_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffOnReservationType" ADD CONSTRAINT "_StaffOnReservationType_A_fkey" FOREIGN KEY ("A") REFERENCES "reservation_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffOnReservationType" ADD CONSTRAINT "_StaffOnReservationType_B_fkey" FOREIGN KEY ("B") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Extension
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- Add Custom SQL to set Exclude constraint
ALTER TABLE reservation
  ADD CONSTRAINT no_overlap_for_same_staff
  EXCLUDE USING gist (
    staff_id WITH =,
    -- [] means inclusive range, and () means exclusive range
    -- So, start_time is inclusive, and end_time is exclusive
    tsrange(start_time, end_time, '[)') WITH &&
  );