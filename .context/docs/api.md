# Documentação da API

## Visão Geral

A API é construída com [API Routes do Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), fornecendo endpoints RESTful para a aplicação SaaS de geração de vídeos curtos com IA (shorts, roteiros, personagens, estilos visuais, agentes, climas e tons). Todos os endpoints protegidos usam autenticação JWT do [Clerk](https://clerk.com), com validação centralizada via [`validateUserAuthentication`](src/lib/auth-utils.ts). Erros são padronizados com [`ApiError`](src/lib/api-client.ts).

- **Autenticação**: Obrigatória para endpoints não-públicos via `Authorization: Bearer <clerk_jwt_token>`.
- **Validação**: Usa Zod para bodies e queries.
- **Rate Limiting & Créditos**: Operações custam créditos (ex: `ai_text_chat: 1 crédito`). Veja [`src/lib/credits/`](src/lib/credits/) para lógica de débito ([`deduct.ts`](src/lib/credits/deduct.ts)) e validação ([`validate-credits.ts`](src/lib/credits/validate-credits.ts)).
- **Logging**: Todos os requests são logados via [`createLogger`](src/lib/logger.ts).
- **Admin**: Endpoints `/api/admin/*` requerem [`requireAdmin`](src/lib/admin.ts).
- **Cache**: Usa [`SimpleCache`](src/lib/cache.ts).
- **Armazenamento**: Suporta Vercel Blob ([`VercelBlobStorage`](src/lib/storage/vercel-blob.ts)) e Replit ([`ReplitAppStorage`](src/lib/storage/replit.ts)).
- **Cliente Frontend**: Use [`apiClient`](src/lib/api-client.ts) ou hooks como [`useShorts`](src/hooks/use-shorts.ts).

**URL Base**:
- Dev: `http://localhost:3000/api`
- Prod: `https://seudominio.com/api`

**Headers Comuns**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

## Formato de Respostas

### Sucesso
```json
{
  "success": true,
  "data": { /* dados */ }
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem detalhada",
  "code": "INSUFFICIENT_CREDITS" // Opcional
}
```

Erros comuns:
| Code                  | Descrição                  | Referência |
|-----------------------|----------------------------|------------|
| `INSUFFICIENT_CREDITS` | Saldo insuficiente        | [`InsufficientCreditsError`](src/lib/credits/errors.ts) |
| `INVALID_API_KEY`     | Token inválido            | [`validateApiKey`](src/lib/api-auth.ts) |
| `NOT_ADMIN`           | Acesso negado             | [`requireAdmin`](src/lib/admin.ts) |
| `API_ERROR`           | Erro genérico da API      | [`ApiError`](src/lib/api-client.ts) |

**Exemplo com `apiClient`**:
```ts
import { apiClient } from '@/lib/api-client';

const response = await apiClient.get('/shorts');
const shorts = response.data; // Short[]
```

## Webhooks

### POST /api/webhooks/clerk
Processa eventos do Clerk (verificados via Svix). Veja [`src/lib/auth-utils.ts`](src/lib/auth-utils.ts).

**Eventos suportados**:
- `user.created`/`user.updated`: Cria/atualiza `User` e [`CreditBalance`](src/lib/credits/) (0 créditos iniciais via [`getUserFromClerkId`](src/lib/auth-utils.ts)).
- `user.deleted`: Deleta usuário e dados associados.

**Segurança**: `CLERK_WEBHOOK_SECRET`.

**Exemplo Payload** (`user.created`):
```json
{
  "type": "user.created",
  "data": {
    "id": "user_123",
    "email_addresses": [{ "email_address": "user@example.com" }]
  }
}
```

### POST /api/webhooks/asaas
Processa pagamentos Asaas via [`AsaasClient`](src/lib/asaas/client.ts).

**Eventos suportados**:
- `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`: Ativa assinatura, adiciona créditos via [`addUserCredits`](src/lib/credits/validate-credits.ts).

**Segurança**: `ASAAS_WEBHOOK_SECRET`.

**Exemplo**:
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_123",
    "value": 99.90,
    "customer": "cus_456"
  }
}
```

## Endpoints Públicos (Sem Auth)

### GET /api/health
Verifica status da API e conexão com Prisma.

**Resposta**:
```json
{
  "success": true,
  "data": { "status": "ok", "db": "connected" }
}
```

### GET /api/credits/settings
Configurações de custos de features para pricing UI ([`AdminSettingsPayload`](src/lib/credits/settings.ts), [`use-admin-settings`](src/hooks/use-admin-settings.ts)).

**Resposta**:
```json
{
  "success": true,
  "data": {
    "featureCosts": {
      "ai_text_chat": 1,
      "ai_image_generation": 5,
      "short_script": 10
    }
  }
}
```

### GET /api/plans/public
Planos públicos para visitantes ([`PublicPlan[]`](src/hooks/use-public-plans.ts)).

## Usuários

### GET /api/users/me
Dados do usuário logado (sincronizado com Clerk).

### PUT /api/users/me
Atualiza perfil.

**Body**:
```json
{ "name": "Novo Nome" }
```

## Créditos & Uso

### GET /api/credits/me
Saldo atual ([`CreditData`](src/hooks/use-credits.ts)).

**Resposta**:
```json
{
  "success": true,
  "data": {
    "balance": 100,
    "features": { "ai_text_chat": { "used": 5, "limit": null } }
  }
}
```

### GET /api/usage
Resumo de uso ([`UsageData`](src/hooks/use-usage.ts), [`useUsage`](src/hooks/use-usage.ts)).

**Query**: `?page=1&limit=20`

### GET /api/usage/history
Histórico detalhado ([`UsageHistoryResponse`](src/hooks/use-usage-history.ts), [`useUsageHistory`](src/hooks/use-usage-history.ts)).

## Assinaturas

### GET /api/subscription
Status da assinatura ([`SubscriptionStatus`](src/hooks/use-subscription.ts), [`useSubscription`](src/hooks/use-subscription.ts)).

## Dashboard

### GET /api/dashboard
Estatísticas gerais ([`DashboardStats`](src/hooks/use-dashboard.ts)).

## Tons ([`use-tones.ts`](src/hooks/use-tones.ts))

### GET /api/tones
Lista tons ([`Tone[]`](src/hooks/use-tones.ts)).

### POST /api/tones
Cria tom ([`useCreateTone`](src/hooks/use-tones.ts)).

### PATCH /api/tones/:id
Atualiza ([`useUpdateTone`](src/hooks/use-tones.ts)).

### DELETE /api/tones/:id
Remove ([`useDeleteTone`](src/hooks/use-tones.ts)).

## Climates ([`use-climates.ts`](src/hooks/use-climates.ts))

### GET /api/climates
Lista climas ([`Climate[]`](src/hooks/use-climates.ts)).

**Relacionados**:
- Melhoria de texto: Usa `buildClimatePrompt` ([`behavior-mapping.ts`](src/lib/climate/behavior-mapping.ts)).
- [`use-improve-climate-text`](src/hooks/use-improve-climate-text.ts): `ImproveClimateTextRequest` -> `ImproveClimateTextResponse`.

## Personagens ([`use-characters.ts`](src/hooks/use-characters.ts))

### GET /api/characters
Lista personagens ([`CharacterPromptData[]`](src/lib/characters/types.ts)).

### POST /api/characters
Cria ([`CreateCharacterInput`](src/hooks/use-characters.ts)).

**Body**:
```json
{
  "name": "João",
  "traits": ["alto", "cabelo preto"],
  "description": "Personagem principal"
}
```

### PATCH /api/characters/:id
Atualiza ([`UpdateCharacterInput`](src/hooks/use-characters.ts)).

**Limites**: [`canCreateCharacter`](src/lib/characters/limits.ts).

**Análise de Imagem**: [`analyzeCharacterImage`](src/lib/characters/prompt-generator.ts).

## Estilos Visuais ([`use-styles.ts`](src/hooks/use-styles.ts))

### GET /api/styles
Lista estilos ([`Style[]`](src/hooks/use-styles.ts), tipos como [`ContentType`](src/types/style.ts)).

### POST /api/styles
Cria ([`useCreateStyle`](src/hooks/use-styles.ts)).

### PATCH /api/styles/:id
Atualiza ([`useUpdateStyle`](src/hooks/use-styles.ts)).

### DELETE /api/styles/:id
Remove ([`useDeleteStyle`](src/hooks/use-styles.ts)).

### POST /api/styles/:id/duplicate
Duplica ([`useDuplicateStyle`](src/hooks/use-styles.ts)).

## Shorts (Vídeos Curtos) ([`use-shorts.ts`](src/hooks/use-shorts.ts), [`pipeline.ts`](src/lib/shorts/pipeline.ts))

Gerencia shorts: roteiro ([`approveScript`](src/lib/shorts/pipeline.ts)), cenas ([`addScene`](src/lib/shorts/pipeline.ts)), mídia.

### GET /api/shorts
Lista ([`Short[]`](src/hooks/use-shorts.ts), [`ShortScene`](src/hooks/use-shorts.ts)).

### GET /api/shorts/:id
Detalhes ([`Short`](src/hooks/use-shorts.ts)).

### POST /api/shorts
Cria ([`CreateShortInput`](src/hooks/use-shorts.ts)).

**Body**:
```json
{
  "title": "Meu Short",
  "characters": [{ "id": "char_123" }],
  "styleId": "style_456"
}
```

### PATCH /api/shorts/:id
Atualiza ([`useUpdateShort`](src/hooks/use-shorts.ts)).

### POST /api/shorts/:id/script
Gera roteiro ([`useGenerateScript`](src/hooks/use-shorts.ts)).

### POST /api/shorts/:id/script/regenerate
Regenera ([`useRegenerateScript`](src/hooks/use-shorts.ts)).

### POST /api/shorts/:id/approve-script
Aprova ([`useApproveScript`](src/hooks/use-shorts.ts)).

### POST /api/shorts/:id/media
Gera mídia para cenas.

### POST /api/shorts/:id/scenes
Adiciona cena.

### PATCH /api/shorts/:id/scenes/:sceneId
Atualiza cena.

### DELETE /api/shorts/:id/scenes/:sceneId
Remove cena.

### PATCH /api/shorts/:id/scenes/reorder
Reordena cenas.

### POST /api/shorts/:id/regenerate
Regenera short inteiro ([`useRegenerateShort`](src/hooks/use-shorts.ts)).

**Personagens**: POST/PATCH/DELETE `/api/shorts/:id/characters` ([`AddCharacterInput`](src/hooks/use-short-characters.ts), [`canAddCharacterToShort`](src/lib/characters/limits.ts)).

**Integração Roteirista**: Usa [`AIAction`](src/lib/roteirista/types.ts), [`AIAssistantRequest`](src/lib/roteirista/types.ts), [`WizardStep`](src/lib/roteirista/types.ts).

## Armazenamento ([`use-storage.ts`](src/hooks/use-storage.ts), [`src/lib/storage/`](src/lib/storage/))

### GET /api/storage
Lista itens ([`StorageItem[]`](src/hooks/use-storage.ts), [`StorageProviderType`](src/lib/storage/types.ts)).

### DELETE /api/storage/:id
Remove ([`useDeleteStorageItem`](src/hooks/use-storage.ts)).

**Upload**: Via providers ([`UploadResult`](src/lib/storage/types.ts), [`UploadOptions`](src/lib/storage/types.ts)).

## IA & Modelos ([`src/hooks/use-ai-*.ts`](src/hooks/), [`src/lib/ai/`](src/lib/ai/))

### GET /api/ai/models
Modelos disponíveis ([`AIModel[]`](src/hooks/use-available-models.ts)).

### GET /api/ai/providers/openrouter/models
Modelos OpenRouter ([`OpenRouterModelsResponse`](src/hooks/use-openrouter-models.ts)).

### POST /api/ai/chat
Chat com streaming (Vercel AI SDK, custo `ai_text_chat`).

**Body**:
```json
{
  "messages": [{ "role": "user", "content": "Olá!" }],
  "model": "gpt-4o-mini"
}
```

### POST /api/ai/image
Gera imagem ([`GenerateImageParams`](src/hooks/use-ai-image.ts) -> [`GenerateImageResponse`](src/hooks/use-ai-image.ts)).

### POST /api/ai/video
Gera vídeo (Fal/Kling/Flux via [`OpenRouterAdapter`](src/lib/ai/providers/openrouter-adapter.ts), [`FalAdapter`](src/lib/ai/providers/fal-adapter.ts), [`use-fal-generation`](src/hooks/use-fal-generation.ts)).

**Body** (`GenerateVideoInput`/`GenerateImageInput`):
```json
{
  "prompt": "Cena de ação",
  "provider": "fal",
  "model": "kling"
}
```

**Resposta** (`GenerateVideoOutput`):
```json
{
  "success": true,
  "data": { "url": "https://...", "duration": 5 }
}
```

**Providers**: [`ProviderType`](src/lib/ai/providers/types.ts), [`ProviderCapability`](src/lib/ai/providers/types.ts), registry em [`registry.ts`](src/lib/ai/providers/registry.ts).

## Agents ([`use-agents.ts`](src/hooks/use-agents.ts), [`src/lib/agents/`](src/lib/agents/))

### GET /api/agents
Lista agents ([`Agent[]`](src/hooks/use-agents.ts)).

### POST /api/agents/:id/execute
Executa agent ([`AgentQuestion`](src/hooks/use-agents.ts), [`AgentOutputField`](src/hooks/use-agents.ts), [`AgentExecutionResult`](src/lib/agents/agent-executor.ts)).

Relacionados: [`scriptwriter.ts`](src/lib/agents/scriptwriter.ts), [`prompt-engineer.ts`](src/lib/agents/prompt-engineer.ts), [`resolver.ts`](src/lib/agents/resolver.ts).

## Admin

### GET /api/admin/settings
Configurações ([`AdminSettings`](src/hooks/use-admin-settings.ts)).

### PUT /api/admin/settings
Atualiza custos ([`AdminSettingsPayload`](src/lib/credits/settings.ts)).

### GET /api/admin/plans
Planos ([`PlansResponse`](src/hooks/use-admin-plans.ts), [`ClerkPlanNormalized`](src/lib/clerk/commerce-plan-types.ts)).

### POST /api/admin/plans
Cria ([`BillingPlan`](src/components/admin/plans/types.ts)).

### PATCH /api/admin/plans/:id
Atualiza.

### DELETE /api/admin/plans/:id
Remove.

### GET /api/admin/models
Modelos custom ([`ModelsResponse`](src/hooks/use-admin-models.ts), [`LLMFeatureKey`](src/lib/ai/models-config.ts)).

### POST /api/admin/users/sync
Sincroniza usuários Clerk.

**Body**:
```json
{ "syncUsers": true, "pageSize": 100 }
```

**Dev Tools**: [`AdminDevModeProvider`](src/contexts/admin-dev-mode.tsx).

## Desenvolvimento & Debugging

- **Logs**: Ative [`isApiLoggingEnabled`](src/lib/logger.ts).
- **Ambiente**: Verifique [`ClerkEnvKey`](src/lib/onboarding/env-check.ts).
- **Exemplos de Uso**: Veja componentes como [`CreateShortForm.tsx`](src/components/shorts/CreateShortForm.tsx), [`ScriptWizard.tsx`](src/components/roteirista/ScriptWizard.tsx).
- **Tests**: Usage em hooks e lib functions.
- **Brand Config**: [`AnalyticsConfig`](src/lib/brand-config.ts).

Para detalhes de tipos, consulte hooks e `src/types/`. Contribua via PRs em `app/api/`.
