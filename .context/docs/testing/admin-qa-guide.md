# Admin QA Guide

This document provides a comprehensive guide for validating the admin interface end-to-end (E2E). It covers prerequisites, test data expectations, automated Playwright coverage, manual checklists, and extension guidelines to ensure consistent regression testing before releases.

## Scope Overview

The admin surface (`/admin/*`) provides tools for monitoring, managing users, credits, usage, storage, and settings. Key features and their primary components:

| Feature | Route | Primary Components | Key Hooks/APIs |
|---------|-------|--------------------|---------------|
| **Dashboard** | `/admin` | `AdminLayout` ([src/app/admin/layout.tsx](src/app/admin/layout.tsx)), `AdminChrome` ([src/components/admin/admin-chrome.tsx](src/components/admin/admin-chrome.tsx)), `AdminTopbar` ([src/components/admin/admin-topbar.tsx](src/components/admin/admin-topbar.tsx)) | `useDashboard` → `/api/admin/dashboard` for KPIs (ARR/MRR/Churn charts) |
| **Users** | `/admin/users` | User list, search, invite modal, Clerk sync | `useUsage` ([src/hooks/use-usage.ts](src/hooks/use-usage.ts)), Clerk integration via `getUserFromClerkId` ([src/lib/auth-utils.ts](src/lib/auth-utils.ts)) |
| **Credits** | `/admin/credits` | Aggregated metrics, balance adjust modal | `useCredits` ([src/hooks/use-credits.ts](src/hooks/use-credits.ts)), `addUserCredits` ([src/lib/credits/validate-credits.ts](src/lib/credits/validate-credits.ts)) |
| **Usage** | `/admin/usage` | Filters, pagination, CSV export, JSON details | `useUsageHistory` ([src/hooks/use-usage-history.ts](src/hooks/use-usage-history.ts)) → `/api/admin/usage` |
| **Storage** | `/admin/storage` | Blob list, filters, delete workflow | `useStorage` ([src/hooks/use-storage.ts](src/hooks/use-storage.ts)) → Supports Vercel Blob (`VercelBlobStorage` [src/lib/storage/vercel-blob.ts](src/lib/storage/vercel-blob.ts)) |
| **Settings** | `/admin/settings` | Feature pricing, plan mappings | `useAdminSettings` ([src/hooks/use-admin-settings.ts](src/hooks/use-admin-settings.ts)) → `AdminSettingsPayload` ([src/lib/credits/settings.ts](src/lib/credits/settings.ts)), `/api/admin/settings` |

**Out of scope**: Clerk webhooks (backend tests), auth guards (separate smoke tests), performance/load testing.

Related contexts: `AdminDevModeProvider` ([src/contexts/admin-dev-mode.tsx](src/contexts/admin-dev-mode.tsx)) for dev toggles; `requireAdmin` ([src/lib/admin.ts](src/lib/admin.ts)) for access control.

## Environment & Dependencies

### Setup
```bash
# Dev mode
npm run dev

# E2E mode (pins to 127.0.0.1:3100, enables auth bypass)
npm run dev:e2e
```

### Required `.env`
```
DATABASE_URL="file:./dev.db"  # SQLite local; use Postgres for shared QA
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...
ADMIN_EMAILS="admin@example.com"  # OR ADMIN_USER_IDS="user_123"
E2E_AUTH_BYPASS=1  # For tests only
ADMIN_USER_IDS="e2e-admin"  # Test admin ID
```

### Database Prep
```bash
npx prisma migrate deploy  # Or npm run db:migrate
npx prisma generate
```

### Seed Data
Use Prisma seeds for realism (create `prisma/seed-admin.ts` if needed):
```typescript
// Example: prisma/seed-admin.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  // Users: mixed active/inactive, credits
  await prisma.user.createMany({
    data: [
      { id: 'e2e-admin', email: 'admin@example.com', credits: 1000, active: true },
      { id: 'user-1', email: 'user1@example.com', credits: 50, active: false },
      // Invites, usage records, blobs...
    ],
  });
  // Usage: trackUsage calls (OperationType: 'image_gen', etc.)
  // Storage: blobs via useStorage
  // Settings: default AdminSettingsPayload
}

seed();
```
Run: `npx prisma db seed --preview-feature`

