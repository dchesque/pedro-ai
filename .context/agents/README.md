# Feature Developer Agent Playbook

This playbook equips you to develop new features in this Next.js 15 (App Router) + TypeScript + Tailwind + Prisma + Clerk + React Query codebase. Focus on user-facing features like Shorts creation/editing, Roteirista script generation, Estilos management, AI integrations (chat, image/video gen), billing/credits, and admin tools. Always align with existing patterns: Zod validation, credit-aware APIs, Clerk auth, and optimistic UI updates via React Query.

## Core Focus Areas

### 1. **API Routes (Controllers) - src/app/api/**
   - **Purpose**: Handle all backend logic, auth, validation, DB ops, AI calls, webhooks. Every feature needs 1+ routes.
   - **Key Subdirs**:
     | Directory | Purpose | Example Routes |
     |-----------|---------|----------------|
     | `src/app/api/shorts/[id]` | CRUD for Shorts (generate script/media, scenes reorder/regenerate) | `generate-script`, `scenes/[sceneId]/regenerate-image`, `approve-script` |
     | `src/app/api/roteirista/ai` | AI-assisted scriptwriting | `suggest-titles`, `generate-scenes`, `assist` |
     | `src/app/api/estilos` | Style management | `[id]`, `available`, user-owned styles |
     | `src/app/api/characters/[id]` | Character prompts/media gen | `generate-prompt` |
     | `src/app/api/ai` | Core AI (chat, image/video via Fal/OpenRouter) | `chat`, `image`, `fal/video` |
     | `src/app/api/admin` | Admin CRUD (users, plans, credits, models) | `users/[id]/credits`, `plans/[clerkId]`, `providers/[provider]/models` |
     | `src/app/api/user` | User-specific (styles, agents) | `styles/[id]`, `agents` |
     | `src/app/api/credits` | Credit checks/burns | `me`, `settings` |
     | `src/app/api/subscription` | Billing (status, cancel) | `status`, `cancel` |
   - **Files to Prioritize**: Match feature (e.g., new Short scene action → `src/app/api/shorts/[id]/scenes/[sceneId]/new-action/route.ts`).

### 2. **UI Components & Pages - src/components & src/app/(protected)/ & src/app/admin/**
   - **Purpose**: React components with shadcn/ui base, Tailwind, React Query hooks. Pages use App Router layouts.
   - **Key Subdirs**:
     | Directory | Purpose | Key Components |
     |-----------|---------|----------------|
     | `src/components/shorts` | Short editing (scenes, script gen, media) | `SortableSceneList`, `SceneCard`, `RegenerateSceneDialog`, `CreateShortForm`, `AIModelSelector` |
     | `src/components/roteirista` | Script wizard/AI assist | `ScriptWizard`, `SceneEditor`, `AITextAssistant`, `StylePreviewCard` |
     | `src/components/estilos` | Style creation/listing | `StyleForm`, `StyleCard`, `IconPicker` |
     | `src/components/characters` | Character mgmt | `CharacterSelector`, `CharacterDialog` |
     | `src/components/ui` | Reusable primitives | `data-table`, `button`, `textarea`, `glowing-effect` |
     | `src/components/admin` | Admin dashboards | Plans, users, credits tables |
     | `src/app/(protected)` | Protected pages | `shorts/[id]/edit`, `roteirista/novo`, `estilos/novo` |
   - **Pages**: Extend `(protected)` or `admin` layouts. Use `usePageConfig` hook for metadata.

### 3. **Lib & Hooks - src/lib & src/hooks/**
   - **Utilities**: `api-client.ts` (typed fetch), `api-auth.ts` (responses/errors), `ai/models.ts` (AIModels), `logging/api.ts` (withApiLogging).
   - **Hooks**: `useAvailableModels`, `useOpenRouterModels`, `use-ai-models.ts` for AI selection.

### 4. **Prisma & DB - prisma/schema.prisma**
   - Models: User, Short, Scene, Style, Character, Plan, CreditTransaction. Always scope queries tenant/user via Clerk `userId`.

### 5. **Tests & Config**
   - **No dedicated tests visible**; add Vitest/Jest for new features (mimic `src/__tests__` if exists).
   - **Config**: `next.config.js`, `tailwind.config.js`, `tsconfig.json`. Run `npm run lint`, `typecheck`, `build`.

## Key Files & Purposes

| File/Path | Purpose |
|-----------|---------|
| `src/lib/api-client.ts` | Typed API client (`apiClient`, `ApiError`). Use for all frontend API calls. |
| `src/lib/api-auth.ts` | Auth helpers (`validateApiKey`, `createSuccessResponse/Error`). Wrap all routes. |
| `src/lib/ai/models.ts` | `AIModel`, `getDefaultModel`. Central AI model registry. |
| `src/components/ui/data-table.tsx` | Reusable tables (`DataTableProps`, `Column`). Use for lists/admins. |
| `src/components/shorts/SortableSceneList.tsx` | Draggable scenes (`SortableSceneListProps`). Extend for Short edits. |
| `src/components/roteirista/ScriptWizard.tsx` | Multi-step script gen (`ScriptWizardProps`). |
| `src/hooks/use-ai-models.ts` | Model selection (`useAIModels`, `useDefaultModel`). |
| `src/app/api/shorts/[id]/generate/route.ts` | Example full feature flow: script → scenes → media. |
| `prisma/schema.prisma` | DB models; add migrations for new fields. |

