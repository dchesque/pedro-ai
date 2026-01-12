import { db } from '@/lib/db'
import { LLM_FEATURES, getHardcodedDefault, type LLMFeatureKey } from './models-config'

// Novo formato de configuração
interface FeatureModelConfig {
    provider: string
    modelId: string
}

// Cache em memória
let cachedModels: Record<string, string | FeatureModelConfig> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000

/**
 * Busca a configuração de modelo para uma feature
 * Retorna { provider, modelId } ou fallback como string
 */
export async function getModelConfig(featureKey: LLMFeatureKey): Promise<FeatureModelConfig> {
    const now = Date.now()

    if (cachedModels && (now - cacheTimestamp) < CACHE_TTL) {
        const cached = cachedModels[featureKey]
        if (typeof cached === 'object' && cached !== null) {
            return cached as FeatureModelConfig
        }
        if (typeof cached === 'string') {
            // Converter formato antigo
            return {
                provider: cached.startsWith('fal-ai/') ? 'fal' : 'openrouter',
                modelId: cached,
            }
        }
    }

    try {
        const settings = await db.adminSettings.findUnique({
            where: { id: 'singleton' },
            select: { defaultModels: true },
        })

        const defaultModels = (settings?.defaultModels as Record<string, any>) || {}

        cachedModels = defaultModels
        cacheTimestamp = now

        const saved = defaultModels[featureKey]

        if (typeof saved === 'object' && saved !== null) {
            return saved as FeatureModelConfig
        }

        if (typeof saved === 'string') {
            return {
                provider: saved.startsWith('fal-ai/') ? 'fal' : 'openrouter',
                modelId: saved,
            }
        }
    } catch (error) {
        console.error('[model-resolver] Erro ao buscar config:', error)
    }

    // Fallback para hardcoded
    const hardcoded = getHardcodedDefault(featureKey)
    return {
        provider: hardcoded.startsWith('fal-ai/') ? 'fal' : 'openrouter',
        modelId: hardcoded,
    }
}

/**
 * Compatibilidade: retorna apenas o modelId (para código legado)
 */
export async function getDefaultModel(featureKey: LLMFeatureKey): Promise<string> {
    const config = await getModelConfig(featureKey)
    return config.modelId
}

/**
 * Busca todos os modelos padrão configurados
 */
export async function getAllDefaultModels(): Promise<Record<LLMFeatureKey, string | FeatureModelConfig>> {
    const settings = await db.adminSettings.findUnique({
        where: { id: 'singleton' },
        select: { defaultModels: true },
    })

    const savedModels = (settings?.defaultModels as Record<string, any>) || {}

    const result: Record<string, string | FeatureModelConfig> = {}
    for (const key of Object.keys(LLM_FEATURES) as LLMFeatureKey[]) {
        result[key] = savedModels[key] || getHardcodedDefault(key)
    }

    return result as Record<LLMFeatureKey, string | FeatureModelConfig>
}

/**
 * Salva os modelos padrão no banco
 */
export async function saveDefaultModels(models: Record<string, string | FeatureModelConfig>): Promise<void> {
    cachedModels = null

    await db.adminSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            defaultModels: models as any,
        },
        update: {
            defaultModels: models as any,
        },
    })
}

/**
 * Invalida o cache
 */
export function invalidateModelCache(): void {
    cachedModels = null
    cacheTimestamp = 0
}
