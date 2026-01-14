const { PrismaClient } = require('../prisma/generated/client_final');
const db = new PrismaClient();

async function main() {
    const agent = await db.globalAgent.findUnique({
        where: { type: 'SCRIPTWRITER' }
    });

    if (!agent) {
        console.error('Agent SCRIPTWRITER not found');
        return;
    }

    let prompt = agent.systemPrompt;

    // 1. Update Output Structure
    const newOutputStructure = `## ESTRUTURA DE OUTPUT

Retornar JSON com a seguinte estrutura EXATA:

\`\`\`json
{
  "hook": "Frase de abertura impactante (será a narração da cena 1)",
  "cta": "Chamada para ação final (será a narração da última cena)",
  "scenes": [
    {
      "order": 1,
      "goal": "Hook - capturar atenção",
      "narration": "MESMA FRASE DO HOOK ACIMA",
      "visualDescription": "Descrição visual detalhada para geração de imagem",
      "duration": 5
    },
    {
      "order": 2,
      "goal": "Desenvolvimento - apresentar contexto",
      "narration": "Texto de narração",
      "visualDescription": "Descrição visual",
      "duration": 5
    },
    {
      "order": N,
      "goal": "CTA - fechar com chamada para ação",
      "narration": "MESMA FRASE DO CTA ACIMA",
      "visualDescription": "Descrição visual",
      "duration": 5
    }
  ]
}
\`\`\`

### Regras do Output

1.  **EXATAMENTE** \`constraints.maxScenes\` cenas
2.  Campo \`hook\` = narração da cena 1 (duplicado propositalmente)
3.  Campo \`cta\` = narração da última cena (duplicado propositalmente)
4.  Primeira cena DEVE ser do tipo de Hook especificado em \`style.hookType\`
5.  Última cena DEVE ser do tipo de CTA especificado em \`style.ctaType\`
6.  Cada cena tem duração aproximada de \`constraints.avgSceneDuration\`
7.  Campo \`goal\` descreve o objetivo narrativo da cena
8.  Campo \`visualDescription\` deve ser otimizado para IA de imagem

### Validação de Hook por Tipo

| hookType | O que a primeira cena DEVE ter |
| :------- | :----------------------------- |
| QUESTION | Abrir com pergunta intrigante |
| STATEMENT | Abrir com afirmação impactante |
| VISUAL | Abrir com descrição visual marcante |
| CHALLENGE | Abrir com desafio ao espectador |
| STATISTIC | Abrir com dado/estatística surpreendente |

### Validação de CTA por Tipo

| ctaType | O que a última cena DEVE ter |
| :------ | :--------------------------- |
| CTA_DIRECT | Chamada direta para ação ("Siga agora!") |
| CLIFFHANGER | Deixar gancho para próximo conteúdo |
| REFLECTION | Provocar reflexão no espectador |
| COMMUNITY | Convidar para engajamento/comunidade |
| TEASER | Antecipar conteúdo futuro |
`;

    // Regex to find the section. Assumes it starts with ## ESTRUTURA DE OUTPUT and goes until the next ## or end of string.
    const outputRegex = /## ESTRUTURA DE OUTPUT[\s\S]*?(?=\n##|$)/;

    if (outputRegex.test(prompt)) {
        console.log('Replacing existing OUTPUT section...');
        prompt = prompt.replace(outputRegex, newOutputStructure);
    } else {
        console.log('Appending OUTPUT section...');
        prompt += '\n\n' + newOutputStructure;
    }

    // 2. Add Pervasive Climate Section
    const pervasiveSection = `## APLICAÇÃO PERVASIVA DO CLIMA

O Clima (Tone/Climate) definido NÃO DEVE ser aplicado apenas na primeira ou última cena. Ele deve permear TODO o roteiro.

1. **Estado Emocional**: Se o clima define um estado (ex: "Melancólico"), TODAS as cenas devem carregar esse peso emocional, seja na escolha de palavras ou na descrição visual.
2. **Dinâmica de Revelação**:
   - Se \`revelationDynamic\` for GRADUAL: Revele informações principais aos poucos, cena a cena.
   - Se \`revelationDynamic\` for IMMEDIATE: Entregue o ponto central logo no início e use as cenas seguintes para explorar consequências.
   - Se \`revelationDynamic\` for TWIST: Construa uma narrativa que propositalmente leve a uma direção para surpreender no final.
3. **Pressão Narrativa**:
   - Se \`narrativePressure\` for SLOW: Use cenas mais longas, pausas na fala, descrições contemplativas.
   - Se \`narrativePressure\` for FAST: Use cortes rápidos, frases curtas, senso de urgência constante.

**Checklist de Verificação por Cena:**
- [ ] A narração reflete a pressão narrativa escolhida?
- [ ] O visual sugere o estado emocional do clima?
- [ ] A estrutura da cena contribui para a dinâmica de revelação definida?
`;

    const pervasiveRegex = /## APLICAÇÃO PERVASIVA DO CLIMA[\s\S]*?(?=\n##|$)/;

    if (pervasiveRegex.test(prompt)) {
        console.log('Replacing existing PERVASIVE CLIMATE section...');
        prompt = prompt.replace(pervasiveRegex, pervasiveSection);
    } else {
        console.log('Appending PERVASIVE CLIMATE section...');
        prompt += '\n\n' + pervasiveSection;
    }

    // Save
    await db.globalAgent.update({
        where: { id: agent.id },
        data: { systemPrompt: prompt }
    });

    console.log('Successfully updated SCRIPTWRITER system prompt.');
}

main()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
