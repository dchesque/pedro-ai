import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

// PUT - Atualizar estilo
const UpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    scriptwriterPrompt: z.string().max(5000).optional(),
    promptEngineerPrompt: z.string().max(5000).optional(),
    visualStyle: z.string().max(2000).optional(),
    negativePrompt: z.string().max(2000).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
})

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin()
    const { id } = await params

    const json = await req.json()
    const data = UpdateSchema.parse(json)

    if (data.isDefault) {
        await db.globalStyle.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        })
    }

    const style = await db.globalStyle.update({
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
    await requireAdmin()
    const { id } = await params

    await db.globalStyle.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
