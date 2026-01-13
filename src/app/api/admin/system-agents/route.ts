import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'
import { SystemAgentType } from '../../../../../prisma/generated/client_final'

// GET - Listar agentes globais
export async function GET() {
    await requireAdmin()

    const agents = await db.globalAgent.findMany({
        orderBy: { type: 'asc' },
    })

    return NextResponse.json({ agents })
}

// POST - Criar/Atualizar agente global
const AgentSchema = z.object({
    type: z.nativeEnum(SystemAgentType),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    systemPrompt: z.string().min(10).max(10000),
    model: z.string().min(1).max(100),
    temperature: z.number().min(0).max(2),
    isActive: z.boolean().optional(),
})

export async function POST(req: Request) {
    await requireAdmin()

    const json = await req.json()
    const data = AgentSchema.parse(json)

    // Upsert - cria ou atualiza
    const agent = await db.globalAgent.upsert({
        where: { type: data.type },
        create: data,
        update: data,
    })

    return NextResponse.json({ agent }, { status: 201 })
}
