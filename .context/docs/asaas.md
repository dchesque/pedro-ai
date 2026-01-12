# Asaas Integration Guide

This guide covers the Asaas payment integration for handling subscriptions, customers, and payments in the Pedro AI platform. Asaas is a Brazilian payment gateway with APIs for billing management.

## Overview

- **Purpose**: Manages recurring subscriptions (monthly/yearly plans) and one-time payments.
- **Key Components**:
  | Component | Path | Description |
  |-----------|------|-------------|
  | `AsaasClient` | `src/lib/asaas/client.ts` | Main API client for customers, subscriptions, and payments. |
  | Configuration | `src/lib/asaas/config.ts` | Loads env vars and determines sandbox/production mode. |
  | Checkout API | `src/app/api/checkout/route.ts` | Creates subscriptions/payments. |
  | Webhook Handler | `src/app/api/webhooks/asaas/route.ts` | Processes payment events (confirmation, overdue, etc.). |
- **Dependencies**: Uses `apiClient` from `src/lib/api-client.ts` for HTTP requests.
- **Usage**: Integrated with Clerk for user management and credits system (`src/lib/credits/`).

## Environment Configuration

Asaas has **Sandbox** (testing) and **Production** (live) environments.

### Sandbox (Recommended for Development)
```
ASAAS_API_KEY=acc_123...  # No leading $
# ASAAS_API_URL defaults to https://sandbox.asaas.com/api/v3
```
- Dashboard: [sandbox.asaas.com](https://sandbox.asaas.com/)
- No real charges.

### Production
```
ASAAS_API_KEY="$aas_prod_123..."  # Starts with $
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_SECRET=whsec_123...  # From dashboard
```
- Dashboard: [asaas.com](https://www.asaas.com/)
- **Escape `$` in `.env`**: Use quotes `"$aas_..."` or `\$aas_...`.

### Detection & Logging
On server startup:
```
[Asaas] Environment: [SANDBOX|PRODUCTION]
[Asaas] API URL: https://...
[Asaas] API Key: [masked]
```
Config exported from `src/lib/asaas/config.ts`:
```typescript
export const ASAAS_CONFIG = {
  apiKey: process.env.ASAAS_API_KEY!,
  apiUrl: process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3',
  isSandbox: !process.env.ASAAS_API_URL?.includes('api.asaas.com'),
  environment: process.env.ASAAS_API_URL?.includes('api.asaas.com') ? 'production' : 'sandbox'
};
```

**Env Check Script**: `node scripts/check-env.js` validates keys and escaping.

## AsaasClient API

**Import**: `import { AsaasClient } from '@/lib/asaas/client.ts';`

**Instantiation**:
```typescript
const asaasClient = new AsaasClient();  // Auto-configures from env
```

### Key Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getCustomerByEmail(email: string)` | Fetch customer by email or `null`. | `email` | `Promise<Customer \| null>` |
| `createCustomer(data: CreateCustomerInput)` | Create new customer. | `{ name, email, cpf?, phone? }` | `Promise<Customer>` |
| `getOrCreateCustomer(data: { name: string, email: string })` | Idempotent: get or create. | `{ name, email }` | `Promise<Customer>` |
| `createSubscription(input: CreateSubscriptionInput)` | Create subscription. | `{ customer: string, value: number, cycle: 'MONTHLY' \| 'YEARLY', billingType: 'CREDIT_CARD' \| 'PIX', ... }` | `Promise<Subscription>` |
| `getSubscriptionPayments(subId: string)` | List payments for subscription. | `subscriptionId` | `Promise<Payment[]>` |

**Types** (from `src/lib/asaas/types.ts`):
```typescript
interface Customer { id: string; email: string; name: string; /* ... */ }
interface Subscription { id: string; customer: string; value: number; status: 'CONFIRMED' \| ... }
```

**Example: Full Subscription Flow**
```typescript
import { asaasClient } from '@/lib/asaas/client';

async function createUserSubscription(userEmail: string, userName: string, planPrice: number) {
  // 1. Get/Create Customer
  const customer = await asaasClient.getOrCreateCustomer({ email: userEmail, name: userName });

  // 2. Create Subscription
  const subscription = await asaasClient.createSubscription({
    customer: customer.id,
    billingType: 'CREDIT_CARD',  // or 'PIX'
    value: planPrice,            // e.g., 990 for R$9.90 (min R$5.00)
    cycle: 'MONTHLY',
    description: 'Pedro AI Pro Plan',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&sub=${subscription.id}`,
    // webhookUrl: auto-configured globally
  });

  return subscription;
}
```
**Cross-references**:
- Used in `src/app/api/checkout/route.ts` for plan upgrades.
- Integrated with `use-admin-plans.ts` for billing plans.

## Webhooks

**Endpoint**: `POST /api/webhooks/asaas`
- **Verification**: HMAC with `ASAAS_WEBHOOK_SECRET`.
- **Events Handled**:
  | Event | Action |
  |-------|--------|
  | `PAYMENT_CONFIRMED` | Add credits via `addUserCredits`. |
  | `PAYMENT_OVERDUE` | Notify user, suspend access. |
  | `PAYMENT_CANCELED` | Deduct/revoke credits. |

**Handler Logic** (`src/app/api/webhooks/asaas/route.ts`):
1. Verify signature.
2. Parse event.
3. Update user subscription status in DB.
4. Sync credits.

**Setup**:
1. Asaas Dashboard → Integrações → Webhooks → Add `https://${NEXT_PUBLIC_APP_URL}/api/webhooks/asaas`.
2. Copy token to `ASAAS_WEBHOOK_SECRET`.
3. Test with ngrok for local dev.

