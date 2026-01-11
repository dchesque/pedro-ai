import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { generateCharacterPrompt } from '@/lib/characters/prompt-generator'

const UpdateCharacterSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    traits: z.record(z.any()).optional(),
    promptDescription: z.string().optional(),
    isActive: z.boolean().optional(),
})

async function handleGet(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const character = await db.character.findUnique({
            where: { id, userId: user.id },
            include: {
                shortCharacters: {
                    include: {
                        short: true
                    }
                }
            }
        })

        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        return NextResponse.json({ character })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
    }
}

async function handlePut(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const json = await req.json()
        const parsed = UpdateCharacterSchema.safeParse(json)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 })
        }

        const character = await db.character.findUnique({
            where: { id, userId: user.id }
        })

        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        const data = parsed.data

        // Se traits mudou e promptDescription não foi enviado, regenerar o promptDescription
        if (data.traits && !data.promptDescription) {
            data.promptDescription = generateCharacterPrompt(data.name || character.name, data.traits as any)
        }

        const updated = await db.character.update({
            where: { id },
            data: {
                ...data,
                traits: data.traits ? (data.traits as any) : undefined
            }
        })

        return NextResponse.json({ character: updated })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
    }
}

async function handleDelete(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const character = await db.character.findUnique({
            where: { id, userId: user.id }
        })

        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        // Soft delete
        await db.character.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/characters/[id]',
    feature: 'SHORT_GENERATION' as any,
})

export const PUT = withApiLogging(handlePut, {
    method: 'PUT',
    route: '/api/characters/[id]',
    feature: 'SHORT_GENERATION' as any,
})

export const DELETE = withApiLogging(handleDelete, {
    method: 'DELETE',
    route: '/api/characters/[id]',
    feature: 'SHORT_GENERATION' as any,
})
