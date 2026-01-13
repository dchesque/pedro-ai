import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const agent = await db.agent.findUnique({
            where: { slug, isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                type: true,
                questions: true,
                outputFields: true,
                creditsPerUse: true,
            },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Failed to fetch agent:', error);
        return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
    }
}
