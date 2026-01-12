# Feature Developer Agent Playbook

## Overview

This playbook guides the development of new features or modifications in the Pedro-AI Next.js application. The app is a TypeScript/React frontend with Tailwind CSS, Clerk authentication, TanStack Query for data management, and Vercel AI SDK for AI interactions. Focus on protected/public routes under `src/app`, UI components in `src/components`, and API integrations via `src/lib/api-client`.

**Primary Focus Areas**:
- **UI/UX Features**: Shorts creation/editing (`src/components/shorts`), Roteirista script wizard (`src/components/roteirista`), Estilos/styles (`src/components/estilos`), Characters (`src/components/characters`), AI Chat/Studio (`src/components/ai-chat`, `src/components/ai-studio`).
- **Admin Panels**: User/credit/plan management (`src/app/admin/*`, `src/components/admin/*`).
- **Core Layers**:
  | Layer       | Directories/Files | Purpose |
  |-------------|-------------------|---------|
  | **Controllers** | `src/app/api/*` (e.g., `/shorts/[id]`, `/roteirista/ai/*`, `/admin/*`) | API routes for CRUD, AI generation (scripts, images, videos), webhooks (Clerk, Asaas). Use `withApiLogging`, `ApiError`, auth guards like `validateApiKey`. |
  | **Components** | `src/components/ui/*` (primitives: `Button`, `DataTable`, `Dialog`), `src/components/shorts/*`, `src/components/roteirista/*`, `src/components/estilos/*` | Reusable UI: `SceneCard`, `ScriptWizard`, `StyleForm`, `AIModelSelector`. Compose with `cn` utility. |
  | **Models/Hooks** | `src/hooks/*` (e.g., `useOpenRouterModels`, `useCredits`), `src/lib/ai/models.ts` | Data types (`AIModel`, `SceneCardProps`), query hooks (`useAdminUsers`, `useGenerateImage`). |

**Key Metrics**: 366 files, primarily `.ts`/`.tsx`. 840 symbols, emphasizing typed props (e.g., `CreateShortFormProps`, `SortableSceneListProps`).

## Key Files and Purposes

| File/Path | Purpose | Key Exports/Symbols |
|-----------|---------|---------------------|
| `src/components/shorts/SortableSceneList.tsx` | Drag-and-drop scene reordering for shorts editor. | `SortableSceneListProps` |
| `src/components/shorts/ShortCard.tsx` | Card display for short videos/projects. | `ShortCardProps` |
| `src/components/shorts/SceneCard.tsx` | Individual scene preview/edit. | `SceneCardProps` |
| `src/components/shorts/RegenerateSceneDialog.tsx` | Dialog for AI-regenerating scene media/script. | `RegenerateSceneDialogProps` |
| `src/components/shorts/CreateShortForm.tsx` | Form for initiating new shorts with AI model/credit estimates. | `CreateShortFormProps`, integrates `AIModelSelector` |
| `src/components/roteirista/ScriptWizard.tsx` | Multi-step script generation wizard. | `ScriptWizardProps` |
| `src/components/roteirista/SceneEditor.tsx` | Editable scene text with AI assist. | `SceneEditorProps`, `AITextAssistantProps` |
| `src/components/estilos/StyleForm.tsx` | CRUD form for custom styles. | `StyleFormProps`, `IconPickerProps` |
| `src/components/ui/data-table.tsx` | Paginated, searchable tables for admin lists. | `DataTableProps`, `Column` |
| `src/components/ui/button.tsx` | Accessible button primitive. | `ButtonProps` |
| `src/hooks/use-page-config.ts` | Sets page metadata (title, breadcrumbs) for layouts. | `usePageConfig` |
| `src/lib/api-client.ts` | Typed Axios client for all API calls. | `apiClient`, `ApiError` |
| `src/lib/api-auth.ts` | Auth responses and guards. | `createUnauthorizedResponse`, `validateApiKey` |
| `src/hooks/use-openrouter-models.ts` | Fetches AI models by capability (text/image). | `useOpenRouterModels` |
| `src/lib/ai/models.ts` | Model registry and utils. | `AIModel`, `getDefaultModel` |

## Core Workflows

### 1. Adding a New Feature Page (e.g., Protected Route)
1. Determine route: `(protected)/feature-name/page.tsx` or `(public)/feature-name/page.tsx`.
2. Create `page.tsx`:
   ```tsx
   import { usePageConfig } from '@/hooks/use-page-config';
   import FeatureComponent from '@/components/feature/FeatureComponent';

   export default function FeaturePage() {
     usePageConfig({ title: 'Feature', breadcrumbs: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Feature' }] });
     return <FeatureComponent />;
   }
   ```
3. Add to layout if needed (`src/app/(protected)/layout.tsx`).
4. Fetch data via Server Component props or client hooks.

