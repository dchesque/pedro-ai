export type ContentType =
    | 'NEWS'
    | 'STORIES'
    | 'MEMES_HUMOR'
    | 'EDUCATIONAL'
    | 'MOTIVATIONAL'
    | 'TUTORIAL'
    | 'CUSTOM';

export type DiscourseArchitecture =
    | 'DIRECT_OBJECTIVE'
    | 'NARRATIVE_FLUID'
    | 'TECHNICAL_DETAILED'
    | 'CONVERSATIONAL'
    | 'PROVOCATIVE';

export type LanguageRegister =
    | 'FORMAL'
    | 'INFORMAL'
    | 'TECHNICAL'
    | 'COLLOQUIAL';

export type ScriptFunction =
    | 'INFORM'
    | 'ENTERTAIN'
    | 'CONVINCE'
    | 'REFLECT';

export type NarratorPosture =
    | 'AUTHORITY'
    | 'COMPANION'
    | 'OBSERVER'
    | 'PROVOCATEUR';

export type ContentComplexity =
    | 'SIMPLE'
    | 'MEDIUM'
    | 'DENSE';

// Labels em português para UI
export const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; description: string; icon: string }> = {
    NEWS: { label: 'Notícias', description: 'Fatos, atualidades e informativos', icon: '📰' },
    STORIES: { label: 'Histórias', description: 'Narrativas, contos e ficção', icon: '📖' },
    MEMES_HUMOR: { label: 'Memes/Humor', description: 'Piadas, sátiras e conteúdo engraçado', icon: '😂' },
    EDUCATIONAL: { label: 'Educacional', description: 'Explicações, conceitos e aprendizado', icon: '🎓' },
    MOTIVATIONAL: { label: 'Motivacional', description: 'Inspiração e desenvolvimento pessoal', icon: '✨' },
    TUTORIAL: { label: 'Tutorial', description: 'Passo a passo e "como fazer"', icon: '🔧' },
    CUSTOM: { label: 'Personalizado', description: 'Regras totalmente customizadas', icon: '⚙️' },
};

export const DISCOURSE_ARCHITECTURE_LABELS: Record<DiscourseArchitecture, { label: string; description: string }> = {
    DIRECT_OBJECTIVE: { label: 'Direto e Objetivo', description: 'Vai direto ao ponto, sem rodeios' },
    NARRATIVE_FLUID: { label: 'Narrativo e Fluido', description: 'Conta uma história de forma natural' },
    TECHNICAL_DETAILED: { label: 'Técnico e Detalhado', description: 'Explica com profundidade e precisão' },
    CONVERSATIONAL: { label: 'Conversacional', description: 'Como uma conversa informal' },
    PROVOCATIVE: { label: 'Provocativo', description: 'Desafia e questiona o espectador' },
};

export const LANGUAGE_REGISTER_LABELS: Record<LanguageRegister, { label: string; description: string }> = {
    FORMAL: { label: 'Formal', description: 'Linguagem culta e profissional' },
    INFORMAL: { label: 'Informal', description: 'Linguagem casual e descontraída' },
    TECHNICAL: { label: 'Técnico', description: 'Termos específicos da área' },
    COLLOQUIAL: { label: 'Coloquial', description: 'Gírias e expressões populares' },
};

export const SCRIPT_FUNCTION_LABELS: Record<ScriptFunction, { label: string; description: string; icon: string }> = {
    INFORM: { label: 'Informar', description: 'Transmitir conhecimento ou notícias', icon: '📢' },
    ENTERTAIN: { label: 'Entreter', description: 'Divertir e engajar o público', icon: '🎭' },
    CONVINCE: { label: 'Convencer', description: 'Persuadir para uma ação ou ideia', icon: '🎯' },
    REFLECT: { label: 'Provocar Reflexão', description: 'Fazer o espectador pensar', icon: '💭' },
};

export const NARRATOR_POSTURE_LABELS: Record<NarratorPosture, { label: string; description: string; icon: string }> = {
    AUTHORITY: { label: 'Autoridade', description: 'Expert que ensina com confiança', icon: '👨‍🏫' },
    COMPANION: { label: 'Companheiro', description: 'Amigo que compartilha experiências', icon: '🤝' },
    OBSERVER: { label: 'Observador', description: 'Narrador neutro que descreve', icon: '👁️' },
    PROVOCATEUR: { label: 'Provocador', description: 'Desafia e questiona convenções', icon: '🔥' },
};

