import { db } from '@/lib/db'
import { generateScript } from '@/lib/agents/scriptwriter'
import { generatePrompts } from '@/lib/agents/prompt-engineer'
import { generateFluxImage } from '@/lib/fal/flux'
import { ShortStatus } from '../../../prisma/generated/client_final'
import type { ShortScript, PromptEngineerOutput } from '@/lib/agents/types'

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

// Criar short (apenas salva input)
export async function createShort(input: CreateShortInput) {
    return db.short.create({
        data: {
            userId: input.userId,
            clerkUserId: input.clerkUserId,
            theme: input.theme,
            targetDuration: input.targetDuration ?? 30,
            style: input.style ?? 'engaging',
            status: 'DRAFT' as ShortStatus,
        },
    })
}

// Passo 1: Gerar roteiro
export async function generateShortScript(shortId: string): Promise<ShortScript> {
    const short = await db.short.findUniqueOrThrow({ where: { id: shortId } })

    // Atualizar status
    await db.short.update({
        where: { id: shortId },
        data: { status: 'SCRIPTING' as ShortStatus, progress: 10 },
    })

    try {
        // Gerar roteiro via agente
        const script = await generateScript(
            short.theme,
            short.targetDuration,
            short.style,
            short.userId
        )

        // Salvar roteiro e criar cenas
        await db.$transaction(async (tx) => {
            // Atualizar short com roteiro
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

            // Criar cenas
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

        return script
    } catch (error) {
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

    if (!short.script) {
        throw new Error('Short não possui roteiro')
    }

    await db.short.update({
        where: { id: shortId },
        data: { status: 'PROMPTING' as ShortStatus, progress: 40 },
    })

    try {
        // Gerar prompts via agente
        const prompts = await generatePrompts(
            short.script as any as ShortScript,
            short.style,
            short.userId
        )

        // Atualizar cenas com prompts
        await db.$transaction(async (tx) => {
            for (const prompt of prompts.prompts) {
                await tx.shortScene.updateMany({
                    where: { shortId, order: prompt.sceneOrder },
                    data: {
                        imagePrompt: prompt.imagePrompt,
                        negativePrompt: prompt.negativePrompt,
                        duration: prompt.suggestedDuration,
                    },
                })
            }

            await tx.short.update({
                where: { id: shortId },
                data: { progress: 50 },
            })
        })

        return prompts
    } catch (error) {
        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

// Passo 3: Gerar mídias (batch)
export async function generateShortMedia(
    shortId: string,
    options: GenerateMediaOptions = {}
): Promise<void> {
    const short = await db.short.findUniqueOrThrow({
        where: { id: shortId },
        include: { scenes: { orderBy: { order: 'asc' } } },
    })

    if (short.scenes.some((s) => !s.imagePrompt)) {
        throw new Error('Algumas cenas não possuem prompts')
    }

    await db.short.update({
        where: { id: shortId },
        data: { status: 'GENERATING' as ShortStatus, progress: 55 },
    })

    try {
        const totalScenes = short.scenes.length
        let completedScenes = 0
        let totalCreditsUsed = 0

        // Gerar mídias em paralelo (com limite de concorrência)
        const concurrencyLimit = 3
        const chunks: typeof short.scenes[] = []

        for (let i = 0; i < short.scenes.length; i += concurrencyLimit) {
            chunks.push(short.scenes.slice(i, i + concurrencyLimit))
        }

        for (const chunk of chunks) {
            await Promise.all(
                chunk.map(async (scene) => {
                    try {
                        // Gerar imagem com Flux Schnell
                        const result = await generateFluxImage({
                            prompt: scene.imagePrompt!,
                            image_size: 'portrait_16_9', // 9:16 para shorts
                            // Note: check available sizes in flux.ts if known. Usually 'portrait_16_9' is valid in fal.
                            num_images: 1,
                        })

                        const image = result.images[0]

                        // Atualizar cena com mídia
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

                        totalCreditsUsed += 1 // 1 crédito por imagem
                    } catch (error) {
                        console.error(`Cena ${scene.id} falhou:`, error)
                        await db.shortScene.update({
                            where: { id: scene.id },
                            data: {
                                isGenerated: false,
                                errorMessage: (error as Error).message,
                            },
                        })
                    }

                    completedScenes++
                    const progress = 55 + Math.floor((completedScenes / totalScenes) * 40)

                    await db.short.update({
                        where: { id: shortId },
                        data: { progress },
                    })
                })
            )
        }

        // Verificar se todas as cenas foram geradas
        const updatedShort = await db.short.findUniqueOrThrow({
            where: { id: shortId },
            include: { scenes: true },
        })

        const allGenerated = updatedShort.scenes.every((s) => s.isGenerated)

        await db.short.update({
            where: { id: shortId },
            data: {
                status: allGenerated ? 'COMPLETED' as ShortStatus : 'FAILED' as ShortStatus,
                progress: allGenerated ? 100 : updatedShort.progress,
                creditsUsed: totalCreditsUsed,
                completedAt: allGenerated ? new Date() : null,
                errorMessage: allGenerated ? null : 'Algumas cenas falharam na geração',
            },
        })
    } catch (error) {
        await db.short.update({
            where: { id: shortId },
            data: { status: 'FAILED' as ShortStatus, errorMessage: (error as Error).message },
        })
        throw error
    }
}

// Pipeline completo (executa todos os passos)
export async function runFullPipeline(shortId: string): Promise<void> {
    await generateShortScript(shortId)
    await generateShortPrompts(shortId)
    await generateShortMedia(shortId)
}
