# Pedro AI Documentation

Welcome to the **Pedro AI** documentation. This guide covers the production-ready Next.js application for AI-powered short video creation, featuring script generation, character management, scene pipelines, image/video synthesis, credits-based billing, and admin tools.

## Quick Start

New to the project? Follow this order:

1. **[Architecture Overview](./architecture.md)** - Core design, layers (Components → Hooks → Lib → API)
2. **[Development Guidelines](./development-guidelines.md)** - Coding standards, hooks patterns, and workflows
3. **[Authentication](./authentication.md)** - Clerk setup and protected routes
4. **[Database](./database.md)** - Prisma schema, models (29 symbols), and migrations
5. **[Shorts Pipeline](./shorts-pipeline.md)** - Core feature: script-to-video workflow ([src/lib/shorts/pipeline.ts](src/lib/shorts/pipeline.ts))

## Documentation Structure

### Core Architecture
- **[Architecture](./architecture.md)** - Layers: Components (179 symbols), Hooks (e.g., `useShorts`), Lib/Utils (171 symbols), API routes
- **[Database](./database.md)** - Prisma models, relations (Shorts, Characters, Scenes, Credits, Users)
- **[Authentication](./authentication.md)** - Clerk + middleware, `getUserFromClerkId`, admin checks
- **[Page Metadata](./page-metadata-system.md)** - Breadcrumbs (`BreadcrumbItem`), SEO via contexts

### Development Guides
- **[Frontend](./frontend.md)** - TSX components (148 files), Tailwind v4, Radix UI, React Query hooks
- **[Backend](./backend.md)** - API routes, `apiClient`, auth utils (`validateUserAuthentication`)
- **[Components](./components.md)** - UI primitives (`src/components/ui/`), app components (Shorts, Characters, Admin)
- **[API Reference](./api.md)** - Endpoints for shorts, credits, storage (e.g., `/api/shorts`, `/api/credits`)
- **[AI Features](./ai-features.md)** 
  - Roteirista script wizard (`src/lib/roteirista/`)
  - Image/Video gen (`use-fal-generation`, FAL Kling/Flux)
  - Models/providers (`src/lib/ai/providers/`, OpenRouter adapter)
  - Credits: Text (1), Image (5), enforced via `deduct.ts`
- **[Shorts Pipeline](./shorts-pipeline.md)** - `useShorts()` hook family (create, generateScript, addScene, regenerateMedia)

### Billing & Credits
- **[Asaas Integration](./asaas.md)** - Subscriptions, CPF modals, `AsaasClient`
- **[Asaas Webhooks](./asaas-webhooks.md)** - Payment events, local tunneling
- **[Credits System](./credits.md)** - `useCredits()`, `track-usage.ts`, features (`FeatureKey`), deduction (`deduct.ts`)

### Utils & Tools
- **[Hooks](./hooks.md)** - 50+ custom hooks (e.g., `useShorts`, `useCharacters`, `useAdminSettings`)
- **[Storage](./storage.md)** - Vercel Blob/Replit, `useStorage()`, `UploadResult`
- **[Logging](./logging.md)** - `createLogger`, API log levels

## Technology Stack

### Core
- **Next.js 15.3.5** (App Router)
- **React 19** + **TypeScript** (331 TS/TSX files)
- **Tailwind CSS v4** + **Radix UI** + **Lucide Icons**

### Data & Auth
- **Prisma ORM** + **PostgreSQL** (29 models)
- **Clerk** (users, webhooks, plans)

### AI/ML
- **Vercel AI SDK** (chat/studio)
- **FAL.ai** (Flux images, Kling videos)
- **OpenRouter** (LLMs, adapters)

### Billing/State
- **Asaas** (BR payments)
- **React Query** (usage, shorts, credits hooks)
- **Zod** + **React Hook Form**
- **tRPC-like apiClient**

**Stats**: 353 files, 812 symbols, 157 controllers, 179 components.

## Key Features

### 🎬 Shorts Creation Pipeline
Full lifecycle for AI shorts:
```tsx
// src/hooks/use-shorts.ts
const { mutate: createShort } = useCreateShort();
const { mutate: generateScript } = useGenerateScript(shortId);
const { mutate: addScene } = useAddScene(shortId, sceneData);
const { mutate: generateMedia } = useGenerateMedia(sceneId);
```
- Script gen: `GenerateScenesResponse` via Roteirista agents
- Scenes: `ShortScene`, reorder/regenerate
- Cross-refs: [pipeline.ts](src/lib/shorts/pipeline.ts), [ScriptWizard.tsx](src/components/roteirista/ScriptWizard.tsx)

