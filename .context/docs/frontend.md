# Frontend Documentation

## Overview

The frontend is a modern Next.js 15 application using the App Router, React 19, TypeScript, and Tailwind CSS. It powers an AI-driven platform for short video creation ("shorts"), character management, billing, and admin tools. Key features include:

- **Protected Dashboard**: Shorts creation, character library, credits/usage tracking.
- **Admin Panel**: User management, plans, settings, and analytics.
- **Marketing Pages**: Public pricing, AI starter demos.
- **AI Integrations**: Script generation (`useGenerateScript`), image/video gen (`use-fal-generation`).

**Stats**:
- 353 files: 183 `.ts`, 148 `.tsx`.
- 812 symbols across hooks (e.g., `useShorts`, `useCredits`), components (e.g., `AppShell`, `AddSceneDialog`), utils (e.g., `cn`, `apiClient`).

Core principles:
- Server Components for data fetching.
- TanStack Query for client state.
- No direct Prisma/DB on client—use API routes via `apiClient`.
- Type-safe with Zod + TypeScript interfaces (e.g., `Short`, `CreditData`).

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.5 | App Router, SSR/SSG |
| React | 19 | Components, hooks |
| TypeScript | Latest | Type safety |
| Tailwind CSS | v4 | Styling |
| Radix UI | Latest | Headless primitives (Button, Dialog, etc.) |
| TanStack Query | Latest | Server state, caching |
| React Hook Form + Zod | Latest | Forms + validation |
| Clerk | Latest | Auth |
| Vercel Blob | Latest | File storage (`useStorage`) |

## Folder Structure

```
src/
├── app/                  # Pages + layouts (App Router)
│   ├── (public)/         # Marketing, auth pages
│   ├── (protected)/      # Dashboard, billing, ai-studio
│   ├── admin/            # Admin pages (AdminLayout)
│   └── globals.css       # Tailwind + themes
├── components/           # UI + feature components
│   ├── ui/               # Reusable primitives (AutocompleteItem, cn utility)
│   ├── app/              # Shell (AppShell), topbar, cookie-consent
│   ├── shorts/           # AddSceneDialog, CreateShortForm
│   ├── admin/            # AdminChrome, AdminTopbar
│   ├── plans/            # Pricing cards, tiers
│   └── characters/       # CharacterSelector
├── hooks/                # Custom TanStack Query hooks
│   ├── use-*.ts          # e.g., useShorts, useCredits, useAdminSettings
│   └── admin/            # Admin-specific
├── lib/                  # Utilities + API
│   ├── api-client.ts     # apiClient, ApiError
│   ├── utils.ts          # cn (classNames), generateApiKey
│   ├── storage/          # useStorage, VercelBlobStorage
│   ├── credits/          # validate-credits, deduct
│   ├── shorts/           # pipeline (addScene, approveScript)
│   └── ai/               # providers (OpenRouterAdapter, FalAdapter)
├── contexts/             # React contexts (page-metadata, admin-dev-mode)
└── prisma/               # Server-only DB (never import client-side)
```

