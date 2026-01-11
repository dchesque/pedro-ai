import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript } from './types'
import { resolveAgent, resolveStyle } from './resolver'
import { AgentType } from '../../../prisma/generated/client_final'

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const USER_PROMPT_TEMPLATE = (theme: string, duration: number, styleName: string) => `
Crie um roteiro para um short sobre:
TEMA: ${theme}
DURAÇÃO ALVO: ${duration} segundos
ESTILO: ${styleName}

Retorne um JSON com a seguinte estrutura:
{
  "title": "Título chamativo do short",
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

export async function generateScript(
    theme: string,
    duration: number,
    styleKey: string,
    userId?: string
): Promise<ShortScript> {
    // Resolver agente e estilo
    const agent = await resolveAgent(AgentType.SCRIPTWRITER, userId)
    const style = await resolveStyle(styleKey, userId)

    // Montar system prompt completo
    const fullSystemPrompt = `${agent.systemPrompt}

${style.scriptwriterPrompt}`

    const { text } = await generateText({
        model: openrouter(agent.model as any),
        system: fullSystemPrompt,
        prompt: USER_PROMPT_TEMPLATE(theme, duration, style.name),
        temperature: agent.temperature,
    })

    // Parse JSON
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    try {
        const script: ShortScript = JSON.parse(cleanText)

        if (!script.title || !script.hook || !script.scenes || !script.cta) {
            throw new Error('Script inválido: campos obrigatórios ausentes')
        }

        if (script.scenes.length === 0) {
            throw new Error('Script inválido: nenhuma cena gerada')
        }

        return script
    } catch (e) {
        console.error('Failed to parse script JSON:', text)
        throw new Error('Falha ao processar o roteiro gerado pela IA')
    }
}
