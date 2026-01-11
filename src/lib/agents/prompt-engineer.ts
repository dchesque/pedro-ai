import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript, PromptEngineerOutput } from './types'
import { resolveAgent, resolveStyle } from './resolver'
import { AgentType } from '../../../prisma/generated/client_final'
import { combineCharactersForScene } from '@/lib/characters/prompt-generator'
import { createLogger } from '@/lib/logger'

interface CharacterInfo {
    name: string
    promptDescription: string
}

const log = createLogger('agents/prompt-engineer')

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const USER_PROMPT_TEMPLATE = (script: ShortScript, visualStyle: string, negativePrompt: string, characters: CharacterInfo[] = []) => {
    const charactersList = characters.length > 0
        ? `
PERSONAGENS NESTA HISTÓRIA:
${JSON.stringify(characters, null, 2)}

REGRAS DE PERSONAGENS:
- Identifique quais personagens aparecem em cada cena baseado na narração/descrição
- Inclua a descrição visual COMPLETA deles no prompt
- Mantenha consistência visual
`
        : ''

    return `
Converta as cenas deste roteiro em prompts de imagem otimizados.

ROTEIRO:
${JSON.stringify(script, null, 2)}

ESTILO VISUAL BASE: ${visualStyle}
NEGATIVE PROMPT BASE: ${negativePrompt}

${charactersList}

Para cada cena, crie um prompt de imagem seguindo estas diretrizes:
- Prompts em inglês (melhor resultado nos modelos)
- Formato vertical (9:16) para shorts
- Incorpore o estilo visual base em cada prompt
- Inclua o negative prompt base + específicos da cena
- Para cenas com personagens, descreva-os EXATAMENTE como fornecido

Retorne um JSON:
{
  "prompts": [
    {
      "sceneOrder": 0,
      "imagePrompt": "detailed prompt including base visual style",
      "negativePrompt": "base negative + scene specific",
      "suggestedDuration": 5,
      "aspectRatio": "9:16",
      "charactersInScene": ["Name1", "Name2"]
    }
  ],
  "style": "overall style description",
  "consistency": "tips for visual consistency"
}
`
}

export async function generatePrompts(
    script: ShortScript,
    styleKey: string,
    userId?: string,
    characters: CharacterInfo[] = []
): Promise<PromptEngineerOutput> {
    const startTime = log.start('Gerando prompts', {
        scenes: script.scenes.length,
        style: styleKey
    })

    const agent = await resolveAgent(AgentType.PROMPT_ENGINEER, userId)
    const style = await resolveStyle(styleKey, userId)

    log.info('🎨 Configuração carregada', {
        agentSource: agent.source,
        styleSource: style.source,
        model: agent.model
    })

    const fullSystemPrompt = `${agent.systemPrompt}\n\n${style.promptEngineerPrompt}`

    try {
        log.debug('Chamando LLM', { model: agent.model })

        const { text } = await generateText({
            model: openrouter(agent.model as any),
            system: fullSystemPrompt,
            prompt: USER_PROMPT_TEMPLATE(script, style.visualStyle, style.negativePrompt, characters),
            temperature: agent.temperature,
        })

        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
        const output: PromptEngineerOutput = JSON.parse(cleanText)

        if (!output.prompts || output.prompts.length === 0) {
            throw new Error('Nenhum prompt gerado')
        }

        // Pós-processamento para garantir que personangens estão bem descritos
        if (characters.length > 0) {
            output.prompts = output.prompts.map(prompt => {
                // Se a IA identificou personagens na cena (ou se inferirmos pelo texto), refinar o prompt
                // O prompt da IA já deve ser bom, mas o combineCharactersForScene dá um reforço extra se necessário
                // Por enquanto confiamos no prompt da IA, mas podemos usar combineCharactersForScene aqui se quisermos forçar a estrutura

                // Exemplo de uso do combineCharactersForScene se a IA retornasse lista de chars na cena:
                // const potentialChars = characters.filter(c => prompt.imagePrompt.includes(c.name))
                // if (potentialChars.length > 0) {
                //    const newPrompt = combineCharactersForScene(
                //       potentialChars.map(c => ({ name: c.name, promptDescription: c.promptDescription, role: 'character' })), 
                //       prompt.imagePrompt
                //    )
                //    return { ...prompt, imagePrompt: newPrompt }
                // }
                return prompt
            })
        }

        log.success('Prompts gerados', startTime, { count: output.prompts.length })
        return output
    } catch (error) {
        log.fail('Geração de prompts', error, { style: styleKey })
        throw new Error('Falha ao processar os prompts gerados pela IA')
    }
}
