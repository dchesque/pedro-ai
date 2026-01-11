# Documentação da API

## Visão Geral

A API é construída com as API Routes do Next.js App Router, fornecendo endpoints RESTful para a aplicação SaaS. Todos os endpoints (exceto os públicos) são protegidos com autenticação do Clerk e seguem padrões consistentes para tratamento de erros, validação e respostas.

## URL Base

- **Desenvolvimento Local**: `http://localhost:3000/api`
- **Produção**: `https://seudominio.com/api`

## Webhooks

### POST /api/webhooks/clerk
Processa eventos de webhook do Clerk (verificados via Svix) para o ciclo de vida do usuário.

- **Eventos Tratados**:
  - `user.created` / `user.updated`: Sincroniza os dados do usuário (e-mail, nome) e garante que um registro de saldo de créditos (`CreditBalance`) seja criado.
  - `user.deleted`: Remove o usuário e seus dados associados no banco de dados local.

- **Segurança**:
  - Garanta que a variável de ambiente `CLERK_WEBHOOK_SECRET` esteja configurada para verificar as assinaturas das requisições.

### POST /api/webhooks/asaas
Processa webhooks do Asaas para eventos de pagamento.

- **Eventos Tratados**:
  - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`: Confirma o pagamento de uma assinatura, atualiza o status da assinatura do usuário e libera os créditos correspondentes ao plano adquirido.
  - Outros eventos de faturamento (estorno, etc.) podem ser adicionados para maior robustez.

- **Segurança**:
  - O endpoint verifica a autenticidade da requisição usando um token secreto (`ASAAS_WEBHOOK_SECRET`).

## Autenticação

Todos os endpoints da API (exceto os públicos) exigem autenticação via tokens JWT do Clerk.

### Cabeçalho de Autorização
```bash
Authorization: Bearer <clerk_jwt_token>
```

## Formato Padrão de Resposta

### Resposta de Sucesso
```json
{
  "data": { /* dados da resposta */ },
  "success": true
}
```

### Resposta de Erro
```json
{
  "error": "Mensagem de erro",
  "success": false,
  "code": "CODIGO_DE_ERRO_OPCIONAL"
}
```

## Endpoints da API

### Health Check

#### GET /api/health
Verifica o status da API e a conexão com o banco de dados.
- **Autenticação**: Não requerida.

### Gerenciamento de Usuário

#### GET /api/users/me
Obtém as informações do usuário logado.
- **Autenticação**: Requerida.

#### PUT /api/users/me
Atualiza as informações do usuário logado.
- **Autenticação**: Requerida.

### Sistema de Créditos

#### GET /api/credits/me
Obtém o saldo de créditos do usuário atual.
- **Autenticação**: Requerida.

#### GET /api/credits/settings
Endpoint público que retorna os custos efetivos das funcionalidades para a UI.
- **Autenticação**: Não requerida.
- **Resposta**:
  ```json
  {
    "featureCosts": { "ai_text_chat": 1, "ai_image_generation": 5 }
  }
  ```

### Sincronização de Administrador

#### POST /api/admin/users/sync
Sincroniza usuários do Clerk para o banco de dados local. Útil para popular o banco ou como backup para falhas de webhook.
- **Autenticação**: Administrador.
- **Corpo da Requisição**:
  ```json
  {
    "syncUsers": true,
    "pageSize": 100,
    "maxPages": 50
  }
  ```
- **Comportamento**:
  - Cria ou atualiza registros de `User` e garante que um `CreditBalance` com 0 créditos exista para cada um.

### Configurações de Administrador

#### GET /api/admin/settings
Retorna as configurações de custos de créditos.
- **Autenticação**: Administrador.
- **Resposta**:
  ```json
  {
    "featureCosts": { "ai_text_chat": 1, "ai_image_generation": 5 }
  }
  ```

#### PUT /api/admin/settings
Atualiza os custos em créditos das funcionalidades.
- **Autenticação**: Administrador.
- **Corpo da Requisição**:
  ```json
  {
    "featureCosts": { "ai_text_chat": 2 }
  }
  ```

### Gerenciamento de Planos (Admin)

#### GET /api/admin/plans
Lista todos os planos de assinatura criados.
- **Autenticação**: Administrador.

#### POST /api/admin/plans
Cria um novo plano de assinatura.
- **Autenticação**: Administrador.

#### PUT /api/admin/plans/:id
Atualiza um plano de assinatura existente.
- **Autenticação**: Administrador.

#### DELETE /api/admin/plans/:id
Remove um plano de assinatura.
- **Autenticação**: Administrador.

### IA (Inteligência Artificial)

#### POST /api/ai/chat
Envia mensagens para LLMs via Vercel AI SDK, com respostas em streaming.
- **Autenticação**: Requerida.
- **Créditos**: O custo da operação (`ai_text_chat`) é debitado do saldo do usuário.

#### POST /api/ai/image
Gera imagens usando provedores como o OpenRouter.
- **Autenticação**: Requerida.
- **Créditos**: O custo (`ai_image_generation`) é debitado por imagem solicitada.
