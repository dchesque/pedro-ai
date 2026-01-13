# Feature Developer Agent Playbook

## Overview

The **Feature Developer Agent** implements new user-facing features end-to-end, spanning API routes, UI pages/components, React hooks, shared utilities, and integrations (AI, billing, auth). Built on Next.js 15+ (App Router), TypeScript (.ts/.tsx dominant), Tailwind CSS, shadcn/ui, TanStack Query, Prisma (server-only), Clerk auth, Vercel AI SDK with OpenRouter provider. Key domains: **AI Shorts** (script/video gen), **Roteirista** (scripting wizard), **Estilos/Styles** (style creation), **Characters/Climates**, **AI Chat/Studio**, **Agents**, **Billing/Credits/Subscriptions**, **Admin** (users, plans, usage).

**Primary Goals**:
- Full-stack features: API (auth/credits-gated) + UI (Server/Client Components) + hooks.
- Enforce: Zod validation, typed responses, Prisma transactions, credit deduction for AI ops.
- Quality: `npm run lint -- --fix`, `npm run typecheck`, `npm run build`; no client-side Prisma.
- Scale: Pagination/search in lists, optimistic UI, error boundaries.

**Stats**: 406 files, 911 symbols; 210 .ts, 170 .tsx files.

**Repo Structure**:
```
src/
├── app/                    # App Router pages + API routes
│   ├── api/                # Controllers: shorts/[id]/*, styles/[id], roteirista/ai/*, ai/*, admin/*, user/*, webhooks/*
│   ├── (protected)/        # Auth pages: shorts/[id]/edit, roteirista/[id], estilos/[id]/novo, agents/[slug]
│   ├── (public)/           # Landing, sign-in/up
│   └── admin/              # Dashboard: users, agents/[id], settings/plans
├── components/             # UI: ui/ (shadcn), shorts/, roteirista/, estilos/, tones/, styles/, characters/, credits/
├── hooks/                  # TanStack Query: useAvailableModels, useOpenRouterModels, usePageConfig, useAIModels
├── lib/                    # Utils: db.ts (Prisma), api-auth.ts, api-client.ts, credits/*, ai/providers/*, logging/*
└── ...                     # No tests noted; verify via dev/build
```

## Core Focus Areas

### 1. Backend: API Routes (`src/app/api/[domain]/[action]/route.ts`)
- **Dirs**: `shorts/[id]/{generate,scenes/[sceneId],regenerate}`, `styles/[id]`, `roteirista/ai/{suggest-titles,generate-scenes}`, `ai/{chat,image,models}`, `admin/{users/[id],agents/[id],plans,credits}`, `user/{styles,agents}`, `webhooks/{clerk,asaas}`.
- **Patterns**: `requireUser()`/`requireAdmin()`, Zod schemas, `ApiError`, transactions, credits gating, `withApiLogging`, `createErrorResponse`.
- **AI Proxy**: OpenRouter (`ai/sdk`), Fal.ai (`ai/fal/{image,video}`); deduct `ai_text_chat` (1cr), `ai_image_generation` (5cr+).

