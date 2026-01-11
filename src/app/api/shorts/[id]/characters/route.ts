import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'

const AddCharacterSchema = z.object({
    characterId: z.string().cuid(),
    role: z.string().optional().default('character'),
    orderIndex: z.number().int().optional().default(0),
    customPrompt: z.string().optional(),
    customClothing: z.string().optional(),
})

async function handleGet(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: shortId } = await params
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        // Verificar se o short pertence ao usuário
        const short = await db.short.findUnique({
            where: { id: shortId, userId: user.id }
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        const characters = await db.shortCharacter.findMany({
            where: { shortId },
            include: {
                character: true
            },
            orderBy: { orderIndex: 'asc' }
        })

        return NextResponse.json({ characters })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to fetch short characters' }, { status: 500 })
    }
}

async function handlePost(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: shortId } = await params
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const json = await req.json()
        const parsed = AddCharacterSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { characterId, role, orderIndex, customPrompt, customClothing } = parsed.data

        // 1. Verificar se o short e o personagem pertencem ao usuário
        const [short, character] = await Promise.all([
            db.short.findUnique({ where: { id: shortId, userId: user.id } }),
            db.character.findUnique({ where: { id: characterId, userId: user.id } })
        ])

        if (!short || !character) {
            return NextResponse.json({ error: 'Short or Character not found' }, { status: 404 })
        }

        // 2. Criar associação
        const shortCharacter = await db.shortCharacter.upsert({
            where: {
                shortId_characterId: {
                    shortId,
                    characterId
                }
            },
            update: {
                role,
                orderIndex,
                customPrompt,
                customClothing
            },
            create: {
                shortId,
                characterId,
                role,
                orderIndex,
                customPrompt,
                customClothing
            }
        })

        // 3. Incrementar usageCount do personagem
        await db.character.update({
            where: { id: characterId },
            data: { usageCount: { increment: 1 } }
        })

        return NextResponse.json({ shortCharacter })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[short-characters/post] error:', error)
        return NextResponse.json({ error: 'Failed to add character to short' }, { status: 500 })
    }
}

async function handleDelete(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: shortId } = await params
        const { searchParams } = new URL(req.url)
        const characterId = searchParams.get('characterId')

        if (!characterId) {
            return NextResponse.json({ error: 'Missing characterId' }, { status: 400 })
        }

        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        // Verificar se o short pertence ao usuário
        const short = await db.short.findUnique({
            where: { id: shortId, userId: user.id }
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        // Remover associação
        await db.shortCharacter.delete({
            where: {
                shortId_characterId: {
                    shortId,
                    characterId
                }
            }
        })

        // Decrementar usageCount do personagem
        await db.character.update({
            where: { id: characterId },
            data: { usageCount: { decrement: 1 } }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to remove character from short' }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/shorts/[id]/characters',
    feature: 'SHORT_GENERATION' as any,
})

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/characters',
    feature: 'SHORT_GENERATION' as any,
})

export const DELETE = withApiLogging(handleDelete, {
    method: 'DELETE',
    route: '/api/shorts/[id]/characters',
    feature: 'SHORT_GENERATION' as any,
})
