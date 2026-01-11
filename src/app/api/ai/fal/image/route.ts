import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct';
import { InsufficientCreditsError } from '@/lib/credits/errors';
import { generateFluxImage, IMAGE_PRESETS } from '@/lib/fal/flux';
import { createLogger } from '@/lib/logger'

const log = createLogger('api/fal/image')

const ImageSchema = z.object({
    prompt: z.string().min(1).max(2000),
    negative_prompt: z.string().max(500).optional(),
    image_size: z.enum(['square_hd', 'portrait_16_9', 'landscape_16_9']).optional().default('portrait_16_9'),
    num_images: z.number().int().min(1).max(4).optional().default(1),
    seed: z.number().optional(),
}).strict();

async function handlePost(req: Request) {
    const startTime = Date.now()

    try {
        const clerkUserId = await validateUserAuthentication()
        log.info('📥 Requisição de imagem', { userId: clerkUserId })

        const json = await req.json().catch(() => ({}))
        const parsed = ImageSchema.safeParse(json)

        if (!parsed.success) {
            log.warn('Validação falhou', { issues: parsed.error.flatten() })
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { prompt, negative_prompt, image_size, num_images, seed } = parsed.data
        const feature = 'fal_image_generation'
        const quantity = num_images

        log.debug('Parâmetros', { size: image_size, count: num_images })

        // Validar créditos
        try {
            await validateCreditsForFeature(clerkUserId, feature, quantity)
            await deductCreditsForFeature({
                clerkUserId,
                feature,
                quantity,
                details: { prompt: prompt.substring(0, 50) }
            })
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                log.warn('Créditos insuficientes', { userId: clerkUserId, needed: quantity, available: e.available })
                return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
            }
            throw e
        }

        try {
            const result = await generateFluxImage({
                prompt,
                negative_prompt,
                image_size,
                num_images,
                seed,
            })

            log.success('Imagens geradas', startTime, {
                count: result.images.length,
                userId: clerkUserId
            })

            return NextResponse.json(result)
        } catch (error) {
            log.fail('Geração de imagem', error)
            await refundCreditsForFeature({
                clerkUserId,
                feature,
                quantity,
                reason: 'generation_failed'
            })
            return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
        }
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        log.error('Erro não tratado', { error })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const POST = handlePost
