# Clerk Webhooks Guide for Development

## Overview

Clerk webhooks enable real-time synchronization of user data between Clerk (authentication provider) and the local database. This ensures user profiles, updates, and deletions are mirrored in the app's Prisma models (e.g., `User` model).

**Key Benefits:**
- Automatic user provisioning on signup (`user.created`).
- Profile sync on updates (`user.updated`).
- Cleanup on deletion (`user.deleted`).
- Handles Clerk-specific fields like `publicMetadata` for plan/subscription data.

**Production Note:** In production (Vercel), webhooks are auto-configured via Clerk Dashboard. This guide focuses on **local development** using tunnels for testing.

**Related Files:**
- [`src/app/api/webhooks/clerk/route.ts`](src/app/api/webhooks/clerk/route.ts): Main webhook handler.
- [`src/lib/auth-utils.ts`](src/lib/auth-utils.ts): Utilities like `getUserFromClerkId`.
- [`src/hooks/use-subscription.ts`](src/hooks/use-subscription.ts): Depends on synced user data (`SubscriptionStatus`).
- Prisma schema: `User` model (inferred from codebase; syncs `clerkId`, credits, etc.).
- Env vars: `CLERK_WEBHOOK_SECRET` (per-endpoint signing secret).

## Prerequisites

1. **Vercel CLI**: `npm i -g vercel`, then `vercel login` and `vercel link`.
2. **Dev Server**: `npm run dev` (runs on `http://localhost:3000`).
3. **Clerk Dashboard Access**: [clerk.com](https://clerk.com) → Your App → Webhooks.
4. **Svix Support**: Built into Clerk; handler uses `svix` lib for signature verification.

## Local Tunnel Setup (Public HTTPS Endpoint Required)

Clerk requires HTTPS. Use one of these to expose `localhost:3000`:

### Option A: Vercel Dev Tunnel (Preferred if Available)
```bash
npm run dev:tunnel
```
- Outputs: `https://your-app-git-dev-xxx.vercel.app` (or similar).
- Check CLI version; falls back if `--tunnel` unsupported.

### Option B: Cloudflare Tunnel (Recommended)
1. Install: `brew install cloudflared` (macOS) or equivalent.
2. Start app: `npm run dev`.
3. Tunnel: `npm run tunnel:cf`.
   - Outputs: `https://<hash>.cfargotunnel.com` (copies to clipboard).

### Option C: ngrok (Quickest)
1. Start app: `npm run dev`.
2. Tunnel: `npm run tunnel:ngrok`.
   - Outputs: `https://<subdomain>.ngrok.io` (copies to clipboard).
   - Free tier: Random subdomains; paid for static.

## Configure Clerk Webhook Endpoint

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
   - **URL**: `https://<your-tunnel-url>/api/webhooks/clerk`.
   - Select events: `user.created`, `user.updated`, `user.deleted`.
2. Copy **Signing Secret** (`whsec_...`).
3. Add to `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```
4. Restart dev server: `npm run dev`.

**Pro Tip:** Create **one endpoint per developer** for isolated secrets (avoids conflicts).

## Webhook Implementation Details

The endpoint (`src/app/api/webhooks/clerk/route.ts`) handles `POST` requests:

### Flow
```typescript
// Simplified pseudocode from route.ts
import { Webhook } from 'svix';
import { getUserFromClerkId } from '@/lib/auth-utils';
// ...

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = req.headers;

  // Verify signature (Svix/Clerk)
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(payload, {
    'svix-id': headers.get('svix-id')!,
    'svix-timestamp': headers.get('svix-timestamp')!,
    'svix-signature': headers.get('svix-signature')!,
  }) as ClerkEvent;

  // Handle events
  switch (evt.type) {
    case 'user.created':
      await syncUser(evt.data); // Create/update User in DB
      break;
    case 'user.updated':
      await syncUser(evt.data); // Upsert
      break;
    case 'user.deleted':
      await deleteUser(evt.data.id); // Soft/hard delete
      break;
  }

  return new Response('OK', { status: 200 });
}
```

- **Verification**: Fails fast on invalid `svix-*` headers or signature → `401 Unauthorized`.
- **Sync Logic**: Uses `getUserFromClerkId(clerkId)` to upsert `User` model with fields like `email`, `name`, `publicMetadata` (e.g., credits, subscription).
- **Error Handling**: Logs via `createLogger`; retries not implemented (idempotent via upsert).
- **Idempotency**: Events are processed once; duplicates ignored via DB constraints.

### Supported Events
| Event          | Action                  | DB Impact                  |
|----------------|-------------------------|----------------------------|
| `user.created` | Create new `User`      | Inserts with `clerkId`    |
| `user.updated` | Upsert `User`          | Updates profile/credits   |
| `user.deleted` | Delete `User`          | Removes or sets inactive  |

**Event Payload Example** (Clerk `user.created`):
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123",
    "email_addresses": [{"email_address": "user@example.com"}],
    "public_metadata": {"credits": 1000, "plan": "starter"}
  }
}
```

## Testing

1. **Clerk Dashboard**: Webhooks → Your Endpoint → **Send Test Event** (select `user.created`).
2. **In-App Actions**:
   - Signup new user → Triggers `user.created`.
   - Update profile → `user.updated`.
   - Delete user → `user.deleted`.
3. **Verify Sync**:
   - Check DB: `npx prisma studio` → Look for new `User` row.
   - App UI: Refresh dashboard; credits/subscription should update.
   - Logs: Console shows "User synced: user_2abc123".

**Hooks Impacted**:
- `useSubscription`: Reflects `SubscriptionStatus` from synced data.
- `useCredits`: Uses `CreditData` tied to user.
- `useUsage`: Tracks against synced user.

## Troubleshooting

| Issue                          | Cause/Fix                                                                 |
|--------------------------------|---------------------------------------------------------------------------|
| `no svix headers`              | Tunnel not used; Clerk hitting `localhost`. Use HTTPS tunnel URL.         |
| `Signature verification failed`| Wrong `CLERK_WEBHOOK_SECRET`. Re-copy from **your specific endpoint**.    |
| No DB sync                     | Check logs for errors; ensure Prisma connected (`npx prisma db push`).    |
| Tunnel expires/disconnects     | Restart tunnel; ngrok free tier rotates URLs.                             |
| `401 Unauthorized`             | Invalid secret/headers; test with Clerk's "Send test".                    |
| Duplicate users                | Handled by upsert; check `clerkId` unique constraint.                     |

**Logs**: Enable `LOG_LEVEL=debug` in `.env.local`; uses `createLogger` from `src/lib/logger.ts`.

## Production Considerations

- **Vercel**: Auto-deploys `/api/webhooks/clerk`; set `CLERK_WEBHOOK_SECRET` in Vercel env vars.
- **Multiple Endpoints**: Use Clerk's "Development" vs "Production" staging.
- **Monitoring**: Integrate with Vercel Logs or Sentry; track `user.*` events.
- **Rate Limits**: Clerk limits ~1000/min; app handles bursts idempotently.

## Security Best Practices

- **Never commit secrets**: `.env.local` → `.gitignore`.
- **Verify All Headers**: Svix lib enforces this.
- **Rate Limiting**: Add via `next-rate-limit` if needed (not implemented).
- **Admin Check**: No auth bypass; pure signature verification.

For codebase changes, see PRs touching `route.ts` or `auth-utils.ts`. Questions? Ping #dev channel.
