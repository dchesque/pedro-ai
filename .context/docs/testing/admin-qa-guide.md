# Admin QA Guide

This document is the definitive guide for end-to-end (E2E) validation of the admin interface (`/admin/*`). It ensures quality through prerequisites, test data setup, automated Playwright coverage, manual checklists, and guidelines for extensions. Use this before every release to catch regressions.

## Scope Overview

The admin interface manages users, credits, usage, storage, settings, plans, models, and more. Core routes leverage `AdminLayout` ([src/app/admin/layout.tsx](src/app/admin/layout.tsx)), `AdminChrome` ([src/components/admin/admin-chrome.tsx](src/components/admin/admin-chrome.tsx)), and `AdminTopbar` ([src/components/admin/admin-topbar.tsx](src/components/admin/admin-topbar.tsx)).

| Feature | Route | Primary Components/Pages | Key Hooks/APIs | Related Exports |
|---------|-------|---------------------------|----------------|-----------------|
| **Dashboard** | `/admin` | `AdminDashboard` (implied in layout) | `useDashboard` → `/api/admin/dashboard` (KPIs: ARR/MRR/Churn) | `DashboardStats` ([src/hooks/use-dashboard.ts](src/hooks/use-dashboard.ts)) |
| **Users** | `/admin/users` | User table, search, invite modal, Clerk sync | `useUsage` ([src/hooks/use-usage.ts](src/hooks/use-usage.ts)), `getUserFromClerkId` ([src/lib/auth-utils.ts](src/lib/auth-utils.ts)) | `UsageData`, `UsageParams` |
| **Credits** | `/admin/credits` | Metrics cards, user search, balance adjust | `useCredits` ([src/hooks/use-credits.ts](src/hooks/use-credits.ts)), `addUserCredits` ([src/lib/credits/validate-credits.ts](src/lib/credits/validate-credits.ts)) | `CreditData`, `CreditsResponse`, `OperationType` |
| **Usage** | `/admin/usage` | Filters/pagination/export (CSV/JSON) | `useUsageHistory` ([src/hooks/use-usage-history.ts](src/hooks/use-usage-history.ts)) → `/api/admin/usage` | `UsageRecord`, `UsageHistoryParams` |
| **Storage** | `/admin/storage` | Blob list, user/provider filters, delete | `useStorage` ([src/hooks/use-storage.ts](src/hooks/use-storage.ts)) → Vercel Blob/S3 | `StorageItem`, `VercelBlobStorage` ([src/lib/storage/vercel-blob.ts](src/lib/storage/vercel-blob.ts)) |
| **Settings** | `/admin/settings` | Feature pricing, plan mappings | `useAdminSettings` ([src/hooks/use-admin-settings.ts](src/hooks/use-admin-settings.ts)) ↔ `/api/admin/settings` | `AdminSettings`, `AdminSettingsPayload` ([src/lib/credits/settings.ts](src/lib/credits/settings.ts)) |
| **Plans** | `/admin/plans` | Plan CRUD, Clerk sync, feature tiers | `useAdminPlans` → `/api/admin/plans` | `Plan`, `ClerkPlan`, `ClerkPlansResponse`, `BillingPlan` ([src/components/admin/plans/types.ts](src/components/admin/plans/types.ts)) |
| **Models** | `/admin/models` | LLM configs, providers | `useAdminModels` → `/api/admin/models` | `FeatureModelConfig`, `ModelsResponse`, `AIModel` ([src/lib/ai/models.ts](src/lib/ai/models.ts)) |
| **Agents** | `/admin/agents/[id]` | Agent edit/view | `AdminAgentEditPage` ([src/app/admin/agents/[id]/page.tsx](src/app/admin/agents/[id]/page.tsx)) | `Agent`, `AgentExecutionResult` |

**Out of scope**: Backend webhooks (e.g., Clerk), load testing, non-admin routes. Access guarded by `requireAdmin` ([src/lib/admin.ts](src/lib/admin.ts)) and `isAdmin` ([src/lib/admin-utils.ts](src/lib/admin-utils.ts)). Dev toggles via `AdminDevModeProvider` ([src/contexts/admin-dev-mode.tsx](src/contexts/admin-dev-mode.tsx)).

