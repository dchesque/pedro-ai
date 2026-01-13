# Changelog
 
## [2.1.1] - 2026-01-13
 
### Fixed
- **Bloqueio de Páginas**: Corrigido o erro que permitia que usuários sem assinatura ativa acessassem áreas restritas do aplicativo.
- **API de Status**: Refatorada a lógica de `isActive` para exigir um `currentPlanId` válido ou privilégios de administrador, eliminando o fallback que ativava usuários indevidamente.
- **Hard Wall de Layout**: Reforçada a segurança no `ProtectedLayout` para impedir a renderização de qualquer conteúdo protegido antes do redirecionamento para a página de assinatura.
- **Typing**: Adicionada a propriedade `isAdmin` ao hook `useSubscription` para melhor integração com o frontend.

## [2.1.0] - 2026-01-13

### Added
- **Centralização de Prompts de IA**: Implementação de um sistema dinâmico para gerenciar templates de prompts diretamente pelo banco de dados.
- **Painel Administrativo de Prompts**: Nova página em `/admin/prompts` com interface organizada por Página e Bloco de funcionalidade.
- **Edição em Modal**: Interface de edição de prompts via Dialog (modal), permitindo ajustes rápidos e visualização de variáveis disponíveis.
- **Auto-Seeding Inteligente**: Sistema que popula o banco de dados automaticamente com templates padrão na primeira carga da página ou uso da funcionalidade.
- **Segurança Admin**: Rota e API protegidas por verificação de permissão de administrador (`isAdmin`).

### Changed
- **Configurabilidade de Sugestões**: Funcionalidades de Hook, CTA e Refinamento Visual de Estilos agora utilizam prompts dinâmicos.
- **Melhoria de Climas**: Os prompts para Descrição, Instruções Técnicas e Behavior Preview do módulo de Climas agora são totalmente configuráveis.
- **Arquitetura de Fallback**: Mantida a integridade do sistema com fallbacks "hardcoded" caso o banco de dados esteja inacessível.

## [2.0.0] - 2026-01-13

### Changed
- **Arquitetura de Estilos e Climas (v2.0)**: Refatoração completa para separar identidade estrutural (Estilo) de comportamento emocional (Clima), permitindo maior flexibilidade e controle.
- **Database Schema**:
    - **Style**: Adicionados campos para `hookType`, `ctaType`, `scriptFunction`, `narratorPosture`, `contentComplexity` e `compatibleClimates`. Removidos campos legados de ritmo.
    - **Climate**: Removidos campos obsoletos (`hookType`, `closingType`, `maxScenes`).
    - **Enums**: Criados `StyleHookType` e `StyleCtaType`.
- **UI de Criação de Estilos**:
    - Interface totalmente renovada com "Blocos Guiados" para Função, Postura e Complexidade.
    - **Hook e CTA Estruturados**: Seleção granular de tipo de abertura e fechamento com exemplos opcionais.
    - **Sugestões Inteligentes**: Botões "✨ Sugerir com IA" para preencher automaticamente tipos de Hooks/CTAs adequados.
    - **Refinamento Visual**: Funcionalidade "Refinar com IA" para prompts visuais, comparando original vs refinado em um Dialog.
    - **Afinidades de Clima**: Sistema de "Climas Compatíveis" com seleção múltipla e destaque visual para sugestões naturais.
- **API**:
    - Novos endpoints `/api/styles/ai/suggest` e `/api/styles/ai/refine-visual` para suporte criativo.
    - Atualização da rota `/api/styles` para suportar o novo payload.

## [1.13.3] - 2026-01-13

### Changed
- **Limpeza de Schema**: Removidos campos legados do modelo `Climate` (`hookType`, `closingType`, `sentenceMaxWords`, `maxScenes`) e seus respectivos enums e tipagens, simplificando a API e o modal de criação.

## [1.13.2] - 2026-01-13

