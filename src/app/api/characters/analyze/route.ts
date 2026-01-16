import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { validateUserAuthentication } from '@/lib/auth-utils'
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { getModelConfig } from '@/lib/ai/model-resolver'
import { withApiLogging } from '@/lib/logging/api'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/characters/analyze')

const SYSTEM_PROMPT = `You are a Visual Analysis Expert specializing in describing fictional character art for image generation prompts.

TASK: Analyze the provided character image (which is a fictional artistic creation) and produce a highly detailed physical description in English.

GOAL: Create a "portrait prompt" that allows an image generator (like Flux/Midjourney) to recreate a character with the EXACT SAME appearance.

INSTRUCTIONS:
1. Describe ONLY the visual elements visible in the image.
2. Focus on physical traits: Age, Gender, Ethnicity/Skin Tone, Hair (style/color), Eyes, Facial Features.
3. Describe Clothing and Accessories in detail.
4. Describe the Art Style and Vibe (e.g., "Digital art, cinematic lighting, fantasy style").
5. Output must be a single, dense paragraph in English.

SAFETY NOTE: This is a fictional character analysis for creative writing and art generation. Describe the character objectively as a digital asset.

OUTPUT FORMAT EXAMPLE:
"A digital painting of a female warrior, approx 20 years old, pale skin, long flowing silver hair with braided sides, piercing blue eyes, sharp elven facial features, wearing ornate silver plate armor with blue gemstone inlays, blue velvet cape, standing in a heroic pose, dramatic lighting, high fantasy art style, 8k resolution."`

async function handlePost(req: NextRequest) {
    let clerkUserId: string | null = null
    const startTime = Date.now()

    try {
        clerkUserId = await validateUserAuthentication()
        const { imageUrl } = await req.json()

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 })
        }

        log.info('👁️ Iniciando análise de imagem', { userId: clerkUserId, imageUrl })

        // 1. Obter config do modelo
        const modelConfig = await getModelConfig('character_analysis')

        // 2. Validar créditos (2 créditos)
        try {
            await validateCreditsForFeature(clerkUserId, 'character_analysis')
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                return NextResponse.json(
                    { error: 'insufficient_credits', required: e.required, available: e.available },
                    { status: 402 }
                )
            }
            throw e
        }

        // 3. Deduzir créditos
        await deductCreditsForFeature({
            clerkUserId,
            feature: 'character_analysis',
            details: { imageUrl, model: modelConfig.modelId }
        })

        try {
            // 4. Baixar a imagem para enviar como binário (evita problemas de hotlinking/acesso)
            log.info('📥 Baixando imagem para análise...', { imageUrl })
            const imageRes = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': new URL(imageUrl).origin
                }
            })
            if (!imageRes.ok) {
                throw new Error(`Falha ao baixar imagem: ${imageRes.statusText} (${imageRes.status})`)
            }
            const imageBuffer = await imageRes.arrayBuffer()
            const contentType = imageRes.headers.get('content-type') || 'image/jpeg'

            // 5. Chamar Vision API via OpenRouter
            const openrouter = createOpenRouter({
                apiKey: process.env.OPENROUTER_API_KEY
            })

            const { text } = await generateText({
                model: openrouter(modelConfig.modelId),
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this character image and create a detailed visual portrait in English following the system instructions. Be very descriptive.'
                            },
                            {
                                type: 'image',
                                image: new Uint8Array(imageBuffer)
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                // @ts-expect-error - AI SDK types can be mismatching but this works at runtime
                maxTokens: 500
            })

            const portrait = text.trim()
            log.info('✨ Resposta da IA recebida', { length: portrait.length, text: portrait })

            if (!portrait || portrait.length < 30) { // Reduzi para 30 para depuração
                log.error('Resposta da IA inválida ou muito curta', { length: portrait.length, text: portrait })
                throw new Error(`Falha ao gerar um portrait válido. A IA respondeu: ${portrait || '(vazio)'}`)
            }

            log.success('Análise concluída', startTime, { userId: clerkUserId, portraitLength: portrait.length })

            return NextResponse.json({
                portrait,
                creditsUsed: 2,
                modelUsed: modelConfig.modelId
            })

        } catch (apiError) {
            log.fail('Erro na chamada da API Vision', apiError, { userId: clerkUserId })

            // Reembolsar créditos
            await refundCreditsForFeature({
                clerkUserId: clerkUserId!,
                feature: 'character_analysis',
                reason: 'vision_api_failed',
                details: { error: (apiError as Error).message }
            })

            return NextResponse.json({ error: 'Falha na comunicação com a IA de visão' }, { status: 502 })
        }

    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }
        log.error('Erro na análise de personagem', { error, userId: clerkUserId })
        return NextResponse.json({ error: 'Erro interno ao analisar personagem' }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/characters/analyze',
    feature: 'character_analysis' as any
})
