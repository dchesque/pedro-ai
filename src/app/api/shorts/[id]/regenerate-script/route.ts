import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { regenerateScript } from '@/lib/shorts/pipeline'
import { getModelById } from '@/lib/ai/models'
import { validateCreditsForFeature } from '@/lib/credits/deduct'
import { FeatureKey } from '@/lib/credits/feature-config'
import { InsufficientCreditsError } from '@/lib/credits/errors'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/shorts/regenerate-script')

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const short = await db.short.findFirst({
            where: { id, userId: user.id }
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // Determinar custo do modelo atual do short
        const modelId = short.aiModel ?? 'deepseek/deepseek-v3.2'
        const model = getModelById(modelId)
        const creditsNeeded = model?.isFree ? 0 : (model?.creditsPerUse ?? 2)

        if (creditsNeeded > 0) {
            try {
                await validateCreditsForFeature(clerkUserId, 'script_regeneration' as FeatureKey, creditsNeeded)
            } catch (e) {
                if (e instanceof InsufficientCreditsError) {
                    return NextResponse.json({
                        error: 'insufficient_credits',
                        required: creditsNeeded,
                        available: e.available
                    }, { status: 402 })
                }
                throw e
            }
        }

        const script = await regenerateScript(id)

        const updatedShort = await db.short.findUnique({
            where: { id },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json({
            short: updatedShort,
            creditsUsed: creditsNeeded
        })
    } catch (error) {
        log.fail('Regeneração de roteiro', error, { shortId: id })
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/regenerate-script',
    feature: 'script_regeneration' as any,
})
