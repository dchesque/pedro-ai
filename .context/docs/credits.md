# Credits System

The credits system manages user credit balances as the **server source of truth**. Balances are stored in the database (`User.creditsRemaining`) and govern access to paid features like AI text generation, image generation, and video creation. Client-side displays are optimistic but always refetch from the server for accuracy.

## Key Concepts

- **Credits**: Integer balance per user. Depleted by feature usage (e.g., 10 credits per AI image).
- **Features**: Defined in `src/lib/credits/feature-config.ts` as `FeatureKey` (e.g., `'ai_text_chat'`, `'ai_image_generation'`).
- **Costs**: Dynamic per-feature costs from admin settings (overrides static defaults).
- **OperationType**: Prisma enum (`OperationType`) for usage tracking (mapped from `FeatureKey` via `toPrismaOperationType`).
- **UsageHistory**: Auditable log of all transactions (deductions, refunds, grants).

**Cross-references**:
- [`Feature config`](src/lib/credits/feature-config.ts)
- [`Settings utils`](src/lib/credits/settings.ts)
- [`Deduction logic`](src/lib/credits/deduct.ts)
- [`Validation`](src/lib/credits/validate-credits.ts)
- [`Errors`](src/lib/credits/errors.ts)
- [`Prisma types`](src/lib/prisma-types.ts)
- [`Track usage`](src/lib/credits/track-usage.ts)

## Reading Balance

Fetch the user's current balance via:

### Server Endpoint
```
GET /api/credits/me
```
Response:
```ts
{
  creditsRemaining: number;
}
```

### Client Hook
`useCredits()` from `src/hooks/use-credits.ts` (React Query powered):
```tsx
const { data: credits, isLoading, refresh } = useCredits();

console.log(credits?.creditsRemaining); // e.g., 150
```
- **Refetch triggers**: Window focus, 30s background refresh.
- **Exposes**: `getCost(operation: OperationType)`, `canPerformOperation(operation: OperationType)`.
- **Settings integration**: Fetches `/api/credits/settings` for dynamic costs.

**Usage example** (AI Chat):
```tsx
// src/app/(protected)/ai-chat/page.tsx
if (!credits.canPerformOperation(OperationType.AI_TEXT_CHAT)) {
  // Disable input or show upgrade prompt
}
```

## Spending Credits

### Server-Side Flow
API handlers (e.g., `/api/ai/chat`, `/api/ai/image`):
1. `validateCreditsForFeature(clerkUserId, feature)`: Checks balance ≥ cost; throws `InsufficientCreditsError` if not.
2. Perform operation (e.g., call AI provider).
3. `deductCreditsForFeature({ clerkUserId, feature, details })`: Atomically deducts and logs `UsageHistory`.

**Example** (simplified from `src/app/api/ai/chat/route.ts`):
```ts
import { validateCreditsForFeature, deductCreditsForFeature } from '@/lib/credits';

const cost = getFeatureCost('ai_text_chat');
validateCreditsForFeature(userId, 'ai_text_chat');

try {
  const response = await openRouter.chat(...);
  deductCreditsForFeature({ clerkUserId: userId, feature: 'ai_text_chat', creditsUsed: cost });
  return response;
} catch (error) {
  // Refund logic (see Refunds)
}
```

### Costs
- **Static defaults**: `FEATURE_CREDIT_COSTS` in `src/lib/credits/feature-config.ts`.
- **Dynamic overrides**: `AdminSettings.featureCosts` via `getFeatureCost(feature)` (`src/lib/credits/settings.ts`).

| Feature                  | Default Cost | OperationType          |
|--------------------------|--------------|------------------------|
| `ai_text_chat`           | 1            | `AI_TEXT_CHAT`         |
| `ai_image_generation`    | 10           | `AI_IMAGE_GENERATION`  |
| `ai_video_generation`    | 50           | `AI_VIDEO_GENERATION`  |

**Public endpoint**: `GET /api/credits/settings` (read-only feature costs).

## Admin Overrides

Configure via `/admin/settings` (`AdminSettingsPage`):
- **Feature costs**: `{ [FeatureKey]: number }`.
- **Plans**: CRUD via `GET/POST /api/admin/plans`.

**Plan schema** (`BillingPlan` from `src/components/admin/plans/types.ts`):
```ts
{
  id: string;
  name: string;
  credits: number; // e.g., 1000
  active: boolean;
  priceMonthlyCents: number;
  // ...
}
```

**Server utils**:
- `addUserCredits(userId, amount)`: Manual grants (logs `UsageHistory`).
- Asaas/Clerk webhooks auto-grant on payments/sync (`src/lib/asaas/client.ts`).

## Client-Side UI Integration

- **Display cost**: `credits.getCost(OperationType.AI_IMAGE_GENERATION)` → "10 credits".
- **Optimistic checks**: `credits.canPerformOperation(op)` disables UI if insufficient.
- **Post-mutation refresh**: Call `credits.refresh()` after success.

**Example** (Image generation):
```tsx
const generateImage = useAiImage();
const { refresh } = useCredits();

const handleGenerate = async () => {
  if (!credits.canPerformOperation(OperationType.AI_IMAGE_GENERATION)) return;
  const result = await generateImage.mutateAsync(params);
  if (result) refresh(); // Balance updated server-side
};
```

## Refunds

Automatic on provider failures **after deduction**:
- **Text chat** (`/api/ai/chat`): Refund if provider errors before streaming response.
- **Image** (`/api/ai/image`): Refund on non-200, invalid JSON, parse errors, empty blobs.
- Logged as `UsageHistory` with `creditsUsed: -cost`, `details: { refund: true, reason: string }`.

**Error**: `InsufficientCreditsError` (exported from `src/lib/credits/errors.ts`).

## Usage History & Analytics

- **Hook**: `useUsageHistory()` fetches paginated `UsageRecord[]` (`src/hooks/use-usage-history.ts`).
- **Dashboard**: `useDashboard()` aggregates stats (e.g., total spent) (`src/hooks/use-dashboard.ts`).
- **Admin**: Manual adjustments create history entries (`src/hooks/admin/use-admin-users.ts`).

## Health & Debugging

- **Admin check**: `GET /api/admin/health/credits-enum` verifies enum mappings.
- **Sync users**: `POST /api/admin/users/sync` (Clerk webhook fallback).
- **Logs**: All ops via `createLogger('credits')` (`src/lib/logger.ts`).

## Related Components & Hooks

| Path | Purpose |
|------|---------|
| `src/hooks/use-credits.ts` | Balance + cost checks (`CreditData`, `CreditsResponse`) |
| `src/hooks/use-usage.ts` | Real-time usage (`UsageData`) |
| `src/hooks/use-usage-history.ts` | Transaction history (`UsageRecord`, `UsageHistoryResponse`) |
| `src/components/admin/settings/page.tsx` | Admin config UI (`AdminSettingsPage`) |
| `src/app/admin/plans/...` | Plan management (`useAdminPlans`) |
| `src/lib/asaas/client.ts` | Payment webhooks (`AsaasClient`) |
| `src/hooks/use-subscription.ts` | Subscription status |
| `src/hooks/admin/use-admin-settings.ts` | Admin settings (`AdminSettings`) |

## Migration Notes

- Uses custom Prisma client (`prisma/generated/client`) to match runtime enums.
- Re-export `OperationType` from `src/lib/prisma-types.ts`.
- **Dependencies**: Relies on Clerk for user IDs, React Query for caching.
