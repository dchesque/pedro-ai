import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { generateMedia } from '@/lib/shorts/pipeline'

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('[generate-media] Starting request...')
        const clerkUserId = await validateUserAuthentication()
        console.log('[generate-media] Auth validated:', clerkUserId)
        const user = await getUserFromClerkId(clerkUserId)
        console.log('[generate-media] User fetched:', user.id)
        const { id } = await params
        console.log('[generate-media] Params id:', id)

        const shortExists = await db.short.findFirst({
            where: { id, userId: user.id },
            include: { scenes: true }
        })
        console.log('[generate-media] Short found:', !!shortExists)

        if (!shortExists) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // A geração de mídia é assíncrona mas aqui vamos rodar e aguardar (ou disparar fire-and-forget)
        // O pipeline atual aguarda.
        console.log('[generate-media] Calling generateMedia pipeline...')
        await generateMedia(id)
        console.log('[generate-media] Pipeline finished.')

        const updatedShort = await db.short.findUnique({
            where: { id },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json({
            short: updatedShort,
            creditsUsed: (updatedShort?.scenes.length || 0) * 2
        })
    } catch (error) {
        console.error('[shorts/[id]/generate-media] error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/generate-media',
    feature: 'shorts_generate_media' as any,
})
