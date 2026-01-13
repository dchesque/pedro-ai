# Feature Developer Agent Playbook

## Overview

This playbook equips the feature-developer agent to implement new features in Pedro AI, a Next.js 14 (App Router) TypeScript/React application for AI-powered content creation. Core domains include Shorts (video scripts/scenes/media generation), Roteirista (script writing/assist), Estilos/Styles (custom AI styles with tones/climates), Characters, AI Chat/Studio, Billing/Subscriptions/Credits, and Admin tools (users, plans, usage, models).

**Architecture Layers**:
- **Backend**: API routes (`src/app/api/` with dynamic segments like `[id]`, `[slug]`), Prisma ORM (`prisma/schema.prisma`), queries (`src/lib/queries/`), utils (`src/lib/ai/`, `src/lib/credits/`, `src/lib/logging/`).
- **Frontend**: Server Components in pages (`src/app/(protected)/`, `src/app/admin/`), Client Components (`src/components/`), hooks (`src/hooks/` with TanStack Query).
- **Shared**: AI providers/models (`src/lib/ai/providers/`, `src/hooks/use-openrouter-models.ts`), auth (`src/lib/api-auth.ts`), logging (`src/lib/logging/api.ts`), credits tracking (`UsageHistory` model with `OperationType` enum).

**Core Constraints & Principles**:
- Multi-tenant: All models filter by `userId` (Clerk auth).
- Credits economy: Pre-estimate (`getModelCredits`), check balance, post-debit via `src/lib/credits/`.
- Optimistic UI: TanStack Query mutations with invalidation (queryKeys: `['shorts', id]`, `['user-styles']`).
- Server-first: Data fetching in Server Components via queries; no Prisma outside `src/lib/`.
- UI: shadcn/ui + Tailwind, animations (`glowing-effect.tsx`), dialogs/modals for actions.

**Primary Focus Areas**:
| Layer | Key Directories/Files | Purpose & Patterns |
|-------|-----------------------|-------------------|
| **Controllers (API)** | `src/app/api/shorts/[id]/*` (e.g., `generate`, `scenes/[sceneId]/regenerate`), `src/app/api/roteirista/ai/*`, `src/app/api/estilos/[id]`, `src/app/api/admin/*` (e.g., `users/[id]/credits`, `styles/[id]`), `src/lib/api-auth.ts`, `src/lib/logging/api.ts` | Auth (`validateApiKey`), logging (`withApiLogging`), responses (`createSuccessResponse`, `ApiError`). POST/PUT for mutations, GET for reads. Use `apiClient` for internal calls. |
| **Components (UI)** | `src/components/shorts/` (e.g., `SortableSceneList.tsx`, `CreateShortForm.tsx`, `CreditEstimate.tsx`), `src/components/roteirista/` (e.g., `ScriptWizard.tsx`), `src/components/estilos/` (e.g., `StyleForm.tsx`), `src/components/ui/` (primitives: `data-table.tsx`, `button.tsx`, `glowing-effect.tsx`), `src/components/tones/`, `src/components/styles/` (e.g., `climate-affinities.tsx`) | Feature-specific cards/forms/dialogs (e.g., `SceneCard.tsx`, `RegenerateSceneDialog.tsx`). Props like `ShortCardProps`, client-side `'use client'` with mutations. |
| **Pages/Views** | `src/app/(protected)/shorts/[id]`, `src/app/(protected)/roteirista/[id]`, `src/app/(protected)/estilos/[id]`, `src/app/admin/users/[id]`, `src/app/admin/agents/[id]` | Server Components fetch data; client children handle interactions. Layouts in `(protected)` enforce auth. |
| **Data/Models/Hooks** | `prisma/schema.prisma`, `src/lib/queries/` (e.g., `shorts.ts`), `src/lib/ai/models.ts` (`AIModel`), `src/hooks/` (e.g., `useAvailableModels`, `useOpenRouterModels`, `useAIModels`) | Prisma models with `userId`, relations (`onDelete: Cascade`). Queries: `select { id, userId, ...include: { scenes: true } }`. Hooks for models (`getDefaultModel`). |
| **Utils/Lib** | `src/lib/credits/`, `src/lib/ai/providers/`, `src/hooks/use-page-config.ts` | Credits: estimation/logging. AI: providers (OpenRouter, Fal.ai). Config: `usePageConfig`. |

**Key Files & Purposes**:
- **UI Primitives**: `src/components/ui/data-table.tsx` (lists with `DataTableProps<Column>`), `button.tsx` (`ButtonProps`), `glowing-effect.tsx` (animations), `component.tsx` (expandable/animations).
- **Feature Components**: `src/components/shorts/SortableSceneList.tsx` (drag-reorder scenes), `CreateShortForm.tsx` (new short), `AIModelSelector.tsx`; `src/components/roteirista/StylePreviewCard.tsx`, `ScriptWizard.tsx`; `src/components/styles/guided-select-group.tsx`, `climate-affinities.tsx`.
- **Hooks**: `src/hooks/use-ai-models.ts` (`useAIModels`, `useDefaultModel`), `use-available-models.ts` (`AIModel`), `use-openrouter-models.ts`.
- **Lib**: `src/lib/api-client.ts` (`ApiError`, `apiClient`), `src/lib/api-auth.ts` (responses), `src/lib/ai/models.ts` (model utils).
- **Admin**: `src/components/admin/plans/types.ts` (`BillingPlan`, `PlanFeatureForm`).

**Essential Symbols to Reuse**:
- Auth/Responses: `ApiError`, `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`, `withApiLogging`.
- AI/Models: `AIModel`, `OpenRouterModel`, `useAvailableModels`, `useOpenRouterModels`, `getDefaultModel`, `getModelCredits`.
- UI Props: `DataTableProps`, `ButtonProps`, `ShortCardProps`, `SceneCardProps`, `CreateShortFormProps`, `GuidedSelectGroupProps`, `ClimateAffinitiesProps`.

