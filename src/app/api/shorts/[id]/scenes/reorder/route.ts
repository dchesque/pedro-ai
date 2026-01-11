import { NextResponse } from 'next/server'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { reorderScenes } from '@/lib/shorts/pipeline'
import { z } from 'zod'

const ReorderSchema = z.object({
    sceneIds: z.array(z.string()),
}).strict()

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const json = await req.json()
        const parsed = ReorderSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
        }

        await reorderScenes(id, parsed.data.sceneIds)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/scenes/reorder',
    feature: 'shorts_scenes_reorder' as any,
})
