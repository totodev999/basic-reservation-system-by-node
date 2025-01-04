# About

Basic reservation implementation with Node.js

## Preparation

To avoid duplicate reservation, use Exclude Constraint. But this feature is not supported in Prisma, so you need use custom migration.

### How to set up

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
