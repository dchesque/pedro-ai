import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { getDefaultModel } from '@/lib/ai/model-resolver'
import { CharacterTraits } from './types'
import { createLogger } from '@/lib/logger'

const log = createLogger('characters/prompt-generator')

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

/**
 * Converte traits para um prompt descritivo em inglês otimizado para IA
 */
export function generateCharacterPrompt(name: string, traits: CharacterTraits): string {
    const parts: string[] = []

    if (traits.age) parts.push(`${traits.age}`)
    if (traits.gender) parts.push(`${traits.gender}`)
    if (traits.bodyType) parts.push(`${traits.bodyType}`)
    if (traits.skinTone) parts.push(`${traits.skinTone} skin`)
    if (traits.hairStyle) parts.push(`${traits.hairStyle}`)
    if (traits.hairColor) parts.push(`${traits.hairColor} hair`)
    if (traits.eyeColor) parts.push(`${traits.eyeColor} eyes`)
    if (traits.clothing) parts.push(`wearing ${traits.clothing}`)
    if (traits.accessories) parts.push(`with ${traits.accessories}`)
    if (traits.distinctiveFeatures) parts.push(`${traits.distinctiveFeatures}`)

    const description = parts.join(', ')
    return `${name} is a ${description}`
}

/**
 * Usa IA para analisar a imagem e extrair características (Vision)
 */
export async function analyzeCharacterImage(imageUrl: string): Promise<{ traits: CharacterTraits; promptDescription: string }> {
    log.info('Analisando imagem do personagem', { imageUrl })

    try {
        const model = await getDefaultModel('character_analysis')
        const { text } = await generateText({
            model: openrouter(model),
            system: `Analise esta imagem de um personagem e extraia as características visuais.
Retorne um JSON com:
{
  "traits": {
    "age": "string",
    "gender": "male | female | other",
    "hairColor": "string",
    "hairStyle": "string",
    "skinTone": "string",
    "eyeColor": "string",
    "clothing": "string",
    "accessories": "string",
    "bodyType": "string",
    "distinctiveFeatures": "string"
  },
  "promptDescription": "string em inglês otimizado para geração de imagem"
}`,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analise este personagem:' },
                        { type: 'image', image: imageUrl },
                    ],
                },
            ],
        })

        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
        return JSON.parse(cleanText)
    } catch (error) {
        log.error('Erro ao analisar imagem do personagem', { error })
        throw error
    }
}

/**
 * Combina múltiplos personagens em um prompt de cena
 */
export function combineCharactersForScene(
    characters: Array<{ name: string; promptDescription: string; role: string }>,
    sceneDescription: string
): string {
    if (characters.length === 0) return sceneDescription

    const characterContexts = characters
        .map((char) => `- ${char.name} (${char.role}): ${char.promptDescription}`)
        .join('\n')

    return `SCENE DESCRIPTION: ${sceneDescription}\n\nCHARACTERS IN THIS SCENE:\n${characterContexts}\n\nEnsure ALL character visual traits are strictly followed in the resulting image.`
}
