import { db } from '@/lib/db'
import { generateScript } from '@/lib/agents/scriptwriter'
import { generatePrompts } from '@/lib/agents/prompt-engineer'
import { generateFluxImage } from '@/lib/fal/flux'
import { ShortStatus } from '../../../prisma/generated/client_final'
import type { ShortScript, PromptEngineerOutput } from '@/lib/agents/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('shorts/pipeline')

interface CreateShortInput {
    userId: string
    clerkUserId: string
    theme: string
    targetDuration?: number
    style?: string
}

interface GenerateMediaOptions {
    useVideo?: boolean  // Se true, usa Kling para vídeo em vez de imagem (future use)
}

// Criar short
export async function createShort(input: CreateShortInput) {
    log.info('📝 Criando short', {
        userId: input.userId,
        theme: input.theme,
        duration: input.targetDuration,
        style: input.style
    })

    const short = await db.short.create({
        data: {
            userId: input.userId,
            clerkUserId: input.clerkUserId,
            theme: input.theme,
            targetDuration: input.targetDuration ?? 30,
            style: input.style ?? 'engaging',
            status: 'DRAFT' as ShortStatus,
        },
    })

    log.success('Short criado', undefined, { shortId: short.id })
    return short
}

// Passo 1: Gerar roteiro
export async function generateShortScript(shortId: string): Promise<ShortScript> {
    const short = await db.short.findUniqueOrThrow({ where: { id: shortId } })

    const startTime = log.start('Gerando roteiro', {
        shortId,
        userId: short.userId,
        theme: short.theme,
        style: short.style
    })

    await db.short.update({
        where: { id: shortId },
        data: { status: 'SCRIPTING' as ShortStatus, progress: 10 },
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
        const script = await generateScript(
            short.theme,
            short.targetDuration,
            short.style,
            short.userId,
            charactersForScript
        )

        log.info('📄 Roteiro recebido', {
            shortId,
            title: script.title,
            scenes: script.scenes.length,
            totalDuration: script.totalDuration
        })

        await db.$transaction(async (tx) => {
            await tx.short.update({
                where: { id: shortId },
                data: {
                    title: script.title,
                    script: script as any,
                    hook: script.hook,
                    cta: script.cta,
                    progress: 30,
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

        log.success('Roteiro salvo', startTime, { shortId, scenes: script.scenes.length })
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

// Passo 2: Gerar prompts
export async function generateShortPrompts(shortId: string): Promise<PromptEngineerOutput> {
    const short = await db.short.findUniqueOrThrow({
        where: { id: shortId },
        include: { scenes: { orderBy: { order: 'asc' } } },
    })

    const startTime = log.start('Gerando prompts de imagem', { shortId, scenes: short.scenes.length })

    await db.short.update({
        where: { id: shortId },
        data: { status: 'PROMPTING' as ShortStatus, progress: 35 },
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
        const script = short.script as any as ShortScript
        const prompts = await generatePrompts(script, short.style, short.userId, charactersForPrompts)

        log.info('🎨 Prompts recebidos', { shortId, count: prompts.prompts.length })

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
            await tx.short.update({
                where: { id: shortId },
                data: { progress: 50 },
            })
        })

        log.success('Prompts salvos', startTime, { shortId })
        return prompts
    } catch (error) {
        log.fail('Geração de prompts', error, { shortId })

        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

// Passo 3: Gerar mídia
export async function generateShortMedia(shortId: string, _options?: GenerateMediaOptions): Promise<void> {
    const short = await db.short.findUniqueOrThrow({
        where: { id: shortId },
        include: { scenes: { orderBy: { order: 'asc' } } },
    })

    const totalScenes = short.scenes.length
    const startTime = log.start('Gerando imagens', { shortId, total: totalScenes })

    await db.short.update({
        where: { id: shortId },
        data: { status: 'GENERATING' as ShortStatus, progress: 55 },
    })

    try {
        let completedScenes = 0
        let failedScenes = 0
        let totalCreditsUsed = 0
        const batchSize = 3

        for (let i = 0; i < short.scenes.length; i += batchSize) {
            const batch = short.scenes.slice(i, i + batchSize)

            log.debug(`Processando batch ${Math.floor(i / batchSize) + 1}`, {
                shortId,
                scenes: batch.map(s => s.order).join(',')
            })

            await Promise.all(
                batch.map(async (scene) => {
                    if (!scene.imagePrompt) {
                        log.warn('Cena sem prompt, pulando', { shortId, sceneId: scene.id, order: scene.order })
                        return
                    }

                    const sceneStart = Date.now()

                    try {
                        log.debug(`Gerando imagem`, { shortId, sceneId: scene.id, order: scene.order })

                        const result = await generateFluxImage({
                            prompt: scene.imagePrompt,
                            negative_prompt: scene.negativePrompt ?? undefined,
                            image_size: 'portrait_16_9',
                            num_images: 1,
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

                        totalCreditsUsed += 1
                        completedScenes++

                        log.info(`🖼️ Imagem gerada`, {
                            shortId,
                            progress: `${completedScenes}/${totalScenes}`,
                            duration: Date.now() - sceneStart
                        })

                    } catch (error) {
                        failedScenes++
                        log.fail(`Imagem cena ${scene.order + 1}`, error, { shortId, sceneId: scene.id })

                        await db.shortScene.update({
                            where: { id: scene.id },
                            data: {
                                isGenerated: false,
                                errorMessage: (error as Error).message,
                            },
                        })
                    }

                    // Atualizar progresso
                    const progress = 55 + Math.floor(((completedScenes + failedScenes) / totalScenes) * 40)
                    await db.short.update({
                        where: { id: shortId },
                        data: { progress },
                    })
                })
            )
        }

        // Status final
        const allGenerated = failedScenes === 0
        const finalStatus = allGenerated ? 'COMPLETED' : 'FAILED'

        await db.short.update({
            where: { id: shortId },
            data: {
                status: finalStatus as ShortStatus,
                progress: allGenerated ? 100 : short.progress,
                creditsUsed: totalCreditsUsed,
                completedAt: allGenerated ? new Date() : null,
                errorMessage: allGenerated ? null : `${failedScenes} cena(s) falharam`,
            },
        })

        if (allGenerated) {
            log.success('Pipeline concluído', startTime, {
                shortId,
                scenes: `${completedScenes}/${totalScenes}`,
                credits: totalCreditsUsed
            })
        } else {
            log.warn('Pipeline concluído com erros', {
                shortId,
                success: completedScenes,
                failed: failedScenes,
                duration: Date.now() - startTime
            })
        }

    } catch (error) {
        log.fail('Geração de mídia', error, { shortId })

        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

// Pipeline completo
export async function runFullPipeline(shortId: string): Promise<void> {
    const pipelineStart = log.start('Pipeline completo', { shortId })

    try {
        await generateShortScript(shortId)
        await generateShortPrompts(shortId)
        await generateShortMedia(shortId)

        log.success('🎉 Pipeline finalizado', pipelineStart, { shortId })
    } catch (error) {
        log.fail('Pipeline', error, { shortId })
        throw error
    }
}
