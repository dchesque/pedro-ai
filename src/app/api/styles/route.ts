import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// Schema atualizado conforme Prisma
const styleSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    contentType: z.enum(['news', 'story', 'meme', 'educational', 'motivational', 'tutorial', 'custom']),

    // Novos campos
    targetAudience: z.string().max(200).optional(),
    keywords: z.array(z.string()).optional(),
    suggestedToneId: z.string().optional(),

    scriptwriterPrompt: z.string().max(5000).optional(),
    narrativeStyle: z.string().max(50).optional(),
    languageStyle: z.string().max(50).optional(),

    // Campos antigos removidos: targetDuration, suggestedSceneCount, defaultTone

    exampleHook: z.string().max(500).optional(),
    exampleCta: z.string().max(500).optional(),
    visualPrompt: z.string().max(2000).optional(),
})

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
                    { isPublic: true },
                    { isDefault: true }
                ]
            },
            include: {
                _count: {
                    select: { shorts: true }
                },
                suggestedClimate: true // Include climate details
            },
            orderBy: [
                { isDefault: 'desc' },
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        // Mapear para adicionar type e formatar
        const mappedStyles = styles.map((s) => ({
            ...s,
            id: s.id,
            type: s.userId ? 'personal' : 'system',
            // Conversão de null para undefined se necessário, ou manter
        }))

        return NextResponse.json({ styles: mappedStyles })
    } catch (error: any) {
        console.error('[LIST_STYLES_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch styles', message: error.message }, { status: 500 })
    }
}

// POST /api/styles - Criar estilo
export async function POST(req: Request) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const json = await req.json()
        const { name, icon, fromAgent, agentOutput } = json

        let styleData: any = {}

        if (fromAgent && agentOutput) {
            styleData = {
                name,
                icon: icon || '🎨',
                description: agentOutput.description,
                contentType: agentOutput.contentType.toLowerCase(),
                narrativeStyle: agentOutput.narrativeStructure,
                languageStyle: agentOutput.narrativePerspective,
                exampleHook: agentOutput.suggestedHookTemplate,
                exampleCta: agentOutput.suggestedCtaTemplate,
                userId: user.id
            }
        } else {
            const parsed = styleSchema.safeParse(json)

            if (!parsed.success) {
                return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 })
            }

            styleData = {
                ...parsed.data,
                userId: user.id,
                keywords: parsed.data.keywords || [],
            }
        }

        const style = await db.style.create({
            data: styleData
        })

        return NextResponse.json({
            style: {
                ...style,
                type: 'personal' // Sempre personal ao criar
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create style', message: error.message }, { status: 500 })
    }
}
