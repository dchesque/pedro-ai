"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Agent, Style } from './use-agents'

// ============================================
// HOOKS PARA ADMIN
// ============================================

export function useGlobalAgents() {
    return useQuery<{ agents: Agent[] }>({
        queryKey: ['admin', 'agents'],
        queryFn: () => api.get('/api/admin/agents'),
    })
}

export function useSaveGlobalAgent() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (agent: Partial<Agent> & { type: string; systemPrompt: string }) =>
            api.post('/api/admin/agents', agent),
        onSuccess: () => {
            toast({ title: 'Agente global salvo!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteGlobalAgent() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (type: string) => api.delete(`/api/admin/agents/${type}`),
        onSuccess: () => {
            toast({ title: 'Agente deletado!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' })
        },
    })
}

export function useGlobalStyles() {
    return useQuery<{ styles: (Style & { id: string; sortOrder: number; isDefault: boolean })[] }>({
        queryKey: ['admin', 'styles'],
        queryFn: () => api.get('/api/admin/styles'),
    })
}

export function useCreateGlobalStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (style: Partial<Style> & { key: string; name: string }) =>
            api.post('/api/admin/styles', style),
        onSuccess: () => {
            toast({ title: 'Estilo global criado!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' })
        },
    })
}

export function useUpdateGlobalStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Style> & { id: string }) =>
            api.put(`/api/admin/styles/${id}`, data),
        onSuccess: () => {
            toast({ title: 'Estilo atualizado!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
        },
    })
}

export function useDeleteGlobalStyle() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/admin/styles/${id}`),
        onSuccess: () => {
            toast({ title: 'Estilo deletado!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'styles'] })
            queryClient.invalidateQueries({ queryKey: ['styles', 'available'] })
        },
        onError: (error: Error) => {
            toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' })
        },
    })
}
