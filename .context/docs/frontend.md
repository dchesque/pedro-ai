# Frontend Documentation

## Overview

The frontend is a modern Next.js 15 application using the App Router, React 19, TypeScript, and Tailwind CSS. It powers an AI-driven platform for short video creation ("shorts"), character management, billing, admin tools, and AI integrations. Key features include:

- **Protected Dashboard**: Shorts creation (`useShorts`, `CreateShortForm`), character library (`useCharacters`), credits/usage tracking (`useCredits`, `useUsage`).
- **Admin Panel**: User/plan management (`useAdminPlans`, `AdminChrome`), settings (`useAdminSettings`), analytics (`useDashboard`).
- **Marketing Pages**: Public pricing (`buildPlanTiers`), AI starter demos (`AIStarter`).
- **AI Studio**: Agent execution (`useAgents`), script generation (`useGenerateScript`), media gen (`useFalGeneration`, `useAiImage`).

**Stats**:
- ~400 files: 208 `.ts`, 166 `.tsx`, 20 `.js`.
- 896 symbols: 198 Components (depends on Models), 183 Utils, 178 Controllers, 31 Models.
- Public exports: 380+ (e.g., `apiClient`, `AppShell`, `useShorts`, `addScene`).

Core principles:
- Server Components for initial data fetching.
- TanStack Query (`@tanstack/react-query`) for client-side state/caching.
- No direct Prisma/DB access on client—use API routes via `apiClient`.
- Type-safe APIs with Zod schemas + TypeScript (e.g., `Short`, `CreditsResponse`, `Agent`).
- Clerk for auth, Radix UI for primitives.

## Core Technologies

| Technology | Version | Purpose | Key Usage |
|------------|---------|---------|-----------|
| Next.js | 15.3.5 | App Router, SSR/SSG, metadata | Pages/layouts (`app/`), dynamic imports |
| React | 19 | Components, hooks, contexts | `"use client"` for interactivity |
| TypeScript | 5.x | Type safety | Interfaces (e.g., `Short`, `Agent`), generics |
| Tailwind CSS | 4.x | Utility-first styling | `cn()` merges, CSS vars for themes |
| Radix UI | ^1.0 | Headless UI | `Dialog`, `Button`, `AutocompleteItem` |
| TanStack Query | ^5.0 | Data fetching/mutations | Custom hooks (`useShorts`, `useCreateShort`) |
| React Hook Form + Zod | ^7.x / ^3.x | Forms/validation | Schemas in hooks/components |
| Clerk | ^5.x | Auth/Orgs | `useUser`, protected routes |
| Vercel Blob | ^0.20 | File storage | `useStorage`, `VercelBlobStorage` |

Dependencies: `@prisma/client` (server-only), `openai`/`fal` adapters (AI providers).

## Folder Structure

```
src/
├── app/                          # App Router: pages, layouts, loading/error
│   ├── (public)/                 # Marketing: pricing, onboarding
│   ├── (protected)/              # Dashboard: shorts/[id], agents/[slug]
│   ├── admin/                    # Admin: settings, plans, onboarding
│   ├── globals.css               # Tailwind + theme vars
│   └── layout.tsx                # Root layout (ClerkProvider, QueryClient)
├── components/                   # Feature + UI components
│   ├── ui/                       # Primitives: AutocompleteItem, Button
│   ├── app/                      # Shells: AppShell, topbar
│   ├── shorts/                   # Forms: AddSceneDialog, CreateShortForm
│   ├── admin/                    # Panels: AdminChrome, AdminTopbar
│   ├── characters/               # Selectors: CharacterSelector
│   ├── plans/                    # Pricing: pricing-card.tsx
│   ├── roteirista/               # Wizards: ScriptWizard
│   └── ai-chat/                  # Chat: ChatInput, message-bubble.tsx
├── hooks/                        # TanStack Query wrappers (70+)
│   ├── use-*.ts                  # Domain: useShorts, useCredits, useAgents
│   └── admin/                    # useAdminPlans, useAdminModels
├── lib/                          # Shared utils, API, business logic
│   ├── api-client.ts             # apiClient, ApiError
│   ├── utils.ts                  # cn, generateApiKey
│   ├── storage/                  # index.ts, vercel-blob.ts
│   ├── credits/                  # deduct.ts, validate-credits.ts
│   ├── shorts/                   # pipeline.ts (addScene, approveScript)
│   ├── ai/                       # providers/ (FalAdapter, OpenRouterAdapter)
│   ├── agents/                   # agent-executor.ts, resolver.ts
│   └── roteirista/               # types.ts (AIAction, ShortStatus)
├── contexts/                     # Providers: page-metadata.tsx, admin-dev-mode.tsx
└── prisma/                       # Server-only: generated/client
```

