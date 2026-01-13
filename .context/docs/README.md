# Pedro AI

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-green?logo=prisma)](https://prisma.io)

**Pedro AI** is a production-ready Next.js application for AI-powered short video creation. Generate scripts, manage characters, build scenes, synthesize images/videos, track credits, and administer via a full-featured dashboard. Built for Brazilian creators with Asaas billing integration.

**Stats**: 400 files, 896 symbols across TS/TSX/JS. Core layers: Components (198 symbols), Utils/Lib (183), Controllers (178), Hooks (50+), Models (31).

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <repo> pedro-ai
   cd pedro-ai
   npm install
   cp .env.example .env.local
   ```

2. **Configure Env** (edit `.env.local`)
   ```
   DATABASE_URL="postgresql://..."
   CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   ASAAS_API_KEY=...  # Sandbox for dev
   FAL_KEY=...
   OPENROUTER_API_KEY=...
   ```

3. **Database Setup**
   ```bash
   npm run db:push  # Push schema
   npm run db:seed  # Optional: styles, tones
   npm run db:studio  # Prisma UI
   ```

4. **Run Dev Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) → Sign up → Create AI shorts!

## 🏗️ Architecture Overview

Monolithic Next.js App Router app with clear layers:

```
Components (198 symbols, 166 TSX) → Hooks (50+, e.g. useShorts) → Lib/Utils (183 symbols) → API Routes (178 controllers)
                                                                 ↓
                                                           Prisma Models (31) + PostgreSQL
```

- **Dependencies**: Controllers depend on Models; Utils on Controllers/Models; Components on Models.
- **Public API Highlights** (selected exports):
  | Symbol | File | Purpose |
  |--------|------|---------|
  | `useShorts` | `src/hooks/use-shorts.ts` | Core short CRUD + pipeline (create, generateScript, addScene) |
  | `apiClient` | `src/lib/api-client.ts` | tRPC-like typed client |
  | `AsaasClient` | `src/lib/asaas/client.ts` | BR payments |
  | `pipeline.ts` | `src/lib/shorts/pipeline.ts` | `addScene`, `approveScript` |
  | `AdminChrome` | `src/components/admin/admin-chrome.tsx` | Admin layout |
  | `useCredits` | `src/hooks/use-credits.ts` | Balance + deduction |

Cross-refs: [Hooks](./hooks.md), [Shorts Pipeline](./shorts-pipeline.md), [API](./api.md).

## ✨ Key Features

### 🎬 Shorts Pipeline (Core)
End-to-end script-to-video:
```tsx
// Example: src/app/shorts/page.tsx
const { data: shorts } = useShorts();
const createShort = useCreateShort();
const generateScript = useGenerateScript(shortId);

const handleNewShort = async () => {
  const short = await createShort.mutateAsync({ title: 'Meu Short', prompt: '...' });
  await generateScript.mutateAsync();  // Triggers Roteirista agents
  // Then: useAddScene, useGenerateMedia (Kling/Flux)
};
```
- **Flow**: `CreateShortInput` → Script (AI agents) → Scenes (`ShortScene`) → Media gen → Export.
- **Hooks**: `useShorts`, `useShort`, `useGenerateScript`, `useAddScene`, `useGenerateMedia`.
- Details: [src/lib/shorts/pipeline.ts](src/lib/shorts/pipeline.ts), [ScriptWizard.tsx](src/components/roteirista/ScriptWizard.tsx).

### 🎭 Characters & Scenes
- Traits: `CharacterTraits`, image analysis (`analyzeCharacterImage`).
- Limits: `canCreateCharacter()`, `canAddCharacterToShort()`.
- Multi-char scenes: `combineCharactersForScene`.
- Hooks: `useCharacters`, `useShortCharacters`.

### 🤖 AI Generation
- **Providers**: `OpenRouterAdapter`, `FalAdapter` (Flux images, Kling videos), registry (`src/lib/ai/providers/registry.ts`).
- **Hooks**:
  ```tsx
  const { mutateAsync: generateImage } = useAiImage();
  await generateImage({ prompt: '...', model: 'flux' });  // GenerateImageResponse
  ```
- Models: `useAvailableModels()` → `AIModel[]`.
- Credits: Auto-deduct via `deduct.ts` (e.g., Image:5, Video:10).

### 💰 Billing & Credits
- **Usage**: `useUsage()`, `useCredits()` → `CreditData`.
- **Plans**: `usePublicPlans()` → `PublicPlan[]`, admin edits (`useAdminPlans`).
- **Asaas**: Subscriptions, webhooks (`/api/asaas/webhooks`), CPF modals.
- **Track**: `OperationType` (script=1, image=5), `track-usage.ts`.

### 🛠️ Admin Dashboard
- Layout: `AdminLayout`, `AdminChrome`, `AdminTopbar`.
- Pages: Plans (`AdminSettingsPage`), Models, Onboarding.
- Hooks: `useAdminSettings()` → `AdminSettingsPayload`, `useDashboard()` → `DashboardStats`.

### 💬 AI Studio & Chat
- `AIStudioPage`, `useAgents()` → `Agent[]` (scriptwriter, prompt-engineer).
- Chat: `ChatMessage`, agents with `AgentQuestion`/`AgentOutputField`.

## 📁 Project Structure

```
pedro-ai/
├── prisma/                 # schema.prisma (Short, Character, Scene, CreditUsage, 29 models total)
├── src/
│   ├── app/                # Pages: (protected)/shorts, admin/, api/shorts, api/credits
│   ├── components/         # ui/ (Autocomplete, Toasts), shorts/, characters/, roteirista/, admin/
│   ├── hooks/              # useShorts (10+ funcs), useCredits, useStorage, useAgents...
│   ├── lib/                # shorts/pipeline.ts, credits/deduct.ts, ai/providers/, asaas/client.ts, storage/
│   └── contexts/           # page-metadata.tsx (Breadcrumbs)
├── docs/                   # architecture.md, hooks.md, shorts-pipeline.md...
├── public/                 # Assets
└── package.json
```

Key deps: `pricing-card.tsx` (5 imports), `ScriptWizard.tsx` (5), `pipeline.ts` (multi).

## ⚙️ Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (3000) |
| `npm run build` | Prod build |
| `npm run start` | Prod server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TS strict |
| `npm run db:push` | Prisma push (dev) |
| `npm run db:migrate` | Prod migrations |
| `npm run db:seed` | Seed styles/tones |
| `npm test` | Unit tests (expand) |

## 🚀 Deployment

- **Vercel** (recommended): Blob storage auto-config.
- Env vars: `DATABASE_URL`, `CLERK_*` (6 keys), `ASAAS_*`, `FAL_KEY`, `OPENROUTER_*`.
- Webhooks: Clerk (`/api/clerk/webhooks`), Asaas (`/api/asaas/webhooks`) → Use ngrok for local testing.

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| No credits deduct | Verify `CLERK_WEBHOOK_SECRET`, `useCredits` mutation |
| AI fails | Check keys, `src/lib/ai/models-config.ts`, quotas |
| Asaas errors | Sandbox mode, ngrok for webhooks |
| Auth issues | `validateUserAuthentication`, Clerk dashboard |
| DB errors | `npx prisma generate`, `db:push` |
| Types mismatch | `npm run typecheck` |

## 🤝 Contributing

1. Fork → Branch (`feat/add-hook`).
2. Follow [Guidelines](./development-guidelines.md): Hooks-first, Zod, logger (`createLogger`).
3. Add tests, update docs.
4. PR: Lint clean, types pass.

## 📚 Full Docs

- [Architecture](./architecture.md)
- [Hooks](./hooks.md) (50+)
- [Shorts Pipeline](./shorts-pipeline.md)
- [Credits](./credits.md)
- [AI Providers](./ai-features.md)
- [Asaas](./asaas.md)
- [Deployment](./deployment.md)

Happy short-making! 🎥🚀
