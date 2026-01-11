# Asaas Integration Guide

This guide covers the Asaas payment integration, including environment configuration, API usage, and webhooks.

## Overview

Asaas is a Brazilian payment gateway that provides APIs for managing customers, subscriptions, and payments. This project integrates with Asaas to handle subscription billing.

## Environments

Asaas provides two environments:

### 1. SANDBOX (Development/Testing)
- **Purpose**: Testing without real charges
- **API URL**: `https://sandbox.asaas.com/api/v3`
- **Dashboard**: https://sandbox.asaas.com/
- **API Keys**: Usually start with letters/numbers (not `$`)
- **Use for**: Local development, testing, staging

**Configuration**:
```env
# .env
ASAAS_API_KEY=your_sandbox_key_here
# ASAAS_API_URL is optional - defaults to sandbox
```

### 2. PRODUCTION
- **Purpose**: Real payments and charges
- **API URL**: `https://api.asaas.com/v3`
- **Dashboard**: https://www.asaas.com/
- **API Keys**: Start with `$` (e.g., `$aas_...`)
- **Use for**: Production deployments

**Configuration**:
```env
# .env
ASAAS_API_KEY="$aas_your_production_key_here"
ASAAS_API_URL=https://api.asaas.com/v3
```

**Important**: Production keys that start with `$` need proper escaping in `.env` files:
- **Recommended**: Use double quotes: `ASAAS_API_KEY="$aas_..."`
- **Alternative**: Escape the `$`: `ASAAS_API_KEY=\$aas_...`

## Environment Detection

When your server starts, you'll see logs indicating which environment is active:

```
[Asaas] Environment: SANDBOX
[Asaas] API URL: https://sandbox.asaas.com/api/v3
[Asaas] API Key: abc12...
```

Or for production:

```
[Asaas] Environment: PRODUCTION
[Asaas] API URL: https://api.asaas.com/v3
[Asaas] API Key: $aas_...
```

## Getting API Keys

### Sandbox Keys
1. Create an account at https://sandbox.asaas.com/
2. Navigate to **Integrações > API**
3. Copy your API key
4. Add to `.env`: `ASAAS_API_KEY=your_key_here`

### Production Keys
1. Create an account at https://www.asaas.com/
2. Navigate to **Integrações > API**
3. Copy your API key (starts with `$aas_`)
4. Add to `.env` with proper escaping: `ASAAS_API_KEY="$aas_your_key_here"`
5. Set the production URL: `ASAAS_API_URL=https://api.asaas.com/v3`

## API Client

The Asaas client is located at `src/lib/asaas/client.ts` and provides methods for:

- **Customers**: Create, update, and search customers
- **Subscriptions**: Create and manage subscriptions
- **Payments**: Query subscription payments

**Example usage**:
```typescript
import { asaasClient } from '@/lib/asaas/client';

// Get or create customer
const customer = await asaasClient.getCustomerByEmail(email)
  || await asaasClient.createCustomer({ email, name });

// Create subscription
const subscription = await asaasClient.createSubscription({
  customer: customer.id,
  value: 99.90,
  cycle: 'MONTHLY',
  billingType: 'CREDIT_CARD',
});
```

## Configuration

The configuration is in `src/lib/asaas/config.ts`:

```typescript
export const ASAAS_CONFIG = {
  apiKey: string;           // From ASAAS_API_KEY env var
  apiUrl: string;           // From ASAAS_API_URL or defaults to sandbox
  isSandbox: boolean;       // True if using sandbox environment
  environment: string;      // "sandbox" or "production"
};
```

## Webhooks and Callbacks

It's important to understand the difference between **Webhooks** and **Callbacks** in Asaas integration:

### Webhook (Global Configuration)
**Purpose**: Receives payment EVENTS from Asaas to your backend.

- **What it is**: A URL configured globally in your Asaas Dashboard
- **Where to configure**: Asaas Dashboard → Integrações → Webhooks
- **URL format**: `https://yourdomain.com/api/webhooks/asaas`
- **Events received**: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, etc.
- **When it's called**: Whenever ANY payment event occurs in your Asaas account
- **Purpose**: Backend processes payment confirmations and updates user credits
- **Handler**: `src/app/api/webhooks/asaas/route.ts`

**Setup**:
1. Configure webhook URL in Asaas dashboard: `https://yourdomain.com/api/webhooks/asaas`
2. Copy the verification token
3. Add to `.env`: `ASAAS_WEBHOOK_SECRET=your_token_here`

### Callback (Per-Subscription Configuration)
**Purpose**: Redirects the USER after completing payment.

- **What it is**: A URL sent when creating each subscription via API
- **Where to configure**: Set via `NEXT_PUBLIC_APP_URL` in `.env`
- **URL format**: `https://yourdomain.com/dashboard?payment=success&plan=xyz`
- **When it's called**: After the user completes payment on Asaas invoice page
- **Purpose**: Improved user experience - redirects user back to your app
- **Code**: `src/app/api/checkout/route.ts:220-223`

### Important: URL Consistency

**⚠️ CRITICAL**: Both webhook and callback URLs must use the same base domain (NEXT_PUBLIC_APP_URL).

