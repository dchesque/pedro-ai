# Admin Panel

Comprehensive guide to the administration interface and backend APIs for managing users, credits, plans, storage, and system settings in the Pedro AI application.

## Access Control

### URL
- **Base Path**: `/admin`
- Protected by:
  - **Server-Side Rendering (SSR) Guard**: `src/app/admin/layout.tsx` (`AdminLayout`)
  - **Middleware**: Enforces admin privileges before rendering.

### Admin Authorization
Admins are defined via environment variables in `.env`:
```
ADMIN_EMAILS=admin@domain.com,ops@domain.com
# OR
ADMIN_USER_IDS=usr_123,usr_456  # Clerk user IDs
```
- Validation uses `isAdmin()` from `src/lib/admin-utils.ts`.
- Server-side enforcement via `requireAdmin()` from `src/lib/admin.ts`.
- Client-side components like `AdminChrome` (`src/components/admin/admin-chrome.tsx`) and `AdminTopbar` (`src/components/admin/admin-topbar.tsx`) assume authenticated admin access.

**Example Check in Code**:
```tsx
// src/lib/admin-utils.ts
export function isAdmin(user: User): boolean {
  return ADMIN_EMAILS.includes(user.emailAddresses[0].emailAddress) ||
         ADMIN_USER_IDS.includes(user.id);
}
```

## Prerequisites

### Clerk Integration
- `CLERK_SECRET_KEY`: Required for Clerk API calls (user sync, invites).
- Enable **Invitations** and email delivery in Clerk dashboard.
- Allow redirects to `${NEXT_PUBLIC_APP_URL}/sign-up`.

### Payment Provider (Asaas)
- `ASAAS_API_KEY`: Enables plan checkout links.
- Used in `AsaasClient` (`src/lib/asaas/client.ts`).

### Other
- Database with Prisma (`PrismaClient` stub in browser, full server-side).
- Storage providers configured (Vercel Blob, Replit, etc., via `src/lib/storage/`).

## UI Structure

### Layout and Components
- **Root Layout**: `src/app/admin/layout.tsx` (`AdminLayout`) – SSR guard + chrome wrapper.
- **Chrome**: `AdminChrome` (`src/components/admin/admin-chrome.tsx`) – Main sidebar/nav.
- **Topbar**: `AdminTopbar` (`src/components/admin/admin-topbar.tsx`) – Search, notifications.
- **Dev Mode**: `AdminDevModeProvider` (`src/contexts/admin-dev-mode.tsx`) – Toggle for debug features.
- **Settings Hook**: `useAdminSettings()` (`src/hooks/use-admin-settings.ts`) – Loads `AdminSettings`.

### Key Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | (Dashboard, inferred via chrome) | Overview: Users, stats, quick actions. |
| `/admin/onboarding` | `AdminOnboardingPage` (`src/app/admin/onboarding/page.tsx`) | Initial setup wizard. |
| `/admin/settings` | `AdminSettingsPage` (`src/app/admin/settings/page.tsx`) | Tabs: Feature costs, subscription plans. |
| `/admin/plans/*` | (Dynamic via `plan-edit-drawer.tsx`) | Plan CRUD (uses `useAdminPlans()`). |

- **Navigation**: Sidebar tabs for **Users**, **Settings**, **Storage**, **Invites**, **Sync**.
- **Feedback**: Toasts via `useToast()` for actions (e.g., credit adjustments).

**Cross-References**:
- Plans UI: `src/components/admin/plans/` (e.g., `plan-edit-drawer.tsx`, types in `types.ts` with `BillingPlan`).
- Styles/Assets: Integrates `useStyles()` for admin previews.

## Main Features

### Users Management
- **List & View**: Users, credit balances (`CreditBalance`), usage history (`useUsageHistory()`).
- **Credit Adjustment**: `PUT /api/admin/users/:id/credits`.
- **Delete User**: Removes user, credits, history.
- **Sync**: `POST /api/admin/users/sync` – Fetches Clerk users, initializes local DB records.

### Settings (`/admin/settings`)
Managed via `AdminSettings` type and `AdminSettingsPayload` (`src/lib/credits/settings.ts`).

