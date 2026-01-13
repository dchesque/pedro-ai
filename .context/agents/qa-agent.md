# Feature Developer Agent Playbook

## Objective
Implement new features or enhancements in the Pedro AI Next.js SaaS app, an AI-powered platform for generating shorts, scripts (roteirista), styles (estilos), characters, climates, and agents. Focus on user workflows (protected routes), admin dashboards, AI integrations (OpenRouter, Fal.ai), billing/credits, and responsive UI. Maintain type safety (TypeScript/Zod), performance (SWR/Suspense), credit accounting, and consistency with shadcn/ui, Tailwind, and Prisma.

## Codebase Overview
- **Tech Stack**: Next.js 14+ (App Router), TypeScript (380+ .ts/.tsx files), Tailwind CSS, shadcn/ui, React 18+, Zod validation, Prisma ORM, Clerk auth, Vercel AI SDK, SWR for data fetching.
- **Stats**: 406 files, 911 symbols; primarily .ts(210)/.tsx(170).
- **Core Layers**:
  | Layer | Key Directories | Purpose & Focus Areas |
  |-------|-----------------|-----------------------|
  | **Components (UI/Views)** | `src/components/*`, `src/app/(protected)/*`, `src/app/(public)/*`, `src/app/admin/*` | Reusable primitives (`ui/*`), feature-specific (shorts, roteirista, estilos, tones, climates). Pages like `(protected)/shorts/[id]`, `admin/agents/[id]`. 203+ symbols (e.g., `usePageConfig`, `PlanFeatureDisplay`). |
  | **Controllers (API)** | `src/app/api/*`, `src/lib/*`, `src/hooks/*` | Route handlers (e.g., `shorts/[id]/generate`, `agents/[slug]/execute`, `ai/chat`). Auth (`validateApiKey`), logging (`withApiLogging`), Zod schemas. 178+ symbols (e.g., `ApiError`, `apiClient`). |
  | **Models & Hooks** | `src/lib/ai/*`, `src/hooks/*`, `src/components/admin/*` | AI models (`AIModel`), hooks (`useAvailableModels`, `useOpenRouterModels`). Data types (e.g., `BillingPlan`, `OpenRouterModel`). 31+ symbols. |
  | **Admin** | `src/app/admin/*`, `src/components/admin/*` | Dashboards (users, usage, credits, plans, agents); data tables, forms. |
  | **Other** | `src/lib/logging/*`, `src/components/providers/*`, `src/components/styles/*` | Middleware, themes (`ThemeProvider`), previews. |

- **Key Conventions**:
  - **Naming**: Kebab-case files/routes (e.g., `shorts-[id]-generate`), PascalCase components/props (e.g., `CreateShortFormProps`).
  - **Exports**: Named for hooks/utils (e.g., `export const useAIModels`), default for pages/components.
  - **Error Handling**: `ApiError`, `createErrorResponse`/`createSuccessResponse`/`createUnauthorizedResponse`.
  - **Auth**: Clerk (`validateApiKey`), webhooks (`/api/webhooks/clerk`).
  - **Credits**: Pre-check via `/api/credits/me`; estimate with `CreditEstimate`.
  - **AI Streaming**: `StreamingTextResponse` for chat/script.
  - **UI**: `cn()` for Tailwind classes; shadcn variants.

## Key Files & Purposes
| File/Path | Purpose | Key Symbols/Props & Usage |
|-----------|---------|---------------------------|
| `src/lib/api-client.ts` | Client-side API fetcher with auth/errors. | `apiClient`, `ApiError` – Use in hooks for all fetches. |
| `src/lib/api-auth.ts` | API guards/response helpers. | `validateApiKey`, `createSuccessResponse` – Wrap every handler. |
| `src/lib/ai/models.ts` | AI model registry/pricing. | `AIModel`, `getDefaultModel`, `getModelCredits` – Select models. |
| `src/hooks/use-ai-models.ts` | Model fetching/saving (SWR). | `useAIModels`, `useDefaultModel`, `useAdminModels` – In selectors. |
| `src/hooks/use-openrouter-models.ts` | OpenRouter-specific models. | `OpenRouterModel`, `useOpenRouterModels` – For advanced AI. |
| `src/components/ui/button.tsx` | shadcn button primitive. | `ButtonProps` – Base for all actions (e.g., `variant="destructive"`). |
| `src/components/ui/data-table.tsx` | Sortable/filterable tables. | `DataTableProps`, `Column` – Admin lists (users, agents). |
| `src/components/ui/glowing-effect.tsx` | Animated glow UI effect. | `GlowingEffectProps` – Enhance buttons/cards. |
| `src/components/shorts/CreateShortForm.tsx` | Short creation form. | `CreateShortFormProps` – Template for new forms. |
| `src/components/shorts/SortableSceneList.tsx` | Draggable scene reorder. | `SortableSceneListProps` – Media workflows. |
| `src/components/shorts/SceneCard.tsx` | Individual scene UI. | `SceneCardProps` – Edit/regenerate dialogs. |
| `src/components/shorts/CreditEstimate.tsx` | AI cost preview. | `CreditEstimateProps` – Mandatory for AI buttons. |
| `src/components/shorts/AIModelSelector.tsx` | Model dropdown. | `AIModelSelectorProps` – Reuse everywhere. |
| `src/components/roteirista/ScriptWizard.tsx` | Script gen wizard. | `ScriptWizardProps` – Multi-step AI text. |
| `src/components/styles/guided-select-group.tsx` | Style selectors. | `GuidedSelectGroupProps` – Form groups. |
| `src/components/tones/ToneCard.tsx` | Tone previews. | `ToneCardProps` – Prompt enhancers. |
| `src/components/styles/climate-affinities.tsx` | Climate matching. | `ClimateAffinitiesProps`, `Climate` – Style/climate logic. |
| `src/lib/logging/api.ts` | API tracing middleware. | `withApiLogging` – Apply to handlers. |
| `src/app/api/shorts/[id]/generate/route.ts` | Example AI endpoint. | Full pattern: Auth → Zod → AI → Credits → Stream. |

