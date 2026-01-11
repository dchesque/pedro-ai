"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

// Types
export interface ShortScene {
    id: string
    order: number
    duration: number
    narration?: string
    visualDesc?: string
    imagePrompt?: string
    negativePrompt?: string
    mediaType: 'IMAGE' | 'VIDEO'
    mediaUrl?: string
    mediaWidth?: number
    mediaHeight?: number
    isGenerated: boolean
    errorMessage?: string
}

export interface Short {
    id: string
    title?: string
    theme: string
    targetDuration: number
    style: string
    script?: any
    hook?: string
    cta?: string
    status: 'DRAFT' | 'SCRIPTING' | 'PROMPTING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
    progress: number
    errorMessage?: string
    creditsUsed: number
    createdAt: string
    updatedAt: string
    completedAt?: string
    scenes: ShortScene[]
}

export interface CreateShortInput {
    theme: string
    targetDuration?: number
    style?: 'engaging' | 'educational' | 'funny' | 'dramatic' | 'inspirational'
}

// Hook para listar shorts
export function useShorts() {
    return useQuery<{ shorts: Short[] }>({
        queryKey: ['shorts'],
        queryFn: () => api.get('/api/shorts'),
        staleTime: 30_000,
    })
}

// Hook para detalhes de um short
export function useShort(id: string) {
    return useQuery<{ short: Short }>({
        queryKey: ['shorts', id],
        queryFn: () => api.get(`/api/shorts/${id}`),
        staleTime: 10_000,
        enabled: !!id,
    })
}

// Hook para criar short
export function useCreateShort() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: CreateShortInput) =>
            api.post<{ short: Short }>('/api/shorts', input),
        onSuccess: () => {
            toast({ title: 'Short criado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['shorts'] })
        },
        onError: (error: Error) => {
            toast({
                title: 'Falha ao criar short',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}

// Hook para gerar short (executar pipeline)
export function useGenerateShort() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, step }: { id: string; step?: 'full' | 'script' | 'prompts' | 'media' }) =>
            api.post<{ short: Short }>(`/api/shorts/${id}/generate`, { step }),
        onSuccess: (data) => {
            toast({ title: 'Pipeline iniciado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['shorts'] })
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        },
        onError: (error: Error) => {
            const isInsufficientCredits = error.message.includes('insufficient_credits') || error.message.includes('402')

            toast({
                title: isInsufficientCredits ? 'Créditos insuficientes' : 'Falha no pipeline',
                description: isInsufficientCredits
                    ? 'Você não tem créditos suficientes para gerar este short.'
                    : error.message,
                variant: 'destructive',
            })
        },
    })
}

// Hook para deletar short
export function useDeleteShort() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/shorts/${id}`),
        onSuccess: () => {
            toast({ title: 'Short deletado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['shorts'] })
        },
        onError: (error: Error) => {
            toast({
                title: 'Falha ao deletar short',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}
