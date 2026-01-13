# Feature Developer Agent Playbook

This playbook guides development of new features in this Next.js 15 (App Router) + TypeScript + Tailwind + Prisma + Clerk + React Query codebase. Focus on AI-powered user features (Shorts creation/editing with scenes/script/media gen, Roteirista AI scriptwriting, Estilos/Styles management, Characters, AI chat/image/video via Fal/OpenRouter, billing/credits, agents) and admin tools (users/plans/credits/models/providers). Adhere to patterns: Zod validation, Clerk auth (`userId`), credit deduction, optimistic UI (React Query), shadcn/ui components, `withApiLogging`, typed `apiClient`.

## Core Focus Areas

### 1. **API Routes (Controllers) - `src/app/api/`**
   - **Purpose**: All backend: auth, Zod validation, Prisma CRUD, AI providers (OpenRouter/Fal), webhooks (Clerk/Asaas), credits burns. New features require 1+ dynamic/static routes.
   - **Key Patterns**: `validateApiKey(req)` → `userId`; Zod `schema.parse(await req.json())`; `withApiLogging(async () => {...})`; `createSuccessResponse({data})` / `createErrorResponse`.
   - **Directories & Examples**:
     | Directory/Path | Purpose | Key Routes/Symbols |
     |----------------|---------|--------------------|
     | `src/app/api/shorts/[id]` | Shorts CRUD (script/media gen, scenes reorder/regenerate/approve) | `generate-script`, `scenes/[sceneId]/regenerate-image`, `regenerate`, `generate-media`, `characters` |
     | `src/app/api/roteirista/ai` | AI script assist | `suggest-titles`, `generate-visual-prompt`, `generate-scenes`, `assist` |
     | `src/app/api/styles/[id]` / `user/styles` | Styles CRUD/available | `[id]`, `available`, `user/styles/[id]` |
     | `src/app/api/characters/[id]` | Character prompts/media | `generate-prompt` |
     | `src/app/api/ai` | Core AI (chat/models/image/video) | `chat`, `image`, `fal/video`, `fal/image`, `openrouter/models` |
     | `src/app/api/agents/[slug]` | Agent execution | `execute` |
     | `src/app/api/admin` | Admin CRUD/dashboards | `users/[id]/credits`, `plans/[clerkId]`, `providers/[provider]/models`, `system-agents/[type]`, `storage/[id]`, `backfill-credits` |
     | `src/app/api/credits` / `subscription` | Credits/billing | `me`, `settings`, `status`, `cancel` |
     | `src/app/api/webhooks` | Clerk/Asaas sync | `clerk`, `asaas/[debug/test]` |
   - **Files to Reference/Create**: Mirror structure, e.g., new Shorts scene action → `src/app/api/shorts/[id]/scenes/[sceneId]/new-action/route.ts`. Use `ApiError`, `apiClient`.

### 2. **UI Components & Pages - `src/components/` & `src/app/(protected)/` & `src/app/admin/`**
   - **Purpose**: shadcn/ui + Tailwind React components; App Router pages with layouts. Optimistic updates via React Query mutations.
   - **Key Patterns**: `forwardRef`, `cn()` utils, `react-hook-form` + `zodResolver`, `useForm`; props interfaces (e.g., `ShortCardProps`); `glowing-effect` animations; responsive/mobile-first.
   - **Directories & Examples**:
     | Directory/Path | Purpose | Key Components/Pages |
     |----------------|---------|----------------------|
     | `src/components/shorts` | Shorts UI (forms, scenes, media) | `SortableSceneList` (`SortableSceneListProps`), `ShortCard` (`ShortCardProps`), `SceneCard` (`SceneCardProps`), `RegenerateSceneDialog` (`RegenerateSceneDialogProps`), `EditSceneDialog` (`EditSceneDialogProps`), `CreateShortForm` (`CreateShortFormProps`), `CreditEstimate` (`CreditEstimateProps`), `AIModelSelector` (`AIModelSelectorProps`), `AddSceneDialog` (`AddSceneDialogProps`) |
     | `src/components/roteirista` | Script wizard/AI steps | `StylePreviewCard` (`StylePreviewCardProps`), `ScriptWizard` (`ScriptWizardProps`), `ScriptPreview` (`ScriptPreviewProps`), `SceneEditor` (`SceneEditorProps`), `AITextAssistant` (`AITextAssistantProps`), `steps/` |
     | `src/components/styles` / `estilos` | Styles/Climates/Tones | `GuidedSelectGroup` (`GuidedSelectGroupProps`), `GuidedSelectCard` (`GuidedSelectCardProps`), `ClimateAffinities` (`ClimateAffinitiesProps`, `Climate`), `AdvancedInstructions` (`AdvancedInstructionsProps`), `StyleForm` (`StyleFormProps`), `StyleCard` (`StyleCardProps`) |
     | `src/components/ui` | Primitives | `glowing-effect` (`GlowingEffectProps`), `data-table` (`DataTableProps`, `Column`), `button` (`ButtonProps`), `component` (`ExpandableProps`, `AnimationProps`) |
     | `src/components/tones` | Tone selection | `ToneDialog` (`ToneDialogProps`), `ToneCard` (`ToneCardProps`) |
     | `src/app/(protected)/shorts/[id]` | Protected Shorts pages | `edit/page.tsx` |
     | `src/app/(protected)/roteirista/[id]` / `novo` | Roteirista pages | Novo/edit wizards |
     | `src/app/admin/*` | Admin views | `users/[id]`, `plans`, `credits`, `agents/[id]`, `usage`, `storage`, `settings` (plans/features) |
   - **Pages**: Use `(protected)` layout for user features, `admin` for admins. `usePageConfig` for metadata.

