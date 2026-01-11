import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { withApiLogging } from '@/lib/logging/api'
import { runFullPipeline, generateShortScript, generateShortPrompts, generateShortMedia } from '@/lib/shorts/pipeline'
import { FeatureKey } from '@/lib/credits/feature-config'

const GenerateSchema = z.object({
    step: z.enum(['full', 'script', 'prompts', 'media']).optional().default('full'),
}).strict()

// POST - Executar pipeline de geração
async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let clerkUserId: string | null = null

    try {
        clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const json = await req.json().catch(() => ({}))
        const parsed = GenerateSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { step } = parsed.data

        // Verificar se short existe e pertence ao usuário
        const short = await db.short.findFirst({
            where: { id, userId: user.id },
            include: { scenes: true },
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // Verificar status válido para geração
        const processingStatuses = ['SCRIPTING', 'PROMPTING', 'GENERATING']
        if (processingStatuses.includes(short.status)) {
            return NextResponse.json({ error: 'Short já está sendo processado' }, { status: 409 })
        }

        // Calcular créditos necessários
        // 10 base + 1 por cena (imagem)
        const estimatedScenes = Math.ceil(short.targetDuration / 5)
        const creditsNeeded = 10 + estimatedScenes

        // Validar créditos
        try {
            await validateCreditsForFeature(clerkUserId, 'short_generation' as FeatureKey, creditsNeeded)
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                return NextResponse.json({
                    error: 'insufficient_credits',
                    required: e.required,
                    available: e.available,
                }, { status: 402 })
            }
            throw e
        }

        // Debitar créditos antecipadamente
        await deductCreditsForFeature({
            clerkUserId,
            feature: 'short_generation' as FeatureKey,
            quantity: creditsNeeded,
            details: { shortId: id, step },
        })

        try {
            // Executar pipeline baseado no step
            switch (step) {
                case 'script':
                    await generateShortScript(id)
                    break
                case 'prompts':
                    await generateShortPrompts(id)
                    break
                case 'media':
                    await generateShortMedia(id)
                    break
                case 'full':
                default:
                    await runFullPipeline(id)
            }

            // Buscar short atualizado
            const updatedShort = await db.short.findUniqueOrThrow({
                where: { id },
                include: { scenes: { orderBy: { order: 'asc' } } },
            })

            return NextResponse.json({ short: updatedShort })
        } catch (error) {
            // Reembolsar créditos em caso de falha
            await refundCreditsForFeature({
                clerkUserId: clerkUserId!,
                feature: 'short_generation' as FeatureKey,
                quantity: creditsNeeded,
                reason: 'pipeline_failed',
                details: { shortId: id, error: (error as Error).message },
            })
            throw error
        }
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/generate] error:', error)
        return NextResponse.json({ error: 'Pipeline failed', message: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/generate',
    feature: 'shorts_generate' as any,
})
