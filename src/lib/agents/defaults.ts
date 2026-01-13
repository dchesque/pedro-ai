import { SystemAgentType } from '../../../prisma/generated/client_final'

// ============================================
// PROMPTS PADRÃO DOS AGENTES (FALLBACK)
// ============================================

export const DEFAULT_AGENT_PROMPTS: Record<SystemAgentType, {
    name: string
    systemPrompt: string
    model: string
    temperature: number
}> = {
    SCRIPTWRITER: {
        name: 'Roteirista Padrão',
        model: 'deepseek/deepseek-v3.2',
        temperature: 0.7,
        systemPrompt: `Você é um roteirista especialista em criar roteiros virais para shorts/reels.

Seu objetivo é criar roteiros que:
- Prendam a atenção nos primeiros 3 segundos (gancho forte)
- Mantenham o espectador engajado até o final
- Tenham uma narrativa clara com começo, meio e fim
- Terminem com um CTA (call to action) relevante

REGRAS:
1. Cada cena deve ter entre 3-7 segundos
2. A narração deve ser concisa e impactante
3. A descrição visual deve ser detalhada o suficiente para gerar imagens
4. O total de cenas deve resultar na duração alvo
5. Use linguagem apropriada para o estilo solicitado

Responda APENAS com JSON válido, sem markdown ou explicações.`,
    },

    PROMPT_ENGINEER: {
        name: 'Engenheiro de Prompts Padrão',
        model: 'deepseek/deepseek-v3.2',
        temperature: 0.5,
        systemPrompt: `Você é um engenheiro de prompts especialista em criar prompts otimizados para modelos de geração de imagem como Flux e Stable Diffusion.

Seu objetivo é transformar descrições visuais em prompts que:
- Gerem imagens de alta qualidade e impacto visual
- Mantenham consistência visual entre as cenas
- Sejam otimizados para o formato vertical (9:16)
- Incluam detalhes técnicos (iluminação, composição, estilo)

ESTRUTURA DO PROMPT:
1. Sujeito principal
2. Ação/pose
3. Ambiente/cenário
4. Iluminação
5. Estilo artístico
6. Qualidade técnica

Responda APENAS com JSON válido, sem markdown ou explicações.`,
    },

    NARRATOR: {
        name: 'Narrador Padrão',
        model: 'deepseek/deepseek-v3.2',
        temperature: 0.3,
        systemPrompt: `Você adapta textos de narração para serem lidos em voz alta de forma natural e envolvente.`,
    },
}

// ============================================
// ESTILOS PADRÃO (FALLBACK)
// ============================================

export interface DefaultStyle {
    key: string
    name: string
    description: string
    icon: string
    scriptwriterPrompt: string
    promptEngineerPrompt: string
    visualStyle: string
    negativePrompt: string
}

export const DEFAULT_STYLES: DefaultStyle[] = [
    {
        key: 'engaging',
        name: 'Envolvente',
        description: 'Conteúdo dinâmico e cativante',
        icon: '🔥',
        scriptwriterPrompt: `
ESTILO: ENVOLVENTE
- Use ganchos fortes e provocativos
- Ritmo acelerado com cortes rápidos
- Linguagem energética e entusiasmada
- Crie curiosidade e suspense
- Finalize com impacto`,
        promptEngineerPrompt: `
ESTILO VISUAL: ENVOLVENTE
- Cores vibrantes e saturadas
- Composições dinâmicas com movimento
- Iluminação dramática
- Alto contraste`,
        visualStyle: 'vibrant colors, dynamic composition, dramatic lighting, high contrast, cinematic, 8k, ultra detailed',
        negativePrompt: 'boring, static, dull colors, flat lighting, amateur',
    },
    {
        key: 'educational',
        name: 'Educacional',
        description: 'Informativo e didático',
        icon: '📚',
        scriptwriterPrompt: `
ESTILO: EDUCACIONAL
- Explique conceitos de forma clara e simples
- Use analogias e exemplos do cotidiano
- Estruture em pontos fáceis de lembrar
- Inclua dados e fatos interessantes
- Evite jargões técnicos`,
        promptEngineerPrompt: `
ESTILO VISUAL: EDUCACIONAL
- Visual limpo e organizado
- Infográficos e diagramas
- Cores calmas e profissionais
- Foco no assunto principal`,
        visualStyle: 'clean, professional, infographic style, clear composition, soft lighting, educational',
        negativePrompt: 'cluttered, confusing, chaotic, dark, scary',
    },
    {
        key: 'funny',
        name: 'Divertido',
        description: 'Humorístico e descontraído',
        icon: '😂',
        scriptwriterPrompt: `
ESTILO: DIVERTIDO
- Inclua humor e piadas leves
- Use linguagem coloquial e memes
- Crie situações engraçadas e relatable
- Timing cômico é essencial
- Exageros são bem-vindos`,
        promptEngineerPrompt: `
ESTILO VISUAL: DIVERTIDO
- Expressões exageradas
- Cores alegres e saturadas
- Estilo cartoon/caricatura permitido
- Elementos cômicos visuais`,
        visualStyle: 'fun, colorful, expressive, cartoon style allowed, bright, cheerful, comedic',
        negativePrompt: 'serious, dark, scary, realistic gore, depressing',
    },
    {
        key: 'dramatic',
        name: 'Dramático',
        description: 'Intenso e emocionante',
        icon: '🎭',
        scriptwriterPrompt: `
ESTILO: DRAMÁTICO
- Crie tensão e suspense
- Use pausas dramáticas
- Construa até um clímax
- Emoções intensas
- Narrativa cinematográfica`,
        promptEngineerPrompt: `
ESTILO VISUAL: DRAMÁTICO
- Iluminação cinematográfica (chiaroscuro)
- Sombras profundas
- Cores dessaturadas ou monocromáticas
- Composições tensas`,
        visualStyle: 'cinematic, dramatic lighting, chiaroscuro, moody, intense, film noir influence, atmospheric',
        negativePrompt: 'bright, cheerful, cartoon, flat lighting, amateur',
    },
    {
        key: 'inspirational',
        name: 'Inspiracional',
        description: 'Motivacional e positivo',
        icon: '✨',
        scriptwriterPrompt: `
ESTILO: INSPIRACIONAL
- Mensagens de superação e esperança
- Histórias de transformação
- Linguagem positiva e encorajadora
- Conecte com emoções profundas
- Termine com chamada à ação motivadora`,
        promptEngineerPrompt: `
ESTILO VISUAL: INSPIRACIONAL
- Luz dourada (golden hour)
- Horizontes amplos
- Natureza e espaços abertos
- Pessoas em momentos de conquista`,
        visualStyle: 'golden hour lighting, hopeful, inspiring, wide shots, nature, sunrise/sunset, ethereal, uplifting',
        negativePrompt: 'dark, depressing, gloomy, confined spaces, negative',
    },
]

// Helper para buscar estilo padrão
export function getDefaultStyle(key: string): DefaultStyle | undefined {
    return DEFAULT_STYLES.find(s => s.key === key)
}