## Workflows for Common Tasks

### 1. New Feature (e.g., "Podcasts" Tool)
   1. **Scaffold Structure**:
      - Pages: `src/app/(protected)/podcasts/page.tsx` (list), `novo/page.tsx` (create), `[id]/page.tsx` (edit).
      - Components: `src/components/podcasts/PodcastForm.tsx`, `PodcastCard.tsx`, `PodcastList.tsx`.
      - API: `src/app/api/podcasts/route.ts` (CRUD list), `[id]/route.ts` (fetch/update), `[id]/generate/route.ts` (AI).
   2. **UI Implementation**:
      - Page layout: `<PageHeader title="Podcasts" /> <DataTable columns={podcastColumns} />`.
      - Forms: Extend `CreateShortFormProps`; add `AIModelSelector`, `CreditEstimate`.
      - Hooks: `usePodcasts` (SWR fetch), `useCreatePodcast`.
   3. **API Handler Template**:
      ```ts
      import { withApiLogging } from '@/lib/logging/api';
      import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
      import { z } from 'zod';
      import { getDefaultModel } from '@/lib/ai/models';

      const schema = z.object({ title: z.string(), model: z.string().optional() });

      export const POST = withApiLogging(async (req) => {
        validateApiKey(req);
        const { model = getDefaultModel().id } = schema.parse(await req.json());
        // Check credits: await apiClient('/api/credits/me')
        // AI call: via src/lib/ai/providers
        const result = await generatePodcast(...);
        return createSuccessResponse(result);
      });
      ```
   4. **AI/Credits Integration**:
      - Model: `useAvailableModels()` or `getModelCredits(modelId)`.
      - Deduct: POST `/api/credits/me` pre-AI; handle failures.
   5. **Navigation & Permissions**:
      - Add to `src/components/navigation/Sidebar.tsx`.
      - Clerk metadata checks in API/UI.
   6. **Test**: Lint, typecheck, E2E (`tests/e2e`), manual previews.

### 2. Enhance Existing Feature (e.g., "Audio Regen" in Shorts)
   1. Locate: `src/app/api/shorts/[id]/scenes/[sceneId]/regenerate/route.ts`, `src/components/shorts/SceneCard.tsx`.
   2. API: Add `type: z.enum(['image', 'script', 'audio'])`; branch logic.
   3. UI: New `<Button>` in `SceneCard`; extend `RegenerateSceneDialogProps`.
   4. Update: `CreditEstimate` for audio cost; `SortableSceneList` refresh.
   5. Hook: Extend `useShort` with optimistic updates.

### 3. Admin Feature (e.g., "Manage Podcasts")
   1. Page: `src/app/admin/podcasts/page.tsx` → `<DataTable />`.
   2. API: `src/app/api/admin/podcasts/route.ts`; admin guard.
   3. Columns: `const columns: ColumnDef<Podcast>[] = [{ accessorKey: 'id', header: 'ID' }, ...]`.
   4. Actions: Dropdown with edit/delete (use `DropdownTriggerButton`).

### 4. AI/Chat Integration
   1. Endpoint: Mirror `src/app/api/ai/chat/route.ts` or `roteirista/ai/assist`.
   2. UI: `AITextAssistant` or `ScriptPreview` for streaming edits.
   3. Prompts: Chain tones/climates/characters (e.g., `climate-affinities`).
   4. Stream: `StreamingTextResponse(new ReadableStream(...))`.

### 5. Full Rollout Checklist
   1. Plans: Update `PlanFeatureDisplay` in admin.
   2. Credits: New enum in `/api/admin/health/credits-enum`.
   3. Styles/Themes: Test with `ThemeProvider`, `GlowingEffect`.
   4. Responsive: Tailwind (`md:grid-cols-2`), mobile nav.
   5. Deploy: `npm run build`, Vercel envs (AI keys).

## Best Practices & Patterns
- **TypeScript/Zod**: Infer types (`z.infer<typeof schema>`); props like `SceneCardProps`.
- **Performance**: SWR in hooks (`useSWR('/api/...')`); `Suspense` wrappers.
- **UI**: Extend shadcn (`Button`, `DataTable`); `cn('class', props.className)`; animations via `component.tsx` (`AnimationProps`).
- **Error Handling**: Try/catch → `createErrorResponse({ message, code })`; toasts.
- **Credits Safety**: Always estimate/show `CreditEstimate`; deduct before AI.
- **Logging/Security**: `withApiLogging` mandatory; rate-limit heavy endpoints.
- **Accessibility**: `aria-label`, `role`; keyboard nav in tables/dialogs.
- **Testing**: Vitest for hooks; Playwright E2E; 100% coverage.
- **Migrations**: Prisma schema → `npx prisma db push migrate`.
- **Avoid**: Global state (use context/hooks); unhandled promises.

## Deliverables
- Typed code (no `any`).
- Screenshots in PR.
- Changelog update.
- E2E tests.
- Build passes.
