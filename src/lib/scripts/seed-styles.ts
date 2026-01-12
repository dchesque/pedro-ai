
import { db } from '../db'
import { DEFAULT_STYLES } from '../agents/defaults'

async function seed() {
    console.log('Seeding styles...')

    for (const style of DEFAULT_STYLES) {
        const existing = await db.style.findFirst({
            where: { name: style.name, userId: null }
        })

        if (!existing) {
            await db.style.create({
                data: {
                    name: style.name,
                    description: style.description,
                    icon: style.icon,
                    contentType: 'story',
                    scriptwriterPrompt: style.scriptwriterPrompt,
                    visualPrompt: style.visualStyle,
                    isDefault: style.key === 'engaging',
                    isPublic: true,
                    userId: null
                }
            })
            console.log(`Created style: ${style.name}`)
        } else {
            console.log(`Style already exists: ${style.name}`)
        }
    }

    console.log('Seed finished.')
}

seed()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