### Changed
- **Visualização de Climas**: Reformulação completa do modal de detalhes do clima (`ClimateDetailsModal`), agora com largura expandida (`max-w-5xl`), cartões visuais para os atributos comportamentais (Estado Emocional, Dinâmica, Pressão) e melhor hierarquia de informações.
- **Integração de Pressão Narrativa**: A API agora respeita a escolha do usuário para "Pressão Narrativa" mesmo quando incompatível com o "Estado Emocional", permitindo configurações avançadas via confirmação explícita.
- **Correção de Permissões**: Resolvido bug crítico de 403 Forbidden ao editar climas, corrigindo a comparação entre ID do Clerk e ID do banco de dados.
- **Persistência de Dados**: Corrigido o salvamento do campo `behaviorPreview` na criação e edição de climas.
- **UI Clean-up**: Removido ícone duplicado do clima no card de listagem e no modal de detalhes para um visual mais limpo.

## [1.13.1] - 2026-01-13

### Changed
- **Validação de Climas**: Os campos "Descrição Interna", "Instruções Customizadas" e "Preview do Comportamento" no modal de criação de clima agora são obrigatórios para garantir a consistência das instruções geradas para os agentes.
- **UX do Modal**: O botão de criação/salvamento permanece desabilitado até que todos os metadados e pré-visualizações comportamentais estejam devidamente preenchidos.

## [1.13.0] - 2026-01-13

### Added
- **Seletor de Provedor e Modelo em Agents**: Integrado o `ModelSelector` na página de edição de agents (/admin/agents/[id]), permitindo a escolha dinâmica de provedores (OpenRouter, Fal.ai) e modelos com visualização em tempo real de custos e créditos.
- **Suporte a Provedores no Executor**: O engine de execução de agents (`agent-executor.ts`) agora suporta o formato `provider:model`, permitindo roteamento flexível entre diferentes APIs.

### Changed
- **Otimização de Layout Admin**: Página de edição de agents expandida para largura total (100%) e grid ajustado para 3 colunas, melhorando a produtividade na edição de System Messages longos.
- **Fluxo de Seleção de IA**: O seletor de modelos agora utiliza layout em coluna única para melhor legibilidade das informações de pricing.

### Fixed
- **Tipagem da Interface Agent**: Atualizada a interface `Agent` global para incluir campos de modelo, system message e status ativo, eliminando erros de compilação no painel administrativo.
- **Regras de Clima**: Implementada matriz de sistema final para combinações entre Estado Emocional (Passo 1) e Dinâmica de Revelação (Passo 2), garantindo consistência narrativa e evitando configurações inválidas.
    - **Curiosidade**: Apenas *Construir aos poucos* e *Mostrar fragmentos*.
    - **Ameaça**: *Construir aos poucos* e *Esconder até o final* (opcional).
    - **Fascínio**: *Revelar cedo*, *Construir aos poucos* e *Mostrar fragmentos*.
    - **Confronto**: *Revelar cedo* e *Construir aos poucos*.
    - **Inspiração Sombria**: *Construir aos poucos* e *Esconder até o final*.

## [1.12.0] - 2026-01-13

### Added
- **Finalização do Módulo de Estilos & Climas**: Módulo agora totalmente integrado com o sistema de Agents v1.0.
- **Listagem Dinâmica de Estilos**: Implementada a visualização de Estilos Visuais em `/estilos`, permitindo gerenciar estilos criados por IA ou manualmente.
- **Integração v2.0 do Roteirista**: O gerador de cenas (`generate-scenes`) agora utiliza o novo motor de Clima Narrativo, aplicando regras comportamentais específicas (pressão, dinâmica de revelação, estado emocional) via prompt dinâmico.

### Changed
- **Migração de "Tone" para "Climate"**: Todas as referências legadas ao modelo de "Tom" foram migradas para o novo sistema de "Clima" em toda a aplicação (API, Hooks, UI).
- **Refatoração do EstilosPage**: Layout aprimorado com separação visual clara entre biblioteca do sistema e climas/estilos pessoais.

### Fixed
- **Integridade de Dados no Clima API**: Corrigido bug onde IDs do Clerk estavam sendo usados em vez de IDs do banco de dados (CUID), o que quebrava as relações e impedia a visualização de climas personalizados.
- **Prisma Client Path**: Normalização de caminhos de importação do Prisma Client em múltiplos arquivos da camada `src/lib`.
- **UI de Manutenção**: Removida a mensagem de "em manutenção" das abas de estilos.


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
- **Isolamento de Tipos**: Garantida a separação entre agents de infraestrutura (Scriptwriter, Narrator) e agents de template (Clima, Estilo).
- **Prisma Import nos Seeds**: Corrigidos caminhos de importação do Prisma Client nos scripts de seed para evitar erros de inicialização.
- **Robustez de Seed**: Implementada verificação manual de existência no `seed-climates.js` para maior resiliência em ambientes Windows.

