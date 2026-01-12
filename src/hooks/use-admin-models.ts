"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { LLM_FEATURES } from '@/lib/ai/models-config'

type LLMFeatureKey = keyof typeof LLM_FEATURES

interface ModelsResponse {
    models: Record<LLMFeatureKey, string>
    features: typeof LLM_FEATURES
}

export function useAdminModels() {
    return useQuery<ModelsResponse>({
        queryKey: ['admin', 'models'],
        queryFn: () => api.get('/api/admin/models'),
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

export function useSaveAdminModels() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (models: Record<string, string>) =>
            api.put('/api/admin/models', { models }),
        onSuccess: () => {
            toast({ title: 'Modelos salvos com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'models'] })
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive'
            })
        },
    })
}