## Environment & Dependencies

### Setup Commands
```bash
# Local dev (3000 port)
npm run dev

# E2E dev (3100 port, auth bypass)
npm run dev:e2e

# Build & start for prod-like tests
npm run build && npm run start:e2e
```

### Required `.env.local`
```env
DATABASE_URL="file:./dev.db"  # SQLite; switch to `postgresql://...` for team QA
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
ADMIN_EMAILS="admin@example.com"  # Comma-separated
# OR ADMIN_USER_IDS="user_123,e2e-admin"
E2E_AUTH_BYPASS=1  # Enables test login; disable for auth tests
NEXT_PUBLIC_ADMIN_USER_IDS="e2e-admin"  # Fallback test admin
OPENROUTER_API_KEY=...  # For model previews
FAL_KEY=...  # Storage/image mocks
```

### Database Preparation
```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db push  # Schema sync
npm run db:seed:admin  # Custom seed (below)
```

### Seed Data (`prisma/seed-admin.ts`)
Realistic data for 10+ users, usage records, blobs, settings:
```typescript
import { PrismaClient } from '@prisma/client';
import { FeatureKey, PlanOption } from '@/lib/credits/settings';  // Align with codebase

const prisma = new PrismaClient();

async function main() {
  // Users (mix active/inactive, credits)
  await prisma.user.createMany({
    data: [
      { id: 'e2e-admin', email: 'admin@example.com', credits: 10000, active: true },
      { id: 'user-1', email: 'user1@example.com', credits: 50, active: true },
      { id: 'user-2', email: 'user2@example.com', credits: 0, active: false },
      // Add 7 more for pagination/search
    ],
  });

  // Usage records (via OperationType enum)
  await prisma.usageHistory.createMany({
    data: [
      { userId: 'user-1', operation: 'llm_short_script', cost: 5, tokens: 1000 },
      { userId: 'user-1', operation: 'image_gen', cost: 2, tokens: 500 },
      // 20+ for filters/pagination
    ],
  });

  // Storage blobs
  await prisma.storageItem.createMany({
    data: [{ userId: 'user-1', path: 'blobs/test.jpg', size: 1024, provider: 'vercel' }],
  });

  // Default settings
  await prisma.adminSettings.upsert({
    where: { id: 'default' },
    update: { payload: { features: { 'llm_short_script': 10 } } as AdminSettingsPayload },
    create: { id: 'default', payload: { features: { 'llm_short_script': 10 } } },
  });

  // Plans (Clerk-aligned)
  // Add via UI or seed ClerkPlanNormalized data
}

