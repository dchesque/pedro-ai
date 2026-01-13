import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// GET /api/styles - Listar estilos do usuário + sistema
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const styles = await db.style.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { userId: null }, // System styles
                    { isActive: true } // Assuming public/system styles are active
                ]
            },
            include: {
                _count: {
                    select: { shorts: true }
                },
                defaultClimate: true // Include default climate if set
            },
            orderBy: [
                { isSystem: 'desc' }, // System first (if isSystem exists, else use userId check)
                { createdAt: 'desc' }
            ]
        })

        // Mapear para adicionar type e formatar
        const mappedStyles = styles.map((s) => ({
            ...s,
            type: s.userId ? 'personal' : 'system',
        }))

        return NextResponse.json({ styles: mappedStyles })
    } catch (error: any) {
        console.error('[LIST_STYLES_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch styles', message: error.message }, { status: 500 })
    }
}

// POST handler - criar estilo
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar ID interno do usuário
        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();

        const style = await db.style.create({
            data: {
                name: body.name,
                description: body.description,
                icon: body.icon || '📝',
                contentType: body.contentType,
                targetAudience: body.targetAudience,
                keywords: body.keywords || [],
                discourseArchitecture: body.discourseArchitecture,
                languageRegister: body.languageRegister,
                scriptFunction: body.scriptFunction,
                narratorPosture: body.narratorPosture,
                contentComplexity: body.contentComplexity,
                advancedInstructions: body.advancedInstructions,
                hookExample: body.hookExample,
                hookType: body.hookType,
                ctaExample: body.ctaExample,
                ctaType: body.ctaType,
                visualPromptBase: body.visualPromptBase,
                compatibleClimates: body.compatibleClimates || [],
                userId: user.id,
                isSystem: false,
            },
        });

        return NextResponse.json({ style });
    } catch (error: any) {
        console.error('[STYLES_POST]', error);
        return NextResponse.json(
            { error: 'Erro ao criar estilo' },
            { status: 500 }
        );
    }
}
