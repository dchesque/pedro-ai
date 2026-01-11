import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

// GET - Listar estilos globais
export async function GET() {
    await requireAdmin()

    const styles = await db.globalStyle.findMany({
        orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ styles })
}

// POST - Criar estilo global
const StyleSchema = z.object({
    key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
    name: z.string().min(1).max(100),
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

export async function POST(req: Request) {
    await requireAdmin()

    const json = await req.json()
    const data = StyleSchema.parse(json)

    // Se marcando como default, desmarcar outros
    if (data.isDefault) {
        await db.globalStyle.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        })
    }

    const style = await db.globalStyle.create({ data })

    return NextResponse.json({ style }, { status: 201 })
}
