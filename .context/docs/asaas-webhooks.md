# Local Asaas Webhooks for Payment Testing

Use a public tunnel to deliver Asaas webhooks to your local Next.js dev server to test payment confirmation events.

## Understanding Webhooks vs Callbacks

Before setting up, it's crucial to understand the difference:

### Webhook (What this guide covers)
- **Purpose**: Backend receives payment EVENTS from Asaas
- **URL**: `https://yourdomain.com/api/webhooks/asaas`
- **Configured**: Globally in Asaas Dashboard
- **Processes**: Payment confirmations, updates credits automatically

### Callback
- **Purpose**: Redirects USER after payment
- **URL**: `https://yourdomain.com/dashboard?payment=success`
- **Configured**: Automatically via `NEXT_PUBLIC_APP_URL`
- **Processes**: User experience only

**⚠️ IMPORTANT**: Both must use the same base domain for proper functionality.

## Prerequisites
- A tool to create a public tunnel to your local server, like Cloudflare Tunnel or ngrok.
- Running dev server: `npm run dev`
- Asaas API configured in `.env`:
  - For testing: Use **SANDBOX** environment (default)
  - For production: Configure production API key and URL (see [README.md](../README.md#configurar-asaas))
- `NEXT_PUBLIC_APP_URL` set to your tunnel URL (critical for both webhook and callback)

## 1. Start a Public Tunnel
First, expose your local server (running on port 3000) to the internet.

### Option A: Cloudflare Tunnel
1. Install: `brew install cloudflared` (or download from their website).
2. Start tunnel: `npm run tunnel:cf`
   - This will provide a public URL like `https://<hash>.cfargotunnel.com`.

### Option B: ngrok
1. Install ngrok.
2. Start tunnel: `npm run tunnel:ngrok`
   - This will provide a public URL like `https://<subdomain>.ngrok.io`.

Copy the public URL provided by your tunnel tool.

## 2. Configure Your Environment
**Before** configuring Asaas, set your tunnel URL in `.env`:
```env
NEXT_PUBLIC_APP_URL=https://<your-tunnel-url>
```

This ensures both webhook and callback use the same base URL.

## 3. Configure Asaas Webhook
1. In your Asaas Dashboard, navigate to **Integrações > Webhooks**.
   - **SANDBOX**: https://sandbox.asaas.com/ (for testing)
   - **PRODUÇÃO**: https://www.asaas.com/ (for real payments)

2. Click **Adicionar Webhook**.
3. **URL**: Paste the public URL from your tunnel and append the API route: `https://<your-tunnel-url>/api/webhooks/asaas`.
   - ⚠️ This MUST match the base URL in `NEXT_PUBLIC_APP_URL`
4. **Token de Verificação**: Asaas provides a secret token. Copy this token.
5. **Set the secret locally**: Add the copied token to your `.env` or `.env.local` file:
   ```env
   ASAAS_WEBHOOK_SECRET=your_asaas_token_here
   ```
6. **Eventos**: Select the events you want to listen to. For this template, the most important ones are:
   - ✅ **"Cobrança Recebida" (`PAYMENT_RECEIVED`)**
   - ✅ **"Cobrança Confirmada" (`PAYMENT_CONFIRMED`)**

7. Save the webhook.

## 4. Verify Setup
- Perform a test payment in the Asaas environment:
  - **SANDBOX**: Test payments without real charges
  - **PRODUÇÃO**: Real payments (be careful!)
- When the payment is confirmed, Asaas will send an event to your local server.
- The handler for this is located at `src/app/api/webhooks/asaas/route.ts`. You can add `console.log` statements there to see the incoming payload and debug the process.
- Check your server logs for:
  ```
  [Asaas] Environment: SANDBOX (or PRODUCTION)
  [Asaas] API URL: https://sandbox.asaas.com/api/v3
  [Webhook] Received event: PAYMENT_RECEIVED
  [Webhook] Credits updated: user@example.com -> 1000 credits
  ```

## Expected Flow

1. **User initiates checkout** → Creates subscription with callback URL
2. **User completes payment** → Asaas processes payment
3. **Asaas sends webhook** → Your backend at `/api/webhooks/asaas` receives event
4. **Backend updates credits** → User credits updated in database
5. **User redirected** → Via callback URL to `/dashboard?payment=success`

## Troubleshooting

### Webhook not receiving events
1. Verify tunnel is running: `npm run tunnel:cf` or `npm run tunnel:ngrok`
2. Check webhook URL in Asaas dashboard matches tunnel URL + `/api/webhooks/asaas`
3. Verify `ASAAS_WEBHOOK_SECRET` is correctly set in `.env`
4. Check Asaas dashboard → Webhooks → Histórico for delivery logs

### User not redirected after payment
1. Verify `NEXT_PUBLIC_APP_URL` matches your tunnel URL
2. Restart dev server after changing `NEXT_PUBLIC_APP_URL`
3. Check if payment was completed successfully in Asaas dashboard

### Webhook vs Callback Confusion
**ERROR**: "Webhook URL doesn't match callback URL"
- **Cause**: `NEXT_PUBLIC_APP_URL` doesn't match webhook base URL in Asaas dashboard
- **Solution**: Ensure both use the same base domain

**Example Correct Setup**:
```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```
- Asaas Webhook: `https://abc123.ngrok.io/api/webhooks/asaas` ✅
- Callback: `https://abc123.ngrok.io/dashboard?payment=success` ✅

## Tips
- Ensure your tunnel is running and that the URL in the Asaas dashboard is correct.
- If the webhook fails, Asaas provides a log of recent deliveries in its dashboard, which can help diagnose issues like incorrect URLs or server errors (5xx).
- The `ASAAS_WEBHOOK_SECRET` is crucial for verifying that the request genuinely came from Asaas. Keep it safe.
- Always restart your dev server after changing `NEXT_PUBLIC_APP_URL`.
