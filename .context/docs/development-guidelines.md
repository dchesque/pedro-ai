# Development Guidelines

This document outlines coding standards, patterns, best practices, and architecture for contributing to Pedro AI—a Next.js 14+ app with App Router, TypeScript, Prisma ORM, Clerk auth, TanStack Query, shadcn/ui, and AI integrations (Fal.ai, OpenRouter, Kling/Flux).

Adhere to these for consistency, type safety, security, and performance. Total codebase: ~400 files, 896 symbols (208 .ts, 166 .tsx).

## Code Standards

### TypeScript Strictness

`tsconfig.json` enables `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. Avoid `any`; prefer `unknown`, generics, or branded types.

- **Interfaces/Types**: Define for props, API payloads, models (e.g., `Short`, `Agent`, `CreditsResponse`).
- **Errors**: Extend `ApiError` or use `InsufficientCreditsError`.
- **Generics**: Hooks like `useQuery<TData, TError>`.

```tsx
// ✅ Props interface
export interface ShortCardProps {
  short: Short; // From src/hooks/use-shorts.ts
  onApprove?: () => void;
}

// ✅ API handler
async function createShort(data: CreateShortInput): Promise<Short> {
  // ...
  return short;
}

// ❌ Avoid
function badFn(id: any): any { /* ... */ }
```

**Common Types** (key exports):
- Data: `Short`, `ShortScene`, `ShortCharacterWithDetails` (`src/hooks/use-shorts.ts`, `use-short-characters.ts`)
- Credits: `CreditData`, `CreditsResponse`, `UsageData` (`src/hooks/use-credits.ts`, `use-usage.ts`)
- AI: `Agent`, `AgentQuestion`, `AIModel` (`src/hooks/use-agents.ts`, `use-available-models.ts`)
- Admin: `AdminSettings`, `Plan`, `ClerkPlan` (`src/hooks/use-admin-settings.ts`, `use-admin-plans.ts`)
- Storage: `StorageItem`, `UploadResult` (`src/hooks/use-storage.ts`, `src/lib/storage/types.ts`)

### File Naming & Organization

| Category | Convention | Examples |
|----------|------------|----------|
| Components | `PascalCase.tsx` | `AddSceneDialog.tsx`, `AdminChrome.tsx`, `ShortCard.tsx` |
| Pages | `kebab-case/page.tsx` | `admin/agents/[id]/page.tsx`, `ai-studio/page.tsx` |
| Hooks | `camelCase.ts` | `use-shorts.ts`, `use-credits.ts`, `use-agents.ts` |
| Utils/Libs | `camelCase.ts` | `api-client.ts`, `pipeline.ts`, `cache.ts` |
| Types | `types.ts` (or inline) | `src/lib/shorts/types.ts` |
| API Routes | `route.ts` | `src/app/api/shorts/route.ts` |
| Constants | `UPPER_SNAKE_CASE.ts` | `feature-config.ts`, `models-config.ts` |

**Imports** (grouped, alphabetical within groups, `@/` alias):
```tsx
// 1. React/Next built-ins
import React, { useCallback, useMemo } from 'react';
import { NextRequest } from 'next/server';

// 2. Libs/Utils (alpha)
import { cn, generateApiKey } from '@/lib/utils';
import { apiClient, ApiError } from '@/lib/api-client';
import db from '@/lib/db';
import { createShort, addScene } from '@/lib/shorts/pipeline';

// 3. Hooks (client-only)
import { useShorts, useGenerateScript } from '@/hooks/use-shorts';

// 4. Components/UI (alpha)
import { Button, Input } from '@/components/ui/*';
import { AdminTopbar } from '@/components/admin/admin-topbar';

// 5. Types (type imports)
import type { Short, CreateShortInput } from '@/hooks/use-shorts';