#### Feature Costs
- Edit costs for features (e.g., `ai_text_chat`, `ai_image_generation`).
- Uses `FeatureKey` from `src/lib/credits/feature-config.ts`.
- API: `PUT /api/admin/settings`.

#### Subscription Plans
- **Manual CRUD**: Create/edit/delete `BillingPlan` (`src/components/admin/plans/types.ts`).
- Fields: Name, monthly credits, pricing (monthly/annual `BillingPeriod`), Asaas checkout link, active status.
- Integrates Clerk plans via `useAdminPlans()` (`ClerkPlan`, `ClerkPlansResponse`).
- API: `/api/admin/plans/*`.

**Example Plan Type**:
```ts
// src/components/admin/plans/types.ts
export interface BillingPlan {
  id: string;
  name: string;
  monthlyCredits: number;
  monthlyPrice: number;
  annualPrice?: number;
  asaasCheckoutUrl?: string;
  isActive: boolean;
}
```

### Storage Management
- **Browse/Search**: Files by name, type, URL, owner (`useStorage()` hook).
- **Actions**: View, delete (`DELETE /api/admin/storage/:id` – DB + provider cleanup).
- Providers: `StorageProvider` (`src/lib/storage/types.ts`), e.g., `VercelBlobStorage`.

### Invites
- **Send**: `POST /api/admin/users/invite` – `{ email: string, name?: string }`.
- **List**: `GET /api/admin/users/invitations`.
- **Resend/Revoke**: `POST /api/admin/users/invitations/:id/resend|revoke`.

## Admin APIs

All endpoints under `/api/admin/*` require `requireAdmin()` middleware.

| Method | Endpoint | Description | Body/Params |
|--------|----------|-------------|-------------|
| POST | `/api/admin/users/invite` | Send Clerk invite. | `{ email: string, name?: string }` |
| GET | `/api/admin/users/invitations` | List pending invites. | - |
| POST | `/api/admin/users/invitations/:id/resend` | Resend invite. | - |
| POST | `/api/admin/users/invitations/:id/revoke` | Revoke invite. | - |
| POST | `/api/admin/users/sync` | Sync Clerk users to DB. | - |
| PUT | `/api/admin/users/:id/credits` | Adjust user credits. | `{ credits: number }` |
| GET | `/api/admin/storage` | List storage items. | `?search=query&userId=...` |
| DELETE | `/api/admin/storage/:id` | Delete file. | - |
| GET | `/api/admin/settings` | Get feature costs/plans. | - |
| PUT | `/api/admin/settings` | Update feature costs. | `AdminSettingsPayload` |
| GET | `/api/admin/plans` | List plans. | - |
| POST | `/api/admin/plans` | Create plan. | `Partial<BillingPlan>` |
| PUT | `/api/admin/plans/:id` | Update plan. | `Partial<BillingPlan>` |
| DELETE | `/api/admin/plans/:id` | Delete plan. | - |

**Error Handling**: `ApiError`, `InsufficientCreditsError`. Success/Error responses standardized.

## Development & Customization

### Hooks for Admin Features
- `useAdminSettings()`: Loads settings.
- `useAdminPlans()`: Manages `Plan[]`, Clerk sync (`PlansResponse`).
- Related: `useCredits()`, `useUsage()`, `useStorage()`.

### Extending
1. Add nav items to `AdminChrome`.
2. New API: Prefix `/api/admin/`, wrap with `requireAdmin()`.
3. New page: `src/app/admin/[subpath]/page.tsx`, use `AdminLayout`.
4. Plans/Features: Update `src/lib/credits/settings.ts`, `feature-config.ts`.

### Testing
- Mock Clerk/Asaas with env overrides.
- Usage examples in `src/components/admin/` (e.g., plan drawers).
- Logs: `createLogger()` with admin context.

**Related Files**:
- Core: `src/app/admin/`, `src/components/admin/`.
- Lib: `src/lib/admin*.ts`, `src/lib/credits/`.
- Hooks: `src/hooks/use-admin*.ts`.

For codebase-wide search: Use `searchCode` for "admin" patterns.
