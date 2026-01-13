import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import type { GenerateScenesRequest, GenerateScenesResponse, SceneData } from '@/lib/roteirista/types'
import { db } from '@/lib/db'
import { buildClimatePrompt } from '@/lib/climate/behavior-mapping'

const logger = createLogger('roteirista-generate-scenes')

const requestSchema = z.object({
    title: z.string().min(1),
    theme: z.string().optional(),
    premise: z.string().optional(),
    synopsis: z.string().optional(),
    tone: z.string().optional(),
    styleId: z.string().min(1),
    characterDescriptions: z.string().optional(),
    sceneCount: z.number().optional(),
    modelId: z.string().optional(),
    targetAudience: z.string().optional(),
    climateId: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const body = await req.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { title, theme, premise, synopsis, tone: reqTone, styleId, characterDescriptions, sceneCount: reqSceneCount, modelId: reqModelId, targetAudience: reqTargetAudience, climateId: reqClimateId } = parsed.data

        const finalTheme = premise || theme || title

        // Buscar estilo e clima sugerido
        const style = await db.style.findUnique({
            where: { id: styleId },
            include: { suggestedClimate: true }
        })

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        // Resolver Clima
        let climatePrompt = ''
        let climateName = 'Padrão'

        // 1. Prioridade para clima passado no request
        if (reqClimateId) {
            const climateObj = await db.climate.findUnique({ where: { id: reqClimateId } })
            if (climateObj) {
                climateName = climateObj.name
                climatePrompt = buildClimatePrompt(climateObj)
            }
        }
        // 2. Fallback para clima sugerido no estilo
        else if (style.suggestedClimate) {
            climateName = style.suggestedClimate.name
            climatePrompt = buildClimatePrompt(style.suggestedClimate)
        }
        // 3. Fallback final (texto livre do tone/clima se existir)
        else if (reqTone) {
            climateName = reqTone
            climatePrompt = `TOM E CLIMA: ${reqTone}`
        }

        logger.info('Generate scenes request', { title, styleId, climate: climateName })

        // Resolver modelo
        const modelId = reqModelId || await getDefaultModel('agent_scriptwriter')

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const sceneCount = reqSceneCount || 7 // Default fallback since style doesn't have it anymore
        const targetAudience = reqTargetAudience || style.targetAudience || 'Geral'

        const systemPrompt = `Você é um roteirista profissional especializado em vídeos curtos (shorts/reels).

## TIPO DE CONTEÚDO
${style.contentType}

## INSTRUÇÕES DO ESTILO
${style.scriptwriterPrompt || 'Crie um roteiro envolvente e bem estruturado.'}

## PARÂMETROS
- Público Alvo: ${targetAudience}
- Número de cenas: ${sceneCount}
- Clima Narrativo: ${climateName}
${climatePrompt ? `## INSTRUÇÕES COMPORTAMENTAIS (CLIMA):\n${climatePrompt}` : ''}

## REGRAS
- Cada cena deve ter narração em português (1-2 frases)
- Cada cena deve ter descrição visual em INGLÊS para geração de imagem
- Descrições visuais devem ser detalhadas, cinematográficas e incluir estilo de iluminação
- Mantenha consistência visual entre as cenas
- A história deve ter início, meio e fim satisfatório

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
TEMA: ${finalTheme}
${synopsis ? `SINOPSE: ${synopsis}` : ''}
CLIMA: ${climateName}
${characterDescriptions ? `PERSONAGENS: ${characterDescriptions}` : ''}

Gere as ${sceneCount} cenas agora.`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.8,
            // maxTokens removed to avoid lint error
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
