# Feature Developer Agent Playbook

## Codebase Overview

This is a Next.js 14+ App Router application built with TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query (React Query), Prisma ORM, Clerk for authentication, and Stripe/Asaas for billing. Core domain revolves around AI-powered content creation (shorts, roteirista/scripts, estilos/styles, characters), credit-based usage metering, admin dashboards, and AI provider integrations (OpenRouter, Fal.ai, etc.).

- **Total Files**: 367 (.ts/.tsx dominant)
- **Key Layers**:
  | Layer | Directories | Purpose |
  |-------|-------------|---------|
  | **Components/UI** | `src/components/*`, `src/app/(protected)/*`, `src/app/(public)/*`, `src/app/admin/*` | Reusable UI (shadcn primitives in `src/components/ui`), feature-specific views (e.g., `shorts`, `roteirista`, `estilos`), pages with metadata/breadcrumbs. |
  | **Controllers/API** | `src/app/api/*`, `src/lib/api-*`, `src/hooks/use-*.ts` | Route handlers with auth/credit gating, logging (`src/lib/logging`), AI proxies. |
  | **Models/Data** | `prisma/schema.prisma`, `src/lib/ai/models.ts`, `src/components/*/types.ts` | Prisma schemas (User, Short, Style, CreditUsage, etc.), Zod-validated types, AI model configs. |
  | **Hooks/Utils** | `src/hooks/*`, `src/lib/*` | TanStack Query wrappers, AI model selectors, auth helpers, page config (`usePageConfig`). |
  | **Config** | `next.config.js`, `.env*`, `src/lib/clerk/*`, `prisma/migrations/` | Env vars for AI keys, Clerk webhooks, credit packs. |

- **Routing Patterns**:
  - Public: `src/app/(public)/sign-in|sign-up|subscribe`
  - Protected: `src/app/(protected)/dashboard|shorts|roteirista|estilos|ai-chat|ai-studio`
  - Admin: `src/app/admin/*`
  - Dynamic: `[id]/edit`, `[id]/scenes/[sceneId]`

- **Data Flow**: Server Components for SSR, Client Components (`"use client"`) for interactivity. All client fetches via TanStack Query hooks. Credits gate AI ops (`OperationType` enum in Prisma).

## Key Files and Purposes

