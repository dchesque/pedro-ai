# Architecture

## Overview

This is a production-ready Next.js SaaS application for AI-powered short video generation (e.g., TikTok/Reels-style content). It features script generation via Roteirista AI agents, character creation, scene management, image/video synthesis using providers like Fal.ai (Flux, Kling), OpenRouter LLMs, and monetization via credit-based plans with Asaas billing.

### Key Metrics
- **Files**: 366 total (188 `.ts`, 156 `.tsx`, 16 `.js`, 6 `.mjs`)
- **Symbols**: 840 total (171 Utils, 163 Controllers, 191 Components, 31 Models, 8 Repositories, 3 Config)
- **Core Flows**: Shorts pipeline (`src/lib/shorts/pipeline.ts`), AI agents (`src/hooks/use-agents.ts`), credits tracking (`src/lib/credits/`), storage (`src/lib/storage/`)

Dependencies follow a clear hierarchy: Utils → Controllers/Models, Components → Models.

Public API exposes 400+ symbols, including hooks (`useShorts`, `useCredits`), lib functions (`addScene`, `approveScript`), and types (`Short`, `CharacterPromptData`).

## Core Architecture Principles

### 1. Separation of Concerns
- **Presentation**: React/TSX components (`src/components/`)
- **Logic**: Server Actions, API routes (`src/app/api/`), hooks (`src/hooks/`)
- **Data**: Prisma ORM (`src/lib/db.ts`) over PostgreSQL
- **Auth**: Clerk (JWT sessions)

### 2. Type Safety
- Full TypeScript with Prisma-generated types
- Zod for validation (forms, APIs)
- React Query types for server state

### 3. Performance First
- Server Components default
- React Query (TanStack Query) for caching/stale-while-revalidate
- Optimistic mutations (e.g., script approval)
- Edge runtime for APIs where possible

## Application Layers

### Frontend
```
Next.js App Router (src/app/)
├── Server Components (static rendering)
├── Client Components ('use client'; interactive)
├── React Query (queries/mutations)
└── UI: Radix UI + Tailwind + shadcn/ui (src/components/ui/)
```

### Backend
```
API Routes (src/app/api/)
├── Auth Middleware (Clerk)
├── Business Logic (lib/, hooks/)
├── Prisma (Models: User, Short, Character, Style, Usage, etc.)
└── PostgreSQL + External: Clerk, Asaas, Fal.ai, OpenRouter, Vercel Blob
```

## Directory Structure

```
src/
├── app/                  # App Router pages/routes
│   ├── (public)/         # Marketing, auth (no auth req.)
│   ├── (protected)/      # Dashboard, AI Studio, Shorts (auth req.)
│   ├── admin/            # Admin dashboard
│   └── api/              # REST APIs (e.g., /api/shorts, /api/credits)
├── components/           # UI (191 symbols)
│   ├── ui/               # shadcn primitives (AutocompleteItem, etc.)
│   ├── app/              # Shells, modals (AppShell, AddSceneDialog)
│   ├── shorts/           # Short-specific (CreateShortForm)
│   ├── characters/       # CharacterSelector
│   ├── roteirista/       # ScriptWizard, steps/
│   └── admin/            # Plan edit drawers, chrome
├── hooks/                # React Query wrappers (500+ fns)
│   └── use-*.ts          # e.g., useShorts, useCredits, useAgents
├── lib/                  # Utils (171 symbols)
│   ├── shorts/           # pipeline.ts (addScene, approveScript)
│   ├── credits/          # deduct.ts, validate-credits.ts
│   ├── ai/               # providers/ (FalAdapter, OpenRouterAdapter)
│   ├── characters/       # prompt-generator.ts
│   ├── storage/          # vercel-blob.ts, types.ts
│   ├── roteirista/       # types.ts (AIAction, SceneData)
│   └── utils.ts          # cn(), generateApiKey()
├── prisma/               # Schema (31 models: Short, Character, etc.)
└── types/                # Shared (e.g., UploadResult)
```

Key files by import popularity:
- `components/roteirista/ScriptWizard.tsx` (5 importers)
- `components/plans/pricing-card.tsx` (5)
- `lib/agents/scriptwriter.ts` (3)

## Route Groups

