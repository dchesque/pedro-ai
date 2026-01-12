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

// Registry de adapters - apenas os implementados
const adapters = new Map<ProviderType, ProviderAdapter>([
    ['openrouter', new OpenRouterAdapter()],
    ['fal', new FalAdapter()],
])

/**
 * Retorna informações de todos os providers disponíveis
 */
export function getAllProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = []

    adapters.forEach((adapter, providerId) => {
        try {
            const isConfigured = adapter.isConfigured()
            console.log(`[Registry] Provider ${providerId}: isConfigured = ${isConfigured}`)

            providers.push({
                ...adapter.providerInfo,
                isEnabled: isConfigured,
            })
        } catch (error) {
            console.error(`[Registry] Error checking provider ${providerId}:`, error)
        }
    })

    return providers
}

/**
 * Retorna informações de um provider específico
 */
export function getProvider(providerId: ProviderType): ProviderInfo | null {
    const adapter = adapters.get(providerId)
    if (!adapter) {
        console.warn(`[Registry] Provider not found: ${providerId}`)
        return null
    }

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
    const adapter = adapters.get(providerId)
    if (!adapter) {
        throw new Error(`Provider not found: ${providerId}`)
    }

    const now = Date.now()
    const cached = modelCache.get(providerId)

    // Retornar do cache se válido
    if (!forceRefresh && cached && cached.expiresAt > now) {
        console.log(`[Registry] Returning cached models for ${providerId}`)
        return {
            provider: { ...adapter.providerInfo, isEnabled: adapter.isConfigured() },
            models: cached.data,
            cachedAt: new Date(cached.timestamp).toISOString(),
            cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
        }
    }

    // Buscar da API/lista
    console.log(`[Registry] Fetching models for ${providerId}...`)
    const models = await adapter.fetchModels()
    console.log(`[Registry] Fetched ${models.length} models for ${providerId}`)

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

    adapters.forEach((_, providerId) => {
        const cached = modelCache.get(providerId)
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
    })

    return stats
}

/**
 * Lista todos os provider IDs disponíveis
 */
export function getAvailableProviderIds(): ProviderType[] {
    return Array.from(adapters.keys())
}
