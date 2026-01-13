# Plano de Implementação - Sistema de Agents v1.0

Este plano descreve as etapas para implementar o Sistema de Agents v1.0, conforme solicitado.

## Fase 1: Database (Prisma)
- [ ] Renomear o enum `AgentType` atual para `SystemAgentType` em `prisma/schema.prisma`.
- [ ] Atualizar os modelos `GlobalAgent` e `UserAgent` para usar `SystemAgentType`.
- [ ] Criar o novo enum `AgentType` com os valores: `CLIMATE`, `STYLE`, `CUSTOM`.
- [ ] Criar o novo modelo `Agent` com os campos especificados:
    - `id`, `name`, `slug`, `description`, `icon`, `type`, `systemMessage`, `questions`, `outputFields`, `validationRules`, `model`, `creditsPerUse`, `isActive`, `createdAt`, `updatedAt`.
- [ ] Executar migration: `npx prisma migrate dev --name add_agents_system`.
- [ ] Criar script de seed: `scripts/seed-agents.js`.
- [ ] Atualizar `package.json` para incluir o seed dos agents.

## Fase 2: Backend (APIs)
- [ ] Criar logic de execução em `src/lib/agents/agent-executor.ts`.
- [ ] Implementar APIs Públicas:
    - `GET /api/agents`
    - `GET /api/agents/[slug]`
    - `POST /api/agents/[slug]/execute`
- [ ] Implementar APIs Admin:
    - `GET /api/admin/agents`
    - `GET /api/admin/agents/[id]`
    - `PUT /api/admin/agents/[id]`
- [ ] Atualizar `POST /api/climates` e `POST /api/styles` para suportar criação via agent.

## Fase 3: Frontend (Usuário)
- [ ] Adicionar menu "Agents" na Sidebar.
- [ ] Criar página de listagem: `src/app/(protected)/agents/page.tsx`.
- [ ] Criar página do agent (perguntas e output): `src/app/(protected)/agents/[slug]/page.tsx`.
- [ ] Criar componente `CreateFromAgentModal`.
- [ ] Criar hook `useAgents` em `src/hooks/use-agents.ts`.

## Fase 4: Frontend (Admin)
- [ ] Adicionar menu "Agents" na Sidebar Admin.
- [ ] Criar página de listagem Admin: `src/app/(protected)/admin/agents/page.tsx`.
- [ ] Criar página de edição Admin: `src/app/(protected)/admin/agents/[id]/page.tsx`.

## Validação e Finalização
- [ ] Realizar testes de ponta a ponta.
- [ ] Atualizar documentação em `.context/docs/`.
- [ ] Gerar changelog e commit.

---
**Observação sobre AgentType:** Para seguir o prompt fielmente sem quebrar o sistema existente (GlobalAgent/UserAgent), optou-se por renomear o enum anterior para `SystemAgentType` e criar o novo `AgentType` conforme solicitado.