| File/Path | Purpose | Key Exports/Usage |
|-----------|---------|-------------------|
| `prisma/schema.prisma` | Core DB models (User, Short, Scene, Style, CreditUsage, PlanFeature). Edit + `npx prisma db push/migrate`. | Relations: `userId` ownership, cascades on delete. |
| `src/lib/api-client.ts` | Axios-like client for TanStack Query. | `apiClient`, `ApiError`. Use in all hooks. |
| `src/lib/api-auth.ts` | API middleware helpers. | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`. |
| `src/lib/logging/api.ts` | Structured logging for routes. | `withApiLogging`. Wrap handlers. |
| `src/lib/ai/models.ts` | AI provider configs. | `AIModel`, `getDefaultModel`, `getModelCredits`. |
| `src/hooks/use-ai-models.ts` | Model fetching hooks. | `useAIModels`, `useDefaultModel`. |
| `src/components/ui/*` | shadcn primitives (Button, DataTable, Textarea, Dropdown). | Extend props (e.g., `ButtonProps`, `DataTableProps`). |
| `src/components/shorts/*` | Shorts workflow UI. | `CreateShortForm`, `SortableSceneList`, `CreditEstimate`, `AIModelSelector`. |
| `src/components/roteirista/*` | Script wizard UI. | `ScriptWizard`, `SceneEditor`, `AITextAssistant`. |
| `src/components/estilos/*` | Style editor UI. | `StyleForm`, `StyleCard`, `IconPicker`. |
| `src/app/api/[feature]/[id]/*` | Feature-specific APIs (e.g., `shorts/[id]/generate`, `styles/[id]`). | Credit-gated mutations (e.g., script gen deducts credits). |
| `src/contexts/page-metadata.tsx` | Page config (title, desc, breadcrumbs). | Use `usePageConfig` in pages. |
| `src/lib/clerk/credit-packs.ts` | Billing mappings. | Update for new credit packs. |

## Best Practices and Code Conventions

- **Naming**: Kebab-case files/directories, PascalCase components/types, camelCase hooks/functions. Query keys: `['domain', 'resource', params]` (e.g., `['admin', 'users', {page: 1}]`).
- **TypeScript**: Zod for validation (`z.object({...}).parse()` in APIs). Infer types from Prisma (`Prisma.UserGetPayload`).
- **Auth/Security**: Clerk middleware + `validateApiKey(userId)` in all APIs. Owner checks: `where: { userId, id }`. Rate-limit via Upstash/credits.
- **Credits Gating**: For AI (`ai_text_*`, `ai_image_*`): Check `user.credits >= cost` pre-call, deduct post-success via `prisma.creditUsage.create({operationType: 'ai_script_gen', creditsUsed})`.
- **AI Proxies**: Server-only (`src/app/api/ai/*`). Fallback to default model. Env: `OPENROUTER_API_KEY`, `FAL_KEY`.
- **UI**: shadcn/ui + Tailwind. Animations via `framer-motion`. Themes: `ThemeProvider`.
- **Performance**: Server Components default. Client: `Suspense` + streaming. Indexes on `userId`, `createdAt`.
- **Error Handling**: `ApiError` with `statusCode`, `message`. Toasts via `sonner` in mutations.
- **Migrations**: `npx prisma migrate dev --name feature`, `db push` for dev.

**Component Patterns**:
```tsx
// Reusable dialog/card
interface Props { /* ... */ }
export function Component({ ... }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Title</CardTitle></CardHeader>
      <CardContent>...</CardContent>
    </Card>
  );
}
```

**API Route Patterns**:
```ts
// src/app/api/feature/[id]/action/route.ts
import { withApiLogging } from '@/lib/logging/api';
import { validateApiKey } from '@/lib/api-auth';
import { z } from 'zod';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return withApiLogging(async () => {
    const userId = validateApiKey(await req.json());
    const data = z.object({...}).parse(await req.json());
    // Credit check + deduct
    // AI call
    return createSuccessResponse(result);
  });
}
```

## Workflows for Common Tasks

### 1. New Feature Planning (Always First)
Follow **Architecture & Planning** prompt:
1. Restate req + AC.
2. Inventory: `listFiles('src/app/api/*feature*')`, `analyzeSymbols('src/components/*')`.
3. Draft: Problem/Goals, Flows (URLs + metadata), Data (Prisma changes), APIs (endpoints + Zod schemas + `OperationType`), Security/Credits.
4. Tasks: Break into PRs (e.g., #1: Models/Migrations, #2: APIs, #3: UI + Hooks).
5. Validate: `npm run typecheck && npm run build`.

### 2. Add/Modify Prisma Model
1. Edit `prisma/schema.prisma` (add fields/relations/indexes).
2. `npx prisma generate && npx prisma db push`.
3. Update types in `src/types/prisma.ts` if needed.
4. Add migrations: `npx prisma migrate dev`.

### 3. New API Endpoint
1. Create `src/app/api/[feature]/[action]/route.ts`.
2. Import helpers: `validateApiKey`, `withApiLogging`, Zod schema.
3. Structure: Auth → Validate → Credit check → Business logic → Deduct → Respond.
4. For AI: Use `src/lib/ai/providers/*`, map to `getModelCredits(model)`.
5. Test: `curl` or Postman with Clerk token.

**Example** (Credit-gated AI gen):
```ts
const cost = getModelCredits(modelId) * scenes.length;
if (user.credits < cost) throw new ApiError(402, 'Insufficient credits');
await deductCredits(userId, cost); // prisma tx
const result = await generateAI(...);
await logUsage(userId, 'ai_short_gen', cost);
```

### 4. New Page/View
1. Add `src/app/(protected)/feature/page.tsx` (Server Component).
2. Client parts: New file `"use client"`, extract to `src/components/feature/*`.
3. Metadata: `<PageMetadata title="Feature" breadcrumbs={...} />`.
4. Data: Use QueryDevtools + custom hooks.

**Page Skeleton**:
```tsx
import { PageMetadata } from '@/contexts/page-metadata';
import { CreateFeatureForm } from '@/components/feature';

export default function FeaturePage() {
  return (
    <div className="space-y-6">
      <PageMetadata title="Feature" />
      <CreateFeatureForm />
    </div>
  );
}
```

### 5. Client Data Fetching (TanStack Query)
1. **Query Hook** (`src/hooks/useFeature.ts`):
   ```ts
   export function useFeatures(filters = {}) {
     return useQuery({
       queryKey: ['user', 'features', filters],
       queryFn: () => apiClient.get('/api/user/features', { params: filters }),
       staleTime: 5 * 60_000,
     });
   }
   ```
2. **Mutation Hook**:
   ```ts
   export function useCreateFeature() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (data) => apiClient.post('/api/feature', data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['user', 'features'] });
         toast.success('Created!');
       },
     });
   }
   ```
3. Usage: `<FeatureList data={data} />`, `mutate(data)` in forms.
4. Pagination: `useInfiniteQuery` with `cursor`.

### 6. New Component/Dialog
1. `src/components/feature/NewDialog.tsx`: Use `Dialog` from shadcn, form with `react-hook-form` + Zod resolver.
2. Props: Typed interfaces (e.g., `DialogProps & { onSuccess?: () => void }`).
3. Integrate `AIModelSelector`, `CreditEstimate` for AI features.
4. Animations: `AnimatePresence` + variants.

### 7. Billing/Credits Integration
1. New pack: Update `src/lib/clerk/credit-packs.ts`, Clerk dashboard Price ID.
2. Webhook: Extend `src/app/api/webhooks/clerk/route.ts` → `addUserCredits`.
3. UI: Use `src/components/credits/credit-status.tsx`.

### 8. Testing and Deployment
- **Local**: `npm run dev`, seed DB `npx prisma db seed`.
- **Typecheck/Build**: `npm run typecheck && npm run build`.
- **Lint**: ESLint + Prettier enforced.
- **Deploy**: Vercel, watch migrations/webhooks.

## Task Checklist Template
- [ ] Planning doc (paste in PR).
- [ ] Prisma changes + migrate.
- [ ] APIs + auth/credits.
- [ ] Hooks (queries/mutations + invalidation).
- [ ] Components + pages.
- [ ] Metadata/breadcrumbs.
- [ ] E2E flows tested.
- [ ] `typecheck` + `build` passes.
