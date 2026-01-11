import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'

// GET - Detalhes do short
async function handleGet(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const short = await db.short.findFirst({
            where: { id, userId: user.id },
            include: {
                scenes: {
                    orderBy: { order: 'asc' },
                },
            },
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        return NextResponse.json({ short })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/[id]/get] error:', error)
        return NextResponse.json({ error: 'Failed to fetch short details' }, { status: 500 })
    }
}

// DELETE - Deletar short
async function handleDelete(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const short = await db.short.findFirst({
            where: { id, userId: user.id },
        })

        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        await db.short.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/[id]/delete] error:', error)
        return NextResponse.json({ error: 'Failed to delete short' }, { status: 500 })
    }
}

// PATCH - Atualizar short (aiModel, title, summary)
async function handlePatch(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const shortExists = await db.short.findFirst({
            where: { id, userId: user.id },
        })

        if (!shortExists) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        const json = await req.json()
        const { aiModel, title, summary } = json

        const updatedShort = await db.short.update({
            where: { id },
            data: {
                aiModel: aiModel !== undefined ? aiModel : undefined,
                title: title !== undefined ? title : undefined,
                summary: summary !== undefined ? summary : undefined,
            },
        })

        return NextResponse.json({ short: updatedShort })
    } catch (error) {
        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[shorts/[id]/patch] error:', error)
        return NextResponse.json({ error: 'Failed to update short' }, { status: 500 })
    }
}

export const GET = withApiLogging(handleGet, {
    method: 'GET',
    route: '/api/shorts/[id]',
    feature: 'shorts_detail' as any,
})

export const PATCH = withApiLogging(handlePatch, {
    method: 'PATCH',
    route: '/api/shorts/[id]',
    feature: 'shorts_update' as any,
})

export const DELETE = withApiLogging(handleDelete, {
    method: 'DELETE',
    route: '/api/shorts/[id]',
    feature: 'shorts_delete' as any,
})