// 6. Styles (last)
import './ShortCard.css';
```

## Architecture Layers

| Layer | Path | Dependencies | Key Symbols (Exports) |
|-------|------|--------------|-----------------------|
| **Utils/Libs** | `src/lib/` | Models/DB | 183 (e.g., `cn`, `apiClient`, `addScene`, `deductCredits`, `OpenRouterAdapter`) |
| **Controllers (API)** | `src/app/api/` | Libs/Models | 178 (e.g., route handlers for shorts, credits) |
| **Components** | `src/components/` | Hooks/Libs | 198 (e.g., `AddSceneDialog`, `AdminChrome`, `AppShell`) |
| **Client Hooks** | `src/hooks/` | apiClient | ~50 (e.g., `useShorts`, `useCredits`, `useAgents`) |
| **Models/DB** | Prisma | - | 31 (e.g., `Short`, `Character`, `Credit`) |
| **Storage** | `src/lib/storage/` | - | 8 (e.g., `VercelBlobStorage`, `useStorage`) |

**Key Flows & Cross-Refs**:
- **Shorts**: `useShorts` → `src/lib/shorts/pipeline.ts` (`addScene`, `approveScript`, `generateMedia`). Rel: `use-short-characters.ts`.
- **Agents/AI**: `useAgents` → `src/lib/agents/` (`scriptwriter.ts`, `prompt-engineer.ts`). Providers: `src/lib/ai/providers/registry.ts`.
- **Credits**: `useCredits` → `src/lib/credits/` (`deduct`, `validate-credits`, `track-usage`).
- **Admin**: `AdminLayout` + `useAdminSettings`, `useAdminPlans`.
- **High-Impact Files**: `src/components/roteirista/ScriptWizard.tsx` (imported 5x), `src/lib/storage/index.ts` (3x).

## Component & Page Patterns

### Protected Pages
Use `PageMetadataContext` for SEO/breadcrumbs. Wrap in `AppShell`.

```tsx
"use client";
import { usePageMetadata } from '@/contexts/page-metadata';
import { AppShell } from '@/components/app/app-shell';

export default function AgentDetailPage({ params }: { params: { slug: string } }) {
  usePageMetadata({
    title: 'Agent Detail',
    breadcrumbs: [{ label: 'Agents', href: '/agents' }, { label: 'Detail' }]
  });

  return (
    <AppShell>
      {/* Content */}
    </AppShell>
  );
}
```

### Generic Component
Hooks first, memos/computed next, handlers last. Memoize lists/handlers.

```tsx
interface Props {
  short: Short;
}

