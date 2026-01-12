import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getModelsFromProvider, ProviderType, ProviderCapability } from '@/lib/ai/providers'

const VALID_PROVIDERS: ProviderType[] = ['openrouter', 'fal']

export async function GET(
    req: Request,
    context: { params: Promise<{ provider: string }> }
) {
    try {
        await requireAdmin()

        const { provider } = await context.params

        // Validar provider
        if (!VALID_PROVIDERS.includes(provider as ProviderType)) {
            return NextResponse.json(
                { error: `Provider inválido: ${provider}. Válidos: ${VALID_PROVIDERS.join(', ')}` },
                { status: 400 }
            )
        }

        // Verificar filtro por capacidade
        const url = new URL(req.url)
        const capability = url.searchParams.get('capability') as ProviderCapability | null
        const forceRefresh = url.searchParams.get('refresh') === 'true'

        let response = await getModelsFromProvider(provider as ProviderType, forceRefresh)

        // Filtrar por capacidade se especificado
        if (capability) {
            response = {
                ...response,
                models: response.models.filter(m => m.capabilities.includes(capability)),
            }
        }

        return NextResponse.json(response)
    } catch (error: any) {
        console.error(`[admin-providers-models] Erro:`, error)
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: error.status || 500 }
        )
    }
}
