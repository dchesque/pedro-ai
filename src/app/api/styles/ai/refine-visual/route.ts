import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import {
    CONTENT_TYPE_LABELS,
    SCRIPT_FUNCTION_LABELS,
    NARRATOR_POSTURE_LABELS,
    CONTENT_COMPLEXITY_LABELS,
    LANGUAGE_REGISTER_LABELS
} from '@/types/style'
import { getSystemPrompt } from '@/lib/system-prompts'
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config'

const logger = createLogger('style-ai-refine-visual')

const requestSchema = z.object({
    prompt: z.string().min(1).max(5000),
    styleData: z.any().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const { prompt: userPrompt, styleData } = parsed.data

        const getLabel = (map: any, key: string) => map[key]?.label || key;

        // Build Context if available
        let contextBlock = ''
        if (styleData) {
            contextBlock = `
CONTEXTO DO PROJETO (Use APENAS para desambiguação e tom técnico):
- Nome: ${styleData.name}
- Descrição: ${styleData.description}
- Nicho/Conteúdo: ${getLabel(CONTENT_TYPE_LABELS, styleData.contentType)}
- Público: ${styleData.targetAudience}
- Palavras-Chave: ${styleData.keywords?.join(', ')}
            `.trim()
        }

        const modelId = await getDefaultModel('system_prompts')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const systemPrompt = `Você é um especialista em engenharia de prompt visual para IA (Midjourney, Flux, Stable Diffusion).`

        const visualRefineConfig = SYSTEM_PROMPTS_CONFIG.find(c => c.key === 'STYLE_VISUAL_REFINEMENT')!;
        const promptTemplate = await getSystemPrompt(visualRefineConfig.key, visualRefineConfig.defaultTemplate);

        const fullPrompt = promptTemplate
            .replace('{{CONTEXT_BLOCK}}', contextBlock)
            .replace('{{USER_PROMPT}}', userPrompt);

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: fullPrompt,
            temperature: 0.3, // Lower temperature for faithful refinement
        })

        return NextResponse.json({ refined: text.trim() })

    } catch (error: any) {
        logger.error('Refine Visual Error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
