const { PrismaClient } = require('../prisma/generated/client_final');
const db = new PrismaClient();

const MODULE_MAPPING = {
    // Roteirista
    'roteirista.assist.improve': 'roteirista',
    'roteirista.assist.expand': 'roteirista',
    'roteirista.assist.rewrite': 'roteirista',
    'roteirista.assist.summarize': 'roteirista',
    'roteirista.assist.translate': 'roteirista',
    'roteirista.context.title': 'roteirista',
    'roteirista.context.synopsis': 'roteirista',
    'roteirista.context.narration': 'roteirista',
    'roteirista.context.visualPrompt': 'roteirista',
    'roteirista.titles.system': 'roteirista',
    'roteirista.titles.user': 'roteirista',
    'roteirista.visual.system': 'roteirista',

    // Climas
    'climate.improve.description': 'climas',
    'climate.improve.instructions': 'climas',
    'climate.improve.preview': 'climas',

    // Estilos
    'style.cta.suggestion': 'estilos',
    'style.hook.suggestion': 'estilos',
    'style.visual.refinement': 'estilos',
};

async function updatePromptModules() {
    console.log('Updating modules based on key mapping...');

    for (const [key, moduleName] of Object.entries(MODULE_MAPPING)) {
        // Check if exists first to avoid errors if key not found (though updateMany handles 0 matches)
        const result = await db.systemPrompt.updateMany({
            where: { key },
            data: { module: moduleName }
        });
        if (result.count > 0) {
            console.log(`Updated ${key} -> ${moduleName}`);
        }
    }

    console.log('Updating based on prefixes...');

    // Atualizar baseado em prefixo para novos prompts
    await db.systemPrompt.updateMany({
        where: {
            key: { startsWith: 'roteirista.' },
            module: 'geral'
        },
        data: { module: 'roteirista' }
    });

    await db.systemPrompt.updateMany({
        where: {
            key: { startsWith: 'climate.' },
            module: 'geral' // Note: If current module ends up being something else, this where clause might miss. 
            // But assuming 'geral' or null specific handling if needed. 
            // Actually, currently module is just String without default in prisma schema, 
            // so it might be whatever was set or undefined if not set.
            // But since we are setting it, let's just update all climate.* that are not 'climas' yet.
        },
        data: { module: 'climas' }
    });

    await db.systemPrompt.updateMany({
        where: {
            key: { startsWith: 'style.' },
            module: 'geral'
        },
        data: { module: 'estilos' }
    });

    // Fallback for nulls or empty strings if any (though schema says required String)
    // If there are records where module is empty string or some other placeholder

    console.log('Done!');
}

updatePromptModules()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
