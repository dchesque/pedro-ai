import {
    ProviderAdapter,
    ProviderInfo,
    ProviderModel,
    ProviderCapability,
    ModelPricing
} from './types'

// Modelos conhecidos do fal.ai com pricing
// Nota: fal.ai não tem uma API pública de listagem, então mantemos uma lista curada
const FAL_KNOWN_MODELS: Array<{
    id: string
    name: string
    description: string
    capabilities: ProviderCapability[]
    pricing: ModelPricing
}> = [
        // ══════════════════════════════════════════════════════════════
        // GERAÇÃO DE IMAGEM
        // ══════════════════════════════════════════════════════════════
        {
            id: 'fal-ai/flux/schnell',
            name: 'Flux Schnell',
            description: 'Geração de imagem ultra-rápida. Ideal para iterações rápidas.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.003, // ~$0.003 por imagem
                billingType: 'per-image',
                estimatedCreditsPerUse: 1,
            },
        },
        {
            id: 'fal-ai/flux/dev',
            name: 'Flux Dev',
            description: 'Geração de imagem de alta qualidade. Bom equilíbrio velocidade/qualidade.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.025,
                billingType: 'per-image',
                estimatedCreditsPerUse: 3,
            },
        },
        {
            id: 'fal-ai/flux-pro',
            name: 'Flux Pro',
            description: 'Geração de imagem profissional. Máxima qualidade.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.05,
                billingType: 'per-image',
                estimatedCreditsPerUse: 5,
            },
        },
        {
            id: 'fal-ai/flux-pro/v1.1',
            name: 'Flux Pro 1.1',
            description: 'Versão mais recente do Flux Pro com melhorias.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.04,
                billingType: 'per-image',
                estimatedCreditsPerUse: 4,
            },
        },
        {
            id: 'fal-ai/stable-diffusion-v3-medium',
            name: 'Stable Diffusion 3 Medium',
            description: 'SD3 otimizado para velocidade.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.035,
                billingType: 'per-image',
                estimatedCreditsPerUse: 4,
            },
        },
        {
            id: 'fal-ai/recraft-v3',
            name: 'Recraft V3',
            description: 'Especializado em design gráfico e ilustrações.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.04,
                billingType: 'per-image',
                estimatedCreditsPerUse: 4,
            },
        },
        {
            id: 'fal-ai/ideogram/v2',
            name: 'Ideogram V2',
            description: 'Excelente para texto em imagens e logos.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.08,
                billingType: 'per-image',
                estimatedCreditsPerUse: 8,
            },
        },

        // ══════════════════════════════════════════════════════════════
        // GERAÇÃO DE VÍDEO
        // ══════════════════════════════════════════════════════════════
        {
            id: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
            name: 'Kling 2.5 Turbo (Text-to-Video)',
            description: 'Geração de vídeo a partir de texto. Alta qualidade.',
            capabilities: ['video'],
            pricing: {
                perSecond: 0.10, // ~$0.10 por segundo
                billingType: 'per-second',
                estimatedCreditsPerUse: 5, // Para 5 segundos
            },
        },
        {
            id: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
            name: 'Kling 2.5 Turbo (Image-to-Video)',
            description: 'Anima uma imagem em vídeo. Alta qualidade.',
            capabilities: ['video'],
            pricing: {
                perSecond: 0.10,
                billingType: 'per-second',
                estimatedCreditsPerUse: 5,
            },
        },
        {
            id: 'fal-ai/minimax-video/video-01-live',
            name: 'MiniMax Video-01 Live',
            description: 'Geração de vídeo rápida e acessível.',
            capabilities: ['video'],
            pricing: {
                perSecond: 0.05,
                billingType: 'per-second',
                estimatedCreditsPerUse: 3,
            },
        },
        {
            id: 'fal-ai/luma-dream-machine',
            name: 'Luma Dream Machine',
            description: 'Vídeos cinematográficos de alta qualidade.',
            capabilities: ['video'],
            pricing: {
                perSecond: 0.15,
                billingType: 'per-second',
                estimatedCreditsPerUse: 8,
            },
        },
        {
            id: 'fal-ai/runway-gen3/turbo/image-to-video',
            name: 'Runway Gen-3 Turbo',
            description: 'Animação de imagem com controle avançado.',
            capabilities: ['video'],
            pricing: {
                perSecond: 0.12,
                billingType: 'per-second',
                estimatedCreditsPerUse: 6,
            },
        },

        // ══════════════════════════════════════════════════════════════
        // UPSCALING / ENHANCEMENT
        // ══════════════════════════════════════════════════════════════
        {
            id: 'fal-ai/creative-upscaler',
            name: 'Creative Upscaler',
            description: 'Aumenta resolução com detalhes gerados por IA.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.02,
                billingType: 'per-image',
                estimatedCreditsPerUse: 2,
            },
        },
        {
            id: 'fal-ai/clarity-upscaler',
            name: 'Clarity Upscaler',
            description: 'Upscaling com preservação de detalhes.',
            capabilities: ['image'],
            pricing: {
                perImage: 0.02,
                billingType: 'per-image',
                estimatedCreditsPerUse: 2,
            },
        },

        // ══════════════════════════════════════════════════════════════
        // ÁUDIO / VOZ
        // ══════════════════════════════════════════════════════════════
        {
            id: 'fal-ai/wizper',
            name: 'Wizper (Speech-to-Text)',
            description: 'Transcrição de áudio para texto.',
            capabilities: ['audio'],
            pricing: {
                perMinute: 0.01,
                billingType: 'per-second',
                estimatedCreditsPerUse: 1,
            },
        },
    ]

export class FalAdapter implements ProviderAdapter {
    readonly providerId = 'fal' as const

    readonly providerInfo: ProviderInfo = {
        id: 'fal',
        name: 'fal.ai',
        description: 'Modelos especializados em geração de imagem e vídeo de alta qualidade.',
        icon: '🎨',
        website: 'https://fal.ai',
        capabilities: ['image', 'video', 'audio'],
        isEnabled: true,
    }

    private apiKey: string | undefined

    constructor() {
        this.apiKey = process.env.FAL_KEY
    }

    isConfigured(): boolean {
        return !!this.apiKey
    }

    async fetchModels(): Promise<ProviderModel[]> {
        // fal.ai não tem API pública de listagem, usamos lista curada

        if (!this.isConfigured()) {
            console.warn('[FalAdapter] API key not configured')
        }

        return FAL_KNOWN_MODELS.map(model => ({
            ...model,
            provider: 'fal' as const,
        }))
    }

    async fetchModelsByCapability(capability: ProviderCapability): Promise<ProviderModel[]> {
        const allModels = await this.fetchModels()
        return allModels.filter(m => m.capabilities.includes(capability))
    }

    async fetchModel(modelId: string): Promise<ProviderModel | null> {
        const allModels = await this.fetchModels()
        return allModels.find(m => m.id === modelId) || null
    }
}
