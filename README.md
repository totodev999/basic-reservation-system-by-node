# About

Basic reservation implementation with Node.js.

## Preparation

To avoid duplicate reservation, use Exclude Constraint. But this feature is not supported in Prisma, so you need use custom migration.

### How to set up

Note: In this repo, the file made by following steps is already included in the repo. See "prisma/migrations/20250102162248_first/migration.sql".

1. Create schema.prisma  
   see "prisma/schema.prisma"

2. Create migrate file `npx prisma migrate dev --create-only`

3. Add some DDL

```
-- Delete timezone
Before
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
After
    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP NOT NULL,

-- Add Extension
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- Add Custom SQL to set Exclude constraint
ALTER TABLE reservation
  ADD CONSTRAINT no_overlap_for_same_staff
  EXCLUDE USING gist (
    staff_id WITH =,
    tsrange(start_time, end_time, '[]') WITH &&
  );
```

4. Run migration `npx prisma migrate dev`

Note:
You need to run `CREATE EXTENSION IF NOT EXISTS btree_gist;` because the EXCLUDE CONSTRAINT uses store_id, which is of type integer, combined with tsrange, which is of type range. The btree_gist extension enables GiST indexes to support integer types, making this combination possible.

## How to run

1. Install dependencies
2. Run `npx prisma generate dev`
3. run setup script `npx ts-node scripts/seed.ts`
4. run server `npm run dev`
