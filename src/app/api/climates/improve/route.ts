import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { getDefaultModel } from '@/lib/ai/model-resolver';

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
        const systemPrompt = getSystemPromptForField(field, climateContext);
        const userPrompt = field === 'preview'
            ? 'Gere o preview comportamental baseado no contexto fornecido.'
            : `Melhore o seguinte texto:\n\n${currentText}`;

        // Resolver modelo (usar 'ai_chat' como fallback para texto geral)
        // O prompt pedia 'text' mas usamos 'ai_chat' pois é a feature key existente mais adequada
        const modelId = await getDefaultModel('ai_chat');

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY!,
        });

        const { text } = await generateText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            maxTokens: 500,
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

function getSystemPromptForField(
    field: string,
    ctx: ImproveClimateTextRequest['climateContext']
): string {
    const globalRule = `
REGRA GLOBAL INVIOLÁVEL:
Em nenhuma circunstância altere:
- Estado emocional base: ${ctx.emotionalState}
- Dinâmica de revelação: ${ctx.revelationDynamic}
- Ritmo narrativo: ${ctx.narrativePressure}

Se o texto do usuário entrar em conflito com essas definições, apenas ajuste a forma, não o conteúdo.
`;

    switch (field) {
        case 'description':
            return `Você é um assistente especializado em melhorar textos de descrição de climas narrativos.

${globalRule}

TAREFA:
Melhore o texto tornando-o mais claro, objetivo e fácil de entender.

REGRAS ESPECÍFICAS:
- NÃO adicione novas ideias.
- NÃO mude a intenção original.
- NÃO altere o estado emocional, ritmo ou dinâmica do clima.
- Apenas reescreva para maior clareza e organização.

OBJETIVO:
Gerar uma descrição curta que ajude o usuário a lembrar QUANDO usar este clima.

FORMATO DE SAÍDA:
1 a 2 frases curtas. Responda APENAS com o texto melhorado, sem explicações.`;

        case 'instructions':
            return `Você é um assistente especializado em criar instruções para agentes de IA.

${globalRule}

TAREFA:
Reescreva o texto para transformá-lo em instruções práticas, claras e executáveis para um agente de IA.

REGRAS OBRIGATÓRIAS:
- NÃO crie novas intenções.
- NÃO altere o objetivo original do texto.
- NÃO contradiga o estado emocional, a dinâmica de revelação ou o ritmo já definidos.
- NÃO adicione termos genéricos como "seja criativo", "crie curiosidade", "use storytelling".

O QUE VOCÊ PODE FAZER:
- Tornar frases mais claras.
- Remover ambiguidades.
- Transformar ideias vagas em instruções objetivas.
- Simplificar sem perder significado.

FORMATO FINAL:
- Frases curtas.
- Tom técnico e direto.
- Instruções explícitas.

Responda APENAS com o texto melhorado, sem explicações.`;

        case 'preview':
            return `Você é um assistente especializado em sintetizar comportamentos de climas narrativos.

CONTEXTO DO CLIMA:
- Nome: ${ctx.name}
- Estado Emocional: ${ctx.emotionalState}
- Dinâmica de Revelação: ${ctx.revelationDynamic}
- Pressão Narrativa: ${ctx.narrativePressure}
- Descrição: ${ctx.description || 'Não definida'}
- Instruções: ${ctx.instructions || 'Não definidas'}

TAREFA:
Gere um resumo comportamental curto com base nas configurações já definidas.

REGRAS:
- NÃO invente comportamentos.
- NÃO mude emoção, ritmo ou revelação.
- Apenas sintetize o comportamento esperado.

FORMATO DE SAÍDA:
- Palavras-chave curtas separadas por vírgula
- Máximo de 3 a 4 itens
- Linguagem técnica
- Use CAPS para destaque

EXEMPLO DE SAÍDA:
SHOCK, CTA_DIRECT, MAX_15_WORDS_PER_SENTENCE

Responda APENAS com as palavras-chave, sem explicações.`;

        default:
            throw new Error(`Campo não suportado: ${field}`);
    }
}
