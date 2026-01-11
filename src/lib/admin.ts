import { isAdmin } from './admin-utils'
import { auth } from '@clerk/nextjs/server'

export async function requireAdmin() {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Não autorizado')
    }

    const isUserAdmin = await isAdmin(userId)

    if (!isUserAdmin) {
        throw new Error('Acesso negado: Requer privilégios de administrador')
    }

    return userId
}
