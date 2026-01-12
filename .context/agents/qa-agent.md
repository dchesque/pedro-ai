# Feature Developer Agent – Playbook

## Objective
Implement new features or enhancements in the Pedro AI Next.js SaaS app, focusing on AI-driven content generation (shorts, roteirista, estilos, characters), billing/credits, admin tools, and user-facing UI. Ensure seamless integration with existing patterns for API routes, React components, hooks, and AI providers while maintaining type safety, performance, and credit accounting.

## Codebase Overview
- **Tech Stack**: Next.js 14+ (App Router), TypeScript (.ts/.tsx), Tailwind CSS, shadcn/ui components, React hooks, Prisma ORM, Clerk auth, Vercel AI SDK integration.
- **Core Layers**:
  | Layer | Directories | Purpose |
  |-------|-------------|---------|
  | **API Controllers** | `src/app/api/*` | Route handlers for user actions (e.g., `/api/shorts/[id]/generate`, `/api/ai/chat`). Use `withApiLogging`, auth guards (`validateApiKey`), and Zod schemas. |
  | **UI Components** | `src/components/*`, `src/app/(protected)/*`, `src/app/(public)/*` | Reusable UI (shadcn/ui primitives like `button.tsx`, `data-table.tsx`), feature-specific (e.g., `shorts/CreateShortForm.tsx`, `roteirista/ScriptWizard.tsx`). |
  | **Hooks & Logic** | `src/hooks/*`, `src/lib/*` | State management (e.g., `useAvailableModels`, `useOpenRouterModels`), AI utils (`src/lib/ai/*`), API client (`src/lib/api-client.ts`). |
  | **Models & Config** | `src/lib/ai/models.ts`, `src/hooks/use-ai-models.ts` | AI model definitions (`AIModel`), provider integrations (OpenRouter, Fal.ai). |
  | **Admin** | `src/app/admin/*`, `src/components/admin/*` | Dashboards for users, credits, plans, agents; data tables for listings. |
- **File Count**: 366 total; 344 TS/TSX. Focus on high-impact areas: API routes (100+), components (150+).
- **Key Conventions**:
  - **Naming**: Kebab-case for routes/files (e.g., `shorts-[id]-generate`), PascalCase for components/props.
  - **Exports**: Default for pages/components; named for hooks/utils (e.g., `export const useAIModels`).
  - **Error Handling**: `ApiError`, `createErrorResponse` from `src/lib/api-auth.ts`.
  - **Responses**: JSON with `createSuccessResponse(data)`.
  - **Auth**: Clerk webhooks, `validateApiKey` for API.
  - **Credits**: Always deduct/check via `/api/credits/me`; estimate with `CreditEstimate.tsx`.
  - **Streaming**: Use `StreamingTextResponse` for AI chat/script gen.

