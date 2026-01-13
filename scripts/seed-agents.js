const { PrismaClient } = require('../prisma/generated/client_final');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Agents...');

    // 1. Agent de Clima
    const climateAgent = await prisma.agent.upsert({
        where: { slug: 'climate-agent' },
        update: {},
        create: {
            name: 'Agent de Clima',
            slug: 'climate-agent',
            description: 'Cria configurações de clima baseado em suas respostas sobre força emocional, ritmo e revelação.',
            icon: '🎭',
            type: 'CLIMATE',
            model: 'deepseek/deepseek-chat',
            isActive: true,
            creditsPerUse: 0,
            systemMessage: `Você é um assistente especializado em criar configurações de CLIMA para roteiros de vídeo curto.

CONTEXTO:
- Clima define a FORÇA EMOCIONAL e o RITMO do vídeo
- Clima NÃO define estrutura narrativa (isso é do Estilo)
- Clima controla: estado emocional, revelação, pressão, abertura e fechamento

SUA TAREFA:
Baseado nas respostas do usuário, gerar uma configuração de clima válida.

REGRAS OBRIGATÓRIAS:

1. ESTADOS EMOCIONAIS VÁLIDOS:
   - CURIOSITY: espectador precisa entender
   - THREAT: espectador precisa prestar atenção
   - FASCINATION: espectador entra em absorção
   - CONFRONTATION: espectador é desafiado
   - DARK_INSPIRATION: espectador sente profundidade

2. DINÂMICAS DE REVELAÇÃO VÁLIDAS:
   - PROGRESSIVE: construir aos poucos
   - HIDDEN: esconder até o final
   - EARLY: revelar cedo e aprofundar
   - FRAGMENTS: mostrar fragmentos

3. PRESSÕES NARRATIVAS VÁLIDAS:
   - SLOW: lento e denso (máx 25 palavras/frase)
   - FLUID: fluido e hipnótico (máx 18 palavras/frase)
   - FAST: rápido e agressivo (máx 12 palavras/frase)

4. TIPOS DE ABERTURA (HOOK):
   - QUESTION: pergunta intrigante
   - SHOCK: fato chocante
   - CHALLENGE: desafio direto
   - MYSTERY: elemento misterioso
   - STATEMENT: afirmação forte

5. TIPOS DE FECHAMENTO:
   - CTA_DIRECT: call to action direto
   - REVELATION: grande revelação
   - QUESTION: pergunta reflexiva
   - CHALLENGE: desafio ao espectador
   - LOOP: volta ao início

VALIDAÇÕES CRUZADAS (aplicar automaticamente):

1. PRESSÃO RÁPIDA + MUITAS CENAS:
   - Se pressão = FAST, suggestedScenes máximo = 7
   - Ajustar automaticamente se necessário

2. COMBINAÇÕES PROIBIDAS DE FINAL:
   - FASCINATION + CTA_DIRECT = PROIBIDO (usar REVELATION ou LOOP)
   - DARK_INSPIRATION + CTA_DIRECT = PROIBIDO (usar REVELATION ou QUESTION)
   - CURIOSITY + HIDDEN + CTA_DIRECT = PROIBIDO (usar REVELATION)

3. COMBINAÇÕES DE ABERTURA:
   - THREAT deve usar SHOCK ou CHALLENGE
   - FASCINATION deve usar MYSTERY ou STATEMENT
   - CURIOSITY deve usar QUESTION ou MYSTERY

FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido, sem texto adicional:

{
  "emotionalState": "VALOR_DO_ENUM",
  "revelationDynamic": "VALOR_DO_ENUM",
  "narrativePressure": "VALOR_DO_ENUM",
  "hookType": "VALOR_DO_ENUM",
  "closingType": "VALOR_DO_ENUM",
  "suggestedScenes": NUMERO,
  "sentenceMaxWords": NUMERO,
  "description": "Descrição curta do clima gerado (1-2 frases)"
}`,
            questions: [
                {
                    "id": "emotional_force",
                    "order": 1,
                    "label": "Qual força emocional deve dominar o vídeo?",
                    "helpText": "A força emocional define como o espectador vai reagir durante todo o vídeo. Escolha baseado no efeito que você quer causar.",
                    "example": "Para vídeos de finanças onde você quer criar urgência, 'Ameaça' funciona bem. Para documentários ou histórias profundas, 'Inspiração Sombria' é mais adequado.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "CURIOSITY", "label": "🔍 Curiosidade", "description": "O espectador precisa entender" },
                        { "value": "THREAT", "label": "⚡ Ameaça", "description": "O espectador precisa prestar atenção" },
                        { "value": "FASCINATION", "label": "✨ Fascínio", "description": "O espectador entra em estado de absorção" },
                        { "value": "CONFRONTATION", "label": "🔥 Confronto", "description": "O espectador é desafiado diretamente" },
                        { "value": "DARK_INSPIRATION", "label": "🌑 Inspiração Sombria", "description": "O espectador sente profundidade e significado" }
                    ]
                },
                {
                    "id": "revelation_dynamic",
                    "order": 2,
                    "label": "Como a informação deve ser revelada?",
                    "helpText": "Define quando e como a verdade/informação principal aparece no vídeo. Isso controla a retenção do espectador.",
                    "example": "Para criar tensão máxima, 'Esconder até o final'. Para estabelecer autoridade rápida, 'Revelar cedo'. Para manter curiosidade constante, 'Mostrar fragmentos'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "PROGRESSIVE", "label": "📈 Construir aos poucos", "description": "Cada cena puxa a próxima" },
                        { "value": "EARLY", "label": "💡 Revelar cedo e aprofundar", "description": "Estabelece autoridade e depois expande" },
                        { "value": "HIDDEN", "label": "🎭 Esconder até o final", "description": "Tensão contínua com revelação no clímax" },
                        { "value": "FRAGMENTS", "label": "🧩 Mostrar fragmentos", "description": "Mistério permanente, peças do quebra-cabeça" }
                    ]
                },
                {
                    "id": "narrative_pressure",
                    "order": 3,
                    "label": "Qual a pressão narrativa do vídeo?",
                    "helpText": "Controla a velocidade da informação, o tamanho das frases e a sensação de urgência. Afeta diretamente o número de cenas recomendado.",
                    "example": "Shorts de vendas geralmente usam 'Rápido'. Conteúdo educacional profundo usa 'Lento'. A maioria dos vídeos funciona bem com 'Fluido'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "SLOW", "label": "🐢 Lento e denso", "description": "Peso, importância, profundidade" },
                        { "value": "FLUID", "label": "🌊 Fluido e hipnótico", "description": "Consumo contínuo, sem atrito" },
                        { "value": "FAST", "label": "⚡ Rápido e agressivo", "description": "Impacto imediato, urgência" }
                    ]
                },
                {
                    "id": "closing_preference",
                    "order": 4,
                    "label": "Como o vídeo deve terminar?",
                    "helpText": "O tipo de fechamento influencia a ação do espectador após assistir. Algumas combinações são ajustadas automaticamente para manter a coerência.",
                    "example": "Vídeos de venda precisam de 'CTA direto'. Documentários funcionam com 'Revelação'. Conteúdo reflexivo combina com 'Pergunta'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "CTA_DIRECT", "label": "📢 CTA direto", "description": "Chamada clara para ação" },
                        { "value": "REVELATION", "label": "💥 Revelação", "description": "Grande conclusão ou plot twist" },
                        { "value": "QUESTION", "label": "❓ Pergunta reflexiva", "description": "Deixa o espectador pensando" },
                        { "value": "CHALLENGE", "label": "🎯 Desafio", "description": "Provoca o espectador a agir" },
                        { "value": "LOOP", "label": "🔄 Loop", "description": "Volta ao início, cria ciclo" }
                    ]
                }
            ],
            outputFields: [
                { "key": "emotionalState", "label": "Estado Emocional", "type": "select", "editable": true, "options": ["CURIOSITY", "THREAT", "FASCINATION", "CONFRONTATION", "DARK_INSPIRATION"] },
                { "key": "revelationDynamic", "label": "Dinâmica de Revelação", "type": "select", "editable": true, "options": ["PROGRESSIVE", "HIDDEN", "EARLY", "FRAGMENTS"] },
                { "key": "narrativePressure", "label": "Pressão Narrativa", "type": "select", "editable": true, "options": ["SLOW", "FLUID", "FAST"] },
                { "key": "hookType", "label": "Tipo de Abertura", "type": "select", "editable": true, "options": ["QUESTION", "SHOCK", "CHALLENGE", "MYSTERY", "STATEMENT"] },
                { "key": "closingType", "label": "Tipo de Fechamento", "type": "select", "editable": true, "options": ["CTA_DIRECT", "REVELATION", "QUESTION", "CHALLENGE", "LOOP"] },
                { "key": "suggestedScenes", "label": "Cenas Sugeridas", "type": "number", "editable": true },
                { "key": "sentenceMaxWords", "label": "Máx. Palavras por Frase", "type": "number", "editable": false },
                { "key": "description", "label": "Descrição", "type": "textarea", "editable": true }
            ],
            validationRules: {
                "maxScenesForFastPressure": 7,
                "maxScenesForFluidPressure": 12,
                "maxScenesForSlowPressure": 15,
                "sentenceMaxWords": { "SLOW": 25, "FLUID": 18, "FAST": 12 },
                "incompatibleClosings": {
                    "FASCINATION": ["CTA_DIRECT"],
                    "DARK_INSPIRATION": ["CTA_DIRECT"],
                    "CURIOSITY_HIDDEN": ["CTA_DIRECT"]
                },
                "forcedHooks": {
                    "THREAT": ["SHOCK", "CHALLENGE"],
                    "FASCINATION": ["MYSTERY", "STATEMENT"],
                    "CURIOSITY": ["QUESTION", "MYSTERY"]
                }
            }
        }
    });

    // 2. Agent de Estilo
    const styleAgent = await prisma.agent.upsert({
        where: { slug: 'style-agent' },
        update: {},
        create: {
            name: 'Agent de Estilo',
            slug: 'style-agent',
            description: 'Cria configurações de estilo baseado em suas respostas sobre formato, estrutura e narrativa.',
            icon: '🎨',
            type: 'STYLE',
            model: 'deepseek/deepseek-chat',
            isActive: true,
            creditsPerUse: 0,
            systemMessage: `Você é um assistente especializado em criar configurações de ESTILO para roteiros de vídeo curto.

CONTEXTO:
- Estilo define a ESTRUTURA e FORMATO do conteúdo
- Estilo NÃO define emoção ou ritmo (isso é do Clima)
- Estilo controla: tipo de conteúdo, estrutura narrativa, perspectiva e nível de complexidade

SUA TAREFA:
Baseado nas respostas do usuário, gerar uma configuração de estilo válida.

REGRAS OBRIGATÓRIAS:

1. TIPOS DE CONTEÚDO VÁLIDOS:
   - NEWS: Notícias e atualidades
   - EDUCATIONAL: Educacional e tutorial
   - STORYTELLING: Narrativa e histórias
   - ENTERTAINMENT: Entretenimento
   - ARGUMENTATIVE: Conteúdo argumentativo
   - PERSUASIVE: Conteúdo persuasivo
   - SOCIAL_PROOF: Prova social / Cases
   - DEMONSTRATION: Demonstração prática

2. ESTRUTURAS NARRATIVAS VÁLIDAS:
   - PROBLEM_SOLUTION: Problema → Solução
   - STORY_ARC: História com arco (início, meio, fim)
   - LIST_POINTS: Lista / Pontos sequenciais
   - QUESTION_EXPLORATION: Pergunta → Exploração → Resposta
   - THESIS_ARGUMENTS: Tese → Argumentos → Conclusão
   - PROGRESSIVE_REVELATION: Revelação progressiva (mistério → verdade)

3. PERSPECTIVAS NARRATIVAS VÁLIDAS:
   - FIRST_PERSON: Primeira pessoa ("eu descobri...")
   - SECOND_PERSON: Segunda pessoa ("você precisa...")
   - THIRD_PERSON: Terceira pessoa ("ele/ela fez...")
   - NARRATOR: Narrador onisciente

4. NÍVEIS DE COMPLEXIDADE:
   - BEGINNER: Leigo (explicações completas, sem jargões)
   - INTERMEDIATE: Intermediário (alguns termos técnicos)
   - ADVANCED: Avançado (assume conhecimento prévio)
   - EXPERT: Especialista (linguagem técnica completa)

REGRA FUNDAMENTAL:
O Agent de Estilo NÃO pode escolher:
- Estado emocional
- Ritmo/pressão
- Tipo de abertura emocional
- Tipo de fechamento emocional

Essas decisões são do CLIMA, não do Estilo.

FORMATO DE RESPOSTA:
Retorne APENAS um JSON válido, sem texto adicional:

{
  "contentType": "VALOR_DO_ENUM",
  "narrativeStructure": "VALOR_DO_ENUM",
  "narrativePerspective": "VALOR_DO_ENUM",
  "complexityLevel": "VALOR_DO_ENUM",
  "description": "Descrição curta do estilo gerado (1-2 frases)",
  "suggestedHookTemplate": "Template sugerido para abertura estrutural",
  "suggestedCtaTemplate": "Template sugerido para fechamento estrutural"
}`,
            questions: [
                {
                    "id": "content_format",
                    "order": 1,
                    "label": "Qual o formato do conteúdo?",
                    "helpText": "Define como o conteúdo será organizado e apresentado. Isso afeta a estrutura, não a emoção.",
                    "example": "Para ensinar algo, use 'Educacional'. Para contar uma história, use 'Storytelling'. Para convencer com lógica, use 'Argumentativo'. Para mostrar resultados, use 'Prova Social'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "NEWS", "label": "📰 Notícias / Atualidades", "description": "Informação factual e atual" },
                        { "value": "EDUCATIONAL", "label": "📚 Educacional / Tutorial", "description": "Ensino e explicação" },
                        { "value": "STORYTELLING", "label": "📖 Storytelling / Narrativa", "description": "Histórias e casos" },
                        { "value": "ENTERTAINMENT", "label": "🎬 Entretenimento", "description": "Diversão e engajamento" },
                        { "value": "ARGUMENTATIVE", "label": "⚖️ Argumentativo", "description": "Construção lógica de argumento" },
                        { "value": "PERSUASIVE", "label": "🎯 Persuasivo", "description": "Convencimento estruturado" },
                        { "value": "SOCIAL_PROOF", "label": "👥 Prova Social / Cases", "description": "Resultados e depoimentos" },
                        { "value": "DEMONSTRATION", "label": "🔧 Demonstração", "description": "Mostrar na prática" }
                    ]
                },
                {
                    "id": "narrative_structure",
                    "order": 2,
                    "label": "Qual a estrutura narrativa?",
                    "helpText": "Define como a informação será organizada ao longo do vídeo. A estrutura afeta a clareza e o fluxo lógico.",
                    "example": "Tutoriais funcionam com 'Problema → Solução'. Documentários usam 'Revelação Progressiva'. Listas educativas usam 'Pontos Sequenciais'. Conteúdo opinativo usa 'Tese → Argumentos'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "PROBLEM_SOLUTION", "label": "🔄 Problema → Solução", "description": "Apresenta dor e resolve" },
                        { "value": "STORY_ARC", "label": "📈 História com arco", "description": "Início, desenvolvimento, conclusão" },
                        { "value": "LIST_POINTS", "label": "📋 Lista / Pontos sequenciais", "description": "Itens organizados em sequência" },
                        { "value": "QUESTION_EXPLORATION", "label": "❓ Pergunta → Exploração → Resposta", "description": "Levanta questão e desenvolve" },
                        { "value": "THESIS_ARGUMENTS", "label": "📝 Tese → Argumentos → Conclusão", "description": "Estrutura argumentativa clássica" },
                        { "value": "PROGRESSIVE_REVELATION", "label": "🔮 Revelação progressiva", "description": "Mistério → pistas → verdade" }
                    ]
                },
                {
                    "id": "narrative_perspective",
                    "order": 3,
                    "label": "Qual a perspectiva narrativa?",
                    "helpText": "Define quem está 'falando' no vídeo. Afeta a conexão com o espectador e o tom de autoridade.",
                    "example": "Para criar conexão pessoal, use 'Primeira pessoa'. Para falar diretamente com o espectador, use 'Segunda pessoa'. Para contar histórias de outros, use 'Terceira pessoa'.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "FIRST_PERSON", "label": "👤 Primeira pessoa", "description": "Eu descobri, eu fiz, minha experiência" },
                        { "value": "SECOND_PERSON", "label": "👆 Segunda pessoa", "description": "Você precisa, você vai, sua vida" },
                        { "value": "THIRD_PERSON", "label": "👥 Terceira pessoa", "description": "Ele fez, ela descobriu, eles conseguiram" },
                        { "value": "NARRATOR", "label": "🎙️ Narrador onisciente", "description": "Observador externo que sabe tudo" }
                    ]
                },
                {
                    "id": "complexity_level",
                    "order": 4,
                    "label": "Qual o nível de complexidade do público?",
                    "helpText": "Define a profundidade técnica e o vocabulário. Afeta densidade de informação e necessidade de explicações.",
                    "example": "Para público geral sem conhecimento prévio, use 'Leigo'. Para profissionais da área, use 'Avançado' ou 'Especialista'. Na dúvida, 'Intermediário' funciona para a maioria.",
                    "type": "select",
                    "required": true,
                    "options": [
                        { "value": "BEGINNER", "label": "🌱 Leigo", "description": "Explicações completas, sem jargões" },
                        { "value": "INTERMEDIATE", "label": "📊 Intermediário", "description": "Alguns termos técnicos, explicações parciais" },
                        { "value": "ADVANCED", "label": "🎓 Avançado", "description": "Assume conhecimento prévio" },
                        { "value": "EXPERT", "label": "🔬 Especialista", "description": "Linguagem técnica completa" }
                    ]
                }
            ],
            outputFields: [
                { "key": "contentType", "label": "Tipo de Conteúdo", "type": "select", "editable": true, "options": ["NEWS", "EDUCATIONAL", "STORYTELLING", "ENTERTAINMENT", "ARGUMENTATIVE", "PERSUASIVE", "SOCIAL_PROOF", "DEMONSTRATION"] },
                { "key": "narrativeStructure", "label": "Estrutura Narrativa", "type": "select", "editable": true, "options": ["PROBLEM_SOLUTION", "STORY_ARC", "LIST_POINTS", "QUESTION_EXPLORATION", "THESIS_ARGUMENTS", "PROGRESSIVE_REVELATION"] },
                { "key": "narrativePerspective", "label": "Perspectiva Narrativa", "type": "select", "editable": true, "options": ["FIRST_PERSON", "SECOND_PERSON", "THIRD_PERSON", "NARRATOR"] },
                { "key": "complexityLevel", "label": "Nível de Complexidade", "type": "select", "editable": true, "options": ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] },
                { "key": "description", "label": "Descrição", "type": "textarea", "editable": true },
                { "key": "suggestedHookTemplate", "label": "Template de Abertura", "type": "textarea", "editable": true },
                { "key": "suggestedCtaTemplate", "label": "Template de CTA", "type": "textarea", "editable": true }
            ],
            validationRules: {
                "structureRecommendations": {
                    "NEWS": ["PROBLEM_SOLUTION", "QUESTION_EXPLORATION"],
                    "EDUCATIONAL": ["PROBLEM_SOLUTION", "LIST_POINTS", "QUESTION_EXPLORATION"],
                    "STORYTELLING": ["STORY_ARC", "PROGRESSIVE_REVELATION"],
                    "ENTERTAINMENT": ["STORY_ARC", "LIST_POINTS"],
                    "ARGUMENTATIVE": ["THESIS_ARGUMENTS", "QUESTION_EXPLORATION"],
                    "PERSUASIVE": ["PROBLEM_SOLUTION", "THESIS_ARGUMENTS"],
                    "SOCIAL_PROOF": ["STORY_ARC", "LIST_POINTS"],
                    "DEMONSTRATION": ["PROBLEM_SOLUTION", "LIST_POINTS"]
                },
                "perspectiveRecommendations": {
                    "STORYTELLING": ["FIRST_PERSON", "THIRD_PERSON", "NARRATOR"],
                    "EDUCATIONAL": ["SECOND_PERSON", "NARRATOR"],
                    "PERSUASIVE": ["SECOND_PERSON", "FIRST_PERSON"],
                    "SOCIAL_PROOF": ["THIRD_PERSON", "FIRST_PERSON"]
                }
            }
        }
    });

    console.log('✅ Agents seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
