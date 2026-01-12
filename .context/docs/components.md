# Components Documentation

## Overview

This documentation covers the React components in the `src/components/` directory of the Pedro AI application. The app follows a component-driven architecture using **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Radix UI primitives**, and **shadcn/ui**-inspired patterns. Components are organized by feature and reusability:

```
src/components/
├── ui/                    # Reusable UI primitives (Button, Dialog, Form, Autocomplete, etc.)
├── app/                   # Global app layout (AppShell, CookieConsent, etc.)
├── admin/                 # Admin dashboard (AdminChrome, AdminTopbar, etc.)
├── ai-chat/               # AI chat interface (ChatInput, message-bubble.tsx)
├── billing/               # Billing UI (CpfModal)
├── characters/            # Character management (CharacterSelector)
├── estilos/               # Style selectors (ContentTypeSelector, StyleForm)
├── plans/                 # Pricing and plans (pricing-card.tsx, plan-pricing-section.tsx)
├── roteirista/            # Script generation wizard (ScriptWizard)
├── shorts/                # Short video pipeline (AddSceneDialog, CreateShortForm)
└── marketing/             # Landing pages (AIStarter)
```

**Key Stats**:
- 187 components/symbols
- Dependencies: Primarily on Models (29 symbols), Utils (171), Hooks (e.g., `use-shorts`, `use-credits`)
- Patterns: Compound components, render props, hooks for data fetching/mutations
- Styling: `cn()` utility from `src/lib/utils.ts` for class merging

Components integrate with **TanStack Query** via custom hooks (e.g., `useShorts`, `useCredits`) and **Clerk** for auth.

## UI Components (`src/components/ui/`)

Low-level, reusable primitives based on Radix UI + Tailwind. Follow shadcn/ui conventions.

### Autocomplete (`src/components/ui/autocomplete.tsx`)

**Purpose**: Accessible autocomplete/dropdown for typeahead input.

**Exports**:
- `AutocompleteItem` (type)

**Usage** (inferred from patterns):
```tsx
import { AutocompleteItem } from "@/components/ui/autocomplete";

const items: AutocompleteItem[] = [
  { value: "shorts", label: "Shorts" },
  { value: "characters", label: "Characters" }
];

// Integrated with Combobox primitive
<Autocomplete items={items} onSelect={handleSelect} />
```

**Props** (common):
- `items: AutocompleteItem[]`
- `onSelect: (value: string) => void`
- Supports filtering, keyboard nav.

### Button, Dialog, Form (shadcn/ui standards)

Standard implementations:
- **Button**: Variants (`default`, `destructive`, `outline`), sizes (`default`, `sm`, `lg`, `icon`). Uses `Slot` for `asChild`.
- **Dialog**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogOverlay`. Animated backdrop.
- **Form**: Integrates `react-hook-form` + Zod. Uses `FormField`, `FormItem`, `FormControl`, `FormLabel`, `FormMessage`.

**Example** (Form + Dialog):
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as z from "zod";

const schema = z.object({ name: z.string().min(1) });

function AddItemDialog() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <Dialog>
      <DialogTrigger asChild><Button>Add Item</Button></DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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

**Related**: `cn()` from `src/lib/utils.ts` for conditional classes.

## App Layout Components (`src/components/app/`)

Global wrappers and shells.

### AppShell (`src/components/app/app-shell.tsx`)

**Purpose**: Main layout wrapper with sidebar, topbar, and main content.

**Exports**: `AppShell`

**Usage**:
```tsx
// In root layout or page
<AppShell>
  <Sidebar />
  <main>{children}</main>
</AppShell>
```

**Cross-refs**: Integrates `AdminChrome` for admin routes.

### CookieConsent (`src/components/app/cookie-consent.tsx`)

**Purpose**: GDPR-compliant cookie banner.

**Props**:
- Configurable accept/reject actions.

## Admin Components (`src/components/admin/`)

Dashboard for admins.

### AdminChrome (`src/components/admin/admin-chrome.tsx`)

**Purpose**: Full admin layout (sidebar + content).

**Exports**: `AdminChrome` (line 8)

**Dependencies**: `use-admin-settings`, Models.

### AdminTopbar (`src/components/admin/admin-topbar.tsx`)

**Purpose**: Admin navigation header.

**Usage** (with `AdminChrome`):
```tsx
<AdminChrome>
  <AdminTopbar />
  <AdminContent>Dashboard</AdminContent>