## [1.10.0] - 2026-01-13

### Added
- **Sistema de Climas v2.0**: Refatoração completa da entidade "Tom de Voz" para "Climas Narrativos", introduzindo controles comportamentais guiados.
- **Controle Comportamental**: Novos campos no banco de dados (`EmotionalState`, `RevelationDynamic`, `NarrativePressure`, `HookType`, `ClosingType`) para guiar a IA de forma precisa.
- **Interfaces de Climas**: 
    - `ClimateSelector`: Novo componente de seleção premium com metadados visuais.
    - `ClimateModal`: Wizard de 3 passos para criação guiada de climas narrativos.
    - `ClimateCard`: Exibição detalhada de atributos comportamentais.
- **Scripts de Gestão**: Inclusão de scripts para migração de dados e seed de climas do sistema (`seed-climates.js`).

### Changed
- **Database Schema**: Renomeado modelo `Tone` para `Climate` e atualizadas todas as relações em `Short` e `Style`.
- **Backend API**: Refatorada rota `/api/tones` para `/api/climates` com integração de `guard-rails` e `behavior-mapping`.
- **Scriptwriter Agent**: Atualizado para injetar instruções comportamentais dinâmicas baseadas no clima.

## [1.9.1] - 2026-01-13

### Fixed
- **API Tone List**: Corrigido formato da resposta para `{ tones: [...] }`, resolvendo bug de lista vazia no frontend.
- **Geração de Cenas**: Corrigido erro 400 ao gerar roteiro por incompatibilidade no payload entre frontend e backend.
- **Padronização de Tipos**: Ajustado o campo `characterDescriptions` e suporte a `premise`/`theme` de forma intercambiável na API.
- **Conectividade DB**: Removidas referências residuais ao objeto `prisma` em favor do `db` nas rotas de tons.

## [1.9.0] - 2026-01-13

### Added
- **Gestão de Tons de Voz**: Nova entidade `Tone` e API completa (/api/tones) para definir instruções de voz independentes dos estilos.
- **Roteirista Wizard V2**: Interface completamente nova em `/roteirista/novo` com 4 etapas (Conceito, Personagens, Cenas, Revisão).
    - **Step 2 (Cenas)**: Suporte a Drag & Drop para reordenar cenas e edição inline de narração/visual.
    - **AI Assistance**: Botões contextuais para melhorar, expandir ou traduzir textos diretamente no formulário.
- **Hooks Granulares**: `useSaveScript` atualizado para suportar a nova estrutura de dados V2.

### Changed
- **Modelo de Estilos Refatorado**: Removidos campos legados (`targetDuration`, `suggestedSceneCount`) em favor de lógica dinâmica no frontend.
- **Interface de Estilos**: Nova organização com Tabs separando "Estilos Visuais" de "Tons de Voz".
- **Cálculo de Duração**: O `targetDuration` do Short agora é calculado dinamicamente baseado na soma das durações das cenas.

### Fixed
- **Sync de Duração**: Corrigido bug onde o roteiro salvo ignorava a duração real das cenas editadas.

## [1.8.0] - 2026-01-12

### Added
- **Gestão Unificada de Estilos**: Novo modelo de dados global que permite criar, editar e compartilhar estilos entre usuários.
- **Roteirista Multi-Step**: 
    - Seletor de Modelo de IA com custos por crédito detalhados.
    - Seletor de Estilo com Preview em tempo real e badges de identificação (Sistema vs Pessoal).
    - Assistente de Títulos IA para sugestões criativas baseadas no tema.
- **Badges e Categorização**: Página `/estilos` agora separa visualmente a "Biblioteca do Sistema" de "Seus Estilos".
- **Migração de Dados**: Script para mover estilos legados (`UserStyle`/`GlobalStyle`) para a nova estrutura unificada.

### Fixed
- **API Robustness**: Implementado fallback de SQL bruto para lidar com locks de arquivo do Prisma Client no Windows.
- **Build Errors**: Corrigido caminho de importação do `useToast` no `StyleCard.tsx`.

## [1.7.2] - 2026-01-12

