# Asaas Integration Guide

This guide documents the Asaas payment gateway integration in Pedro AI, handling customer management, subscriptions, payments, and webhooks. Asaas supports Brazilian billing (PIX, credit card) for recurring plans and one-time charges, integrated with Clerk auth and the credits system.

## Overview

**Purpose**: Process subscriptions for Pro plans (monthly/yearly) and sync credits on payment events.

**Core Components**:
| Component | Path | Description |
|-----------|------|-------------|
| `AsaasClient` | [`src/lib/asaas/client.ts`](src/lib/asaas/client.ts) | Primary class for API interactions (customers, subscriptions, payments). Exported and used app-wide. |
| Config | [`src/lib/asaas/config.ts`](src/lib/asaas/config.ts) | Environment detection (sandbox/production), API key/URL loading. |
| Checkout Endpoint | [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts) | Handles plan purchases, creates customers/subscriptions. |
| Webhook Handler | [`src/app/api/webhooks/asaas/route.ts`](src/app/api/webhooks/asaas/route.ts) | Processes events like `PAYMENT_CONFIRMED` to update credits/subscriptions. |
| Types | [`src/lib/asaas/types.ts`](src/lib/asaas/types.ts) | Interfaces: `Customer`, `Subscription`, `Payment`, `CreateCustomerInput`, etc. |

**Dependencies**:
- [`src/lib/api-client.ts`](src/lib/api-client.ts): `apiClient` for HTTP requests.
- [`src/lib/credits/`](src/lib/credits/): `addUserCredits`, `validate-credits.ts`.
- [`src/hooks/use-admin-plans.ts`](src/hooks/use-admin-plans.ts): `ClerkPlan`, `BillingPlan`.
- Clerk for user lookup via `getUserFromClerkId`.

**Architecture Flow**:
1. User selects plan → Checkout API creates customer/subscription.
2. Asaas redirects to payment → Webhook confirms → DB/credits updated.
3. Credits tracked via [`src/lib/credits/track-usage.ts`](src/lib/credits/track-usage.ts).

## Environment Setup

Asaas uses separate keys/URLs for **Sandbox** (test) and **Production**.

### Required Env Vars
```
# Sandbox (default)
ASAAS_API_KEY=acc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # From sandbox.asaas.com

# Production (override default)
ASAAS_API_KEY="$aas_prod_xxxxxxxxxxxxxxxxxxxxxxxx"  # Starts with $
ASAAS_API_URL=https://api.asaas.com/api/v3
ASAAS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx  # Webhook verification
```

**Notes**:
- **Dollar Sign Escaping**: Production keys start with `$`. Use `"$aas_..."` or `\$aas_...` in `.env`.
- **Auto-Detection** (from `ASAAS_CONFIG` in `config.ts`):
  ```typescript
  export const ASAAS_CONFIG = {
    apiKey: process.env.ASAAS_API_KEY!,
    apiUrl: process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3',
    isSandbox: !process.env.ASAAS_API_URL?.includes('api.asaas.com'),
    environment: process.env.ASAAS_API_URL?.includes('api.asaas.com') ? 'production' : 'sandbox',
    webhookSecret: process.env.ASAAS_WEBHOOK_SECRET,
  } as const;
  ```
- **Validation**: Run `node scripts/check-env.js` (logs masked keys, environment).
- **Logs on Startup**: `[Asaas] Environment: [SANDBOX|PRODUCTION]`, API URL/key (masked).

