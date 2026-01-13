# Changelog - Agents System v1.0 (2026-01-13)

## [1.1.0] - 2026-01-13

### Added
- **Sistema de Agents v1.0**: Uma nova funcionalidade que permite aos usuários criar configurações complexas de Clima e Estilo através de assistentes interativos baseados em IA.
- **Novos Modelos de Dados**: Implementação do modelo `Agent` no Prisma com suporte a campos flexíveis (`questions`, `outputFields`, `validationRules`) armazenados em JSON.
- **Agent Executor**: Motor central de processamento (`agent-executor.ts`) que mapeia respostas do usuário para prompts de IA e valida o output gerado.
- **Public APIs**: Endpoints para listagem, detalhes e execução de agents.
- **Admin APIs**: Interface de backend para gerenciamento completo dos agents pelo administrador.
- **User Interface**: 
    - Dashboard de Agents em `/agents`.
    - Wizard de interação em `/agents/[slug]` com suporte a múltiplos tipos de perguntas (select, texto, etc).
    - Modal de finalização para transformar output de IA em Climas ou Estilos permanentes.
- **Admin Interface**: 
    - Gestão de agents em `/admin/agents`.
    - Editor de Agent com foco em System Message e parâmetros de modelo.
- **Seed System**: Novo script `scripts/seed-agents.js` populando os agents especializados de Clima e Estilo.

### Changed
- **Refatoração SystemAgentType**: O enum `AgentType` antigo (usado por `GlobalAgent`) foi renomeado para `SystemAgentType` para garantir isolamento e evitar conflitos com os novos Agents de usuário.
- **Configuração de Seed**: Atualizado `package.json` para executar seeds de ambientes e agents simultaneamente.
- **Integração de Criação**: Endpoints de `Climates` e `Styles` agora aceitam flag `fromAgent` para processar inputs estruturados vindos do sistema de agents.
- **Navegação**: Ícone de "Sparkles" adicionado às sidebars de usuário e admin.

### Fixed
- Isolamento de tipos entre agents de infraestrutura (Scriptwriter, Narrator) e agents de template (Clima, Estilo).
- Compatibilidade do sistema de tokens/créditos com o novo modelo de execução.
