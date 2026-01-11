# Plans

Esta pasta contém planos de implementação de features para o projeto.

## Planos Disponíveis

### [Upstash Vector RAG Integration](./upstash-vector-rag-integration.md)

Plano completo para implementar um sistema RAG (Retrieval-Augmented Generation) usando Upstash Vector DB:

- Integração com Upstash Vector para armazenar embeddings
- Knowledge Base gerenciável via painel admin
- RAG integrado ao chat existente
- Sistema completo de busca semântica

**Status**: Pronto para implementação

**Pré-requisitos**: 
- Conta Upstash
- Vector Index criado
- Modelo de embeddings configurado

### [Melhorias no Mecanismo de Renovação Mensal de Créditos](./credit-renewal-improvements.md)

Plano completo para melhorar o sistema de renovação mensal de créditos:

- Rastreamento de período de billing e última renovação
- Política de acumulação configurável (global e por plano)
- Cron job de fallback para garantir renovações mesmo se webhooks falharem
- Detecção inteligente de renovações reais vs atualizações de plano
- Logs e auditoria completos de todas as renovações

**Status**: Pronto para implementação

**Pré-requisitos**: 
- Conta Vercel (para cron jobs) ou alternativa (GitHub Actions)
- `CLERK_SECRET_KEY` configurada para consultas à API de billing

## Como Criar um Novo Plano

Para criar um novo plano de implementação:

1. **Use o Template:**
   - Copie `TEMPLATE.md` para um novo arquivo com nome descritivo (ex: `feature-name.md`)
   - O template já inclui toda a estrutura necessária e referências aos agents

2. **Preencha as Seções:**
   - Substitua todos os marcadores `[NOME]`, `[DESCREVER]`, `[ADICIONAR]` com informações específicas
   - Remova seções não aplicáveis à sua feature
   - Adicione seções específicas conforme necessário

3. **Siga os Padrões:**
   - Sempre referencie os agents apropriados em cada passo
   - Use diagramas Mermaid para arquitetura
   - Mantenha referências à documentação do projeto
   - Inclua checklist completo de implementação

4. **Revise:**
   - Verifique que todas as referências aos agents estão corretas
   - Confirme que segue os padrões do projeto
   - Garanta que o checklist está completo

## Como Usar um Plano Existente

1. Escolha o plano que deseja implementar
2. Leia o plano completo para entender a arquitetura
3. Siga os passos na ordem apresentada
4. Use o checklist no final do plano para acompanhar o progresso
5. Marque itens do checklist conforme completa cada etapa

## Estrutura dos Planos

Cada plano contém:
- **Visão Geral**: Objetivos e funcionalidades principais
- **Referências**: Links para documentação externa e interna
- **Arquitetura**: Diagrama Mermaid mostrando componentes e fluxos
- **Pré-requisitos**: Requisitos antes de começar
- **Passos Detalhados**: Implementação passo a passo com referências aos agents
- **Checklist**: Lista de tarefas para acompanhar progresso
- **Notas Importantes**: Considerações técnicas e de segurança
- **Referências de Documentação**: Links para agents e docs relevantes

## Padrões dos Planos

Todos os planos seguem os mesmos padrões:

- **Agents**: Cada passo referencia o agent apropriado (`agents/*.md`)
- **Documentação**: Links para documentação relevante (`docs/*.md`)
- **Código**: Referências a arquivos de código existentes como exemplos
- **Estrutura**: Consistência na organização e formatação
- **Checklist**: Items verificáveis e organizados por categoria

## Template

O arquivo [TEMPLATE.md](./TEMPLATE.md) contém a estrutura base para criar novos planos. Ele foi **otimizado para uso por agentes de IA** e inclui:

- Instruções explícitas para agentes de IA em cada seção
- Marcadores claros (`[NOME]`, `[DESCREVER]`, `[ADICIONAR]`) para preencher
- Referências específicas aos agents apropriados
- Exemplos de código e estrutura
- Checklist completo e verificável
- Validação final para garantir completude

### Para Agentes de IA

O template inclui instruções específicas para agentes de IA:
- **Pesquisar primeiro**: Instruções para explorar o codebase antes de preencher
- **Preencher completamente**: Diretrizes para substituir todos os marcadores
- **Referenciar corretamente**: Quando usar cada agent
- **Seguir padrões**: Como garantir conformidade com padrões do projeto
- **Validar**: Checklist de validação final

### Para Desenvolvedores Humanos

O template também pode ser usado por desenvolvedores humanos seguindo as mesmas instruções. As diretrizes explícitas facilitam o preenchimento correto.

Use este template como ponto de partida para todos os novos planos.

