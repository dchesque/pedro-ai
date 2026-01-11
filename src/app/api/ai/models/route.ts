import { NextResponse } from 'next/server'
import { SCRIPT_GENERATION_MODELS } from '@/lib/ai/models'

export async function GET() {
    // Retornar modelos disponíveis (pode filtrar por plano do usuário no futuro)
    return NextResponse.json({
        models: SCRIPT_GENERATION_MODELS.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            provider: m.provider,
            tier: m.tier,
            isFree: m.isFree,
            creditsPerUse: m.creditsPerUse,
            badge: m.badge,
            icon: m.icon,
        }))
    })
}
