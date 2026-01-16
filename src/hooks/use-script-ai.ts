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
                premise: data.premise || data.theme,
                theme: data.theme,
                synopsis: data.synopsis,
                styleId: data.styleId,
                toneId: data.climateId,
                aiModel: data.modelId,
                sceneCount: data.sceneCount,
                hook: data.hook,
                cta: data.cta,
                scenes: data.scenes.map(s => ({
                    order: s.orderIndex,
                    narration: s.narration,
                    visualDesc: s.visualPrompt,
                    duration: s.duration || 5,
                })),
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
