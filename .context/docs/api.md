# Documentação da API

## Visão Geral

A API é construída com [API Routes do Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), fornecendo endpoints RESTful para a aplicação SaaS de geração de vídeos curtos com IA (shorts, roteiros, personagens, estilos visuais). Todos os endpoints protegidos usam autenticação JWT do [Clerk](https://clerk.com), com validação centralizada via `validateUserAuthentication` (`src/lib/auth-utils.ts`). Erros são padronizados com `ApiError` (`src/lib/api-client.ts`).

- **Autenticação**: Obrigatória para endpoints não-públicos via `Authorization: Bearer <clerk_jwt_token>`.
- **Validação**: Usa Zod para bodies e queries.
- **Rate Limiting & Créditos**: Operações custam créditos (ex: `ai_text_chat: 1 crédito`). Veja `src/lib/credits/` para lógica de débito (`deduct.ts`).
- **Logging**: Todos os requests são logados via `createLogger` (`src/lib/logger.ts`).
- **Admin**: Endpoints `/api/admin/*` requerem `requireAdmin` (`src/lib/admin.ts`).
- **Cliente Frontend**: Use `apiClient` (`src/lib/api-client.ts`) ou hooks como `useShorts` (`src/hooks/use-shorts.ts`).

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
Erros comuns: `ApiError`, `InsufficientCreditsError` (`src/lib/credits/errors.ts`).

## Webhooks

### POST /api/webhooks/clerk
Processa eventos do Clerk (verificados via Svix).

**Eventos**:
- `user.created`/`user.updated`: Cria/atualiza `User` e `CreditBalance` (0 créditos iniciais).
- `user.deleted`: Deleta usuário e dados associados.

**Segurança**: `CLERK_WEBHOOK_SECRET`.

**Exemplo Payload** (evento `user.created`):
```json
{
  "type": "user.created",
  "data": { "id": "user_123", "email_addresses": [{ "email_address": "user@example.com" }] }
}
```

### POST /api/webhooks/asaas
Processa pagamentos Asaas.

**Eventos**:
- `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`: Ativa assinatura, adiciona créditos via `addUserCredits` (`src/lib/credits/validate-credits.ts`).

**Segurança**: `ASAAS_WEBHOOK_SECRET`.

**Exemplo**:
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": { "id": "pay_123", "value": 99.90, "customer": "cus_456" }
}
```

## Endpoints Públicos (Sem Auth)

### GET /api/health
Status da API e Prisma.

**Resposta**:
```json
{
  "success": true,
  "data": { "status": "ok", "db": "connected" }
}
```

### GET /api/credits/settings
Custos de features para UI de pricing.

**Resposta**:
```json
{
  "success": true,
  "data": {
    "featureCosts": { "ai_text_chat": 1, "ai_image_generation": 5, "short_script": 10 }
  }
}
```

## Usuários

### GET /api/users/me
Dados do usuário logado (sync com Clerk).

### PUT /api/users/me
Atualiza perfil.

**Body**:
```json
{ "name": "Novo Nome" }
```

## Créditos & Uso

### GET /api/credits/me
Saldo atual (`CreditData`).

**Resposta**:
```json
{
  "success": true,
  "data": { "balance": 100, "features": { "ai_text_chat": { "used": 5, "limit": null } } }
}
```

### GET /api/usage
Histórico de uso (`UsageData`, `useUsage`).

**Query**: `?page=1&limit=20`

### GET /api/usage/history
Uso detalhado (`UsageHistoryResponse`, `useUsageHistory`).

## Assinaturas

### GET /api/subscription
Status da sub (`SubscriptionStatus`, `useSubscription`).

## Dashboard

### GET /api/dashboard
Estatísticas (`DashboardStats`, `useDashboard`).

## Personagens (`src/hooks/use-characters.ts`)

### GET /api/characters
Lista personagens (`CharacterPromptData[]`).

### POST /api/characters
Cria personagem (`CreateCharacterInput`).

**Body**:
```json
{
  "name": "João",
  "traits": ["alto", "cabelo preto"],
  "description": "Personagem principal"
}
```

### PATCH /api/characters/:id
Atualiza (`UpdateCharacterInput`).

**Limites**: `canCreateCharacter` (`src/lib/characters/limits.ts`).

## Estilos Visuais (`src/hooks/use-styles.ts`)

### GET /api/styles
Lista estilos (`Style[]`, `ContentType`).

### POST /api/styles
Cria (`useCreateStyle`).

### PATCH /api/styles/:id
Atualiza (`useUpdateStyle`).

### DELETE /api/styles/:id
Remove (`useDeleteStyle`).

### POST /api/styles/:id/duplicate
Duplica (`useDuplicateStyle`).

## Shorts (Vídeos Curtos) (`src/hooks/use-shorts.ts`, `src/lib/shorts/pipeline.ts`)

Gerencia criação de shorts: roteiro (`approveScript`), cenas (`addScene`), mídia (`generateMedia`).

### GET /api/shorts
Lista (`Short[]`, `ShortScene`).

### GET /api/shorts/:id
Detalhes (`Short`).

### POST /api/shorts
Cria (`CreateShortInput`).

**Body**:
```json
{
  "title": "Meu Short",
  "characters": [{ "id": "char_123" }],
  "styleId": "style_456"
}
```

### PATCH /api/shorts/:id
Atualiza título/status.

### POST /api/shorts/:id/script
Gera/regenera roteiro (`useGenerateScript`/`useRegenerateScript`).

### POST /api/shorts/:id/approve-script
Aprova (`useApproveScript`, `approveScript`).

### POST /api/shorts/:id/media
Gera imagens/vídeos cenas (`useGenerateMedia`).

### POST /api/shorts/:id/scenes
Adiciona cena (`useAddScene`, `addScene`).

### PATCH /api/shorts/:id/scenes/:sceneId
Atualiza cena (`useUpdateScene`).

### DELETE /api/shorts/:id/scenes/:sceneId
Remove (`useRemoveScene`).

### PATCH /api/shorts/:id/scenes/reorder
Reordena (`useReorderScenes`).

### POST /api/shorts/:id/scenes/:sceneId/regenerate
Regenera cena (`useRegenerateScene`).

### POST /api/shorts/:id/scenes/:sceneId/image/regenerate
Regenera imagem (`useRegenerateSceneImage`).

**Personagens em Short**: POST/PUT/DELETE `/api/shorts/:id/characters` (`AddCharacterInput`, `canAddCharacterToShort`).

**Roteirista Integrado**: Usa `AIAssistantRequest`/`GenerateScenesResponse` (`src/lib/roteirista/types.ts`).

## Armazenamento (`src/hooks/use-storage.ts`, `src/lib/storage/`)

### GET /api/storage
Lista arquivos (`StorageItem[]`, provedores: VercelBlob, Replit).

### DELETE /api/storage/:id
Remove (`useDeleteStorageItem`).

**Upload**: Via `StorageProvider` (`upload` method).

## IA & Modelos (`src/hooks/use-ai-*.ts`, `src/lib/ai/`)

### POST /api/ai/chat
Chat streaming (Vercel AI SDK, `ai_text_chat` custo).

**Body**:
```json
{
  "messages": [{ "role": "user", "content": "Olá!" }],
  "model": "gpt-4o-mini"
}
```

### POST /api/ai/image
Gera imagem (`GenerateImageParams` -> `GenerateImageResponse`).

### POST /api/ai/video
Gera vídeo (Flux/Kling via Fal/OpenRouter, `use-fal-generation`).

**Body** (`GenerateVideoInput`):
```json
{
  "prompt": "Cena de ação",
  "provider": "fal",
  "model": "kling"
}
```

### GET /api/ai/models
Modelos disponíveis (`AIModel[]`, `use-available-models`).

### GET /api/ai/providers/openrouter/models
Modelos OpenRouter (`OpenRouterModelsResponse`).

## Admin

### POST /api/admin/users/sync
Sync Clerk users (`getUserFromClerkId`).

**Body**:
```json
{ "syncUsers": true, "pageSize": 100 }
```

### GET /api/admin/settings
Config de créditos (`AdminSettings`, `AdminSettingsPayload`).

### PUT /api/admin/settings
Atualiza custos.

### GET /api/admin/plans
Planos (`PlansResponse`, `ClerkPlanNormalized`).

### POST /api/admin/plans
Cria (`BillingPlan`).

### PATCH /api/admin/plans/:id
Atualiza.

### DELETE /api/admin/plans/:id
Remove.

### GET /api/admin/models
Modelos custom (`use-admin-models`).

## Desenvolvimento & Debugging

- **Logs**: Ative `isApiLoggingEnabled` para traces.
- **Cache**: `SimpleCache` (`src/lib/cache.ts`).
- **Testes**: Veja usage em `src/components/shorts/CreateShortForm.tsx`.
- **Erros Comuns**:
  | Code | Descrição |
  |------|-----------|
  | INSUFFICIENT_CREDITS | Saldo insuficiente |
  | INVALID_API_KEY | Token inválido |
  | NOT_ADMIN | Acesso negado |

**Exemplo com apiClient**:
```ts
import { apiClient } from '@/lib/api-client';

const shorts = await apiClient.get('/shorts');
```

Para mais detalhes, consulte hooks (ex: `useShorts`) e tipos (ex: `Short`). Contribua via PRs em rotas `app/api/`.
