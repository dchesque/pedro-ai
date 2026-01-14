import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import type { SceneData } from '@/lib/roteirista/types'
import { db } from '@/lib/db'
import { buildScriptwriterPayload } from '@/lib/shorts/payload-builder'

const logger = createLogger('roteirista-generate-scenes')

const requestSchema = z.object({
    premise: z.string().min(1),
    styleId: z.string().min(1),
    climateId: z.string().min(1),
    format: z.enum(['SHORT', 'REEL', 'LONG', 'YOUTUBE']),
    characterIds: z.array(z.string()).optional(),
    modelId: z.string().optional(),
    advancedMode: z.object({
        enabled: z.boolean(),
        maxScenes: z.number().optional(),
        avgSceneDuration: z.number().optional(),
    }).optional(),
    // Campos legados para compatibilidade se necessário
    title: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const body = await req.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const {
            premise,
            styleId,
            climateId,
            format,
            characterIds = [],
            modelId: reqModelId,
            advancedMode
        } = parsed.data

        // 1. Buscar Style completo
        const style = await db.style.findUnique({
            where: { id: styleId }
        })

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 })
        }

        // 2. Buscar Climate completo
        const climate = await db.climate.findUnique({
            where: { id: climateId }
        })

        if (!climate) {
            return NextResponse.json({ error: 'Climate not found' }, { status: 404 })
        }

        // 3. Buscar Personagens
        const characters = characterIds.length > 0
            ? await db.character.findMany({ where: { id: { in: characterIds }, userId: user.id } })
            : []

        // 4. Construir Payload Fechado
        const payload = buildScriptwriterPayload({
            premise,
            style,
            climate,
            format,
            characters,
            overrides: advancedMode?.enabled ? {
                maxScenes: advancedMode.maxScenes,
                avgSceneDuration: advancedMode.avgSceneDuration
            } : undefined
        })

        logger.info('🎬 Gerando roteiro', {
            format: payload.constraints.format,
            maxScenes: payload.constraints.maxScenes,
            isOverridden: payload.constraints.isOverridden,
            style: payload.style.name,
            climate: payload.climate.name
        })

        // 5. Resolver modelo e agente
        const modelId = reqModelId || await getDefaultModel('agent_scriptwriter')

        // Buscar o prompt do sistema do Scriptwriter (GlobalAgent)
        const agent = await db.globalAgent.findUnique({
            where: { type: 'SCRIPTWRITER' }
        })

        const systemPrompt = agent?.systemPrompt || 'Você é um roteirista especializado em vídeos curtos.'

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const userPrompt = `Abaixo está a ESPECIFICAÇÃO TÉCNICA que você deve executar.
        Responda APENAS com o JSON no formato solicitado, seguindo as REGRAS ABSOLUTAS do sistema.

        ESPECIFICAÇÃO:
        ${JSON.stringify(payload, null, 2)}`

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: agent?.temperature || 0.7,
        })

        // 6. Parse JSON da resposta
        let scenesData: { scenes: Array<{ narration: string; visualDescription: string; duration: number; goal?: string; order?: number }> }

        try {
            const cleanJson = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()

            scenesData = JSON.parse(cleanJson)
        } catch (parseError) {
            logger.error('Failed to parse scenes JSON', { response: text })
            return NextResponse.json(
                { error: 'Failed to parse AI response', raw: text },
                { status: 500 }
            )
        }

        if (!scenesData.scenes || !Array.isArray(scenesData.scenes)) {
            return NextResponse.json(
                { error: 'Invalid scenes format from AI', raw: text },
                { status: 500 }
            )
        }

        // 7. Converter para formato esperado pelo frontend
        const scenes: SceneData[] = scenesData.scenes.map((scene, index) => ({
            id: createId(),
            orderIndex: scene.order ?? index,
            narration: scene.narration,
            visualPrompt: scene.visualDescription, // Mapeando visualDescription -> visualPrompt
            duration: scene.duration || payload.constraints.avgSceneDuration,
        }))

        logger.info('Generated scenes', { count: scenes.length })

        return NextResponse.json({ scenes })

    } catch (error: any) {
        logger.error('Generate scenes error', { error })
        return NextResponse.json(
            { error: 'Failed to generate scenes', message: error.message },
            { status: 500 }
        )
    }
}

