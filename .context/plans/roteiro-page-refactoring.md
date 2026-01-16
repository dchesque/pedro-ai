# Plano de Implementação: Refatoração da Página de Visualização de Roteiro

## Contexto e Objetivo
Refatorar completamente a página de visualização de roteiro (`/shorts/[id]`) para uma nova rota (`/roteiro/[id]`) com melhor organização visual, slider horizontal de cenas e UX otimizada.

**Problema:** A página atual é muito vertical, truncada e confusa na nomenclatura da rota.
**Solução:** Nova rota dedicada ao roteiro com visualização premium e ferramentas de edição integradas.

## Status: ⏳ Pendente

## Checklist de Implementação

### 1. Estrutura de Arquivos e Rota 📂
- [ ] Criar diretório `src/app/(protected)/roteiro/[id]/`
- [ ] Criar diretório `src/app/(protected)/roteiro/[id]/_components/`
- [ ] Criar `page.tsx`, `loading.tsx` e `error.tsx` na nova rota

### 2. Componentes de UI (Fase de Construção) 🎨
- [ ] `roteiro-header.tsx`: Cabeçalho com ações e status
- [ ] `roteiro-summary-card.tsx`: Resumo (Hook, Sinopse, CTA) e Configs
- [ ] `scene-slider.tsx`: Slider horizontal usando Embla Carousel ou similar
- [ ] `scene-card.tsx`: Card individual para o slider
- [ ] `scene-detail-panel.tsx`: Painel de detalhes da cena selecionada
- [ ] `narration-modal.tsx`: Modal para visualização de narração completa
- [ ] `edit-scene-modal.tsx`: Modal para edição de cena

### 3. Integração e Lógica 🧠
- [ ] Adotar `useShort(id)` compatível com os novos campos
- [ ] Implementar polling de status para gerações em curso
- [ ] Integrar ações de "Gerar Imagens", "Editar" e "Deletar"
- [ ] Configurar breadcrumbs via `usePageConfig`

### 4. Limpeza e Migração 🧹
- [ ] Atualizar links em `Sidebar`, `ShortCard` e outros componentes
- [ ] Deletar rota antiga `src/app/(protected)/shorts/[id]/`
- [ ] Validar responsividade e UX final

## Alterações Técnicas Detalhadas

### Nova Rota: `/roteiro/[id]`
- **Tipo:** Hybrid (Server Component que carrega dados e Client Wrapper para interatividade)
- **Hooks:** 
  - `useShort`: Buscar dados do roteiro.
  - `useUpdateScene`: Salvar alterações.
  - `useGenerateMedia`: Iniciar geração de imagens.

### Layout Proposto (Mobile First)
1. **Header:** Compacto com status colorido.
2. **Resumo:** Grid 1/2 colunas com metadados e textos de apoio (Hook/CTA).
3. **Storyboard:** Slider horizontal de cards 9:16.
4. **Detalhes:** Painel que surge ao selecionar uma cena no slider.

## Riscos e Mitigações
- **Performance do Slider:** Usar bibliotecas consolidadas como `embla-carousel-react`.
- **Sincronização de Estado:** Garantir que o `refetch` do status não quebre a seleção da cena.

---
*Plano criado em: 2026-01-16 por Antigravity*
