```markdown
---
title: Database Schema and Operations
description: Comprehensive guide to the Pedro AI database using Prisma and PostgreSQL.
sidebar_position: 4
---

# Database Documentation

## Overview

This document details the database schema, setup, migrations, operations, performance tuning, and best practices for the Pedro AI application. The schema is defined in [Prisma](https://www.prisma.io) with PostgreSQL as the datasource. All interactions use the singleton `db` instance from [`src/lib/db.ts`](../src/lib/db.ts).

### Key Features
- **User Management**: Integrates with Clerk via `clerkId`.
- **Credit System**: Real-time balances (`CreditBalance`) and auditable logs (`UsageHistory`).
- **Storage Tracking**: Soft-deletes for user-uploaded assets (`StorageObject`).
- **Admin Config**: Singleton `AdminSettings` for feature costs; multi-tenant `Feature` with `workspaceId`.
- **Subscriptions**: Event logging (`SubscriptionEvent`) for Clerk/Asaas webhooks.
- **Plans**: Flexible billing plans (`Plan`) with JSON features and Asaas integration.
- **Enums**: `OperationType` for usage categorization.
- **JSON Fields**: Metadata flexibility (e.g., `details`, `featureCosts`).
- **Soft Deletes**: `deletedAt` on `StorageObject`.

**Models**: 9 (User, Feature, CreditBalance, UsageHistory, AdminSettings, Plan, StorageObject, SubscriptionEvent) + 1 enum.

**Relations**:
```
User (1) ── CreditBalance (1──1)
         │
         ├── UsageHistory (*)
         ├── StorageObject (*)
         └── SubscriptionEvent (*, optional)

AdminSettings (singleton)
Feature (*) ── workspaceId (string, no FK)
Plan (*)
```

**Cross-references**:
- Hooks: [`useCredits`](../src/hooks/use-credits.ts), [`useUsage`](../src/hooks/use-usage.ts), [`useStorage`](../src/hooks/use-storage.ts), [`useAdminPlans`](../src/hooks/use-admin-plans.ts).
- Utils: Credits deduction in [`src/lib/credits/deduct.ts`](../src/lib/credits/deduct.ts).
- Prisma Client: Server-only; browser stub prevents client-side queries.

## Current Schema

Exact definition from [`prisma/schema.prisma`](../prisma/schema.prisma). Regenerate types with `npm run db:generate`.

```prisma
// This is a Prisma schema file,
// see https://www.prisma.io/docs/reference/api-reference/schema-reference

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["referentialIntegrity"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                 String             @id @default(cuid())
  clerkId            String             @unique
  email              String?            @unique
  name               String?
  isActive           Boolean            @default(true)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  creditBalance      CreditBalance?
  usageHistory       UsageHistory[]
  storageObjects     StorageObject[]
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

  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageHistory UsageHistory[]

  @@index([userId])
  @@index([clerkUserId])
}

model UsageHistory {
  id              String        @id @default(cuid())
  userId          String
  creditBalanceId String
  operationType   OperationType
  creditsUsed     Int           // >0 usage, <0 refund
  details         Json?
  timestamp       DateTime      @default(now())

  user          User          @relation(fields: [userId], references: [id])
  creditBalance CreditBalance @relation(fields: [creditBalanceId], references: [id])

  @@index([userId])
  @@index([creditBalanceId])
  @@index([timestamp])
  @@index([operationType])
}

