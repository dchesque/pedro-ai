import { db } from '@/lib/db'

export const CHARACTER_LIMITS = {
    free: 3,
    starter: 10,
    pro: 50,
    business: Infinity,
}

export const CHARACTERS_PER_SHORT_LIMITS = {
    free: 1,
    starter: 2,
    pro: 4,
    business: 6,
}

export async function getRemainingCharacterSlots(userId: string): Promise<number> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { currentPlanId: true }
    })

    const planId = (user?.currentPlanId || 'free') as keyof typeof CHARACTER_LIMITS
    const limit = CHARACTER_LIMITS[planId] || CHARACTER_LIMITS.free

    const count = await db.character.count({
        where: { userId, isActive: true }
    })

    return Math.max(0, limit - count)
}

export async function canCreateCharacter(userId: string): Promise<boolean> {
    const slots = await getRemainingCharacterSlots(userId)
    return slots > 0
}

export async function canAddCharacterToShort(shortId: string): Promise<boolean> {
    const short = await db.short.findUnique({
        where: { id: shortId },
        include: {
            user: {
                select: { currentPlanId: true }
            }
        }
    })

    if (!short) return false

    const planId = (short.user.currentPlanId || 'free') as keyof typeof CHARACTERS_PER_SHORT_LIMITS
    const limit = CHARACTERS_PER_SHORT_LIMITS[planId] || CHARACTERS_PER_SHORT_LIMITS.free

    const count = await db.shortCharacter.count({
        where: { shortId }
    })

    return count < limit
}
