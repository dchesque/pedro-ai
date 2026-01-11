import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript, PromptEngineerOutput } from './types'
import { resolveAgent, resolveStyle } from './resolver'
import { AgentType } from '../../../prisma/generated/client_final'

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const USER_PROMPT_TEMPLATE = (script: ShortScript, visualStyle: string, negativePrompt: string) => `
Converta as cenas deste roteiro em prompts de imagem otimizados.

ROTEIRO:
${JSON.stringify(script, null, 2)}

ESTILO VISUAL BASE: ${visualStyle}
NEGATIVE PROMPT BASE: ${negativePrompt}

Para cada cena, crie um prompt de imagem seguindo estas diretrizes:
- Prompts em inglês (melhor resultado nos modelos)
- Formato vertical (9:16) para shorts
- Incorpore o estilo visual base em cada prompt
- Inclua o negative prompt base + específicos da cena

Retorne um JSON:
{
  "prompts": [
    {
      "sceneOrder": 0,
      "imagePrompt": "detailed prompt including base visual style",
      "negativePrompt": "base negative + scene specific",
      "suggestedDuration": 5,
      "aspectRatio": "9:16"
    }
  ],
  "style": "overall style description",
  "consistency": "tips for visual consistency"
}
`

export async function generatePrompts(
    script: ShortScript,
    styleKey: string,
    userId?: string
): Promise<PromptEngineerOutput> {
    // Resolver agente e estilo
    const agent = await resolveAgent(AgentType.PROMPT_ENGINEER, userId)
    const style = await resolveStyle(styleKey, userId)

    // Montar system prompt completo
    const fullSystemPrompt = `${agent.systemPrompt}

${style.promptEngineerPrompt}`

    const { text } = await generateText({
        model: openrouter(agent.model as any),
        system: fullSystemPrompt,
        prompt: USER_PROMPT_TEMPLATE(script, style.visualStyle, style.negativePrompt),
        temperature: agent.temperature,
    })

    // Parse JSON
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    try {
        const output: PromptEngineerOutput = JSON.parse(cleanText)

        if (!output.prompts || output.prompts.length === 0) {
            throw new Error('Prompts inválidos: nenhum prompt gerado')
        }

        if (output.prompts.length !== script.scenes.length) {
            throw new Error(`Prompts inválidos: esperado ${script.scenes.length}, recebido ${output.prompts.length}`)
        }

        return output
    } catch (e) {
        console.error('Failed to parse prompts JSON:', text)
        throw new Error('Falha ao processar os prompts gerados pela IA')
    }
}
