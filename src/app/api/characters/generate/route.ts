import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { validateUserAuthentication } from '@/lib/auth-utils'
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { getModelConfig } from '@/lib/ai/model-resolver'
import { generateFluxImage } from '@/lib/fal/flux'
import { withApiLogging } from '@/lib/logging/api'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/characters/generate')

const CHARACTER_ANALYSIS_SYSTEM_PROMPT = `Você é um especialista em análise visual para criação de personagens em geração de imagem com IA.
Sua tarefa é analisar a imagem fornecida e criar um "portrait" extremamente detalhado do personagem em INGLÊS.
O objetivo é garantir consistência visual em futuras gerações.`

async function generateTextOnlyPortrait(
    description: string,
    name: string
): Promise<string> {
    const textModel = await getModelConfig('character_analysis')
    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY
    })

    const response = await generateText({
        model: openrouter(textModel.modelId),
        prompt: `Transform this character description into a detailed portrait for image generation consistency.
  
  Character: ${name}
  Description: ${description}
  
  Create a detailed English portrait that includes:
  - Physical appearance (age, gender, ethnicity, build)
  - Facial features (eyes, hair, expression)
  - Clothing and accessories
  - Pose and demeanor
  - Art style (high quality studio photography)
  
  Output only the portrait, no preamble.`,
        temperature: 0.3,
        // @ts-expect-error - AI SDK types can be mismatching but this works at runtime
        maxTokens: 500
    })

    return response.text.trim()
}

const GenerateSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().min(10).max(1000),
})

async function handlePost(req: NextRequest) {
    let clerkUserId: string | null = null
    const startTime = Date.now()

    try {
        clerkUserId = await validateUserAuthentication()
        const body = await req.json()
        const parsed = GenerateSchema.safeParse(body)

        if (!parsed.success) {
            const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            log.error('❌ Validação falhou em /api/characters/generate', {
                issues,
                bodyReceived: body
            })
            return NextResponse.json({
                error: 'Dados inválidos',
                details: issues
            }, { status: 400 })
        }

        const { name, description } = parsed.data
        log.info('🤖 Iniciando geração completa de personagem', { userId: clerkUserId, name })

        // 1. Validar créditos (4 créditos)
        try {
            await validateCreditsForFeature(clerkUserId, 'character_generation')
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                return NextResponse.json(
                    { error: 'insufficient_credits', required: e.required, available: e.available },
                    { status: 402 }
                )
            }
            throw e
        }

        // 2. Deduzir créditos
        await deductCreditsForFeature({
            clerkUserId,
            feature: 'character_generation',
            details: { name, description }
        })

        try {
            // 3. Expandir descrição para prompt profissional
            const textModel = await getModelConfig('agent_prompt_engineer')
            const openrouter = createOpenRouter({
                apiKey: process.env.OPENROUTER_API_KEY
            })

            const { text: enhancedPrompt } = await generateText({
                model: openrouter(textModel.modelId),
                prompt: `Transform this brief character description into a detailed, professional image generation prompt for a character portrait.

Character Name: ${name}
User Description: ${description}

Create a detailed prompt that includes:
- Physical appearance (age, gender, ethnicity, build)
- Facial features (eyes, hair, expression)
- Clothing style and details
- Pose and body language
- Art style (realistic portrait photography)

Output only the enhanced prompt in English, no preamble.`,
                temperature: 0.7,
                // @ts-expect-error - AI SDK types can be mismatching but this works at runtime
                maxTokens: 300
            })

            log.info('🎨 Prompt expandido', { enhancedPrompt })

            // 4. Gerar imagem com Flux Schnell (fundo branco)
            const imageGenConfig = await getModelConfig('ai_image')
            const fluxResult = await generateFluxImage({
                prompt: `professional character portrait, ${enhancedPrompt.trim()}, isolated on pure white background (#FFFFFF), solid white backdrop, no shadows on background, centered composition, high quality studio photography, front view, 9:16 aspect ratio`,
                num_images: 1,
                model: 'fal-ai/flux/schnell',
                image_size: 'portrait_16_9'
            })

            const imageUrl = fluxResult.images[0].url
            log.info('🖼️ Imagem gerada', { imageUrl })

            // 5. Analisar imagem gerada para criar portrait definitivo (Vision)
            const visionConfig = await getModelConfig('character_analysis')
            let portrait = ''

            try {
                const visionResponse = await generateText({
                    model: openrouter(visionConfig.modelId),
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analise esta imagem de personagem e crie um portrait extremamente detalhado em único parágrafo em inglês.'
                                },
                                {
                                    type: 'image',
                                    image: imageUrl
                                }
                            ]
                        }
                    ],
                    system: CHARACTER_ANALYSIS_SYSTEM_PROMPT,
                    temperature: 0.3,
                    // @ts-expect-error - AI SDK types can be mismatching but this works at runtime
                    maxTokens: 500
                })

                portrait = visionResponse.text.trim()

                // Se Vision rejeitar ou retornar vazio, gerar portrait sem imagem (fallback)
                if (!portrait || portrait.toLowerCase().includes("sorry") || portrait.toLowerCase().includes("can't help")) {
                    log.warn('⚠️ Vision recusou ou falhou na análise, usando fallback apenas de texto', { name })
                    portrait = await generateTextOnlyPortrait(enhancedPrompt, name)
                }
            } catch (visionError) {
                log.warn('⚠️ Erro no Vision, usando fallback apenas de texto', { error: visionError })
                portrait = await generateTextOnlyPortrait(enhancedPrompt, name)
            }

            log.success('Geração concluída', startTime, { userId: clerkUserId })

            return NextResponse.json({
                imageUrl,
                portrait: portrait.trim(),
                creditsUsed: 4,
                modelUsed: {
                    image: 'fal-ai/flux/schnell',
                    vision: visionConfig.modelId
                }
            })

        } catch (genError) {
            log.fail('Erro no fluxo de geração', genError, { userId: clerkUserId })

            // Reembolsar créditos
            await refundCreditsForFeature({
                clerkUserId: clerkUserId!,
                feature: 'character_generation',
                reason: 'generation_flow_failed',
                details: { error: (genError as Error).message }
            })

            return NextResponse.json({ error: 'Falha durante a geração do personagem' }, { status: 502 })
        }

    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        log.error('Erro na geração de personagem', { error, userId: clerkUserId })
        return NextResponse.json({ error: 'Erro interno ao gerar personagem' }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/characters/generate',
    feature: 'character_generation' as any
})
