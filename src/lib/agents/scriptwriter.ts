import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript } from './types'
import { resolveAgent, resolveStyle } from './resolver'
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

const USER_PROMPT_TEMPLATE = (theme: string, duration: number, styleName: string, characters: CharacterInfo[] = []) => {
    const charactersPrompt = characters.length > 0
        ? `
PERSONAGENS DISPONÍVEIS:
${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}

REGRAS DE PERSONAGEM:
- Use os personagens pelo NOME nas cenas quando apropriado
- Descreva ações específicas consistentes com a descrição deles
`
        : ''

    return `
Crie um roteiro para um short sobre:
TEMA: ${theme}
DURAÇÃO ALVO: ${duration} segundos
ESTILO: ${styleName}
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
    characters: CharacterInfo[] = []
): Promise<ShortScript> {
    const startTime = log.start('Gerando script', { theme, duration, style: styleKey, userId })

    // Resolver agente e estilo
    const agent = await resolveAgent(AgentType.SCRIPTWRITER, userId)
    const style = await resolveStyle(styleKey, userId)

    log.info('🤖 Configuração carregada', {
        agentSource: agent.source,
        styleSource: style.source,
        model: agent.model
    })

    const fullSystemPrompt = `${agent.systemPrompt}\n\n${style.scriptwriterPrompt}`

    try {
        log.debug('Chamando LLM', { model: agent.model, temperature: agent.temperature })

        const { text } = await generateText({
            model: openrouter(agent.model as any),
            system: fullSystemPrompt,
            prompt: USER_PROMPT_TEMPLATE(theme, duration, style.name, characters),
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
