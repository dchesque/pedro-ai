# Backend Documentation

## Overview

The backend is built on Next.js App Router for serverless API routes, using PostgreSQL with Prisma ORM, Clerk for authentication, and Asaas for Brazilian payments. It supports an AI-powered platform for generating short-form videos ("shorts"), characters, styles, scripts via Roteirista AI, and media (images/videos) with credits-based metering.

**Key Features**:
- User auth/sync via Clerk webhooks.
- Credits system for AI usage (LLMs, image/video gen).
- Shorts pipeline: script gen → scene approval → media gen.
- Admin dashboard for plans, settings, user sync.
- Storage: Vercel Blob or Replit.
- AI providers: OpenRouter (LLMs), Fal.ai (Flux/Kling for media).

**Stats**:
- ~20 API routes in `app/api/`.
- 31 Prisma models.
- 178 controller-like symbols, 184 utils.

**Deployment**: Vercel (serverless), Prisma Accelerate for global DB.

## Core Technologies

| Technology | Role | Key Files/Exports |
|------------|------|-------------------|
| **Next.js 15** | API routes, server actions | `app/api/**/*` |
| **Prisma 5** | ORM, migrations | `prisma/schema.prisma`, `src/lib/db.ts` (`PrismaClient`) |
| **PostgreSQL** | DB (Supabase/Vercel PG) | Via Prisma URL |
| **Clerk** | Auth, webhooks | `src/lib/auth-utils.ts` (`getUserFromClerkId`) |
| **Zod** | Schemas/validation | All POST/PUT routes |
| **TypeScript** | Types everywhere | `src/types/*`, `src/lib/**/*.ts` |
| **Asaas** | Pix/subscriptions | `src/lib/asaas/client.ts` (`AsaasClient`) |
| **OpenRouter** | LLMs | `src/lib/ai/providers/openrouter-adapter.ts` |
| **Fal.ai** | Images/videos | `src/lib/ai/providers/fal-adapter.ts`, `src/lib/fal/{flux,kling}.ts` |
| **Vercel Blob** | File storage | `src/lib/storage/vercel-blob.ts` (`VercelBlobStorage`) |

**Cross-refs**:
- [DB Client](src/lib/db.ts): Singleton `db` with `$disconnect()` on exit.
- [Logger](src/lib/logger.ts): `createLogger`, `LogLevel` (DEBUG/INFO/WARN/ERROR).
- [Cache](src/lib/cache.ts): `SimpleCache` (TTL, in-memory).

## Database Schema

Prisma models (from symbols/usage):

| Model | Fields | Relations |
|-------|--------|-----------|
| **User** | `id`, `clerkId`, `name`, `email`, `createdAt` | 1:N `Short`, `Character`, `Style`, `CreditBalance`, `UsageHistory`, `StorageObject` |
| **CreditBalance** | `userId`, `creditsRemaining` (Decimal) | 1:1 `User` |
| **UsageHistory** | `userId`, `operationType` (`OperationType`), `creditsUsed`, `details` (JSON), `timestamp` | N:1 `User` |
| **Short** | `id`, `userId`, `title`, `status` (`ShortStatus`: DRAFT/PENDING/APPROVED), `script` (JSON) | 1:N `ShortScene`, N:1 `User` |
| **ShortScene** | `shortId`, `index`, `prompt`, `imageUrl`, `videoUrl` | N:1 `Short`, N:M `ShortCharacter` |
| **Character** | `id`, `userId`, `name`, `traits` (`CharacterTraits`), `promptData` (`CharacterPromptData`) | N:1 `User`, N:M `ShortScene` (via `ShortCharacter`) |
| **Style** | `id`, `userId`, `name`, `config` (JSON: `ContentType`, `DiscourseArchitecture`, etc.) | N:1 `User` |
| **StorageObject** | `id`, `userId`, `key`, `url`, `size`, `mimeType` | N:1 `User` |
| **AdminSettings** | `id`, `payload` (`AdminSettingsPayload`: plans, features) | Singleton |
| **BillingPlan** | `id`, `name`, `credits`, `price`, `asaasCheckoutUrl` | Admin-only |