## Workflows for Common Tasks

### 1. **New Feature: User-Facing (e.g., Add Scene Reorder to Shorts)**
   1. **Plan**: Reference `architecture-planning.md`. Define: Goals, User flow, Data models, APIs (Zod schemas), Credits cost, Security (Clerk scopes).
   2. **DB (if needed)**: Update `prisma/schema.prisma` (e.g., `order` field on Scene). `npx prisma migrate dev`.
   3. **API**:
      - Create `src/app/api/shorts/[id]/scenes/reorder/route.ts`.
      - Structure:
        ```ts
        import { NextRequest } from 'next/server';
        import { z } from 'zod';
        import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
        import { withApiLogging } from '@/lib/logging/api';
        import prisma from '@/lib/prisma'; // Assume exists

        const schema = z.object({ sceneIds: z.array(z.string()) });
        export async function POST(req: NextRequest) {
          return withApiLogging(async () => {
            const { userId } = await validateApiKey(req);
            const { sceneIds } = schema.parse(await req.json());
            // Business logic: Update Short scenes order
            await prisma.scene.updateMany({ /* tenant-scoped */ });
            return createSuccessResponse({ success: true });
          });
        }
        ```
      - Integrate credits if AI/DB heavy.
   4. **Frontend**:
      - Add React Query mutation: `useReorderScenes` hook.
      - Update `SortableSceneList.tsx`: optimistic updates + invalidate queries.
      - Page: `src/app/(protected)/shorts/[id]/edit/page.tsx`.
   5. **Test**: `npm run lint && typecheck && build`.
   6. **PR**: Link `frontend-development.md` + `backend-development.md`. Paste deliverables.

### 2. **AI-Integrated Feature (e.g., New Roteirista Prompt Gen)**
   1. Update `src/lib/ai/models.ts` if new model.
   2. API: `src/app/api/roteirista/ai/new-action/route.ts`. Use `ai/providers` (OpenRouter/Fal).
   3. UI: Extend `AITextAssistant` or `ScriptWizard`. Use `useAvailableModels`.
   4. Credits: Call `/api/credits/me` pre/post; deduct via admin endpoint if needed.

### 3. **Admin Feature (e.g., New User Credits View)**
   1. API: `src/app/api/admin/users/[id]/credits/route.ts` (admin-only auth).
   2. Component: `DataTable` in `src/app/admin/users/[id]/page.tsx`.
   3. Hook: `useAdminModels` pattern.

### 4. **UI-Only Feature (e.g., New Dialog)**
   1. `src/components/ui/NewDialog.tsx` (shadcn pattern: props, forwardRef).
   2. Use `react-hook-form` + Zod for forms.
   3. Integrate `glowing-effect` for animations.

## Best Practices & Code Patterns

### **API Routes**
- **Auth**: Always `validateApiKey(req)` → `userId`.
- **Validation**: Zod parse `req.json()`. Errors → `createErrorResponse`.
- **Responses**: `{ data: T | null, error?: string }`. Use `createSuccessResponse`.
- **Logging**: Wrap in `withApiLogging`.
- **Prisma**: Scope `where: { userId, ... }`. Transactions for multi-ops.
- **Credits**: Check `/credits/me` or inline burn logic.
- **AI Calls**: Use `src/lib/ai/providers`; fallback models.

### **Frontend**
- **Queries/Mutations**: React Query (`useMutation({ onSuccess: queryClient.invalidateQueries() })`).
- **Forms**: `useForm({ resolver: zodResolver(schema) })`.
- **Hooks**: Prefix `useFeatureName` (e.g., `useReorderScenes`).
- **Components**: `forwardRef`, `cn()` Tailwind utils, a11y (aria-*).
- **State**: Zustand/Zod for complex forms; optimistic updates.
- **Metadata**: `usePageConfig` for titles/descriptions.

### **General**
- **Types**: Full TS; export interfaces (e.g., `ShortCardProps`).
- **Conventions**: PascalCase components, camelCase hooks/functions. No `any`.
- **Security**: Reference `security-check.md` pre-PR (no raw SQL, input sanitization).
- **Performance**: Infinite queries for lists; debounce inputs.
- **Edge Cases**: Loading/error states, mobile responsiveness.

## Quality Gates
- **Checks**: `npm run lint`, `npm run typecheck`, `npm run build`.
- **PR Checklist**: Link guides, screenshots/GIFs, credits impact, migration if DB change.
- **Rollout**: Feature flags via DB/env for big changes.

Follow this for 90% of features. For DB-heavy, see `database-development.md`. Query tools for unknowns.
