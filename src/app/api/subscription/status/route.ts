import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { withApiLogging } from '@/lib/logging/api'
import { isAdmin } from '@/lib/admin-utils'

async function handleSubscriptionStatus() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        creditBalance: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let currentPlan = null
    if (user.currentPlanId) {
      currentPlan = await db.plan.findUnique({
        where: { id: user.currentPlanId }
      })
    }

    if (!currentPlan) {
      currentPlan = await db.plan.findFirst({
        where: {
          OR: [
            { clerkId: 'free' },
            { name: { contains: 'free', mode: 'insensitive' } },
            { name: { contains: 'gratuito', mode: 'insensitive' } }
          ],
          active: true
        },
        orderBy: { credits: 'asc' }
      })
    }

    const planName = currentPlan?.name || 'free'
    const isUserAdmin = await isAdmin(userId)

    // O usuário é considerado ativo se tiver um plano explicitamente atribuído E a conta estiver ativa
    // OU se for um administrador.
    const isActive = (!!user.currentPlanId && user.isActive) || isUserAdmin

    return NextResponse.json({
      isActive,
      isAdmin: isUserAdmin,
      plan: planName,
      planId: currentPlan?.id || null,
      billingPeriodEnd: user.billingPeriodEnd?.toISOString() || null,
      cancellationScheduled: user.cancellationScheduled || false
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json({ error: 'Failed to resolve subscription status' }, { status: 500 })
  }
}

export const GET = withApiLogging(handleSubscriptionStatus, {
  method: 'GET',
  route: '/api/subscription/status',
  feature: 'subscription',
})
