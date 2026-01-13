import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export type ContentType = 'news' | 'story' | 'meme' | 'educational' | 'motivational' | 'tutorial' | 'custom'

export interface Style {
    id: string
    userId: string | null
    name: string
    description?: string
    icon?: string
    contentType: ContentType
    scriptwriterPrompt?: string
    // Removed targetDuration, suggestedSceneCount
    narrativeStyle?: string
    languageStyle?: string
    // New fields
    targetAudience?: string
    keywords?: string[]
    suggestedToneId?: string
    suggestedTone?: {
        id: string
        name: string
        icon?: string
    }
    // Fields removed from UI/Schema but might exist in DB (deprecated)
    // targetDuration?
    // suggestedSceneCount?
    // defaultTone?

    // Removed: defaultTone, suggestedSceneCount, targetDuration (optional now)

    exampleHook?: string
    exampleCta?: string
    visualPrompt?: string
    isDefault: boolean
    isPublic: boolean
    usageCount: number
    createdAt: string
    updatedAt: string
    _count?: {
        shorts: number
    }
}

export function useStyles() {
    return useQuery<{ styles: Style[] }>({
        queryKey: ['styles'],
        queryFn: () => api.get('/api/styles'),
    })
}

export function useStyle(id: string) {
    return useQuery<{ style: Style }>({
        queryKey: ['styles', id],
        queryFn: () => api.get(`/api/styles/${id}`),
        enabled: !!id,
    })
}

export function useCreateStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (data: Partial<Style>) => api.post('/api/styles', data),
        onSuccess: () => {
            toast({ title: 'Estilo criado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['styles'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao criar estilo', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUpdateStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Style> & { id: string }) =>
            api.put(`/api/styles/${id}`, data),
        onSuccess: (_, { id }) => {
            toast({ title: 'Estilo atualizado!' })
            queryClient.invalidateQueries({ queryKey: ['styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', id] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao atualizar estilo', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/styles/${id}`),
        onSuccess: () => {
            toast({ title: 'Estilo excluído!' })
            queryClient.invalidateQueries({ queryKey: ['styles'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao excluir estilo', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDuplicateStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (style: Style) => {
            const { id, createdAt, updatedAt, usageCount, _count, ...rest } = style
            return api.post('/api/styles', {
                ...rest,
                name: `${rest.name} (Cópia)`,
            })
        },
        onSuccess: () => {
            toast({ title: 'Estilo duplicado!' })
            queryClient.invalidateQueries({ queryKey: ['styles'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao duplicar estilo', description: error.message, variant: 'destructive' })
        },
    })
}
