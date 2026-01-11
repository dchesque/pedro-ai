import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'

// PUT - Atualizar
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)
    const { id } = await params

    // Verificar ownership
    const existing = await db.userStyle.findFirst({
        where: { id, userId: user.id },
    })
    if (!existing) {
        return NextResponse.json({ error: 'Estilo não encontrado' }, { status: 404 })
    }

    const json = await req.json()
    const UpdateSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        icon: z.string().max(10).optional(),
        scriptwriterPrompt: z.string().max(5000).optional(),
        promptEngineerPrompt: z.string().max(5000).optional(),
        visualStyle: z.string().max(2000).optional(),
        negativePrompt: z.string().max(2000).optional(),
        isActive: z.boolean().optional(),
    })
    const data = UpdateSchema.parse(json)

    const style = await db.userStyle.update({
        where: { id },
        data,
    })

    return NextResponse.json({ style })
}

// DELETE
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)
    const { id } = await params

    const existing = await db.userStyle.findFirst({
        where: { id, userId: user.id },
    })
    if (!existing) {
        return NextResponse.json({ error: 'Estilo não encontrado' }, { status: 404 })
    }

    await db.userStyle.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
