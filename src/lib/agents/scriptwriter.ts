import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { ShortScript } from './types'

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
})

const SCRIPTWRITER_SYSTEM_PROMPT = `Você é um roteirista especialista em criar roteiros virais para shorts/reels.

Seu objetivo é criar roteiros que:
- Prendam a atenção nos primeiros 3 segundos (gancho forte)
- Mantenham o espectador engajado até o final
- Tenham uma narrativa clara com começo, meio e fim
- Terminem com um CTA (call to action) relevante

REGRAS:
1. Cada cena deve ter entre 3-7 segundos
2. A narração deve ser concisa e impactante
3. A descrição visual deve ser detalhada o suficiente para gerar imagens
4. O total de cenas deve resultar na duração alvo
5. Use linguagem apropriada para o estilo solicitado

ESTILOS DISPONÍVEIS:
- engaging: Conteúdo envolvente e dinâmico
- educational: Informativo e didático
- funny: Humorístico e leve
- dramatic: Intenso e emocionante
- inspirational: Motivacional e positivo

Responda APENAS com JSON válido, sem markdown ou explicações.
A resposta deve ser obrigatoriamente um objeto JSON com campos: title, hook, scenes (array), cta, totalDuration, style.`

const SCRIPTWRITER_USER_PROMPT = (theme: string, duration: number, style: string) => `
Crie um roteiro para um short sobre:
TEMA: ${theme}
DURAÇÃO ALVO: ${duration} segundos
ESTILO: ${style}

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
  "style": "${style}"
}
`

export async function generateScript(
    theme: string,
    duration: number,
    style: string
): Promise<ShortScript> {
    const { text } = await generateText({
        model: openrouter('anthropic/claude-3.5-sonnet:beta'),
        system: SCRIPTWRITER_SYSTEM_PROMPT,
        prompt: SCRIPTWRITER_USER_PROMPT(theme, duration, style),
        temperature: 0.7,
    })

    // Parse JSON da resposta
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    try {
        const script: ShortScript = JSON.parse(cleanText)

        // Validar estrutura básica
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
