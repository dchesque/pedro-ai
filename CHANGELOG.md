# Changelog

All notable changes to this project will be documented in this file.

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
