"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

// Types
export interface Agent {
    id: string
    type: 'SCRIPTWRITER' | 'PROMPT_ENGINEER' | 'NARRATOR'
    name: string
    description?: string
    systemPrompt: string
    model?: string
    temperature?: number
    isActive: boolean
}

export interface Style {
    key: string
    name: string
    description?: string
    icon?: string
    scriptwriterPrompt?: string
    promptEngineerPrompt?: string
    visualStyle?: string
    negativePrompt?: string
    isActive?: boolean
    source?: 'user' | 'global' | 'default'
}

// ============================================
// HOOKS PARA USUÁRIO
// ============================================

export function useUserAgents() {
    return useQuery<{ agents: Agent[] }>({
        queryKey: ['user', 'agents'],
        queryFn: () => api.get('/api/user/agents'),
    })
}

export function useSaveUserAgent() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (agent: Partial<Agent> & { type: string }) =>
            api.post('/api/user/agents', agent),
        onSuccess: () => {
            toast({ title: 'Agente salvo com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['user', 'agents'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao salvar agente', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUserStyles() {
    return useQuery<{ styles: Style[] }>({
        queryKey: ['user', 'styles'],
        queryFn: () => api.get('/api/user/styles'),
    })
}

export function useCreateUserStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (style: Partial<Style> & { key: string; name: string }) =>
            api.post('/api/user/styles', style),
        onSuccess: () => {
            toast({ title: 'Estilo criado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['user', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao criar estilo', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUpdateUserStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Style> & { id: string }) =>
            api.put(`/api/user/styles/${id}`, data),
        onSuccess: () => {
            toast({ title: 'Estilo atualizado!' })
            queryClient.invalidateQueries({ queryKey: ['user', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteUserStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/user/styles/${id}`),
        onSuccess: () => {
            toast({ title: 'Estilo deletado!' })
            queryClient.invalidateQueries({ queryKey: ['user', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' })
        },
    })
}

// ============================================
// HOOK PARA LISTAR ESTILOS DISPONÍVEIS
// ============================================

export function useAvailableStyles() {
    return useQuery<{ styles: Style[] }>({
        queryKey: ['styles', 'available'],
        queryFn: () => api.get('/api/styles/available'),
        staleTime: 60_000,
    })
}
