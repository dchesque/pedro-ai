// Modelos disponíveis organizados por categoria
export const AVAILABLE_MODELS = {
    // Modelos de texto (chat, agentes)
    text: [
        { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2 (Recomendado - Econômico)', category: 'economy' },
        { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', category: 'economy' },
        { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Premium)', category: 'premium' },
        { id: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', category: 'balanced' },
        { id: 'openai/gpt-4o', label: 'GPT-4o (Premium)', category: 'premium' },
        { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', category: 'balanced' },
        { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', category: 'balanced' },
        { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', category: 'economy' },
    ],

    // Modelos de imagem
    image: [
        { id: 'google/gemini-2.5-flash-image-preview', label: 'Gemini 2.5 Flash Image (Padrão)' },
        { id: 'openai/gpt-image-1', label: 'DALL-E 3 (GPT Image)' },
    ],

    // Modelos com vision (análise de imagem)
    vision: [
        { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Recomendado)' },
        { id: 'openai/gpt-4o', label: 'GPT-4o' },
        { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    ],
} as const

// Features que usam LLM e seus tipos de modelo
export const LLM_FEATURES = {
    agent_scriptwriter: {
        label: 'Agente Roteirista',
        description: 'Gera roteiros para shorts/reels',
        icon: '🎬',
        modelType: 'text' as const,
        defaultModel: 'deepseek/deepseek-v3.2',
    },
    agent_prompt_engineer: {
        label: 'Agente Prompt Engineer',
        description: 'Otimiza prompts para geração de imagem',
        icon: '🎨',
        modelType: 'text' as const,
        defaultModel: 'deepseek/deepseek-v3.2',
    },
    agent_narrator: {
        label: 'Agente Narrador',
        description: 'Gera narração para vídeos (futuro)',
        icon: '🎙️',
        modelType: 'text' as const,
        defaultModel: 'deepseek/deepseek-v3.2',
    },
    ai_chat: {
        label: 'Chat com IA',
        description: 'Modelo padrão para o chat',
        icon: '💬',
        modelType: 'text' as const,
        defaultModel: 'deepseek/deepseek-v3.2',
    },
    ai_image: {
        label: 'Geração de Imagem',
        description: 'Modelo para gerar imagens via OpenRouter',
        icon: '🖼️',
        modelType: 'image' as const,
        defaultModel: 'google/gemini-2.5-flash-image-preview',
    },
    character_analysis: {
        label: 'Análise de Personagem',
        description: 'Vision para analisar imagens de personagens',
        icon: '👁️',
        modelType: 'vision' as const,
        defaultModel: 'anthropic/claude-3.5-sonnet',
    },
} as const

export type LLMFeatureKey = keyof typeof LLM_FEATURES
export type ModelType = 'text' | 'image' | 'vision'

// Função para obter modelos disponíveis por feature
export function getAvailableModelsForFeature(featureKey: LLMFeatureKey) {
    const feature = LLM_FEATURES[featureKey]
    return AVAILABLE_MODELS[feature.modelType]
}

// Fallback defaults (usado quando não há config no banco)
export function getHardcodedDefault(featureKey: LLMFeatureKey): string {
    return LLM_FEATURES[featureKey].defaultModel
}
