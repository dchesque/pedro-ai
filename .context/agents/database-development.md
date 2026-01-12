# Feature Developer Agent Playbook

## Overview

This playbook guides the development of new features in the Pedro AI application, a Next.js (App Router) TypeScript/React codebase focused on AI-driven content creation (shorts, roteirista/scripts, estilos/styles, characters, AI chat/studio, billing/credits, admin tools). Features typically span:

- **Backend**: API routes (`src/app/api/`), database models (Prisma), queries (`src/lib/queries/`), lib utils (`src/lib/`).
- **Frontend**: Pages (`src/app/(protected)/`, `src/app/(public)/`, `src/app/admin/`), components (`src/components/`), hooks (`src/hooks/`).
- **Shared**: AI models/providers (`src/lib/ai/`), credits/usage logging (`src/lib/credits/`), auth/logging (`src/lib/api-auth.ts`, `src/lib/logging/`).

Core principles:
- Tenant-isolated (userId/workspaceId on models).
- Credits-based consumption (track via `UsageHistory` with `OperationType` enum).
- Optimistic UI with TanStack Query (queryKeys like `['shorts', id]`).
- Server Components for data fetching; no direct Prisma imports outside `src/lib/queries/`.
- UI built on shadcn/ui primitives (`src/components/ui/`).

**Primary Focus Areas**:
| Area | Directories/Files | Purpose |
|------|-------------------|---------|
| **API Controllers** | `src/app/api/*` (e.g., `shorts/[id]/generate`, `roteirista/ai/*`, `admin/*`) | Route handlers with auth (`validateApiKey`), logging (`withApiLogging`), responses (`createSuccessResponse`). Use `ApiError`, `apiClient`. |
| **UI Components** | `src/components/shorts/`, `src/components/roteirista/`, `src/components/estilos/`, `src/components/ui/`, `src/components/characters/` | Feature-specific (e.g., `SortableSceneList.tsx`, `ScriptWizard.tsx`, `StyleForm.tsx`). Primitives: `data-table.tsx`, `button.tsx`, `glowing-effect.tsx`. |
| **Pages/Views** | `src/app/(protected)/shorts/[id]`, `src/app/(protected)/roteirista/[id]`, `src/app/admin/*` | Route segments with Server Components, client hooks. |
| **Data/Models** | `prisma/schema.prisma`, `src/lib/queries/`, `src/lib/db.ts`, `src/lib/ai/models.ts` | Prisma models (User, Short, Style, etc.). Queries with `select/include`. AI models (`AIModel`). |
| **Hooks/Utils** | `src/hooks/` (e.g., `use-ai-models.ts`, `use-available-models.ts`), `src/lib/credits/`, `src/lib/ai/` | Data fetching (TanStack Query), model selection (`useDefaultModel`), credits estimation. |
| **Admin/Config** | `src/app/admin/*`, `src/components/admin/*` | CRUD for users/styles/plans/credits. |

**Key Symbols to Reuse**:
- Auth/Responses: `ApiError`, `createUnauthorizedResponse`, `createSuccessResponse`, `withApiLogging`.
- AI: `AIModel`, `useAvailableModels`, `getDefaultModel`, `getModelCredits`.
- UI Props: `DataTableProps`, `ButtonProps`, `ShortCardProps`, `SceneCardProps`, etc.

## Workflows for Common Tasks

### 1. Adding/Modifying Database Models
**When**: New entities (e.g., new Short variant, Style type).
1. Edit `prisma/schema.prisma`: Add model with `id: String @id @default(cuid())`, `userId String`, relations (`onDelete: Cascade`), `@@index([userId])`.
2. Run `npm run db:push` (dev) or `npm run db:migrate` (prod-like).
3. Regenerate: `npm run build` (runs `prisma generate`).
4. Add query to `src/lib/queries/` (e.g., `shorts.ts`): Use `select/include` for efficiency, orderBy, pagination.
5. Update credits: Map to `OperationType` enum in `src/lib/credits/feature-config.ts`.
6. Invalidate TanStack caches: Use queryKeys like `['shorts', userId]`.

**Example**:
```prisma
model NewFeature {
  id        String   @id @default(cuid())
  userId    String
  data      Json?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}
```

