# Admin Panel

Comprehensive guide to the administration interface and backend APIs for managing users, credits, plans, storage, and system settings in the Pedro AI application.

## Access Control

### URL
- **Base Path**: `/admin`
- **Protected Routes**: All subpaths under `/admin` are SSR-guarded.

### Guards and Middleware
- **Server-Side**: `AdminLayout` (`src/app/admin/layout.tsx`) enforces admin privileges using `requireAdmin()` from `src/lib/admin.ts`.
- **Client-Side**: Components like `AdminChrome` (`src/components/admin/admin-chrome.tsx`) and `AdminTopbar` (`src/components/admin/admin-topbar.tsx`) assume admin auth.
- **Admin Definition**: Via `.env`:
  ```env
  ADMIN_EMAILS=admin@domain.com,ops@domain.com
  # OR
  ADMIN_USER_IDS=usr_123,usr_456  # Clerk user IDs
  ```
- **Utils**:
  - `isAdmin(user: User)`: `src/lib/admin-utils.ts` – Checks email or ID.
  - `requireAdmin()`: Throws if not admin.

**Usage Example**:
```tsx
// In API route or server component
import { requireAdmin } from '@/lib/admin';
requireAdmin(request);
```

## Prerequisites

- **Clerk**: `CLERK_SECRET_KEY` for invites/sync. Enable invitations and email in dashboard. Allow sign-up redirects.
- **Asaas**: `ASAAS_API_KEY` for `AsaasClient` (`src/lib/asaas/client.ts`) – Generates checkout links.
- **Database**: Prisma (`PrismaClient` – full server-side).
- **Storage**: Configured providers (`src/lib/storage/`) e.g., `VercelBlobStorage`, `ReplitAppStorage`.
- **Dev Mode**: `AdminDevModeProvider` (`src/contexts/admin-dev-mode.tsx`) for debug toggles.

## UI Structure

### Core Components
| Component | Path | Purpose |
|-----------|------|---------|
| `AdminLayout` | `src/app/admin/layout.tsx` | Root SSR guard + layout wrapper. |
| `AdminChrome` | `src/components/admin/admin-chrome.tsx` | Sidebar navigation (Users, Settings, Storage, etc.). |
| `AdminTopbar` | `src/components/admin/admin-topbar.tsx` | Search, notifications, quick actions. |
| `AdminSettingsPage` | `src/app/admin/settings/page.tsx` | Feature costs & plans tabs. |
| `AdminOnboardingPage` | `src/app/admin/onboarding/page.tsx` | Setup wizard. |

- **Navigation Tabs**: Users, Settings (`useAdminSettings`), Storage (`useStorage`), Invites, Sync.
- **State Management**: `useToast` for feedback; `AdminDevModeProvider` for debug.
- **Settings Hook**: `useAdminSettings` (`src/hooks/use-admin-settings.ts`) – Fetches `AdminSettings`.

**Cross-References**:
- Plans: `src/components/admin/plans/` (e.g., `plan-edit-drawer.tsx` using `BillingPlan`).
- Dev Tools: Integrates `useStyles`, `useTones` for previews.

## Main Features

### 1. Users Management
- **List/View**: Users with `CreditBalance`, usage (`useUsageHistory` hook: `UsageRecord[]`).
- **Actions**:
  | Action | API | Hook |
  |--------|-----|------|
  | Adjust Credits | `PUT /api/admin/users/:id/credits` `{ credits: number }` | `useCredits` |
  | Delete User | `DELETE /api/admin/users/:id` | N/A |
  | Sync Clerk Users | `POST /api/admin/users/sync` | N/A |

- **Example** (Client Hook Usage):
  ```tsx
  const { mutate } = useCredits();
  const adjustCredits = (userId: string, amount: number) => {
    mutate({ userId, credits: amount }, { revalidate: true });
  };
  ```

### 2. Settings (`/admin/settings`)
- **Type**: `AdminSettings` / `AdminSettingsPayload` (`src/lib/credits/settings.ts`).
- **Tabs**:
  - **Feature Costs**: Edit `FeatureKey` costs (e.g., `ai_text_chat`, `ai_image_generation`) via `src/lib/credits/feature-config.ts`.
  - **Subscription Plans**: CRUD `BillingPlan[]` (`src/components/admin/plans/types.ts`).

