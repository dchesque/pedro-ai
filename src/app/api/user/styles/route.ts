import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'

// GET - Listar estilos do usuário
export async function GET() {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)

    const styles = await db.userStyle.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ styles })
}

// POST - Criar estilo personalizado
const StyleSchema = z.object({
    key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _'),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    scriptwriterPrompt: z.string().max(5000).optional(),
    promptEngineerPrompt: z.string().max(5000).optional(),
    visualStyle: z.string().max(2000).optional(),
    negativePrompt: z.string().max(2000).optional(),
    isActive: z.boolean().optional(),
})

export async function POST(req: Request) {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)

    const json = await req.json()
    const data = StyleSchema.parse(json)

    // Verificar limite (ex: max 10 estilos por usuário)
    const count = await db.userStyle.count({ where: { userId: user.id } })
    if (count >= 10) {
        return NextResponse.json(
            { error: 'Limite de estilos atingido (máximo 10)' },
            { status: 400 }
        )
    }

    const style = await db.userStyle.create({
        data: { ...data, userId: user.id, clerkUserId },
    })

    return NextResponse.json({ style }, { status: 201 })
}
