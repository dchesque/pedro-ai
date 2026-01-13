import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export interface Tone {
    id: string
    userId?: string | null
    name: string
    description?: string
    icon?: string
    promptFragment: string
    type: 'system' | 'personal'
    isSystem: boolean
    createdAt: string
    updatedAt: string
}

export function useTones() {
    return useQuery<{ tones: Tone[] }>({
        queryKey: ['tones'],
        queryFn: () => api.get('/api/tones'),
    })
}

export function useTone(id: string) {
    return useQuery<{ tone: Tone }>({
        queryKey: ['tones', id],
        queryFn: () => api.get(`/api/tones/${id}`),
        enabled: !!id,
    })
}

export function useCreateTone() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: Partial<Tone>) => api.post('/api/tones', data),
        onSuccess: () => {
            toast({ title: 'Tom criado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['tones'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao criar tom', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUpdateTone() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Tone> & { id: string }) =>
            api.put(`/api/tones/${id}`, data),
        onSuccess: (_, { id }) => {
            toast({ title: 'Tom atualizado!' })
            queryClient.invalidateQueries({ queryKey: ['tones'] })
            queryClient.invalidateQueries({ queryKey: ['tones', id] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao atualizar tom', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteTone() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/tones/${id}`),
        onSuccess: () => {
            toast({ title: 'Tom excluído!' })
            queryClient.invalidateQueries({ queryKey: ['tones'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao excluir tom', description: error.message, variant: 'destructive' })
        },
    })
}
