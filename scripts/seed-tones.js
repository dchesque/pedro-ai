
const { PrismaClient } = require('../prisma/generated/client_final');

// Patch localhost to 127.0.0.1 for Node 18+ to ensure IPv4
if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const systemTones = [
    {
        name: "Dramático",
        icon: "🎭",
        description: "Tensão, suspense e emoção intensa",
        promptFragment: "Crie tensão progressiva, use pausas dramáticas, construa clímax emocional.",
    },
    {
        name: "Humorístico",
        icon: "😄",
        description: "Leve, divertido com piadas",
        promptFragment: "Use humor inteligente, timing cômico, trocadilhos quando apropriado.",
    },
    {
        name: "Inspirador",
        icon: "✨",
        description: "Motivacional e edificante",
        promptFragment: "Transmita esperança, use histórias de superação, termine com mensagem positiva.",
    },
    {
        name: "Educacional",
        icon: "📚",
        description: "Didático e informativo",
        promptFragment: "Explique conceitos claramente, use analogias, divida em partes digestíveis.",
    },
    {
        name: "Misterioso",
        icon: "🔮",
        description: "Intrigante e enigmático",
        promptFragment: "Crie curiosidade, revele informações gradualmente, mantenha suspense.",
    },
    {
        name: "Urgente",
        icon: "⚡",
        description: "Senso de urgência e importância",
        promptFragment: "Use linguagem direta, enfatize consequências, crie senso de 'agora'.",
    },
    {
        name: "Nostálgico",
        icon: "🕰️",
        description: "Saudosista e emotivo",
        promptFragment: "Evoque memórias, use referências ao passado, tom melancólico positivo.",
    },
    {
        name: "Provocativo",
        icon: "🔥",
        description: "Desafiador e questionador",
        promptFragment: "Questione status quo, provoque reflexão, seja ousado nas afirmações.",
    },
    {
        name: "Acolhedor",
        icon: "🤗",
        description: "Caloroso e empático",
        promptFragment: "Use linguagem inclusiva, demonstre compreensão, crie conexão pessoal.",
    },
    {
        name: "Épico",
        icon: "⚔️",
        description: "Grandioso e cinematográfico",
        promptFragment: "Use linguagem grandiosa, construa momentos épicos, escala crescente.",
    },
    {
        name: "Minimalista",
        icon: "◽",
        description: "Direto e objetivo",
        promptFragment: "Seja conciso, elimine excesso, vá direto ao ponto essencial.",
    },
    {
        name: "Científico",
        icon: "🔬",
        description: "Baseado em dados e fatos",
        promptFragment: "Cite estudos/dados, seja preciso, mantenha objetividade.",
    },
    {
        name: "Conversacional",
        icon: "💬",
        description: "Informal como bate-papo",
        promptFragment: "Fale como amigo, use 'você', seja natural e espontâneo.",
    },
    {
        name: "Polêmico",
        icon: "💥",
        description: "Controverso e debatedor",
        promptFragment: "Apresente múltiplos lados, gere debate, não tenha medo de controvérsia.",
    },
    {
        name: "Romântico",
        icon: "💕",
        description: "Emotivo e apaixonado",
        promptFragment: "Use linguagem poética, evoque sentimentos, crie atmosfera íntima.",
    },
];

async function run() {
    console.log('🌱 Seeding System Tones...');
    for (const tone of systemTones) {
        const existing = await prisma.tone.findFirst({
            where: {
                name: tone.name,
                isSystem: true
            }
        });

        if (existing) {
            console.log(`Updated: ${tone.name}`);
            await prisma.tone.update({
                where: { id: existing.id },
                data: tone
            });
        } else {
            console.log(`Created: ${tone.name}`);
            await prisma.tone.create({
                data: {
                    ...tone,
                    isSystem: true
                }
            });
        }
    }
    console.log('✅ Seeding completed.');
}

run()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
