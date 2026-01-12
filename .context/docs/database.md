# Database Documentation

## Overview

This document covers the database schema, setup, operations, migrations, performance, and best practices for the Pedro AI application. The schema uses [Prisma](https://prisma.io) with PostgreSQL as the primary datasource. All database interactions occur via the singleton `db` instance exported from [`src/lib/db.ts`](../src/lib/db.ts).

Key features:
- **User-centric**: Tracks users, credits, usage, storage, and subscriptions.
- **Credit system**: Balances and auditable usage history.
- **Admin configuration**: Feature costs and plans.
- **Soft deletes**: On storage objects via `deletedAt`.
- **JSON flexibility**: For metadata like `details`, `featureCosts`, `features`.

Total models: 7 (plus 1 enum). See [Current Schema Snapshot](#current-schema-snapshot) for the exact Prisma definition.

### Relations Diagram (Text-based)

```
User (1) ── CreditBalance (1)
                │
User (1) ── UsageHistory (*)
User (1) ── StorageObject (*)
User (1) ── SubscriptionEvent (*)

Feature (*) ── workspaceId (no FK model)
AdminSettings (singleton)
Plan (*)
```

Cross-references:
- **Usage**: Hooks like [`useUsage`](../src/hooks/use-usage.ts), [`useCredits`](../src/hooks/use-credits.ts).
- **Storage**: [`useStorage`](../src/hooks/use-storage.ts).
- **Plans**: [`useAdminPlans`](../src/hooks/use-admin-plans.ts).
- **Prisma Client**: Stubbed in browser builds; server-only via `src/lib/db.ts`.

## Current Schema Snapshot

Mirrors [`prisma/schema.prisma`](../prisma/schema.prisma). Run `npx prisma db pull` or `npm run db:generate` to regenerate types.

```prisma
model User {
  id              String            @id @default(cuid())
  clerkId         String            @unique
  email           String?           @unique
  name            String?
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  creditBalance   CreditBalance?
  usageHistory    UsageHistory[]
  storageObjects  StorageObject[]
  subscriptionEvents SubscriptionEvent[]

  @@index([clerkId])
  @@index([email])
  @@index([isActive])
  @@index([createdAt])
}

model Feature {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@index([name])
}

model CreditBalance {
  id               String       @id @default(cuid())
  userId           String       @unique
  clerkUserId      String       @unique
  creditsRemaining Int          @default(100)
  lastSyncedAt     DateTime     @default(now())
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  user         User        @relation(fields: [userId], references: [id])
  usageHistory UsageHistory[]

  @@index([userId])
  @@index([clerkUserId])
}

model UsageHistory {
  id              String        @id @default(cuid())
  userId          String
  creditBalanceId String
  operationType   OperationType
  creditsUsed     Int           // Positive for usage, negative for refunds
  details         Json?
  timestamp       DateTime      @default(now())

  user          User          @relation(fields: [userId], references: [id])
  creditBalance CreditBalance @relation(fields: [creditBalanceId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([operationType])
}

enum OperationType {
  AI_TEXT_CHAT
  AI_IMAGE_GENERATION
  // Add more as features evolve (e.g., VIDEO_GENERATION)
}

model AdminSettings {
  id           String   @id @default("singleton")
  featureCosts Json?    // { "AI_TEXT_CHAT": 5, ... } – defaults in src/lib/credits/feature-config.ts
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Plan {
  id                 String   @id @default(cuid())
  asaasId            String?  @unique  // For billing integration
  clerkId            String?  @unique  // Deprecated
  clerkName          String?
  name               String
  credits            Int
  active             Boolean  @default(true)
  sortOrder          Int      @default(0)
  currency           String?
  priceMonthlyCents  Int?
  priceYearlyCents   Int?
  description        String?  @db.Text
  features           Json?    // Plan-specific overrides
  badge              String?
  highlight          Boolean  @default(false)
  ctaType            String?  @default("checkout")
  ctaLabel           String?
  ctaUrl             String?
  billingSource      String   @default("manual")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([active])
  @@index([sortOrder])
  @@index([asaasId])
  @@index([clerkId])
}

model StorageObject {
  id           String   @id @default(cuid())
  userId       String
  clerkUserId  String
  provider     String   @default("vercel_blob")
  url          String
  pathname     String
  name         String
  contentType  String?
  size         Int
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([clerkUserId])
  @@index([provider])
  @@index([deletedAt])
  @@index([createdAt])
}

model SubscriptionEvent {
  id          String   @id @default(cuid())
  userId      String?
  clerkUserId String
  planKey     String?
  status      String
  eventType   String
  occurredAt  DateTime @default(now())
  metadata    Json?
  createdAt   DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([clerkUserId])
  @@index([occurredAt])
}
```

## Setup & Local Development

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql@16
   brew services start postgresql@16

   # Ubuntu/Debian
   sudo apt update && sudo apt install postgresql-16
   sudo systemctl start postgresql

   # Windows: Download from postgresql.org
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE pedro_ai;
   CREATE USER pedro_user WITH ENCRYPTED PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE pedro_ai TO pedro_user;
   ```

3. **Environment** (`.env.local`):
   ```
   DATABASE_URL="postgresql://pedro_user:strong_password@localhost:5432/pedro_ai"
   ```

4. **Generate & Migrate**:
   ```bash
   npm install  # Install Prisma
   npx prisma generate
   npx prisma db push  # Or `npm run db:push` for dev
   npx prisma studio   # Browse data at http://localhost:5555
   ```

Production: Use `npx prisma migrate deploy`.

## Common Operations

Import `db` from [`src/lib/db.ts`](../src/lib/db.ts). Always use transactions for related updates.

### User Management
```typescript
// Create user (e.g., Clerk webhook)
const user = await db.user.upsert({
  where: { clerkId: 'user_123' },
  update: {},
  create: {
    clerkId: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
    creditBalance: {
      create: { clerkUserId: 'user_123', creditsRemaining: 100 }
    }
  },
  include: { creditBalance: true }
});

// Fetch with relations (used in use-credits.ts, use-usage.ts)
const userWithData = await db.user.findUnique({
  where: { clerkId },
  include: {
    creditBalance: true,
    usageHistory: { take: 20, orderBy: { timestamp: 'desc' } },
    storageObjects: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }
  }
});
```

### Credit Operations (see src/lib/credits/deduct.ts)
```typescript
import { OperationType } from '@prisma/client';

await db.$transaction(async (tx) => {
  const balance = await tx.creditBalance.findUnique({ where: { userId } });
  if (!balance || balance.creditsRemaining < 10) throw new InsufficientCreditsError();

  await tx.creditBalance.update({
    where: { userId },
    data: { creditsRemaining: { decrement: 10 }, lastSyncedAt: new Date() }
  });

  await tx.usageHistory.create({
    data: {
      userId,
      creditBalanceId: balance.id,
      operationType: OperationType.AI_IMAGE_GENERATION,
      creditsUsed: 10,
      details: { model: 'flux' }
    }
  });
});
```

### Storage Operations (see use-storage.ts)
```typescript
// List user files
const files = await db.storageObject.findMany({
  where: { userId, deletedAt: null },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Soft delete
await db.storageObject.update({
  where: { id: 'obj_123' },
  data: { deletedAt: new Date() }
});
```

### Admin & Plans
```typescript
// Update feature costs (singleton)
await db.adminSettings.upsert({
  where: { id: 'singleton' },
  update: { featureCosts: { AI_IMAGE_GENERATION: 5 } },
  create: { id: 'singleton', featureCosts: {} }
});

// List active plans
const plans = await db.plan.findMany({
  where: { active: true },
  orderBy: { sortOrder: 'asc' }
});
```

## Migrations

```bash
# Dev: Generate & apply
npx prisma migrate dev --name describe_change

# Prod: Deploy only
npx prisma migrate deploy

# Generate types
npx prisma generate

# Studio for inspection
npx prisma studio
```

Seed data: `npx prisma db seed`.

## Performance & Indexing

- **Built-in indexes**: Cover common queries (e.g., `clerkId`, `userId`, `timestamp`).
- **Pagination example**:
  ```typescript
  const storage = await db.storageObject.findMany({
    where: { userId, deletedAt: null },
    take: 20,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
    orderBy: { createdAt: 'desc' }
  });
  ```
- **Query logging** (dev): Enabled in `db.ts`.
- **Connection pooling**: Handled by Prisma (default pool size: 10).

## Monitoring & Health

### Slow Query Logging (`src/lib/db.ts`)
```typescript
db.$on('query', (e) => {
  if (e.duration > 500) console.warn('Slow query:', e.duration, e.query);
});
```

### Health Check
```typescript
// api/health/route.ts
export async function GET() {
  await db.$queryRaw`SELECT 1`;
  return Response.json({ status: 'healthy' });
}
```

## Backups & Recovery

- **pg_dump**:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  psql $DATABASE_URL < backup.sql  # Restore
  ```
- **Prisma reset** (dev only): `npx prisma migrate reset`.

## Security

- **Owner checks**: Always filter by `userId`/`clerkUserId` (enforced in hooks).
- **No direct client access**: PrismaClient stubbed in browser.
- **Validation**: Use Zod in API routes; JSON fields sanitized.
- **Secrets**: `DATABASE_URL` in env; no logs of queries with params.
- **Row-level security**: Implement via policies if needed for multi-tenant.

For schema changes, update `schema.prisma`, migrate, and regenerate (`npm run db:generate`). Reference hooks for real-world usage patterns.
