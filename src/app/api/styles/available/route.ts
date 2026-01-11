import { NextResponse } from 'next/server'
import { validateUserAuthentication, getUserFromClerkId } from '@/lib/auth-utils'
import { getAvailableStyles } from '@/lib/agents/resolver'

export async function GET() {
    try {
        const clerkUserId = await validateUserAuthentication()
        const user = await getUserFromClerkId(clerkUserId)

        const styles = await getAvailableStyles(user.id)

        return NextResponse.json({ styles })
    } catch {
        // Se não autenticado, retornar apenas estilos globais/padrão
        const styles = await getAvailableStyles()
        return NextResponse.json({ styles })
    }
}
