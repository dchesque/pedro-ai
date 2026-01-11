# Painel de Administração

Visão geral das rotas e funcionalidades administrativas do aplicativo.

## Acesso
- **URL**: `/admin`
- O acesso é protegido por um SSR guard no layout (`src/app/admin/layout.tsx`) e um `middleware`.
- **Configuração no `.env`**:
  - Pelo menos uma das seguintes variáveis deve ser configurada para permitir o acesso:
  - `ADMIN_EMAILS=admin@seudominio.com,ops@seudominio.com`
  - ou `ADMIN_USER_IDS=usr_123,usr_456` (IDs de usuário do Clerk)

## Pré-requisitos
- **Clerk**:
    - `CLERK_SECRET_KEY` deve ser configurada para acesso à API do Clerk.
    - O sistema de convites (`Invitations`) e o envio de e-mails devem estar habilitados no painel do Clerk.
    - O redirect para `${NEXT_PUBLIC_APP_URL}/sign-up` deve ser permitido.
- **Asaas**:
    - `ASAAS_API_KEY` deve ser configurada para processar pagamentos.

## Funcionalidades Principais

### Usuários
- **Listagem e Gerenciamento**: Visualize todos os usuários, seus saldos de créditos e consumo.
- **Ajuste de Créditos**: Modifique o saldo de créditos de um usuário manualmente.
- **Exclusão**: Remova um usuário, o que também apaga seu histórico de uso e saldo.

### Configurações (`/admin/settings`)
O painel de configurações é dividido em abas:

- **Custos por Funcionalidade**:
  - Edite o custo em créditos para usar funcionalidades específicas, como `ai_text_chat` e `ai_image_generation`.
- **Planos de Assinatura**:
  - **Gerenciamento Manual**: Crie, edite e remova planos de assinatura diretamente no painel.
  - **Campos**: Defina nome, créditos mensais, preços (mensal/anual), e se o plano está ativo.
  - **Integração com Asaas**: Associe um plano a um link de checkout do Asaas para automatizar pagamentos.

### Storage
- **Navegação**: Explore os arquivos enviados pelos usuários.
- **Busca**: Pesquise arquivos por nome, tipo, URL ou usuário.
- **Gerenciamento**: Abra ou exclua arquivos (a exclusão remove o registro no banco e tenta apagar o arquivo no provedor de storage).

### Convites
- **Enviar Convite**: Convide novos usuários por e-mail.
- **Visualização**: Monitore convites pendentes.
- **Gerenciamento**: Reenvie ou revogue convites.

### Sincronização
- **Sincronização de Usuários**:
  - Ferramenta para sicronizar usuários do Clerk para o banco de dados local.
  - Útil como backup caso os webhooks de criação de usuário falhem.
  - Garante que cada usuário tenha um registro de `CreditBalance` (saldo de créditos) inicializado.

## APIs de Administração
A maioria das APIs de administração valida se o chamador é um administrador no servidor.

- `POST /api/admin/users/invite`
  - Body: `{ email: string, name?: string }`
  - Envia um convite via Clerk. Se o usuário já existir, apenas garante que ele está no banco de dados local.
- `GET /api/admin/users/invitations`
  - Lista os convites pendentes.
- `POST /api/admin/users/invitations/:id/resend` e `POST /api/admin/users/invitations/:id/revoke`
  - Reenvia e revoga convites.
- `POST /api/admin/users/sync`
  - Inicia a sincronização de usuários do Clerk.
- `PUT /api/admin/users/:id/credits`
  - Ajusta o saldo de créditos de um usuário específico.
- `GET /api/admin/storage`
  - Lista os arquivos enviados.
- `DELETE /api/admin/storage/:id`
  - Exclui um arquivo.
- `GET /api/admin/settings`
  - Retorna as configurações atuais, incluindo custos de features e planos.
- `PUT /api/admin/settings`
  - Atualiza as configurações de custos de features.
- `GET /api/admin/plans`
  - Lista todos os planos de assinatura.
- `POST /api/admin/plans`
  - Cria um novo plano de assinatura.
- `PUT /api/admin/plans/:id`
  - Atualiza um plano existente.
- `DELETE /api/admin/plans/:id`
  - Remove um plano.

## Estrutura da Interface
- **Páginas**: `src/app/admin/*`
- **Notificações**: O sistema usa "toasts" para feedback de operações como convites, ajustes e sincronização.
- **Proteção de Rota**: Um SSR guard em `src/app/admin/layout.tsx` impede que não-administradores vejam o conteúdo do painel.