### 3. **Lib, Hooks & Models - `src/lib/` & `src/hooks/`**
   - **Lib**: `api-client.ts` (`apiClient`, `ApiError`), `api-auth.ts` (responses), `ai/models.ts` (`AIModel`, `getDefaultModel`, `getModelCredits`), `ai/providers`, `logging/api.ts` (`withApiLogging`).
   - **Hooks**: AI models (`useAvailableModels`/`AIModel`, `useAIModels`, `useDefaultModel`, `useAdminModels`/`useSaveAdminModels`, `useOpenRouterModels`/`OpenRouterModel`); `usePageConfig`.
   - **Prisma**: `prisma/schema.prisma` (User/Short/Scene/Style/Character/Plan/CreditTransaction). Tenant-scope: `where: { userId }`.

### 4. **Config & Tests**
   - **No explicit tests**; add Vitest in `src/__tests__/` mimicking component/API patterns.
   - **Config**: `next.config.js`, `tailwind.config.js`, `tsconfig.json`. Enforce: `npm run lint`, `typecheck`, `build`.

## Key Files & Purposes

| File/Path | Purpose | Key Exports/Props |
|-----------|---------|-------------------|
| `src/lib/api-client.ts` | Typed fetch for frontend APIs | `apiClient`, `ApiError` |
| `src/lib/api-auth.ts` | Auth/response helpers | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`, `createErrorResponse` |
| `src/lib/ai/models.ts` | AI model registry | `AIModel`, `getDefaultModel`, `getModelById`, `getModelCredits` |
| `src/lib/logging/api.ts` | Route logging | `withApiLogging` |
| `src/hooks/use-ai-models.ts` / `use-available-models.ts` / `use-openrouter-models.ts` / `use-admin-models.ts` | Model selection | `useAIModels`, `useDefaultModel`, `useAvailableModels`, `useAdminModels`, `useSaveAdminModels` |
| `src/components/ui/data-table.tsx` | Reusable tables | `DataTableProps`, `Column` |
| `src/components/ui/glowing-effect.tsx` / `button.tsx` | UI effects/primitives | `GlowingEffectProps`, `ButtonProps` |
| `src/components/shorts/SortableSceneList.tsx` | Draggable scenes | `SortableSceneListProps` |
| `src/components/roteirista/ScriptWizard.tsx` | Multi-step script gen | `ScriptWizardProps` |
| `src/app/api/shorts/[id]/generate/route.ts` | Full Shorts flow example | Script → scenes → media |
| `prisma/schema.prisma` | DB schema/migrations | Add fields → `npx prisma migrate dev` |

## Workflows for Common Tasks

### 1. **New User Feature (e.g., Shorts Scene Reorder)**
   1. **Plan**: Goals, user flow, Zod schemas, credits cost, Clerk scopes.
   2. **DB**: Update `prisma/schema.prisma` (e.g., `order: Int @unique` on Scene). `npx prisma migrate dev --name add-scene-order`.
   3. **API** (`src/app/api/shorts/[id]/scenes/reorder/route.ts`):
      ```ts
      import { NextRequest } from 'next/server';
      import { z } from 'zod';
      import { validateApiKey, createSuccessResponse, createErrorResponse } from '@/lib/api-auth';
      import { withApiLogging } from '@/lib/logging/api';
      import { prisma } from '@/lib/prisma'; // Assume

      const schema = z.object({ sceneIds: z.array(z.string().uuid()) });
      export async function POST(req: NextRequest) {
        return withApiLogging(async () => {
          const { userId } = await validateApiKey(req);
          const { sceneIds } = schema.parse(await req.json());
          await prisma.$transaction(async (tx) => {
            const short = await tx.short.findUnique({ where: { id: params.id, userId } });
            if (!short) throw new Error('Not found');
            for (let i = 0; i < sceneIds.length; i++) {
              await tx.scene.update({ where: { id: sceneIds[i] }, data: { order: i } });
            }
          });
          return createSuccessResponse({ success: true });
        }, 'reorder-scenes');
      }
      ```
   4. **UI/Hooks**: New `useReorderScenes` mutation in `src/hooks/use-shorts.ts`. Update `SortableSceneList.tsx`: `useMutation({ mutationFn: apiClient.POST('/api/shorts/[id]/scenes/reorder'), onMutate: optimisticUpdate })`.
   5. **Page**: Integrate in `src/app/(protected)/shorts/[id]/edit/page.tsx`.
   6. **Validate**: `npm run lint && typecheck && build`.

### 2. **AI Feature (e.g., New Roteirista Title Suggester)**
   1. **API** (`src/app/api/roteirista/ai/suggest-titles/route.ts`): Use `src/lib/ai/providers`, select `getDefaultModel()`. Check/burn credits via `/api/credits/me`.
   2. **Hook**: `useSuggestTitles` with `useMutation`, integrate `useAvailableModels`.
   3. **UI**: Extend `AITextAssistant.tsx` or `ScriptWizard.tsx`; `AIModelSelector`.
   4. **Credits**: Pre-check estimate (`CreditEstimate`); post-deduct.

### 3. **Admin Feature (e.g., Style Management Table)**
   1. **API** (`src/app/api/admin/styles/[id]/route.ts`): Admin auth variant of `validateApiKey`.
   2. **UI**: `data-table` in `src/app/admin/styles/page.tsx` or `[id]/page.tsx`.
   3. **Hook**: `useAdminStyles` like `useAdminModels`.

### 4. **UI Component (e.g., New Dialog)**
   1. `src/components/ui/NewDialog.tsx`: `interface NewDialogProps { open: boolean; onOpenChange: (open: boolean) => void; ... }`.
   2. Form: `useForm({ resolver: zodResolver(z.object({...})) })`.
   3. Animate: Wrap in `glowing-effect`.

## Best Practices & Code Patterns

### **API**
- **Structure**: `POST/PUT` for mutations; JSON responses `{ data: T, error?: string }`.
- **Auth/Scope**: `userId` from Clerk; admin checks.
- **Errors**: Zod → `createErrorResponse({ error: e.message, status: 400 })`.
- **Tx/Prisma**: `$transaction` for multi-ops; `include: { user: true }`.
- **AI**: Fallback `getDefaultModel()`; `OpenRouterModelsResponse`.
- **Credits**: Inline burn or `/api/credits/settings`.

### **Frontend**
- **RQ**: `useQuery({ queryKey: ['shorts', id] })`; `useMutation({ onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }) })`.
- **Forms**: Zod + `react-hook-form`; `Controller` for custom inputs.
- **Hooks**: `use*` prefix, return `{ data, mutate, isPending }`.
- **Components**: `^cn` classes, `aria-label`, `forwardRef<"div", Props>`.
- **Optimistic**: `onMutate: (vars) => queryClient.setQueryData(optimisticData)`.

### **General**
- **TS**: No `any`; export all types/interfaces (e.g., `ClimateAffinitiesProps`).
- **Naming**: PascalCase components, camelCase hooks/fns.
- **Perf/Sec**: Debounce (100ms), infinite queries, `security-check.md`.
- **Mobile**: Tailwind responsive (`md:`, `sm:`); test Figma if designs exist.

## Quality Gates
- **Local**: Lint/typecheck/build/deploy preview.
- **PR**: Screenshots/GIFs, credits impact, migration SQL, links to `frontend-development.md`/`backend-development.md`.
- **Flags**: DB `enabled: Boolean` for phased rollout.

Use tools (`readFile`, `searchCode`) for unknowns. Align 100% with patterns for seamless merges.