## Workflows for Common Tasks

### 1. New/Modify Database Model
1. Update `prisma/schema.prisma`: Add model e.g.,
   ```prisma
   model NewEntity {
     id        String   @id @default(cuid())
     userId    String
     metadata  Json?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     @@index([userId])
     @@index([userId, createdAt])
   }
   ```
2. Run `npx prisma db push` (dev) or `npx prisma migrate dev --name add-new-entity`.
3. `npx prisma generate`.
4. Add query to relevant file (e.g., `src/lib/queries/shorts.ts`):
   ```ts
   export const createNewEntityQuery = async ({ userId, data }: { userId: string; data: any }) => {
     return prisma.newEntity.create({ data: { userId, ...data }, select: { id: true, ... } });
   };
   ```
5. Map to `OperationType` in `src/lib/credits/feature-config.ts` for usage tracking.
6. Update TanStack Query keys: `['new-entities', userId]`.

### 2. New API Endpoint (e.g., `/api/shorts/[id]/new-action`)
1. Create `src/app/api/shorts/[id]/new-action/route.ts`:
   ```ts
   import { NextRequest } from 'next/server';
   import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
   import { withApiLogging } from '@/lib/logging/api';
   import { someQuery } from '@/lib/queries/shorts';
   import { deductCredits } from '@/lib/credits';

   export const POST = withApiLogging(async (req: NextRequest, { params }: { params: { id: string } }) => {
     validateApiKey();
     const data = await req.json();
     // Validate, check credits
     await deductCredits({ operation: 'SHORT_ACTION', modelId: data.modelId });
     const result = await someQuery({ shortId: params.id, ...data });
     return createSuccessResponse({ data: result });
   });
   ```
2. Error: `throw new ApiError('INVALID_INPUT', 400);`.
3. Test via `apiClient.post('/api/shorts/[id]/new-action', data)`.

### 3. New/Extend UI Component (e.g., NewActionDialog)
1. Place in feature dir: `src/components/shorts/NewActionDialog.tsx`.
2. Structure:
   ```tsx
   'use client';
   import { Button } from '@/components/ui/button';
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { apiClient } from '@/lib/api-client';

   interface NewActionDialogProps { shortId: string; onSuccess?: () => void; }

   export function NewActionDialog({ shortId, onSuccess }: NewActionDialogProps) {
     const queryClient = useQueryClient();
     const mutation = useMutation({
       mutationFn: (data: any) => apiClient.post(`/api/shorts/${shortId}/new-action`, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['shorts', shortId] });
         onSuccess?.();
       },
     });
     return (
       <Dialog>
         <Button onClick={() => mutation.mutate({ modelId: 'default' })}>Action</Button>
       </Dialog>
     );
   }
   ```
3. Integrate glowing effects: Wrap in `GlowingEffect`.

### 4. New Page/View (e.g., `/shorts/[id]/new-tab`)
1. Create `src/app/(protected)/shorts/[id]/new-tab/page.tsx` (Server Component):
   ```tsx
   import { shortByIdQuery } from '@/lib/queries/shorts';
   import NewActionDialog from '@/components/shorts/NewActionDialog';

   export default async function NewTabPage({ params }: { params: { id: string } }) {
     const short = await shortByIdQuery({ id: params.id });
     return <NewActionDialog shortId={params.id} />;
   }
   ```
2. Use suspense/loading for async.

### 5. AI/Model Integration + Credits
1. Fetch models: `<AIModelSelector models={useAvailableModels()} />`.
2. Estimate: `<CreditEstimate modelId={selected} promptLength={1000} />`.
3. In API: `const credits = getModelCredits(model.id); checkBalance(userId, credits);`.

### 6. Admin CRUD (e.g., Manage NewEntity)
1. Endpoint: `src/app/api/admin/new-entities/route.ts` (list), `/[id]/route.ts` (CRUD).
2. UI: `src/components/admin/NewEntityTable.tsx` with `DataTable`.
3. Hook: `useAdminNewEntities`.

## Best Practices from Codebase

- **Fetching**: Server: queries with `select/include`. Client: TanStack Query (prefetch, optimistic: `onMutate: () => update cache`).
- **Auth/Tenant**: `validateApiKey()` first; always `where: { userId, id }`.
- **Performance**: Index Prisma fields; paginate (`take: 20, cursor`); debounce inputs.
- **UI/UX**: Dialogs for confirms/actions; toasts (`sonner`); loading skeletons; reorder lists (`@dnd-kit` in `SortableSceneList`).
- **Errors**: Structured `ApiError(code, message)`; client: `toast.error(error.message)`.
- **Credits**: Always estimate upfront, atomic debit (tx with usage log).
- **Build/Lint**: Post-change: `npm run lint && npm run build`.
- **Conventions**: PascalCase components, kebab routes, named exports for utils, Json for prompts/metadata.

## Code Patterns & Conventions

- **Query Keys**: `['shorts.list', { userId }]`, `['shorts', id, 'scenes']`.
- **Responses**: `{ data: T | T[], message?: string, creditsUsed?: number }`.
- **Mutations**: Optimistic + invalidate parent lists.
- **Props**: Zod-validated where complex; exhaustive interfaces.
- **Enums**: Extend `OperationType` (e.g., `SHORT_NEW_ACTION`).
- **Full Feature Checklist**:
  1. Schema/query if data change.
  2. API endpoint(s).
  3. Component(s)/hook.
  4. Page integration.
  5. Credits/AI wiring.
  6. Admin if applicable.
  7. Lint/build/test manually.
  8. Docs: Update README if public API.
