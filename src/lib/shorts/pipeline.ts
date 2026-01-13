import { db } from '@/lib/db'
import { generateScript as aiGenerateScript } from '@/lib/agents/scriptwriter'
import { generatePrompts } from '@/lib/agents/prompt-engineer'
import { generateFluxImage } from '@/lib/fal/flux'
import { ShortStatus } from '../../../prisma/generated/client_final'
import type { ShortScript, PromptEngineerOutput } from '@/lib/agents/types'
import { createLogger } from '@/lib/logger'
import { getModelById, isModelFree, getModelCredits } from '@/lib/ai/models'
import { validateCreditsForFeature, deductCreditsForFeature } from '@/lib/credits/deduct'
import { FeatureKey } from '@/lib/credits/feature-config'
import { getDefaultModel } from '@/lib/ai/model-resolver'

const log = createLogger('shorts/pipeline')

interface CreateShortInput {
    userId: string
    clerkUserId: string
    // New fields
    premise: string
    targetAudience?: string
    toneId?: string
    styleId?: string

    // Legacy fields maintained for compatibility or derived
    theme?: string
    title?: string
    synopsis?: string
    tone?: string // Legacy string tone, deprecated
    style?: string // Legacy string style, deprecated

    targetDuration?: number
    aiModel?: string
    status?: string
    characterIds?: string[]
    scenes?: Array<{
        order: number
        duration?: number
        narration?: string
        visualDesc?: string
    }>
}

/**
 * 2.1. Criar Short (DRAFT)
 */
export async function createShort(input: CreateShortInput) {
    log.info('📝 Criando short', {
        userId: input.userId,
        premise: input.premise,
        styleId: input.styleId,
        toneId: input.toneId,
    })

    const short = await db.$transaction(async (tx) => {
        // 1. Criar o Short
        const newShort = await tx.short.create({
            data: {
                userId: input.userId,
                clerkUserId: input.clerkUserId,
                premise: input.premise,
                // Map premise to theme if theme not provided (required field)
                theme: input.theme || input.premise,
                title: input.title,
                synopsis: input.synopsis,

                toneId: input.toneId,
                // Fallback to legay tone string if id not provided? Or just store legacy string.
                // Assuming legacy tone string is optional but model has it?
                // Model: toneId String?, tone Tone? @relation...
                // Wait, previously `tone` field was String? NO.
                // In my schema update I didn't verify `tone` string field removal.
                // Step 54 said: "Removed/Modified: The existing `tone` field (String) was replaced by `toneId` (FK)."
                // SO `tone` String field DOES NOT EXIST anymore.
                // But `style` String field EXISTS (line 148 in Step 212 view).
                // `toneId` exists (line 153).

                // So I CANNOT pass `tone: input.tone`.

                targetDuration: input.targetDuration ?? 30,
                styleId: input.styleId,
                // Check if style string field exists: Yes, line 148: style String @default("engaging")
                style: input.style ?? 'engaging',

                aiModel: input.aiModel ?? 'deepseek/deepseek-chat',
                status: (input.status || 'DRAFT') as ShortStatus,
            },
        })

        // 2. Criar Cenas se fornecidas
        if (input.scenes && input.scenes.length > 0) {
            for (const scene of input.scenes) {
                await tx.shortScene.create({
                    data: {
                        shortId: newShort.id,
                        order: scene.order,
                        duration: scene.duration ?? 5,
                        narration: scene.narration || '',
                        visualDesc: scene.visualDesc || '',
                    },
                })
            }
        }

        // 3. Associar Personagens se fornecidos
        if (input.characterIds && input.characterIds.length > 0) {
            for (let i = 0; i < input.characterIds.length; i++) {
                await tx.shortCharacter.create({
                    data: {
                        shortId: newShort.id,
                        characterId: input.characterIds[i],
                        orderIndex: i,
                    },
                })
            }
        }

        return newShort
    })

    log.success('Short criado com sucesso', undefined, { shortId: short.id })
    return short
}

/**
 * 2.2. Gerar Roteiro (DRAFT → SCRIPT_READY)
 */
