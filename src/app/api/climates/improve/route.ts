import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { getDefaultModel } from '@/lib/ai/model-resolver';
import { getSystemPrompt } from '@/lib/system-prompts';
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config';

interface ImproveClimateTextRequest {
    field: 'description' | 'instructions' | 'preview';
    currentText: string;
    climateContext: {
        // Dados do Step 1
        name: string;
        emotionalState: string;      // EmotionalState enum
        revelationDynamic: string;   // RevelationDynamic enum
        narrativePressure: string;   // NarrativePressure enum

        // Dados do Step 3 (campos já preenchidos)
        description?: string;
        instructions?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: ImproveClimateTextRequest = await request.json();
        const { field, currentText, climateContext } = body;

        // Validação
        if (!field || !climateContext) {
            return NextResponse.json(
                { error: 'Campo e contexto são obrigatórios' },
                { status: 400 }
            );
        }

        // Para preview, não precisa de currentText
        if (field !== 'preview' && !currentText?.trim()) {
            return NextResponse.json(
                { error: 'Texto atual é obrigatório para melhorar' },
                { status: 400 }
            );
        }

        // Selecionar prompt baseado no campo
        const systemPrompt = await getDynamicSystemPromptForField(field, climateContext, currentText);
        const userPrompt = field === 'preview'
            ? 'Gere o preview comportamental baseado no contexto fornecido.'
            : `Melhore o seguinte texto:\n\n${currentText}`;

        // Resolver modelo (usar 'system_prompts' como configurado no admin)
        const modelId = await getDefaultModel('system_prompts');

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY!,
        });

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.3, // Baixa temperatura para consistência
        });

        return NextResponse.json({
            improvedText: text.trim(),
            field,
        });

    } catch (error) {
        console.error('[IMPROVE_CLIMATE_TEXT]', error);
        return NextResponse.json(
            { error: 'Erro ao processar texto' },
            { status: 500 }
        );
    }
}

async function getDynamicSystemPromptForField(
    field: string,
    ctx: ImproveClimateTextRequest['climateContext'],
    currentText: string = ''
): Promise<string> {
    const globalRule = `
REGRA GLOBAL INVIOLÁVEL:
Em nenhuma circunstância altere:
- Estado emocional base: ${ctx.emotionalState}
- Dinâmica de revelação: ${ctx.revelationDynamic}
- Ritmo narrativo: ${ctx.narrativePressure}

Se o texto do usuário entrar em conflito com essas definições, apenas ajuste a forma, não o conteúdo.
`;

    let configKey = '';
    switch (field) {
        case 'description': configKey = 'CLIMATE_IMPROVE_DESCRIPTION'; break;
        case 'instructions': configKey = 'CLIMATE_IMPROVE_INSTRUCTIONS'; break;
        case 'preview': configKey = 'CLIMATE_IMPROVE_PREVIEW'; break;
        default: throw new Error(`Campo não suportado: ${field}`);
    }

    const config = SYSTEM_PROMPTS_CONFIG.find(c => c.key === configKey)!;
    const template = await getSystemPrompt(config.key, config.defaultTemplate);

    const climateContextStr = `
- Nome: ${ctx.name}
- Estado Emocional: ${ctx.emotionalState}
- Dinâmica de Revelação: ${ctx.revelationDynamic}
- Pressão Narrativa: ${ctx.narrativePressure}
- Descrição: ${ctx.description || 'Não definida'}
- Instruções: ${ctx.instructions || 'Não definidas'}
    `.trim();

    return template
        .replace('{{GLOBAL_RULE}}', globalRule)
        .replace('{{CLIMATE_CONTEXT}}', climateContextStr)
        .replace('{{CURRENT_TEXT}}', currentText);
}
