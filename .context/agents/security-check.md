# Feature-Developer Agent Playbook

## Overview

This playbook guides the development of new features in the Pedro-AI codebase, a Next.js 14 App Router application with TypeScript, React 18, Tailwind CSS, Prisma/Postgres, Clerk authentication, TanStack Query, and AI integrations (OpenAI, OpenRouter, Fal.ai). Core features include AI-powered shorts generation (`/shorts`), scriptwriting (`/roteirista`), styles (`/estilos`), characters, credits/billing, and admin tools.

**Primary Focus Areas**:
- **Protected Routes**: `src/app/(protected)/` (user-facing features like shorts, roteirista).
- **Public Routes**: `src/app/(public)/` (landing, auth).
- **Admin Routes**: `src/app/admin/` (management dashboards).
- **API Routes**: `src/app/api/` (feature-specific endpoints under `user/`, `admin/`, `ai/`, `shorts/[id]/`, etc.).
- **UI Components**: `src/components/` (reusable UI in `ui/`, feature-specific like `shorts/`, `roteirista/`).
- **Lib & Hooks**: `src/lib/` (utils, auth, credits, AI), `src/hooks/` (data fetching, models).
- **Database**: Prisma schema in `prisma/schema.prisma`; migrations via `prisma migrate`.

**Key Principles**:
- Server-first: Validate/deduct credits server-side; client optimistic UI only.
- AuthZ: All protected APIs use `getUserFromClerk` or `validateApiKey`.
- Credits: Every AI call deducts via `deductCreditsForFeature` with feature keys (e.g., `ai_text_chat`, `ai_image_generation`).
- Type-Safe: Zod schemas for all inputs; TypeScript everywhere.

## Key Files and Their Purposes

| Category | File/Path | Purpose |
|----------|-----------|---------|
| **API Auth** | `src/lib/api-auth.ts` | Centralized auth: `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`. Use in all API handlers. |
| **API Client** | `src/lib/api-client.ts` | Client-side fetch wrapper: `apiClient`; handles auth, errors. |
| **Credits** | `src/lib/credits/*` (e.g., `feature-config.ts`, `deductCreditsForFeature`) | Credit deduction/validation: Always wrap AI calls. Logs `UsageHistory`. |
| **AI Models** | `src/lib/ai/models.ts`, `src/hooks/use-ai-models.ts` | Model management: `AIModel`, `getDefaultModel`. Fetch via `/api/ai/models`. |
| **UI Primitives** | `src/components/ui/*` (button.tsx, data-table.tsx, textarea.tsx) | Reusable: Shadcn/UI patterns. Extend for features. |
| **Shorts** | `src/components/shorts/*` (CreateShortForm.tsx, SortableSceneList.tsx) | Shorts workflow: Forms, scene editing, credit estimates. |
| **Roteirista** | `src/components/roteirista/*` (ScriptWizard.tsx, AITextAssistant.tsx) | Script generation: Wizards, previews, AI assists. |
| **Estilos** | `src/components/estilos/*` (StyleForm.tsx, StyleCard.tsx) | Style creation: Forms, previews, icon pickers. |
| **Characters** | `src/components/characters/*` (CharacterSelector.tsx) | Character management: Dialogs, cards. |
| **Admin** | `src/components/admin/*`, `src/app/admin/*` | Dashboards: Users, plans, credits, usage charts. |
| **Hooks** | `src/hooks/use-available-models.ts`, `use-page-config.ts` | Data fetching: TanStack Query patterns for models, config. |
| **Logging** | `src/lib/logging/api.ts` | `withApiLogging`: Wrap handlers for traces. |

## Code Conventions and Best Practices

### Structure
```
src/app/(protected)/[feature]/[id]/page.tsx  # Feature page
src/app/api/[feature]/[id]/[action]/route.ts # API handler
src/components/[feature]/*.tsx               # Feature components
src/hooks/use-[feature]-*.ts                 # Custom hooks
```

- **Naming**: Kebab-case routes/files; PascalCase components/exports.
- **TypeScript**: Infer types; use `z.infer<typeof Schema>` for Zod.
- **Styling**: Tailwind classes; shadcn/ui components. Theme-aware via `ThemeProvider`.
- **Queries/Mutations**: TanStack Query v5; infinite queries for lists; optimistic updates with rollback.
- **Forms**: React Hook Form + Zod resolver.
- **Error Handling**: `ApiError` class; generic client toasts ("Update failed").
- **AI Calls**: Use `@ai-sdk/openai` or providers; validate model/provider.
- **Prisma**: Scoped queries (`where: { userId }`); transactions for credits + DB ops.

