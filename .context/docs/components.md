# Components Documentation

## Overview

This documentation covers the React components in the `src/components/` directory of the Pedro AI application. Pedro AI is a Next.js 14 App Router app for AI-powered short video creation, scriptwriting, character management, and billing. Components follow a **component-driven architecture** using **TypeScript**, **Tailwind CSS**, **Radix UI primitives**, and **shadcn/ui** patterns.

**Key Stats** (from codebase analysis):
- **187+ components/symbols** (203 total, including sub-exports)
- **Dependencies**: Models (31 symbols), Utils (183), Hooks (e.g., `useShorts`, `useCredits`, `useAgents`)
- **Top Imported**: `ScriptWizard.tsx` (5 files), `pricing-card.tsx` (5), `plan-pricing-section.tsx` (4)
- **Patterns**: Compound components, custom hooks for mutations/queries (TanStack Query), `cn()` for styling, `react-hook-form` + Zod for forms
- **Styling**: `cn()` from `src/lib/utils.ts`
- **Auth**: Clerk integration
- **AI Integration**: Hooks like `useGenerateScript`, `useFalGeneration`

```
src/components/
├── ui/                      # Reusable primitives (Autocomplete, Button, Dialog, Form, etc.)
├── app/                     # Global layouts (AppShell, CookieConsent)
├── admin/                   # Admin UI (AdminChrome, AdminTopbar)
├── ai-chat/                 # Chat UI (ChatInput, message-bubble.tsx)
├── billing/                 # Billing modals (cpf-modal.tsx)
├── characters/              # Character UI (CharacterSelector)
├── estilos/                 # Style selectors (StyleForm, ContentTypeSelector)
├── marketing/               # Landing (AIStarter)
├── plans/                   # Pricing (pricing-card.tsx, plan-pricing-section.tsx, plan-tier-config.tsx)
├── roteirista/              # Script wizard (ScriptWizard, steps/)
└── shorts/                  # Video pipeline (CreateShortForm, AddSceneDialog)
```

Components integrate with **Prisma models** via hooks and **apiClient** for mutations.

See [Hooks Documentation](../hooks/hooks.md) for data-fetching details. [Utils](../utils.md) for shared logic.

## UI Primitives (`src/components/ui/`)

shadcn/ui-inspired, Radix-based. Highly reusable, accessible.

| Component | Exports | Purpose | Key Props/Usage |
|-----------|---------|---------|-----------------|
| `autocomplete.tsx` | `AutocompleteItem` (type) | Typeahead dropdown | `items: AutocompleteItem[]`, `onSelect: (value: string) => void`<br>```tsx<br><Autocomplete items={options} onSelect={setValue} /><br>``` |
| `button.tsx` | `Button` | Versatile button | Variants: `default`, `destructive`, `outline`; Sizes: `sm`, `lg`, `icon`; `asChild` |
| `dialog.tsx` | `Dialog`, `DialogContent`, `DialogTrigger`, `DialogOverlay` | Modal dialogs | Animated backdrop; Use with `DialogClose` |
| `form.tsx` | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` | Form with `react-hook-form` + Zod | `resolver: zodResolver(schema)`<br>See example below |
| `input.tsx` | `Input` | Text inputs | Standard + variants (ghost, destructive) |

**Form + Dialog Example**:
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as z from "zod";

const schema = z.object({ name: z.string().min(1) });

export function ExampleDialog() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**Cross-refs**: `cn()` (`src/lib/utils.ts`), `useToast` for feedback.

## App Layout (`src/components/app/`)

Global wrappers.

| Component | Exports | Purpose | Usage |
|-----------|---------|---------|-------|
| `app-shell.tsx` | `AppShell` | Sidebar + topbar + main layout | ```<AppShell><Sidebar /><main>{children}</main></AppShell>``` |
| `cookie-consent.tsx` | `CookieConsent` | GDPR banner | Configurable accept/reject |

**Related**: Integrates with `AdminChrome` for admin routes.

## Admin UI (`src/components/admin/`)

Dashboard components. Depend on `useAdminSettings` (`AdminSettings` type).

| Component | Exports | Purpose | Key Hooks/Pages |
|-----------|---------|---------|-----------------|
| `admin-chrome.tsx` | `AdminChrome` | Full admin shell (sidebar/content) | `useAdminSettings` |
| `admin-topbar.tsx` | `AdminTopbar` | Nav header | Used in `AdminChrome` |
| `plans/types.ts` | `BillingPlan`, `PlanFeatureForm`, `SyncPreview` | Plan types | `useAdminPlans` |

**Usage Example**:
```tsx
import { AdminChrome } from "@/components/admin/admin-chrome";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { useAdminSettings } from "@/hooks/use-admin-settings";

