import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { createShort } from '@/lib/shorts/pipeline'

// GET - Listar shorts do usuário
async function handleGet(req: Request) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const shorts = await db.short.findMany({
            where: { userId: user.id },
            include: {
                scenes: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        order: true,
                        duration: true,
                        mediaUrl: true,
                        isGenerated: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ shorts })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/get] error:', error)
        return NextResponse.json({ error: 'Failed to fetch shorts' }, { status: 500 })
    }
}

// POST - Criar novo short
const CreateShortSchema = z.object({
    theme: z.string().min(3).max(500),
    title: z.string().optional(),
    synopsis: z.string().optional(),
    tone: z.string().optional(),
    targetDuration: z.number().int().min(15).max(60).optional().default(30),
    style: z.string().min(1).optional().default('engaging'),
    aiModel: z.string().min(1).optional().default('deepseek/deepseek-chat'),
    status: z.string().optional(),
    characterIds: z.array(z.string()).optional(),
    scenes: z.array(z.object({
        order: z.number(),
        duration: z.number().optional(),
        narration: z.string().optional(),
        visualDesc: z.string().optional(),
    })).optional(),
})

async function handlePost(req: Request) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const json = await req.json()
        const parsed = CreateShortSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { theme, title, synopsis, tone, targetDuration, style, aiModel, status, scenes, characterIds } = parsed.data

        const short = await createShort({
            userId: user.id,
            clerkUserId,
            theme,
            title,
            synopsis,
            tone,
            targetDuration,
            style,
            aiModel,
            status,
            scenes,
            characterIds,
        })

        return NextResponse.json({ short }, { status: 201 })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/post] error:', error)
        return NextResponse.json({ error: 'Failed to create short' }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/shorts',
    feature: 'shorts_list' as any,
})

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts',
    feature: 'shorts_create' as any,
})
