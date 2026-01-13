# Feature-Developer Agent Playbook

## Overview

This playbook equips the feature-developer agent to build new features in Pedro-AI, a Next.js 14 App Router app with TypeScript (.ts/.tsx dominant), React 18, Tailwind CSS, Shadcn/UI, Prisma/Postgres, Clerk auth, TanStack Query, and AI providers (OpenAI, OpenRouter, Fal.ai). The codebase has 406 files, 911 symbols, focusing on AI-driven content: shorts generation (`/shorts`), scriptwriting (`/roteirista`), styles (`/estilos`), characters, climates, agents, credits/billing, and admin dashboards.

**Core Focus Areas**:
- **API Controllers** (`src/app/api/`): Feature-specific routes (e.g., `shorts/[id]/generate`, `roteirista/ai/*`, `admin/*`). Always auth/credits-wrapped.
- **UI Components** (`src/components/`): Reusables in `ui/` (data-table, button); feature-specific (shorts/, roteirista/, estilos/, tones/, climates/).
- **Protected Pages** (`src/app/(protected)/`): User features (shorts/[id], roteirista/[id], estilos/[id], agents/[slug]).
- **Admin Pages** (`src/app/admin/`): Dashboards (users/[id], plans, credits, usage).
- **Public Pages** (`src/app/(public)/`): Auth/landing.
- **Lib & Hooks** (`src/lib/`, `src/hooks/`): AI models, credits, auth, logging, page config.
- **Data/Models**: Prisma-driven; AI models via `src/lib/ai/models.ts`.

**Principles**:
- Server-centric: Auth (`validateApiKey`), credits (`deductCreditsForFeature`), validation (Zod) on APIs.
- Client-optimized: TanStack Query hooks, optimistic UI, React Hook Form.
- AI-safe: Provider-specific endpoints, model validation, credit pre-deduction.
- Secure: Clerk + API keys; transactional DB + credits.

## Key Files and Purposes

