
import { db } from '../db'

async function migrate() {
    console.log('--- MIGRATION START ---')

    // 1. Migrar UserStyles
    console.log('Migrating UserStyles...')
    const userStyles: any[] = await db.$queryRawUnsafe('SELECT * FROM "UserStyle"')
    for (const us of userStyles) {
        // Verificar se já existe (por chave ou ID se possível, mas ID vai mudar se eu usar create)
        // Usaremos o ID original se quisermos manter referências, mas o Style usa CUID também.
        // Melhor inserir novos e se o ID conflitar, a gente ignora ou atualiza.

        await db.$executeRawUnsafe(`
            INSERT INTO "Style" (
                "id", "userId", "name", "description", "icon", 
                "scriptwriterPrompt", "visualPrompt", "isPublic", "isDefault",
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) ON CONFLICT (id) DO NOTHING
        `,
            us.id, us.userId, us.name, us.description, us.icon,
            us.scriptwriterPrompt, us.visualStyle, false, false,
            us.createdAt, us.updatedAt
        )
        console.log(`Migrated UserStyle: ${us.name}`)
    }

    // 2. Migrar GlobalStyles
    console.log('Migrating GlobalStyles...')
    const globalStyles: any[] = await db.$queryRawUnsafe('SELECT * FROM "GlobalStyle"')
    for (const gs of globalStyles) {
        await db.$executeRawUnsafe(`
            INSERT INTO "Style" (
                "id", "userId", "name", "description", "icon", 
                "scriptwriterPrompt", "visualPrompt", "isPublic", "isDefault",
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) ON CONFLICT (id) DO NOTHING
        `,
            gs.id, null, gs.name, gs.description, gs.icon,
            gs.scriptwriterPrompt, gs.visualStyle, true, false,
            gs.createdAt, gs.updatedAt
        )
        console.log(`Migrated GlobalStyle: ${gs.name}`)
    }

    console.log('--- MIGRATION FINISHED ---')
}

migrate()
    .catch(console.error)
    .finally(() => db.$disconnect())
