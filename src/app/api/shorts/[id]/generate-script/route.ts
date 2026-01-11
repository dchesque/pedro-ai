import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { generateScript } from '@/lib/shorts/pipeline'

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        // Verificar posse do short
        const short = await db.short.findFirst({
            where: { id, userId: user.id }
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        const json = await req.json().catch(() => ({}))
        const { aiModel } = json

        if (aiModel) {
            await db.short.update({
                where: { id },
                data: { aiModel }
            })
        }

        const script = await generateScript(id)

        // Buscar short atualizado
        const updatedShort = await db.short.findUnique({
            where: { id },
            include: { scenes: { orderBy: { order: 'asc' } } }
        })

        return NextResponse.json({
            short: updatedShort,
            creditsUsed: 2 // Custo fixo por enquanto
        })
    } catch (error) {
        console.error('[shorts/[id]/generate-script] error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/generate-script',
    feature: 'shorts_generate_script' as any,
})
