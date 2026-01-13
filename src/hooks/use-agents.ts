"use client"

import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export interface Agent {
    id: string
    name: string
    slug: string
    description: string
    icon: string
    type: 'CLIMATE' | 'STYLE' | 'CUSTOM'
    creditsPerUse: number
    questions?: AgentQuestion[]
    outputFields?: AgentOutputField[]
}

export interface AgentQuestion {
    id: string
    order: number
    label: string
    helpText?: string
    example?: string
    type: 'select' | 'text' | 'number'
    required: boolean
    options?: { value: string; label: string; description?: string }[]
}

export interface AgentOutputField {
    key: string
    label: string
    type: 'select' | 'text' | 'number' | 'textarea'
    editable: boolean
    options?: string[]
}

export function useAgents() {
    return useQuery<{ agents: Agent[] }>({
        queryKey: ['agents'],
        queryFn: () => api.get('/api/agents'),
    })
}

export function useAgent(slug: string) {
    return useQuery<Agent>({
        queryKey: ['agents', slug],
        queryFn: () => api.get(`/api/agents/${slug}`),
        enabled: !!slug,
    })
}

export function useExecuteAgent(slug: string) {
    const { toast } = useToast()

    return useMutation({
        mutationFn: (answers: Record<string, any>) =>
            api.post(`/api/agents/${slug}/execute`, { answers }),
        onError: (error: Error) => {
            toast({
                title: 'Erro ao executar agent',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}

// Hook para criar clima/estilo a partir do output do agent
export function useCreateFromAgent(type: 'CLIMATE' | 'STYLE') {
    const { toast } = useToast()
    const endpoint = type === 'CLIMATE' ? '/api/climates' : '/api/styles'

    return useMutation({
        mutationFn: (data: { name: string; icon?: string; agentOutput: any }) =>
            api.post(endpoint, { ...data, fromAgent: true }),
        onSuccess: () => {
            toast({ title: 'Criado com sucesso!' })
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao criar',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}
