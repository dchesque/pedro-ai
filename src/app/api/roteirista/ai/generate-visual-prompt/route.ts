import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import type { GenerateVisualPromptRequest, GenerateVisualPromptResponse } from '@/lib/roteirista/types'

const logger = createLogger('roteirista-visual-prompt')

const requestSchema = z.object({
    narration: z.string().min(1),
    stylePrompt: z.string().optional(),
    characterDescriptions: z.string().optional(),
    tone: z.string().optional(),
})

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

        const { narration, stylePrompt, characterDescriptions, tone } = parsed.data

        logger.info('Generate visual prompt request', { narrationLength: narration.length })

        // Usar agente prompt engineer
        const modelId = await getDefaultModel('agent_prompt_engineer')

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const systemPrompt = `Você é um especialista em criar prompts para geração de imagens com IA (Flux, Stable Diffusion, Midjourney).

Sua tarefa é converter uma narração de cena em um prompt visual detalhado em INGLÊS.

O prompt deve incluir:
- Descrição clara do sujeito/personagem e sua ação
- Ambiente e cenário detalhado
- Iluminação e atmosfera
- Ângulo de câmera sugerido
- Estilo artístico

${stylePrompt ? `ESTILO BASE: ${stylePrompt}` : ''}
${characterDescriptions ? `PERSONAGENS: ${characterDescriptions}` : ''}
${tone ? `TOM: ${tone}` : ''}

Responda APENAS com o prompt em inglês, sem explicações.`

        const userPrompt = `Crie um prompt visual para esta narração:

"${narration}"`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxTokens: 500,
        })

        const visualPrompt = text.trim()

        logger.info('Generated visual prompt', { length: visualPrompt.length })

        const result: GenerateVisualPromptResponse = { visualPrompt }
        return NextResponse.json(result)

    } catch (error: any) {
        logger.error('Generate visual prompt error', { error: error.message })
        return NextResponse.json(
            { error: 'Failed to generate visual prompt', message: error.message },
            { status: 500 }
        )
    }
}
