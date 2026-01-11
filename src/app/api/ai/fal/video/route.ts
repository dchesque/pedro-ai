import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct';
import { InsufficientCreditsError } from '@/lib/credits/errors';
import { generateKlingVideo } from '@/lib/fal/kling';
import { createLogger } from '@/lib/logger'

const log = createLogger('api/fal/video')

const VideoSchema = z.object({
    prompt: z.string().min(1).max(2000),
    image_url: z.string().url().optional(),
    duration: z.enum(['5', '10']).optional().default('5'),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1']).optional().default('9:16'),
    negative_prompt: z.string().max(500).optional(),
}).strict();

async function handlePost(req: Request) {
    const startTime = Date.now()

    try {
        const clerkUserId = await validateUserAuthentication()
        log.info('📥 Requisição de vídeo', { userId: clerkUserId })

        const json = await req.json().catch(() => ({}))
        const parsed = VideoSchema.safeParse(json)

        if (!parsed.success) {
            log.warn('Validação falhou', { issues: parsed.error.flatten() })
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { prompt, image_url, duration, aspect_ratio, negative_prompt } = parsed.data
        const isImageToVideo = !!image_url
        const feature = 'fal_video_generation'
        const quantity = parseInt(duration) // 1 credit per second

        log.info('🎬 Configuração', {
            type: isImageToVideo ? 'image-to-video' : 'text-to-video',
            duration: parseInt(duration),
            aspectRatio: aspect_ratio
        })

        // Validar créditos
        try {
            await validateCreditsForFeature(clerkUserId, feature, quantity)
            await deductCreditsForFeature({
                clerkUserId,
                feature,
                quantity,
                details: { prompt: prompt.substring(0, 50), duration }
            })
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                log.warn('Créditos insuficientes', { userId: clerkUserId, needed: quantity, available: e.available })
                return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
            }
            throw e
        }

        try {
            const result = await generateKlingVideo({
                prompt,
                image_url,
                duration: duration as '5' | '10',
                aspect_ratio: aspect_ratio as any,
                negative_prompt,
            })

            log.success('Vídeo gerado', startTime, { userId: clerkUserId })

            return NextResponse.json({
                ...result,
                duration: quantity
            })
        } catch (error) {
            log.fail('Geração de vídeo', error)
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