### 🎭 Characters
- Traits (`CharacterTraits`), prompts (`analyzeCharacterImage`)
- Limits: `canCreateCharacter`, `canAddCharacterToShort`
- Hooks: `useCharacters`, `useShortCharacters`
- Ex: `combineCharactersForScene` for multi-char scenes

### 💰 Credits & Billing
- Track usage: `useUsage()`, `OperationType` (e.g., script-gen, image)
- Admin: `useAdminPlans`, `AdminSettingsPayload`
- Deduction: Auto via `deduct.ts`
- Plans: `PublicPlan`, Asaas sync

### 🛠️ Admin & Analytics
- Dashboard: `useDashboard()` → `DashboardStats`
- Plans/Models: Edit tiers, LLM configs (`LLMFeatureKey`)
- Components: `AdminChrome`, `AdminTopbar`

### 🤖 AI Studio/Chat
- `AIStudioPage`, agents (`useAgents`)
- Providers: Registry, `OpenRouterAdapter`, `FalAdapter`
- Ex: `useAiImage()` for `GenerateImageParams`

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL (e.g., Supabase/Railway)
- Clerk account
- Asaas (sandbox for dev)

### Installation
```bash
git clone <repo>
cd pedro-ai
npm install
cp .env.example .env.local  # Edit: DB, Clerk, Asaas, FAL keys
npm run db:push
npm run dev
```
Open [localhost:3000](http://localhost:3000) → Auth → Create shorts!

### Scripts
```bash
npm run dev          # Dev server
npm run typecheck    # TS check
npm run lint         # ESLint
npm run db:studio    # Prisma UI
npm run build        # Prod build
```

## Project Structure
```
pedro-ai/
├── prisma/              # Schema (Short, Character, Scene, CreditUsage...)
├── src/
│   ├── app/
│   │   ├── (protected)/   # ai-studio/, shorts/
│   │   ├── admin/         # Layout, settings, onboarding
│   │   └── api/           # /shorts, /credits, /asaas/webhooks
│   ├── components/
│   │   ├── shorts/        # CreateShortForm, AddSceneDialog
│   │   ├── characters/    # CharacterSelector
│   │   ├── roteirista/    # ScriptWizard
│   │   ├── admin/         # AdminChrome, PlanEditDrawer
│   │   └── ui/            # Autocomplete, Toasts
│   ├── hooks/             # useShorts (20+ funcs), useCredits...
│   ├── lib/
│   │   ├── shorts/        # pipeline.ts (addScene, approveScript)
│   │   ├── credits/       # deduct.ts, validate-credits.ts
│   │   ├── ai/            # providers/ (fal-adapter.ts)
│   │   ├── asaas/         # client.ts
│   │   └── storage/       # vercel-blob.ts
│   └── contexts/          # page-metadata.tsx
├── docs/                 # This documentation
└── package.json
```

## Common Tasks

### Create a Short (Example)
```tsx
// In a component
const shortsQuery = useShorts();
const create = useCreateShort();

const handleCreate = async () => {
  const newShort = await create.mutateAsync({
    title: "Meu Short",
    prompt: "Um esquete engraçado com dois personagens."
  });
  await useGenerateScript(newShort.id).mutateAsync();
};
```

### Generate Scene Media
```tsx
const generateMedia = useGenerateMedia(sceneId);
await generateMedia.mutateAsync({ type: 'video', model: 'kling' });
```

### Admin: Update Plans
```tsx
const { data: plans } = useAdminPlans();
const settings = useAdminSettings();  // AdminSettingsPayload
```

### DB Changes
```bash
# Edit prisma/schema.prisma
npx prisma db push  # Dev
npx prisma migrate dev --name add_scenes  # Prod
npx prisma generate
```

## Troubleshooting
- **Credits not deducting**: Check `CLERK_WEBHOOK_SECRET`, `useCredits`
- **AI Gen fails**: Verify FAL/OpenRouter keys, model configs (`src/lib/ai/models-config.ts`)
- **Asaas errors**: Use sandbox, test webhooks with ngrok
- **Types errors**: `npm run typecheck`, regen Prisma

## Deployment
- **Vercel** (recommended): Auto-deploys, Blob storage
- Env vars: `DATABASE_URL`, `CLERK_*`, `ASAAS_API_KEY`, `FAL_KEY`, `OPENROUTER_API_KEY`
- Webhooks: Clerk/Asaas → Vercel endpoints

## Contributing
- Follow [Guidelines](./development-guidelines.md): Hooks-first, Zod validation, tests
- PRs: Feature branches, update docs/hooks
- Tests: `npm test` (add for new hooks/pipelines)

## Next Steps
1. Explore `/admin` after auth
2. Create a short via `/shorts`
3. Read [Shorts Pipeline](./shorts-pipeline.md) for deep dive
4. Customize AI providers in `lib/ai/`

Happy building AI shorts! 🚀