export const CONTENT_COMPLEXITY_LABELS: Record<ContentComplexity, { label: string; description: string }> = {
    SIMPLE: { label: 'Simples', description: 'Fácil de entender, público geral' },
    MEDIUM: { label: 'Médio', description: 'Requer algum conhecimento prévio' },
    DENSE: { label: 'Denso', description: 'Conteúdo técnico e aprofundado' },
};

// Mapeamento de Afinidades Naturais de Climas por Tipo de Conteúdo
// Nota: São afinidades, não regras. O usuário tem liberdade total.
export const CLIMATE_AFFINITIES_MAP: Record<ContentType, string[]> = {
    NEWS: ['CURIOSITY', 'THREAT', 'URGENCY'],
    STORIES: ['FASCINATION', 'TENSION', 'MYSTERY'],
    MEMES_HUMOR: ['LIGHT_CONFRONTATION', 'CURIOSITY', 'IRONY'],
    EDUCATIONAL: ['CURIOSITY', 'INSPIRATION', 'CLARITY'],
    MOTIVATIONAL: ['INSPIRATION', 'EMPOWERMENT', 'HOPE'],
    TUTORIAL: ['CLARITY', 'CONFIDENCE', 'SUPPORT'],
    CUSTOM: [], // Todos disponíveis - liberdade total
};

export type StyleHookType = 'QUESTION' | 'STRONG_STATEMENT' | 'DATA_FACT' | 'SHORT_STORY' | 'CONTRAST';

export type StyleCtaType = 'DIRECT_ACTION' | 'ENGAGEMENT' | 'REFLECTION' | 'SHARE' | 'FOLLOW';

export const STYLE_HOOK_LABELS: Record<StyleHookType, { label: string; description: string }> = {
    QUESTION: { label: 'Pergunta', description: 'Questiona diretamente o público' },
    STRONG_STATEMENT: { label: 'Afirmação Forte', description: 'Declaração polêmica ou impactante' },
    DATA_FACT: { label: 'Dado / Fato', description: 'Curiosidade ou estatística' },
    SHORT_STORY: { label: 'História Curta', description: 'Narrativa breve para conexão' },
    CONTRAST: { label: 'Contraste', description: 'Quebra de expectativa' },
};

export const STYLE_CTA_LABELS: Record<StyleCtaType, { label: string; description: string }> = {
    DIRECT_ACTION: { label: 'Ação Direta', description: 'Compre, Clique, Acesse' },
    ENGAGEMENT: { label: 'Engajamento', description: 'Peça opinião ou comentário' },
    REFLECTION: { label: 'Reflexão', description: 'Provoca pensamento profundo' },
    SHARE: { label: 'Compartilhar', description: 'Incentiva disseminação' },
    FOLLOW: { label: 'Seguir', description: 'Convite para acompanhar' },
};

// Interface do formulário
export interface StyleFormData {
    // Básicas
    name: string;
    description: string;
    icon: string;
    contentType: ContentType;

    // Estrutura
    targetAudience: string;
    keywords: string[];
    discourseArchitecture: DiscourseArchitecture;
    languageRegister: LanguageRegister;

    // Blocos Guiados
    scriptFunction: ScriptFunction;
    narratorPosture: NarratorPosture;
    contentComplexity: ContentComplexity;

    // Avançado
    advancedInstructions: string;

    // Hooks
    hookType?: StyleHookType;
    hookExample: string;
    ctaType?: StyleCtaType;
    ctaExample: string;

    // Visual
    visualPromptBase: string;

    // Climas
    compatibleClimates: string[];
}

// Interface Option para os Selects
export interface Option<T extends string> {
    value: T;
    label: string;
    description: string;
    icon?: string;
}

// Helper para converter labels em options
export function labelsToOptions<T extends string>(
    labels: Record<T, { label: string; description: string; icon?: string }>
): Option<T>[] {
    return Object.entries(labels).map(([value, data]) => ({
        value: value as T,
        ...(data as { label: string; description: string; icon?: string }),
    }));
}
