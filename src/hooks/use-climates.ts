import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import {
    EmotionalState,
    RevelationDynamic,
    NarrativePressure,
    HookType,
    ClosingType
} from '../../prisma/generated/client_final'

export interface Climate {
    id: string
    userId?: string | null
    name: string
    description?: string
    icon?: string

    // Novos campos v2.0
    emotionalState: EmotionalState
    revelationDynamic: RevelationDynamic
    narrativePressure: NarrativePressure
    hookType: HookType
    closingType: ClosingType

    // Limites
    sentenceMaxWords: number
    minScenes: number
    maxScenes: number

    promptFragment?: string | null
    behaviorPreview?: string | null
    type: 'system' | 'personal'
    isSystem: boolean
    createdAt: string
    updatedAt: string

    // Detalhes injetados pela API
    emotionalDetails?: { label: string; icon: string; subtitle: string }
    revelationDetails?: { label: string; icon: string; subtitle: string }
    pressureDetails?: { label: string; icon: string; subtitle: string }
}

export function useClimates() {
    return useQuery<{ climates: Climate[] }>({
        queryKey: ['climates'],
        queryFn: () => api.get('/api/climates'),
    })
}

export function useClimate(id: string) {
    return useQuery<{ climate: Climate }>({
        queryKey: ['climates', id],
        queryFn: () => api.get(`/api/climates/${id}`),
        enabled: !!id,
    })
}

export function useCreateClimate() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: Partial<Climate>) => api.post('/api/climates', data),
        onSuccess: () => {
            toast({ title: 'Clima criado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['climates'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao criar clima', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUpdateClimate() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Climate> & { id: string }) =>
            api.put(`/api/climates/${id}`, data),
        onSuccess: (_, { id }) => {
            toast({ title: 'Clima atualizado!' })
            queryClient.invalidateQueries({ queryKey: ['climates'] })
            queryClient.invalidateQueries({ queryKey: ['climates', id] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao atualizar clima', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteClimate() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/climates/${id}`),
        onSuccess: () => {
            toast({ title: 'Clima excluído!' })
            queryClient.invalidateQueries({ queryKey: ['climates'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao excluir clima', description: error.message, variant: 'destructive' })
        },
    })
}