### 2. Frontend: Pages & Components (`src/app/[group]/[page]/page.tsx`, `src/components/[domain]/*`)
- **Dirs**: `app/(protected)/{shorts/[id]/edit,roteirista/[id],estilos/[id],agents/[slug]}`, `components/{ui/ (DataTable,Button,glowing-effect),shorts/ (SortableSceneList,SceneCard),styles/ (guided-select-group),roteirista/ (ScriptWizard),tones/ (ToneCard),climates/}`.
- **Patterns**: Server Components (queries/* fetches), Client (`'use client'`, `useMutation/useQuery`), shadcn dialogs/tables/forms.

### 3. Shared Layers
- **Hooks** (`src/hooks/`): `useAvailableModels()` (`AIModel[]`), `useOpenRouterModels()` (`OpenRouterModel[]`), `useAIModels()`, `usePageConfig()`.
- **Libs** (`src/lib/`): `db` (Prisma), `apiClient`, `validateApiKey`, `credits/deduct.ts`, `ai/models.ts` (`getDefaultModel()`), `logging/api.ts` (`withApiLogging`).
- **Types**: `AIModel`, `FeatureKey`, domain props (e.g., `SortableSceneListProps`, `StyleFormProps`, `DataTableProps`).

### 4. Config & Utils
- Prisma: `prisma/schema.prisma` (Shorts, Styles, Users, Credits).
- Auth/Billing: Clerk webhooks, Asaas.
- UI Primitives: shadcn (`ui/button.tsx`, `ui/data-table.tsx`).

## Key Files & Purposes

| File/Path | Purpose | Key Exports/Usage |
|-----------|---------|-------------------|
| `src/lib/db.ts` | Prisma singleton (server-only) | `db` for queries/transactions. |
| `src/lib/api-auth.ts` | Auth guards | `requireUser()`, `requireAdmin()`, `createUnauthorizedResponse()`, `createErrorResponse()`. |
| `src/lib/api-client.ts` | Typed API client | `apiClient` for frontend fetches (`POST/GET`). |
| `src/lib/credits/deduct.ts` | Billable gating | `validateCreditsForFeature()`, `deductCreditsForFeature()`. |
| `src/lib/ai/models.ts` | Model registry | `AIModel`, `getDefaultModel()`, `getModelCredits()`. |
| `src/lib/logging/api.ts` | API middleware | `withApiLogging` wrapper. |
| `src/components/ui/data-table.tsx` | Paginated tables | `DataTableProps< T >`, `Column< T >[]`. |
| `src/components/ui/button.tsx` | shadcn Button | `ButtonProps`; variants, loading. |
| `src/components/ui/glowing-effect.tsx` | Animations | `GlowingEffectProps` for highlights. |
| `src/components/shorts/SortableSceneList.tsx` | Shorts scenes | `SortableSceneListProps`; drag/reorder. |
| `src/components/shorts/SceneCard.tsx` | Scene preview | `SceneCardProps`; edit/regenerate dialogs. |
| `src/components/shorts/CreateShortForm.tsx` | New short | `CreateShortFormProps`; model/title selector. |
| `src/components/shorts/CreditEstimate.tsx` | Cost preview | `CreditEstimateProps`; feature-based calc. |
| `src/components/roteirista/ScriptWizard.tsx` | Script gen UI | `ScriptWizardProps`; steps, AI assist. |
| `src/components/styles/guided-select-group.tsx` | Style selectors | `GuidedSelectGroupProps`; cards/groups. |
| `src/components/tones/ToneCard.tsx` | Tone picker | `ToneCardProps`; dialog integration. |
| `src/components/styles/climate-affinities.tsx` | Climate matching | `ClimateAffinitiesProps`, `Climate[]`. |
| `src/hooks/use-available-models.ts` | Model lists | `useAvailableModels()`: `AIModel[]`. |
| `src/app/api/shorts/[id]/generate/route.ts` | Example AI short | Credits-gated script/media gen. |
| `src/app/api/ai/chat/route.ts` | AI chat proxy | Streaming, model param. |

## Specific Workflows & Steps

### Workflow 1: New API Endpoint (e.g., `/api/styles/[id]/clone`)
1. Create `src/app/api/styles/[id]/clone/route.ts`.
2. Define Zod schema/response type.
3. Implement:
   ```ts
   import { NextResponse } from 'next/server';
   import { z } from 'zod';
   import { ApiError } from '@/lib/api-client';
   import { requireUser } from '@/lib/api-auth';
   import { db } from '@/lib/db';
   import { validateCreditsForFeature, deductCreditsForFeature } from '@/lib/credits/deduct';
   import { withApiLogging } from '@/lib/logging/api';

   const BodySchema = z.object({ name: z.string() });

   export const POST = withApiLogging(async (req: Request, { params }: { params: { id: string } }) => {
     const user = await requireUser();
     const { id: styleId } = params;
     const data = BodySchema.parse(await req.json());

     const style = await db.style.findUnique({ where: { id: styleId, userId: user.id } });
     if (!style) throw new ApiError(404, 'Style not found');

     await validateCreditsForFeature(user.id, 'ai_style_clone'); // Custom feature

     const newStyle = await db.$transaction(async (tx) => {
       return tx.style.create({ data: { ...data, userId: user.id, baseStyleId: styleId } });
     });

     await deductCreditsForFeature({ clerkUserId: user.id, feature: 'ai_style_clone', projectId: newStyle.id });
     return NextResponse.json({ data: newStyle });
   });
   ```
4. Support `?page=1&pageSize=20&search=foo` for lists: `{ items: T[], pagination: { page, totalPages, totalCount } }`.
5. Test: `curl` auth header, verify credits deduct.

### Workflow 2: New UI Feature (e.g., Styles Clone Dialog)
1. Component: `src/components/styles/CloneStyleDialog.tsx`.
   ```tsx
   'use client';
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { Button } from '@/components/ui/button';
   import { apiClient } from '@/lib/api-client';
   import { z } from 'zod'; // Form resolver

   interface CloneStyleDialogProps { styleId: string; onSuccess?: () => void; }

   export function CloneStyleDialog({ styleId, onSuccess }: CloneStyleDialogProps) {
     const queryClient = useQueryClient();
     const mutation = useMutation({
       mutationFn: (data: { name: string }) => apiClient.POST(`/api/styles/${styleId}/clone`, { body: data }),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['user-styles'] });
         onSuccess?.();
       },
     });
     // Dialog > Form (react-hook-form + Zod) > Button onClick={mutation.mutate}
   }
   ```
2. Integrate: In `src/app/(protected)/estilos/[id]/page.tsx` (Server fetch styles via queries), trigger via `Button` in `StyleCard`.
3. Add credits preview: `<CreditEstimate feature="ai_style_clone" />`.

### Workflow 3: AI-Integrated Feature (e.g., Shorts Scene Regenerate)
1. API: Extend `src/app/api/shorts/[id]/scenes/[sceneId]/regenerate-image/route.ts`; param `{ model, prompt }`; proxy `ai/fal/image`.
2. Hook: New `useRegenerateScene(sceneId: string)`.
3. UI: `RegenerateSceneDialog.tsx` (`RegenerateSceneDialogProps`); `AIModelSelector`, optimistic image placeholder.
4. Credits: `quantity: scenes.length`; `getModelCredits(model)`.

### Workflow 4: Admin Table Feature (e.g., Styles List)
1. API: `src/app/api/admin/styles/route.ts` (paginated, `requireAdmin()`).
2. Page: `src/app/admin/styles/page.tsx` (Server: `DataTable` with server-side fetch).
3. Columns: `Column[]` def (id, name, user, actions); search/filter.

### Workflow 5: Dialog-Heavy Feature (e.g., Add Tone to Style)
1. UI: `ToneDialog.tsx` + `ToneCard.tsx`; integrate `climate-affinities.tsx`.
2. Mutations: Chain `useMutation` for add/update.
3. Animations: Wrap in `glowing-effect.tsx`.

## Best Practices & Code Patterns

### Auth/Security
- First line: `const user = await requireUser();` (or `requireAdmin()`).
- Ownership: `where: { id, userId: user.id }`.
- No client Prisma: Use `apiClient` or Server Components.

### Credits (AI/Billable Mandatory)
```ts
await validateCreditsForFeature(user.id, featureKey);
...tx...
await deductCreditsForFeature({ clerkUserId: user.id, feature: featureKey, projectId, details: { model, scenes: 3 } });
```

### API Responses
- Success: `{ data: T | T[] }`, status 200/201.
- Errors: `createErrorResponse({ error: 'User-friendly msg', code: 'STYLE_NOT_FOUND', details })`; 402 insufficient.
- Streaming AI: `streamText({ model })`.

### Frontend Patterns
- Queries: `useQuery({ queryKey: ['styles', userId], queryFn: () => apiClient.GET('/api/user/styles') })`.
- Mutations: `onSuccess: () => queryClient.invalidateQueries({ predicate: ... })`.
- Forms: `react-hook-form` + `zodResolver`.
- Tables/Dialogs: `DataTable<Style>`, `Dialog > Card > Form`.
- Props: Export `PascalCaseProps` interfaces.

### UI/Conventions
- shadcn: Extend `ButtonProps`, `DataTableProps`.
- Selectors: `AIModelSelector`, `guided-select-card.tsx`.
- Animations: `AnimationProps` from `ui/component.tsx`.
- Naming: `kebab-case` routes/params, `PascalCase` components/props.
- Imports: `@/components/ui/button`.

### Optimizations/Pitfalls
- Server-first: Data in `page.tsx`, pass to Client children.
- Pagination: Always `{ items, pagination }`.
- Logs: `withApiLogging`; no secrets/PII.
- Builds: Watch for hydration mismatches, client bundlesize.
- AI: Validate model/provider; fallback `getDefaultModel()`.
