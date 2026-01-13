import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const updateStyleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    contentType: z.enum(['news', 'story', 'meme', 'educational', 'motivational', 'tutorial', 'custom']).optional(),
    // Campos novos
    targetAudience: z.string().max(200).optional(),
    keywords: z.array(z.string()).optional(),
    suggestedClimateId: z.string().optional().nullable(),

    scriptwriterPrompt: z.string().max(5000).optional(),
    narrativeStyle: z.string().max(50).optional(),
    languageStyle: z.string().max(50).optional(),
    exampleHook: z.string().max(500).optional(),
    exampleCta: z.string().max(500).optional(),
    visualPrompt: z.string().max(2000).optional(),
})

// GET /api/styles/[id] - Buscar estilo específico
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id } = await params

        const style = await db.style.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { userId: null },
                    { isPublic: true },
                    { isDefault: true }
                ]
            },
            include: {
                suggestedClimate: true
            }
        })

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        return NextResponse.json({
            style: {
                ...style,
                type: style.userId ? 'personal' : 'system'
            }
        })
    } catch (error: any) {
        console.error('[GET_STYLE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch style', message: error.message }, { status: 500 })
    }
}

// PUT /api/styles/[id] - Atualizar estilo
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id } = await params
        const existingStyle = await db.style.findFirst({
            where: { id, userId: user.id }
        })

        if (!existingStyle) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        const json = await req.json()
        const parsed = updateStyleSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 })
        }

        const style = await db.style.update({
            where: { id },
            data: parsed.data
        })

        return NextResponse.json({ style })
    } catch (error: any) {
        console.error('[PUT_STYLE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to update style', message: error.message }, { status: 500 })
    }
}

// DELETE /api/styles/[id] - Excluir estilo
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id } = await params
        const existingStyle = await db.style.findFirst({
            where: { id, userId: user.id }
        })

        if (!existingStyle) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        await db.style.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[DELETE_STYLE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to delete style', message: error.message }, { status: 500 })
    }
}
