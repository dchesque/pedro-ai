import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import type { AIAction, AIAssistantRequest, AIAssistantResponse } from '@/lib/roteirista/types'

const logger = createLogger('roteirista-ai-assist')

const requestSchema = z.object({
    text: z.string().min(1).max(10000),
    action: z.enum(['improve', 'expand', 'rewrite', 'summarize', 'translate']),
    context: z.object({
        title: z.string().optional(),
        synopsis: z.string().optional(),
        tone: z.string().optional(),
        fieldType: z.enum(['title', 'synopsis', 'narration', 'visualPrompt']).optional(),
    }).optional(),
})

const ACTION_PROMPTS: Record<AIAction, string> = {
    improve: `Melhore este texto, tornando-o mais envolvente e bem escrito. Mantenha a mesma ideia e tamanho aproximado.`,
    expand: `Expanda este texto com mais detalhes, descrições e profundidade. Aumente o tamanho em 2-3x mantendo a qualidade.`,
    rewrite: `Reescreve este texto completamente de forma criativa e original, mantendo a mesma ideia central.`,
    summarize: `Resuma este texto de forma concisa, mantendo apenas os pontos essenciais.`,
    translate: `Traduza este texto para inglês de forma otimizada para geração de imagem com IA (Flux, Stable Diffusion). Use termos descritivos visuais.`,
}

const FIELD_CONTEXT: Record<string, string> = {
    title: 'Este é um título de vídeo curto (short/reel).',
    synopsis: 'Esta é a sinopse/descrição de uma história para vídeo curto.',
    narration: 'Esta é a narração de uma cena de vídeo curto. Deve ser concisa e impactante.',
    visualPrompt: 'Este é um prompt para geração de imagem. Deve ser descritivo e visual.',
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { text, action, context } = parsed.data as AIAssistantRequest

        logger.info('AI assist request', { action, textLength: text.length, context })

        // Buscar modelo configurado para agentes de texto
        const modelId = await getDefaultModel('agent_scriptwriter')

        // Inicializar OpenRouter provider
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        // Construir prompt do sistema
        let systemPrompt = `Você é um assistente de escrita criativa especializado em roteiros para vídeos curtos (shorts/reels).
${context?.fieldType ? FIELD_CONTEXT[context.fieldType] : ''}
${context?.tone ? `O tom desejado é: ${context.tone}.` : ''}
${context?.title ? `Título do projeto: ${context.title}` : ''}

Responda APENAS com o texto melhorado, sem explicações ou comentários adicionais.`

        // Construir prompt do usuário
        const userPrompt = `${ACTION_PROMPTS[action]}

TEXTO ORIGINAL:
${text}`

        const { text: suggestion } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxTokens: 2000,
        })

        logger.info('AI assist response', {
            action,
            originalLength: text.length,
            suggestionLength: suggestion.length
        })

        const result: AIAssistantResponse = {
            original: text,
            suggestion: suggestion.trim(),
            action,
        }

        return NextResponse.json(result)

    } catch (error: any) {
        logger.error('AI assist error', { error: error.message })
        return NextResponse.json(
            { error: 'Failed to process request', message: error.message },
            { status: 500 }
        )
    }
}