export default function AdminPage() {
  const { data: settings } = useAdminSettings();

  return (
    <AdminChrome>
      <AdminTopbar />
      <div>Admin content using {settings?.plan}</div>
    </AdminChrome>
  );
}
```

**Pages**: `src/app/admin/[id]/page.tsx` (`AdminAgentEditPage`), `src/app/admin/settings/page.tsx` (`AdminSettingsPage`), `src/app/admin/onboarding/page.tsx` (`AdminOnboardingPage`).

**Provider**: `AdminDevModeProvider` (`src/contexts/admin-dev-mode.tsx`).

## Feature Components

### Shorts Pipeline (`src/components/shorts/`)
Video creation workflow. Uses `useShorts` hook (`Short`, `ShortScene` types).

| Component | Exports | Purpose | Hooks |
|-----------|---------|---------|-------|
| `AddSceneDialog.tsx` | `AddSceneDialog` | Add/edit scenes modal | `useAddScene`, `useShorts` |
| `CreateShortForm.tsx` | `CreateShortForm` | New short form | `useCreateShort`, `useGenerateScript` |

**Workflow**:
1. `useCreateShort({ ...CreateShortInput })`
2. `useGenerateScript(shortId)`
3. `useAddScene`, `useGenerateMedia`
4. `useApproveScript`

**Example**:
```tsx
import { CreateShortForm } from "@/components/shorts/CreateShortForm";
import { AddSceneDialog } from "@/components/shorts/AddSceneDialog";
import { useShorts } from "@/hooks/use-shorts";

export default function ShortsPage() {
  const { data: shorts } = useShorts();

  return (
    <>
      <CreateShortForm />
      {shorts?.map(short => (
        <AddSceneDialog key={short.id} shortId={short.id} />
      ))}
    </>
  );
}
```

**Limits**: `canAddCharacterToShort`, `canCreateCharacter` (`src/lib/characters/limits.ts`).

### Roteirista (`src/components/roteirista/`)
AI script wizard. Top-imported (`ScriptWizard.tsx` by 5 files).

| Component | Exports | Purpose | Types/Hooks |
|-----------|---------|---------|-------------|
| `ScriptWizard.tsx` | `ScriptWizard` | Multi-step script gen | `WizardStep`, `AIAction` (`src/lib/roteirista/types.ts`) |
| `steps/ConceptStep.tsx` | - | Step 1: Concept | `useGenerateScript` |

**Related**: `src/lib/agents/scriptwriter.ts`, `useApproveScript`.

### Plans & Billing (`src/components/plans/`, `src/components/billing/`)
Pricing + payments.

| Component | Exports | Purpose | Utils/Types |
|-----------|---------|---------|-------------|
| `pricing-card.tsx` | - | Pricing card | `buildPlanTiers` |
| `plan-pricing-section.tsx` | - | Pricing grid | Imported by 4+ files |
| `plan-tier-config.tsx` | `buildPlanTiers` | Tier builder | `BillingPeriod`, `PlanDisplay` |
| `billing/cpf-modal.tsx` | `BillingType` | CPF input modal | Brazilian billing |

**Hooks**: `usePublicPlans` (`PublicPlan`), `useAdminPlans` (`ClerkPlan`).

### Characters (`src/components/characters/`)
| Component | Exports | Purpose | Hooks |
|-----------|---------|---------|-------|
| `CharacterSelector.tsx` | - | Character dropdown | `useCharacters`, `useShortCharacters` (`ShortCharacterWithDetails`) |

### Estilos (Styles) (`src/components/estilos/`)
| Component | Exports | Purpose | Hooks/Types |
|-----------|---------|---------|-------------|
| `StyleForm.tsx` | - | Style CRUD form | `useStyles`, `useCreateStyle` (`Style` type) |
| - | `ContentType`, `DiscourseArchitecture`, etc. | Enums | `src/types/style.ts` |

**Hooks**: `useStyles`, `useTone` (`Tone`).

### AI Chat (`src/components/ai-chat/`)
| Component | Exports | Purpose |
|-----------|---------|---------|
| `ChatInput.tsx` | - | Send input |
| `message-bubble.tsx` | `ChatMessage` | Message UI |

**Related**: `AIStarter` (`src/components/marketing/ai-starter.tsx`).

### Marketing (`src/components/marketing/`)
| Component | Exports | Purpose |
|-----------|---------|---------|
| `ai-starter.tsx` | `AIStarter` | Landing AI demo |

## Contexts & Providers
- `page-metadata.tsx`: `BreadcrumbItem` type
- Admin providers in `src/contexts/`

## Patterns & Best Practices
- **Data Flow**: Custom TanStack Query hooks (e.g., `useShorts` → `{ data, mutate }`)
- **Mutations**: Optimistic updates (e.g., `useCreateShort`)
- **Errors**: `ApiError` (`src/lib/api-client.ts`), `InsufficientCreditsError`
- **Loading**: `<Skeleton />` components (ui/skeleton.tsx)
- **Accessibility**: Radix ARIA, `aria-label`, keyboard nav
- **Performance**: `React.memo` on lists, `useMemo` for derived state
- **Testing**: `@testing-library/react`, MSW for API
- **Adding Components**: Follow shadcn/ui CLI: `npx shadcn-ui@latest add button`

**Quick Search**: Use `rg "import.*components"` or IDE "Find Usages".

**Cross-References**:
- [Hooks](../hooks/hooks.md): `useShorts`, `useCredits`
- [Models](../models.md): Prisma types
- [Utils](../utils.md): `cn()`, `apiClient`
- Public Exports: `AppShell`, `AdminChrome`, `AddSceneDialog`, etc. (see codebase public API)
