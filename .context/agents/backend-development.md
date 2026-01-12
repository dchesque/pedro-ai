# Feature Developer Agent Playbook

## Overview

The **Feature Developer Agent** builds new features end-to-end, integrating backend API routes, frontend components/pages, hooks, and shared utilities. This Next.js 15+ app (App Router) uses TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Prisma, Clerk auth, and Vercel AI SDK for OpenRouter. Core domains: AI Shorts (video/script generation), Roteirista (scripting), Estilos (styles), Characters, AI Chat/Studio, Billing/Credits, Admin dashboard.

**Primary Goals**:
- Add user-facing features with full-stack implementation (API + UI).
- Ensure auth, validation, credits gating, and error handling.
- Maintain consistency: Zod schemas, typed responses, server-only Prisma, credit deduction for AI ops.
- Pass quality gates: `npm run lint`, `typecheck`, `build`.

**Repo Structure**:
```
src/
├── app/              # App Router: pages, API routes (src/app/api/**/route.ts)
│   ├── (protected)/  # Auth-gated routes: shorts, roteirista, estilos, etc.
│   ├── (public)/     # Public: sign-in/up
│   └── admin/        # Admin dashboard
├── components/       # UI: shadcn/ui, domain-specific (shorts/, roteirista/, etc.)
├── hooks/            # React Query hooks: useAvailableModels, useOpenRouterModels, etc.
├── lib/              # Shared: db.ts (Prisma), api-auth.ts, credits/*, ai/*, queries/*
└── app/api/          # API routes: user/, admin/, ai/, shorts/[id]/, etc.
```

## Core Focus Areas

### 1. Backend: API Routes (`src/app/api/**/route.ts`)
- **Purpose**: Handle requests, auth, validation, DB ops, AI proxying, credits.
- **Key Dirs**: `src/app/api/user/*`, `admin/*`, `shorts/[id]/*`, `roteirista/ai/*`, `ai/*`.
- **Patterns**: Use `requireUser()`/`requireAdmin()`, Zod.parse(), Prisma transactions, credit helpers.
- **AI Ops**: Proxy to OpenRouter (`@openrouter/ai-sdk-provider`); gate with `ai_text_chat` (1cr), `ai_image_generation` (5cr+).

### 2. Frontend: Pages & Components (`src/app/*`, `src/components/*`)
- **Purpose**: UI views, forms, tables, dialogs for features like Shorts editor, Style creation.
- **Key Dirs**: `src/app/(protected)/shorts/[id]`, `components/shorts/`, `roteirista/`, `estilos/`, `ui/` (shadcn primitives).
- **Patterns**: Server Components for data fetching (via `queries/*`), Client Components with `useQuery` hooks.

### 3. Shared Layers
- **Hooks** (`src/hooks/`): `useAvailableModels`, `useAdminModels`, `usePageConfig`.
- **Libs** (`src/lib/`): `db.ts` (Prisma), `credits/deduct.ts`, `ai/models.ts`, `queries/*` (reusable fetches).
- **Models/Types**: `AIModel`, `FeatureKey`, domain types (e.g., `ShortCardProps`).

### 4. Testing & Config
- No explicit test files noted; focus on manual verification via `npm run dev`.
- Config: `.env` (OPENROUTER_API_KEY), `src/lib/clerk/*` (billing), `prisma/schema.prisma`.

## Key Files & Purposes

| File/Path | Purpose | Key Exports/Usage |
|-----------|---------|-------------------|
| `src/lib/db.ts` | Prisma client singleton | `db` for all DB ops (server-only). |
| `src/lib/api-auth.ts` | Auth helpers | `requireUser()`, `requireAdmin()`, `createErrorResponse()`. |
| `src/lib/credits/deduct.ts` | Credit gating | `validateCreditsForFeature(userId, feature)`, `deductCreditsForFeature({clerkUserId, feature, ...})`. |
| `src/lib/credits/feature-config.ts` | Feature costs | `FeatureKey` type, e.g., `{ai_text_chat: 1, ai_image_generation: 5}`. |
| `src/lib/ai/models.ts` | AI models | `AIModel[]`, `getDefaultModel()`, `getModelById()`. |
| `src/lib/queries/*` | Reusable Server Queries | Use in Server Components; avoid direct Prisma. |
| `src/app/api/ai/chat/route.ts` | AI Chat Example | `streamText` with OpenRouter; credits gating. |
| `src/components/ui/*` | shadcn/UI Primitives | `DataTable`, `Button`, `Textarea`; extend for dialogs/tables. |
| `src/components/shorts/*` | Shorts Feature UI | `CreateShortForm`, `SortableSceneList`, `CreditEstimate`. |
| `src/components/roteirista/*` | Scripting UI | `ScriptWizard`, `SceneEditor`, `AITextAssistant`. |
| `src/components/estilos/*` | Styles UI | `StyleForm`, `StyleCard`, `IconPicker`. |
| `src/hooks/use-available-models.ts` | Model Fetching | `useAvailableModels()` for selectors. |

## Specific Workflows & Steps

