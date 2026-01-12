import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const updateStyleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    contentType: z.enum(['news', 'story', 'meme', 'educational', 'motivational', 'tutorial', 'custom']).optional(),
    scriptwriterPrompt: z.string().max(5000).optional(),
    targetDuration: z.number().min(15).max(180).optional(),
    suggestedSceneCount: z.number().min(3).max(15).optional(),
    narrativeStyle: z.string().max(50).optional(),
    languageStyle: z.string().max(50).optional(),
    defaultTone: z.string().max(50).optional(),
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

        // Usar QueryRaw para evitar erros de validação do Client
        const styles: any = await db.$queryRaw`
            SELECT * FROM "Style"
            WHERE id = ${id}
            AND (
                "userId" = ${user.id} 
                OR "userId" IS NULL 
                OR "isPublic" = true
            )
            LIMIT 1
        `

        const style = styles[0]

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        return NextResponse.json({ style })
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

        // Verificar se não está sendo usado por shorts (opcional: o schema tem Cascade se configurado, mas aqui apenas desvinculamos ou excluímos)
        // No schema atual, Short possui styleId opcional e não tem Cascade onDelete: Cascade em Style.
        // Mas a relação Short -> Style não tem onDelete configurado explicitamente na ida.
        // Vamos apenas excluir o estilo. Shorts com este styleId ficarão com a referência, mas sem o objeto Style se não for Cascade.
        // Na verdade, adicionei a relação na volta mas não configurei o comportamento de delete no Short.

        await db.style.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[DELETE_STYLE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to delete style', message: error.message }, { status: 500 })
    }
}
