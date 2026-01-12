import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getAllProviders, getCacheStats } from '@/lib/ai/providers'

export async function GET() {
    try {
        await requireAdmin()

        const providers = getAllProviders()
        const cacheStats = getCacheStats()

        return NextResponse.json({
            providers,
            cacheStats,
        })
    } catch (error: any) {
        console.error('[admin-providers] Erro:', error)
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: error.status || 500 }
        )
    }
}
