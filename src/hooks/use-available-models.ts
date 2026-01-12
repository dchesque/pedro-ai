"use client"

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export interface AIModel {
    id: string
    name: string
    provider: string
    description?: string
    credits?: number
    isFree?: boolean
}

export function useAvailableModels() {
    return useQuery<{ models: AIModel[] }>({
        queryKey: ['available-models', 'scriptwriter'],
        queryFn: async () => {
            // Tenta buscar da API de modelos se existir, senão retorna defaults
            try {
                const response = await api.get<{ providers: any[] }>('/api/admin/providers')
                // Mapear provedores/modelos se necessário
                // Por enquanto, vamos retornar uma lista fixa baseada no que o sistema suporta
                return {
                    models: [
                        { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3', provider: 'DeepSeek', isFree: true, credits: 0 },
                        { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', credits: 2 },
                        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', credits: 3 },
                    ]
                }
            } catch {
                return {
                    models: [
                        { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3', provider: 'DeepSeek', isFree: true, credits: 0 },
                        { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', credits: 2 },
                        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', credits: 3 },
                    ]
                }
            }
        },
    })
}
