import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const styleSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(10).optional(),
    contentType: z.enum(['news', 'story', 'meme', 'educational', 'motivational', 'tutorial', 'custom']),
    scriptwriterPrompt: z.string().max(5000).optional(),
    targetDuration: z.number().min(15).max(180).default(45),
    suggestedSceneCount: z.number().min(3).max(15).default(7),
    narrativeStyle: z.string().max(50).optional(),
    languageStyle: z.string().max(50).optional(),
    defaultTone: z.string().max(50).optional(),
    exampleHook: z.string().max(500).optional(),
    exampleCta: z.string().max(500).optional(),
    visualPrompt: z.string().max(2000).optional(),
})

// GET /api/styles - Listar estilos do usuário
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Buscar usuário no banco local
        const user = await db.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Usar QueryRaw para evitar erros de validação do Client que não pôde ser gerado (file lock no Windows)
        const styles: any = await db.$queryRaw`
            SELECT 
                s.*,
                (SELECT COUNT(*)::int FROM "Short" sh WHERE sh."styleId" = s.id) as "shortsCount"
            FROM "Style" s
            WHERE s."userId" = ${user.id} 
               OR s."userId" IS NULL 
               OR s."isPublic" = true 
               OR s."isDefault" = true
            ORDER BY s."isDefault" DESC, s."usageCount" DESC, s."createdAt" DESC
        `

        // Mapear para o formato que o frontend espera
        const mappedStyles = styles.map((s: any) => ({
            ...s,
            _count: {
                shorts: s.shortsCount || 0
            }
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
        const parsed = styleSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 })
        }

        const style = await db.style.create({
            data: {
                ...parsed.data,
                userId: user.id,
            }
        })

        return NextResponse.json({ style })
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create style', message: error.message }, { status: 500 })
    }
}