| Category | Key Files/Paths | Purpose |
|----------|-----------------|---------|
| **API Utils** | `src/lib/api-auth.ts` | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`, `createErrorResponse`. Mandate for all APIs. |
| | `src/lib/api-client.ts` | Client `apiClient` for fetch/auth/errors. |
| | `src/lib/logging/api.ts` | `withApiLogging` wrapper for traces. |
| **Credits** | `src/lib/credits/*` (feature-config.ts) | `deductCreditsForFeature(userId, 'key')`; transactional with Prisma. |
| **AI/Models** | `src/lib/ai/models.ts` | `AIModel`, `getDefaultModel`, `getModelById`, `getModelCredits`. |
| | `src/hooks/use-ai-models.ts`, `use-available-models.ts`, `use-openrouter-models.ts` | Query hooks for models. |
| **UI Primitives** | `src/components/ui/button.tsx`, `data-table.tsx`, `textarea.tsx`, `glowing-effect.tsx`, `dropdown-trigger-button.tsx` | Shadcn base; extend for tables, forms, effects. |
| **Shorts** | `src/components/shorts/CreateShortForm.tsx`, `SortableSceneList.tsx`, `SceneCard.tsx`, `RegenerateSceneDialog.tsx`, `CreditEstimate.tsx`, `AIModelSelector.tsx` | Forms, scene mgmt, estimates, regenerations. APIs: `shorts/[id]/generate`, `scenes/[sceneId]/regenerate`. |
| **Roteirista** | `src/components/roteirista/ScriptWizard.tsx`, `AITextAssistant.tsx`, `StylePreviewCard.tsx` | Wizards, AI assists, previews. APIs: `roteirista/ai/*` (suggest-titles, generate-scenes). |
| **Styles/Estilos** | `src/components/styles/guided-select-group.tsx`, `climate-affinities.tsx`, `advanced-instructions.tsx`; `src/components/estilos/StyleForm.tsx`, `StyleCard.tsx` | Guided selectors, affinities, forms. APIs: `styles/[id]`, `user/styles`. |
| **Tones/Climates** | `src/components/tones/ToneDialog.tsx`, `ToneCard.tsx`; `src/components/styles/climate-affinities.tsx` | Dialogs/cards for tones/climates. |
| **Admin** | `src/components/admin/*`, `src/app/admin/*` (users/[id], plans, credits) | Tables, charts, CRUD. APIs: `admin/users/[id]/credits`, `admin/plans`. |
| **Other** | `src/hooks/use-page-config.ts` | Page metadata/config. |
| **Pages** | `src/app/(protected)/shorts/[id]/edit/page.tsx`, `roteirista/[id]/page.tsx` | Feature hubs. |

**Relevant Symbols** (Selected):
- APIs: `ApiError`, `apiClient`.
- Hooks: `useOpenRouterModels`, `useAvailableModels`.
- UI Props: `DataTableProps`, `ButtonProps`, `SortableSceneListProps`, `CreateShortFormProps`, `StyleFormProps`.
- Models: `AIModel`, `Climate`.

## Code Conventions & Best Practices

- **File Structure**:
  ```
  src/app/api/[feature]/[id]/[action]/route.ts  # POST/GET handlers
  src/app/(protected)/[feature]/[id]/page.tsx   # Client pages
  src/components/[feature]/[Component].tsx      # Feature UI
  src/hooks/use-[feature]-data.ts               # Queries/mutations
  ```
- **Naming**: Kebab-case paths; PascalCase components; camelCase hooks/functions.
- **Types**: Zod `z.infer`; interfaces for props (e.g., `CreateShortFormProps`).
- **Styling**: Tailwind + shadcn; `cn()` utility; theme via `ThemeProvider`.
- **Data Fetching**: TanStack Query (`useQuery`, `useMutation`); infinite for lists; `enabled: !!userId`.
- **Forms**: `useForm({ resolver: zodResolver(schema) })`.
- **Errors**: Throw `ApiError`; client: `toast.error`.
- **Prisma**: `prisma.$transaction(async tx => { await deductCredits(tx); await dbOp(tx); })`; user-scoped `where: { userId }`.
- **AI**: Server-only; `streamText({ model })`; credits first.
- **Deps**: `pnpm add -D`; `pnpm lint:typecheck:build`.

**Patterns**:
```typescript
// API Route (route.ts)
import { NextRequest } from 'next/server';
import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
import { withApiLogging } from '@/lib/logging/api';
import { deductCreditsForFeature } from '@/lib/credits';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Schema = z.object({ prompt: z.string().min(1) });

export const POST = withApiLogging(async (req: NextRequest) => {
  const user = await validateApiKey(req);
  const { id } = req.params as { id: string }; // Or use route util
  const data = Schema.parse(await req.json());

  await prisma.$transaction(async (tx) => {
    await deductCreditsForFeature(user.id, 'ai_short_generate', { quantity: 1 }, tx);
    // Feature logic, e.g., generate short scenes
  });

  return createSuccessResponse({ data: { success: true } });
});

// Hook (useCreateShort.ts)
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useGenerateShort = () => useMutation({
  mutationFn: (data: { id: string; prompt: string }) => apiClient.post(`/api/shorts/${data.id}/generate`, { body: data }),
  onError: (err) => toast.error('Generation failed'),
});
```

## Workflows for Common Tasks

### 1. Add New Feature Page (e.g., `/shorts/[id]/analyze`)
1. Create `src/app/(protected)/shorts/[id]/analyze/page.tsx`: Import layout; use `<PageHeader title="Analyze Short" />`.
2. Add client component: `<AnalyzeForm />` with `useForm`, `useGenerateAnalysis` hook.
3. Navigation: Update `src/components/navigation/SideNav.tsx` or parent page links.
4. Metadata: `usePageConfig({ title: 'Analyze' })`.
5. Test: Responsive; query keys unique (e.g., `['shorts', id, 'analyze']`).

### 2. New API Endpoint (e.g., `/api/shorts/[id]/analyze`)
1. Create `src/app/api/shorts/[id]/analyze/route.ts`.
2. Auth/Parse: `validateApiKey`, Zod `Schema.parse(await req.json())`.
3. Validate: `prisma.short.findUnique({ where: { id_userId: { id, userId } } })`.
4. Credits: `deductCreditsForFeature(user.id, 'ai_short_analyze')` in transaction.
5. Logic: AI call (e.g., `generateText`), DB update.
6. Wrap: `withApiLogging`.
7. Client: New mutation hook; optimistic update.

### 3. New UI Component (e.g., `AnalyzeDialog.tsx`)
1. `src/components/shorts/AnalyzeDialog.tsx`: `<Dialog><Form {...form}><Button>Analyze</Button></Form></Dialog>`.
2. Props: `AnalyzeDialogProps = { shortId: string; onSuccess?: () => void }`.
3. Integrate hook: `const { mutate } = useAnalyzeShort()`.
4. Patterns: `GlowingEffect`, `DataTable` for results; `CreditEstimate`.
5. Export typed; use in pages.

### 4. AI Feature (e.g., Image Gen in Styles)
1. API: `src/app/api/styles/[id]/generate-image/route.ts`; validate `AIModel`.
2. Deduct: `'ai_image_generation'`.
3. Provider: `fal.ai` via `src/lib/ai/providers`; stream if chat.
4. Client: `AIModelSelector`; `<AIImagePreview />`.

### 5. Admin Feature (e.g., Bulk Credits)
1. Page: `src/app/admin/credits/bulk/page.tsx` with `DataTable`.
2. API: `src/app/api/admin/credits/bulk/route.ts`; admin-only auth.
3. Component: `BulkCreditForm.tsx` with validation.

### 6. DB Schema Update
1. Edit `prisma/schema.prisma` (e.g., add `Analysis` model).
2. `pnpm db:push`; migrate prod.
3. Update queries/prismas.

### 7. Testing/Polish
- **Lint/Build**: `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- **E2E**: Playwright for flows (auth -> feature).
- **Review**: Auth, Zod, credits txn, no client secrets.

**Feature Quick Map**:
| Feature | APIs | Components | Credits Key Example |
|---------|------|------------|---------------------|
| Shorts | `shorts/[id]/scenes/[sceneId]/regenerate` | `SortableSceneList`, `RegenerateSceneDialog` | `ai_short_generate` |
| Roteirista | `roteirista/ai/generate-scenes` | `ScriptWizard`, `SceneEditor` | `ai_text_assist` |
| Styles | `styles/[id]`, `user/styles/[id]` | `GuidedSelectCard`, `StyleForm` | `ai_style_generate` |
| Admin | `admin/users/[id]/credits` | `DataTable` | N/A (admin) |

Adhere strictly for scalable, secure features.
