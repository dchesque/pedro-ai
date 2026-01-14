import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { createLogger } from '@/lib/logger'
import { getPromptTemplate, interpolateVariables } from '@/lib/prompts/resolver'
import { z } from 'zod'
import { db } from '@/lib/db'

const logger = createLogger('roteirista-suggest-titles')

const requestSchema = z.object({
    theme: z.string().min(1),
    styleId: z.string().optional(),
    tone: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const parsed = requestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { theme, styleId, tone } = parsed.data

        // Obter nome do estilo se fornecido
        let styleName = ''
        if (styleId) {
            const style = await db.style.findUnique({ where: { id: styleId } })
            if (style) {
                styleName = style.name;
            }
        }

        const modelId = await getDefaultModel('system_prompts')
        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        // Buscar templates
        const systemTemplate = await getPromptTemplate('roteirista.titles.system');
        const userTemplate = await getPromptTemplate('roteirista.titles.user');

        const FALLBACK_SYSTEM = `Você é um redator criativo especializado em títulos virais para vídeos curtos.
Sua tarefa é sugerir 5 títulos envolventes baseados no tema e estilo fornecidos.
Os títulos devem ser curtos, causar curiosidade ou impacto.
Responda APENAS com um JSON: { "titles": ["título1", "título2", "título3"] }`;

        const FALLBACK_USER = `Crie 3 títulos para um vídeo sobre:

TEMA: {{theme}}
{{#if style}}ESTILO: {{style}}{{/if}}
{{#if tone}}TOM: {{tone}}{{/if}}

Os títulos devem ser únicos e criativos.`;

        const systemPrompt = systemTemplate || FALLBACK_SYSTEM;

        const userPrompt = interpolateVariables(userTemplate || FALLBACK_USER, {
            theme,
            style: styleName,
            tone: tone || ''
        });

        // Garantir formato de resposta JSON no system prompt se não vier do template
        // (O template do banco já tem instrução JSON)

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.9,
        })

        let titles: string[] = []
        try {
            const cleanJson = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
            titles = JSON.parse(cleanJson)
        } catch (e) {
            // Fallback: tentar extrair linhas que parecem títulos
            titles = text.split('\n').filter(l => l.trim().length > 0).slice(0, 5).map(t => t.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        }

        return NextResponse.json({ titles })
    } catch (error: any) {
        logger.error('Suggest titles error', { error: error.message })
        return NextResponse.json(
            { error: 'Failed to suggest titles', message: error.message },
            { status: 500 }
        )
    }
}
