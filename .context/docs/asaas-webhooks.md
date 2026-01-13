# Asaas Webhooks Integration

## Overview

This guide details the configuration, implementation, and testing of Asaas webhooks for real-time payment event processing. Webhooks automatically handle events like payment confirmations, updating user subscriptions and credits in the database.

**Key Features**:
- **Endpoint**: `POST /api/webhooks/asaas` (`src/app/api/webhooks/asaas/route.ts`)
- **Events Handled**: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`
- **Security**: HMAC SHA256 verification using `ASAAS_WEBHOOK_SECRET`
- **Modes**: Sandbox (`https://sandbox.asaas.com/api/v3`) and Production (`https://www.asaas.com/api/v3`)
- **Integrations**:
  - [AsaasClient](../src/lib/asaas/client.ts): API client for payment fetches
  - [Credits Management](../src/lib/credits/validate-credits.ts): `addUserCredits` for credit allocation
  - [Subscription Hooks](../src/hooks/use-subscription.ts): `SubscriptionStatus` updates
  - [Logger](../src/lib/logger.ts): Event logging

**Webhook vs. Callback Comparison**:

| Aspect          | Webhook (`/api/webhooks/asaas`)              | Callback (`/dashboard?payment=success`)     |
|-----------------|----------------------------------------------|---------------------------------------------|
| **Trigger**     | Server-side Asaas events                     | Client-side post-payment redirect           |
| **Reliability** | Retried by Asaas on failure                  | Single-shot, UI-only                        |
| **Use Case**    | Credit/subscription updates                  | User feedback/redirect                      |
| **Config**      | Asaas Dashboard > Webhooks                   | `NEXT_PUBLIC_APP_URL` in payment links      |

**⚠️ Important**: Webhook and callback must use the **same HTTPS domain** (critical for dev tunnels).

## Prerequisites

- Running dev server: `npm run dev` (`http://localhost:3000`)
- Asaas API credentials in `.env.local`:
  ```env
  ASAAS_API_KEY=acc_your_sandbox_key  # acc_* (sandbox) or key_* (prod)
  ASAAS_API_URL=https://sandbox.asaas.com/api/v3
  ASAAS_WEBHOOK_SECRET=whsec_your_secret  # Generated in Asaas dashboard
  NEXT_PUBLIC_APP_URL=https://your-tunnel-url  # Required for callbacks
  ```
- Tunnel for public HTTPS exposure: Cloudflare (`npm run tunnel:cf`) or ngrok (`npm run tunnel:ngrok`)

## Setup

### 1. Expose Localhost via Tunnel
```bash
npm run tunnel:cf  # e.g., https://example.cfargotunnel.com
# Or: npm run tunnel:ngrok  # e.g., https://abc123.ngrok.io
```
Set `NEXT_PUBLIC_APP_URL=https://example.cfargotunnel.com` and restart `npm run dev`.

### 2. Configure Asaas Webhook
1. [Sandbox Dashboard](https://sandbox.asaas.com/) or [Prod](https://www.asaas.com/)
2. **Integrações > Webhooks > Adicionar Webhook**
3. **URL**: `https://your-tunnel-url/api/webhooks/asaas`
4. **Token de Verificação**: Copy to `ASAAS_WEBHOOK_SECRET`
5. **Events**:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE` (optional)
6. Save and note the webhook ID for monitoring.

## Implementation

### Webhook Handler (`src/app/api/webhooks/asaas/route.ts`)
Verifies signature, parses event, and dispatches:

```ts
// Core verification (excerpt)
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { AsaasClient } from '@/lib/asaas/client';
import { addUserCredits } from '@/lib/credits/validate-credits';
import { createLogger } from '@/lib/logger';

const log = createLogger('[Asaas Webhook]');

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-asaas-signature') ?? '';
  const secret = process.env.ASAAS_WEBHOOK_SECRET;
  if (!secret || !verifySignature(body, signature, secret)) {
    log.error('Invalid signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body) as AsaasEvent;
  log.info(`Event: ${event.event} for payment ${event.payment.id}`);

  switch (event.event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      const client = new AsaasClient(process.env.ASAAS_API_KEY!, process.env.ASAAS_API_URL!);
      const payment = await client.getPayment(event.payment.id);
      await addUserCredits({ userId: payment.customer, credits: payment.value * 100 });  // e.g., R$99.90 -> 9990 credits
      break;
    // ... other cases
  }

  return new Response('OK', { status: 200 });
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  return signature === expected;
}
```

**Event Payload Example** (`PAYMENT_RECEIVED`):
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "customer": "cus_user123",
    "value": 99.90,
    "status": "CONFIRMED",
    "billingType": "PIX",
    "dueDate": "2024-10-01"
  }
}
```

### AsaasClient (`src/lib/asaas/client.ts`)
```ts
export class AsaasClient {
  constructor(private apiKey: string, private baseUrl: string) {}

  async getPayment(id: string): Promise<AsaasPayment> {
    const res = await fetch(`${this.baseUrl}/payments/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`Payment fetch failed: ${res.status}`);
    return res.json();
  }
  // Additional methods: listPayments, createPayment, etc.
}
```

**Usage in Webhook**: Instantiates client to fetch full payment details by ID.

**Related Exports**:
- `addUserCredits` ([src/lib/credits/validate-credits.ts](../src/lib/credits/validate-credits.ts))
- `SubscriptionStatus` ([src/hooks/use-subscription.ts](../src/hooks/use-subscription.ts))

## Testing

1. **Create Test Payment**:
   - In app: Upgrade plan → PIX payment.
   - Sandbox PIX confirms instantly (any CPF/email).

2. **Monitor Logs**:
   ```
   [Asaas Webhook] Event: PAYMENT_RECEIVED for pay_abc123
   [Asaas] Fetched payment: cus_user123, R$99.90 CONFIRMED
   [Credits] Added 9990 credits to user_123
   ```

3. **Verify**:
   - App dashboard: Credits/subscription updated.
   - Asaas: Webhooks > Histórico (delivery status).

**Test Boleto**: `34191.09008 00019.5512 07206.3 747 00000001037` (sandbox).

## Troubleshooting

| Issue | Cause & Fix |
|-------|-------------|
| **No Events** | Tunnel expired (`npm run tunnel:cf`); Wrong URL in Asaas; Check Histórico. |
| **401 Signature** | Modified body (use `req.text()` first); Wrong `ASAAS_WEBHOOK_SECRET`. |
| **No Credits** | `customer` ID mismatch (Clerk ID); Logs for errors; Test `addUserCredits`. |
| **Tunnel/Callback Fail** | HTTP vs HTTPS; Update `NEXT_PUBLIC_APP_URL`; Restart server. |
| **Sandbox/Prod Mix** | Wrong `ASAAS_API_URL`/dashboard; Toggle explicitly. |

**Debug**:
- Add `log.debug(JSON.stringify(event))` (dev only).
- Asaas retry: Up to 10x, exponential backoff.
- Extend: Add `PAYMENT_CANCELED` case in switch.

## Production

- Deploy to Vercel: Auto-HTTPS domain.
- Update Asaas webhook URL.
- Monitor: Vercel Logs, Sentry.
- Security: Rotate `ASAAS_WEBHOOK_SECRET`; Rate-limit endpoint.
- Scale: Idempotent handling (check payment status before update).

**Extensions**:
- Refund handling: `PAYMENT_CANCELED` → deduct credits.
- Analytics: Track via [Usage Hooks](../src/hooks/use-usage.ts).

For API patterns, see [api-auth.ts](../src/lib/api-auth.ts). Questions? Check [AdminSettings](../src/hooks/use-admin-settings.ts).
