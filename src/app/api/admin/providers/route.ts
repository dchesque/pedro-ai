import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getAllProviders, getCacheStats } from '@/lib/ai/providers'

export async function GET() {
    try {
        console.log('[API /admin/providers] Starting request processing...')

        try {
            await requireAdmin()
            console.log('[API /admin/providers] Admin check passed.')
        } catch (authError) {
            console.error('[API /admin/providers] Admin check failed:', authError)
            throw authError
        }

        console.log('[API /admin/providers] Fetching providers...')
        console.log('[API /admin/providers] FAL_API_KEY exists:', !!process.env.FAL_API_KEY)
        console.log('[API /admin/providers] FAL_KEY exists:', !!process.env.FAL_KEY)
        console.log('[API /admin/providers] OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY)

        const providers = getAllProviders()
        const cacheStats = getCacheStats()

        console.log('[API /admin/providers] Providers:', providers.map(p => ({ id: p.id, isEnabled: p.isEnabled })))

        return NextResponse.json({
            providers,
            cacheStats,
        })
    } catch (error: any) {
        console.error('[admin-providers] Erro:', error)

        const message = error.message || 'Internal error';
        let status = error.status || 500;

        if (message.includes('Acesso negado')) status = 403;
        if (message.includes('Não autorizado')) status = 401;

        return NextResponse.json(
            { error: message },
            { status }
        )
    }
}
