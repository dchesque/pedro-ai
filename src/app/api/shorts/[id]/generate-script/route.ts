import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { generateScript } from '@/lib/shorts/pipeline'
import { getModelById, isModelFree, getModelCredits, getDefaultModel } from '@/lib/ai/models'
import { validateCreditsForFeature, deductCreditsForFeature } from '@/lib/credits/deduct'
import { FeatureKey } from '@/lib/credits/feature-config'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/shorts/generate-script')

async function handlePost(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const json = await req.json().catch(() => ({}))
        const { aiModel } = json

        // Buscar short
        const short = await db.short.findFirst({
            where: { id, userId: user.id }
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // Determinar modelo a usar
        const modelId = aiModel ?? short.aiModel ?? getDefaultModel().id
        const model = getModelById(modelId)

        if (!model) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
        }

        // Calcular créditos (usamos a lógica da pipeline, mas validamos aqui para retornar 402 amigável)
        const creditsNeeded = model.isFree ? 0 : (model.creditsPerUse || 2)

        log.info('📥 Gerando roteiro', {
            shortId: id,
            model: modelId,
            isFree: model.isFree,
            credits: creditsNeeded
        })

        // Validar créditos apenas se modelo não for gratuito
        if (creditsNeeded > 0) {
            try {
                await validateCreditsForFeature(clerkUserId, 'script_generation' as FeatureKey, creditsNeeded)
            } catch (e) {
                if (e instanceof InsufficientCreditsError) {
                    return NextResponse.json({
                        error: 'insufficient_credits',
                        required: creditsNeeded,
                        available: e.available,
                        suggestion: 'Use o modelo gratuito DeepSeek V3.2'
                    }, { status: 402 })
                }
                throw e
            }

            // A dedução será feita DENTRO da pipeline.generateScript para garantir atomicidade e 
            // suporte a background jobs no futuro. 
            // Se chamarmos aqui e lá, cobrará 2x. 
            // Como a pipeline já tem a lógica (implementada no passo anterior), aqui só validamos.
        }

        // Atualizar modelo no short se diferente
        if (modelId !== short.aiModel) {
            await db.short.update({
                where: { id },
                data: { aiModel: modelId }
            })
        }

        // Gerar roteiro
        const script = await generateScript(id)

        const updatedShort = await db.short.findUniqueOrThrow({
            where: { id },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json({
            short: updatedShort,
            creditsUsed: creditsNeeded,
            model: {
                id: model.id,
                name: model.name,
                isFree: model.isFree
            }
        })

    } catch (error) {
        log.fail('Geração de roteiro', error, { shortId: id })
        return NextResponse.json({ error: (error as Error).message || 'Generation failed' }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/generate-script',
    feature: 'script_generation' as any,
})
