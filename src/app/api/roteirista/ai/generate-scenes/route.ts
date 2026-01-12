import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import type { GenerateScenesRequest, GenerateScenesResponse, SceneData } from '@/lib/roteirista/types'

const logger = createLogger('roteirista-generate-scenes')

const requestSchema = z.object({
    title: z.string().min(1),
    synopsis: z.string().min(1),
    tone: z.string().min(1),
    characterDescriptions: z.string().optional(),
    sceneCount: z.number().min(3).max(15).default(7),
    stylePrompt: z.string().optional(),
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

        const { title, synopsis, tone, characterDescriptions, sceneCount, stylePrompt } = parsed.data

        logger.info('Generate scenes request', { title, sceneCount, tone })

        const modelId = await getDefaultModel('agent_scriptwriter')

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const systemPrompt = `Você é um roteirista profissional especializado em vídeos curtos (shorts/reels de 30-60 segundos).

Sua tarefa é criar um roteiro dividido em cenas para um vídeo curto. Cada cena deve ter:
1. Uma narração curta e impactante (1-2 frases)
2. Uma descrição visual detalhada em inglês para geração de imagem com IA

REGRAS IMPORTANTES:
- Cada cena deve ter no máximo 5-10 segundos de narração
- A narração deve ser em português, envolvente e adequada para narração em voz
- A descrição visual deve ser em INGLÊS, otimizada para modelos como Flux/Stable Diffusion
- A descrição visual deve incluir: sujeito, ação, ambiente, iluminação, estilo artístico
- Mantenha consistência visual entre as cenas (mesmo estilo, mesmos personagens)
- A história deve ter início, meio e fim satisfatório

${stylePrompt ? `ESTILO VISUAL: ${stylePrompt}` : ''}
${characterDescriptions ? `PERSONAGENS: ${characterDescriptions}` : ''}

Responda APENAS em JSON válido no formato:
{
  "scenes": [
    {
      "narration": "Texto da narração em português",
      "visualPrompt": "Detailed visual description in English for image generation",
      "duration": 5
    }
  ]
}`

        const userPrompt = `Crie um roteiro com ${sceneCount} cenas para o seguinte projeto:

TÍTULO: ${title}

SINOPSE: ${synopsis}

TOM: ${tone}

Gere as ${sceneCount} cenas agora.`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.8,
            maxTokens: 4000,
        })

        // Parse JSON da resposta
        let scenesData: { scenes: Array<{ narration: string; visualPrompt: string; duration?: number }> }

        try {
            // Limpar possíveis marcadores de código
            const cleanJson = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()

            scenesData = JSON.parse(cleanJson)
        } catch (parseError) {
            logger.error('Failed to parse scenes JSON', { response: text })
            return NextResponse.json(
                { error: 'Failed to parse AI response', raw: text },
                { status: 500 }
            )
        }

        // Converter para formato com IDs
        const scenes: SceneData[] = scenesData.scenes.map((scene, index) => ({
            id: createId(),
            orderIndex: index,
            narration: scene.narration,
            visualPrompt: scene.visualPrompt,
            duration: scene.duration || 5,
        }))

        logger.info('Generated scenes', { count: scenes.length })

        const result: GenerateScenesResponse = { scenes }
        return NextResponse.json(result)

    } catch (error: any) {
        logger.error('Generate scenes error', { error: error.message })
        return NextResponse.json(
            { error: 'Failed to generate scenes', message: error.message },
            { status: 500 }
        )
    }
}
