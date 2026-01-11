import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { AgentType } from '../../../../../prisma/generated/client_final'

// GET - Listar agentes do usuário
export async function GET() {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)

    const agents = await db.userAgent.findMany({
        where: { userId: user.id },
        orderBy: { type: 'asc' },
    })

    return NextResponse.json({ agents })
}

// POST - Criar/Atualizar agente do usuário
const AgentSchema = z.object({
    type: z.nativeEnum(AgentType),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    systemPrompt: z.string().min(10).max(10000),
    model: z.string().max(100).optional(),
    temperature: z.number().min(0).max(2).optional(),
    isActive: z.boolean().optional(),
})

export async function POST(req: Request) {
    const clerkUserId = await validateUserAuthentication()
    const user = await getUserFromClerkId(clerkUserId)

    const json = await req.json()
    const data = AgentSchema.parse(json)

    const agent = await db.userAgent.upsert({
        where: { userId_type: { userId: user.id, type: data.type } },
        create: { ...data, userId: user.id, clerkUserId },
        update: data,
    })

    return NextResponse.json({ agent }, { status: 201 })
}
