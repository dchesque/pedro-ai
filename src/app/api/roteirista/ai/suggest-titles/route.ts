import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { db } from '@/lib/db'

const logger = createLogger('roteirista-suggest-titles')

const requestSchema = z.object({
    theme: z.string().min(1),
    styleId: z.string().optional(),
    tone: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
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

        const { theme, styleId, tone } = parsed.data

        let styleInfo = ''
        if (styleId) {
            const style = await db.style.findUnique({ where: { id: styleId } })
            if (style) {
                styleInfo = `Estilo: ${style.name} (${style.contentType}). `
            }
        }

        const modelId = await getDefaultModel('agent_scriptwriter')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const systemPrompt = `Você é um redator criativo especializado em títulos virais para vídeos curtos.
Sua tarefa é sugerir 5 títulos envolventes baseados no tema e estilo fornecidos.
Os títulos devem ser curtos, causar curiosidade ou impacto.`

        const userPrompt = `Sugira 5 títulos para um vídeo com as seguintes características:
Tema: ${theme}
${styleInfo}
Tom: ${tone || 'Livre'}

Responda APENAS um array JSON de strings.`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.9,
        })

        let titles: string[] = []
        try {
            const cleanJson = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
            titles = JSON.parse(cleanJson)
        } catch (e) {
            // Fallback: tentar extrair linhas que parecem títulos
            titles = text.split('\n').filter(l => l.trim().length > 0).slice(0, 5).map(t => t.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        }

        return NextResponse.json({ titles })
    } catch (error: any) {
        logger.error('Suggest titles error', { error: error.message })
        return NextResponse.json(
            { error: 'Failed to suggest titles', message: error.message },
            { status: 500 }
        )
    }
}
