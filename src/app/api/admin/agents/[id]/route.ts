import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { z } from 'zod';

const AgentUpdateSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    systemMessage: z.string().min(10),
    model: z.string().min(1),
    creditsPerUse: z.number().min(0).default(0),
    isActive: z.boolean().default(true),
});

// GET - Buscar agent completo para edição
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();
    const { id } = await params;

    try {
        const agent = await db.agent.findUnique({
            where: { id },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Admin fetch agent detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
    }
}

// PUT - Atualizar agent
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();
    const { id } = await params;

    try {
        const json = await req.json();
        const data = AgentUpdateSchema.parse(json);

        const agent = await db.agent.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
                systemMessage: data.systemMessage,
                model: data.model,
                creditsPerUse: data.creditsPerUse,
                isActive: data.isActive,
            },
        });

        return NextResponse.json(agent);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.format() }, { status: 400 });
        }
        console.error('Admin update agent error:', error);
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
    }
}
