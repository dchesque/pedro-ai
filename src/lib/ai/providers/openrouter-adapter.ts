import {
    ProviderAdapter,
    ProviderInfo,
    ProviderModel,
    ProviderCapability,
    ModelPricing
} from './types'

// Resposta da API do OpenRouter
interface OpenRouterApiModel {
    id: string
    name: string
    description?: string
    context_length?: number
    pricing: {
        prompt: string      // Custo por token de input (string numérica)
        completion: string  // Custo por token de output (string numérica)
        image?: string      // Custo por imagem (se aplicável)
    }
    top_provider?: {
        context_length?: number
        max_completion_tokens?: number
    }
    architecture?: {
        modality?: string
        input_modalities?: string[]
        output_modalities?: string[]
    }
}

interface OpenRouterApiResponse {
    data: OpenRouterApiModel[]
}

export class OpenRouterAdapter implements ProviderAdapter {
    readonly providerId = 'openrouter' as const

    readonly providerInfo: ProviderInfo = {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Acesso unificado a múltiplos LLMs (OpenAI, Anthropic, Google, Meta, etc.)',
        icon: '🌐',
        website: 'https://openrouter.ai',
        capabilities: ['text', 'image', 'vision'],
        isEnabled: true,
    }

    private apiKey: string | undefined

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async fetchModels(): Promise<ProviderModel[]> {
        if (!this.isConfigured()) {
            console.warn('[OpenRouterAdapter] API key not configured')
            return []
        }

        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 }, // Cache de 1 hora no Next.js
        })

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`)
        }

        const data: OpenRouterApiResponse = await response.json()
        return data.data.map(model => this.normalizeModel(model))
    }

    async fetchModelsByCapability(capability: ProviderCapability): Promise<ProviderModel[]> {
        const allModels = await this.fetchModels()
        return allModels.filter(m => m.capabilities.includes(capability))
    }

    async fetchModel(modelId: string): Promise<ProviderModel | null> {
        const allModels = await this.fetchModels()
        return allModels.find(m => m.id === modelId) || null
    }

    private normalizeModel(raw: OpenRouterApiModel): ProviderModel {
        const capabilities = this.extractCapabilities(raw)
        const pricing = this.extractPricing(raw)

        return {
            id: raw.id,
            name: raw.name || raw.id,
            description: raw.description,
            provider: 'openrouter',
            capabilities,
            contextWindow: raw.context_length || raw.top_provider?.context_length,
            maxOutputTokens: raw.top_provider?.max_completion_tokens,
            pricing,
        }
    }

    private extractCapabilities(raw: OpenRouterApiModel): ProviderCapability[] {
        const caps: ProviderCapability[] = []

        const inputMods = raw.architecture?.input_modalities || []
        const outputMods = raw.architecture?.output_modalities || []

        // Texto
        if (inputMods.includes('text') || outputMods.includes('text')) {
            caps.push('text')
        }

        // Imagem (geração)
        if (outputMods.includes('image')) {
            caps.push('image')
        }

        // Vision (input de imagem)
        if (inputMods.includes('image')) {
            caps.push('vision')
        }

        // Audio
        if (inputMods.includes('audio') || outputMods.includes('audio')) {
            caps.push('audio')
        }

        // Se não detectou nada, assume texto
        if (caps.length === 0) {
            caps.push('text')
        }

        return caps
    }

    private extractPricing(raw: OpenRouterApiModel): ModelPricing {
        // OpenRouter retorna preço por token, converter para por 1M tokens
        const inputPerToken = parseFloat(raw.pricing.prompt) || 0
        const outputPerToken = parseFloat(raw.pricing.completion) || 0

        const inputPer1M = inputPerToken * 1_000_000
        const outputPer1M = outputPerToken * 1_000_000

        // Estimar créditos: assumindo uso típico de 2K tokens
        // Fórmula: (2000 * inputPer1M / 1M) + (500 * outputPer1M / 1M) 
        // Convertido para créditos (1 crédito ≈ $0.001)
        const typicalCostUSD = (2000 * inputPerToken) + (500 * outputPerToken)
        const estimatedCredits = Math.max(1, Math.ceil(typicalCostUSD * 1000))

        return {
            inputPer1M,
            outputPer1M,
            billingType: 'token',
            estimatedCreditsPerUse: estimatedCredits,
        }
    }
}