</AdminChrome>
```

**Related Pages**:
- `src/app/admin/layout.tsx` (`AdminLayout`)
- `src/app/admin/settings/page.tsx` (`AdminSettingsPage`)
- `src/app/admin/onboarding/page.tsx` (`AdminOnboardingPage`)

**Hooks**: `useAdminSettings` returns `AdminSettings`.

## Feature-Specific Components

### Shorts Pipeline (`src/components/shorts/`)

Video short creation workflow.

- **AddSceneDialog** (`src/components/shorts/AddSceneDialog.tsx`): Modal for adding scenes. Uses `useAddScene` hook.
- **CreateShortForm** (`src/components/shorts/CreateShortForm.tsx`): Form for new shorts. Depends on `useCreateShort`, `useGenerateScript`.

**Workflow** (cross-ref `src/hooks/use-shorts.ts`):
1. Create short (`CreateShortInput`)
2. Generate script (`useGenerateScript`)
3. Add scenes (`ShortScene`)
4. Generate media (`useGenerateMedia`)

**Example**:
```tsx
import { useCreateShort } from "@/hooks/use-shorts";
import { CreateShortForm } from "@/components/shorts/CreateShortForm";
import { AddSceneDialog } from "@/components/shorts/AddSceneDialog";

function ShortsDashboard() {
  const createShort = useCreateShort();

  return (
    <>
      <CreateShortForm onSuccess={short => console.log(short)} />
      <AddSceneDialog shortId="123" />
    </>
  );
}
```

**Types**: `Short`, `ShortScene`, `ShortStatus`.

### Roteirista Script Wizard (`src/components/roteirista/`)

AI script generation.

- **ScriptWizard** (`src/components/roteirista/ScriptWizard.tsx`): Multi-step wizard. Imported by 5 files.
- Depends on `src/lib/roteirista/types.ts`: `ScriptFormData`, `SceneData`, `GenerateScenesRequest`.

**Hooks**: `useGenerateScript`, `useApproveScript`.

### Plans & Billing (`src/components/plans/` & `src/components/billing/`)

Pricing tables and modals.

- **pricing-card.tsx**, **plan-pricing-section.tsx**: Responsive pricing grids. Imported by 5+ files.
- **CpfModal** (`src/components/billing/cpf-modal.tsx`): Brazilian CPF input modal. Exports `BillingType`.

**Types**: `BillingPeriod`, `BillingPlan`, `PublicPlan` (from `usePublicPlans`).

**Utils**: `buildPlanTiers` from `src/components/plans/plan-tier-config.tsx`.

### Characters (`src/components/characters/`)

- **CharacterSelector** (`src/components/characters/CharacterSelector.tsx`): Dropdown for selecting characters in shorts.

**Hooks**: `useCharacters`, `CreateCharacterInput`.

**Limits**: `canCreateCharacter`, `canAddCharacterToShort` from `src/lib/characters/limits.ts`.

### Estilos (Styles) (`src/components/estilos/`)

Visual style selection.

- **ContentTypeSelector** (`src/components/estilos/ContentTypeSelector.tsx`): Toggles content types. Exports `ContentType`.
- **StyleForm** (`src/components/estilos/StyleForm.tsx`): CRUD for styles.

**Hooks**: `useStyles`, `useCreateStyle`, `Style`.

### AI Chat (`src/components/ai-chat/`)

- **ChatInput** (`src/components/ai-chat/ChatInput.tsx`): Composable input with send/submit.
- **message-bubble.tsx**: Exports `ChatMessage`.

**Related**: `src/components/marketing/ai-starter.tsx` (`AIStarter`).

## Contexts & Providers

- **AdminDevModeProvider** (`src/contexts/admin-dev-mode.tsx`): Toggles dev mode.
- **Page Metadata** (`src/contexts/page-metadata.tsx`): Exports `BreadcrumbItem`.

## Patterns & Best Practices

1. **Hooks Integration**: All data components use TanStack Query hooks (e.g., `useShorts` returns `{ data: Short[] }`).
2. **Error Handling**: `ApiError` from `src/lib/api-client.ts`. Graceful fallbacks.
3. **Loading States**: Skeleton loaders via `isLoading` from hooks.
4. **Accessibility**: Radix ARIA, semantic elements, keyboard nav.
5. **Performance**: `React.memo`, `useMemo` for lists (e.g., scenes).
6. **Testing**: Unit tests for UI (RTL + Jest), integration via MSW for API mocks.

**Cross-References**:
- **Hooks**: See `docs/hooks.md` (e.g., `useCredits` → `CreditStatus`).
- **Utils**: `cn()`, `apiClient`.
- **Models**: Prisma types underpin all data components.

For source code, search via `grep` or IDE. Contribute new components following shadcn/ui addition workflow.
