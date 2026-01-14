import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

// GET - Listar todos os agents (admin)
export async function GET() {
    await requireAdmin();

    try {
        const [agents, globalAgents] = await Promise.all([
            db.agent.findMany({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                    model: true,
                    isActive: true,
                    updatedAt: true,
                    icon: true,
                },
                orderBy: { name: 'asc' },
            }),
            db.globalAgent.findMany({
                select: {
                    id: true,
                    name: true,
                    type: true,
                    model: true,
                    isActive: true,
                    updatedAt: true,
                },
                orderBy: { name: 'asc' },
            })
        ]);

        // Mapear GlobalAgents para o formato da tabela
        const mappedGlobal = globalAgents.map(ga => ({
            ...ga,
            slug: ga.type.toLowerCase(),
            icon: '⚙️', // Ícone padrão para sistema
            isGlobal: true
        }));

        return NextResponse.json({
            agents: [...mappedGlobal, ...agents]
        });
    } catch (error) {
        console.error('Admin fetch agents error:', error);
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
}