## Key Files & Purposes
| File/Path | Purpose | Key Symbols/Usage |
|-----------|---------|-------------------|
| `src/lib/api-client.ts` | Centralized API fetcher with auth, error handling. | `apiClient`, `ApiError` – Use for all client-side API calls. |
| `src/lib/api-auth.ts` | Auth guards, response helpers. | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse` – Wrap all API handlers. |
| `src/lib/ai/models.ts` | AI model registry, defaults. | `AIModel`, `getDefaultModel`, `getModelCredits` – Central for model selection/pricing. |
| `src/hooks/use-ai-models.ts` | Fetches/saves models with SWR. | `useAIModels`, `useDefaultModel` – Use in selectors like `AIModelSelector.tsx`. |
| `src/components/ui/*` | shadcn/ui primitives. | `ButtonProps`, `DataTableProps`, `GlowingEffectProps` – Extend for custom variants. |
| `src/components/shorts/*` | Short video workflow UI. | `CreateShortFormProps`, `SortableSceneListProps` – Model for new media features. |
| `src/components/roteirista/*` | Script generation wizard. | `ScriptWizardProps`, `AITextAssistantProps` – AI-assisted text editing/streaming. |
| `src/components/estilos/*` | Style customization. | `StyleFormProps`, `IconPickerProps` – Form-heavy with previews. |
| `src/components/characters/*` | Character management. | `CharacterSelectorProps`, `CharacterDialogProps` – Reusable for AI prompts. |
| `src/components/credits/*` | Credit display/estimation. | `CreditStatusProps` – Integrate everywhere AI is used. |
| `src/lib/logging/api.ts` | API middleware for tracing. | `withApiLogging` – Apply to new handlers. |
| `src/app/api/shorts/[id]/*` | Example feature API tree. | Full CRUD + AI ops (generate, regenerate); mirror for new features. |

## Workflows for Common Tasks

### 1. **New User Feature (e.g., New AI Tool like "Podcasts")**
   1. **Plan Structure**:
      - Page: `src/app/(protected)/podcasts/page.tsx`, `[id]/page.tsx`, `novo/page.tsx`.
      - Components: `src/components/podcasts/PodcastForm.tsx`, `PodcastList.tsx`.
      - API: `src/app/api/podcasts/route.ts` (list/create), `src/app/api/podcasts/[id]/route.ts` (fetch), `src/app/api/podcasts/[id]/generate/route.ts`.
   2. **Implement UI**:
      - Scaffold page with `<PageHeader />`, `<DataTable />` or cards.
      - Use existing: `AIModelSelector`, `CreditEstimate`, `CharacterSelector`.
      - Hooks: Copy `useAvailableModels`; add `usePodcasts`.
   3. **Build API**:
      ```
      import { withApiLogging } from '@/lib/logging/api';
      import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
      import { z } from 'zod';

      export const POST = withApiLogging(async (req) => {
        validateApiKey(req);
        const data = z.object({ ... }).parse(await req.json());
        // Business logic: Prisma ops, AI call via src/lib/ai/providers
        return createSuccessResponse(result);
      });
      ```
   4. **Integrate AI/Credits**:
      - Select model: `getDefaultModel()`.
      - Deduct credits: Call `/api/credits/me` pre/post.
   5. **Test & Polish**:
      - Add data-testids, responsive Tailwind.
      - Run `npm run lint`, `npm run typecheck`.

### 2. **Enhance Existing Feature (e.g., Add "Regenerate Audio" to Shorts)**
   1. Identify entry: `src/app/api/shorts/[id]/scenes/[sceneId]/regenerate.ts`.
   2. Extend: Add query param `?type=audio`; branch in handler.
   3. UI: New button in `SceneCard.tsx` → `RegenerateSceneDialog.tsx` variant.
   4. Update `CreditEstimate`: Factor new cost.
   5. Hooks: Extend `useShort` if stateful.

### 3. **Admin Endpoint/Page (e.g., Manage New Resource)**
   1. Page: `src/app/admin/podcasts/page.tsx` with `DataTable`.
   2. API: `src/app/api/admin/podcasts/route.ts`; use `adminAuth` guard.
   3. Components: `src/components/admin/PodcastsTable.tsx` extending `data-table.tsx`.
   4. Columns: `{ accessorKey: 'id', header: 'ID' }`; actions via `ColumnDef`.

### 4. **AI Integration (Chat/Script/Image Gen)**
   1. Use `src/lib/ai/providers/*` (OpenRouter, Fal).
   2. Streaming: `new StreamingTextResponse(stream)`.
   3. Prompts: Chain from `src/app/api/roteirista/ai/*` patterns.
   4. UI: `AITextAssistant.tsx` for editable streaming.

### 5. **Full Feature Rollout Checklist**
   1. Add nav: `src/components/navigation/*`.
   2. Permissions: Clerk role checks in API/UI.
   3. Credits/Plans: Update `PlanFeatureDisplay`, admin plans.
   4. Docs: Add to `docs/features/[new].md`.
   5. Deploy Prep: `npm run build`; check Vercel previews.

## Best Practices & Patterns
- **TypeScript**: Full types; Zod for APIs (`z.object({})`), `infer` for props.
- **Performance**: SWR/TanStack Query in hooks; `Suspense` for loading.
- **UI Consistency**: shadcn variants (`variant="outline"`); `cn()` utility for classes.
- **Error Boundaries**: Wrap pages in `ErrorBoundary`.
- **Accessibility**: `aria-label`, roles; test with screen readers.
- **Credit Safety**: Always `await deductCredits(modelId, estimated)` before AI calls.
- **Logging**: `withApiLogging` everywhere; trace user IDs.
- **Testing**: Add E2E in `tests/e2e`; unit for hooks (`vitest`).
- **Avoid**: Direct DOM manip; live external calls without fallbacks.
- **Migrations**: New Prisma models → `npm run db:generate`, `db:migrate`.

## Deliverables for Features
- Fully typed components/hooks/API.
- Updated nav, plans, credits integration.
- PR with changelog, screenshots, E2E tests.
- No console warnings; 100% type coverage.

Use this playbook for all feature dev tasks to align with codebase standards.
