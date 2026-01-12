# Troubleshooting Webhooks Asaas

Este guia abrangente ajuda a diagnosticar e resolver problemas comuns relacionados a webhooks do Asaas, especialmente quando créditos e planos de usuários não são atualizados após pagamentos confirmados. Focado em desenvolvedores, inclui verificações de logs, endpoints de debug, causas raiz baseadas no código fonte e soluções práticas com exemplos.

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

Procure por logs específicos do webhook no console do servidor (Vercel, local ou Replit):

```
[Webhook] Received event: PAYMENT_RECEIVED
[Webhook] Processing for user: user@example.com (clerkId: user_xxx)
[Webhook] Found Asaas customer: cus_xxx -> User ID: user_123
[Webhook] Payment pay_xxx confirmed. Plan: pro_monthly (1000 credits)
[Webhook] Credits updated: user@example.com -> 1100 credits (added 1000)
```

**Se ausentes**: Webhook não recebido ou filtrado.

**Cross-reference**: Logs gerados por `src/lib/logger.ts` (`createLogger`). Ative logging completo com `LOG_LEVEL=debug` no `.env`.

### 2. Endpoint de Debug (Recomendado)

Acesse logado como o usuário afetado:

- **Local**: `GET http://localhost:3000/api/webhooks/asaas/debug`
- **Produção**: `GET https://seudominio.com/api/webhooks/asaas/debug`