**Example Queries**:
```ts
import { db } from '@/lib/db';
import type { Short } from '@prisma/client'; // Generated

// List user shorts with scenes/characters
const shorts: Short[] = await db.short.findMany({
  where: { userId },
  include: {
    scenes: {
      include: { characters: { include: { character: true } } },
      orderBy: { index: 'asc' },
    },
  },
  orderBy: { updatedAt: 'desc' },
  take: 20,
});
```

**Migrations**: `pnpm db:push` (dev), `prisma migrate deploy` (prod).

## API Routes

**Structure** (`app/api/`):
```
admin/
├── plans/route.ts          # GET/POST/PUT/DELETE BillingPlan
├── settings/route.ts       # GET/POST AdminSettingsPayload
└── users/sync/route.ts     # POST Clerk → DB sync
credits/
└── me/route.ts             # GET CreditsResponse
characters/
├── route.ts                # GET list
├── [id]/route.ts           # GET/PUT/DELETE
└── [id]/image/route.ts     # POST generate image
shorts/
├── route.ts                # GET list/create
├── [id]/route.ts           # GET/update
├── [id]/script/route.ts    # POST generate/regenerate
├── [id]/approve/route.ts   # POST approveScript
└── [id]/scenes/route.ts    # POST addScene/media
styles/
├── route.ts                # GET/create/delete
└── [id]/route.ts           # GET/update/duplicate
storage/
├── route.ts                # GET list/delete
└── upload/route.ts         # POST UploadResult
users/
├── route.ts                # GET list, POST create
└── [id]/route.ts           # GET/PUT/DELETE
ai/
└── image/route.ts          # POST GenerateImageResponse (Fal/Flux)
webhooks/
├── clerk/route.ts          # POST user events
├── asaas/route.ts          # POST payment confirm
└── users/route.ts          # POST external sync
health/route.ts             # GET DB ping
```

**Auth Pattern** (all protected except `/health`):
```ts
import { auth } from '@clerk/nextjs/server';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await getUserFromClerkId(userId!);
    validateUserAuthentication(user);

    const data = await request.json();
    const schema = z.object({ /* ... */ });
    const validated = schema.parse(data);

    // Business logic, e.g., validateCreditsForFeature
    // db.$transaction(async tx => { ... });

    return NextResponse.json({ data: result, success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors, success: false }, { status: 422 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal error', success: false }, { status: 500 });
  }
}
```

**Responses**:
- Success: `{ success: true, data: T }` (200/201).
- Error: `{ success: false, error: string | ApiError }` (400-500).
- `InsufficientCreditsError`, `ApiError`.

**Pagination**: `take`, `cursor` in lists.

## Credits System

**Flow**:
1. Admin sets `AdminSettingsPayload` (features: `FeatureKey` e.g., `'shorts.script'`: 10 credits).
2. Usage: `validateCreditsForFeature(userId, feature, cost)` → throws `InsufficientCreditsError`.
3. Consume: `deductCreditsForFeature(userId, feature, cost)` → `UsageHistory` log.
4. Top-up: Asaas webhook → `addUserCredits`.

**Endpoints**:
- `GET /api/credits/me` → `{ balance: Decimal, usage: UsageData[] }`.
- Tracked: `OperationType` (SCRIPT_GEN, IMAGE_GEN, VIDEO_GEN).

**Utils**:
- [credits/deduct.ts](src/lib/credits/deduct.ts)
- [credits/validate-credits.ts](src/lib/credits/validate-credits.ts)
- [credits/track-usage.ts](src/lib/credits/track-usage.ts)

**Hooks** (FE mirror): `useCredits`, `useUsage`, `useUsageHistory`.

## Shorts Pipeline

**Core Exports** (`src/lib/shorts/pipeline.ts`):
- `addScene(shortId: string, sceneData: ShortSceneInput)`
- `approveScript(shortId: string)`
- `generateScript` (Roteirista: `AIAction[]`, `ShortStatus` updates)

**Flow**:
1. POST `/api/shorts` → draft `Short`.
2. POST `/api/shorts/[id]/script` → Roteirista (`src/lib/roteirista/types.ts`).
3. POST `/api/shorts/[id]/approve` → `APPROVED`.
4. POST `/api/shorts/[id]/scenes` → gen image/video per scene (`FluxInput`, `KlingInput`).

