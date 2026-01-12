"use client"

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { ProviderInfo, ProviderCapability, ModelsApiResponse } from '@/lib/ai/providers/types'

interface ProvidersResponse {
    providers: ProviderInfo[]
    cacheStats: Record<string, { cached: boolean; expiresIn?: number }>
}

/**
 * Hook para buscar todos os providers disponíveis
 */
export function useProviders() {
    return useQuery<ProvidersResponse>({
        queryKey: ['admin', 'providers'],
        queryFn: () => api.get('/api/admin/providers'),
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

/**
 * Hook para buscar modelos de um provider específico
 */
export function useProviderModels(
    providerId: string | null,
    options?: {
        capability?: ProviderCapability
        enabled?: boolean
    }
) {
    const { capability, enabled = true } = options || {}

    const queryString = capability ? `?capability=${capability}` : ''

    return useQuery<ModelsApiResponse>({
        queryKey: ['admin', 'providers', providerId, 'models', capability],
        queryFn: () => api.get(`/api/admin/providers/${providerId}/models${queryString}`),
        enabled: enabled && !!providerId,
        staleTime: 30 * 60 * 1000, // 30 minutos (modelos não mudam frequentemente)
    })
}

/**
 * Hook para buscar um modelo específico
 */
export function useProviderModel(
    providerId: string | null,
    modelId: string | null
) {
    const { data: modelsData, isLoading } = useProviderModels(providerId, {
        enabled: !!providerId && !!modelId,
    })

    const model = modelsData?.models.find(m => m.id === modelId) || null

    return {
        model,
        isLoading,
        provider: modelsData?.provider || null,
    }
}