**Plan Interface**:
```ts
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

- **Hooks**: `useAdminPlans` (`Plan[]`, `ClerkPlan[]` sync).
- **APIs**:
  | Method | Endpoint | Payload |
  |--------|----------|---------|
  | GET | `/api/admin/settings` | - |
  | PUT | `/api/admin/settings` | `AdminSettingsPayload` |
  | GET | `/api/admin/plans` | `PlansResponse` |
  | POST/PUT/DELETE | `/api/admin/plans/:id` | `Partial<BillingPlan>` |

### 3. Storage Management (`/admin/storage`)
- **List/Search**: `useStorage` (`StorageItem[]`) – Filter by name, owner (`userId`), type.
- **Actions**: View URL, delete (`DELETE /api/admin/storage/:id` – DB + provider).
- **Providers**: `StorageProviderType` (e.g., `vercel-blob`), `UploadResult`.

**Example**:
```tsx
const { data: items } = useStorage({ search: 'image.png', userId });
const deleteItem = useDeleteStorageItem();
```

### 4. Invites & Onboarding
- **Send Invite**: `POST /api/admin/users/invite` `{ email: string; name?: string }`.
- **Manage**: List (`GET /api/admin/users/invitations`), resend/revoke (`POST /api/admin/users/invitations/:id/{resend|revoke}`).

## Admin APIs

**Base**: `/api/admin/*` – All require `requireAdmin()`.

| Method | Endpoint | Description | Params/Body |
|--------|----------|-------------|-------------|
| POST | `/api/admin/users/invite` | Clerk invite | `{ email, name? }` |
| GET | `/api/admin/users/invitations` | Pending invites | - |
| POST | `/api/admin/users/invitations/:id/resend` | Resend | - |
| POST | `/api/admin/users/invitations/:id/revoke` | Revoke | - |
| POST | `/api/admin/users/sync` | Sync Clerk → DB | - |
| PUT | `/api/admin/users/:id/credits` | Add/subtract credits | `{ credits: number }` |
| DELETE | `/api/admin/users/:id` | Delete user + data | - |
| GET | `/api/admin/storage` | List items | `?search=&userId=` |
| DELETE | `/api/admin/storage/:id` | Delete file | - |
| GET | `/api/admin/settings` | Settings | - |
| PUT | `/api/admin/settings` | Update costs | `AdminSettingsPayload` |
| GET | `/api/admin/plans` | List plans | `PlansResponse` / `ClerkPlansResponse` |
| POST | `/api/admin/plans` | Create plan | `Partial<BillingPlan>` |
| PUT | `/api/admin/plans/:id` | Update | `Partial<BillingPlan>` |
| DELETE | `/api/admin/plans/:id` | Delete | - |

**Responses**:
- Success: `{ success: true, data }`
- Errors: `ApiError`, `InsufficientCreditsError`.

## Development & Customization

### Key Hooks
- `useAdminSettings`: Loads/updates settings.
- `useAdminPlans`: CRUD plans, Clerk sync.
- Related: `useUsage`, `useStorage`, `useCredits` (`CreditData`, `CreditsResponse`).

### Extending the Admin
1. **New Nav Tab**: Add to `AdminChrome` sidebar.
2. **New Page**: `src/app/admin/new/page.tsx` under `AdminLayout`.
3. **New API**: `/api/admin/new` with `requireAdmin()`.
4. **Features/Plans**: Extend `FeatureKey` (`src/lib/credits/feature-config.ts`), `AdminSettingsPayload`.

**Example Extension** (New API):
```ts
// pages/api/admin/new.ts
import { requireAdmin } from '@/lib/admin';
export async function POST(req: Request) {
  requireAdmin(req);
  // Logic
  return createSuccessResponse(data);
}
```

### Testing & Debug
- **Mocks**: Override Clerk/Asaas envs.
- **Logs**: `createLogger` with admin context (`src/lib/logger.ts`).
- **Examples**: `src/components/admin/plans/`, `src/app/admin/settings/page.tsx`.
- **Dev Mode**: Toggle via `AdminDevModeProvider`.

## Related Files & Symbols
- **Pages**: `src/app/admin/**/*` (e.g., `AdminAgentEditPage`).
- **Components**: `src/components/admin/*` (e.g., `AdminChrome`).
- **Lib**: `src/lib/admin*.ts`, `src/lib/credits/*`, `src/lib/asaas/`.
- **Hooks**: `src/hooks/use-admin*.ts`.
- **Types**: `AdminSettingsPayload`, `BillingPlan`, `ClerkPlan`.

Search codebase for "admin" patterns via tools for more.