**Resposta exemplo**:
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "asaasCustomerId": "cus_xxx",
    "asaasSubscriptionId": "sub_xxx",
    "currentPlanId": "plan_pro_monthly"
  },
  "credits": {
    "balance": 100,
    "lastUpdated": "2024-12-09T10:00:00Z"
  },
  "subscription": {
    "status": "CONFIRMED",
    "nextBilling": "2025-01-09"
  },
  "recentEvents": [
    {
      "event": "PAYMENT_RECEIVED",
      "paymentId": "pay_xxx",
      "status": "CONFIRMED",
      "processed": true,
      "timestamp": "2024-12-09T10:05:00Z"
    }
  ],
  "diagnostics": {
    "webhookEventsReceived": 5,
    "paymentEventsProcessed": 1,
    "asaasCustomerLinked": true,
    "planExists": true,
    "creditsUpdated": true,
    "issues": []
  }
}
```

**Interpretação**:
- `webhookEventsReceived: 0` → Problema de recebimento.
- `paymentEventsProcessed: 0` → Evento recebido mas não processado.

## Problemas Comuns e Soluções

### Problema 1: Webhook Não Recebido

**Sintomas**: `webhookEventsReceived: 0`, sem logs `[Webhook] Received`.

**Causas e Soluções**:

| Causa | Verificação | Solução |
|-------|-------------|---------|
| Não configurado no Asaas | Dashboard Asaas > Integrações > Webhooks | Crie webhook com URL: `https://seudominio.com/api/webhooks/asaas`. Marque `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`. |
| URL incorreta | URL termina em `/api/webhooks/asaas`? | Atualize para `NEXT_PUBLIC_APP_URL + /api/webhooks/asaas`. Local: use ngrok (`npm run tunnel:ngrok`). |
| Rede bloqueada | Teste `curl -X POST https://seudominio.com/api/webhooks/asaas` | Verifique firewall/Vercel logs. Asaas IP list: [docs.asaas.com](https://docs.asaas.com). |
| Ambiente mismatch | Sandbox vs Produção | Verifique `ASAAS_API_KEY` e `ASAAS_SANDBOX` no `.env`. |

**Exemplo ngrok**:
```bash
npm run tunnel:ngrok
# Copie URL: https://abc123.ngrok.io
# Atualize Asaas webhook e NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Problema 2: Evento Recebido mas Não Processado

**Sintomas**: Eventos totais >0, mas `paymentEventsProcessed: 0`. Logs param em `[Webhook] Received event: PAYMENT_CREATED`.

**Causa**: Evento pendente (e.g., `PAYMENT_CREATED`). Aguarde confirmação.

**Solução**:
- Monitore dashboard Asaas > Pagamentos > Status "Recebido/Confirmado".
- Código filtra eventos: Veja `src/app/api/webhooks/asaas/route.ts` (processa apenas `PAYMENT_RECEIVED`/`CONFIRMED`).

### Problema 3: Usuário ou Plano Não Encontrado

**Sintomas**: Logs: `[Webhook] User not found for cus_xxx` ou `[Plan] not found: plan_xxx`.

**Verificações SQL** (via Prisma Studio ou DB):
```sql
-- Usuário
SELECT id, email, "asaasCustomerId", "asaasCustomerIdSandbox" FROM "User" WHERE "clerkId" = 'user_xxx';

-- Plano
SELECT id, name, credits_granted FROM "Plan" WHERE id = 'plan_pro_monthly';
```

**Solução**:
- Checkout deve setar `asaasCustomerId`: Veja `src/app/api/checkout/route.ts` (~linha 207): `externalReference: planId`.
- Crie plano se ausente: Use `use-admin-plans.ts` ou SQL.

### Problema 4: Créditos Não Atualizados

**Sintomas**: Plano atualizado, mas `credits.balance` baixo.

**Causa**: Falha em `addUserCredits` (`src/lib/credits/validate-credits.ts`).

**Solução**:
- Verifique `use-credits.ts` para `CreditsResponse`.
- Teste manual: `POST /api/credits/add?userId=xxx&credits=1000`.

## Fluxo Completo do Webhook

1. **Checkout**: `src/app/api/checkout/route.ts` → Cria customer/subscription via `AsaasClient` (`src/lib/asaas/client.ts`).
2. **Pagamento**: Usuário paga → Asaas webhook POST `/api/webhooks/asaas`.
3. **Handler**:
   ```typescript
   // src/app/api/webhooks/asaas/route.ts (pseudocódigo)
   import { AsaasClient } from '@/lib/asaas/client';
   import { addUserCredits } from '@/lib/credits/validate-credits';
   
   export async function POST(req) {
     const event = await verifyWebhook(req); // Verifica assinatura
     if (event.type === 'PAYMENT_RECEIVED') {
       const user = await findUserByAsaasCustomer(event.data.customer);
       const planId = event.data.externalReference;
       const plan = await db.plan.findUnique({ id: planId });
       await addUserCredits(user.id, plan.credits_granted);
       log(`Credits updated: ${user.email}`);
     }
   }
   ```
4. **Atualização**: `useSubscription`/`useCredits` refetch em frontend.

## Código Fonte Relacionado

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Cliente Asaas | [src/lib/asaas/client.ts](src/lib/asaas/client.ts) | `AsaasClient` para API/webhooks. |
| Atualização Créditos | [src/lib/credits/validate-credits.ts](src/lib/credits/validate-credits.ts) | `addUserCredits(userId, amount)`. |
| Checkout | [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts) | Cria subscription com `externalReference: planId`. |
| Hooks Créditos | [src/hooks/use-credits.ts](src/hooks/use-credits.ts) | `CreditsResponse` para UI. |
| Planos Admin | [src/hooks/use-admin-plans.ts](src/hooks/use-admin-plans.ts) | Gerencie `Plan`, `ClerkPlan`. |
| Logs | [src/lib/logger.ts](src/lib/logger.ts) | `createLogger('webhook')`. |

## Testes e Ferramentas

### Teste Manual Webhook
```bash
# Simule PAYMENT_RECEIVED (Sandbox)
curl -X POST https://sandbox.asaas.com/api/v3/payments/pay_xxx/confirm \
  -H "access_token: ${ASAAS_API_KEY_SANDBOX}"
```

### Endpoint Interno
- `GET /api/webhooks/asaas/test` (se implementado).
- `POST /api/webhooks/asaas/simulate` com body exemplo.

### Monitoramento
- Vercel Logs: Filtre "Webhook".
- Asaas Dashboard > Webhooks > Histórico.

## Checklist Completo

- [ ] Webhook configurado no Asaas com eventos corretos.
- [ ] `NEXT_PUBLIC_APP_URL` e túnel ativos.
- [ ] Logs mostram recebimento.
- [ ] Debug endpoint: `paymentEventsProcessed > 0`.
- [ ] Asaas pagamento "Confirmado".
- [ ] `asaasCustomerId` linkado no User.
- [ ] Plano existe e tem `credits_granted > 0`.
- [ ] Nenhum erro em `addUserCredits`.
- [ ] Frontend refetch: `useCredits` atualizado.

## Suporte Adicional

Persiste? Forneça:
1. Logs completos (checkout → webhook).
2. Debug JSON.
3. Asaas webhook history.
4. SQL dump de User/Plan/Payment.

Abra issue no repo com esses dados. Veja também [AdminSettings](../hooks/use-admin-settings.ts) para configs globais.
