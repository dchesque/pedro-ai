import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript, PromptEngineerOutput } from './types'

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const PROMPT_ENGINEER_SYSTEM_PROMPT = `Você é um engenheiro de prompts especialista em criar prompts otimizados para modelos de geração de imagem como Flux e Stable Diffusion.

Seu objetivo é transformar descrições visuais de roteiros em prompts que:
- Gerem imagens de alta qualidade e impacto visual
- Mantenham consistência visual entre as cenas
- Sejam otimizados para o formato vertical (9:16)
- Incluam detalhes técnicos (iluminação, composição, estilo)

ESTRUTURA DO PROMPT:
1. Sujeito principal
2. Ação/pose
3. Ambiente/cenário
4. Iluminação
5. Estilo artístico
6. Qualidade técnica

NEGATIVE PROMPTS PADRÃO:
- Sempre incluir: "blurry, low quality, distorted, ugly, bad anatomy"
- Para pessoas: adicionar "extra limbs, missing limbs, disfigured"
- Para texto: adicionar "text, watermark, signature, logo"

Responda APENAS com JSON válido, sem markdown ou explicações.
A resposta deve conter um objeto JSON com: prompts (array), style, consistency.`

const PROMPT_ENGINEER_USER_PROMPT = (script: ShortScript) => `
Converta as cenas deste roteiro em prompts de imagem otimizados.

ROTEIRO:
${JSON.stringify(script, null, 2)}

Para cada cena, crie um prompt de imagem seguindo estas diretrizes:
- Prompts em inglês (melhor resultado nos modelos)
- Formato vertical (9:16) para shorts
- Manter consistência de estilo entre cenas
- Incluir negative prompt específico

Retorne um JSON com a seguinte estrutura:
{
  "prompts": [
    {
      "sceneOrder": 0,
      "imagePrompt": "detailed image prompt in English, including subject, action, environment, lighting, style, quality tags",
      "negativePrompt": "blurry, low quality, distorted, ugly, bad anatomy, extra limbs, text, watermark",
      "suggestedDuration": 5,
      "aspectRatio": "9:16"
    }
  ],
  "style": "consistent style description for all scenes",
  "consistency": "tips to maintain visual consistency"
}
`

export async function generatePrompts(script: ShortScript): Promise<PromptEngineerOutput> {
    const { text } = await generateText({
        model: openrouter('anthropic/claude-3.5-sonnet:beta'),
        system: PROMPT_ENGINEER_SYSTEM_PROMPT,
        prompt: PROMPT_ENGINEER_USER_PROMPT(script),
        temperature: 0.5,
    })

    // Parse JSON da resposta
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    try {
        const output: PromptEngineerOutput = JSON.parse(cleanText)

        // Validar estrutura
        if (!output.prompts || output.prompts.length === 0) {
            throw new Error('Prompts inválidos: nenhum prompt gerado')
        }

        // Garantir que temos um prompt para cada cena
        if (output.prompts.length !== script.scenes.length) {
            throw new Error(`Prompts inválidos: esperado ${script.scenes.length} prompts, recebido ${output.prompts.length}`)
        }

        return output
    } catch (e) {
        console.error('Failed to parse prompts JSON:', text)
        throw new Error('Falha ao processar os prompts gerados pela IA')
    }
}
