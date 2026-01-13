import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript } from './types'
import { resolveAgent, resolveStyle, ResolvedStyle } from './resolver'
import { AgentType } from '../../../prisma/generated/client_final'
import { createLogger } from '@/lib/logger'

interface CharacterInfo {
    name: string
    description: string
}

const log = createLogger('agents/scriptwriter')

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const USER_PROMPT_TEMPLATE = (theme: string, duration: number, styleName: string, characters: CharacterInfo[] = [], toneName?: string, targetAudience?: string) => {
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
    const tonePrompt = toneName ? `TOM DE VOZ: ${toneName}` : ''

    return `
Crie um roteiro para um short sobre:
TEMA/PREMISSA: ${theme}
DURAÇÃO ALVO: ${duration} segundos
ESTILO: ${styleName}
${tonePrompt}
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
    theme: string,
    duration: number,
    styleKey: string,
    userId?: string,
    characters: CharacterInfo[] = [],
    modelOverride?: string,
    // New optional params to support V2 system
    styleObject?: any,
    toneObject?: any,
    targetAudience?: string
): Promise<ShortScript> {
    const startTime = log.start('Gerando script', { theme, duration, style: styleKey, userId })

    // Resolver agente e estilo
    const agent = await resolveAgent(AgentType.SCRIPTWRITER, userId)

    // Resolve style: Use passed object or resolve legacy key
    let style: ResolvedStyle
    if (styleObject) {
        style = {
            key: styleObject.id, // Use ID as key
            name: styleObject.name,
            description: styleObject.description || '',
            icon: styleObject.icon || '🎨',
            scriptwriterPrompt: styleObject.scriptwriterPrompt || '',
            promptEngineerPrompt: styleObject.promptEngineerPrompt || '', // Not used here but good to have
            visualStyle: styleObject.visualPrompt || '',
            negativePrompt: '', // Not in new Style model directly? Or handled validation side
            source: 'user' // Assumed
        }
    } else {
        style = await resolveStyle(styleKey, userId)
    }

    log.info('🤖 Configuração carregada', {
        agentSource: agent.source,
        styleSource: style.source,
        model: agent.model,
        tone: toneObject?.name
    })

    let fullSystemPrompt = `${agent.systemPrompt}\n\n${style.scriptwriterPrompt}`

    // Append Tone prompt if present
    if (toneObject?.promptFragment) {
        fullSystemPrompt += `\n\nINSTRUÇÕES DE TOM (${toneObject.name}):\n${toneObject.promptFragment}`
    }

    try {
        const modelToUse = modelOverride || agent.model

        const { text } = await generateText({
            model: openrouter(modelToUse as any),
            system: fullSystemPrompt,
            prompt: USER_PROMPT_TEMPLATE(theme, duration, style.name, characters, toneObject?.name, targetAudience),
            temperature: agent.temperature,
        })

        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
        const script: ShortScript = JSON.parse(cleanText)

        if (!script.title || !script.hook || !script.scenes || !script.cta) {
            throw new Error('Script inválido: campos obrigatórios ausentes')
        }

        log.success('Script gerado', startTime, {
            title: script.title,
            scenes: script.scenes.length
        })

        return script
    } catch (error) {
        log.fail('Geração de script', error, { theme, style: styleKey })
        throw new Error('Falha ao processar o roteiro gerado pela IA')
    }
}