| Group | Path Prefix | Auth | Examples |
|-------|-------------|------|----------|
| `(public)` | `/` | No | Landing, sign-in (`/sign-in`), pricing |
| `(protected)` | `/dashboard`, `/ai-studio` | Yes (Clerk) | Shorts list, character mgmt |
| `admin` | `/admin/*` | Admin RBAC | Settings (`/admin/settings`), plans |
| `api` | `/api/*` | API keys/JWT | `/api/shorts`, `/api/credits/deduct` |

## Data Flow

### Read (e.g., List Shorts)
1. Client hook: `useShorts()` → React Query `queryFn`
2. API route: Auth → Prisma `prisma.short.findMany()`
3. Cache: React Query (staleTime: 5m)

### Write (e.g., Generate Script)
1. Mutation: `useGenerateScript(input)` (optimistic)
2. Zod validate → Server Action/API
3. Pipeline: Roteirista agents → LLM call → `deductCredits`
4. Invalidate queries → UI sync

**Example: Shorts Pipeline**
```ts
// src/lib/shorts/pipeline.ts
export async function generateScript(shortId: string, input: CreateShortInput) {
  await deductCredits('script_generation');
  const script = await roteiristaAgent.generateScenes(input);
  await prisma.short.update({ where: { id: shortId }, data: { script } });
}
```

### Credits & Billing
- **Settings**: Admin `PUT /api/admin/settings` → `AdminSettings` table (FeatureKey costs)
- **Deduction**: Pre-call `deductCredits(feature)` → `Usage` record
- **Plans**: `/api/admin/plans` CRUD → `BillingPlan` (Clerk sync optional)
- **Refunds**: Provider fail → `refundCreditsForFeature()` (negative usage)
- **UI**: `useCredits()` reads `/api/credits/settings`

### AI Pipeline
- Agents: `Agent` enum (scriptwriter, prompt-engineer)
- Providers: Registry (`src/lib/ai/providers/registry.ts`) → FalAdapter, OpenRouter
- Models: `useAvailableModels()` → `AIModel[]`
- Gen: `useFalGeneration()` → Flux/Kling inputs/outputs

## State Management

| Scope | Tool | Examples |
|-------|------|----------|
| Local | `useState`, React Hook Form | Forms (StyleForm) |
| Server | React Query | `useShorts`, `useUsageHistory` |
| Global | Clerk, Contexts | Auth (`useUser`), AdminDevModeProvider |

## Security

- **Auth**: Clerk middleware → `validateUserAuthentication()`
- **Admin**: `requireAdmin()` middleware
- **API**: `apiClient` with keys, `ApiError`
- **Validation**: Zod everywhere, ownership checks (e.g., `getUserFromClerkId`)
- **Rate Limits**: Implicit via credits

## Performance & Scalability

- **Caching**: React Query + SimpleCache (`src/lib/cache.ts`)
- **Storage**: Vercel Blob/Replit (`StorageProvider`)
- **Optimizations**: Dynamic imports, Next Image, edge APIs
- **Scale**: Stateless, Prisma Accelerate (pooling), Clerk external sessions

## Key Modules

### Shorts (Core Product)
- Hooks: `useShorts`, `useCreateShort`, `useAddScene`
- Pipeline: Script → Scenes → Images → Video
- Limits: `canAddCharacterToShort()`

### Credits
- Track: `trackUsage(operationType)`
- Features: `FeatureKey` (script_gen, image_gen)

### AI Integrations
- Providers: Fal (`fal.ai`), OpenRouter
- Adapters: `FalAdapter.generateVideo(KlingInput)`

### Admin
- `useAdminSettings()` → `AdminSettingsPayload`
- Plans: `useAdminPlans()` → Sync with Clerk?

## Development Workflow

1. `pnpm install`
2. `cp .env.example .env.local` (Clerk, DB_URL, Asaas)
3. `pnpm db:push` (Prisma)
4. `pnpm dev`
5. Test: `pnpm test` (units on utils, E2E on flows)

**Debug**: `useAdminDevModeProvider`, logger (`createLogger`).

## Technology Stack

| Category | Tech |
|----------|------|
| Framework | Next.js 15 (App Router) |
| UI | React 18, Tailwind, shadcn/ui, Radix |
| Data | Prisma, PostgreSQL |
| State | TanStack Query |
| Auth | Clerk |
| Payments | Asaas |
| AI | Fal.ai, OpenRouter |
| Utils | Zod, TRPC-like hooks |

For deeper dives: [API Reference](api.md), [Models](prisma/schema.prisma).