export async function generateScript(shortId: string): Promise<ShortScript> {
    const short = await db.short.findUniqueOrThrow({
        where: { id: shortId },
        include: {
            tone: true,
            styleRelation: true
        }
    })

    const modelId = short.aiModel || await getDefaultModel('agent_scriptwriter')
    const model = getModelById(modelId)

    // Verificar se precisa cobrar créditos
    const creditsToCharge = model?.isFree ? 0 : (model?.creditsPerUse ?? 2)

    if (creditsToCharge > 0) {
        // Validar e deduzir créditos antes de começar (para evitar gasto de IA se não tiver crédito)
        await validateCreditsForFeature(short.clerkUserId, 'script_generation', creditsToCharge)
        await deductCreditsForFeature({
            clerkUserId: short.clerkUserId,
            feature: 'script_generation',
            quantity: creditsToCharge,
            details: { shortId, modelId, modelName: model?.name }
        })
    }

    const startTime = log.start('Gerando roteiro', {
        shortId,
        userId: short.userId,
        theme: short.theme,
        style: short.style,
        model: modelId,
        credits: creditsToCharge,
        isFree: model?.isFree
    })

    await db.short.update({
        where: { id: shortId },
        data: { status: 'GENERATING_SCRIPT' as ShortStatus, progress: 10 },
    })

    const shortCharacters = await db.shortCharacter.findMany({
        where: { shortId },
        include: { character: true },
        orderBy: { orderIndex: 'asc' }
    })

    const charactersForScript = shortCharacters.map(sc => ({
        name: sc.character.name,
        description: sc.character.description || sc.character.promptDescription,
        role: sc.role
    }))

    try {
        const script = await aiGenerateScript(
            short.premise || short.theme, // Use premise if available (V2)
            short.targetDuration,
            short.style,
            short.userId,
            charactersForScript,
            modelId, // Passar o modelo para o agente
            short.styleRelation, // New
            short.tone, // New
            short.styleRelation?.targetAudience || undefined // New
        )

        log.info('📄 Roteiro recebido', {
            shortId,
            title: script.title,
            scenes: script.scenes.length
        })

        await db.$transaction(async (tx) => {
            // Limpa cenas antigas se houver
            await tx.shortScene.deleteMany({ where: { shortId } })

            await tx.short.update({
                where: { id: shortId },
                data: {
                    title: script.title,
                    summary: script.summary,
                    script: script as any,
                    hook: script.hook,
                    cta: script.cta,
                    status: 'SCRIPT_READY' as ShortStatus,
                    progress: 100, // No fluxo em etapas, cada etapa concluída é 100% daquela etapa
                },
            })

            for (const scene of script.scenes) {
                await tx.shortScene.create({
                    data: {
                        shortId,
                        order: scene.order,
                        duration: scene.duration,
                        narration: scene.narration,
                        visualDesc: scene.visualDescription,
                    },
                })
            }
        })

        log.success('Roteiro pronto', startTime, { shortId, scenes: script.scenes.length })
        return script
    } catch (error) {
        log.fail('Geração de roteiro', error, { shortId })

        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

/**
 * 2.3. Regenerar Roteiro Completo
 */
export async function regenerateScript(shortId: string): Promise<ShortScript> {
    const short = await db.short.findUniqueOrThrow({ where: { id: shortId } })

    await db.short.update({
        where: { id: shortId },
        data: {
            scriptVersion: { increment: 1 },
            status: 'DRAFT' as ShortStatus // Volta para draft para gerar denovo
        }
    })

    return generateScript(shortId)
}

/**
 * 2.4. Regenerar Cena Específica (Mock/Draft logic)
 * Nota: Isso precisaria de um agente especializado que recebe o contexto do roteiro e a instrução.
 * Por enquanto vamos implementar a estrutura.
 */
export async function regenerateScene(
    shortId: string,
    sceneId: string,
    instructions?: string
) {
    log.info('Regenerando cena (IA)', { shortId, sceneId, instructions })
    // TODO: Implementar agente de regeneração de cena única
    // Por enquanto, apenas retorna a cena atual ou erro para implementar depois
    const scene = await db.shortScene.findUniqueOrThrow({ where: { id: sceneId } })
    return scene
}

/**
 * 2.5. Atualizar Cena Manualmente
 */
export async function updateScene(
    sceneId: string,
    data: { narration?: string; visualDesc?: string; duration?: number }
) {
    log.info('Atualizando cena manualmente', { sceneId, ...data })
    const scene = await db.shortScene.update({
        where: { id: sceneId },
        data
    })
    return scene
}

/**
 * 2.6. Adicionar Nova Cena
 */
export async function addScene(
    shortId: string,
    data: {
        order: number
        narration?: string
        visualDesc?: string
        duration?: number
        generateWithAI?: boolean
        aiInstructions?: string
    }
) {
    log.info('Adicionando nova cena', { shortId, order: data.order })

    // Reordenar cenas existentes
    await db.shortScene.updateMany({
        where: { shortId, order: { gte: data.order } },
        data: { order: { increment: 1 } }
    })

    const scene = await db.shortScene.create({
        data: {
            shortId,
            order: data.order,
            narration: data.narration || '',
            visualDesc: data.visualDesc || '',
            duration: data.duration ?? 5,
        }
    })

    return scene
}

/**
 * 2.7. Remover Cena
 */
export async function removeScene(sceneId: string) {
    const scene = await db.shortScene.findUniqueOrThrow({ where: { id: sceneId } })

    await db.$transaction([
        db.shortScene.delete({ where: { id: sceneId } }),
        db.shortScene.updateMany({
            where: { shortId: scene.shortId, order: { gt: scene.order } },
            data: { order: { decrement: 1 } }
        })
    ])

    log.info('Cena removida', { sceneId, shortId: scene.shortId })
}

/**
 * 2.8. Reordenar Cenas
 */
export async function reorderScenes(shortId: string, sceneIds: string[]) {
    log.info('Reordenando cenas', { shortId, count: sceneIds.length })

    await db.$transaction(
        sceneIds.map((id, index) =>
            db.shortScene.update({
                where: { id },
                data: { order: index }
            })
        )
    )
}

/**
 * 2.9. Aprovar Roteiro (SCRIPT_READY → SCRIPT_APPROVED)
 */
export async function approveScript(shortId: string) {
    log.info('Aprovando roteiro', { shortId })

    const scenes = await db.shortScene.findMany({ where: { shortId } })
    if (scenes.length === 0) {
        throw new Error('O short deve ter pelo menos uma cena')
    }

    const short = await db.short.update({
        where: { id: shortId },
        data: {
            status: 'SCRIPT_APPROVED' as ShortStatus,
            scriptApprovedAt: new Date(),
            progress: 0, // Reinicia progresso para a etapa de mídia
        }
    })

    return short
}

/**
 * 2.10. Gerar Mídia (SCRIPT_APPROVED → COMPLETED)
 */
export async function generateMedia(shortId: string): Promise<void> {
    const short = await db.short.findUniqueOrThrow({
        where: { id: shortId },
        include: { scenes: { orderBy: { order: 'asc' } } },
    })

    if (short.status !== ('SCRIPT_APPROVED' as ShortStatus)) {
        throw new Error('O roteiro precisa ser aprovado antes de gerar a mídia')
    }

    const startTime = log.start('Iniciando geração de mídia', { shortId })

    // 1. Gerar Prompts
    await db.short.update({
        where: { id: shortId },
        data: { status: 'GENERATING_PROMPTS' as ShortStatus, progress: 10 },
    })

    const shortCharacters = await db.shortCharacter.findMany({
        where: { shortId },
        include: { character: true },
        orderBy: { orderIndex: 'asc' }
    })

    const charactersForPrompts = shortCharacters.map(sc => ({
        name: sc.character.name,
        promptDescription: sc.customPrompt || sc.character.promptDescription
            + (sc.customClothing ? `, wearing ${sc.customClothing}` : ''),
    }))

    try {
        const script: ShortScript = {
            title: short.title || '',
            summary: short.summary || undefined,
            hook: short.hook || '',
            cta: short.cta || '',
            totalDuration: short.targetDuration,
            style: short.style,
            scenes: short.scenes.map(s => ({
                order: s.order,
                narration: s.narration || '',
                visualDescription: s.visualDesc || '',
                duration: s.duration,
                mood: 'neutral'
            }))
        }

        const prompts = await generatePrompts(script, short.style, short.userId, charactersForPrompts)

        await db.$transaction(async (tx) => {
            for (const prompt of prompts.prompts) {
                const scene = short.scenes.find((s) => s.order === prompt.sceneOrder)
                if (scene) {
                    await tx.shortScene.update({
                        where: { id: scene.id },
                        data: {
                            imagePrompt: prompt.imagePrompt,
                            negativePrompt: prompt.negativePrompt,
                        },
                    })
                }
            }
        })

        // 2. Gerar Imagens
        await db.short.update({
            where: { id: shortId },
            data: { status: 'GENERATING_MEDIA' as ShortStatus, progress: 30 },
        })

        // Recarregar cenas com prompts
        const scenesWithPrompts = await db.shortScene.findMany({
            where: { shortId },
            orderBy: { order: 'asc' }
        })

        let completedScenes = 0
        let totalCreditsUsed = 0
        const batchSize = 3

        for (let i = 0; i < scenesWithPrompts.length; i += batchSize) {
            const batch = scenesWithPrompts.slice(i, i + batchSize)

            await Promise.all(
                batch.map(async (scene) => {
                    if (!scene.imagePrompt) return

                    try {
                        const imageModel = await getDefaultModel('ai_image')
                        const result = await generateFluxImage({
                            prompt: scene.imagePrompt,
                            negative_prompt: scene.negativePrompt ?? undefined,
                            image_size: 'portrait_16_9',
                            num_images: 1,
                            model: imageModel,
                        })

                        const image = result.images[0]

                        await db.shortScene.update({
                            where: { id: scene.id },
                            data: {
                                mediaType: 'IMAGE',
                                mediaUrl: image.url,
                                mediaWidth: image.width,
                                mediaHeight: image.height,
                                isGenerated: true,
                            },
                        })

                        totalCreditsUsed += 2 // 2 créditos por imagem flux
                        completedScenes++
                    } catch (error) {
                        log.fail(`Erro na cena ${scene.order}`, error)
                        await db.shortScene.update({
                            where: { id: scene.id },
                            data: { errorMessage: (error as Error).message }
                        })
                    }

                    // Atualizar progresso
                    const progress = 30 + Math.floor((completedScenes / scenesWithPrompts.length) * 70)
                    await db.short.update({
                        where: { id: shortId },
                        data: { progress },
                    })
                })
            )
        }

        await db.short.update({
            where: { id: shortId },
            data: {
                status: 'COMPLETED' as ShortStatus,
                progress: 100,
                creditsUsed: { increment: totalCreditsUsed },
                completedAt: new Date()
            },
        })

        log.success('Mídia gerada com sucesso', startTime, { shortId, totalCreditsUsed })
    } catch (error) {
        log.fail('Geração de mídia', error, { shortId })
        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

/**
 * 2.11. Regenerar Imagem de Cena
 */
export async function regenerateSceneImage(
    sceneId: string,
    options?: {
        newPrompt?: string
        newNegativePrompt?: string
    }
) {
    log.info('Regenerando imagem da cena', { sceneId, ...options })

    const scene = await db.shortScene.findUniqueOrThrow({ where: { id: sceneId } })
    const prompt = options?.newPrompt || scene.imagePrompt

    if (!prompt) throw new Error('Cena não possui prompt de imagem')

    const imageModel = await getDefaultModel('ai_image')
    const result = await generateFluxImage({
        prompt: prompt,
        negative_prompt: options?.newNegativePrompt || scene.negativePrompt || undefined,
        image_size: 'portrait_16_9',
        num_images: 1,
        model: imageModel,
    })

    const image = result.images[0]

    const updatedScene = await db.shortScene.update({
        where: { id: sceneId },
        data: {
            mediaUrl: image.url,
            mediaWidth: image.width,
            mediaHeight: image.height,
            isGenerated: true,
            imagePrompt: options?.newPrompt || scene.imagePrompt,
            negativePrompt: options?.newNegativePrompt || scene.negativePrompt,
            errorMessage: null
        }
    })

    // Incrementar créditos do short
    await db.short.update({
        where: { id: scene.shortId },
        data: { creditsUsed: { increment: 2 } }
    })

    return updatedScene
}

/**
 * Pipeline completo (Mantido para compatibilidade)
 */
export async function runFullPipeline(shortId: string): Promise<void> {
    const pipelineStart = log.start('Pipeline completo (legado)', { shortId })

    try {
        await generateScript(shortId)
        await approveScript(shortId)
        await generateMedia(shortId)

        log.success('🎉 Pipeline finalizado', pipelineStart, { shortId })
    } catch (error) {
        log.fail('Pipeline', error, { shortId })
        throw error
    }
}
