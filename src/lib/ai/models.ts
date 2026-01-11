export interface AIModel {
    id: string                    // ID do OpenRouter
    name: string                  // Nome para exibição
    description: string           // Descrição curta
    provider: string              // Provedor (DeepSeek, Anthropic, OpenAI, etc)

    // Custos
    inputCostPer1M: number        // Custo em USD por 1M tokens input
    outputCostPer1M: number       // Custo em USD por 1M tokens output

    // Configuração no app
    isDefault: boolean            // É o modelo padrão?
    isFree: boolean               // Gratuito para o usuário?
    creditsPerUse: number         // Créditos cobrados (0 se gratuito)

    // UI
    tier: 'free' | 'standard' | 'premium'
    badge?: string                // Ex: "Recomendado", "Novo", "Mais Rápido"
    icon?: string                 // Emoji ou ícone

    // Configurações técnicas
    maxTokens?: number
    contextWindow?: number
    supportsVision?: boolean
}

export const SCRIPT_GENERATION_MODELS: AIModel[] = [
    // ══════════════════════════════════════════════════════════════
    // GRATUITO (Padrão)
    // ══════════════════════════════════════════════════════════════
    {
        id: 'deepseek/deepseek-v3.2',
        name: 'DeepSeek V3.2',
        description: 'Modelo mais recente da DeepSeek. Rápido e de alta qualidade.',
        provider: 'DeepSeek',
        inputCostPer1M: 0.21,
        outputCostPer1M: 0.32,
        isDefault: true,
        isFree: true,
        creditsPerUse: 0,
        tier: 'free',
        badge: 'Recomendado',
        icon: '🚀',
        contextWindow: 131000,
    },

    // ══════════════════════════════════════════════════════════════
    // STANDARD (Cobram créditos)
    // ══════════════════════════════════════════════════════════════
    {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Modelo compacto da OpenAI. Bom equilíbrio custo-qualidade.',
        provider: 'OpenAI',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        isDefault: false,
        isFree: false,
        creditsPerUse: 2,
        tier: 'standard',
        icon: '⚡',
        contextWindow: 128000,
    },
    {
        id: 'google/gemini-flash-1.5',
        name: 'Gemini Flash 1.5',
        description: 'Modelo ultra-rápido do Google.',
        provider: 'Google',
        inputCostPer1M: 0.075,
        outputCostPer1M: 0.30,
        isDefault: false,
        isFree: false,
        creditsPerUse: 1,
        tier: 'standard',
        icon: '💨',
        contextWindow: 1000000,
    },
    {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        description: 'Modelo open source da Meta. Ótimo para criatividade.',
        provider: 'Meta',
        inputCostPer1M: 0.35,
        outputCostPer1M: 0.40,
        isDefault: false,
        isFree: false,
        creditsPerUse: 2,
        tier: 'standard',
        icon: '🦙',
        contextWindow: 131000,
    },

    // ══════════════════════════════════════════════════════════════
    // PREMIUM (Cobram mais créditos)
    // ══════════════════════════════════════════════════════════════
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Modelo premium da Anthropic. Máxima qualidade e criatividade.',
        provider: 'Anthropic',
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
        isDefault: false,
        isFree: false,
        creditsPerUse: 5,
        tier: 'premium',
        badge: 'Premium',
        icon: '✨',
        contextWindow: 200000,
    },
    {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        description: 'Modelo flagship da OpenAI. Excelente qualidade geral.',
        provider: 'OpenAI',
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.00,
        isDefault: false,
        isFree: false,
        creditsPerUse: 5,
        tier: 'premium',
        badge: 'Premium',
        icon: '🧠',
        contextWindow: 128000,
    },
]

// Helpers
export function getDefaultModel(): AIModel {
    return SCRIPT_GENERATION_MODELS.find(m => m.isDefault) ?? SCRIPT_GENERATION_MODELS[0]
}

export function getModelById(id: string): AIModel | undefined {
    return SCRIPT_GENERATION_MODELS.find(m => m.id === id)
}

export function getModelCredits(modelId: string): number {
    const model = getModelById(modelId)
    return model?.creditsPerUse ?? 0
}

export function isModelFree(modelId: string): boolean {
    const model = getModelById(modelId)
    return model?.isFree ?? false
}

export function getModelsByTier(tier: AIModel['tier']): AIModel[] {
    return SCRIPT_GENERATION_MODELS.filter(m => m.tier === tier)
}
