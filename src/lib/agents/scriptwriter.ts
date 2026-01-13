import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript } from './types'
import { resolveAgent, resolveStyle, ResolvedStyle } from './resolver'
import { SystemAgentType } from '../../../prisma/generated/client_final'
import { createLogger } from '@/lib/logger'
import { buildClimatePrompt } from '@/lib/climate/behavior-mapping'

interface CharacterInfo {
    name: string
    description: string
}

const log = createLogger('agents/scriptwriter')

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const USER_PROMPT_TEMPLATE = (theme: string, duration: number, styleName: string, characters: CharacterInfo[] = [], climateName?: string, targetAudience?: string) => {
    const charactersPrompt = characters.length > 0
        ? `
PERSONAGENS DISPONÍVEIS:
${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}

REGRAS DE PERSONAGEM:
- Use os personagens pelo NOME nas cenas quando apropriado
- Descreva ações específicas consistentes com a descrição deles
`
        : ''

    const audiencePrompt = targetAudience ? `PÚBLICO-ALVO: ${targetAudience}` : ''
    const climatePrompt = climateName ? `CLIMA NARRATIVO: ${climateName}` : ''

    return `
Crie um roteiro para um short sobre:
TEMA/PREMISSA: ${theme}
DURAÇÃO ALVO: ${duration} segundos
ESTILO: ${styleName}
${climatePrompt}
${audiencePrompt}
${charactersPrompt}

Retorne um JSON com a seguinte estrutura:
{
  "title": "Título chamativo do short",
  "summary": "Resumo de 2-3 frases da história para controle interno",
  "hook": "Frase de gancho para os primeiros 3 segundos",
  "scenes": [
    {
      "order": 0,
      "narration": "Texto que será narrado nesta cena",
      "visualDescription": "Descrição detalhada do que deve aparecer visualmente",
      "duration": 5,
      "mood": "excited"
    }
  ],
  "cta": "Call to action final",
  "totalDuration": ${duration},
  "style": "${styleName}"
}
`
}

export async function generateScript(
    userId: string | undefined,
    theme: string,
    duration: number,
    styleKey: string,
    characters: any[] = [],
    climateId?: string,
    modelOverride?: string,
    // New optional params to support V2 system
    styleObject?: any,
    climateObject?: any,
    targetAudience?: string
): Promise<ShortScript> {
    const startTime = log.start('Gerando script', { theme, duration, style: styleKey, userId })

    // Resolve as partes do agente
    const agent = await resolveAgent(SystemAgentType.SCRIPTWRITER, userId)
    const style = styleObject || await resolveStyle(styleKey, userId)

    // Determine model to use
    const modelToUse = modelOverride || agent.model

    log.info('🤖 Configuração carregada', {
        agentSource: agent.source,
        styleSource: style.source,
        model: agent.model,
        climate: climateObject?.name
    })

    let fullSystemPrompt = `${agent.systemPrompt}\n\n${style.scriptwriterPrompt}`

    // Append Climate behavioral prompt if present
    if (climateObject) {
        const climateBehavioralPrompt = buildClimatePrompt(climateObject)
        fullSystemPrompt += `\n\nINSTRUÇÕES DE CLIMA (${climateObject.name}):\n${climateBehavioralPrompt}`
    }

    try {
        log.info('📡 Enviando para LLM...', { model: modelToUse })

        const { text } = await generateText({
            model: openrouter(modelToUse as any),
            system: fullSystemPrompt,
            prompt: USER_PROMPT_TEMPLATE(theme, duration, style.name, characters, climateObject?.name, targetAudience),
            temperature: agent.temperature,
        })

        if (!text) {
            throw new Error('LLM retornou texto vazio')
        }

        // Tentar extrair JSON se o modelo retornar lixo ao redor
        let jsonStr = text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            jsonStr = jsonMatch[0]
        }

        const script = JSON.parse(jsonStr) as ShortScript

        log.success('Gerando script', startTime)
        return script

    } catch (error: any) {
        log.error('❌ Falha ao gerar script', { error: error.message })
        throw error
    }
}
