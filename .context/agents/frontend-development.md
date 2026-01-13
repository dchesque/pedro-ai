# Feature Developer Agent Playbook

## Overview

This playbook equips the feature-developer agent to implement new features, enhancements, or modifications in the Pedro-AI Next.js application. The codebase is a TypeScript/React app (406 files: 210 `.ts`, 170 `.tsx`, 20 `.js`, 6 `.mjs`; 911 symbols) built with Tailwind CSS, Clerk auth, TanStack Query, Vercel AI SDK, and Prisma backend integrations. Core domains include AI-powered shorts/video creation (`shorts`), scriptwriting (`roteirista`), styles/estilos, characters, climates, AI chat/studio, admin panels (users, credits, plans, agents), and billing.

**Primary Focus Areas**:
- **User Features**: Shorts editing/generation (`src/components/shorts/*`, `src/app/(protected)/shorts/[id]`), Roteirista wizard (`src/components/roteirista/*`), Estilos (`src/components/estilos/*`, `src/components/styles/*`), Characters/Climates (`src/components/characters/*`, `src/components/climates/*`), AI Chat/Studio (`src/components/ai-chat/*`, `src/components/ai-studio/*`).
- **API Routes (Controllers)**: `src/app/api/*` (178 symbols: e.g., `/shorts/[id]/generate`, `/roteirista/ai/generate-scenes`, `/admin/users/[id]/credits`, `/ai/image`, webhooks). Handle CRUD, AI tasks (script/media gen), auth (`validateApiKey`), logging (`withApiLogging`), responses (`createSuccessResponse`, `ApiError`).
- **Admin Features**: Dashboards/tables (`src/app/admin/*`, `src/components/admin/*`, `src/components/charts/*`).
- **Core Layers**:
  | Layer       | Directories/Files | Purpose |
  |-------------|-------------------|---------|
  | **Controllers** | `src/app/api/{shorts,roteirista,admin,ai,agents,credits,webhooks}/*` (e.g., `/shorts/[id]/scenes/[sceneId]/regenerate-image`, `/agents/[slug]/execute`) | RESTful routes for AI gen (text/image/video via OpenRouter/Fal.ai), billing (Asaas/Clerk), admin ops. Auth via Clerk/headers; deduct credits; stream responses. |
  | **Components** | `src/components/{ui,shorts,roteirista,estilos,styles,characters,climates,tones,charts,admin}/*`, `src/app/{(protected),(public),admin}/*` (203 symbols) | UI primitives (`Button`, `DataTable`, `Dialog`), domain-specific (`SortableSceneList`, `ScriptWizard`, `StyleForm`, `ToneDialog`). Pages use `usePageConfig`. |
  | **Models/Hooks** | `src/hooks/*` (e.g., `useOpenRouterModels`, `useAvailableModels`, `useAIModels`), `src/lib/ai/models.ts`, `src/lib/api-client.ts` (31 symbols) | Typed data (`AIModel`, `OpenRouterModel`), queries/mutations (`useDefaultModel`, `getModelCredits`). |

**Conventions**: Strict typing (props like `ShortCardProps`), structured query keys `['resource', id]`, Tailwind utilities + `cn`, no direct `fetch` (use `apiClient`), credit checks everywhere.

## Key Files and Purposes

