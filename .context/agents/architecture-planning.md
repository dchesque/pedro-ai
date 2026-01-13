# Feature Developer Agent Playbook

## Codebase Overview

Next.js 14+ App Router app with TypeScript (.ts/.tsx dominant: 380 files), Tailwind CSS, shadcn/ui, TanStack Query, Prisma ORM, Clerk auth, Asaas/Stripe billing. Domain: AI content creation (shorts/videos, roteirista/scripts, estilos/styles, characters, climates, tones, agents), credit metering (`CreditUsage` + `OperationType`), admin panels, AI integrations (OpenRouter, Fal.ai, providers).

- **Stats**: 406 files, 911 symbols. Languages: .ts(210), .tsx(170), .js(20), .mjs(6).
- **Key Layers**:
  | Layer | Directories/Files | Purpose |
  |-------|-------------------|---------|
  | **Controllers/API** | `src/app/api/*` (e.g., `shorts/[id]/generate`, `styles/[id]`, `agents/[slug]/execute`, `roteirista/ai/*`, `admin/*`, `webhooks/*`), `src/lib/api-*.ts`, `src/lib/logging`, `src/hooks/use-*.ts` | Auth-gated routes (`validateApiKey`), Zod validation, credit checks/deductions, AI proxies (`src/lib/ai/providers`), logging (`withApiLogging`). |
  | **Components/UI** | `src/components/*` (ui primitives, shorts, roteirista, estilos, tones, climates, characters, agents, admin, charts), `src/app/(protected)/*`, `src/app/(public)/*`, `src/app/admin/*`, `src/app/subscribe` | Feature views (e.g., `CreateShortForm`, `ScriptWizard`, `StyleForm`), dialogs (`ToneDialog`, `RegenerateSceneDialog`), tables (`DataTable`), selectors (`AIModelSelector`). Server/Client Components. |
  | **Models/Data** | `prisma/schema.prisma`, `src/lib/ai/models.ts`, `src/hooks/use-*-models.ts`, `src/components/*/types.ts` (e.g., `ShortCardProps`, `StyleFormProps`) | Prisma (User, Short, Scene, Style, Climate, Tone, Agent, PlanFeature, CreditUsage). AI models (`AIModel`), Zod schemas. |
  | **Hooks/Utils** | `src/hooks/*` (e.g., `useAIModels`, `useOpenRouterModels`, `usePageConfig`), `src/lib/ai/*`, `src/lib/clerk/*` | Query/mutation wrappers, model selectors, auth (`createErrorResponse`), page metadata. |
  | **Config** | `next.config.js`, `.env*`, `prisma/migrations/`, `src/lib/clerk/credit-packs.ts` | AI keys (`OPENROUTER_API_KEY`), Clerk webhooks, credit packs, Prisma enums (`OperationType`). |

- **Routing**: Public `(public)/sign-in|up`, Protected `(protected)/shorts|roteirista|estilos|characters|agents|ai-chat|ai-studio`, Admin `admin/*`, Dynamic `[id]/edit|scenes/[sceneId]`.
- **Data Flow**: SSR Server Components → Client `"use client"` + TanStack Query. Credits gate AI (`ai_text_*`, `ai_image_*`). Framer Motion animations, Sonner toasts.

## Key Files and Purposes