### Workflow 1: Add New API Endpoint (e.g., `/api/shorts/[id]/new-action`)
1. **Define Contract**: Method (POST), params/body schema (Zod), response type (TS interface), errors (400/401/402/500).
2. **Create Route**: `src/app/api/shorts/[id]/new-action/route.ts`.
3. **Implement**:
   ```ts
   import { NextResponse } from 'next/server';
   import { z } from 'zod';
   import { db } from '@/lib/db';
   import { requireUser } from '@/lib/api-auth';
   import { validateCreditsForFeature, deductCreditsForFeature } from '@/lib/credits/deduct';
   import type { FeatureKey } from '@/lib/credits/feature-config';

   const BodySchema = z.object({ /* fields */ });

   export async function POST(req: Request, { params }: { params: { id: string } }) {
     const user = await requireUser();
     const shortId = params.id;
     // Validate ownership: const short = await db.short.findUnique({ where: { id: shortId, userId: user.id } });
     if (!short) throw new ApiError(404, 'Short not found');

     const data = BodySchema.parse(await req.json());
     const feature: FeatureKey = 'ai_image_generation'; // Example
     await validateCreditsForFeature(user.id, feature);

     // Business logic + Prisma tx
     const result = await db.$transaction(async (tx) => { /* ops */ });

     await deductCreditsForFeature({ clerkUserId: user.id, feature, projectId: shortId, details: { action: 'new-action' } });
     return NextResponse.json({ data: result }, { status: 200 });
   }
   ```
4. **Error Handling**: Use `createErrorResponse({ error: 'Msg', details })`; catch-all 500 without leaks.
5. **Pagination/List**: Support `?page=1&pageSize=50&search=term`; return `{ items, pagination: { page, total, pages } }`.

### Workflow 2: Build Frontend Feature (e.g., New Shorts Dialog)
1. **UI Component**: Extend shadcn; `src/components/shorts/NewActionDialog.tsx`.
   ```tsx
   'use client';
   import { useMutation } from '@tanstack/react-query';
   import { Button } from '@/components/ui/button';
   // Props: NewActionDialogProps

   export function NewActionDialog({ shortId, onSuccess }: Props) {
     const mutation = useMutation({
       mutationFn: async (data: BodyType) => apiClient.POST(`/api/shorts/${shortId}/new-action`, { body: data }),
       onSuccess: onSuccess,
     });
     // Dialog form with Zod resolver, Button onSubmit={mutation.mutate}
   }
   ```
2. **Page Integration**: Server Component fetches data via `queries/`, Client renders dialog.
3. **Hooks**: Use `useQuery` for lists; optimistic updates via `queryClient.setQueryData`.
4. **Credits UI**: Integrate `CreditEstimate` for previews.

### Workflow 3: AI-Integrated Feature (e.g., New Image Gen Endpoint + UI)
1. Backend: `/api/ai/new-image/route.ts`; validate `{ model: string, prompt: string, count?: number }`; use `streamText` or `generateText` from `ai`; deduct scaled credits.
2. Frontend: `AIModelSelector` + textarea; `useMutation` to API; display images.
3. Models: Filter via `useAvailableModels()`; default `getDefaultModel()`.

### Workflow 4: Admin Feature (e.g., User Management Table)
1. API: `/api/admin/users/route.ts` with pagination/search.
2. UI: `src/app/admin/users/page.tsx` (Server: fetch via queries), `DataTable` with `Column[]`.
3. Auth: `requireAdmin()`.

### Deployment Checks
1. Run `npm run lint -- --fix`, `npm run typecheck`, `npm run build`.
2. Test: `npm run dev`; verify auth, credits deduct, no leaks.
3. Docs: Update `docs/api.md` with schema/examples.

## Best Practices & Code Patterns

### Auth & Security
- Always `await requireUser()` first; tenant-scope by `userId`.
- Server-only: No `@/lib/db` in client bundles.
- Validation: `Zod.parse(await req.json())`; `.strict()` or reject unknowns.

### Credits Gating (Mandatory for AI/Billable)
```
await validateCreditsForFeature(user.id, feature);
...logic...
await deductCreditsForFeature({ clerkUserId: user.id, feature, details: {...}, quantity: 1 });
```

### Responses
- Success: `NextResponse.json({ data }, { status: 200/201 })`.
- Errors: `createErrorResponse({ error: 'Brief msg', details? })`; 402 for insufficient credits.

### Frontend Patterns
- Queries: `useQuery({ queryKey: ['shorts', shortId], queryFn: () => apiClient.GET(...) })`.
- Mutations: `useMutation` with `onSuccess: () => queryClient.invalidateQueries(...)`.
- UI: Composition (Dialog > Form > Button); animations via `glowing-effect.tsx`.
- Types: Export props/interfaces for reuse.

### Conventions
- Naming: `kebab-case` routes, `PascalCase` components, `camelCase` hooks.
- Imports: `@/*` aliases.
- Logging: `withApiLogging` wrapper; no PII.
- Optimizations: Server Components default; `'use client'` explicit.

### Common Pitfalls
- No direct Prisma in components/hooks.
- Webhooks: Verify Svix, idempotent.
- AI: Proxy only; validate `provider: 'openrouter'`, model format `vendor/model`.
