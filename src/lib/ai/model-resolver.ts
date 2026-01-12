import { db } from '@/lib/db'
import { LLM_FEATURES, getHardcodedDefault, type LLMFeatureKey } from './models-config'

// Cache em memória para evitar queries repetidas (5 minutos)
let cachedModels: Record<string, string> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Busca o modelo padrão para uma feature
 * Prioridade: AdminSettings.defaultModels > Hardcoded default
 */
export async function getDefaultModel(featureKey: LLMFeatureKey): Promise<string> {
    // Verificar cache
    const now = Date.now()
    if (cachedModels && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedModels[featureKey] || getHardcodedDefault(featureKey)
    }

    try {
        const settings = await db.adminSettings.findUnique({
            where: { id: 'singleton' },
            select: { defaultModels: true },
        })

        const defaultModels = (settings?.defaultModels as Record<string, string>) || {}

        // Atualizar cache
        cachedModels = defaultModels
        cacheTimestamp = now

        return defaultModels[featureKey] || getHardcodedDefault(featureKey)
    } catch (error) {
        console.error('[model-resolver] Erro ao buscar modelo padrão:', error)
        return getHardcodedDefault(featureKey)
    }
}

/**
 * Busca todos os modelos padrão configurados
 */
export async function getAllDefaultModels(): Promise<Record<LLMFeatureKey, string>> {
    const settings = await db.adminSettings.findUnique({
        where: { id: 'singleton' },
        select: { defaultModels: true },
    })

    const savedModels = (settings?.defaultModels as Record<string, string>) || {}

    // Mesclar com defaults hardcoded
    const result: Record<string, string> = {}
    for (const key of Object.keys(LLM_FEATURES) as LLMFeatureKey[]) {
        result[key] = savedModels[key] || getHardcodedDefault(key)
    }

    return result as Record<LLMFeatureKey, string>
}

/**
 * Salva os modelos padrão no banco
 */
export async function saveDefaultModels(models: Record<string, string>): Promise<void> {
    // Invalidar cache
    cachedModels = null

    await db.adminSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            defaultModels: models,
        },
        update: {
            defaultModels: models,
        },
    })
}

/**
 * Invalida o cache (chamar após salvar)
 */
export function invalidateModelCache(): void {
    cachedModels = null
    cacheTimestamp = 0
}
