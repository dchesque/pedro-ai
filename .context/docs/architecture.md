# Architecture

## Overview

This is a production-ready Next.js SaaS application for AI-powered short video generation (e.g., TikTok/Reels-style content). It leverages Roteirista AI agents for script generation, character creation with image prompting, scene management, and media synthesis using Fal.ai (Flux for images, Kling for videos) and OpenRouter LLMs. Monetization uses credit-based consumption with Asaas billing integration.

### Key Metrics
- **Files**: 406 total (210 `.ts`, 170 `.tsx`, 20 `.js`, 6 `.mjs`)
- **Symbols**: 911 total (184 Utils, 178 Controllers, 203 Components, 31 Models, 8 Repositories, 3 Config)
- **Core Flows**: Shorts pipeline ([`src/lib/shorts/pipeline.ts`](src/lib/shorts/pipeline.ts)), AI agents ([`src/hooks/use-agents.ts`](src/hooks/use-agents.ts)), credits ([`src/lib/credits/`](src/lib/credits/)), storage ([`src/lib/storage/`](src/lib/storage/))
- **Public API**: 400+ exports (e.g., `useShorts`, `addScene`, `approveScript`, `Short`, `Agent`)

Dependencies follow: Utils → Controllers/Models → Components. Top imports:
- [`components/roteirista/ScriptWizard.tsx`](src/components/roteirista/ScriptWizard.tsx) (5 importers)
- [`components/plans/pricing-card.tsx`](src/components/plans/pricing-card.tsx) (5)
- [`lib/agents/scriptwriter.ts`](src/lib/agents/scriptwriter.ts) (3)

## Core Architecture Principles

### 1. Separation of Concerns
| Layer | Responsibility | Key Files |
|-------|----------------|-----------|
| **Presentation** | React/TSX UI | `src/components/` (203 symbols, e.g., `AddSceneDialog`, `CharacterSelector`) |
| **Logic** | Hooks, Server Actions, APIs | `src/hooks/` (500+ fns, e.g., `useShorts`), `src/app/api/` |
| **Data** | ORM & Models | `src/lib/db.ts` (Prisma, 31 models: `Short`, `Character`, `Style`, `Usage`) |
| **Auth** | Sessions & RBAC | Clerk (e.g., `validateUserAuthentication`) |

### 2. Type Safety
- TypeScript everywhere with Prisma-generated types
- Zod validation (forms/APIs)
- React Query typed queries/mutations (e.g., `useShorts()` → `Short[]`)

### 3. Performance
- Default Server Components (static rendering)
- React Query: Caching (staleTime: 5m), optimistic updates (e.g., script approval)
- Edge runtime APIs
- SimpleCache (`src/lib/cache.ts`)

## Application Layers

### Frontend
```
Next.js 15 App Router (src/app/)
├── Server Components: Static pages (e.g., /dashboard)
├── Client Components: 'use client' (interactive, e.g., ScriptWizard)
├── React Query: Data fetching/mutations
└── UI Primitives: shadcn/ui + Tailwind + Radix (AutocompleteItem, etc.)
```

### Backend
```
API Routes (src/app/api/)
├── Middleware: Clerk auth, admin checks (requireAdmin)
├── Logic: lib/ utils (cn, generateApiKey), hooks/
├── DB: Prisma → PostgreSQL
└── Externals: Clerk, Asaas (AsaasClient), Fal.ai, OpenRouter, Vercel Blob
```

## Directory Structure

```
src/
├── app/                    # Pages & Routes
│   ├── (public)/           # Marketing (/), auth (/sign-in)
│   ├── (protected)/        # Dashboard (/dashboard), AI Studio (/ai-studio)
│   ├── admin/              # Admin (/admin/settings, /admin/agents/[id])
│   └── api/                # /api/shorts, /api/credits/deduct
├── components/             # 203 symbols
│   ├── ui/                 # Primitives (AutocompleteItem)
│   ├── app/                # Shells (AppShell, AdminChrome)
│   ├── shorts/             # CreateShortForm, AddSceneDialog
│   ├── characters/         # CharacterSelector
│   ├── roteirista/         # ScriptWizard, steps/ (ConceptStep)
│   └── admin/              # AdminTopbar
├── hooks/                  # React Query (e.g., useShorts, useCredits)
├── lib/                    # 184 symbols
│   ├── shorts/             # pipeline.ts (addScene, approveScript)
│   ├── credits/            # deduct.ts, validate-credits.ts (addUserCredits)
│   ├── ai/                 # providers/ (FalAdapter, OpenRouterAdapter, registry.ts)
│   ├── characters/         # prompt-generator.ts (analyzeCharacterImage)
│   ├── storage/            # vercel-blob.ts (VercelBlobStorage), types.ts
│   ├── roteirista/         # types.ts (AIAction, ShortStatus)
│   └── utils.ts            # cn(), apiClient, logger (createLogger)
├── prisma/                 # schema.prisma (31 models)
└── types/                  # Shared (StyleFormData, UploadResult)
```

## Route Groups

| Group | Path Prefix | Auth Required | Examples |
|-------|-------------|---------------|----------|
| `(public)` | `/` | No | `/pricing`, `/sign-in` |
| `(protected)` | `/dashboard`, `/ai-studio` | Clerk User | `/agents/[slug]`, `/shorts` |
| `admin` | `/admin/*` | Admin RBAC | `/admin/settings`, `/admin/agents/[id]` |
| `api` | `/api/*` | API Key/JWT | `/api/shorts`, `/api/credits` |

