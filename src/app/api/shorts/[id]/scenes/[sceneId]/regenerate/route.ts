import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { regenerateScene } from '@/lib/shorts/pipeline'

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string, sceneId: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id, sceneId } = await params

        const shortExists = await db.short.findFirst({
            where: { id, userId: user.id }
        })

        if (!shortExists) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        const json = await req.json().catch(() => ({}))
        const { instructions } = json

        const scene = await regenerateScene(id, sceneId, instructions)

        return NextResponse.json({
            scene,
            creditsUsed: 0.5
        })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/scenes/[sceneId]/regenerate',
    feature: 'shorts_scenes_regenerate' as any,
})