**Correct Configuration** ✅:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```
- Webhook in dashboard: `https://yourdomain.com/api/webhooks/asaas`
- Callback automatically: `https://yourdomain.com/dashboard?payment=success`

**Incorrect Configuration** ❌:
```env
NEXT_PUBLIC_APP_URL=https://different-domain.com
```
- Webhook in dashboard: `https://yourdomain.com/api/webhooks/asaas`
- Callback: `https://different-domain.com/dashboard?payment=success` ⚠️ MISMATCH!

### Behavior Scenarios

#### Scenario 1: Webhook Configured (Recommended)
- ✅ Payment events are automatically processed
- ✅ User credits updated immediately when payment confirmed
- ✅ User redirected to dashboard after payment
- **Requirements**: Webhook URL in dashboard + `NEXT_PUBLIC_APP_URL` + `ASAAS_WEBHOOK_SECRET`

#### Scenario 2: No Webhook Configured
- ❌ Payment events NOT automatically processed
- ⚠️ Credits won't be updated automatically
- ✅ User still redirected to dashboard after payment
- ⚠️ Manual intervention needed to confirm payments

### Troubleshooting

**Error: Webhook not receiving events**
1. Check webhook URL matches `NEXT_PUBLIC_APP_URL` + `/api/webhooks/asaas`
2. Verify `ASAAS_WEBHOOK_SECRET` is correctly set
3. Check server logs for incoming requests
4. Test webhook delivery in Asaas dashboard

**Error: User not redirected after payment**
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check callback URL in subscription creation logs
3. Ensure URL is accessible (not localhost if testing in production)

See [asaas-webhooks.md](./asaas-webhooks.md) for detailed webhook setup instructions.

## Important Limitations

### Minimum Charge Value

**Asaas requires a minimum charge value of R$ 5.00** for all subscriptions and payments.

This means:
- All subscription plans must have a value of at least R$ 5.00
- One-time payments must also be at least R$ 5.00
- The system validates this before creating charges in Asaas

**Example validation in checkout** (`src/app/api/checkout/route.ts:72-77`):
```typescript
// Validate minimum value required by Asaas (R$ 5.00)
if (price < ASAAS_MIN_VALUE) {
    return NextResponse.json({
        error: `O valor mínimo para assinaturas é R$ ${ASAAS_MIN_VALUE.toFixed(2)}`
    }, { status: 400 });
}
```

**Recommendation**: Design your pricing tiers to respect this minimum:
- ✅ Free Plan: R$ 0.00 (handled separately, no Asaas subscription created)
- ✅ Starter Plan: R$ 9.00 (above minimum)
- ✅ Pro Plan: R$ 29.00 (above minimum)
- ❌ Micro Plan: R$ 2.99 (below minimum - not allowed)

## Common Issues

### Error: "O valor da cobrança (R$ X) não pode ser menor que R$ 5,00"

**Cause**: Attempting to create a subscription or charge with value below R$ 5.00.

**Solution**:
1. Check your plan prices in the database or static config
2. Ensure all paid plans have `priceMonthlyCents >= 500` (R$ 5.00)
3. For plans below this value, consider making them free or bundling features

### Error: "A chave de API informada não pertence a este ambiente"

**Cause**: API key doesn't match the environment URL.

**Solutions**:
1. **Using production key with sandbox URL**: Set `ASAAS_API_URL=https://api.asaas.com/v3`
2. **Using sandbox key with production URL**: Remove `ASAAS_API_URL` to use sandbox (default)
3. **API key not loading**: Check if `$` is properly escaped in `.env`

### API key not detected

Run the environment check script:
```bash
node scripts/check-env.js
```

This will verify:
- `.env` file exists
- `ASAAS_API_KEY` is present
- Key is properly loaded into `process.env`
- Any escaping issues with `$` character

### Switching between environments

To switch from sandbox to production:
1. Update `ASAAS_API_KEY` with production key (with proper escaping)
2. Add `ASAAS_API_URL=https://api.asaas.com/v3`
3. Update `ASAAS_WEBHOOK_SECRET` with production webhook token
4. Restart your server
5. Verify logs show: `[Asaas] Environment: PRODUCTION`

To switch from production to sandbox:
1. Update `ASAAS_API_KEY` with sandbox key
2. Remove or comment out `ASAAS_API_URL`
3. Update `ASAAS_WEBHOOK_SECRET` with sandbox webhook token
4. Restart your server
5. Verify logs show: `[Asaas] Environment: SANDBOX`

## Best Practices

1. **Always use SANDBOX for development**: Never test with production keys locally
2. **Verify environment on startup**: Check server logs to confirm correct environment
3. **Keep secrets secure**: Never commit `.env` files to version control
4. **Use environment variables**: Never hardcode API keys in code
5. **Test webhooks locally**: Use tunneling tools (ngrok, Cloudflare Tunnel) for local webhook testing

## Additional Resources

- [Asaas API Documentation](https://docs.asaas.com/)
- [Asaas Webhooks Guide](./asaas-webhooks.md)
- [Backend Development Guide](./backend.md)
- [API Routes Documentation](./api.md)
