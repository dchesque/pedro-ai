# Backend Documentation

## Overview

The backend leverages Next.js App Router API routes for a serverless architecture, integrated with PostgreSQL via Prisma ORM, Clerk for authentication, and Asaas for payments. It powers an AI-driven content creation platform focused on shorts, characters, styles, and credits-based usage.

Key features:
- **User Management**: Synced with Clerk via webhooks.
- **Credits System**: Tracks usage, validates consumption, and deducts for AI generations (images, videos, scripts).
- **AI Integrations**: OpenRouter, Fal.ai adapters for LLM and media generation.
- **Storage**: Vercel Blob or Replit support.
- **Admin Tools**: Plan management, user sync, settings.
- **Shorts Pipeline**: Script generation (Roteirista), scene management, media generation.

Total API routes: ~20 (in `app/api/`), following consistent auth/validation patterns.

## Core Technologies

| Technology | Purpose | Key Files |
|------------|---------|-----------|
| **Next.js App Router** | Serverless API routes | `app/api/**/*` |
| **Prisma ORM** | Type-safe DB access | `prisma/schema.prisma`, `src/lib/db.ts` |
| **PostgreSQL** | Data persistence | Via Prisma |
| **Clerk** | Auth & user sync | `@clerk/nextjs/server`, webhooks |
| **Zod** | Input validation | Throughout API routes |
| **TypeScript** | Full type safety | All server code |
| **Asaas** | Subscriptions/payments | `src/lib/asaas/client.ts` |
| **AI Providers** | LLM/Image/Video | `src/lib/ai/providers/*` |

Cross-references:
- [Prisma Client](prisma/generated/client_final/index-browser.d.ts) (stub for browser; full in server).
- [Logger](src/lib/logger.ts): Structured logging with `createLogger`.

## Database Schema

Prisma models (inferred from symbols/usage: 31 models):

- **User**: `id`, `clerkId`, `name`, `email`.
- **CreditBalance**: `userId`, `creditsRemaining`.
- **UsageHistory**: `userId`, `operationType`, `creditsUsed`, `timestamp`.
- **Short**: `id`, `userId`, `title`, `status` (e.g., `ShortStatus`).
- **ShortScene**: Scenes with media URLs.
- **Character**: `traits` (`CharacterTraits`), prompts.
- **Style**: `contentType` (`ContentType`), config.
- **StorageObject**: `userId`, `key`, `url`.
- **AdminSettings**: Global config (`AdminSettingsPayload`).
- **BillingPlan**: Admin-defined plans.

Relations: User → 1:N (Shorts, Characters, Styles, StorageObjects, UsageHistory, CreditBalance).

Connection: Singleton Prisma client in [src/lib/db.ts](src/lib/db.ts) with global caching for dev/hot-reload safety.

Example queries:
```ts
import { db } from '@/lib/db';

// Find user-owned shorts
const shorts = await db.short.findMany({
  where: { userId: user.id },
  include: { scenes: { include: { characters: true } } },
  orderBy: { updatedAt: 'desc' },
});
```

## API Architecture

### Route Structure

```
app/api/
├── admin/
│   ├── plans/[*route.ts]     # CRUD plans
│   ├── settings/route.ts     # GET/POST admin settings
│   └── users/sync/route.ts   # POST user sync
├── credits/
│   └── me/route.ts           # GET user credits
├── characters/[*]            # CRUD characters
├── shorts/[*]                # CRUD shorts, scenes, media gen
├── styles/[*]                # CRUD styles
├── storage/[*]               # List/upload/delete
├── users/
│   ├── route.ts              # GET list, POST create
│   └── [id]/route.ts         # GET/PUT/DELETE user
├── health/route.ts
└── webhooks/
    ├── clerk/route.ts        # User lifecycle
    └── asaas/route.ts        # Payment confirmations
```

**Public endpoints**: `/api/health`.

**Protected**: All others require Clerk `userId` → DB `User`.

### Standard Route Pattern

Every route:
1. Auth via `auth()` (Clerk).
2. Resolve DB `User` via [getUserFromClerkId](src/lib/auth-utils.ts).
3. Validate input (Zod).
4. Business logic (credits check via [validate-credits.ts](src/lib/credits/validate-credits.ts)).
5. Respond or [handleApiError](src/lib/api-client.ts).