main().finally(() => prisma.$disconnect());
```
Run: `npx prisma db seed`

## Automated Coverage (Playwright)

`npx playwright test` (Chromium, retries=2, traces=retry). Coverage: 90%+ of admin flows.

| Area | Scenarios | Spec File | Mocked APIs | Key Assertions |
|------|-----------|-----------|-------------|----------------|
| **Dashboard** | Render cards/charts, empty state, refresh | `tests/e2e/admin-dashboard.spec.ts` | `page.route('/api/admin/dashboard', route => route.fulfill({ json: { mrr: 5000 } }))` | `expect(page.getByText('MRR: $5,000')).toBeVisible()` |
| **Users** | List/search/invite/sync, credit adjust (`prompt()`), tabs | `tests/e2e/admin-users.spec.ts` | `/api/admin/users`, Clerk stubs | List length, `getByRole('status').filter({ hasText: /synced/i })` |
| **Credits** | Metrics, search, add/subtract modal | `tests/e2e/admin-credits.spec.ts` | `/api/admin/credits` | Table row update post-modal, toast |
| **Usage** | Filters (date/type/search), paginate, CSV/JSON export | `tests/e2e/admin-usage.spec.ts` | `/api/admin/usage` | Filtered count, download blob contains `userId,operation,cost` |
| **Storage** | List/filter/delete (confirm dialog), provider sync | `tests/e2e/admin-storage.spec.ts` | `/api/admin/storage` | Post-delete: row gone, `expect(page.getByText('test.jpg')).not.toBeVisible()` |
| **Settings** | Load/edit/save feature costs (e.g., `llm_short_script: 15`) | `tests/e2e/admin-settings.spec.ts` | GET/PUT `/api/admin/settings` | Form values persist, DB query match |
| **Plans** | List/sync/edit tiers | `tests/e2e/admin-plans.spec.ts` (TBD) | `/api/admin/plans` | ClerkPlan updates |
| **Models** | List/config/provider toggle | `tests/e2e/admin-models.spec.ts` (TBD) | `/api/admin/models` | AIModel list |

**Debug**: `npx playwright test --headed --debug`; `npx playwright show-trace tests/e2e/admin-*.spec.ts`.

**Fixtures**: Shared mocks in `tests/e2e/fixtures/admin.json`.

## Manual QA Checklist

Run after automation; verify with DB queries (e.g., `npx prisma studio`).

1. **Dashboard**: Metrics match aggregates (`SELECT SUM(credits) FROM "User"`); charts fallback on empty.
2. **Users**: Clerk sync modal → new user appears; invite → email toast; adjust credits → balance updates.
3. **Credits**: Search user → modal add 100 → toast + table refresh.
4. **Usage**: Filter `operation=image_gen` + date range → paginate → CSV download (verify: comma-delimited, quoted fields).
5. **Storage**: Filter user/provider → delete → confirm provider deletion (Vercel dashboard) + DB soft-delete.
6. **Settings**: Edit `{ llm_short_script: 20 }` → save → API/DB verify.
7. **Plans/Models**: Sync → edit feature (e.g., `ClerkPlanFeature`) → persistence.
8. **Auth/Edges**: Non-admin → 403/redirect; zero data; invalid filters; offline (cache fallbacks); max page size.
9. **Responsive**: Mobile/tablet views; dark mode toggles.
10. **Performance**: <2s load; no console errors (`F12`).

## Running & Reporting
```bash
npm run test:e2e:ci      # Headless, full suite
npm run test:e2e:ui      # UI mode
npx playwright test --project=chromium admin-*.spec.ts  # Filter
npx playwright show-report  # HTML
npx playwright merge-reports  # CI aggregate
```
Failures: Inspect `playwright-report/index.html`, traces.

## Extending Automation

1. **New Feature** (`/admin/new-page`):
   ```typescript
   // tests/e2e/admin-new.spec.ts
   test('renders and saves', async ({ page }) => {
     await page.goto('/admin/new-page');
     await expect(page).toHaveTitle(/Admin/);
     // Mock API
     await page.route('/api/admin/new', route => route.fulfill({ json: { data: [] } }));
     // Interact: fill form, click save
     await page.getByLabel('Feature Cost').fill('15');
     await page.getByRole('button', { name: /Save/i }).click();
     await expect(page.getByRole('status')).toContainText('Saved');
   });
   ```

2. **Common Patterns**:
   - **Toasts**: `await expect(page.getByRole('status', { name: /success/i })).toBeVisible()`
   - **Modals/Dialogs**: `page.on('dialog', d => d.accept('100'))`
   - **API Stubs**: Use `tests/e2e/fixtures/*.json`
   - **Pre-seed**: `npm run db:seed:admin` in `beforeAll`

3. **Add Seeds**: Extend `prisma/seed-admin.ts` → `npm run db:seed:admin`.

## CI & Monitoring

- **GitHub Actions**: `test:e2e` job → upload report/trace artifacts.
- **Sentry**: Captures admin errors; filter by `url.pathname.startsWith('/admin')`.
- **Next**: Video playback tests, plans/models specs, API contract tests.

**Cross-references**:
- [Credits Features](src/lib/credits/feature-config.ts)
- [Admin Plans Types](src/components/admin/plans/types.ts)
- [AI Models](src/lib/ai/models-config.ts)
- [Full Public API](src/hooks/use-admin-*.ts)

Update this guide for new routes/components. Last updated: [Date].
