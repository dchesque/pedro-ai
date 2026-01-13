import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'
import { SystemAgentType } from '../../../../../../prisma/generated/client_final'

// DELETE - Deletar agente global
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    await requireAdmin()
    const { type } = await params

    await db.globalAgent.delete({
        where: { type: type as SystemAgentType },
    })

    return NextResponse.json({ success: true })
}