### 2. Creating/Modifying Components
1. Use primitives: `Button`, `Card`, `Dialog`, `Form` from `src/components/ui`.
2. Type props strictly (e.g., extend `ButtonProps`).
3. Styling: Tailwind + `cn` from `@/lib/utils`. Match patterns like `className="flex flex-col space-y-4"`.
4. Example new dialog:
   ```tsx
   import { Dialog, DialogContent } from '@/components/ui/dialog';
   import { Button } from '@/components/ui/button';

   interface NewDialogProps { open: boolean; onOpenChange: (open: boolean) => void; }
   export function NewDialog({ open, onOpenChange }: NewDialogProps) {
     return (
       <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
           <Button>Action</Button>
         </DialogContent>
       </Dialog>
     );
   }
   ```
5. Place in domain folder: `src/components/shorts/NewDialog.tsx`.

### 3. Data Fetching and Mutations (TanStack Query)
- **Never** use `fetch` or `useQuery` directly. Always custom hooks in `src/hooks`.
1. Query hook (`src/hooks/use-new-feature.ts`):
   ```tsx
   import { useQuery } from '@tanstack/react-query';
   import { api } from '@/lib/api-client';

   export function useNewFeature(id: string) {
     return useQuery({
       queryKey: ['new-feature', id],
       queryFn: () => api.GET(`/api/new-feature/${id}`).then(res => res.data),
       staleTime: 5 * 60_000,
     });
   }
   ```
2. Mutation hook:
   ```tsx
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { useToast } from '@/components/ui/use-toast';

   export function useCreateNewFeature() {
     const queryClient = useQueryClient();
     const { toast } = useToast();
     return useMutation({
       mutationFn: (data: FormData) => api.POST('/api/new-feature', data),
       onSuccess: () => {
         toast({ title: 'Created!' });
         queryClient.invalidateQueries({ queryKey: ['new-features'] });
       },
     });
   }
   ```
3. Component integration: Load states, errors via `isLoading`, `error`. Disable buttons on `isPending`.

**Available Hooks**: `useCredits`, `useAdminUsers`, `useGenerateImage`, `useOpenRouterModels`. Invalidate via structured keys `['domain', 'resource']`.

### 4. Forms and Validation
1. `react-hook-form` + Zod: `useForm({ resolver: zodResolver(schema) })`.
2. Server errors: Display via `form.setError`.
3. Credit-aware: Check `useCredits()` before submit; disable if insufficient.
4. Example: Integrate with `CreateShortFormProps`, estimate credits via backend.

### 5. AI Integrations (Chat/Image/Generation)
1. Chat: Extend `src/app/(protected)/ai-chat/page.tsx` pattern with `useChat`.
2. Models: Use `useOpenRouterModels('text')` or `useAvailableModels`.
3. Image Gen: `useGenerateImage` → POST `/api/ai/image` or `/api/ai/fal/image`.
4. Shorts/Roteirista: Call `/api/shorts/[id]/generate`, `/api/roteirista/ai/generate-scenes`. Stream responses, update UI incrementally.
5. Credits: Pre-check via `/api/credits/me`; deduct on success.

### 6. Admin Features
1. Tables: `DataTable` with pagination/search (`useAdminUsers({ page, search })`).
2. Forms: `useUpdatePlan`, `useAdminSettings`.
3. Sync: Buttons for `useClerkPlans`, `useAdminInvitations`.

## Best Practices from Codebase

- **Routing**: App Router only. Metadata via `usePageConfig`. No direct Prisma in client/server components—use `/lib/queries`.
- **Auth**: Clerk middleware protects `(protected)`. API: `validateApiKey`.
- **Accessibility**: ARIA labels, `role`, keyboard nav. No `dangerouslySetInnerHTML`.
- **Performance**: Server Components first. `staleTime: 5min`, structured query keys. Avoid layout shift (fixed heights).
- **Styling**: Utility-first Tailwind. Glowing effects (`GlowingEffectProps`), themes (`ThemeProvider`).
- **Error Handling**: `ApiError`, toasts for UX. Global error boundaries.
- **Credits/Billing**: Never hardcode costs. Use endpoints like `/api/credits/settings`, `useCredits`.
- **Testing Patterns**: No explicit tests listed; validate via `npm run lint`, `build`. UI: Screenshots in PRs.
- **Conventions**:
  - Exports: Default for components, named for hooks/utils.
  - Props: PascalCase interfaces (e.g., `SceneCardProps`).
  - API Paths: RESTful (e.g., `/api/shorts/[id]/scenes/[sceneId]/regenerate`).

## Quality Gates and Deployment
1. Run: `npm run dev` (hot reload), `npm run lint --fix`, `npm run typecheck`, `npm run build`.
2. Verify: No TS errors, responsive UI, credit flows, AI streaming.
3. PR: Code + description, screenshots/GIFs, steps to test. Note new hooks/props.
4. Edge Cases: Zero credits, loading states, errors, mobile.
