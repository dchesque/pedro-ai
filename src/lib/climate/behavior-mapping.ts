import {
    EmotionalState,
    RevelationDynamic,
    NarrativePressure,
    HookType,
    ClosingType,
    Climate
} from '../../../prisma/generated/client_final'

export interface ClimateEffect {
    label: string
    icon: string
    subtitle: string
    promptInstructions: string
}

export const EMOTIONAL_STATE_PROMPTS: Record<EmotionalState, ClimateEffect> = {
    CURIOSITY: {
        label: 'Curiosidade',
        icon: '🔍',
        subtitle: 'Precisa entender',
        promptInstructions: `
FORÇA EMOCIONAL: CURIOSIDADE
- Abra com uma pergunta ou fato incompleto que force o espectador a querer saber o próximo passo.
- Use lacunas de informação: "Você já se perguntou...", "O que pouca gente sabe sobre...".
- Mantenha o tom explicativo mas instigante.
- Cada cena deve dar uma pista, mas não a resposta completa até o momento certo.
`
    },
    THREAT: {
        label: 'Ameaça',
        icon: '⚡',
        subtitle: 'Precisa prestar attention',
        promptInstructions: `
FORÇA EMOCIONAL: AMEAÇA
- Abra com uma consequência negativa iminente ou um erro comum perigoso.
- Crie senso de perda potencial: "Se você não fizer isso...", "O erro que está destruindo sua...".
- Use palavras de impacto: perigo, erro, cuidado, pare, urgente.
- Mantenha a tensão de que algo importante está em risco.
`
    },
    FASCINATION: {
        label: 'Fascínio',
        icon: '✨',
        subtitle: 'Entra em absorção',
        promptInstructions: `
FORÇA EMOCIONAL: FASCÍNIO
- Use descrições sensoriais e visuais ricas.
- Foque no extraordinário, no belo ou no extremamente satisfatório.
- O tom deve ser de admiração e descoberta.
- "Imagine um mundo onde...", "A perfeição absoluta de...".
`
    },
    CONFRONTATION: {
        label: 'Confronto',
        icon: '🔥',
        subtitle: 'É desafiado',
        promptInstructions: `
FORÇA EMOCIONAL: CONFRONTO
- Desafie crenças comuns do espectador logo no início.
- Use afirmações ousadas e polarizadoras.
- O tom deve ser direto, provocativo e energético.
- "A verdade que ninguém te conta é...", "Você está sendo enganado sobre...".
`
    },
    DARK_INSPIRATION: {
        label: 'Inspiração Sombria',
        icon: '🌑',
        subtitle: 'Sente profundidade',
        promptInstructions: `
FORÇA EMOCIONAL: INSPIRAÇÃO SOMBRIA
- Explore temas existenciais, densos ou levemente melancólicos.
- O tom deve ser profundo, poético e reflexivo.
- Use metáforas sobre o tempo, legado ou a natureza humana.
- "No silêncio de nossas escolhas...", "O que resta quando tudo se apaga...".
`
    }
}

export const REVELATION_DYNAMIC_PROMPTS: Record<RevelationDynamic, ClimateEffect> = {
    PROGRESSIVE: {
        label: 'Construir aos poucos',
        icon: '📈',
        subtitle: 'Construção linear da verdade',
        promptInstructions: 'DINÂMICA: Desenvolva o argumento de forma lógica e crescente. Cada cena adiciona uma camada de entendimento até a conclusão.'
    },
    HIDDEN: {
        label: 'Esconder até o final',
        icon: '🎭',
        subtitle: 'Plot twist no último segundo',
        promptInstructions: 'DINÂMICA: Mantenha o segredo principal oculto. Use pistas falsas ou mistério total. A revelação só deve acontecer na última cena ou no CTA.'
    },
    EARLY: {
        label: 'Revelar cedo e aprofundar',
        icon: '💡',
        subtitle: 'Impacto imediato e explicação',
        promptInstructions: 'DINÂMICA: Entregue o maior valor ou a verdade principal nos primeiros 5 segundos. Use o restante do tempo para dissecar, provar ou aprofundar.'
    },
    FRAGMENTS: {
        label: 'Mostrar fragmentos',
        icon: '🧩',
        subtitle: 'Estilo não-linear ou mosaico',
        promptInstructions: 'DINÂMICA: Mostre pedaços da verdade de forma intensa. O espectador deve montar o quebra-cabeça mentalmente enquanto assiste.'
    }
}

export const NARRATIVE_PRESSURE_PROMPTS: Record<NarrativePressure, { label: string; icon: string; subtitle: string; promptInstructions: string; sentenceMaxWords: number; pauseFrequency: string }> = {
    SLOW: {
        label: 'Lento e denso',
        icon: '🐢',
        subtitle: 'Para reflexão profunda',
        promptInstructions: 'RITMO: Use frases longas, pausas prolongadas após afirmações importantes. Dê tempo para o visual "respirar".',
        sentenceMaxWords: 20,
        pauseFrequency: 'alta'
    },
    FLUID: {
        label: 'Fluido e hipnótico',
        icon: '🌊',
        subtitle: 'Equilíbrio natural',
        promptInstructions: 'RITMO: Mantenha um fluxo constante de informação. Transições suaves entre ideias. Ritmo de conversa natural.',
        sentenceMaxWords: 15,
        pauseFrequency: 'média'
    },
    FAST: {
        label: 'Rápido e agressivo',
        icon: '⚡',
        subtitle: 'Impacto e urgência',
        promptInstructions: 'RITMO: Use frases extremamente curtas (staccato). Sem tempo para respirar entre ideias. Corte rápido de pensamentos.',
        sentenceMaxWords: 8,
        pauseFrequency: 'baixa'
    }
}

export function buildClimatePrompt(climate: Partial<Climate>): string {
    const sections: string[] = []

    if (climate.emotionalState) {
        sections.push(EMOTIONAL_STATE_PROMPTS[climate.emotionalState].promptInstructions)
    }

    if (climate.revelationDynamic) {
        sections.push(REVELATION_DYNAMIC_PROMPTS[climate.revelationDynamic].promptInstructions)
    }

    if (climate.narrativePressure) {
        const pressure = NARRATIVE_PRESSURE_PROMPTS[climate.narrativePressure]
        sections.push(pressure.promptInstructions)
        sections.push(`REGRAS DE ESCRITA: Máximo de ${pressure.sentenceMaxWords} palavras por frase. Frequência de pausas: ${pressure.pauseFrequency}.`)
    }

    if (climate.promptFragment) {
        sections.push(`AJUSTE FINO ADICIONAL:\n${climate.promptFragment}`)
    }

    return sections.join('\n\n')
}
