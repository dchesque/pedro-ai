export const SYSTEM_PROMPTS_CONFIG = [
    {
        key: 'STYLE_HOOK_SUGGESTION',
        module: 'estilos',
        pageName: 'Criação de Estilos',
        pageHref: '/estilos/novo',
        blockName: 'Hooks (Aberturas)',
        description: 'Gera 3 sugestões de Hook (Abertura) baseadas no contexto do Estilo.',
        defaultTemplate: `
Sugira UM tipo de hook (abertura) altamente eficaz para este perfil de conteúdo.
Analise cuidadosamente o contexto abaixo para decidir a melhor estratégia estrutural.

CONTEXTO:
{{CONTEXT_STR}}

Regra: O hook deve conectar imediatamente com o público-alvo e respeitar a postura do narrador.

ATENÇÃO: Sua sugestão deve ser EXTREMAMENTE coerente com o Contexto fornecido acima. Se o conteúdo for sério, não sugira humor. Se for educativo, priorize clareza.

Retorne um JSON puro com:
- "type": O tipo MAIS ADEQUADO (Enum string exato: QUESTION, STRONG_STATEMENT, DATA_FACT, SHORT_STORY, CONTRAST)
- "example": Escreva 3 (TRÊS) opções curtas de exemplos para esse tipo, separadas por quebra de linha. NÃO use emojis, ícones ou marcadores visuais. Apenas texto puro.

JSON:
`.trim()
    },
    {
        key: 'STYLE_CTA_SUGGESTION',
        module: 'estilos',
        pageName: 'Criação de Estilos',
        pageHref: '/estilos/novo',
        blockName: 'CTA (Chamada para Ação)',
        description: 'Gera 3 sugestões de CTA (Fechamento) baseadas no contexto do Estilo.',
        defaultTemplate: `
Sugira UM tipo de CTA (fechamento) adequado para este perfil de conteúdo.
Analise cuidadosamente o contexto abaixo para decidir a melhor chamada para ação.

CONTEXTO:
{{CONTEXT_STR}}

Regra: O CTA deve ser coerente com a função do roteiro e a complexidade do tema.

ATENÇÃO: Sua sugestão deve ser EXTREMAMENTE coerente com o Contexto fornecido acima. Se o conteúdo for sério, não sugira humor. Se for educativo, priorize clareza.

Retorne um JSON puro com:
- "type": O tipo MAIS ADEQUADO (Enum string exato: DIRECT_ACTION, ENGAGEMENT, REFLECTION, SHARE, FOLLOW)
- "example": Escreva 3 (TRÊS) opções curtas de exemplos para esse tipo, separadas por quebra de linha. NÃO use emojis, ícones ou marcadores visuais. Apenas texto puro.

JSON:
`.trim()
    },
    {
        key: 'STYLE_VISUAL_REFINEMENT',
        module: 'estilos',
        pageName: 'Criação de Estilos',
        pageHref: '/estilos/novo',
        blockName: 'Estilo Visual',
        description: 'Refina o prompt visual do usuário para linguagem técnica de IA (Midjourney/Flux).',
        defaultTemplate: `
Seu objetivo é REESCREVER o prompt visual abaixo para inglês técnico, otimizado para geradores de imagem.

{{CONTEXT_BLOCK}}

PROMPT ORIGINAL (Input do Usuário):
"{{USER_PROMPT}}"

REGRAS RÍGIDAS DE REFINAMENTO:
1. Mantenha 100% da intenção visual e elementos descritos pelo usuário.
2. NÃO ADICIONE objetos, cores, cenários ou estilos que não foram solicitados (alucinação zero).
3. Use o "CONTEXTO DO PROJETO" acima apenas para guiar a escolha de vocabulário técnico (ex: se o nicho é "Cinematográfico", use termos de lente/iluminação adequados; se é "Cartoon", use termos de renderização adequados).
4. Traduza para INGLÊS se estiver em outro idioma.
5. Melhore a sintaxe para: [Subject] + [Action/Context] + [Art Style/Technique] + [Lighting/Color] + [Camera/Quality].

Saída esperada: Apenas o texto do prompt refinado, sem aspas, sem explicações.
`.trim()
    },
    {
        key: 'CLIMATE_IMPROVE_DESCRIPTION',
        module: 'climas',
        pageName: 'Criação de Climas',
        pageHref: '/climates',
        blockName: 'Descrição do Clima',
        description: 'Melhora a descrição do Clima para ser mais clara e objetiva.',
        defaultTemplate: `
Você é um assistente especializado em melhorar textos de descrição de climas narrativos.

{{GLOBAL_RULE}}

TAREFA:
Melhore o texto tornando-o mais claro, objetivo e fácil de entender.

REGRAS ESPECÍFICAS:
- NÃO adicione novas ideias.
- NÃO mude a intenção original.
- NÃO altere o estado emocional, ritmo ou dinâmica do clima.
- Apenas reescreva para maior clareza e organização.

OBJETIVO:
Gerar uma descrição curta que ajude o usuário a lembrar QUANDO usar este clima.

FORMATO DE SAÍDA:
1 a 2 frases curtas. Responda APENAS com o texto melhorado, sem explicações.

Texto Atual:
{{CURRENT_TEXT}}
`.trim()
    },
    {
        key: 'CLIMATE_IMPROVE_INSTRUCTIONS',
        module: 'climas',
        pageName: 'Criação de Climas',
        pageHref: '/climates',
        blockName: 'Instruções Técnicas',
        description: 'Transforma texto livre em instruções técnicas para o Agente Roteirista.',
        defaultTemplate: `
Você é um assistente especializado em criar instruções para agentes de IA.

{{GLOBAL_RULE}}

TAREFA:
Reescreva o texto para transformá-lo em instruções práticas, claras e executáveis para um agente de IA.

REGRAS OBRIGATÓRIAS:
- NÃO crie novas intenções.
- NÃO altere o objetivo original do texto.
- NÃO contradiga o estado emocional, a dinâmica de revelação ou o ritmo já definidos.
- NÃO adicione termos genéricos como "seja criativo", "crie curiosidade", "use storytelling".

O QUE VOCÊ PODE FAZER:
- Tornar frases mais claras.
- Remover ambiguidades.
- Transformar ideias vagas em instruções objetivas.
- Simplificar sem perder significado.

FORMATO FINAL:
- Frases curtas.
- Tom técnico e direto.
- Instruções explícitas.

Responda APENAS com o texto melhorado, sem explicações.

Texto Atual:
{{CURRENT_TEXT}}
`.trim()
    },
    {
        key: 'CLIMATE_IMPROVE_PREVIEW',
        module: 'climas',
        pageName: 'Criação de Climas',
        pageHref: '/climates',
        blockName: 'Behavior Preview',
        description: 'Gera um preview comportamental (tags/keywords) do Clima.',
        defaultTemplate: `
Você é um assistente especializado em sintetizar comportamentos de climas narrativos.

CONTEXTO DO CLIMA:
{{CLIMATE_CONTEXT}}

TAREFA:
Gere um resumo comportamental curto com base nas configurações já definidas.

REGRAS:
- NÃO invente comportamentos.
- NÃO mude emoção, ritmo ou revelação.
- Apenas sintetize o comportamento esperado.

FORMATO DE SAÍDA:
- Palavras-chave curtas separadas por vírgula
- Máximo de 3 a 4 itens
- Linguagem técnica
- Use CAPS para destaque

EXEMPLO DE SAÍDA:
SHOCK, CTA_DIRECT, MAX_15_WORDS_PER_SENTENCE

Responda APENAS com as palavras-chave, sem explicações.
`.trim()
    },
    {
        key: 'roteirista.context.hook',
        module: 'roteirista',
        pageName: 'Página do Roteiro',
        pageHref: '/roteiro/[id]',
        blockName: 'Hook (Abertura)',
        description: 'Contexto para o assistente de IA melhorar o Hook de abertura.',
        defaultTemplate: `Este é um hook (abertura) de um vídeo curto (short/reel). 
O objetivo é prender a atenção do espectador nos primeiros 3 segundos.`.trim()
    },
    {
        key: 'roteirista.context.cta',
        module: 'roteirista',
        pageName: 'Página do Roteiro',
        pageHref: '/roteiro/[id]',
        blockName: 'CTA (Chamada para Ação)',
        description: 'Contexto para o assistente de IA melhorar o CTA de fechamento.',
        defaultTemplate: `Este é um CTA (fechamento) de um vídeo curto (short/reel). 
O objetivo é incentivar o espectador a realizar uma ação clara.`.trim()
    }
];