| File/Path | Purpose | Key Exports/Symbols |
|-----------|---------|---------------------|
| `src/components/shorts/SortableSceneList.tsx` | Drag-drop reordering of scenes in shorts editor. | `SortableSceneListProps` |
| `src/components/shorts/ShortCard.tsx` | Displays short project with previews/actions. | `ShortCardProps` |
| `src/components/shorts/SceneCard.tsx` | Scene preview/edit/regenerate UI. | `SceneCardProps` |
| `src/components/shorts/RegenerateSceneDialog.tsx` | Modal for regenerating scene script/image/media. | `RegenerateSceneDialogProps` |
| `src/components/shorts/EditSceneDialog.tsx` | Inline scene editing dialog. | `EditSceneDialogProps` |
| `src/components/shorts/CreateShortForm.tsx` | New shorts form with model selector/credit estimate. | `CreateShortFormProps` |
| `src/components/shorts/AIModelSelector.tsx` | Dropdown for AI models filtered by capability. | `AIModelSelectorProps` |
| `src/components/shorts/AddSceneDialog.tsx` | Add new scene to short. | `AddSceneDialogProps` |
| `src/components/shorts/CreditEstimate.tsx` | Displays estimated credits for generation. | `CreditEstimateProps` |
| `src/components/roteirista/ScriptWizard.tsx` | Multi-step AI script generator. | `ScriptWizardProps` |
| `src/components/roteirista/SceneEditor.tsx` | Editable scenes with AI text assist. | `SceneEditorProps` |
| `src/components/roteirista/AITextAssistant.tsx` | Inline AI suggestions for text. | `AITextAssistantProps` |
| `src/components/estilos/StyleForm.tsx` | CRUD form for custom styles/climates. | `StyleFormProps` |
| `src/components/styles/guided-select-group.tsx` | Guided style selection UI. | `GuidedSelectGroupProps`, `GuidedSelectCardProps` |
| `src/components/styles/climate-affinities.tsx` | Climate/style affinity picker. | `Climate`, `ClimateAffinitiesProps` |
| `src/components/styles/advanced-instructions.tsx` | Custom AI prompt instructions. | `AdvancedInstructionsProps` |
| `src/components/tones/ToneDialog.tsx` | Tone selection dialog. | `ToneDialogProps` |
| `src/components/tones/ToneCard.tsx` | Tone preview cards. | `ToneCardProps` |
| `src/components/ui/data-table.tsx` | Server/client paginated tables (admin lists). | `DataTableProps`, `Column` |
| `src/components/ui/button.tsx` | Accessible button primitive. | `ButtonProps` |
| `src/components/ui/glowing-effect.tsx` | Animated glow for highlights. | `GlowingEffectProps` |
| `src/hooks/use-page-config.ts` | Page metadata/breadcrumbs. | `usePageConfig` |
| `src/lib/api-client.ts` | Typed API client (Axios). | `apiClient`, `ApiError` |
| `src/lib/api-auth.ts` | Auth guards/responses. | `validateApiKey`, `createUnauthorizedResponse`, `createSuccessResponse` |
| `src/hooks/use-openrouter-models.ts` | Fetches/filter OpenRouter models. | `OpenRouterModel`, `useOpenRouterModels` |
| `src/lib/ai/models.ts` | Model registry/utils. | `AIModel`, `getDefaultModel`, `getModelCredits` |
| `src/hooks/use-available-models.ts` | Capability-filtered models. | `AIModel`, `useAvailableModels` |

## Core Workflows

### 1. New Feature Page/Route (e.g., `/shorts/[id]/new-feature`)
1. Create `src/app/(protected)/shorts/[id]/new-feature/page.tsx`:
   ```tsx
   'use client';
   import { usePageConfig } from '@/hooks/use-page-config';
   import NewFeatureComponent from '@/components/shorts/NewFeature';

   export default function NewFeaturePage({ params }: { params: { id: string } }) {
     usePageConfig({ title: 'New Feature', breadcrumbs: [{ label: 'Shorts', href: '/shorts' }, { label: 'Edit', href: `/shorts/${params.id}` }, { label: 'New Feature' }] });
     return <NewFeatureComponent shortId={params.id} />;
   }
   ```
2. Add nav link in parent layout/sidebar (`src/components/navigation/*`).
3. Use Server Components for initial data; client for interactivity.

### 2. New/Modify Component (e.g., Extend Shorts Editor)
1. Locate domain: `src/components/shorts/NewFeature.tsx`.
2. Compose primitives:
   ```tsx
   import { Button } from '@/components/ui/button';
   import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
   import { Card, CardContent } from '@/components/ui/card';
   import { cn } from '@/lib/utils';

   interface NewFeatureProps { shortId: string; className?: string; }
   export function NewFeature({ shortId, className }: NewFeatureProps) {
     return (
       <Card className={cn('p-6', className)}>
         <Dialog>
           <DialogTrigger asChild><Button>New Feature</Button></DialogTrigger>
           <DialogContent>
             <Button onClick={() => api.POST(`/api/shorts/${shortId}/new-feature`)}>Generate</Button>
           </DialogContent>
         </Dialog>
       </Card>
     );
   }
   ```
3. Export default component; type all props (PascalCase interfaces).
4. Add glowing/animations: Wrap with `<GlowingEffect />`.

### 3. Data Fetching/Mutations (TanStack Query Hooks)
1. New hook `src/hooks/use-new-feature.ts`:
   ```tsx
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { apiClient } from '@/lib/api-client';
   import { useToast } from '@/components/ui/use-toast';
   import type { AIModel } from '@/lib/ai/models';

   export function useNewFeature(shortId: string) {
     return useQuery({
       queryKey: ['shorts', shortId, 'new-feature'],
       queryFn: () => apiClient.GET(`/api/shorts/${shortId}/new-feature`).then(res => res.data),
       staleTime: 5 * 60 * 1000,
     });
   }

   export function useCreateNewFeature(shortId: string) {
     const queryClient = useQueryClient();
     const { toast } = useToast();
     return useMutation({
       mutationFn: (data: { model: AIModel; prompt: string }) => apiClient.POST(`/api/shorts/${shortId}/new-feature`, data),
       onSuccess: () => {
         toast({ title: 'Feature created!' });
         queryClient.invalidateQueries({ queryKey: ['shorts', shortId] });
       },
       onError: (err: ApiError) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
     });
   }
   ```
