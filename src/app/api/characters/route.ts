import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { generateCharacterPrompt } from '@/lib/characters/prompt-generator'

const CharacterSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url(),
    traits: z.record(z.any()).optional(),
    promptDescription: z.string().optional(),
})

async function handleGet(req: Request) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const characters = await db.character.findMany({
            where: { userId: user.id, isActive: true },
            orderBy: { usageCount: 'desc' },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                thumbnailUrl: true,
                traits: true,
                usageCount: true,
                createdAt: true,
                promptDescription: true,
            }
        })

        return NextResponse.json({ characters })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[characters/get] error:', error)
        return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
    }
}

async function handlePost(req: Request) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const json = await req.json()
        const parsed = CharacterSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const { name, description, imageUrl, traits, promptDescription } = parsed.data

        // 1. Validar limites (TODO: implementar src/lib/characters/limits.ts)

        // 2. Gerar promptDescription se não fornecido
        const finalPrompt = promptDescription || (traits ? generateCharacterPrompt(name, traits as any) : name)

        const character = await db.character.create({
            data: {
                userId: user.id,
                clerkUserId,
                name,
                description,
                imageUrl,
                traits: (traits || {}) as any,
                promptDescription: finalPrompt,
                isActive: true,
            }
        })

        return NextResponse.json({ character }, { status: 201 })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[characters/post] error:', error)
        return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/characters',
    feature: 'SHORT_GENERATION' as any, // Reusing existing operation type
})

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/characters',
    feature: 'SHORT_GENERATION' as any,
})
