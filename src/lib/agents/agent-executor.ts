import { db } from '@/lib/db';
import { Agent } from '../../../prisma/generated/client_final';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

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
        const model = agent.model || 'deepseek/deepseek-chat';

        const { text } = await generateText({
            model: openrouter(model as any),
            prompt: prompt,
        });

        // 5. Parsear resposta JSON
        let output;
        try {
            // Remover possíveis blocos de código markdown
            const jsonContent = text.replace(/```json\n|\n```/g, '').trim();
            output = JSON.parse(jsonContent);
        } catch (e) {
            console.error('Failed to parse IA response:', text);
            throw new Error('A IA retornou um formato inválido. Tente novamente.');
        }

        // 6. Aplicar validações cruzadas e ajustes automáticos pós-IA
        if (validationRules) {
            // Exemplo: Limite de cenas baseado na pressão narrativa
            if (output.suggestedScenes && output.narrativePressure) {
                const pressure = output.narrativePressure;
                let maxScenes = 15; // default

                if (pressure === 'FAST' && validationRules.maxScenesForFastPressure) {
                    maxScenes = validationRules.maxScenesForFastPressure;
                } else if (pressure === 'FLUID' && validationRules.maxScenesForFluidPressure) {
                    maxScenes = validationRules.maxScenesForFluidPressure;
                } else if (pressure === 'SLOW' && validationRules.maxScenesForSlowPressure) {
                    maxScenes = validationRules.maxScenesForSlowPressure;
                }

                if (output.suggestedScenes > maxScenes) {
                    const oldVal = output.suggestedScenes;
                    output.suggestedScenes = maxScenes;
                    adjustments.push(`Número de cenas reduzido para ${maxScenes} (máximo para pressão ${pressure.toLowerCase()}).`);
                }
            }

            // Aplicar sentenceMaxWords baseado na pressão
            if (output.narrativePressure && validationRules.sentenceMaxWords) {
                const pressure = output.narrativePressure;
                if (validationRules.sentenceMaxWords[pressure]) {
                    output.sentenceMaxWords = validationRules.sentenceMaxWords[pressure];
                }
            }
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
