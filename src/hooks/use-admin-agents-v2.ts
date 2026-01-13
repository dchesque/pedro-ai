"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Agent } from './use-agents'

export function useAdminAgentsV2() {
    return useQuery<{ agents: Agent[] }>({
        queryKey: ['admin', 'agents-v2'],
        queryFn: () => api.get('/api/admin/agents'),
    })
}

export function useAdminAgentV2(id: string) {
    return useQuery<Agent>({
        queryKey: ['admin', 'agents-v2', id],
        queryFn: () => api.get(`/api/admin/agents/${id}`),
        enabled: !!id,
    })
}

export function useUpdateAdminAgentV2() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Agent> & { id: string }) =>
            api.put(`/api/admin/agents/${id}`, data),
        onSuccess: (_, variables) => {
            toast({ title: 'Agent atualizado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['admin', 'agents-v2'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'agents-v2', variables.id] })
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao atualizar agent',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}