model AdminSettings {
  id           String   @id @default("singleton")
  featureCosts Json?    // e.g., { "AI_TEXT_CHAT": 1, "AI_IMAGE_GENERATION": 10 }
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Plan {
  id                 String   @id @default(cuid())
  asaasId            String?  @unique
  clerkId            String?  @unique
  clerkName          String?
  name               String
  credits            Int
  active             Boolean  @default(true)
  sortOrder          Int      @default(0)
  currency           String?
  priceMonthlyCents  Int?
  priceYearlyCents   Int?
  description        String?  @db.Text
  features           Json?    // Overrides for featureCosts
  badge              String?
  highlight          Boolean  @default(false)
  ctaType            String?  @default("checkout")
  ctaLabel           String?
  ctaUrl             String?
  billingSource      String   @default("manual")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([active])
  @@index([sortOrder: length(4)])
  @@index([asaasId])
  @@index([clerkId])
}

model StorageObject {
  id          String   @id @default(cuid())
  userId      String
  clerkUserId String
  provider    String   @default("vercel_blob")
  url         String
  pathname    String
  name        String
  contentType String?
  size        Int
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

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

enum OperationType {
  AI_TEXT_CHAT
  AI_IMAGE_GENERATION
  AI_VIDEO_GENERATION
  SHORTS_SCRIPT
  SHORTS_MEDIA
}
```

**Notes**:
- `onDelete: Cascade` on relations prevents orphans.
- Indexes optimized for Clerk lookups, user queries, time-series (usage/storage).
- Defaults: New users get 100 credits.

## Setup & Development

### 1. PostgreSQL Installation
```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu
sudo apt update && sudo apt install postgresql-16 postgresql-contrib
sudo systemctl start postgresql

# Docker (quick local)
docker run --name postgres-pedro -e POSTGRES_PASSWORD=strong_password -p 5432:5432 -d postgres:16
```

### 2. Database Creation
Connect as `postgres` superuser:
```sql
CREATE DATABASE pedro_ai;
CREATE USER pedro_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE pedro_ai TO pedro_user;
ALTER USER pedro_user CREATEDB;  -- Optional: dev convenience
```

### 3. Environment Variables (`.env.local`)
```
DATABASE_URL="postgresql://pedro_user:strong_password@localhost:5432/pedro_ai?schema=public"
DIRECT_URL="postgresql://pedro_user:strong_password@localhost:5432/pedro_ai?schema=public&direct=true&pgbouncer=true"
```

### 4. Prisma Commands
```bash
npm install
npx prisma generate          # Types
npx prisma db push           # Schema sync (dev)
npx prisma migrate dev      # Named migration
npx prisma studio           # GUI: http://localhost:5555
npm run db:seed             # Seed plans/styles (if defined)
```

**Production**:
```bash
npx prisma migrate deploy
npx prisma generate
```

## Common Operations

Import: `import { db } from '@/lib/db';`

### User & Onboarding (Clerk Webhook Example)
```typescript
// src/app/api/webhooks/clerk/route.ts pattern
const user = await db.user.upsert({
  where: { clerkId: clerkId },
  update: { email, name, isActive: true },
  create: {
    id: generateId(),  // Custom if needed
    clerkId,
    email,
    name,
    creditBalance: {
      create: { clerkUserId: clerkId, creditsRemaining: 100 }
    }
  },
  include: {
    creditBalance: true,
    usageHistory: { orderBy: { timestamp: 'desc' }, take: 5 }
  }
});
```

### Credits & Usage (Transactional, from `deduct.ts`)
```typescript
import { OperationType, InsufficientCreditsError } from '@/lib/credits/errors';

export async function deductCredits(userId: string, operation: OperationType, cost: number, details: Record<string, any>) {
  return db.$transaction(async (tx) => {
    const balance = await tx.creditBalance.findUnique({ where: { userId } });
    if (balance!.creditsRemaining < cost) throw new InsufficientCreditsError(cost);

    await tx.creditBalance.update({
      where: { userId },
      data: {
        creditsRemaining: { decrement: cost },
        lastSyncedAt: new Date()
      }
    });

    await tx.usageHistory.create({
      data: {
        userId,
        creditBalanceId: balance!.id,
        operationType: operation,
        creditsUsed: cost,
        details
      }
    });

    return { success: true, remaining: balance!.creditsRemaining - cost };
  });
}
```

**Hooks Usage** (e.g., `useCredits` fetches `userWithData` with includes).

### Storage Management
```typescript
// List (use-storage.ts)
const files = await db.storageObject.findMany({
  where: { userId, deletedAt: null },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Upload tracking
await db.storageObject.create({
  data: {
    userId,
    clerkUserId,
    provider: 'vercel_blob',
    url: 'https://blob.vercel-storage.com/...',
    pathname: '/user123/image.png',
    name: 'image.png',
    contentType: 'image/png',
    size: 1024 * 500
  }
});

// Soft delete
await db.storageObject.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

### Admin & Plans
```typescript
// Feature costs (singleton)
const settings = await db.adminSettings.upsert({
  where: { id: 'singleton' },
  create: { id: 'singleton' },
  update: {}
});

await db.adminSettings.update({
  where: { id: 'singleton' },
  data: { featureCosts: { ...settings.featureCosts, NEW_FEATURE: 20 } }
});

// Plans (useAdminPlans.ts)
const plans = await db.plan.findMany({
  where: { active: true },
  orderBy: { sortOrder: 'asc' }
});
```

**Subscription Events** (Webhook):
```typescript
await db.subscriptionEvent.create({
  data: {
    clerkUserId,
    planKey: plan?.name,
    status: 'active',
    eventType: 'subscription.created',
    metadata: webhookData,
    userId: user?.id || null
  }
});
```

## Migrations & Seeding

```bash
# Development workflow
git checkout main
npx prisma migrate dev --name "add-video-operation"
npx prisma generate
npm run db:seed  # Seeds plans, styles, tones (src/lib/scripts/seed-*.ts)

# Reset (destructive)
npx prisma migrate reset
```

**Custom Seeds**: Run via `prisma/seed.ts` or npm scripts.

## Performance

- **Indexes**: Cover 95% queries (user lookups, time ranges, lists).
- **Pagination** (cursor-based, use-usage.ts/use-storage.ts):
  ```typescript
  await db.usageHistory.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 20,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0
  });
  ```
- **N+1 Prevention**: Use `include`/`select`; transactions for writes.
- **Query Logging** (`src/lib/db.ts`):
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    db.$on('query', e => {
      if (e.duration > 100) console.warn(`Slow: ${e.duration}ms`, e.params);
    });
  }
  ```
- **Connection Pool**: Prisma defaults (10); scale via `?connection_limit=20`.

**Scaling Tips**:
- Time-series: Partition `UsageHistory` if >1M rows/month.
- Read Replicas: `DIRECT_URL` for migrations.
- Analytics: Aggregate views on `UsageHistory`.

## Monitoring & Health

### API Health Check
```typescript
// src/app/api/health/route.ts
import { db } from '@/lib/db';
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    await db.$disconnect();
    return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: 'unhealthy' }, { status: 500 });
  }
}
```

### Metrics Queries
```sql
-- User growth
SELECT date_trunc('day', createdAt) AS day, COUNT(*) FROM "User" GROUP BY day;

