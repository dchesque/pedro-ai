# Database Documentation

Status: Parts of this document were outdated. The section below reflects the current Prisma schema at a glance; legacy content remains for reference and will be incrementally revised.

## Current Models Snapshot

This mirrors `prisma/schema.prisma` in the repository.

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String?  @unique
  name      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creditBalance      CreditBalance?
  usageHistory       UsageHistory[]
  storageObjects     StorageObject[]
  subscriptionEvents SubscriptionEvent[]
}

model Feature {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CreditBalance {
  id               String   @id @default(cuid())
  userId           String   @unique
  clerkUserId      String   @unique
  creditsRemaining Int      @default(100)
  lastSyncedAt     DateTime @default(now())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
  usageHistory UsageHistory[]
}

model UsageHistory {
  id              String        @id @default(cuid())
  userId          String
  creditBalanceId String
  operationType   OperationType
  creditsUsed     Int
  details         Json?
  timestamp       DateTime      @default(now())

  user          User          @relation(fields: [userId], references: [id])
  creditBalance CreditBalance @relation(fields: [creditBalanceId], references: [id])
}

enum OperationType {
  AI_TEXT_CHAT
  AI_IMAGE_GENERATION
}

model AdminSettings {
  id           String   @id @default("singleton")
  featureCosts Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Plan {
  id        String   @id @default(cuid())
  asaasId   String?  @unique // Asaas plan ID for payment processing
  clerkId   String?  @unique // Legacy Clerk plan ID (deprecated)
  clerkName String?  // Legacy field
  name      String
  credits   Int
  active    Boolean  @default(true)
  sortOrder Int      @default(0)
  currency           String?
  priceMonthlyCents  Int?
  priceYearlyCents   Int?
  description        String?  @db.Text
  features           Json?
  badge              String?
  highlight          Boolean  @default(false)
  ctaType            String?  @default("checkout")
  ctaLabel           String?
  ctaUrl             String?
  billingSource      String   @default("manual")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

  user         User     @relation(fields: [userId], references: [id])
}

model SubscriptionEvent {
  id           String   @id @default(cuid())
  userId       String?
  clerkUserId  String
  planKey      String?
  status       String
  eventType    String
  occurredAt   DateTime @default(now())
  metadata     Json?
  createdAt    DateTime @default(now())

  user         User?    @relation(fields: [userId], references: [id])
}
```

Notes:
- Feature costs are sourced from `AdminSettings.featureCosts` with defaults in `src/lib/credits/feature-config.ts`.
- Usage history stores a negative `creditsUsed` entry on refunds.

---

## Database Setup

### Local Development

1. Install PostgreSQL:
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. Create database:
```sql
CREATE DATABASE saas_template;
CREATE USER saas_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE saas_template TO saas_user;
```

3. Configure environment:
```env
DATABASE_URL="postgresql://saas_user:your_password@localhost:5432/saas_template"
```

4. Run migrations:
```bash
npm run db:push
# or
npm run db:migrate
```

## Schema Overview

### Core Models

#### User Model
Central user entity linked to Clerk authentication.

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String?  @unique
  name      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  creditBalance       CreditBalance?
  usageHistory        UsageHistory[]
  storageObjects      StorageObject[]
  subscriptionEvents  SubscriptionEvent[]
}
```

#### Project/Task/Team/Agent Models
Not included in this template.

### Team and AI Agent Models

#### Feature Model
Holds feature metadata used by the app.

```prisma
model Feature {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  description String?
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Team Models
Removed in this edition.

### Credit System Models

#### Credit Balance and Usage
```prisma
model CreditBalance {
  id                String   @id @default(cuid())
  userId            String   @unique
  clerkUserId       String   @unique
  creditsRemaining  Int      @default(100)
  lastSyncedAt      DateTime @default(now())
  
  user              User     @relation(fields: [userId], references: [id])
  usageHistory      UsageHistory[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model UsageHistory {
  id              String        @id @default(cuid())
  userId          String
  creditBalanceId String
  operationType   OperationType
  creditsUsed     Int
  details         Json?
  timestamp       DateTime      @default(now())
  
  user            User          @relation(fields: [userId], references: [id])
  creditBalance   CreditBalance @relation(fields: [creditBalanceId], references: [id])
}

enum OperationType {
  AI_TEXT_CHAT
  AI_IMAGE_GENERATION
}
```

## Database Operations

### Connection Management

```typescript
// lib/db.ts
import { PrismaClient } from '../../prisma/generated/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

### Common Query Patterns

#### User Operations
```typescript
// Create user (typically via webhook)
async function createUser(clerkId: string, email: string, name?: string) {
  return db.user.create({
    data: {
      clerkId,
      email,
      name,
      creditBalance: {
        create: {
          clerkUserId: clerkId,
          creditsRemaining: 100,
        }
      }
    },
    include: {
      creditBalance: true,
    }
  });
}

// Get user with related data
async function getUserWithData(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    include: {
      creditBalance: true,
      usageHistory: {
        take: 10,
        orderBy: { timestamp: 'desc' },
      },
    },
  });
}
```

// (Projects/Phases/Tasks are not part of this template)

// (Task assignment is not part of this template)

### Credit System Operations

```typescript
// Deduct credits for operation
async function deductCredits(
  userId: string,
  creditsUsed: number,
  operationType: OperationType,
  details?: any
) {
  return db.$transaction(async (tx) => {
    // Get current balance
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance || balance.creditsRemaining < creditsUsed) {
      throw new Error('Insufficient credits');
    }

    // Update balance
    const updatedBalance = await tx.creditBalance.update({
      where: { userId },
      data: {
        creditsRemaining: balance.creditsRemaining - creditsUsed,
        lastSyncedAt: new Date(),
      },
    });

    // Record usage
    await tx.usageHistory.create({
      data: {
        userId,
        creditBalanceId: balance.id,
        creditsUsed,
        operationType,
        details,
      },
    });

    return updatedBalance;
  });
}

// Get usage analytics
async function getUserUsageAnalytics(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.usageHistory.groupBy({
    by: ['operationType'],
    where: {
      userId,
      timestamp: { gte: since },
    },
    _sum: {
      creditsUsed: true,
    },
    _count: {
      id: true,
    },
  });
}
```

## Migration Patterns

### Schema Changes

```bash
# Generate migration after schema changes
npx prisma migrate dev --name add_feature_workspace_id

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Data Migrations

```typescript
// migrations/001_backfill_credit_balances.ts
import { PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      creditBalance: null,
    },
  });

  for (const user of users) {
    await prisma.creditBalance.create({
      data: {
        userId: user.id,
        clerkUserId: user.clerkId,
        creditsRemaining: 0,
      },
    });
  }

  console.log(`Created credit balances for ${users.length} users`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Performance Optimization

### Indexing Strategy

```prisma
// Add indexes in schema
model User {
  // ... fields
  
  @@index([clerkId])
  @@index([email])
  @@index([createdAt])
}

model StorageObject {
  // ... fields
  
  @@index([userId])
  @@index([createdAt])
  @@index([clerkUserId])
  @@index([contentType])
  @@index([deletedAt])
  @@index([name])
}

model Plan {
  // ... fields
  
  @@index([active])
  @@index([sortOrder])
  @@index([asaasId])
}
```

### Query Optimization

```typescript
// Use select to limit fields
const users = await db.user.findMany({
  select: { id: true, name: true, email: true, createdAt: true },
});

// Paginate through storage objects
async function getPaginatedStorage(userId: string, cursor?: string, take = 20) {
  return db.storageObject.findMany({
    where: { userId, deletedAt: null },
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, url: true, contentType: true, size: true, createdAt: true },
  });
}
```

### Connection Pooling

```typescript
// lib/db.ts with connection pooling
export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  log: ['warn', 'error'],
});

// Graceful shutdown
process.on('beforeExit', () => {
  db.$disconnect();
});
```

## Backup and Recovery

### Automated Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

# Cleanup old backups (keep last 7 days)
find . -name "backup_*.sql" -mtime +7 -delete
```

### Point-in-time Recovery

```bash
# Restore from backup
psql $DATABASE_URL < backup_20240315_120000.sql

# Reset migrations (if needed)
npx prisma migrate reset --force
npx prisma db push
```

## Monitoring

### Query Performance

```typescript
// Enable query logging
const db = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

db.$on('query', (e) => {
  if (e.duration > 1000) { // Log slow queries (>1s)
    console.log('Slow query detected:', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  }
});
```

### Health Checks

```typescript
// Database health check
export async function checkDatabaseHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date() 
    };
  }
}
```

## Security Considerations

Ensure inputs are validated with Zod where applicable and sensitive data is never exposed in responses. Apply owner checks on user-scoped entities.
