# Troubleshooting: Créditos não atualizados após pagamento

Este guia ajuda a diagnosticar por que os créditos e plano do usuário não foram atualizados após um pagamento bem-sucedido no Asaas.

## Diagnóstico Rápido

### 1. Verifique se o webhook foi recebido

**Onde verificar**: Logs do servidor

Quando o webhook é recebido, você verá logs assim:

```
[Webhook] Received event: PAYMENT_RECEIVED
[Webhook] Processing for user: user@example.com
[Webhook] Processing PAYMENT_RECEIVED for payment pay_xxx
[Webhook] Credits updated: user@example.com -> 1000 credits from Pro Plan
```

**Se NÃO vir esses logs**, o webhook não está sendo recebido pelo servidor.

### 2. Use o endpoint de debug

Acesse (logado na aplicação):
```
GET http://localhost:3000/api/webhooks/asaas/debug
```

Ou em produção:
```
GET https://seudominio.com/api/webhooks/asaas/debug
```

Isso retorna:
- Informações do usuário
- Créditos atuais
- Plano atual
- **Eventos recebidos** (CRÍTICO: se estiver vazio, nenhum webhook chegou)
- Diagnósticos automáticos

**Exemplo de resposta**:
```json
{
  "user": {
    "email": "user@example.com",
    "asaasCustomerId": "cus_xxx",
    "asaasSubscriptionId": "sub_xxx",
    "currentPlanId": "plan_xxx"
  },
  "creditBalance": {
    "creditsRemaining": 100
  },
  "recentEvents": [
    {
      "eventType": "PAYMENT_CREATED",
      "status": "PENDING",
      "createdAt": "2025-12-09T..."
    }
  ],
  "diagnostics": {
    "hasAsaasCustomer": true,
    "hasSubscription": true,
    "hasPlan": false,  // ❌ Problema!
    "hasCredits": false,  // ❌ Problema!
    "totalEventsReceived": 1,
    "paymentEventsReceived": 0  // ❌ Nenhum evento de pagamento!
  }
}
```

## Problemas Comuns

### Problema 1: Webhook não está sendo recebido

**Sintomas**:
- `totalEventsReceived: 0` no debug endpoint
- Nenhum log `[Webhook] Received event:` no servidor

**Causas possíveis**:

#### A. Webhook não configurado no Asaas
1. Acesse o dashboard Asaas (Sandbox ou Produção)
2. Vá em **Integrações → Webhooks**
3. Verifique se há um webhook configurado
4. URL deve ser: `https://seudominio.com/api/webhooks/asaas`

**Para testes locais com ngrok**:
- URL: `https://xxx.ngrok.io/api/webhooks/asaas`
- Certifique-se que o túnel está **rodando**
- O `NEXT_PUBLIC_APP_URL` deve estar configurado com a URL do túnel

#### B. URL do webhook incorreta
- Verifique se a URL no dashboard termina com `/api/webhooks/asaas`
- Certifique-se que a URL está **acessível** (não localhost se em produção)

#### C. Firewall ou bloqueio de rede
- O Asaas precisa conseguir fazer requisições POST para sua URL
- Verifique se não há firewall bloqueando

**Solução**:
1. Configure o webhook corretamente no dashboard Asaas
2. Para testes locais: `npm run tunnel:cf` ou `npm run tunnel:ngrok`
3. Atualize `NEXT_PUBLIC_APP_URL` no `.env`
4. Reinicie o servidor

### Problema 2: Webhook recebido, mas evento errado

**Sintomas**:
- `totalEventsReceived > 0` mas `paymentEventsReceived: 0`
- Logs mostram `[Webhook] Received event: PAYMENT_CREATED` mas não mostram "Credits updated"

**Causa**: O Asaas enviou evento `PAYMENT_CREATED` mas não `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`

**Por que isso acontece**:
- `PAYMENT_CREATED`: Pagamento foi criado (ainda pendente)
- `PAYMENT_RECEIVED`: Pagamento foi recebido (PIX, boleto pago)
- `PAYMENT_CONFIRMED`: Pagamento foi confirmado (cartão de crédito)