-- Top operations
SELECT operationType, AVG(creditsUsed), COUNT(*) FROM "UsageHistory" GROUP BY operationType;

-- Low balance alerts
SELECT COUNT(*) FROM "CreditBalance" WHERE creditsRemaining < 10;
```

## Backups & Recovery

**Local**:
```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
psql "$DATABASE_URL" < backup.sql
```

**Production** (Vercel Postgres/Neon):
- Automated snapshots.
- Point-in-time recovery.

**Disaster Recovery**:
1. Restore from backup.
2. `npx prisma migrate deploy`.
3. Resync Clerk users if needed.

## Security Best Practices

- **Ownership**: All queries filter `userId`/`clerkUserId` (hook-enforced).
- **No Client Access**: Browser Prisma stub errors at runtime.
- **Input Validation**: Zod in routes; JSON untrusted.
- **Secrets**: Env-only; no query logging with params.
- **Rate Limiting**: Vercel/Upstash for APIs.
- **Auditing**: All credits changes logged immutably.
- **Multi-Tenant**: `workspaceId` in `Feature`; future RLS.

For changes: Edit `schema.prisma` → `db push` (dev) → migrate → `generate`. Test in Studio. Reference hooks for patterns.

---
*Last updated: Schema from Prisma v5.x. Check `git log prisma/schema.prisma` for changes.*
```
