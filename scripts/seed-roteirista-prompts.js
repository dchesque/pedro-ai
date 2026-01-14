const { PrismaClient } = require('../prisma/generated/client_final');
const db = new PrismaClient();

const prompts = [
    {
        key: 'roteirista.assist.improve',
        description: 'Melhorar Texto',
        module: 'roteirista',
        template: `Melhore este texto, tornando-o mais envolvente e bem escrito.
Mantenha a mesma ideia e tamanho aproximado.
Preserve o tom e estilo original.`
    },
    {
        key: 'roteirista.assist.expand',
        description: 'Expandir Texto',
        module: 'roteirista',
        template: `Expanda este texto com mais detalhes, descrições e profundidade.
Aumente o tamanho em 2-3x mantendo a qualidade.
Adicione elementos narrativos que enriqueçam a história.`
    },
    {
        key: 'roteirista.assist.rewrite',
        description: 'Reescrever Texto',
        module: 'roteirista',
        template: `Reescreva este texto completamente de forma criativa e original.
Mantenha a mesma ideia central mas com abordagem diferente.
Explore novas formas de expressar o mesmo conceito.`
    },
    {
        key: 'roteirista.assist.summarize',
        description: 'Resumir Texto',
        module: 'roteirista',
        template: `Resuma este texto de forma concisa, mantendo apenas os pontos essenciais.
Preserve a essência da mensagem em menos palavras.`
    },
    {
        key: 'roteirista.assist.translate',
        description: 'Traduzir para Inglês',
        module: 'roteirista',
        template: `Traduza este texto para inglês de forma otimizada para geração de imagem com IA (Flux, Stable Diffusion).
Use termos descritivos visuais.
Mantenha a estrutura de prompt de imagem.`
    },
    {
        key: 'roteirista.context.title',
        description: 'Contexto de Título',
        module: 'roteirista',
        template: `Este é um título de vídeo curto (short/reel).
Deve ser chamativo, curto e gerar curiosidade.
Evite títulos genéricos ou clickbait exagerado.`
    },
    {
        key: 'roteirista.context.synopsis',
        description: 'Contexto de Sinopse',
        module: 'roteirista',
        template: `Esta é a sinopse/descrição narrativa de uma história para vídeo.

REGRAS OBRIGATÓRIAS:
- Descreva a história de forma fluida e narrativa
- NÃO mencione número de cenas
- NÃO estruture em "Cena 1", "Cena 2", etc.
- NÃO mencione duração, tempo ou segundos
- NÃO use formato de roteiro técnico
- NÃO numere partes ou seções
- FOQUE na jornada emocional e narrativa dos personagens
- Conte a história como um resumo de livro, não como roteiro

A sinopse será usada como INPUT para um sistema separado que criará as cenas automaticamente.
Seu trabalho é apenas descrever O QUE acontece, não COMO será filmado.`
    },
    {
        key: 'roteirista.context.narration',
        description: 'Contexto de Narração',
        module: 'roteirista',
        template: `Esta é a narração de uma cena de vídeo curto.
Deve ser concisa, impactante e adequada para narração em voz.
Considere que será lida em voz alta em poucos segundos.`
    },
    {
        key: 'roteirista.context.visualPrompt',
        description: 'Contexto de Prompt Visual',
        module: 'roteirista',
        template: `Este é um prompt para geração de imagem com IA.
Deve ser descritivo, visual e em inglês.
Inclua: sujeito, ação, ambiente, iluminação, estilo artístico.`
    },
    {
        key: 'roteirista.titles.system',
        description: 'Sistema de Títulos',
        module: 'roteirista',
        template: `Você é um especialista em criar títulos virais para vídeos curtos (shorts/reels/TikTok).

Crie títulos que:
- Gerem curiosidade imediata
- Sejam curtos (máximo 60 caracteres)
- Usem gatilhos emocionais
- Sejam adequados ao tom/clima especificado
- Evitem clickbait exagerado ou enganoso

Responda APENAS com um JSON: { "titles": ["título1", "título2", "título3"] }`
    },
    {
        key: 'roteirista.titles.user',
        description: 'Prompt de Títulos',
        module: 'roteirista',
        template: `Crie 3 títulos para um vídeo sobre:

TEMA: {{theme}}
{{#if style}}ESTILO: {{style}}{{/if}}
{{#if tone}}TOM: {{tone}}{{/if}}

Os títulos devem ser únicos e criativos.`
    },
    {
        key: 'roteirista.visual.system',
        description: 'Sistema de Prompt Visual',
        module: 'roteirista',
        template: `Você é um especialista em criar prompts para geração de imagens com IA (Flux, Stable Diffusion, Midjourney).

Sua tarefa é converter uma narração de cena em um prompt visual detalhado em INGLÊS.

O prompt DEVE incluir:
1. Descrição clara do sujeito/personagem e sua ação
2. Ambiente e cenário detalhado
3. Iluminação e atmosfera emocional
4. Ângulo de câmera sugerido
5. Estilo artístico consistente

O prompt deve refletir:
- O estado emocional do clima narrativo
- A pressão narrativa (calmo vs urgente)
- O formato do vídeo (vertical 9:16 para shorts/reels)

{{#if stylePrompt}}ESTILO BASE: {{stylePrompt}}{{/if}}
{{#if characterDescriptions}}PERSONAGENS: {{characterDescriptions}}{{/if}}
{{#if tone}}TOM/CLIMA: {{tone}}{{/if}}

Responda APENAS com o prompt em inglês, sem explicações.`
    }
];

async function main() {
    console.log('Seeding Roteirista Prompts...');

    for (const prompt of prompts) {
        await db.systemPrompt.upsert({
            where: { key: prompt.key },
            update: {
                template: prompt.template,
                description: prompt.description,
                module: prompt.module
            },
            create: {
                key: prompt.key,
                template: prompt.template,
                description: prompt.description,
                module: prompt.module
            }
        });
        console.log(`Upserted: ${prompt.key}`);
    }

    console.log('Done.');
}

main()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
