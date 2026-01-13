import { db } from '@/lib/db';
import { Agent } from '../../../prisma/generated/client_final';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider'; // Import openrouter provider

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export interface AgentExecutionResult {
    success: boolean;
    output: any;
    adjustments: string[];
    creditsUsed: number;
}

export async function executeAgent(
    agent: Agent,
    answers: Record<string, any>
): Promise<AgentExecutionResult> {
    const adjustments: string[] = [];

    // 1. Validar respostas obrigatórias
    const questions = agent.questions as any[];
    for (const q of questions) {
        if (q.required && !answers[q.id]) {
            throw new Error(`A pergunta "${q.label}" é obrigatória.`);
        }
    }

    // 2. Aplicar regras de ajuste automático (pre-IA se possível, ou apenas carregar)
    const validationRules = agent.validationRules as any;
    let finalAnswers = { ...answers };

    // 3. Montar prompt
    const formattedAnswers = Object.entries(finalAnswers)
        .map(([id, value]) => {
            const question = questions.find(q => q.id === id);
            const label = question ? question.label : id;
            return `${label}: ${value}`;
        })
        .join('\n');

    const prompt = `
${agent.systemMessage}

---

RESPOSTAS DO USUÁRIO:

${formattedAnswers}

---

Baseado nas respostas acima, gere a configuração no formato JSON especificado.`;

    // 4. Chamar API de IA
    try {
        let modelString = agent.model || 'deepseek/deepseek-chat';
        let providerId = 'openrouter';
        let modelId = modelString;

        if (modelString.includes(':')) {
            const parts = modelString.split(':');
            providerId = parts[0];
            modelId = parts.slice(1).join(':');
        }

        let modelInstance;

        if (providerId === 'openrouter') {
            modelInstance = openrouter(modelId as any);
        } else if (providerId === 'fal') {
            // Fal adapter for text generation via Vercel AI SDK not typically standard yet in this codebase context?
            // Fallback to openrouter if it happens to be valid there, or error.
            // Assuming for now agent execution for JSON config is mainly LLM (OpenRouter).
            // Se provider for fal, vamos tentar usar openrouter com o modelId pois 
            // muitos modelos estão em ambos, ou lançar erro se for específico.
            console.warn(`Provider 'fal' requested for text agent. Falling back to OpenRouter logic or specific implementation.`);
            // TODO: Implementar adapter fal para vercel ai sdk se necessário
            modelInstance = openrouter(modelId as any);
        } else {
            // Default to openrouter logic
            modelInstance = openrouter(modelId as any);
        }

        const { text } = await generateText({
            model: modelInstance,
            prompt: prompt,
        });

        // 5. Parsear resposta JSON
        let output;
        try {
            // Remover possíveis blocos de código markdown
            const jsonContent = text.replace(/```json\n|\n```/g, '').trim();
            // Tentar encontrar JSON pattern se houver texto em volta
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            const finalJson = jsonMatch ? jsonMatch[0] : jsonContent;

            output = JSON.parse(finalJson);
        } catch (e) {
            console.error('Failed to parse IA response:', text);
            throw new Error('A IA retornou um formato inválido. Tente novamente.');
        }

        // 6. Aplicar validações cruzadas e ajustes automáticos pós-IA
        if (validationRules) {

        }

        return {
            success: true,
            output,
            adjustments,
            creditsUsed: agent.creditsPerUse || 0,
        };
    } catch (error: any) {
        console.error('Agent execution error:', error);
        return {
            success: false,
            output: null,
            adjustments: [],
            creditsUsed: 0,
        };
    }
}