| File/Path | Purpose | Key Exports/Usage |
|-----------|---------|-------------------|
| `prisma/schema.prisma` | DB models (User→Short/Style/Character/Agent/Scene, CreditUsage w/ `operationType`, indexes on `userId`). | Relations/cascades. Edit → `npx prisma db push/migrate dev`. |
| `src/lib/api-client.ts` | API client for queries. | `apiClient`, `ApiError`. Base for all hooks. |
| `src/lib/api-auth.ts` | Auth responses. | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse`, `createErrorResponse`. |
| `src/lib/logging/api.ts` | Route logging. | `withApiLogging` wrapper. |
| `src/lib/ai/models.ts` | AI configs. | `AIModel`, `getDefaultModel`, `getModelById`, `getModelCredits`. |
| `src/hooks/use-ai-models.ts` & `use-available-models.ts` | Model hooks. | `useAIModels`, `useDefaultModel`, `useAvailableModels`. |
| `src/components/ui/*` | shadcn primitives. | `Button` (`ButtonProps`), `DataTable` (`Column`, `DataTableProps`), `glowing-effect` (`GlowingEffectProps`). |
| `src/components/shorts/*` | Shorts UI. | `CreateShortForm` (`CreateShortFormProps`), `SortableSceneList` (`SortableSceneListProps`), `SceneCard` (`SceneCardProps`), `CreditEstimate` (`CreditEstimateProps`), `AIModelSelector` (`AIModelSelectorProps`), `RegenerateSceneDialog`/`EditSceneDialog`/`AddSceneDialog`. |
| `src/components/roteirista/*` | Script tools. | `StylePreviewCard` (`StylePreviewCardProps`), `ScriptWizard` (`ScriptWizardProps`), `SceneEditor` (`SceneEditorProps`). |
| `src/components/estilos/*` | Styles UI. | `StyleForm` (`StyleFormProps`), `StyleCard` (`StyleCardProps`). |
| `src/components/tones/*` | Tone selectors. | `ToneDialog` (`ToneDialogProps`), `ToneCard` (`ToneCardProps`). |
| `src/components/styles/*` | Style builders. | `GuidedSelectGroup`/`Card` (`GuidedSelect*Props`), `ClimateAffinities` (`ClimateAffinitiesProps`, `Climate`), `AdvancedInstructions` (`AdvancedInstructionsProps`). |
| `src/contexts/page-metadata.tsx` | Page config. | `usePageConfig` for title/breadcrumbs. |
| `src/app/api/webhooks/clerk/route.ts` | Billing sync. | Credit pack mappings. |

## Best Practices and Code Conventions

- **Naming**: Kebab-case paths, PascalCase components/types/props, camelCase hooks/fns. Query keys: `['user'|'admin', 'resource', {filters}]` (e.g., `['shorts', {id}]`).
- **TypeScript/Zod**: Prisma payloads (`Prisma.ShortGetPayload`), Zod in APIs (`z.object({}).parse(await req.json())`), prop interfaces (e.g., `interface ShortCardProps { short: Short; }`).
- **Auth**: Clerk + `validateApiKey(await req.json())` in all APIs. Owner: `prisma.short.findUnique({where: {id_userId: {id, userId}}})`.
- **Credits**: Pre-check `user.credits >= getModelCredits(model) * qty`, tx deduct `prisma.$transaction([deduct, usage.create({operationType: 'ai_short_gen'})])`.
- **AI Calls**: Server-only via `src/lib/ai/providers/*` or `src/app/api/ai/*`. Fallback `getDefaultModel()`.
- **UI Patterns**:
  ```tsx
  // Dialog/Card (shadcn + react-hook-form + Zod)
  interface DialogProps { onSuccess?: () => void; }
  'use client';
  export function FeatureDialog({ onSuccess }: DialogProps) {
    const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
    const { mutate } = useCreateFeature();
    return (
      <Dialog>
        <DialogContent>
          <Form {...form}>
            <FormField name="field" render={({field}) => <Input {...field} />} />
            <Button onClick={form.handleSubmit(data => mutate(data, {onSuccess}))}>Submit</Button>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
  ```
- **API Patterns**:
  ```ts
  import { withApiLogging } from '@/lib/logging/api';
  import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
  import { z } from 'zod';
  import { getModelCredits } from '@/lib/ai/models';
  import prisma from '@/lib/prisma';

  export async function POST(req: Request, { params }: { params: { id: string } }) {
    return withApiLogging(async () => {
      const { userId } = validateApiKey(await req.json());
      const data = z.object({ modelId: z.string(), scenes: z.number() }).parse(await req.json());
      const short = await prisma.short.findUnique({ where: { id_userId: { id: params.id, userId } }, include: { user: true } });
      if (!short) throw new ApiError(404);
      const cost = getModelCredits(data.modelId) * data.scenes;
      if (short.user.credits < cost) throw new ApiError(402, 'Insufficient credits');
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { credits: { decrement: cost } } });
        await tx.creditUsage.create({ data: { userId, operationType: 'ai_short_gen', creditsUsed: cost } });
      });
      const result = await generateAI(short, data); // Provider call
      return createSuccessResponse(result);
    });
  }
  ```
- **Hooks**:
  ```ts
  export function useShort(id: string) {
    return useQuery({
      queryKey: ['shorts', { id }],
      queryFn: () => apiClient.get(`/api/shorts/${id}`).then(res => res.data),
    });
  }
  export function useCreateShort() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateShortInput) => apiClient.post('/api/shorts', data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', 'shorts'] }),
    });
  }
  ```
- **Performance**: `Suspense`, `staleTime: 5m`, indexes (`@@index([userId, createdAt])`). Server Components default.
- **Errors/UX**: `ApiError(status, msg)`, Sonner `toast.error()`, loading skeletons.

## Workflows for Common Tasks

### 1. Feature Planning
1. Restate req + acceptance criteria.
2. Gather context: `listFiles('src/app/api/*{feature}*')`, `listFiles('src/components/*{feature}*')`, `analyzeSymbols('src/components/{feature}/*.tsx')`, `searchCode('interface .*Props.*{feature}')`.
3. Outline: Goals, User Flows (pages/routes), Data (Prisma/Zod), APIs (endpoints/OperationType/costs), UI (components/hooks).
4. Tasks: PR breakdown (DB → API → Hooks/UI → Tests).
5. Validate: `npm run typecheck && npm run build`.

### 2. Prisma Changes
1. Edit `schema.prisma` (fields/enums/indexes/relations).
2. `npx prisma generate && npx prisma db push`.
3. `npx prisma migrate dev --name {feature}`.
4. Update related types/hooks (e.g., `Prisma.{Model}GetPayload`).

### 3. New/Extend API
1. `src/app/api/{feature}/[id]/{action}/route.ts` (POST/PUT/GET).
2. Auth → Zod.parse → Owner fetch → Credits check → Tx (deduct + usage) → AI/business → Respond.
3. AI: Select model, proxy via `/api/ai/*` or providers.
4. Test: Local dev + curl `Authorization: Bearer {clerk-token}`.

### 4. New Page
1. `src/app/(protected)/{feature}/page.tsx` (Server).
2. Extract Client: `src/components/{feature}/{Component}.tsx` (`"use client"`).
3. Add `<PageMetadata title="{Feature}" breadcrumbs={['Dashboard', '{Feature}']} />`.
4. Hooks: List/Create/Delete with invalidation.

**Skeleton**:
```tsx
import { PageMetadata } from '@/contexts/page-metadata';
import { FeatureList, CreateFeatureDialog } from '@/components/feature';

export default function FeaturePage() {
  return (
    <div className="space-y-6 p-6">
      <PageMetadata title="Features" />
      <CreateFeatureDialog />
      <FeatureList />
    </div>
  );
}
```

### 5. Components/Dialogs
1. Copy patterns: `Card/Dialog/FormField/Button` + `react-hook-form`.
2. Props: `{ data?: T; onSuccess?: () => void; }`.
3. Integrate: `AIModelSelector`, `CreditEstimate`, `DataTable` for lists.
4. Scenes/Lists: `SortableSceneList` + drag/reorder API.

### 6. Hooks Integration
1. Query: `useQuery({ queryKey: ['user', '{feature}s', filters], queryFn: apiClient.get(...) })`.
2. Mutation: `useMutation({ ..., onSuccess: () => queryClient.invalidateQueries(...) + toast })`.
3. Infinite/Pag: `useInfiniteQuery({ getNextPageParam: lastPage => lastPage.nextCursor })`.

### 7. Credits/Billing
1. New `OperationType`: Prisma enum + costs.
2. Packs: `src/lib/clerk/credit-packs.ts` + Clerk Price ID.
3. Webhook: Extend `/api/webhooks/clerk` → `prisma.user.update({credits: +qty})`.

### 8. Admin Extensions
1. Table: `DataTable` w/ `columns: Column[]` (actions: edit/delete).
2. Forms: `PlanFeatureForm`, `SyncPreview`.

### 9. Testing/Deploy
- Local: `npm run dev`, `npx prisma db seed`.
- Checks: `npm run lint && typecheck && build`.
- E2E: Manual flows (create → edit → AI gen → credits deduct).
- PR: Checklist + screenshots.

## Task Checklist
- [ ] Planning outline.
- [ ] Prisma + migrate.
- [ ] APIs (auth/credits/Zod).
- [ ] Hooks (queries/muts/invalidation).
- [ ] UI (components/pages/dialogs).
- [ ] Metadata/breadcrumbs/toasts.
- [ ] Edge cases (errors/empty/credits=0).
- [ ] Typecheck/build/lint.
- [ ] Test flows locally.