### Changed
- **Layout Full Width**: Removida a limitação de largura máxima (`max-width`) no conteúdo principal para aproveitar 100% do espaço em monitores grandes.
- **Responsividade**: Ajustado o padding lateral (`px-4 md:px-8`) para manter a legibilidade em resoluções altas.
- **Componente Roteirista**: Otimizado para expandir e alinhar com o novo layout de largura total.

## [1.7.1] - 2026-01-12

### Fixed
- **Visibilidade fal.ai**: Corrigido problema onde o provider fal.ai não aparecia no seletor de modelos devido à leitura estática de variáveis de ambiente.
- **Adapters Dinâmicos**: Implementada leitura dinâmica de `FAL_API_KEY` e `OPENROUTER_API_KEY` para evitar problemas de build-time.

## [1.7.0] - 2026-01-12

### Added
- **Configuração Centralizada de Modelos LLM**: Nova página administrativa em `/admin/models` para gerir o modelo padrão de cada funcionalidade do sistema.
- **Resolver de Modelos**: Implementado `model-resolver.ts` com cache inteligente e fallback hierárquico (Usuário > Admin Global > Hardcoded).
- **Flexibilidade de Provedores**: Suporte para troca dinâmica entre DeepSeek, Claude, GPT-4o, Gemini, Llama, etc., sem alteração de código.
- **Dashboard Admin**: Interface premium com cards informativos, seleção por categoria (text/image/vision) e feedback visual de mudanças.
- **Novo Campo no Banco**: Adicionado `defaultModels` Json ao modelo `AdminSettings`.

### Changed
- Agentes de roteiro e prompt agora utilizam o modelo global configurado pelo administrador.
- Endpoint de geração de imagem (`/api/ai/image`) e análise de personagem agora honram as configurações globais.


## [1.6.4] - 2026-01-12

### Fixed
- **React Hooks Order**: Corrigido o erro de consistência de Hooks no `ScriptEditPage` movendo a chamada do hook `useGenerateMedia` para o topo do componente.

## [1.6.0] - 2026-01-11

### Added
- **Refatoração da Pipeline de Shorts**: Implementação de fluxo em 2 etapas (Etapa 1: Roteiro, Etapa 2: Mídia).
- **Controle do Usuário**: Nova página de edição de roteiro (`/shorts/[id]/edit`) permitindo revisão completa antes da geração de imagens.
- **Storyboard Editável**: Suporte a reordenação de cenas (Drag & Drop), edição manual de narração/descrição e adição/remoção de cenas.
- **Regeneração por Cena**: Função para regenerar apenas uma cena específica usando IA ou atualizar apenas a imagem de uma cena.
- **Seleção de Modelo de IA**: Usuário agora pode escolher o modelo de texto (DeepSeek, Claude, GPT-4o, Llama 3) para geração do roteiro.
- **Estimativa de Créditos**: Componente visual que detalha o custo por etapa (Roteiro vs Imagens).
- **Novos Campos e Status**: Implementados status `DRAFT`, `SCRIPT_READY`, `SCRIPT_APPROVED`, etc. no banco de dados.

### Changed
- Refatorada a `pipeline.ts` para funções independentes e atômicas.
- Atualizado o Hook `use-shorts.ts` com novas mutações granulares.
- Melhorada a UX do formulário de criação focando primeiro na geração do roteiro.

## [1.5.0] - 2026-01-11

### Added
- **Biblioteca de Personagens**: Sistema completo para criação e gestão de personagens consistentes para shorts.
- **Integração de Pipeline**: Agentes (Roteirista e Prompt Engineer) agora reconhecem e utilizam personagens definidos nas cenas para manter consistência visual.
- **Gerador de Prompts**: API para analisar imagens e gerar descrições textuais otimizadas automaticamente (Vision AI) ou combinas traits manuais.
- **Nova Página e Componentes**:
  - `/characters`: Listagem, criação e edição de personagens.
  - `CharacterDialog`: Formulário avançado com suporte a upload, traits e geração de prompts.
  - `CharacterCard` e `CharacterSelector`: Componentes de UI integrados ao fluxo de criação de Shorts.
- **Limites de Plano**: Implementação de limites para número de personagens por usuário e por short baseado no plano (Free, Starter, Pro, Business).

## [1.4.0] - 2026-01-11

