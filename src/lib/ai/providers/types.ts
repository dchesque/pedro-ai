// Tipos base para o sistema de providers

export type ProviderType = 'openrouter' | 'fal' | 'anthropic' | 'openai'

export interface ProviderInfo {
    id: ProviderType
    name: string
    description: string
    icon: string
    website: string
    capabilities: ProviderCapability[]
    isEnabled: boolean
}

export type ProviderCapability = 'text' | 'image' | 'video' | 'audio' | 'vision' | 'embedding'

export interface ProviderModel {
    id: string                      // ID único do modelo no provider
    name: string                    // Nome para exibição
    description?: string            // Descrição do modelo
    provider: ProviderType          // Provider de origem

    // Capacidades
    capabilities: ProviderCapability[]
    contextWindow?: number          // Janela de contexto (tokens)
    maxOutputTokens?: number        // Máximo de tokens de saída

    // Pricing (normalizado para USD)
    pricing: ModelPricing

    // Metadados
    isDeprecated?: boolean
    isBeta?: boolean
    releaseDate?: string
}

export interface ModelPricing {
    // Para modelos de texto (por 1M tokens)
    inputPer1M?: number             // USD por 1M tokens de input
    outputPer1M?: number            // USD por 1M tokens de output

    // Para modelos de imagem
    perImage?: number               // USD por imagem gerada
    perMegapixel?: number           // USD por megapixel

    // Para modelos de vídeo
    perSecond?: number              // USD por segundo de vídeo
    perMinute?: number              // USD por minuto de vídeo

    // Modelo de cobrança
    billingType: 'token' | 'per-request' | 'per-second' | 'per-image'

    // Estimativa para o app (convertido em créditos)
    estimatedCreditsPerUse?: number
}

// Interface que todo adapter de provider deve implementar
export interface ProviderAdapter {
    readonly providerId: ProviderType
    readonly providerInfo: ProviderInfo

    // Buscar todos os modelos disponíveis
    fetchModels(): Promise<ProviderModel[]>

    // Buscar modelos por capacidade
    fetchModelsByCapability(capability: ProviderCapability): Promise<ProviderModel[]>

    // Buscar um modelo específico
    fetchModel(modelId: string): Promise<ProviderModel | null>

    // Verificar se o provider está configurado (API key existe)
    isConfigured(): boolean
}

// Resposta padronizada da API
export interface ModelsApiResponse {
    provider: ProviderInfo
    models: ProviderModel[]
    cachedAt: string
    cacheExpiresAt: string
}
