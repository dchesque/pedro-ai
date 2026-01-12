# Development Guidelines

This document outlines the coding standards, patterns, and best practices for contributing to the Pedro AI codebase. The project is a Next.js 14+ app with App Router, TypeScript, Prisma, Clerk authentication, TanStack Query for data fetching, shadcn/ui components, and AI integrations (Fal.ai, OpenRouter, Kling/Flux models).

Follow these guidelines to maintain consistency, security, and performance.

## Code Standards

### TypeScript Configuration

`tsconfig.json` enforces strict mode. Key rules:

- **Type Safety**: No `any`—use `unknown`, unions, or generics. Enable strict null checks (`strictNullChecks: true`).
- **Interfaces for Data**: Define for all props, API responses, and models.
- **Generics**: For reusable hooks/components (e.g., `useQuery<T>`).

```tsx
// ✅ Good
export interface Short {
  id: string;
  title: string;
  scenes: ShortScene[];
  status: ShortStatus;
}

async function fetchShort(id: string): Promise<Short | null> {
  const { data } = await apiClient.get(`/shorts/${id}`);
  return data;
}

// ❌ Bad
function fetchShort(id: any): any { /* ... */ }
```

#### Common Types (from codebase)

See key exports:
- `Short`, `ShortScene` (`src/hooks/use-shorts.ts`)
- `CreditData`, `CreditsResponse` (`src/hooks/use-credits.ts`)
- `AdminSettings` (`src/hooks/use-admin-settings.ts`)
- `CharacterPromptData` (`src/lib/characters/types.ts`)

Use `ApiError` for errors (`src/lib/api-client.ts`).

### File Naming Conventions

```
Components: PascalCase.tsx (e.g., AddSceneDialog.tsx, AppShell.tsx)
Pages: kebab-case/page.tsx (e.g., ai-studio/page.tsx)
Hooks: camelCase.ts (e.g., use-shorts.ts, use-credits.ts)
Utils: camelCase.ts (e.g., api-client.ts, utils.ts)
Types: camelCase.ts (e.g., types.ts)
Constants: UPPER_SNAKE_CASE.ts (e.g., feature-config.ts)
API Routes: route.ts (e.g., /api/shorts/route.ts)
```

### Import Organization

```tsx
// 1. React/Next.js
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Lib utils (alphabetical)
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import db from '@/lib/db';

// 3. Hooks (client-only)
import { useShorts, useCreateShort } from '@/hooks/use-shorts';

// 4. Components/UI
import { Button } from '@/components/ui/button';
import { AddSceneDialog } from '@/components/shorts/AddSceneDialog';

// 5. Types
import type { Short } from '@/hooks/use-shorts';

// 6. Styles/CSS
import './component.css';
```

**Note**: Prefix internal imports with `@/` alias.

## Architecture Overview

- **Layers**:
  | Layer | Path | Dependencies | Symbols |
  |-------|------|--------------|---------|
  | Utils | `src/lib/` | Controllers, Models | 171 |
  | Controllers (API) | `src/app/api/` | Models | 159 |
  | Components | `src/components/` | Models | 179 |
  | Models | Prisma schema | - | 29 |
  | Hooks (Client Data) | `src/hooks/` | apiClient | ~50 |

- **Key Flows**:
  - **Shorts Pipeline**: `src/lib/shorts/pipeline.ts` (addScene, approveScript, generateMedia).
  - **Credits**: `src/lib/credits/` (deduct, validate, track-usage).
  - **AI Providers**: `src/lib/ai/providers/` (OpenRouterAdapter, FalAdapter).
  - **Storage**: `src/lib/storage/` (VercelBlobStorage, ReplitAppStorage).

Cross-references:
- Shorts: Uses `useShorts`, `useShortCharacters`.
- Admin: `AdminChrome`, `useAdminSettings`, `useAdminPlans`.

## Component Guidelines

### Page Metadata (Protected Routes)

All `(protected)` pages use `PageMetadataContext` for titles/breadcrumbs:

```tsx
"use client";

import { usePageMetadata } from '@/contexts/page-metadata';

export default function AIStudioPage() {
  usePageMetadata({
    title: 'AI Studio',
    description: 'Generate shorts with AI',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'AI Studio' }
    ]
  });

  return <AppShell>{/* content */}</AppShell>;
}
```

Layouts (`src/app/(protected)/layout.tsx`) render headers automatically.

### Component Structure

```tsx
interface ShortCardProps {
  short: Short;
  onRegenerate?: () => void;
}

export function ShortCard({ short, onRegenerate }: ShortCardProps) {
  const { mutate: regenerate } = useRegenerateScript(short.id);

  // Hooks first
  const { data: scenes } = useQuery({ queryKey: ['scenes', short.id] });

  // Computed/memos
  const statusColor = useMemo(() => cn('badge', { 'bg-green': short.status === 'approved' }), [short.status]);

  // Handlers
  const handleRegenerate = useCallback(() => {
    regenerate();
    onRegenerate?.();
  }, [regenerate, onRegenerate]);

  return (
    <div className={cn('card', statusColor)}>
      <h3>{short.title}</h3>
      <Button onClick={handleRegenerate}>Regenerate Script</Button>
    </div>
  );
}
```

