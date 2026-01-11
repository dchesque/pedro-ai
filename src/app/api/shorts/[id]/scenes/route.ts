import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { addScene } from '@/lib/shorts/pipeline'
import { z } from 'zod'

const AddSceneSchema = z.object({
    order: z.number().int().min(0),
    narration: z.string().optional(),
    visualDesc: z.string().optional(),
    duration: z.number().int().min(1).max(30).optional().default(5),
    generateWithAI: z.boolean().optional().default(false),
    aiInstructions: z.string().optional(),
}).strict()

async function handleGet(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const scenes = await db.shortScene.findMany({
            where: { shortId: id, short: { userId: user.id } },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json({ scenes })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const json = await req.json()
        const parsed = AddSceneSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid body', issues: parsed.error.format() }, { status: 400 })
        }

        const scene = await addScene(id, parsed.data)

        return NextResponse.json({ scene }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/shorts/[id]/scenes',
    feature: 'shorts_scenes_list' as any,
})

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/scenes',
    feature: 'shorts_scenes_create' as any,
})
