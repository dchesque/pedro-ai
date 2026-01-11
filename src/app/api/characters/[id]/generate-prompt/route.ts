import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { analyzeCharacterImage } from '@/lib/characters/prompt-generator'

async function handlePost(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { traits, promptDescription } = await analyzeCharacterImage(character.imageUrl)

        const updated = await db.character.update({
            where: { id },
            data: {
                traits: traits as any,
                promptDescription
            }
        })

        return NextResponse.json({ character: updated })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[characters/generate-prompt] error:', error)
        return NextResponse.json({ error: 'Failed to generate character prompt' }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/characters/[id]/generate-prompt',
    feature: 'SHORT_GENERATION' as any,
})
