# Troubleshooting Asaas Webhooks

Este guia abrangente ajuda a diagnosticar e resolver problemas comuns com webhooks do Asaas, focando em falhas na atualização de créditos e planos após pagamentos confirmados. Inclui verificações de logs, endpoints de debug, análise de código fonte, fluxos completos e soluções práticas com exemplos de código.

## Sumário

- [Diagnóstico Rápido](#diagnóstico-rápido)
- [Problemas Comuns](#problemas-comuns)
- [Fluxo Completo do Webhook](#fluxo-completo-do-webhook)
- [Código Fonte Relacionado](#código-fonte-relacionado)
- [Testes e Ferramentas](#testes-e-ferramentas)
- [Checklist Completo](#checklist-completo)
- [Logs Esperados](#logs-esperados)

## Diagnóstico Rápido

### 1. Verifique Logs do Servidor

Busque logs do webhook em Vercel Functions Logs, console local ou Replit:

```
[webhook] Received event: PAYMENT_RECEIVED
[webhook] Processing PAYMENT_RECEIVED for customer: cus_0000xxxxxx
[webhook] Found user: user_2nAbCdEf1234567890 (email: user@example.com)
[webhook] Payment pay_0000xxxxxx confirmed. Plan: price_2nAbCdEfMonthly, credits: 1000
[webhook] Credits added: user_2nAbCdEf1234567890 +1000 (new balance: 1100)
```

**Logs ausentes?** Webhook não chegou ou foi filtrado.

**Configuração de Logs**:
- Use `createLogger('webhook')` de [`src/lib/logger.ts`](../src/lib/logger.ts).
- Ative debug: `LOG_LEVEL=debug` no `.env.local`.
- Filtre por `shouldLog` e `formatTimestamp` para timestamps precisos.

### 2. Endpoint de Debug (Prioridade Alta)

Acesse autenticado como o usuário afetado:

| Ambiente | URL |
|----------|-----|
| Local | `GET http://localhost:3000/api/webhooks/asaas/debug?userId=user_xxx` |
| Produção | `GET https://app.pedro-ai.com/api/webhooks/asaas/debug?userId=user_xxx` |

**Exemplo de Resposta**:
```json
{
  "user": {
    "id": "user_2nAbCdEf1234567890",
    "email": "user@example.com",
    "asaasCustomerId": "cus_0000xxxxxx",
    "asaasSubscriptionId": "sub_0000xxxxxx",
    "currentPlanId": "price_2nAbCdEfMonthly"
  },
  "credits": {
    "balance": 1100,
    "lastUpdated": "2024-12-09T10:00:00Z",
    "history": [...]
  },
  "subscription": {
    "status": "CONFIRMED",
    "nextBilling": "2025-01-09T00:00:00Z"
  },
  "recentEvents": [
    {
      "event": "PAYMENT_RECEIVED",
      "paymentId": "pay_0000xxxxxx",
      "status": "CONFIRMED",
      "processed": true,
      "timestamp": "2024-12-09T10:05:00Z"
    }
  ],
  "diagnostics": {
    "webhookEventsReceived": 5,
    "paymentEventsProcessed": 3,
    "asaasCustomerLinked": true,
    "planExists": true,
    "creditsUpdated": true,
    "issues": []
  }
}
```

**Interpretação Rápida**:
- `webhookEventsReceived: 0` → Falha no recebimento.
- `paymentEventsProcessed: 0` → Recebido, mas não processado (verifique evento tipo).
- `asaasCustomerLinked: false` → `asaasCustomerId` não setado no `User`.

Cross-reference: Usa `getUserFromClerkId` ([`src/lib/auth-utils.ts`](../src/lib/auth-utils.ts)) e `useCredits` ([`src/hooks/use-credits.ts`](../src/hooks/use-credits.ts)).

## Problemas Comuns e Soluções

### Problema 1: Webhook Não Recebido

**Sintomas**: Zero logs de recebimento, `webhookEventsReceived: 0`.

| Causa | Verificação | Solução |
|-------|-------------|---------|
| Não configurado | Asaas Dashboard > Configurações > Webhooks | Crie webhook: URL `https://app.pedro-ai.com/api/webhooks/asaas`, eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_CREATED`. |
| URL errada | Termina em `/api/webhooks/asaas`? | Use `process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/asaas'`. Local: `npm run tunnel:ngrok`. |
| Assinatura inválida | Logs: "Invalid signature" | Verifique `ASAAS_WEBHOOK_SECRET` no `.env`. Veja `verifyWebhook` em `route.ts`. |
| IP bloqueado | Teste `curl -X POST /api/webhooks/asaas` | Consulte [IPs Asaas](https://docs.asaas.com/webhooks#ips-autorizados). |

**Exemplo ngrok para Testes Locais**:
```bash
npm run tunnel:ngrok
# https://abc123.ngrok.io → Configure no Asaas e .env: NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Problema 2: Recebido mas Não Processado

**Sintomas**: Logs param em "Received event: PAYMENT_CREATED", `paymentEventsProcessed: 0`.

**Causas**:
- Evento pendente: Apenas `PAYMENT_RECEIVED`/`CONFIRMED` processados.
- Erro em `findUserByAsaasCustomer`.

**Solução**:
- Monitore Asaas > Pagamentos (aguarde "Confirmado").
- Código: Veja filtro em [`src/app/api/webhooks/asaas/route.ts`](../src/app/api/webhooks/asaas/route.ts):
  ```typescript
  if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event.event)) return;
  ```

### Problema 3: User/Plano Não Encontrado

**Sintomas**: Logs: "User not found for cus_xxx" ou "Plan not found".

**Verificações Prisma**:
```typescript
// Prisma Studio ou query
const user = await db.user.findFirst({ where: { asaasCustomerId: 'cus_xxx' } });
const plan = await db.plan.findUnique({ where: { id: 'price_xxx' } });
```

**Solução**:
- Link via Checkout: `AsaasClient.createSubscription` seta `externalReference: planId` ([`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts)).
- Crie plano: `useAdminPlans` ([`src/hooks/use-admin-plans.ts`](../src/hooks/use-admin-plans.ts)) → `Plan`, `ClerkPlan`.

### Problema 4: Créditos Não Adicionados

**Sintomas**: Plano atualizado, mas `CreditsResponse.balance` inalterado.

**Causa**: Erro em `addUserCredits` ([`src/lib/credits/validate-credits.ts`](../src/lib/credits/validate-credits.ts)).

**Solução**:
```typescript
// Teste manual
await addUserCredits('user_xxx', 1000); // Verifique InsufficientCreditsError
```
- Monitore `useCredits` → `CreditData`, `CreditsResponse`.

## Fluxo Completo do Webhook

1. **Checkout**: `POST /api/checkout` → `AsaasClient.createCustomer`/`createSubscription` (externalReference=planId).
2. **Pagamento Confirmado** → Asaas POST `/api/webhooks/asaas`.
3. **Processamento**:
   ```typescript
   // src/app/api/webhooks/asaas/route.ts
   import { AsaasClient } from '@/lib/asaas/client';
   import { addUserCredits } from '@/lib/credits/validate-credits';
   import { getUserFromClerkId, validateUserAuthentication } from '@/lib/auth-utils';

   export async function POST(request: Request) {
     const payload = await request.json();
     const signature = request.headers.get('x-hub-signature-256')!;
     // verifyWebhook(signature, payload)...
     const event = payload.event;
     if (event === 'PAYMENT_RECEIVED') {
       const customerId = payload.data.customer;
       const user = await db.user.findUnique({ where: { asaasCustomerId: customerId } });
       if (!user) throw new Error('User not found');
       const planId = payload.data.externalReference;
       const plan = await db.plan.findUnique({ where: { id: planId } });
       await addUserCredits(user.id, plan!.creditsGranted);
     }
   }
   ```
4. **Frontend Sync**: `useSubscription`/`useCredits` refetch.

## Código Fonte Relacionado

| Arquivo | Símbolos Principais | Descrição |
|---------|---------------------|-----------|
| [`src/lib/asaas/client.ts`](../src/lib/asaas/client.ts) | `AsaasClient` | Cliente para API Asaas (createSubscription, fetchPayment). |
| [`src/lib/credits/validate-credits.ts`](../src/lib/credits/validate-credits.ts) | `addUserCredits` | Adiciona créditos, lança `InsufficientCreditsError`. |
| [`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts) | - | Inicia subscription com `externalReference`. |
| [`src/app/api/webhooks/asaas/route.ts`](../src/app/api/webhooks/asaas/route.ts) | - | Handler principal do webhook. |
| [`src/hooks/use-credits.ts`](../src/hooks/use-credits.ts) | `CreditsResponse`, `CreditData` | Hook para saldo UI. |
| [`src/hooks/use-admin-plans.ts`](../src/hooks/use-admin-plans.ts) | `Plan`, `ClerkPlansResponse` | Gerencia planos. |
| [`src/lib/logger.ts`](../src/lib/logger.ts) | `createLogger`, `LogLevel` | Logging estruturado. |

## Testes e Ferramentas

### 1. Simular Webhook
```bash
# Payload exemplo PAYMENT_RECEIVED
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=..." \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "data": {
      "id": "pay_xxx",
      "customer": "cus_xxx",
      "externalReference": "price_pro_monthly",
      "value": 49.90
    }
  }'
```

### 2. Confirmar Pagamento Asaas (Sandbox)
```bash
curl -X POST https://sandbox.asaas.com/api/v3/payments/pay_xxx/confirm \
  -H "access_token: $ASAAS_API_KEY_SANDBOX"
```

### 3. Ferramentas
- **Prisma Studio**: `npx prisma studio` → User, Plan, CreditTransaction.
- **Vercel Logs**: `vercel logs production -f`.
- **Asaas Dashboard**: Webhooks > Histórico de Eventos.

## Checklist Completo

- [ ] Webhook configurado no Asaas (eventos corretos, URL exata).
- [ ] `.env`: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
- [ ] Logs mostram "Received event".
- [ ] Debug endpoint: `issues: []`, `creditsUpdated: true`.
- [ ] Pagamento Asaas "Confirmado".
- [ ] User tem `asaasCustomerId`.
- [ ] Plano existe (`creditsGranted > 0`).
- [ ] `addUserCredits` sem erros (verifique `useCredits`).
- [ ] Frontend: `useSubscription` mostra status "CONFIRMED".

## Logs Esperados (Sucesso)

```
[INFO webhook] Received PAYMENT_RECEIVED
[DEBUG webhook] Verified signature
[INFO webhook] User found: user_xxx -> cus_xxx
[INFO webhook] Plan: price_xxx (1000 credits)
[INFO credits] Adding 1000 credits to user_xxx (balance: 100 -> 1100)
[SUCCESS webhook] Processed successfully
```

## Suporte Adicional

Problema persiste? Compartilhe:
1. Logs completos (filtrados por "webhook").
2. JSON do `/api/webhooks/asaas/debug`.
3. Histórico Asaas Webhooks.
4. Queries Prisma: `User`, `Plan`, `CreditTransaction`.

Abra issue no GitHub. Veja `AdminSettings` ([`src/hooks/use-admin-settings.ts`](../src/hooks/use-admin-settings.ts)) para configs globais.