export function ShortCard({ short }: Props) {
  const { data: characters } = useShortCharacters({ shortId: short.id });
  const regenerate = useRegenerateShort(short.id);

  const statusClass = useMemo(() => cn('badge', {
    'bg-green-500': short.status === 'approved',
    'bg-yellow-500': short.status === 'draft'
  }), [short.status]);

  const handleApprove = useCallback(async () => {
    await approveScript(short.id);
  }, [short.id]);

  return (
    <div className={statusClass}>
      <h3>{short.title}</h3>
      <Button onClick={handleApprove}>Approve</Button>
    </div>
  );
}
```

**Optimizations**: `React.memo` for pure; `dynamic` for heavy (e.g., `AIStarter`).

## Data Fetching Rules

**No Client-Side Prisma**: Prevents hydration errors.

| Context | Pattern | Examples |
|---------|---------|----------|
| **Client** | TanStack Query Hooks → apiClient | `const { data } = useShorts({ userId });` |
| **Server Components** | Lib queries (e.g., `src/lib/*/queries.ts`) | `const shorts = await getUserShorts(userId);` |
| **API Routes/Actions** | Direct lib/DB + Zod | `createShort(input)` |

**Hooks Examples**:
```tsx
// Shorts
const shorts = useShorts({ userId });
const create = useCreateShort();

// Agents
const agents = useAgents();
const execute = useAgentExecution(agentId);
```

**Query Keys**: `['shorts', userId]`, `staleTime: 5 * 60 * 1000`.

## API Routes & Server Actions

Auth + Zod + Centralized errors.

```ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { createShort } from '@/lib/shorts/pipeline';
import { createErrorResponse } from '@/lib/api-auth';

const schema = z.object({ title: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) throw new ApiError('Unauthorized');
    validateUserAuthentication(userId);

    const { title } = schema.parse(await req.json());
    const short = await createShort({ title, userId });

    return Response.json(short, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

**Admin**: Prefix `/api/admin/*`, use `requireAdmin`.

## Database (Prisma)

Select minimal fields, transactions, indexes (`userId`, `status`).

```ts
// Minimal select + relations
const shorts = await db.short.findMany({
  where: { userId, status: { in: ['draft', 'approved'] } },
  select: {
    id: true,
    title: true,
    status: true,
    scenes: { select: { id: true, prompt: true } },
    _count: { select: { scenes: true } }
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// Transaction
await db.$transaction(async (tx) => {
  await tx.short.create({ data });
  await deductCredits(tx, userId, 50); // From src/lib/credits/deduct.ts
});
```

**Pagination**: Cursor or `take`/`skip`.

## Feature-Specific

### Shorts Pipeline (`src/lib/shorts/pipeline.ts`)
```ts
import { addScene, approveScript, generateMedia } from '@/lib/shorts/pipeline';
// Hooks: useGenerateScript, useRegenerateShort, useAddScene
```

Limits: `canCreateCharacter`, `canAddCharacterToShort` (`src/lib/characters/limits.ts`).

### AI/Agents
- Providers: `FalAdapter`, `OpenRouterAdapter` (`src/lib/ai/providers/`).
- Models: `useAvailableModels` → `AIModel[]`.
- Execution: `AgentExecutionResult`.

### Credits
- `useCredits()` → deduct via `OperationType` (e.g., `'generate_script'`).
- Admin: `AdminSettingsPayload`, `useAdminPlans`.

### Storage
```ts
const { data } = useStorage({ userId, type: 'images' });
uploadImage(file, { provider: 'vercel' }); // VercelBlobStorage
```

## Security & Validation

- **Auth**: Clerk `auth()` + `getUserFromClerkId`/`validateApiKey`.
- **Input**: Zod schemas.
- **Rate Limits**: Credits-based.
- **Secrets**: `.env` only (e.g., `FAL_KEY`, `ASAAS_API_KEY`). Validate `src/lib/env.ts`.

## Testing

Vitest + RTL + MSW.

```ts
// hook.test.ts
import { renderHook } from '@testing-library/react';
import { useShorts } from './use-shorts';

vi.mock('@/lib/api-client');

test('loads shorts', async () => {
  const { result } = renderHook(() => useShorts({ userId: 'user1' }));
  await waitFor(() => expect(result.current.data).toHaveLength(3));
});
```

Cover: Units (utils), Integration (hooks/API), Components.

## Performance & Optimization

- **Queries**: Structured keys, `staleTime`.
- **Bundles**: `dynamic` imports (e.g., chat/video gen).
- **DB**: No N+1; indexes.
- **Cache**: `SimpleCache` (`src/lib/cache.ts`), `getCacheKey`.
- **Images/Video**: Flux/Kling optimized inputs (`src/lib/fal/flux.ts`).

## Git & Workflow

- **Commits**: Conventional ( `feat: shorts ui`, `fix: credits deduct` ).
- **Branches**: `feat/add-agent-exec`, `fix/regen-bug`.
- **PRs**: Lint, tests ✅, no `console.log`, self-review.
- **Lint**: ESLint + Prettier enforced.

## Deployment & Env

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
FAL_KEY=...
OPENROUTER_API_KEY=...
ASAAS_API_KEY=...
STORAGE_PROVIDER=vercel # or replit
```

- **Deploy**: Vercel (blobs auto), Replit fallback.
- **Checks**: `src/lib/onboarding/env-check.ts` (`ClerkEnvKey`).

For symbols/search: Use IDE or tools like `analyzeSymbols src/lib/shorts/pipeline.ts`. Contribute via PRs!
