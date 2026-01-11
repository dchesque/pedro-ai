"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

// Input/Output para imagens
export interface GenerateImageInput {
    prompt: string
    preset?: 'short_vertical' | 'short_square' | 'thumbnail'
    count?: number
    seed?: number
}

export interface GenerateImageOutput {
    images: Array<{ url: string; width: number; height: number }>
    seed: number
}

// Input/Output para vídeos
export interface GenerateVideoInput {
    prompt: string
    image_url?: string
    duration?: '5' | '10'
    aspect_ratio?: '16:9' | '9:16' | '1:1'
    negative_prompt?: string
}

export interface GenerateVideoOutput {
    video: { url: string; content_type: string; file_size: number }
    duration: number
}

export function useGenerateImage() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: GenerateImageInput) =>
            api.post<GenerateImageOutput>('/api/ai/fal/image', input),
        onSuccess: () => {
            toast({ title: 'Imagem gerada com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        },
        onError: (error: Error) => {
            const isInsufficientCredits = error.message.includes('insufficient_credits') || error.message.includes('402')

            toast({
                title: isInsufficientCredits ? 'Créditos insuficientes' : 'Falha ao gerar imagem',
                description: isInsufficientCredits
                    ? 'Você não tem créditos suficientes para esta operação.'
                    : error.message,
                variant: 'destructive',
            })
        },
    })
}

export function useGenerateVideo() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: GenerateVideoInput) =>
            api.post<GenerateVideoOutput>('/api/ai/fal/video', input),
        onSuccess: () => {
            toast({ title: 'Vídeo gerado com sucesso!' })
            queryClient.invalidateQueries({ queryKey: ['credits'] })
        },
        onError: (error: Error) => {
            const isInsufficientCredits = error.message.includes('insufficient_credits') || error.message.includes('402')

            toast({
                title: isInsufficientCredits ? 'Créditos insuficientes' : 'Falha ao gerar vídeo',
                description: isInsufficientCredits
                    ? 'Você não tem créditos suficientes para esta operação.'
                    : error.message,
                variant: 'destructive',
            })
        },
    })
}
