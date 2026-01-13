import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import {
    CONTENT_TYPE_LABELS,
    SCRIPT_FUNCTION_LABELS,
    NARRATOR_POSTURE_LABELS,
    CONTENT_COMPLEXITY_LABELS,
    LANGUAGE_REGISTER_LABELS,
    ContentType,
    ScriptFunction,
    NarratorPosture,
    ContentComplexity,
    LanguageRegister
} from '@/types/style'
import { getSystemPrompt } from '@/lib/system-prompts'
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config'

const logger = createLogger('style-ai-suggest')

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, styleData } = body

        if (!['HOOK', 'CTA'].includes(type) || !styleData) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const modelId = await getDefaultModel('agent_scriptwriter')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        // Construct Context String
        const getLabel = (map: any, key: string) => map[key]?.label || key;

        const contextStr = `
- Nome do Estilo: ${styleData.name}
- Descrição: ${styleData.description}
- Tipo de Conteúdo: ${getLabel(CONTENT_TYPE_LABELS, styleData.contentType)}
- Função do Roteiro: ${getLabel(SCRIPT_FUNCTION_LABELS, styleData.scriptFunction)}
- Postura do Narrador: ${getLabel(NARRATOR_POSTURE_LABELS, styleData.narratorPosture)}
- Complexidade: ${getLabel(CONTENT_COMPLEXITY_LABELS, styleData.contentComplexity)}
- Público-Alvo: ${styleData.targetAudience || 'Geral'}
- Palavras-Chave: ${styleData.keywords?.length ? styleData.keywords.join(', ') : 'Nenhuma'}
- Linguagem: ${getLabel(LANGUAGE_REGISTER_LABELS, styleData.languageRegister)}
- Climas Compatíveis: ${styleData.compatibleClimates?.length ? styleData.compatibleClimates.join(', ') : 'Nenhum específico'}
        `.trim()

        const hookConfig = SYSTEM_PROMPTS_CONFIG.find(c => c.key === 'STYLE_HOOK_SUGGESTION')!;
        const ctaConfig = SYSTEM_PROMPTS_CONFIG.find(c => c.key === 'STYLE_CTA_SUGGESTION')!;

        const promptTemplate = type === 'HOOK'
            ? await getSystemPrompt(hookConfig.key, hookConfig.defaultTemplate)
            : await getSystemPrompt(ctaConfig.key, ctaConfig.defaultTemplate);

        const prompt = promptTemplate.replace('{{CONTEXT_STR}}', contextStr);

        const { text } = await generateText({
            model: openrouter(modelId),
            system: "Você é um especialista em roteiros de vídeo curtos.",
            prompt: prompt,
            temperature: 0.8, // Increased for variety
        })

        // Simple JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : text

        let result
        try {
            result = JSON.parse(jsonStr)
        } catch (e) {
            console.error('JSON Parse Error', text)
            // Fallback parsing or retry logic could go here
            result = { type: type === 'HOOK' ? 'QUESTION' : 'DIRECT_ACTION', example: text }
        }

        return NextResponse.json(result)

    } catch (error: any) {
        logger.error('Style AI Suggest Error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
