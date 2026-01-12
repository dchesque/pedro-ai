# Asaas Webhooks Integration

## Overview

This guide explains how to configure and test Asaas webhooks for handling payment events in the application. Webhooks enable automatic processing of payment confirmations, such as updating user credits upon successful payments.

**Key Concepts**:
- **Webhook Endpoint**: `POST /api/webhooks/asaas` (Next.js App Router route at `src/app/api/webhooks/asaas/route.ts`)
- **Purpose**: Receives real-time events from Asaas (e.g., `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`) and updates the database (e.g., user credits).
- **Verification**: Uses HMAC SHA256 signature with `ASAAS_WEBHOOK_SECRET`.
- **Environment**: Supports **Sandbox** (testing) and **Production** modes.
- **Related Components**:
  - [AsaasClient](../src/lib/asaas/client.ts): Client for Asaas API interactions.
  - [Credits System](../src/lib/credits/): Handles credit updates triggered by webhooks.
  - [Subscription Hooks](../src/hooks/use-subscription.ts): Queries subscription status post-webhook.

**Webhook vs. Callback**:
| Aspect       | Webhook                          | Callback                          |
|--------------|----------------------------------|-----------------------------------|
| **Trigger**  | Payment event from Asaas backend | User redirected after payment     |
| **URL**      | `/api/webhooks/asaas`            | `/dashboard?payment=success`      |
| **Scope**    | Server-side (credits update)     | Client-side (UI feedback)         |
| **Config**   | Asaas Dashboard > Webhooks       | `NEXT_PUBLIC_APP_URL`             |

**⚠️ Critical**: Both webhook and callback URLs must share the **same base domain** (e.g., tunnel URL during dev).

## Prerequisites

- Next.js dev server running: `npm run dev` (listens on `http://localhost:3000`).
- Asaas account with API keys in `.env`:
  ```env
  ASAAS_API_KEY=your_sandbox_or_prod_key  # Sandbox: acc_*, Prod: key_*
  ASAAS_API_URL=https://sandbox.asaas.com/api/v3  # Or https://www.asaas.com/api/v3 for prod
  ```
- Public tunnel tool: Cloudflare Tunnel (`npm run tunnel:cf`) or ngrok (`npm run tunnel:ngrok`).
- `NEXT_PUBLIC_APP_URL` set to tunnel URL.

## Setup Steps

### 1. Expose Local Server via Tunnel

```bash
# Cloudflare (recommended, via package.json scripts)
npm run tunnel:cf
# Output: https://<hash>.cfargotunnel.com

# ngrok
npm run tunnel:ngrok
# Output: https://<subdomain>.ngrok.io
```

Copy the **HTTPS** public URL.

### 2. Update Environment

```env
NEXT_PUBLIC_APP_URL=https://<your-tunnel-url>.cfargotunnel.com
ASAAS_WEBHOOK_SECRET=whsec_your_asaas_webhook_secret  # From Asaas dashboard
```

**Restart dev server** after changes: `npm run dev`.

### 3. Configure Webhook in Asaas Dashboard

1. Login: [Sandbox](https://sandbox.asaas.com/) or [Production](https://www.asaas.com/).
2. Navigate: **Integrações > Webhooks > Adicionar Webhook**.
3. **URL**: `https://<your-tunnel-url>/api/webhooks/asaas`.
4. **Token de Verificação**: Copy and set as `ASAAS_WEBHOOK_SECRET`.
5. **Eventos** (recommended):
   - `PAYMENT_RECEIVED` (Cobrança Recebida)
   - `PAYMENT_CONFIRMED` (Cobrança Confirmada)
   - `PAYMENT_OVERDUE` (Cobrança Vencida, optional for reminders)
6. Save.

## Implementation Details

### Webhook Handler (`src/app/api/webhooks/asaas/route.ts`)

Handles incoming POST requests with signature verification and event processing.

**Key Logic**:
1. **Verification**: Computes HMAC SHA256 of raw body using `ASAAS_WEBHOOK_SECRET` and compares to `X-Hub-Signature-256` header.
2. **Event Dispatch**:
   - `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED`: Fetch payment via [AsaasClient](../src/lib/asaas/client.ts), update user credits via `addUserCredits`.
3. **Logging**: Uses app logger for debugging (e.g., `[Webhook] Credits updated: user@example.com -> 1000 credits`).
4. **Error Handling**: Returns 400/401 on invalid signature; 200 on success.

**Example Payload** (Asaas `PAYMENT_RECEIVED`):
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "customer": "cus_123",
    "value": 99.90,
    "status": "CONFIRMED",
    "billingType": "PIX",
    "dueDate": "2024-10-01"
  }
}
```

**Signature Verification Code Snippet**:
```ts
// Simplified from route.ts
import { createHmac } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-asaas-signature') || '';
  const expectedSignature = `sha256=${createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET!).update(body).digest('hex')}`;
  
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  // Handle event...
}
```

### AsaasClient Usage (`src/lib/asaas/client.ts`)

```ts
export class AsaasClient {
  constructor(private apiKey: string, private apiUrl: string = 'https://sandbox.asaas.com/api/v3') {}

  async getPayment(id: string) {
    return this.fetch(`/payments/${id}`);
  }

  private async fetch(endpoint: string) {
    // Authenticated fetch with apiKey
  }
}
```

**Cross-References**:
- [Credits Validation](../src/lib/credits/validate-credits.ts): `addUserCredits`.
- [Subscription Status](../src/hooks/use-subscription.ts): Reflects webhook updates.

## Testing the Flow

1. Create a test subscription via app UI (e.g., upgrade plan).
2. Complete PIX payment in Asaas Sandbox (instant confirmation).
3. Monitor logs:
   ```
   [Asaas] Environment: SANDBOX
   [Webhook] Received event: PAYMENT_RECEIVED for pay_abc123
   [Credits] Added 1000 credits to user_123
   ```
4. Verify in app: User dashboard shows updated credits/subscription.

**Sandbox Test Payments**:
- PIX: Use any CPF/CNPJ, email; confirms instantly.
- Boleto: Use `34191.09008 00019.5512 07206.3 747 00000001037`.

## Troubleshooting

| Issue                          | Cause/Solution |
|--------------------------------|----------------|
| **No webhook events**          | - Tunnel down? Run `npm run tunnel:cf`.<br>- URL mismatch? Check Asaas > Webhooks > Histórico.<br>- Secret invalid? Verify `ASAAS_WEBHOOK_SECRET`. |
| **Signature 401**              | Raw body tampering or wrong secret. Use `req.text()` before JSON.parse. |
| **No credit update**           | Check payment `customer` matches Clerk user ID. Logs in `/api/webhooks/asaas`. |
| **Callback redirect fails**    | `NEXT_PUBLIC_APP_URL` mismatch. Restart server. |
| **Prod vs Sandbox mixup**      | Toggle `ASAAS_API_URL` and use correct dashboard. |

**Debug Tips**:
- Add `console.log(event)` in handler (dev only).
- Asaas Logs: Dashboard > Webhooks > Histórico (delivery status, retries).
- Extend Events: Add cases in `route.ts` switch (e.g., `PAYMENT_CANCELED`).

## Production Deployment

- Use Vercel/Netlify domain for `NEXT_PUBLIC_APP_URL`.
- Update Asaas webhook to prod URL.
- Monitor with Vercel Logs or Sentry.
- Rotate `ASAAS_WEBHOOK_SECRET` periodically.

For extending webhook logic, see [API Auth Utils](../src/lib/api-auth.ts) and [Logger](../src/lib/logger.ts).