**Dashboards**:
- Sandbox: [sandbox.asaas.com](https://sandbox.asaas.com/)
- Prod: [www.asaas.com](https://www.asaas.com/)

## AsaasClient Usage

**Import**:
```typescript
import { AsaasClient } from '@/lib/asaas/client';
```

**Instantiate** (singleton recommended):
```typescript
const asaas = new AsaasClient();  // Uses ASAAS_CONFIG automatically
```

### Main Methods
| Method | Params | Returns | Usage Notes |
|--------|--------|---------|-------------|
| `getCustomerByEmail(email: string)` | `email: string` | `Promise<Customer \| null>` | Fetches existing customer. |
| `createCustomer(input: CreateCustomerInput)` | `{ name: string, email: string, cpf?: string, phone?: string }` | `Promise<Customer>` | Creates new; throws on duplicate email. |
| `getOrCreateCustomer(input: { name: string, email: string })` | `{ name, email }` | `Promise<Customer>` | Idempotent: get if exists, else create. |
| `createSubscription(input: CreateSubscriptionInput)` | `{ customer: string, value: number (cents), cycle: 'MONTHLY' \| 'YEARLY', billingType: 'CREDIT_CARD' \| 'PIX', description?: string, callbackUrl?: string }` | `Promise<Subscription>` | Starts checkout; min value R$5.00 (500 cents). |
| `getSubscriptionPayments(subId: string)` | `subscriptionId: string` | `Promise<Payment[]>` | Lists payments for a sub. |

**Key Types** (`src/lib/asaas/types.ts`):
```typescript
export interface Customer {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  // ... full Asaas shape
}

export interface Subscription {
  id: string;
  customer: string;
  value: number;  // cents
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | ...;
  billingType: 'CREDIT_CARD' | 'PIX' | ...;
  cycle: 'MONTHLY' | 'YEARLY';
}

export interface Payment { /* similar */ }
export type CreateCustomerInput = Pick<Customer, 'name' | 'email' | 'cpf' | 'phone'>;
export type CreateSubscriptionInput = { /* as above */ };
```

**Example: Subscription Creation** (used in `checkout/route.ts`):
```typescript
async function handleCheckout(userEmail: string, userName: string, plan: BillingPlan) {
  const customer = await asaas.getOrCreateCustomer({ name: userName, email: userEmail });
  
  if (plan.priceMonthlyCents < 500) {
    throw new Error('Minimum value: R$5.00');
  }

  const sub = await asaas.createSubscription({
    customer: customer.id,
    value: plan.priceMonthlyCents,
    cycle: 'MONTHLY',
    billingType: 'CREDIT_CARD',
    description: `${plan.name} - Pedro AI`,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?subId=${sub.id}`,
  });

  return { checkoutUrl: sub.checkout_url };  // Redirect user
}
```

**Error Handling**: Throws `ApiError` (from `api-client.ts`); check `statusCode`, `message`.

## Webhooks

**Endpoint**: `POST /api/webhooks/asaas`

**Security**: HMAC signature verification using `ASAAS_WEBHOOK_SECRET`.

**Handled Events**:
| Event | Trigger | Action |
|-------|---------|--------|
| `PAYMENT_CONFIRMED` | Payment success | `addUserCredits` via Clerk ID; update sub status. |
| `PAYMENT_OVERDUE` | Late payment | Suspend access, notify via email. |
| `PAYMENT_CANCELED`/`PAYMENT_EXPIRED` | Cancellation | Revoke credits, mark sub inactive. |
| `SUBSCRIPTION_OVERDUE` | Sub issues | Sync DB status. |

**Implementation** (`webhooks/asaas/route.ts`):
1. Verify `X-Hub-Signature-256`.
2. Parse `event`/`data`.
3. Clerk lookup → Update Prisma `Subscription`/`User`.
4. Credits sync via `src/lib/credits/`.

**Setup**:
1. Asaas Dashboard > Integrações > Webhooks > Add: `https://${NEXT_PUBLIC_APP_URL}/api/webhooks/asaas`.
2. Select events: Payment.* , Subscription.*.
3. Copy secret to `ASAAS_WEBHOOK_SECRET`.
4. Local testing: `ngrok http 3000`, update URL.

**Callbacks**: Per-subscription `callbackUrl` for user redirect (e.g., `/dashboard?payment=success`).

## Integration Points

- **Checkout**: `/api/checkout` → Creates sub → Returns `invoiceUrl`.
- **Plans**: `BillingPlan` (`src/components/admin/plans/types.ts`) → `priceMonthlyCents`.
- **Credits**: Payment confirmed → `addUserCredits` (`src/lib/credits/validate-credits.ts`).
- **Admin**: View plans (`use-admin-plans.ts`), no direct Asaas admin.

**Usage Examples**:
- Tests: Search for `AsaasClient` imports (e.g., checkout route).
- DB: Prisma `Subscription` model links `clerkId`, `asaasId`, `status`.

## Troubleshooting

| Issue | Symptoms | Fixes |
|-------|----------|-------|
| `Chave não pertence ao ambiente` | 401/403 on API | Match key to URL (sandbox key ≠ prod). |
| `Valor inferior ao mínimo` | 400 on createSub | Ensure `value >= 500` cents. |
| Webhook "Unauthorized" | 401 on POST | Check `ASAAS_WEBHOOK_SECRET`; re-copy from dashboard. |
| No credits on payment | Silent fail | Check logs (`LOG_LEVEL=debug`), webhook delivery in Asaas. |
| Key undefined | Env not loaded | Quotes around `$` in `.env`; restart/re-run `check-env.js`. |
| Duplicate customers | Multiple entries | Always use `getOrCreateCustomer`. |

**Debugging**:
- `LOG_LEVEL=debug` → Asaas traces.
- Inspect: Network tab, Asaas dashboard (logs/payments).
- Test: Sandbox → Create test PIX/CC.

## Testing

1. **Unit**: Mock `apiClient` in `AsaasClient` tests (if added).
2. **Sandbox E2E**:
   ```
   npm run dev
   # Go to /pricing → Buy Pro → Use test CPF/PIX
   # Check webhook logs, DB, credits
   ```
3. **Webhook Simulator**: Asaas dashboard > Testar.
4. **CLI**: `curl` to `/api/checkout` with valid plan.

## Best Practices

- **Idempotency**: `getOrCreateCustomer`; webhook `idempotencyKey`.
- **Min Value**: Enforce R$5+ in UI/API.
- **Domains**: `${NEXT_PUBLIC_APP_URL}` consistent for webhooks/callbacks.
- **Security**: Mask keys in logs; validate all inputs.
- **Sync**: Webhook → Immediate DB update; poll if needed.
- **Migration**: Free users skip Asaas; upgrade only.

**Cross-References**:
- [Credits System](credits.md)
- [Admin Plans](admin-plans.md)
- [API Client](api-client.md)
- Source: `src/lib/asaas/` (~172 LOC)

**Resources**:
- [Asaas API Docs](https://docs.asaas.com/)
- [Webhook Guide](https://docs.asaas.com/docs/webhooks)