**Props**: Specific unions/enums (e.g., `variant: 'primary' | 'destructive'`). No index signatures.

**Optimization**: `React.memo` for pure components; `useMemo`/`useCallback` for lists/handlers.

## Data Access Patterns

**Critical Rule**: No Prisma (`@/lib/db`) in client components—"hydration mismatch" risk.

- **Client Components**: Use TanStack Query hooks (e.g., `useShorts`, `useCredits`) → `apiClient` → API routes/Server Actions.
- **Server Components**: Import query functions from `src/lib/queries/` or domain libs (e.g., `src/lib/shorts/queries.ts`).
- **API Routes/Actions**: Direct Prisma or lib functions.

```tsx
// ✅ Client: Hook (wraps apiClient)
const { data: shorts } = useShorts({ userId });

// ✅ Server Component: Lib query
import { getUserShorts } from '@/lib/shorts/queries';
const shorts = await getUserShorts(userId);

// ❌ Client: Never do this
import db from '@/lib/db'; // Error!
```

**Examples**:
- Shorts: `useCreateShort`, `useGenerateScript`, `useAddScene`.
- Credits: `useCredits`, `addUserCredits`.
- Storage: `useStorage`, `useDeleteStorageItem`.

## API Development

### Route Handlers

```ts
// src/app/api/shorts/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createShort } from '@/lib/shorts/pipeline';

const schema = z.object({ title: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    validateUserAuthentication(userId); // From auth-utils.ts

    const data = schema.parse(await req.json());
    const short = await createShort({ ...data, userId: userId! });

    return NextResponse.json(short, { status: 201 });
  } catch (error) {
    return createErrorResponse(error); // Centralized handler
  }
}
```

**Auth**: `auth()` + `getUserFromClerkId` or `validateApiKey`.
**Validation**: Zod schemas everywhere.
**Errors**: `ApiError`, `InsufficientCreditsError`.

**Admin Routes**: `requireAdmin` middleware.

## Database Guidelines (Prisma)

```ts
// ✅ Select only needed fields
const shorts = await db.short.findMany({
  where: { userId },
  select: {
    id: true,
    title: true,
    status: true,
    scenes: {
      select: { id: true, prompt: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// ✅ Transactions
await db.$transaction(async (tx) => {
  await tx.shortCredit.create({ data: { shortId, creditsUsed: 10 } });
  await deductCredits(tx, userId, 10);
});
```

**Relations**: Use `include` for 1:1/N:1 (e.g., `user: { select: { creditsRemaining: true } }`).
**Pagination**: `take`/`skip` or cursor-based.

## AI & Feature-Specific Guidelines

### Shorts Pipeline

- Use `addScene`, `approveScript`, `generateMedia` from `src/lib/shorts/pipeline.ts`.
- Characters: `combineCharactersForScene`, limits via `canAddCharacterToShort`.
- Hooks: `useShorts`, `useGenerateScript`, `useRegenerateSceneImage`.

```ts
const onGenerate = useGenerateScript(short.id);
```

### Credits System

- Track: `trackUsage(operation: OperationType)`.
- Deduct: `deductCredits(userId, amount)`.
- Hooks: `useCredits()` → `CreditsResponse`.

### Admin Tools

- `AdminChrome`, `AdminLayout`.
- `useAdminSettings`, `useAdminPlans`.
- Dev: `AdminDevModeProvider`.

## Security

- **Auth**: Clerk + `createAuthErrorResponse`.
- **Validation**: Zod + `validateApiKey`.
- **Rate Limits**: Credits system enforces.
- **No Secrets**: Env vars only (e.g., `ASAAS_API_KEY`).

## Testing

Use Vitest/Jest + `@testing-library/react`, MSW for API mocks.

```tsx
// src/hooks/use-shorts.test.ts
import { renderHook } from '@testing-library/react';
import { useShorts } from './use-shorts';

test('fetches shorts', async () => {
  // MSW mock apiClient
  const { result } = renderHook(() => useShorts({ userId: 'test' }));
  await waitFor(() => expect(result.current.data).toHaveLength(2));
});
```

- **Unit**: Components, utils.
- **Integration**: Hooks → API.
- **E2E**: Playwright (TBD).

## Performance

- **Queries**: `queryKey: ['shorts', userId]`, staleTime: 5min.
- **Bundles**: `dynamic` for heavy (e.g., AI chat).
- **DB**: Indexes on `userId`, `status`; no N+1.
- **Images**: Fal.ai/Flux optimized.

## Git Workflow

- **Commits**: Conventional (`feat:`, `fix:`, etc.).
- **Branches**: `feature/shorts-pipeline`, `fix/credits-bug`.
- **PRs**: Self-review, tests pass, no `console.log`.

## Environment & Deployment

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
ASAAS_API_KEY="..."
FAL_KEY="..."
```

Validate in `src/lib/env.ts`.

**Deploy**: Vercel (blob storage auto), Replit fallback.

---

For questions: Check symbols in IDE or run `analyzeSymbols`. Contribute via PRs!
