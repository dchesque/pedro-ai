import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'

const logger = createLogger('style-ai-suggest')

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, styleData } = body

        if (!['HOOK', 'CTA'].includes(type) || !styleData) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const modelId = await getDefaultModel('agent_scriptwriter')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        // Construct System Prompt
        let instruction = ''

        if (type === 'HOOK') {
            instruction = `
Sugira UM tipo de hook adequado para este estilo de conteúdo.
Considere:
- Tipo de conteúdo: ${styleData.contentType}
- Função do roteiro: ${styleData.scriptFunction}
- Postura do narrador: ${styleData.narratorPosture}
- Complexidade: ${styleData.contentComplexity}

Não leve em conta clima emocional.
            `
        } else {
            instruction = `
Sugira UM tipo de CTA adequado para este estilo de conteúdo.
Considere:
- Função do roteiro: ${styleData.scriptFunction}
- Público-alvo: ${styleData.targetAudience}
- Plataforma genérica de vídeo

Não leve em conta clima emocional.
            `
        }

        const prompt = `
${instruction}

Retorne um JSON puro com:
- "type": O tipo sugerido (Enum string exato: ${type === 'HOOK'
                ? 'QUESTION, STRONG_STATEMENT, DATA_FACT, SHORT_STORY, CONTRAST'
                : 'DIRECT_ACTION, ENGAGEMENT, REFLECTION, SHARE, FOLLOW'})
- "example": 1 exemplo curto de texto

JSON:
`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: "Você é um especialista em roteiros de vídeo curtos.",
            prompt: prompt,
            temperature: 0.7,
        })

        // Simple JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : text

        let result
        try {
            result = JSON.parse(jsonStr)
        } catch (e) {
            console.error('JSON Parse Error', text)
            // Fallback parsing or retry logic could go here
            result = { type: type === 'HOOK' ? 'QUESTION' : 'DIRECT_ACTION', example: text }
        }

        return NextResponse.json(result)

    } catch (error: any) {
        logger.error('Style AI Suggest Error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