2. Integrate: `<Button disabled={isPending || !hasEnoughCredits} onClick={() => mutate({ model, prompt })} />`.
3. Invalidate parent lists (e.g., `['shorts']`).

### 4. Forms/Validation (react-hook-form + Zod)
1. Schema: `const schema = z.object({ prompt: z.string().min(10) });`.
2. Form:
   ```tsx
   const form = useForm({ resolver: zodResolver(schema), defaultValues: { prompt: '' } });
   const { mutate } = useCreateNewFeature(shortId);
   const onSubmit = (data: z.infer<typeof schema>) => mutate(data);
   ```
3. Credit check: `const { data: credits } = useCredits(); form.setError if insufficient.
4. File uploads: `FormData` for images/videos.

### 5. AI Generation Integrations
1. Models: `<AIModelSelector models={useAvailableModels('text')} />`.
2. Chat/Stream: Extend `useChat` from Vercel AI; POST to `/api/ai/chat` or domain-specific (e.g., `/shorts/[id]/generate-script`).
3. Image/Video: `mutate({ prompt })` → `/api/ai/fal/image` or `/api/ai/fal/video`; display progress via `onProgress`.
4. Scenes/Scripts: Sequence calls: generate → approve → regenerate; use `SortableSceneList`.

### 6. API Route (New Endpoint, e.g., `/api/shorts/[id]/new-feature`)
1. `src/app/api/shorts/[id]/new-feature/route.ts`:
   ```ts
   import { NextRequest } from 'next/server';
   import { validateApiKey, createSuccessResponse } from '@/lib/api-auth';
   import { withApiLogging } from '@/lib/logging/api';
   import { deductCredits } from '@/lib/credits'; // Assume exists

   export const POST = withApiLogging(async (req: NextRequest, { params }: { params: { id: string } }) => {
     validateApiKey(req);
     const data = await req.json();
     await deductCredits(req, 'new-feature', 10); // Dynamic cost
     // AI logic: OpenRouter/Fal.ai
     return createSuccessResponse({ result: 'generated' });
   });
   ```
2. Auth: Clerk user ID from headers; rate-limit heavy AI.

### 7. Admin Table/Form (e.g., New Admin Tab)
1. Table: `<DataTable columns={columns} data={useAdminNewFeatures({ page, search })} />`.
2. Forms: Similar to user flow; use `useAdminModels`, `useSaveAdminModels`.

## Best Practices and Code Patterns

- **Typing**: All props/interfaces PascalCase (e.g., `ClimateAffinitiesProps`). Extend primitives (e.g., `interface X extends ButtonProps {}`).
- **Styling**: `cn('base', className)`; responsive `grid-cols-1 md:grid-cols-2`; themes via `ThemeProvider`.
- **Auth/Guards**: Client: Clerk hooks; API: `validateApiKey`. Protected routes auto-guarded.
- **Errors/UX**: `ApiError` typed; toasts for all states; skeletons for loading (`isPending`).
- **Performance**: `staleTime: 5min`; suspense boundaries; `react-window` for long lists.
- **Credits/Billing**: Always pre-check `/api/credits/me`; estimate via `CreditEstimate`; deduct post-success.
- **AI Patterns**: Filter models by cap (`text`/`image`); stream `useChat`; fallback `getDefaultModel`.
- **Accessibility**: `aria-label`, `role="dialog"`, keyboard-focusable buttons.
- **Conventions**:
  - Files: Domain-grouped (`shorts/*.tsx`).
  - Hooks: `usePascalName`, prefix `useAdmin*` for admin.
  - Queries: `['domain', 'action', id]`.
  - No `console.log`; use logging wrappers.
- **Testing/Validation**: Lint (`npm run lint --fix`), typecheck, build. Manual: credits=0, errors, mobile, AI mocks.

## Quality Gates
1. **Local**: `npm run dev/build/lint/typecheck`.
2. **Verify**: Full flows (create → gen → edit → credits deduct), responsive, no hydration errors.
3. **PR**: Screenshots/GIFs, "Added X with Y credits cost", new symbols/hooks listed.
4. **Edge**: Low credits, invalid inputs, network fail, long prompts.