**Solução**:
1. **Aguarde**: Se o pagamento foi feito, o Asaas enviará `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED` quando o pagamento for processado
2. **Verifique no Asaas**: Vá no dashboard e veja se o pagamento está com status "Recebido" ou "Confirmado"
3. **Eventos configurados**: Certifique-se que os eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` estão marcados nas configurações do webhook

### Problema 3: Webhook recebido, mas planId não encontrado

**Sintomas**:
- Logs mostram: `[Webhook] No planId found - subscription: null, externalReference: null`
- `paymentEventsReceived > 0` mas créditos não atualizados

**Causa**: O pagamento não tem informação sobre qual plano foi comprado

**Solução**:
1. Verifique se o checkout está enviando `externalReference` ao criar a assinatura
2. O código em `src/app/api/checkout/route.ts:207` deve estar passando `externalReference: planId`

### Problema 4: planId encontrado, mas plano não existe no banco

**Sintomas**:
- Logs mostram: `[Webhook] Plan not found in database: xxx`

**Causa**: O planId enviado não corresponde a nenhum plano no banco de dados

**Solução**:
1. Verifique se o plano existe:
   ```sql
   SELECT id, name, credits FROM "Plan" WHERE id = 'xxx';
   ```
2. Se não existir, crie o plano ou use um plano existente no checkout

### Problema 5: Usuário não encontrado

**Sintomas**:
- Logs mostram: `[Webhook] User not found for Asaas customer: cus_xxx`

**Causa**: O customer ID do Asaas não está associado a nenhum usuário no banco

**Solução**:
1. Verifique se o usuário foi criado corretamente no checkout
2. Verifique os campos `asaasCustomerId`, `asaasCustomerIdSandbox`, `asaasCustomerIdProduction` no banco:
   ```sql
   SELECT id, email, "asaasCustomerId", "asaasCustomerIdSandbox"
   FROM "User" WHERE "clerkId" = 'xxx';
   ```
3. Certifique-se que o ambiente (Sandbox/Produção) está correto

## Fluxo Esperado (com logs)

### 1. Checkout (criar assinatura)
```
[Asaas] Environment: SANDBOX
[Asaas] API URL: https://sandbox.asaas.com/api/v3
```

### 2. Usuário paga

O usuário completa o pagamento no site do Asaas (PIX, boleto, ou cartão).

### 3. Asaas envia webhook
```
[Webhook] Received event: PAYMENT_RECEIVED
[Webhook] Processing for user: user@example.com
```

### 4. Backend processa e atualiza créditos
```
[Webhook] Processing PAYMENT_RECEIVED for payment pay_xxx
[Webhook] Credits updated: user@example.com -> 1000 credits from Pro Plan
```

## Teste Manual

Se quiser forçar o webhook manualmente para teste:

1. Use o endpoint de teste do Asaas (somente Sandbox):
   ```bash
   curl -X POST https://sandbox.asaas.com/api/v3/subscriptions/{subscriptionId}/payments/{paymentId}/receiveInCash \
     -H "access_token: YOUR_SANDBOX_API_KEY"
   ```

2. Ou use o script de teste interno:
   ```
   GET /api/webhooks/asaas/test
   ```
   (Se existir esse endpoint)

## Checklist de Verificação

Use este checklist para diagnosticar:

- [ ] Webhook configurado no dashboard Asaas
- [ ] URL do webhook está correta e aponta para a URL atual (`/api/webhooks/asaas`)
- [ ] Se usando ngrok/tunnel: URL no Asaas corresponde à URL do túnel ativo
- [ ] `NEXT_PUBLIC_APP_URL` configurado no `.env` com a mesma URL base
- [ ] Eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED` marcados no dashboard
- [ ] Servidor está rodando e acessível
- [ ] Túnel rodando (se em desenvolvimento local)
- [ ] Logs do servidor mostram `[Webhook] Received event:`
- [ ] Debug endpoint mostra `totalEventsReceived > 0`
- [ ] Debug endpoint mostra `paymentEventsReceived > 0`
- [ ] Pagamento está com status "Recebido" ou "Confirmado" no Asaas
- [ ] Plano existe no banco de dados
- [ ] Usuário tem `asaasCustomerId` correto
- [ ] Se usando ngrok free: bypass do "You are about to visit" foi feito

## Suporte

Se após seguir este guia o problema persistir:

1. Copie os logs completos do servidor (do checkout até o webhook)
2. Copie a resposta do `/api/webhooks/asaas/debug`
3. Verifique o histórico de webhooks no dashboard do Asaas
4. Abra uma issue com essas informações