**Key Dependencies** (top imports):
- `ScriptWizard.tsx` (5 importers): Roteirista script flow.
- `pricing-card.tsx` (5): Billing display.
- `pipeline.ts` (shorts): Core shorts logic.

## Component Architecture

### Server vs Client Components
- **Server Components** (default, no `"use client"`): Data fetching, rendering. Pass props to children.
- **Client Components**: Interactivity (forms, queries, state).

```tsx
// Server: src/app/(protected)/shorts/page.tsx
export default async function ShortsPage() {
  const { shorts } = await apiClient<{ shorts: Short[] }>('/api/shorts');
  return <ShortsList initialShorts={shorts} />;  // Client receives props
}
```

```tsx
// Client: src/components/shorts/CreateShortForm.tsx
"use client";
import { useCreateShort } from '@/hooks/use-shorts';
import { useForm } from 'react-hook-form';

export function CreateShortForm() {
  const createShort = useCreateShort();
  const form = useForm<CreateShortInput>({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={form.handleSubmit((data) => createShort.mutate(data))}>
      {/* Form fields */}
    </form>
  );
}
```

### Key Components

| Category | Examples | Props/Usage | Location |
|----------|----------|-------------|----------|
| Layouts | `AppShell`, `AdminLayout`, `AdminChrome` | Wraps pages, nav/sidebar | `components/app/`, `admin/` |
| Shorts | `AddSceneDialog`, `CreateShortForm` | `shortId: string`; mutations (`useAddScene`) | `components/shorts/` |
| Admin | `AdminTopbar`, `AdminAgentEditPage` | Admin-only, `AdminDevModeProvider` | `components/admin/`, `app/admin/` |
| UI Primitives | `AutocompleteItem`, `ChatMessage` | Reusable: forms, chat bubbles | `components/ui/` |
| Plans/Billing | Pricing cards, `CpfModal` (`BillingType`) | `buildPlanTiers(ClerkPlan[])` | `components/plans/` |
| AI | `AIStarter`, `AgentDetail` | `Agent`, `AgentExecutionResult` | `components/marketing/`, `app/` |
| Characters | `CharacterSelector` | `CharacterPromptData`, `CharacterTraits` | `components/characters/` |

**Page Metadata**: `usePageConfig` from `contexts/page-metadata.tsx` for dynamic title/breadcrumbs.

```tsx
usePageConfig({
  title: 'Dashboard',
  breadcrumbs: [{ label: 'Home', href: '/dashboard' }]
});
```

## Styling

Tailwind v4 with CSS variables for themes (light/dark). `cn` utility for conditional classes.

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**globals.css** (excerpt):
```css
@tailwind base, components, utilities;
:root {
  --primary: 240 5.9% 10%;
  --background: 0 0% 100%;
}
.dark {
  --primary: 120 100% 98%;
  --background: 240 10% 3.9%;
}
.glass-panel {
  @apply bg-background/80 backdrop-blur-xl border border-border/50;
}
```

Usage:
```tsx
<div className={cn('glass-panel p-6 rounded-xl', isActive && 'ring-2 ring-primary')}>
  Content
</div>
```

## State Management & Data Fetching

Centralized via `apiClient` (fetch wrapper with auth, error handling: `ApiError`).

```ts
// src/lib/api-client.ts
export class ApiError extends Error {
  status: number;
  // ...
}
export const apiClient = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json();
};
```

### TanStack Query Hooks
Custom hooks only—no raw `useQuery`. Mutations invalidate queries automatically.

**Query Examples**:
```ts
// src/hooks/use-credits.ts
export function useCredits() {
  return useQuery<CreditData>({
    queryKey: ['credits'],
    queryFn: () => apiClient('/api/credits/me'),
    staleTime: 5 * 60 * 1000,  // 5min
  });
}
```

**Mutation Examples**:
```ts
// src/hooks/use-shorts.ts
export function useCreateShort() {
  return useMutation({
    mutationFn: (input: CreateShortInput) => apiClient('/api/shorts', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }),
  });
}
```

**Hooks Reference** (selected; full in `src/hooks/`):

