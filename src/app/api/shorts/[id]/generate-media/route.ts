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
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const shortExists = await db.short.findFirst({
            where: { id, userId: user.id },
            include: { scenes: true }
        })

        if (!shortExists) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // A geração de mídia é assíncrona mas aqui vamos rodar e aguardar (ou disparar fire-and-forget)
        // O pipeline atual aguarda.
        await generateMedia(id)

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