## Automated Coverage (Playwright)

Run with `npx playwright test` (Chromium default, traces on retry).

| Area | Scenarios Covered | Spec File | Mocked APIs | Assertions |
|------|-------------------|-----------|-------------|------------|
| Dashboard | Cards/charts render, empty states | `tests/e2e/admin-dashboard.spec.ts` | `/api/admin/dashboard` | Metrics match stubs, charts fallback |
| Users | Search, credit modal (`window.prompt`), invite toast, tabs, Clerk sync | `tests/e2e/admin-users.spec.ts` | `/api/admin/users` | List updates, toasts via `getByRole('status')` |
| Credits | Cards, search, modal adjust | `tests/e2e/admin-credits.spec.ts` | `/api/admin/credits` | Table refresh, toast feedback |
| Usage | Filters (type/date/search), pagination, JSON dialog | `tests/e2e/admin-usage.spec.ts` | `/api/admin/usage` | Filter results, dialog content (CSV manual) |
| Storage | Search, per-user view, delete confirm | `tests/e2e/admin-storage.spec.ts` | `/api/admin/storage` | Blob gone post-delete, provider sync |
| Settings | Edit feature costs/plans, save | `tests/e2e/admin-settings.spec.ts` | GET/PUT `/api/admin/settings` | Form submit, DB/API persistence |

**Config**: `playwright.config.ts` – headed debug: `npx playwright test --debug`; traces: `npx playwright show-trace`.

**Example Mock** (in specs):
```typescript
await page.route('/api/admin/dashboard', async route => {
  await route.fulfill({ json: { mrr: 5000, churn: 2.1 /* ... */ } });
});
```

## Manual QA Checklist

Validate post-automated run or new features:

1. **Dashboard Metrics**: Align with DB (e.g., `SELECT SUM(credits) FROM User`); empty charts show fallbacks.
2. **Clerk Sync**: Open modal → sync users → verify new entries in `/admin/users`.
3. **User Invite**: Resend/revoke → check Clerk dashboard/emails.
4. **Credits Adjust**: Modal → add/subtract → toast + table update.
5. **Usage Export**: Filter → CSV download → verify delimiter (`,`), quoting, columns (userId, operation, cost).
6. **Storage Delete**: Filter → delete → confirm provider (Vercel/S3) removal + DB soft-delete.
7. **Settings**: Edit `FeatureKey` costs (e.g., `llm_short_script: 10`) → save → query DB `AdminSettings`.
8. **Access Control**: Non-admin login → `/admin` redirects to `/` (disable `E2E_AUTH_BYPASS`).
9. **Edge Cases**: Zero credits, max pagination, invalid filters, offline mode.

## Running Tests

```bash
npm run test:e2e              # Full suite
npm run test:e2e:ui           # UI mode
npx playwright test admin-*.spec.ts --project=chromium  # Specific
npx playwright show-report    # HTML report
```

Failures → `playwright-report/`.

## Extending Automation

- **New Page**: Stub APIs (`page.route`), assert `<h1>`, primary CTAs, toasts (`page.getByRole('status').filter({ hasText: /saved/i })`).
- **Fixtures**: `tests/e2e/fixtures/admin.json` for mocks.
- **Toasts**: `await expect(page.getByRole('status')).toHaveText('Success')`.
- **Modals/Prompts**: `page.on('dialog', dialog => dialog.accept('value'))`.
- **Seeds**: Integrate `npm run db:seed:admin` pre-test.

## Next Steps & CI Integration

1. **Seeds**: `prisma/seed-admin.ts` → `npm run db:seed:admin`.
2. **CI**: GitHub Actions → `npm run test:e2e` → artifacts (report/trace).
3. **Expand**: Plans (`useAdminPlans` [src/hooks/use-admin-plans.ts](src/hooks/use-admin-plans.ts)), models (`useAdminModels`).
4. **Monitoring**: Integrate Sentry for admin errors.

Cross-references: [Admin Plans](src/components/admin/plans/types.ts), [Credits Features](src/lib/credits/feature-config.ts). Update this guide with new routes/specs.