| Hook | Returns | Endpoint | staleTime | Mutations |
|------|---------|----------|-----------|-----------|
| `useCredits` | `CreditsResponse` / `CreditData` | `/api/credits/me` | 5min | `useAddUserCredits` |
| `useShorts` / `useShort` | `Short[]` / `Short` | `/api/shorts` / `/api/shorts/{id}` | 1min | `useCreateShort`, `useGenerateScript`, `useApproveScript`, `useAddScene` |
| `useSubscription` | `SubscriptionStatus` | `/api/subscription` | 5min | - |
| `useStorage` | `StorageResponse` / `StorageItem[]` | `/api/storage` | Config | `useDeleteStorageItem` |
| `useAgents` | `Agent[]` | `/api/agents` | 2min | - |
| `useAdminSettings` | `AdminSettings` | `/api/admin/settings` | 10min | - |
| `useAdminPlans` | `PlansResponse` / `ClerkPlansResponse` | `/api/admin/plans` | 15min | - |
| `useUsage` | `UsageData` | `/api/usage` | 30s | - |
| `useTones` / `useStyles` | `Tone[]` / `Style[]` | `/api/tones`, `/api/styles` | 1min | `useCreateTone`, `useDeleteStyle` |
| `useFalGeneration` | `GenerateImageOutput` / `GenerateVideoOutput` | AI providers (Fal) | N/A | Image/video gen |
| `useAiImage` | `GenerateImageResponse` | `/api/ai/image` | N/A | Flux/Kling inputs |

See `src/hooks/` for 50+ hooks (e.g., `useClimates`, `useOpenrouterModels`).

## Forms & Validation

React Hook Form + Zod (schemas in hooks).

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateShortSchema = z.object({ title: z.string().min(1), concept: z.string() });
type CreateShortInput = z.infer<typeof CreateShortSchema>;

const form = useForm<CreateShortInput>({
  resolver: zodResolver(CreateShortSchema),
  defaultValues: { title: '' }
});
```

## Routing & Navigation

- **Groups**: `(public)` (landing), `(protected)` (dashboard), `admin` (admin).
- Paths: `/shorts/[id]`, `/admin/agents/[id]`, `/ai-studio`.
- `useRouter` / `Link` from `next/navigation`.
- Middleware: Clerk protection.

## Performance & Best Practices

- **Server-first**: Fetch in `page.tsx`, pass to client.
- **Query Keys**: Arrays `['shorts', { id }]`.
- **Optimistic UI**: Mutations (e.g., deduct credits pre-DB).
- **Suspense/Loading**: `loading.tsx` per route segment.
- **Images**: `next/image` w/ `sizes`, `priority`.
- **Cache**: `SimpleCache`, TanStack (staleTime), `revalidatePath`.
- **Dynamic**: `dynamic({ ssr: false })` for charts/heavy client.
- **No Client Secrets**: Env vars server-only.

Errors: `error.tsx`, global via `apiClient`.

## Accessibility & Testing

- **Radix**: ARIA roles, focus management (`Dialog`, `Tabs`).
- **Tailwind**: `sr-only`, keyboard nav.
- **Tests**: Jest/RTL (`__tests__/` for components), Playwright E2E.
- Lighthouse: 95+ scores targeted.

## Key Integrations

- **AI Providers**: `FalAdapter` (Flux/Kling: `GenerateImageInput`), `OpenRouterAdapter` (`AIModel[]`). Hooks: `useAvailableModels`.
- **Billing**: Asaas (`AsaasClient`), Clerk (`ClerkPlan`, `usePublicPlans`). Credits: `validateCredits`, `InsufficientCreditsError`.
- **Shorts Pipeline**: `src/lib/shorts/pipeline.ts`—`addScene(Short, scene)`, `approveScript`, `generateMedia`.
- **Storage**: `VercelBlobStorage` / `ReplitAppStorage`, `UploadResult`.
- **Agents**: `AgentExecutor` (`AgentQuestion`, `AgentOutputField`), `scriptwriter.ts`.
- **Logging**: `createLogger`, `SimpleCache`.

**Cross-References**:
- Backend API: [docs/backend.md](backend.md).
- Utils: `src/lib/` (e.g., `cn`, `getUserFromClerkId`).
- Types: `Short`, `Climate`, `CharacterTraits` (search `src/**/*.ts`).

For source: `grep -r 'useShorts' src/` or IDE "Find All References". Contribute: Follow hook patterns, add Zod schemas.