Example GET (read):
```ts
// app/api/shorts/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getUserFromClerkId } from '@/lib/auth-utils';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return createUnauthorizedResponse();

    const user = await getUserFromClerkId(userId);
    const shorts: Short[] = await db.short.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ data: shorts });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

POST/PUT/DELETE follow similar patterns with ownership checks and transactions.

**Responses**:
- Success: `{ data: T, success: true }` (201 for creates).
- Error: `{ error: string, success: false }` (401/404/422/500).
- `ApiError` class for typed errors ([src/lib/api-client.ts](src/lib/api-client.ts)).

## Key Endpoints

### Credits & Usage
- **GET /api/credits/me**: Current balance + usage summary (`CreditsResponse`).
- Validates via [addUserCredits](src/lib/credits/validate-credits.ts), deducts via [deductCreditsForFeature](src/lib/credits/deduct.ts).
- Hooks: [use-credits.ts](src/hooks/use-credits.ts), [use-usage.ts](src/hooks/use-usage.ts).

### Shorts Pipeline
- **POST /api/shorts**: Create short (`CreateShortInput`).
- **POST /api/shorts/script**: Generate script (Roteirista: [types.ts](src/lib/roteirista/types.ts)).
- **POST /api/shorts/media**: Generate scene image/video (Fal/Kling/Flux).
- Utils: [pipeline.ts](src/lib/shorts/pipeline.ts) (`addScene`, `approveScript`).

### Admin
- **GET/POST /api/admin/plans**: CRUD `BillingPlan`.
- **POST /api/admin/users/sync**: Clerk → DB sync (no plans/credits).
- **GET/POST /api/admin/settings**: `AdminSettingsPayload` (plans, features).

### Storage
- **GET /api/storage**: List (`StorageResponse`).
- Supports [VercelBlobStorage](src/lib/storage/vercel-blob.ts), [ReplitAppStorage](src/lib/storage/replit.ts).

## Billing & Credits

Fully manual admin-configured:
1. Create plans in `/admin/settings/plans` (`name`, `price`, `credits`, `asaasCheckoutUrl`).
2. User subscribes → Asaas checkout.
3. **Webhook POST /api/webhooks/asaas**: On `PAYMENT_CONFIRMED`, grant credits via `addUserCredits`.
4. Usage: Pre-validate (`validateCreditsForFeature`), post-deduct (`deductCreditsForFeature`), log to `UsageHistory`.

Features: `FeatureKey`/`LLMFeatureKey` (e.g., image gen: 5 credits).

[AsaasClient](src/lib/asaas/client.ts) for payments.

## AI Providers

Registry-driven ([src/lib/ai/providers/registry.ts](src/lib/ai/providers/registry.ts)):
- **OpenRouterAdapter**: LLMs (`AIModel`).
- **FalAdapter**: Images (`FluxInput`/`FluxOutput`), videos (`KlingInput`).

Config: [models-config.ts](src/lib/ai/models-config.ts).

## Webhooks

### Clerk (`POST /api/webhooks/clerk`)
Syncs `user.created/updated/deleted` to DB `User`.

### Asaas (`POST /api/webhooks/asaas`)
Confirms payments, grants credits atomically.

### Users (`POST /api/webhooks/users`) - External Sync
- Signature verification (HMAC).
- Events: `user.created/updated/deleted`.
- Credits: `creditsRemaining`/`creditDelta`.
- Idempotent, transactional.

## Utilities & Patterns

### Auth
- [auth-utils.ts](src/lib/auth-utils.ts): `getUserFromClerkId`, `validateUserAuthentication`.
- [api-auth.ts](src/lib/api-auth.ts): `validateApiKey`, response helpers.

### Caching
- [SimpleCache](src/lib/cache.ts): In-memory, TTL-based.
- `getCacheKey` for queries.

### Logging
- [logger.ts](src/lib/logger.ts): `createLogger`, levels (`LogLevel`), context-aware.
- API: `isApiLoggingEnabled`, min status filter.

### Validation Schemas
Centralized in routes; examples:
```ts
import { z } from 'zod';
const createShortSchema = z.object({
  title: z.string().min(1),
  // ...
});
```

## Security & Performance

- **Auth**: Clerk + DB ownership checks everywhere.
- **Rate Limiting**: Implement per-route ([utils example](src/lib/utils.ts)).
- **Transactions**: For credits/media gen.
- **Indexes**: On `userId`, `createdAt` (Prisma schema).
- **Pagination**: `take`/`cursor` for lists.
- **Errors**: `InsufficientCreditsError`, Zod issues exposed.

## Deployment & Monitoring

- **Env**: Clerk keys, Prisma URL, Asaas API key, storage providers.
- **Health**: `GET /api/health` (DB ping).
- **Logs**: Console + potential Sentry.
- **Caching**: Global Prisma, in-memory utils.

## Development

1. `pnpm dev` → Local API at `localhost:3000/api/*`.
2. Seed DB: `pnpm db:push && npx prisma studio`.
3. Test routes: Use Thunder Client/Postman with Clerk token.
4. Mock Clerk: `NEXT_PUBLIC_CLERK_DEV=true`.

Cross-references:
- [Frontend Hooks](src/hooks/) mirror API (e.g., `useShorts` → `/api/shorts`).
- [Admin UI](src/app/admin/).
- Full symbols: See codebase analysis.

For contributions: Follow patterns, add Zod schemas, transaction credits ops.
