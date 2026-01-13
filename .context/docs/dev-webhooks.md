# Clerk Webhooks Guide for Development

## Overview

Clerk webhooks provide real-time synchronization of user data from Clerk (the authentication provider) to the application's Prisma database. This keeps local `User` models in sync with Clerk events for profiles, metadata (e.g., credits, subscriptions), and deletions.

**Key Benefits:**
- Automatic provisioning on `user.created`.
- Real-time updates on `user.updated` (e.g., email, `publicMetadata` like plans/credits).
- Cleanup on `user.deleted`.
- Enables hooks like `useSubscription` (`SubscriptionStatus`), `useCredits` (`CreditData`), and `useUsage` to reflect accurate data.

**Production vs. Dev:**
- **Production (Vercel)**: Auto-configured via Clerk Dashboard.
- **Development**: Requires HTTPS tunnels for local testing (Clerk mandates HTTPS).

**Core Files & Symbols:**
- [`src/app/api/webhooks/clerk/route.ts`](src/app/api/webhooks/clerk/route.ts): Main `POST` handler (uses `svix` for verification).
- [`src/lib/auth-utils.ts`](src/lib/auth-utils.ts): `getUserFromClerkId` (fetches/upserts `User` by `clerkId`).
- [`src/hooks/use-subscription.ts`](src/hooks/use-subscription.ts): Exports `SubscriptionStatus` (relies on synced data).
- [`src/hooks/use-credits.ts`](src/hooks/use-credits.ts): Exports `CreditData`, `CreditsResponse`.
- [`src/hooks/use-usage.ts`](src/hooks/use-usage.ts): Exports `UsageData`, depends on user sync.
- Prisma `User` model: Syncs `clerkId` (unique), `email`, `name`, `publicMetadata` (JSON), credits, etc.
- Env: `CLERK_WEBHOOK_SECRET` (Svix signing secret).

**Dependencies:** Controllers → Models (webhook updates `User` model); Utils → Auth.

## Prerequisites

- **Tools:** Vercel CLI (`npm i -g vercel`), `vercel login`, `vercel link`.
- **Server:** `npm run dev` (port 3000).
- **Clerk Dashboard:** [dashboard.clerk.com](https://dashboard.clerk.com) → Your App → **Webhooks**.
- **Packages:** `svix` (for signature verification), Prisma Client.

## Local HTTPS Tunnel Setup

Clerk rejects HTTP/localhost. Expose `http://localhost:3000/api/webhooks/clerk` via HTTPS:

### 1. Vercel Dev Tunnel (Recommended)
```bash
npm run dev:tunnel  # Outputs https://your-app-git-dev-xxx.vercel.app
```

### 2. Cloudflare Tunnel
```bash
npm run dev &  # Background dev server
npm run tunnel:cf  # https://<hash>.cfargotunnel.com (copies URL)
```

### 3. ngrok (Quick Test)
```bash
npm run dev &
npm run tunnel:ngrok  # https://abc123.ngrok.io (free: random URLs)
```

## Clerk Dashboard Configuration

1. **Add Endpoint:** Webhooks → **Add Endpoint** → `https://<tunnel>/api/webhooks/clerk`.
2. **Events:** `user.created`, `user.updated`, `user.deleted`.
3. **Signing Secret:** Copy `whsec_...` to `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```
4. Restart: `npm run dev`.
5. **Per-Dev:** Create separate endpoints/secrets to avoid conflicts.

## Implementation Details

### Endpoint Flow (`src/app/api/webhooks/clerk/route.ts`)

Handles `POST` with Svix verification and event dispatching:

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { getUserFromClerkId } from '@/lib/auth-utils';
import { createLogger } from '@/lib/logger';
// ... (full handler)

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const hdrs = headers();

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    const evt = wh.verify(payload, {
      'svix-id': hdrs.get('svix-id')!,
      'svix-timestamp': hdrs.get('svix-timestamp')!,
      'svix-signature': hdrs.get('svix-signature')!,
    }) as any;  // Typed as ClerkEvent

    const logger = createLogger('clerk-webhook');

    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await getUserFromClerkId(evt.data.id, evt.data);  // Upsert User
        logger.info(`User synced: ${evt.data.id}`);
        break;
      case 'user.deleted':
        // Soft delete or remove User by clerkId
        await prisma.user.deleteMany({ where: { clerkId: evt.data.id } });
        logger.info(`User deleted: ${evt.data.id}`);
        break;
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    // Logs error, returns 400/401
    return new Response('Error', { status: 400 });
  }
}
```

- **Verification:** Throws on invalid `svix-*` headers → `401`.
- **Sync:** `getUserFromClerkId(clerkId, data)` upserts `User`:
  ```typescript
  // src/lib/auth-utils.ts (excerpt)
  export async function getUserFromClerkId(clerkId: string, data?: any) {
    return prisma.user.upsert({
      where: { clerkId },
      update: { ...data },  // email, name, publicMetadata, credits, etc.
      create: { clerkId, ...data },
    });
  }
  ```
- **Idempotent:** Prisma `upsert` handles duplicates.
- **Logging:** `createLogger('clerk-webhook')` (LogLevel configurable).

### Event Payload Examples

**`user.created`**:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123",
    "first_name": "John",
    "email_addresses": [{ "email_address": "john@example.com" }],
    "public_metadata": { "credits": 1000, "plan": "starter", "subscription": "active" }
  }
}
```

**`user.updated`** (similar, triggers upsert).

## Testing

1. **Dashboard Test:** Webhooks → Endpoint → **Send Test** (`user.created`).
2. **Live Triggers:**
   - Signup → `user.created`.
   - Profile edit → `user.updated`.
   - Delete account → `user.deleted`.
3. **Verify:**
   - **DB:** `npx prisma studio` (check `User.clerkId`, `publicMetadata`).
   - **UI:** Refresh dashboard; `useCredits`, `useSubscription` update.
   - **Logs:** `LOG_LEVEL=debug` → "User synced: user_2abc123".

**Example Hook Usage (Post-Sync):**
```tsx
// In component
const { data: credits } = useCredits();  // CreditData from synced User
const { data: status } = useSubscription();  // SubscriptionStatus
```

## Troubleshooting

| Issue | Cause & Fix |
|-------|-------------|
| `no svix headers` / `400` | HTTP/localhost. Use tunnel HTTPS URL. |
| `Signature verification failed` (401) | Mismatched `CLERK_WEBHOOK_SECRET`. Re-copy from **your endpoint**. |
| No sync | Logs/errors? `npx prisma db push`; check `getUserFromClerkId`. |
| Tunnel fails | Restart; ngrok free rotates URLs. |
| Duplicates | Upsert + `clerkId` unique constraint handles. |
| Hooks stale | Refresh page; data queries cache by user ID. |

**Debug:** `LOG_LEVEL=debug` + `createLogger`.

## Production & Advanced

- **Vercel:** Deploys `/api/webhooks/clerk`; env var `CLERK_WEBHOOK_SECRET`.
- **Staging:** Separate Clerk "Development" instance.
- **Monitoring:** Vercel Logs, Sentry; track event volumes.
- **Other Webhooks:** Asaas (`AsaasClient` @ `src/lib/asaas/client.ts`); extend pattern.
- **Security:** Signature-only auth; no API keys. Add rate-limit if needed.

**Changes:** Track PRs on `route.ts`, `auth-utils.ts`. See `#dev-webhooks` channel.

**Related Exports:**
- `SubscriptionStatus` (`use-subscription.ts`)
- `CreditData` (`use-credits.ts`)
- `UsageData` (`use-usage.ts`)
- `AdminSettings` (may sync metadata)
