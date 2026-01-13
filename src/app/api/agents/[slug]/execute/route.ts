import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executeAgent } from '@/lib/agents/agent-executor';
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils';
// import { deductCredits } from '@/lib/credits/deduct'; // Se houver sistema de créditos

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const clerkUserId = await validateUserAuthentication();
        const user = await getUserFromClerkId(clerkUserId);

        const body = await req.json();
        const { answers } = body;

        if (!answers) {
            return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
        }

        const agent = await db.agent.findUnique({
            where: { slug, isActive: true },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // Executar agent
        const result = await executeAgent(agent, answers);

        if (!result.success) {
            return NextResponse.json({ error: 'Failed to execute agent' }, { status: 500 });
        }

        // Deduzir créditos se necessário
        if (result.creditsUsed > 0) {
            // Logica de dedução aqui
            console.log(`Deducting ${result.creditsUsed} credits from user ${user.id}`);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Agent execution error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