**Types**:
- `Short`, `ShortScene`, `ShortStatus` (DRAFT|SCRIPT_PENDING|READY|MEDIA_PENDING|COMPLETED).

## AI & Providers

**Registry** (`src/lib/ai/providers/registry.ts`):
```ts
import { OpenRouterAdapter } from './openrouter-adapter';
import { FalAdapter } from './fal-adapter';

const providers = {
  openrouter: new OpenRouterAdapter(),
  fal: new FalAdapter(),
};
```

**Capabilities** (`ProviderType`, `ProviderCapability`: TEXT|IMAGE|VIDEO).

**Models** (`src/lib/ai/models-config.ts`): `LLMFeatureKey`, `ModelType` (e.g., 'openrouter:anthropic/claude-3.5-sonnet').

**Inputs/Outputs**:
- Image: `FluxInput` → `FluxOutput` (Fal).
- Video: `KlingInput` → `KlingOutput`.

## Admin & Billing

**Plans** (`BillingPlan`):
- Admin CRUD `/api/admin/plans`.
- `asaasCheckoutUrl` → Pix/credit card.

**Settings** (`POST /api/admin/settings`): `AdminSettingsPayload` (features, models).

**User Sync** (`POST /api/admin/users/sync`): Bulk Clerk → DB (no credits).

**Middleware**: `requireAdmin` (`src/lib/admin.ts`).

## Storage

**Providers** (`StorageProviderType`: 'vercel-blob'|'replit'):
- `src/lib/storage/index.ts` → routes to active provider.
- Upload: Signed URL or direct → `StorageObject`.
- List: `GET /api/storage?prefix=chars/` → `StorageResponse`.

## Webhooks

**Clerk** (`POST /api/webhooks/clerk`, `POST` only):
- Events: `user.created`/`updated`/`deleted` → upsert/delete `User`.

**Asaas** (`POST /api/webhooks/asaas`):
- `PAYMENT_CONFIRMED` → `addUserCredits(delta)` transactionally.

**Users** (external, HMAC-signed):
- `user.created` etc. → sync `creditsRemaining`.

**Security**: Verify signatures, idempotency keys.

## Utilities

- **Auth**: `validateApiKey`, `createUnauthorizedResponse` (`src/lib/api-auth.ts`).
- **Limits**: `canCreateCharacter`, `canAddCharacterToShort` (`src/lib/characters/limits.ts`).
- **Prompts**: `analyzeCharacterImage`, `buildClimatePrompt` (`src/lib/characters/prompt-generator.ts`).

## Security & Best Practices

- **Ownership**: Always `where: { userId }`.
- **Transactions**: Credits + usage (`db.$transaction`).
- **Rate Limits**: Upstash/Upstream in Vercel.
- **Env Validation**: `ClerkEnvKey[]` (`src/lib/onboarding/env-check.ts`).
- **Errors**: Catch/log, never leak stack.
- **Indexes**: `userId`, `createdAt`, `status`.

## Development & Deployment

**Local**:
```
pnpm i
pnpm db:push
pnpm dev  # http://localhost:3000/api/health
```

**Test**:
- Thunder Client: Add `Authorization: Bearer <clerk-token>`.
- `pnpm prisma studio`.

**Env Vars**:
```
CLERK_* (publishable/secret)
DATABASE_URL
ASAAS_API_KEY
STORAGE_PROVIDER=vercel-blob  # or replit
OPENROUTER_API_KEY
FAL_API_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

**Prod**:
- Vercel: Auto-deploys, Blob native.
- Prisma: `migrate deploy`, Accelerate proxy.

**Monitoring**:
- Logs: `createLogger('api:shorts')`.
- Health: `/api/health` pings DB.

**Frontend Integration**:
- Hooks (`src/hooks/`): `useShorts` ↔ `/api/shorts`, `useAiImage` ↔ Fal.

For PRs: Add types, Zod schemas, tests (`src/lib/__tests__`), transactions for mutates.
