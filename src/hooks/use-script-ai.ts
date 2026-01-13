"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import type { ScriptFormData } from '@/lib/roteirista/types'

export function useSaveScript() {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: ScriptFormData) => {
            // O backend /api/shorts espera um formato específico
            // Vamos adaptar os novos campos (synopsis, tone) no corpo da request
            const payload = {
                title: data.title,
                theme: data.theme,
                synopsis: data.synopsis,
                tone: data.tone,
                style: data.styleId,
                sceneCount: data.sceneCount,
                // Enviar cenas para o endpoint de criação
                scenes: data.scenes.map(s => ({
                    order: s.orderIndex,
                    narration: s.narration,
                    visualDesc: s.visualPrompt, // Mapeado para visualDesc que o ShortScene já tem
                    duration: s.duration || 5,
                })),
                // Novos Shorts vêm com esse status
                status: 'SCRIPT_READY',
                characterIds: data.characterIds,
                targetDuration: data.scenes.reduce((acc, s) => acc + (s.duration || 5), 0) || 30,
            }

            return api.post<{ short: { id: string } }>('/api/shorts', payload)
        },
        onSuccess: (response) => {
            toast({
                title: 'Roteiro salvo!',
                description: 'Seu roteiro foi criado com sucesso.',
            })
            queryClient.invalidateQueries({ queryKey: ['shorts'] })
            // Redirecionar para a página do short
            router.push(`/shorts/${response.short.id}`)
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive',
            })
        },
    })
}
