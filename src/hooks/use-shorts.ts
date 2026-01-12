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
    visualPrompt?: string // Novo campo
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
    summary?: string
    theme: string
    targetDuration: number
    style: string
    aiModel?: string
    synopsis?: string // Novo campo
    tone?: string    // Novo campo
    script?: any
    hook?: string
    cta?: string
    status: 'DRAFT' | 'GENERATING_SCRIPT' | 'SCRIPT_READY' | 'SCRIPT_APPROVED' | 'GENERATING_IMAGES' | 'IMAGES_READY' | 'GENERATING_VIDEO' | 'VIDEO_READY' | 'PUBLISHED' | 'COMPLETED' | 'FAILED'
    progress: number
    errorMessage?: string
    creditsUsed: number
    scriptVersion: number
    scriptApprovedAt?: string
    createdAt: string
    updatedAt: string
    completedAt?: string
    scenes: ShortScene[]
}

export interface CreateShortInput {
    theme: string
    targetDuration?: number
    style?: string
    aiModel?: string
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

// Hook para atualizar dados do short
export function useUpdateShort() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Short> }) =>
            api.patch<{ short: Short }>(`/api/shorts/${id}`, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
        },
    })
}

// Gerar apenas roteiro
export function useGenerateScript() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, aiModel }: { shortId: string; aiModel?: string }) =>
            api.post<{ short: Short; creditsUsed: number }>(`/api/shorts/${shortId}/generate-script`, { aiModel }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        }
    })
}

// Regenerar roteiro completo
export function useRegenerateScript() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, instructions }: { shortId: string; instructions?: string }) =>
            api.post<{ short: Short; creditsUsed: number }>(`/api/shorts/${shortId}/regenerate-script`, { instructions }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        }
    })
}

// Aprovar roteiro
export function useApproveScript() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (shortId: string) =>
            api.post<{ short: Short }>(`/api/shorts/${shortId}/approve-script`),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
        }
    })
}

// Gerar mídia (imagens)
export function useGenerateMedia() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (shortId: string) =>
            api.post<{ short: Short; creditsUsed: number }>(`/api/shorts/${shortId}/generate-media`),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', data.short.id] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        }
    })
}

// Atualizar cena
export function useUpdateScene() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, sceneId, data }: {
            shortId: string
            sceneId: string
            data: { narration?: string; visualDesc?: string; duration?: number }
        }) => api.put<{ scene: ShortScene }>(`/api/shorts/${shortId}/scenes/${sceneId}`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
        }
    })
}

// Adicionar cena
export function useAddScene() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, data }: {
            shortId: string
            data: { order: number; narration?: string; visualDesc?: string; duration?: number; generateWithAI?: boolean }
        }) => api.post<{ scene: ShortScene }>(`/api/shorts/${shortId}/scenes`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
        }
    })
}

// Remover cena
export function useRemoveScene() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, sceneId }: { shortId: string; sceneId: string }) =>
            api.delete(`/api/shorts/${shortId}/scenes/${sceneId}`),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
        }
    })
}

// Reordenar cenas
export function useReorderScenes() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, sceneIds }: { shortId: string; sceneIds: string[] }) =>
            api.post(`/api/shorts/${shortId}/scenes/reorder`, { sceneIds }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
        }
    })
}

// Regenerar cena específica
export function useRegenerateScene() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, sceneId, instructions }: {
            shortId: string
            sceneId: string
            instructions?: string
        }) => api.post<{ scene: ShortScene; creditsUsed: number }>(`/api/shorts/${shortId}/scenes/${sceneId}/regenerate`, { instructions }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        }
    })
}

// Regenerar imagem de cena
export function useRegenerateSceneImage() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ shortId, sceneId, prompt, negativePrompt }: {
            shortId: string
            sceneId: string
            prompt?: string
            negativePrompt?: string
        }) => api.post<{ scene: ShortScene; creditsUsed: number }>(`/api/shorts/${shortId}/scenes/${sceneId}/regenerate-image`, { prompt, negativePrompt }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shorts', variables.shortId] })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        }
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
