import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createLogger('style-ai-refine-visual')

const requestSchema = z.object({
    prompt: z.string().min(1).max(5000),
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
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const { prompt: userPrompt } = parsed.data

        const modelId = await getDefaultModel('agent_scriptwriter')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const systemPrompt = `Você é um especialista em engenharia de prompt visual para IA.`

        const fullPrompt = `Reescreva o prompt visual abaixo para ficar mais claro, técnico e adequado para geração de imagens ou vídeos por IA.

REGRAS:
- NÃO altere a intenção visual original.
- NÃO adicione novos estilos, referências artísticas ou emoções.
- NÃO interprete criativamente.
- Apenas traduza (se necessário), organize e refine tecnicamente.

Prompt original:
${userPrompt}

Responda APENAS com o prompt refinado/traduzido.`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: fullPrompt,
            temperature: 0.3, // Lower temperature for faithful refinement
        })

        return NextResponse.json({ refined: text.trim() })

    } catch (error: any) {
        logger.error('Refine Visual Error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
