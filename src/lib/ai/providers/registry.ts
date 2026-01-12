import {
    ProviderAdapter,
    ProviderType,
    ProviderInfo,
    ProviderModel,
    ProviderCapability,
    ModelsApiResponse
} from './types'
import { OpenRouterAdapter } from './openrouter-adapter'
import { FalAdapter } from './fal-adapter'

// Cache em memória
interface CacheEntry {
    data: ProviderModel[]
    timestamp: number
    expiresAt: number
}

const modelCache = new Map<ProviderType, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

// Registry de adapters
const adapters: Record<ProviderType, ProviderAdapter> = {
    openrouter: new OpenRouterAdapter(),
    fal: new FalAdapter(),
    anthropic: {} as any, // Placeholder para tipagem
    openai: {} as any,    // Placeholder para tipagem
} as Record<ProviderType, ProviderAdapter>

/**
 * Retorna informações de todos os providers disponíveis
 */
export function getAllProviders(): ProviderInfo[] {
    return Object.values(adapters)
        .filter(adapter => adapter && typeof adapter.isConfigured === 'function')
        .map(adapter => ({
            ...adapter.providerInfo,
            isEnabled: adapter.isConfigured(),
        }))
}

/**
 * Retorna informações de um provider específico
 */
export function getProvider(providerId: ProviderType): ProviderInfo | null {
    const adapter = adapters[providerId]
    if (!adapter || typeof adapter.isConfigured !== 'function') return null

    return {
        ...adapter.providerInfo,
        isEnabled: adapter.isConfigured(),
    }
}

/**
 * Busca modelos de um provider com cache
 */
export async function getModelsFromProvider(
    providerId: ProviderType,
    forceRefresh = false
): Promise<ModelsApiResponse> {
    const adapter = adapters[providerId]
    if (!adapter || typeof adapter.isConfigured !== 'function') {
        throw new Error(`Provider not found or not implemented: ${providerId}`)
    }

    const now = Date.now()
    const cached = modelCache.get(providerId)

    // Retornar do cache se válido
    if (!forceRefresh && cached && cached.expiresAt > now) {
        return {
            provider: { ...adapter.providerInfo, isEnabled: adapter.isConfigured() },
            models: cached.data,
            cachedAt: new Date(cached.timestamp).toISOString(),
            cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
        }
    }

    // Buscar da API
    const models = await adapter.fetchModels()

    // Atualizar cache
    const cacheEntry: CacheEntry = {
        data: models,
        timestamp: now,
        expiresAt: now + CACHE_TTL,
    }
    modelCache.set(providerId, cacheEntry)

    return {
        provider: { ...adapter.providerInfo, isEnabled: adapter.isConfigured() },
        models,
        cachedAt: new Date(now).toISOString(),
        cacheExpiresAt: new Date(cacheEntry.expiresAt).toISOString(),
    }
}

/**
 * Busca modelos de um provider filtrados por capacidade
 */
export async function getModelsByCapability(
    providerId: ProviderType,
    capability: ProviderCapability
): Promise<ProviderModel[]> {
    const { models } = await getModelsFromProvider(providerId)
    return models.filter(m => m.capabilities.includes(capability))
}

/**
 * Busca um modelo específico de qualquer provider
 */
export async function findModel(
    providerId: ProviderType,
    modelId: string
): Promise<ProviderModel | null> {
    const { models } = await getModelsFromProvider(providerId)
    return models.find(m => m.id === modelId) || null
}

/**
 * Invalida o cache de um provider
 */
export function invalidateCache(providerId?: ProviderType): void {
    if (providerId) {
        modelCache.delete(providerId)
    } else {
        modelCache.clear()
    }
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): Record<string, { cached: boolean; expiresIn?: number }> {
    const now = Date.now()
    const stats: Record<string, { cached: boolean; expiresIn?: number }> = {}

    for (const providerId of Object.keys(adapters)) {
        const cached = modelCache.get(providerId as ProviderType)
        if (cached) {
            stats[providerId] = {
                cached: cached.expiresAt > now,
                expiresIn: Math.max(0, cached.expiresAt - now),
            }
        } else {
            stats[providerId] = {
                cached: false,
            }
        }
    }

    return stats
}