### 2. Creating a New API Endpoint
**When**: Backend logic for feature (e.g., `/api/shorts/[id]/new-action`).
1. Create route: `src/app/api/shorts/[id]/new-action/route.ts`.
2. Structure:
   ```typescript
   import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
   import { withApiLogging } from '@/lib/logging/api';
   import { createShortQuery } from '@/lib/queries/shorts'; // Use queries

   export async function POST(request: Request, { params }: { params: { id: string } }) {
     validateApiKey(); // Or auth headers
     const data = await request.json();
     // Business logic, credits check
     const result = await createShortQuery({ id: params.id, ...data });
     return createSuccessResponse(result);
   }
   ```
3. Log usage: Wrap in `withApiLogging`.
4. Handle errors: Throw `ApiError`.
5. Test: Use `apiClient` from frontend.

### 3. Building/Updating UI Components
**When**: New forms/cards/dialogs (e.g., new Scene editor).
1. Create in feature dir: `src/components/shorts/NewDialog.tsx`.
2. Use shadcn primitives: `Button`, `DataTable`, `Textarea`.
3. Props pattern: `{ id: string; onSuccess?: () => void; data?: T }`.
4. Client-side: `'use client';` + TanStack Query mutations.
5. Example:
   ```tsx
   'use client';
   import { Button } from '@/components/ui/button';
   import { useMutation } from '@tanstack/react-query';

   interface NewDialogProps { /* ... */ }
   export function NewDialog({ onSuccess }: NewDialogProps) {
     const mutation = useMutation({ mutationFn: apiClient.post('/api/shorts/[id]/new-action') });
     return <Dialog><Button onClick={() => mutation.mutate(data, { onSuccess })}>Save</Button></Dialog>;
   }
   ```

### 4. Adding/Updating Pages
**When**: New route (e.g., `src/app/(protected)/shorts/[id]/new-page/page.tsx`).
1. Server Component: Fetch via queries/hooks.
2. Client interactions: Child Client Components.
3. Layouts: Use `(protected)` for auth routes.
4. QueryKeys: `['shorts', id]`, invalidate on mutations.

### 5. Integrating AI/credits
1. Select model: `useAvailableModels()`, `getDefaultModel()`.
2. Estimate credits: `CreditEstimate` component, `getModelCredits(modelId)`.
3. Log usage: In API, create `UsageHistory` entry.

### 6. Admin Features
1. Use `src/components/admin/` patterns (DataTable for lists).
2. Endpoints: `src/app/api/admin/*` (e.g., `/admin/users/[id]/credits`).

## Best Practices from Codebase

- **Data Fetching**: Server Components → `src/lib/queries/*`. Client → hooks with TanStack Query (prefetch, optimistic updates).
- **Auth/Security**: Always `validateApiKey()` in APIs. Tenant filters on `userId`.
- **Performance**: Prisma `select/include`, `@@index` on filters. Paginate lists (`cursor` for infinite scroll).
- **UI Consistency**: shadcn/ui + Tailwind. Glowing effects/animations for AI flair. Dialogs for modals.
- **Error Handling**: `ApiError` with codes. Toast notifications on client.
- **Testing**: No e2e shown; focus on manual + `npm run build` checks.
- **Cache Invalidation**: Mutations invalidate `['list-key', filters]`, `['item', id]`.
- **Credits**: Pre-check balances, post-debit in API.
- **Migrations**: Descriptive PRs with rollback plans.

## Code Patterns and Conventions

- **File Naming**: Kebab-case routes, PascalCase components (e.g., `ShortCard.tsx`).
- **Exports**: Default for components, named for utils/hooks.
- **TypeScript**: Strict props/interfaces (e.g., `ShortCardProps`). Infer from Prisma.
- **Hooks**: `use[Feature][Action]` (e.g., `useAvailableModels`).
- **Responses**: `{ data: T; message?: string }`.
- **Enums**: Reuse `OperationType` for usage.
- **Json Fields**: For flexible AI prompts/styles.

**Example Full Feature Flow** (New Short Action):
1. Schema: Add field if needed → migrate.
2. Query: `src/lib/queries/shorts.ts` → `updateShortAction`.
3. API: `src/app/api/shorts/[id]/action/route.ts`.
4. Component: `src/components/shorts/ActionDialog.tsx`.
5. Page: Integrate in `src/app/(protected)/shorts/[id]/page.tsx`.
6. Hook: `useShortActions(shortId)`.
7. Credits: Check/estimate/log.

Run `npm run lint && npm run build` after changes. PR with screenshots for UI.