Cross-references:
- **Hooks**: See [Hooks Reference](#hooks-reference).
- **Public Exports**: `AppShell`, `apiClient`, `useShorts`, etc. (323+ listed in codebase).

## Component Architecture

### Server vs Client Components

- **Server (default)**: Fetch data directly (e.g., `app/(protected)/ai-studio/page.tsx` uses `AIStudioPage`).
- **Client** (`"use client"`): Interactive, TanStack Query, forms.

```tsx
// Server Component example: src/app/admin/settings/page.tsx
export default async function AdminSettingsPage() {
  const settings = await api.get<AdminSettings>('/api/admin/settings');
  return <AdminSettings data={settings} />;  // Pass to client
}
```

```tsx
// Client Component: src/components/shorts/AddSceneDialog.tsx
"use client";
import { useAddScene } from '@/hooks/use-shorts';

export function AddSceneDialog({ shortId }: { shortId: string }) {
  const addScene = useAddScene();
  // Dialog with form, calls mutation
}
```

### Key Components

| Category | Examples | Usage |
|----------|----------|-------|
| Layouts | `AppShell`, `AdminLayout`, `AdminChrome` | Wrap pages with nav, metadata |
| Shorts | `AddSceneDialog`, `CreateShortForm` | Script gen, scene mgmt |
| Admin | `AdminTopbar`, `AdminDevModeProvider` | Admin dashboard |
| UI | `AutocompleteItem`, `CpfModal`, `ChatMessage` | Forms, billing, chat |
| Plans | Pricing cards (`buildPlanTiers`) | Public/admin billing |

**Page Metadata**: Auto-breadcrumbs/title via `contexts/page-metadata.tsx` + `usePageConfig`.

```tsx
// In page.tsx
usePageConfig({ title: 'Shorts', breadcrumbs: [{ label: 'Dashboard' }] });
```

## Styling

Tailwind v4 + CSS vars for light/dark themes. `cn` utility merges classes.

```tsx
// src/lib/utils.ts
export const cn = ( ... ) => clsx(..., twMerge(...));
```

**Theme Vars** (`globals.css`):
```css
:root { --primary: 240 5.9% 10%; }
.dark { --primary: 120 100% 98%; }
```

Usage:
```tsx
<div className={cn("glass-panel p-6", isOpen && "border-primary")}>
```

## State Management & Data Fetching

### TanStack Query Hooks

**Never** use `useQuery` directly—use custom hooks. All via `apiClient`.

```tsx
// src/lib/api-client.ts
export class ApiError extends Error { /* ... */ }
export const apiClient = async <T>(url: string, options?: RequestInit): Promise<T> => { /* Centralized fetch + error handling */ };
```

**Examples**:

```tsx
// Credits: src/hooks/use-credits.ts
export function useCredits() {
  return useQuery<CreditsResponse>({
    queryKey: ['credits'],
    queryFn: () => apiClient('/api/credits/me'),
  });
}

// Shorts: src/hooks/use-shorts.ts
export function useShorts() {
  return useQuery<{ shorts: Short[] }>({ queryKey: ['shorts'], queryFn: () => apiClient('/api/shorts') });
}

export function useCreateShort() {
  return useMutation({
    mutationFn: (input: CreateShortInput) => apiClient('/api/shorts', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shorts'] }),
  });
}
```

**Hooks Reference**:

| Hook | Returns | Endpoint | staleTime |
|------|---------|----------|-----------|
| `useCredits` | `CreditsResponse` | `/api/credits/me` | 5min |
| `useShorts` | `Short[]` | `/api/shorts` | 1min |
| `useShortCharacters` | `ShortCharacterWithDetails[]` | `/api/shorts/{id}/characters` | 30s |
| `useSubscription` | `SubscriptionStatus` | `/api/subscription` | 5min |
| `useAdminSettings` | `AdminSettings` | `/api/admin/settings` | 10min |
| `useStorage` | `StorageResponse` | `/api/storage` | Configurable |

Mutations: `useAddScene`, `useGenerateScript`, `useApproveScript`, `useDeleteShort`.

### Forms

React Hook Form + Zod:

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({ title: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

## Routing & Navigation

App Router groups: `(public)`, `(protected)`, `admin`.

- **Protected**: `/dashboard`, `/shorts`, `/billing`.
- **Admin**: `/admin/settings`, `/admin/onboarding`.
- **useRouter** for programmatic nav.

Metadata auto-handled via contexts.

## Performance & Best Practices

- **Server-first**: Fetch in Server Components.
- **Query Keys**: `['shorts', shortId]`—structured arrays.
- **Optimistic Updates**: In mutations (e.g., credits deduct).
- **Dynamic Imports**: `dynamic(() => import('./HeavyChart'), { ssr: false })`.
- **Images**: Next/Image with `priority` for LCP.
- **No Client DB**: `@/lib/db` server-only.

**Cache**:
- `SimpleCache` (`src/lib/cache.ts`).
- Storage: `useStorage`, `VercelBlobStorage`.

## Accessibility & Testing

- Radix UI: Built-in a11y.
- ARIA: Labels on icons, `aria-expanded`.
- Tests: RTL for components (`__tests__/`), Playwright for E2E.

## Key Integrations

- **AI**: `FalAdapter` (Flux/Kling), `OpenRouterAdapter`. Hooks: `use-ai-image`, `use-fal-generation`.
- **Billing**: Asaas (`AsaasClient`), Clerk plans (`use-admin-plans`).
- **Shorts Pipeline**: `src/lib/shorts/pipeline.ts`—`addScene`, `approveScript`.
- **Credits**: Limits (`canCreateCharacter`), deduct/track.

For API details, see `docs/backend.md`. For hooks source, search `src/hooks/`.
