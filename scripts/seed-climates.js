const { PrismaClient } = require('../prisma/generated/client_final')
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando Seed de Climas v2.0...')

    const systemClimates = [
        {
            name: "Curiosidade & Mistério",
            icon: "🕵️",
            description: "Ideal para fatos curiosos e revelações intrigantes.",
            emotionalState: "CURIOSITY",
            revelationDynamic: "PROGRESSIVE",
            narrativePressure: "FLUID",
            minScenes: 5,
            isSystem: true
        },
        {
            name: "Épico & Inspirador",
            icon: "🦸",
            description: "Grandiosidade, motivação e impacto visual.",
            emotionalState: "DARK_INSPIRATION",
            revelationDynamic: "EARLY",
            narrativePressure: "FAST",
            minScenes: 5,
            isSystem: true
        },
        {
            name: "Tensão & Drama",
            icon: "🎭",
            description: "Conflito, suspense e emoção intensa.",
            emotionalState: "THREAT",
            revelationDynamic: "HIDDEN",
            narrativePressure: "FAST",
            minScenes: 7,
            isSystem: true
        }
    ]

    for (const climate of systemClimates) {
        // Busca manual para evitar dependência de constraint de unicidade não aplicada
        const existing = await prisma.climate.findFirst({
            where: { name: climate.name, userId: null }
        })

        if (existing) {
            await prisma.climate.update({
                where: { id: existing.id },
                data: climate
            })
            console.log(`- Atualizado: ${climate.name}`)
        } else {
            await prisma.climate.create({
                data: climate
            })
            console.log(`- Criado: ${climate.name}`)
        }
    }

    console.log('✅ Seed de Climas concluído!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
