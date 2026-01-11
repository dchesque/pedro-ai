import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { withApiLogging } from '@/lib/logging/api'
import { approveScript } from '@/lib/shorts/pipeline'

async function handlePost(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)
        const { id } = await params

        const shortExists = await db.short.findFirst({
            where: { id, userId: user.id }
        })

        if (!shortExists) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 })
        }

        const short = await approveScript(id)

        return NextResponse.json({ short })
    } catch (error) {
        console.error('[shorts/[id]/approve-script] error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/approve-script',
    feature: 'shorts_approve_script' as any,
})
