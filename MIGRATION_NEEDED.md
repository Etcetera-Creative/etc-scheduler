# Database Migration Required

The Prisma schema has been updated to add a `comment` field to the `Response` model.

## Changes Made
- Added `comment String?` field to the `Response` model in `prisma/schema.prisma`

## Action Required
Run the following command to apply the schema changes to the database:

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name add_response_comments
```

This will update the database schema to include the new comment field.