### Added
- **Sistema de Logging Profissional**: Implementação de logging centralizado, colorido e detalhado em toda a pipeline de Shorts.
- Logger customizado com suporte a níveis (debug, info, warn, error), ícones, cores ANSI e rastreamento de contexto (IDs de usuário, shorts, medição de duração, etc.).
- Integração de logs detalhados em todos os agentes (Scriptwriter, Prompt Engineer) e motores de geração (Flux, Kling).
- Monitoramento em tempo real do progresso da pipeline via console.

### Changed
- Refatorada as APIs de geração de Shorts, Imagem e Vídeo para utilizar o novo sistema de logging mantendo a integridade do sistema de créditos.


## [1.3.1] - 2026-01-11

### Fixed
- Corrigido erro de validação (400) na rota `/api/shorts` para permitir estilos dinâmicos/personalizados.

## [1.3.0] - 2026-01-11

### Added
- **Sistema de Agentes e Estilos**: Configuração personalizada de IA com 3 níveis de prioridade (Usuário > Admin > Padrão).
- **Resolver de Identidade**: Lógica centralizada para injetar prompts e modelos específicos por usuário ou globais.
- **Personalização por Usuário**: Nova página em `/settings/styles` para criar roteiros e prompts visuais personalizados.
- **Painel Administrativo**: Interface em `/admin/agents` para configurar Agentes Globais (Scriptwriter, Prompt Engineer, Narrator).
- **Estilos Dinâmicos**: O formulário de criação de shorts agora carrega estilos (Envolvente, Educacional, etc.) direto do banco de dados.
- Novos modelos Prisma: `GlobalAgent`, `UserAgent`, `GlobalStyle`, `UserStyle`.

### Fixed
- **Prisma Client Generation**: Resolvido erro `EPERM` e falhas de `TypeError` ao centralizar a geração do cliente em um diretório não bloqueado (`client_final`).
- Corrigido caminhos de importação do Prisma em toda a aplicação e utilitários.
- Erro de sintaxe no import do webhook de usuários.
 
## [1.2.0] - 2026-01-11
 
### Added
- **Shorts Pipeline**: Automated generation of short videos/reels.
- **Agente Roteirista**: Integration with Claude 3.5 Sonnet to create detailed scripts from a theme.
- **Agente Prompt Engineer**: Integration with Claude to optimize image prompts from script scenes.
- **Geração Batch**: Parallel generation of all short scenes using **Flux Schnell**.
- **Gestão de Shorts**: Interface to create, view, and delete shorts with status tracking.
- **Sistema de Créditos**: Advanced credit management for shorts (base cost + per scene).
- **Polling Automático**: Dashboard updates progress automatically while generating.
- Added `@radix-ui/react-slider` for duration selection.

## [1.1.3] - 2026-01-11

### Added
- Added image upload support in **VideoGenerationForm**.
- Image preview and removal functionality before video generation.
- URL fallback remains available for external image sources.
- Integrated with `/api/upload` endpoint for secure file handling.


## [1.1.2] - 2026-01-10

### Fixed
- Updated **Kling** model paths to include `/pro/` prefix (`fal-ai/kling-video/v2.5-turbo/pro/...`).


## [1.1.1] - 2026-01-10

### Changed
- Migrated **fal.ai** integration to the official SDK (`@fal-ai/client`).
- Refactored `FalClient` to use SDK-native `run` and `subscribe` methods.
- Optimized **Flux** (synchronous) and **Kling** (asynchronous) generation flows.


## [1.1.0] - 2026-01-10

### Added
- Integrated **fal.ai** for AI image and video generation.
- **Flux Schnell** module for fast image generation.
- **Kling 2.5 Turbo** module for high-quality video generation (text-to-video and image-to-video).
- New API routes: `/api/ai/fal/image` and `/api/ai/fal/video`.
- Credit system support for fal.ai features:
    - 1 credit per image.
    - 1 credit per second of video.
- Automatic credit deduction and refund on failure logic for fal.ai modules.

### Fixed
- Admin route `/api/admin/users/[id]/credits` now automatically creates a credit balance record if it doesn't exist (fixing 404 error).

## [1.0.1] - 2026-01-10

### Changed
- Updated default database volume name to `saas_pedro_ai` in Docker setup script and documentation.
- Updated default database container name to `saas_pedro_ai` in Docker setup script and documentation.