**Patterns**:
```typescript
// API Handler (route.ts)
import { validateApiKey, createErrorResponse } from '@/lib/api-auth';
import { deductCreditsForFeature } from '@/lib/credits';
import { z } from 'zod';

export async function POST(req: Request) {
  const user = await validateApiKey(req);
  const data = z.object({ model: z.string() }).parse(await req.json());
  
  await deductCreditsForFeature(user.id, 'ai_text_chat');
  // AI call + DB ops
  return NextResponse.json({ success: true });
}

// Client Hook
import { apiClient } from '@/lib/api-client';
export const useCreateShort = () => useMutation({
  mutationFn: (data) => apiClient.post('/api/shorts', { body: data }),
});
```

### Security Best Practices (Mandatory)
- **Auth**: `protected` layout uses Clerk middleware; APIs call `validateApiKey`.
- **Validation**: Zod on all inputs; `safeParse` for optionals.
- **Credits**: Transactional: `prisma.$transaction([deduct, dbOp])`.
- **No Client Secrets**: Env-only; no `dangerouslySetInnerHTML`.
- **Rate Limits/Abuse**: Check credits first; Svix for webhooks.
- **Deps**: `pnpm add`; run `pnpm lint:typecheck:build`.

## Workflows for Common Tasks

### 1. New Feature Page (e.g., `/shorts/[id]/new-feature`)
1. Create `src/app/(protected)/shorts/[id]/new-feature/page.tsx`: Use `(protected)` layout.
2. Add page component: `<PageHeader />`, feature-specific `<FeatureForm />`.
3. Custom hook: `src/hooks/use-new-feature.ts` with TanStack Query.
4. Link in nav: Update `src/components/navigation/*`.
5. Test: Storybook or e2e (Playwright).

### 2. New API Endpoint (e.g., `/api/shorts/[id]/new-action`)
1. Create `src/app/api/shorts/[id]/new-action/route.ts`.
2. Import auth/credits: `validateApiKey`, `deductCreditsForFeature('ai_short_action')`.
3. Zod schema: Parse `req.json()`.
4. Prisma ops: Scope to `userId`; transaction if credits + DB.
5. Wrap: `withApiLogging(handler)`.
6. Client integration: New mutation hook.

**Example**:
```typescript
// route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

const Schema = z.object({ prompt: z.string().min(10) });

export const POST = withApiLogging(async (req: NextRequest) => {
  const user = await validateApiKey(req);
  const { id } = routeParams(req); // Custom util for [id]
  const data = Schema.parse(await req.json());

  await deductCreditsForFeature(user.id, 'ai_short_action', { quantity: 1 });

  const short = await prisma.short.findUnique({ where: { id, userId: user.id } });
  if (!short) throw new ApiError(404, 'Not found');

  // Feature logic
  return createSuccessResponse({ result: 'done' });
});
```

### 3. New UI Component (e.g., `NewFeatureDialog`)
1. Place in `src/components/[feature]/NewFeatureDialog.tsx`.
2. Props: Typed interface (e.g., `NewFeatureDialogProps`).
3. Use shadcn: `<Dialog>`, `<Form>`.
4. Hook integration: `useCreateFeature`.
5. Accessibility: `aria-*`, keyboard nav.
6. Responsive: Tailwind `sm:`, `md:`.

### 4. AI Integration (Chat/Image/Video)
1. Server-only: `/api/ai/[provider]/[type]`.
2. Validate: Model from `getModelById`; provider allowlist.
3. Credits: Deduct before call (e.g., 1 for text, 5 for image).
4. Streaming: `streamText` for chat; SSE response.
5. Client: `<AIChat />` with `useChat` from `@ai-sdk/react`.

### 5. Credits/Billing Feature
1. Define in `src/lib/credits/feature-config.ts`: `{ key: 'new_feature', cost: 2 }`.
2. Webhook if subscription: `src/app/api/webhooks/*`.
3. UI: `<CreditEstimate />`; check `/api/credits/me`.

### 6. Database Changes
1. Update `prisma/schema.prisma`: Add models/fields.
2. `pnpm db:push` (dev); `prisma migrate dev` (prod).
3. Seed if needed: `prisma/seed.ts`.

### 7. Testing & Deployment
- **Unit**: Vitest for utils/hooks.
- **E2E**: Playwright in `tests/`.
- **Lint/Build**: `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- **PR Checklist**: Security review (auth, Zod, credits); update docs.

## Quick Reference: Feature Mapping
| Feature | API Base | Components | Credits Key | Models |
|---------|----------|------------|-------------|--------|
| Shorts | `/api/shorts/[id]` | `shorts/*` | `ai_short_generate` | Text/Image/Video |
| Roteirista | `/api/roteirista/ai/*` | `roteirista/*` | `ai_text_assist` | Text |
| Estilos | `/api/styles/*` | `estilos/*` | `ai_style_generate` | Image |
| Characters | `/api/characters/[id]` | `characters/*` | `ai_character_prompt` | Text/Image |

Follow this playbook for consistent, secure feature development. Reference security checklist for PRs.