**Callbacks (User Redirects)**:
- Set per-subscription: `${NEXT_PUBLIC_APP_URL}/dashboard?payment=success&subscriptionId=...`
- Ensures same domain as webhook.

## Minimum Value Enforcement

**Rule**: Asaas requires ≥ R$5.00 (500 cents).
- **Validation**: In `src/app/api/checkout/route.ts`:
```typescript
const ASAAS_MIN_VALUE = 5.00;
if (price < ASAAS_MIN_VALUE) {
  throw new Error(`Minimum R$ ${ASAAS_MIN_VALUE}`);
}
```
- **Plans**: Free = no Asaas; Paid ≥ R$5.00.
- Related: `BillingPlan` in `src/components/admin/plans/types.ts`.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Chave não pertence ao ambiente" | Key/URL mismatch. | Match sandbox/prod key+URL. |
| "Valor < R$5.00" | Plan too cheap. | Update `priceMonthlyCents >= 500`. |
| No webhook events | Wrong URL/secret. | Verify `${NEXT_PUBLIC_APP_URL}` consistency; check logs. |
| Key not loaded | `$` escaping. | Use `"$key"` in `.env`; run `check-env.js`. |
| Credits not added | Webhook fail. | Check `/api/webhooks/asaas` logs; test delivery in Asaas. |

**Logs**: Enable `LOG_LEVEL=debug` for Asaas traces.

## Testing

1. **Sandbox**: Create test customer/sub via API.
2. **Webhook Test**: Use Asaas dashboard simulator or Stripe-like CLI.
3. **E2E**: `npm run dev` → Checkout flow → Inspect DB/credits.

## Best Practices

- **Domains**: `NEXT_PUBLIC_APP_URL` must match webhook domain.
- **Security**: Never log full API keys; use masked prefixes.
- **Idempotency**: Use `getOrCreateCustomer` to avoid duplicates.
- **Plans Sync**: Use `src/components/admin/plans/` for DB config.
- **Related Docs**:
  - [Credits System](./credits.md)
  - [Admin Plans](./admin-plans.md)
  - [Asaas Types](src/lib/asaas/types.ts)

## Resources

- [Asaas Docs](https://docs.asaas.com/)
- Source: `src/lib/asaas/` (172 LOC total)
