import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { runFullPipeline, generateScript, generateMedia } from '@/lib/shorts/pipeline'
import { FeatureKey } from '@/lib/credits/feature-config'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/shorts/generate')

const GenerateSchema = z.object({
    step: z.enum(['full', 'script', 'prompts', 'media']).optional().default('full'),
}).strict()

async function handlePost(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    let clerkUserId: string | null = null

    try {
        clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        log.info('📥 Requisição recebida', { shortId: id, userId: user.id })

        const json = await req.json().catch(() => ({}))
        const parsed = GenerateSchema.safeParse(json)

        if (!parsed.success) {
            log.warn('Validação falhou', { shortId: id, issues: parsed.error.flatten() })
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { step } = parsed.data

        const short = await db.short.findFirst({
            where: { id, userId: user.id },
            include: { scenes: true },
        })

        if (!short) {
            log.warn('Short não encontrado', { shortId: id, userId: user.id })
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // Calcular créditos
        const estimatedScenes = Math.ceil(short.targetDuration / 5)
        const creditsNeeded = 10 + estimatedScenes

        log.info('💳 Validando créditos', { shortId: id, needed: creditsNeeded })

        try {
            await validateCreditsForFeature(clerkUserId, 'short_generation' as FeatureKey, creditsNeeded)
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                log.warn('Créditos insuficientes', { shortId: id, needed: creditsNeeded, available: e.available })
                return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
            }
            throw e
        }

        await deductCreditsForFeature({
            clerkUserId,
            feature: 'short_generation' as FeatureKey,
            quantity: creditsNeeded,
            details: { shortId: id, step },
        })

        log.info('🚀 Iniciando pipeline', { shortId: id, step, credits: creditsNeeded })

        try {
            switch (step) {
                case 'script':
                    await generateScript(id)
                    break
                case 'media':
                    await generateMedia(id)
                    break
                case 'full':
                default:
                    await runFullPipeline(id)
            }

            const updatedShort = await db.short.findUniqueOrThrow({
                where: { id },
                include: { scenes: { orderBy: { order: 'asc' } } },
            })

            log.success('Pipeline concluído', undefined, { shortId: id, status: updatedShort.status })
            return NextResponse.json({ short: updatedShort })

        } catch (error) {
            log.fail('Pipeline', error, { shortId: id })

            await refundCreditsForFeature({
                clerkUserId: clerkUserId!,
                feature: 'short_generation' as FeatureKey,
                quantity: creditsNeeded,
                reason: 'pipeline_failed',
                details: { shortId: id, error: (error as Error).message },
            })

            log.info('💰 Créditos reembolsados', { shortId: id, credits: creditsNeeded })
            throw error
        }
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        log.error('Erro não tratado', { shortId: id, error })
        return NextResponse.json({ error: 'Pipeline failed' }, { status: 500 })
    }
}

export const POST = handlePost
