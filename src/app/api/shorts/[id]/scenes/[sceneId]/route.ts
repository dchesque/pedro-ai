import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { updateScene, removeScene } from '@/lib/shorts/pipeline'
import { z } from 'zod'

const UpdateSceneSchema = z.object({
    narration: z.string().optional(),
    visualDesc: z.string().optional(),
    visualPrompt: z.string().optional(),
    duration: z.number().int().min(1).max(30).optional(),
}).strict()

async function handlePut(
    req: Request,
    { params }: { params: Promise<{ id: string, sceneId: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { sceneId } = await params

        // Verificar se a cena pertence ao usuário
        const sceneExists = await db.shortScene.findFirst({
            where: { id: sceneId, short: { userId: user.id } }
        })

        if (!sceneExists) {
            return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
        }

        const json = await req.json()
        const parsed = UpdateSceneSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
        }

        const scene = await updateScene(sceneId, parsed.data)

        return NextResponse.json({ scene })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

async function handleDelete(
    req: Request,
    { params }: { params: Promise<{ id: string, sceneId: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { sceneId } = await params

        // Verificar se a cena pertence ao usuário
        const sceneExists = await db.shortScene.findFirst({
            where: { id: sceneId, short: { userId: user.id } }
        })

        if (!sceneExists) {
            return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
        }

        await removeScene(sceneId)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const PUT = withApiLogging(handlePut, {
    method: 'PUT',
    route: '/api/shorts/[id]/scenes/[sceneId]',
    feature: 'shorts_scenes_update' as any,
})

export const DELETE = withApiLogging(handleDelete, {
    method: 'DELETE',
    route: '/api/shorts/[id]/scenes/[sceneId]',
    feature: 'shorts_scenes_delete' as any,
})