## Data Flow Examples

### Read: List Shorts
```tsx
// Client: src/hooks/use-shorts.ts
const { data: shorts } = useShorts({ userId });

// Fetches /api/shorts → prisma.short.findMany({ where: { userId } })
// React Query caches (staleTime: 5m)
```

### Write: Generate Script (Optimistic)
```tsx
// src/hooks/use-shorts.ts
const { mutate: generateScript } = useGenerateScript();
generateScript({ shortId, input }, {
  onOptimisticUpdate: (cache) => { /* UI sync */ }
});

// Server: deductCredits → roteiristaAgent → prisma.update → invalidateQueries
```

**Shorts Pipeline** (`src/lib/shorts/pipeline.ts`):
```ts
export async function addScene(shortId: string, scene: ShortScene) {
  // Validates limits (canAddCharacterToShort)
  await prisma.shortScene.create({ data: { shortId, ...scene } });
}
```

## Credits & Billing

- **Config**: `AdminSettingsPayload` (FeatureKey costs, e.g., `script_generation: 10`)
- **Track**: `deductCredits(feature)` → `Usage` record (OperationType)
- **Hooks**: `useCredits()` → `CreditsResponse`, `useUsageHistory()`
- **Admin**: `useAdminPlans()` → `ClerkPlansResponse`, `BillingPlan[]`
- **Refunds**: Negative usage on failure

**Example**:
```ts
// src/lib/credits/deduct.ts
await deductCredits('image_gen'); // Throws InsufficientCreditsError if low
```

## AI Pipeline

- **Agents**: `Agent` types (scriptwriter, prompt-engineer) via `useAgents()`
- **Providers**: Registry → `FalAdapter.generateImage(FluxInput)`, `OpenRouterAdapter`
- **Models**: `useAvailableModels()` → `AIModel[]`, `useOpenRouterModels()`
- **Gen Hooks**: `useFalGeneration()` → `GenerateImageOutput`

**Character Prompt**:
```ts
// src/lib/characters/prompt-generator.ts
const prompt = analyzeCharacterImage(imageUrl, traits: CharacterTraits);
```

## State Management

| Scope | Tool | Examples |
|-------|------|----------|
| Local | `useState`, React Hook Form | `StyleForm` (src/components/estilos/) |
| Server/Client | React Query | `useShorts()`, `useStorage()` (VercelBlobStorage) |
| Global | Clerk + Contexts | `useUser()`, `AdminDevModeProvider`, `useToast()` |

## Security

- **Auth**: `getUserFromClerkId()`, `createAuthErrorResponse`
- **Admin**: `isAdmin()`, `requireAdmin()`
- **API**: `ApiError`, `validateApiKey()`, Zod
- **Ownership**: User-scoped queries (e.g., `where: { userId }`)
- **Limits**: Credits gate (e.g., `canCreateCharacter()`)

## Performance & Scalability

- **Cache**: React Query + `SimpleCache.getCacheKey()`
- **Storage**: `useStorage()` → `StorageProviderType` (VercelBlobStorage, ReplitAppStorage)
- **Edge**: APIs (no heavy deps)
- **Scale**: Prisma pooling, stateless, external auth/billing

## Key Modules

| Module | Hooks/Utils | Types | Notes |
|--------|-------------|--------|-------|
| **Shorts** | `useShorts`, `useGenerateScript` | `Short`, `ShortScene` | Pipeline: Script → Scenes → Media |
| **Characters** | `useCharacters` | `CharacterPromptData`, `CharacterTraits` | Image analysis, limits |
| **Styles** | `useStyles`, `useCreateStyle` | `Style`, `ContentType` | Form: `StyleFormData` |
| **Agents** | `useAgents` | `Agent`, `AgentQuestion` | Roteirista flows |
| **Credits** | `useCredits` | `CreditData` | Deduct/track/refund |

## Development Workflow

1. `pnpm install`
2. Copy `.env.example` → `.env.local` (Clerk keys, `DB_URL`, Asaas, Fal/OpenRouter)
3. `pnpm db:push` (Prisma migrate)
4. `pnpm dev`
5. **Debug**: Enable `AdminDevModeProvider`, `createLogger('debug')`
6. **Test**: `pnpm test` (utils, E2E flows)
7. **Seed**: `pnpm db:seed` (styles via `lib/scripts/seed-styles.ts`)

**Common Extensions**:
- New Hook: `hooks/use-new-feature.ts` → `/api/new-feature`
- Provider: `lib/ai/providers/new-adapter.ts` → registry
- Model: `prisma/schema.prisma` → `pnpm db:push`

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **UI** | React 18, Tailwind CSS, shadcn/ui, Radix UI |
| **Data** | Prisma ORM, PostgreSQL |
| **State** | TanStack Query (React Query) |
| **Auth** | Clerk (JWT, RBAC) |
| **Payments** | Asaas (AsaasClient) |
| **AI/ML** | Fal.ai (Flux/Kling), OpenRouter LLMs |
| **Storage** | Vercel Blob |
| **Utils** | Zod, class-variance-authority (cn) |

See [API Reference](api.md), [Database Models](prisma/schema.prisma), [Hooks Index](hooks.md).
